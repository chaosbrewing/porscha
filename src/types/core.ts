/**
 * Core domain types for porscha.today.
 *
 * The public/private boundary lives in these types: `PublicProjectView`
 * is the ONLY project shape a public client ever receives, and it is
 * produced exclusively by the transformers in
 * `src/server/projects/transformers.ts`.
 */

export type ProjectType = "app" | "experiment" | "art" | "other";

export type ProjectStatus =
  | "building"
  | "active"
  | "experimenting"
  | "quiet"
  | "paused"
  | "shipped"
  | "archived";

/** Which GitHub-derived signals a project exposes on the public site. */
export type ProjectVisibility = {
  lastActivity: boolean;
  releases: boolean;
  progress: boolean;
  milestones: boolean;
  issueCounts: boolean;
  pullRequestCounts: boolean;
  ciSummary: boolean;
};

export type MilestoneConfig = {
  slug: string;
  title: string;
  /** Optional public one-liner. Never derived from private issue titles. */
  publicSummary?: string;
  workItems: Array<{
    title: string;
    done: boolean;
    /** Optional GitHub issue number this item tracks. */
    githubIssue?: number;
  }>;
};

export type ProjectConfig = {
  slug: string;
  name: string;
  description: string;
  type: ProjectType;
  status: ProjectStatus;

  github?: {
    /** "owner/repo" */
    repository: string;
    /** True only if the repository itself is public on GitHub. */
    publicRepository: boolean;
  };

  visibility: ProjectVisibility;

  /** Featured on the homepage workbench section. */
  featured?: boolean;
  /** Show in /apps (product-oriented view). */
  isApp?: boolean;
  /** Explicitly approved public links. */
  links?: Array<{ label: string; url: string }>;
  /** Current milestone slug (from `milestones`). */
  currentMilestone?: string;
  milestones?: MilestoneConfig[];
};

export type ActivityType =
  | "push"
  | "pull_request_opened"
  | "pull_request_merged"
  | "pull_request_closed"
  | "issue_opened"
  | "issue_closed"
  | "workflow_started"
  | "workflow_passed"
  | "workflow_failed"
  | "release_published";

export type ProjectActivity = {
  id: string;
  projectId: string;
  type: ActivityType;
  occurredAt: string;
  /** Safe-for-public one-liner, e.g. "Development activity". */
  publicSummary?: string;
  /** Full detail. NEVER serialized into a public response. */
  privatePayload?: unknown;
};

export type CiStatus = "passing" | "failing" | "pending" | "none" | "unknown";

/** Normalized repository state persisted per project. */
export type SnapshotData = {
  repoFullName?: string;
  defaultBranch?: string;
  isArchived?: boolean;
  openIssueCount?: number;
  openPullRequestCount?: number;
  ciStatus?: CiStatus;
  lastPushedAt?: string | null;
  latestRelease?: { tag: string; name: string | null; publishedAt: string } | null;
  /** Private detail for the console. Never exposed publicly. */
  private?: {
    openPullRequests?: Array<{
      number: number;
      title: string;
      author: string | null;
      updatedAt: string;
      draft: boolean;
      url: string;
    }>;
    recentCommits?: Array<{
      sha: string;
      message: string;
      author: string | null;
      committedAt: string | null;
      url: string;
    }>;
    openIssues?: Array<{
      number: number;
      title: string;
      updatedAt: string;
      url: string;
    }>;
    activeBranches?: string[];
    lastWorkflow?: {
      name: string;
      conclusion: string | null;
      status: string;
      branch: string | null;
      url: string;
      updatedAt: string;
    } | null;
  };
};

export type MilestoneProgress = {
  slug: string;
  title: string;
  publicSummary?: string;
  done: number;
  total: number;
  /** null when there are no scoped work items — show "Active development". */
  percent: number | null;
  isCurrent: boolean;
};

/* ------------------------------------------------------------------ */
/* Public DTOs — the only project data a public client may receive.    */
/* ------------------------------------------------------------------ */

export type PublicProjectView = {
  slug: string;
  name: string;
  description: string;
  type: ProjectType;
  status: ProjectStatus;
  /** Only present when visibility.lastActivity is on. Coarse timestamp only. */
  lastPublicActivityAt?: string | null;
  /** Human summary like "Development activity this week". */
  activitySignal?: string | null;
  /** Only when visibility.milestones is on. */
  currentMilestone?: { title: string; publicSummary?: string } | null;
  /** Only when visibility.progress is on and scoped work items exist. */
  progress?: { done: number; total: number; percent: number } | null;
  /** Only when visibility.releases is on. */
  latestRelease?: { tag: string; publishedAt: string } | null;
  /** Only for explicitly public repositories. */
  repositoryUrl?: string | null;
  links?: Array<{ label: string; url: string }>;
  featured: boolean;
  isApp: boolean;
};

/* ------------------------------------------------------------------ */
/* Private DTOs — console only, behind server-side authorization.      */
/* ------------------------------------------------------------------ */

export type AttentionKind =
  | "ci_failing"
  | "pr_awaiting_review"
  | "stale_pr"
  | "milestone_stalled"
  | "repo_inactive"
  | "sync_failed";

export type AttentionItem = {
  kind: AttentionKind;
  projectSlug: string;
  projectName: string;
  message: string;
  url?: string;
  since?: string;
};

export type PrivateProjectView = {
  slug: string;
  name: string;
  description: string;
  type: ProjectType;
  status: ProjectStatus;
  repository?: string;
  repositoryUrl?: string;
  defaultBranch?: string;
  isArchived: boolean;
  ciStatus: CiStatus;
  openIssueCount: number;
  openPullRequestCount: number;
  lastActivityAt: string | null;
  latestRelease: { tag: string; name: string | null; publishedAt: string } | null;
  currentMilestone: MilestoneProgress | null;
  milestones: MilestoneProgress[];
  attention: AttentionItem[];
  snapshotUpdatedAt: string | null;
  snapshotStale: boolean;
  detail?: NonNullable<SnapshotData["private"]>;
};

export type ConsoleOverview = {
  greetingName: string;
  counts: { active: number; needsAttention: number; quiet: number };
  projects: PrivateProjectView[];
  attention: AttentionItem[];
  generatedAt: string;
};

export type ActivityFeedItem = {
  id: string;
  projectSlug: string;
  projectName: string;
  type: ActivityType;
  occurredAt: string;
  summary: string;
};
