import "server-only";
import { env } from "@/server/env";
import type { CiStatus, SnapshotData } from "@/types/core";
import { githubClient, GitHubApiError } from "./client";
import {
  loadProjectRows,
  replaceSnapshot,
  setSyncResult,
} from "@/server/projects/store";
import { publishRealtime } from "@/server/realtime/bus";

/**
 * Reconciliation sync: rebuilds a project's snapshot from the GitHub
 * REST API. This is the fallback for missed webhook events and the
 * initial population path — webhooks keep snapshots fresh in between.
 */

function ciStatusFromRuns(
  runs: Array<{ status: string; conclusion: string | null }>,
): CiStatus {
  if (runs.length === 0) return "none";
  const relevant = runs.find(
    (r) => r.conclusion !== "cancelled" && r.conclusion !== "skipped",
  );
  if (!relevant) return "none";
  if (relevant.status !== "completed") return "pending";
  return relevant.conclusion === "success" ? "passing" : "failing";
}

export async function syncProjectFromGitHub(
  projectSlug: string,
  repoFullName: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const repo = await githubClient.getRepo(repoFullName);

    // Archived repositories get a minimal snapshot; no need to hammer
    // the API for a repo that cannot change.
    if (repo.archived) {
      await replaceSnapshot(projectSlug, {
        repoFullName: repo.full_name,
        defaultBranch: repo.default_branch,
        isArchived: true,
        openIssueCount: 0,
        openPullRequestCount: 0,
        ciStatus: "none",
        lastPushedAt: repo.pushed_at,
        latestRelease: null,
      });
      await setSyncResult(projectSlug, null);
      publishRealtime({
        kind: "snapshot",
        projectSlug,
        at: new Date().toISOString(),
      });
      return { ok: true };
    }

    const [pulls, issues, runs, releases, commits, branches] =
      await Promise.all([
        githubClient.listOpenPulls(repoFullName),
        githubClient.listOpenIssues(repoFullName),
        githubClient.listRecentWorkflowRuns(repoFullName).catch(() => null),
        githubClient.listReleases(repoFullName).catch(() => []),
        githubClient
          .listRecentCommits(repoFullName, repo.default_branch)
          .catch(() => []),
        githubClient.listBranches(repoFullName).catch(() => []),
      ]);

    const realIssues = issues.filter((i) => !i.pull_request);
    const workflowRuns = runs?.workflow_runs ?? [];
    const latestRun = workflowRuns[0] ?? null;
    const latestRelease = releases[0] ?? null;

    const snapshot: SnapshotData = {
      repoFullName: repo.full_name,
      defaultBranch: repo.default_branch,
      isArchived: false,
      openIssueCount: realIssues.length,
      openPullRequestCount: pulls.length,
      ciStatus: ciStatusFromRuns(workflowRuns),
      lastPushedAt: repo.pushed_at,
      latestRelease: latestRelease?.published_at
        ? {
            tag: latestRelease.tag_name,
            name: latestRelease.name,
            publishedAt: latestRelease.published_at,
          }
        : null,
      private: {
        openPullRequests: pulls.map((p) => ({
          number: p.number,
          title: p.title,
          author: p.user?.login ?? null,
          updatedAt: p.updated_at,
          draft: p.draft,
          url: p.html_url,
        })),
        openIssues: realIssues.slice(0, 15).map((i) => ({
          number: i.number,
          title: i.title,
          updatedAt: i.updated_at,
          url: i.html_url,
        })),
        recentCommits: commits.map((c) => ({
          sha: c.sha.slice(0, 10),
          message: c.commit.message.split("\n")[0],
          author: c.author?.login ?? c.commit.author?.name ?? null,
          committedAt: c.commit.author?.date ?? null,
          url: c.html_url,
        })),
        activeBranches: branches.map((b) => b.name).slice(0, 15),
        lastWorkflow: latestRun
          ? {
              name: latestRun.name ?? "Workflow",
              conclusion: latestRun.conclusion,
              status: latestRun.status,
              branch: latestRun.head_branch,
              url: latestRun.html_url,
              updatedAt: latestRun.updated_at,
            }
          : null,
      },
    };

    await replaceSnapshot(projectSlug, snapshot);
    await setSyncResult(projectSlug, null);
    publishRealtime({
      kind: "snapshot",
      projectSlug,
      at: new Date().toISOString(),
    });
    return { ok: true };
  } catch (err) {
    const message =
      err instanceof GitHubApiError
        ? err.message
        : "Unexpected error contacting GitHub";
    // Keep the last good snapshot; record the failure for attention.
    await setSyncResult(projectSlug, message).catch(() => {});
    return { ok: false, error: message };
  }
}

/** Sync every registered project that has a GitHub connection. */
export async function syncAllProjects(): Promise<{
  synced: number;
  failed: number;
  skipped: boolean;
}> {
  if (!env.githubSyncConfigured) {
    return { synced: 0, failed: 0, skipped: true };
  }
  publishRealtime({
    kind: "sync",
    status: "started",
    at: new Date().toISOString(),
  });
  const rows = await loadProjectRows();
  let synced = 0;
  let failed = 0;
  for (const row of rows) {
    if (!row.connection) continue;
    const result = await syncProjectFromGitHub(
      row.project.slug,
      row.connection.repoFullName,
    );
    if (result.ok) synced += 1;
    else failed += 1;
  }
  publishRealtime({
    kind: "sync",
    status: failed > 0 ? "failed" : "finished",
    at: new Date().toISOString(),
  });
  return { synced, failed, skipped: false };
}
