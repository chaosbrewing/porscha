import type {
  AttentionItem,
  MilestoneProgress,
  ProjectStatus,
  ProjectType,
  ProjectVisibility,
  PublicProjectView,
  PrivateProjectView,
  SnapshotData,
} from "@/types/core";
import { coarseActivitySignal } from "@/lib/dates";

/**
 * The public/private data boundary.
 *
 * `toPublicProjectView` is the ONLY way project data reaches a public
 * client. It is an allowlist: every field is built up explicitly from
 * data a visibility flag has approved, and nothing from the snapshot's
 * `private` section is ever read here. There is deliberately no spread
 * of the source objects anywhere in this file's public path.
 */

export type ProjectRecord = {
  slug: string;
  name: string;
  description: string;
  type: ProjectType;
  status: ProjectStatus;
  featured: boolean;
  isApp: boolean;
  /** Whether the project appears on the public site at all. */
  isPublic: boolean;
  visibility: ProjectVisibility;
  links: Array<{ label: string; url: string }> | null;
  currentMilestone: string | null;
  repoFullName: string | null;
  publicRepository: boolean;
  lastSyncError: string | null;
};

export function toPublicProjectView(
  project: ProjectRecord,
  snapshot: SnapshotData | null,
  milestones: MilestoneProgress[],
): PublicProjectView {
  const v = project.visibility;

  const view: PublicProjectView = {
    slug: project.slug,
    name: project.name,
    description: project.description,
    type: project.type,
    status: project.status,
    featured: project.featured,
    isApp: project.isApp,
    links: project.links ?? undefined,
  };

  if (v.lastActivity) {
    const last = snapshot?.lastPushedAt ?? null;
    view.lastPublicActivityAt = last;
    view.activitySignal = coarseActivitySignal(last);
  }

  if (v.milestones) {
    const current = milestones.find((m) => m.isCurrent);
    view.currentMilestone = current
      ? { title: current.title, publicSummary: current.publicSummary }
      : null;
  }

  if (v.progress) {
    const current = milestones.find((m) => m.isCurrent);
    view.progress =
      current && current.percent !== null
        ? { done: current.done, total: current.total, percent: current.percent }
        : null;
  }

  if (v.releases && snapshot?.latestRelease) {
    view.latestRelease = {
      tag: snapshot.latestRelease.tag,
      publishedAt: snapshot.latestRelease.publishedAt,
    };
  }

  // Repository URL only for repositories explicitly marked public.
  if (project.repoFullName && project.publicRepository) {
    view.repositoryUrl = `https://github.com/${project.repoFullName}`;
  }

  return view;
}

export function toPrivateProjectView(
  project: ProjectRecord,
  snapshot: SnapshotData | null,
  snapshotUpdatedAt: string | null,
  milestones: MilestoneProgress[],
  attention: AttentionItem[],
  staleMinutes: number,
  includeDetail = false,
): PrivateProjectView {
  const current = milestones.find((m) => m.isCurrent) ?? null;
  const stale =
    project.repoFullName !== null &&
    (snapshotUpdatedAt === null ||
      Date.now() - new Date(snapshotUpdatedAt).getTime() >
        staleMinutes * 60_000);

  const view: PrivateProjectView = {
    slug: project.slug,
    name: project.name,
    description: project.description,
    type: project.type,
    status: project.status,
    repository: project.repoFullName ?? undefined,
    repositoryUrl: project.repoFullName
      ? `https://github.com/${project.repoFullName}`
      : undefined,
    defaultBranch: snapshot?.defaultBranch,
    isArchived: snapshot?.isArchived ?? false,
    ciStatus: snapshot?.ciStatus ?? (project.repoFullName ? "unknown" : "none"),
    openIssueCount: snapshot?.openIssueCount ?? 0,
    openPullRequestCount: snapshot?.openPullRequestCount ?? 0,
    lastActivityAt: snapshot?.lastPushedAt ?? null,
    latestRelease: snapshot?.latestRelease ?? null,
    currentMilestone: current,
    milestones,
    attention,
    snapshotUpdatedAt,
    snapshotStale: stale,
  };

  if (includeDetail && snapshot?.private) {
    view.detail = snapshot.private;
  }

  return view;
}
