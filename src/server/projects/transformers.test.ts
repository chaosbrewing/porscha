import { describe, expect, it } from "vitest";
import {
  toPublicProjectView,
  toPrivateProjectView,
  type ProjectRecord,
} from "./transformers";
import type { SnapshotData } from "@/types/core";
import { computeAllMilestones } from "./progress";

/**
 * The public/private boundary tests. If any of these fail, private
 * repository information could reach the public site — treat failures
 * here as release blockers.
 */

const SECRETS = [
  "SECRET-COMMIT-MESSAGE",
  "secret-branch",
  "secret-pr-title",
  "secret-issue-title",
  "secret-username",
  "chaosbrewing/private-repo",
];

const snapshot: SnapshotData = {
  repoFullName: "chaosbrewing/private-repo",
  defaultBranch: "secret-branch",
  isArchived: false,
  openIssueCount: 4,
  openPullRequestCount: 2,
  ciStatus: "failing",
  lastPushedAt: "2026-08-10T12:00:00.000Z",
  latestRelease: {
    tag: "v1.2.0",
    name: "Release name",
    publishedAt: "2026-08-01T00:00:00.000Z",
  },
  private: {
    openPullRequests: [
      {
        number: 7,
        title: "secret-pr-title",
        author: "secret-username",
        updatedAt: "2026-08-09T00:00:00.000Z",
        draft: false,
        url: "https://github.com/chaosbrewing/private-repo/pull/7",
      },
    ],
    openIssues: [
      {
        number: 3,
        title: "secret-issue-title",
        updatedAt: "2026-08-09T00:00:00.000Z",
        url: "https://github.com/chaosbrewing/private-repo/issues/3",
      },
    ],
    recentCommits: [
      {
        sha: "abc123",
        message: "SECRET-COMMIT-MESSAGE",
        author: "secret-username",
        committedAt: "2026-08-09T00:00:00.000Z",
        url: "https://github.com/chaosbrewing/private-repo/commit/abc123",
      },
    ],
    activeBranches: ["secret-branch"],
    lastWorkflow: null,
  },
};

function makeRecord(overrides: Partial<ProjectRecord> = {}): ProjectRecord {
  return {
    slug: "test",
    name: "Test",
    description: "A test project",
    type: "app",
    status: "building",
    featured: true,
    isApp: true,
    visibility: {
      lastActivity: true,
      releases: true,
      progress: true,
      milestones: true,
      issueCounts: false,
      pullRequestCounts: false,
      ciSummary: false,
    },
    links: null,
    currentMilestone: "m1",
    repoFullName: "chaosbrewing/private-repo",
    publicRepository: false,
    lastSyncError: null,
    ...overrides,
  };
}

const milestones = computeAllMilestones(
  [
    {
      slug: "m1",
      title: "First milestone",
      publicSummary: "Public summary",
      workItems: [{ done: true }, { done: false }],
    },
  ],
  "m1",
);

describe("toPublicProjectView", () => {
  it("never serializes private snapshot content", () => {
    const view = toPublicProjectView(makeRecord(), snapshot, milestones);
    const json = JSON.stringify(view);
    for (const secret of SECRETS) {
      expect(json).not.toContain(secret);
    }
    expect(json).not.toContain("private");
  });

  it("omits repository URL for private repositories", () => {
    const view = toPublicProjectView(makeRecord(), snapshot, milestones);
    expect(view.repositoryUrl).toBeUndefined();
  });

  it("includes repository URL only when the repo is explicitly public", () => {
    const view = toPublicProjectView(
      makeRecord({ publicRepository: true, repoFullName: "chaosbrewing/open" }),
      snapshot,
      milestones,
    );
    expect(view.repositoryUrl).toBe("https://github.com/chaosbrewing/open");
  });

  it("respects visibility flags when off", () => {
    const view = toPublicProjectView(
      makeRecord({
        visibility: {
          lastActivity: false,
          releases: false,
          progress: false,
          milestones: false,
          issueCounts: false,
          pullRequestCounts: false,
          ciSummary: false,
        },
      }),
      snapshot,
      milestones,
    );
    expect(view.lastPublicActivityAt).toBeUndefined();
    expect(view.activitySignal).toBeUndefined();
    expect(view.currentMilestone).toBeUndefined();
    expect(view.progress).toBeUndefined();
    expect(view.latestRelease).toBeUndefined();
  });

  it("exposes approved signals when flags are on", () => {
    const view = toPublicProjectView(makeRecord(), snapshot, milestones);
    expect(view.lastPublicActivityAt).toBe("2026-08-10T12:00:00.000Z");
    expect(view.currentMilestone).toEqual({
      title: "First milestone",
      publicSummary: "Public summary",
    });
    expect(view.progress).toEqual({ done: 1, total: 2, percent: 50 });
    expect(view.latestRelease).toEqual({
      tag: "v1.2.0",
      publishedAt: "2026-08-01T00:00:00.000Z",
    });
  });

  it("never exposes issue or PR counts publicly (not part of the DTO)", () => {
    const view = toPublicProjectView(makeRecord(), snapshot, milestones);
    const json = JSON.stringify(view);
    expect(json).not.toContain("openIssueCount");
    expect(json).not.toContain("openPullRequestCount");
    expect(json).not.toContain("ciStatus");
    expect(json).not.toContain("defaultBranch");
  });
});

describe("toPrivateProjectView", () => {
  it("includes operational data for the console", () => {
    const view = toPrivateProjectView(
      makeRecord(),
      snapshot,
      "2026-08-10T12:00:00.000Z",
      milestones,
      [],
      30,
      true,
    );
    expect(view.ciStatus).toBe("failing");
    expect(view.openIssueCount).toBe(4);
    expect(view.detail?.openPullRequests?.[0].title).toBe("secret-pr-title");
  });

  it("omits detail unless explicitly requested", () => {
    const view = toPrivateProjectView(
      makeRecord(),
      snapshot,
      "2026-08-10T12:00:00.000Z",
      milestones,
      [],
      30,
    );
    expect(view.detail).toBeUndefined();
  });

  it("marks old snapshots stale", () => {
    const view = toPrivateProjectView(
      makeRecord(),
      snapshot,
      new Date(Date.now() - 60 * 60_000).toISOString(),
      milestones,
      [],
      30,
    );
    expect(view.snapshotStale).toBe(true);
  });
});
