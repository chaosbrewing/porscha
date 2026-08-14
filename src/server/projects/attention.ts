import type {
  AttentionItem,
  MilestoneProgress,
  ProjectStatus,
  SnapshotData,
} from "@/types/core";

/**
 * Attention derivation. Only genuinely actionable problems become
 * attention items — nothing is manufactured to make the console look
 * busy.
 */

const DAY_MS = 86_400_000;

export type AttentionInput = {
  slug: string;
  name: string;
  status: ProjectStatus;
  snapshot: SnapshotData | null;
  snapshotUpdatedAt: string | null;
  lastActivityAt: string | null;
  currentMilestone: MilestoneProgress | null;
  lastSyncError: string | null;
  hasGithub: boolean;
  now?: Date;
};

const STALE_PR_DAYS = 7;
const MILESTONE_STALL_DAYS = 21;
const INACTIVE_DAYS: Partial<Record<ProjectStatus, number>> = {
  building: 7,
  active: 14,
};

export function deriveAttention(input: AttentionInput): AttentionItem[] {
  const items: AttentionItem[] = [];
  const now = input.now ?? new Date();
  const { slug, name, snapshot, status } = input;

  // Paused/archived/quiet projects are allowed to be quiet.
  const restingStatus =
    status === "paused" || status === "archived" || status === "quiet";

  if (input.hasGithub && input.lastSyncError) {
    items.push({
      kind: "sync_failed",
      projectSlug: slug,
      projectName: name,
      message: `GitHub sync is failing: ${input.lastSyncError}`,
    });
  }

  if (snapshot?.ciStatus === "failing" && !restingStatus) {
    const wf = snapshot.private?.lastWorkflow;
    items.push({
      kind: "ci_failing",
      projectSlug: slug,
      projectName: name,
      message: wf
        ? `CI failing — ${wf.name}${wf.branch ? ` on ${wf.branch}` : ""}`
        : "CI is failing on the latest run",
      url: wf?.url,
      since: wf?.updatedAt,
    });
  }

  for (const pr of snapshot?.private?.openPullRequests ?? []) {
    if (pr.draft) continue;
    const ageDays = (now.getTime() - new Date(pr.updatedAt).getTime()) / DAY_MS;
    if (ageDays >= STALE_PR_DAYS) {
      items.push({
        kind: "stale_pr",
        projectSlug: slug,
        projectName: name,
        message: `PR #${pr.number} has been open without movement for ${Math.floor(ageDays)} days`,
        url: pr.url,
        since: pr.updatedAt,
      });
    } else {
      items.push({
        kind: "pr_awaiting_review",
        projectSlug: slug,
        projectName: name,
        message: `PR #${pr.number} is awaiting review`,
        url: pr.url,
        since: pr.updatedAt,
      });
    }
  }

  // Milestone stalled: a current milestone with work remaining, on a
  // project whose repo has gone silent for a long stretch.
  const m = input.currentMilestone;
  if (
    m &&
    m.total > 0 &&
    m.done < m.total &&
    !restingStatus &&
    input.lastActivityAt
  ) {
    const idleDays =
      (now.getTime() - new Date(input.lastActivityAt).getTime()) / DAY_MS;
    if (idleDays >= MILESTONE_STALL_DAYS) {
      items.push({
        kind: "milestone_stalled",
        projectSlug: slug,
        projectName: name,
        message: `Milestone “${m.title}” has work remaining but no repository activity in ${Math.floor(idleDays)} days`,
        since: input.lastActivityAt,
      });
    }
  }

  // Unexpected inactivity for projects that claim to be moving.
  const inactiveAfter = INACTIVE_DAYS[status];
  if (inactiveAfter && input.hasGithub && input.lastActivityAt) {
    const idleDays =
      (now.getTime() - new Date(input.lastActivityAt).getTime()) / DAY_MS;
    if (idleDays >= inactiveAfter) {
      items.push({
        kind: "repo_inactive",
        projectSlug: slug,
        projectName: name,
        message: `Marked “${status}” but the repository has been quiet for ${Math.floor(idleDays)} days`,
        since: input.lastActivityAt,
      });
    }
  }

  return items;
}
