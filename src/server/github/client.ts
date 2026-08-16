import "server-only";
import { env } from "@/server/env";

/**
 * Thin, typed GitHub REST client used by the reconciliation sync.
 * Server-only; the token never leaves this process. UI components never
 * import this — they read persisted snapshots through the project
 * service layer.
 */

const API = "https://api.github.com";

export class GitHubApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "GitHubApiError";
  }
}

async function gh<T>(path: string): Promise<T> {
  if (!env.GITHUB_TOKEN) {
    throw new GitHubApiError("GitHub sync is not configured", 0);
  }
  const res = await fetch(`${API}${path}`, {
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "porscha.today",
    },
    // Sync results are persisted; never cache at the fetch layer.
    cache: "no-store",
  });
  if (!res.ok) {
    throw new GitHubApiError(
      `GitHub API ${res.status} for ${path}`,
      res.status,
    );
  }
  return (await res.json()) as T;
}

export type RepoInfo = {
  full_name: string;
  default_branch: string;
  archived: boolean;
  pushed_at: string | null;
  open_issues_count: number;
  private: boolean;
};

export type PullInfo = {
  number: number;
  title: string;
  draft: boolean;
  updated_at: string;
  html_url: string;
  user: { login: string } | null;
};

export type IssueInfo = {
  number: number;
  title: string;
  updated_at: string;
  html_url: string;
  pull_request?: unknown;
};

export type WorkflowRunInfo = {
  name: string | null;
  status: string;
  conclusion: string | null;
  head_branch: string | null;
  html_url: string;
  updated_at: string;
};

export type ReleaseInfo = {
  tag_name: string;
  name: string | null;
  published_at: string | null;
};

export type CommitInfo = {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: { name?: string; date?: string } | null;
  };
  author: { login: string } | null;
};

export type BranchInfo = { name: string };

export type UserRepoInfo = {
  full_name: string;
  private: boolean;
  archived: boolean;
  pushed_at: string | null;
};

export const githubClient = {
  getRepo: (repo: string) => gh<RepoInfo>(`/repos/${repo}`),
  /** Repositories visible to the sync token, for the console picker. */
  listAccessibleRepos: () =>
    gh<UserRepoInfo[]>(
      `/user/repos?per_page=100&sort=pushed&affiliation=owner,collaborator,organization_member`,
    ),
  listOpenPulls: (repo: string) =>
    gh<PullInfo[]>(`/repos/${repo}/pulls?state=open&per_page=20`),
  listOpenIssues: (repo: string) =>
    gh<IssueInfo[]>(`/repos/${repo}/issues?state=open&per_page=30`),
  listRecentWorkflowRuns: (repo: string) =>
    gh<{ workflow_runs: WorkflowRunInfo[] }>(
      `/repos/${repo}/actions/runs?per_page=5`,
    ),
  listReleases: (repo: string) =>
    gh<ReleaseInfo[]>(`/repos/${repo}/releases?per_page=1`),
  listRecentCommits: (repo: string, branch: string) =>
    gh<CommitInfo[]>(
      `/repos/${repo}/commits?sha=${encodeURIComponent(branch)}&per_page=10`,
    ),
  listBranches: (repo: string) =>
    gh<BranchInfo[]>(`/repos/${repo}/branches?per_page=30`),
};
