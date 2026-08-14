import { describe, expect, it } from "vitest";
import { deriveAttention, type AttentionInput } from "./attention";
import type { SnapshotData } from "@/types/core";

const NOW = new Date("2026-08-14T12:00:00Z");

function base(overrides: Partial<AttentionInput> = {}): AttentionInput {
  return {
    slug: "test",
    name: "Test",
    status: "active",
    snapshot: null,
    snapshotUpdatedAt: NOW.toISOString(),
    lastActivityAt: NOW.toISOString(),
    currentMilestone: null,
    lastSyncError: null,
    hasGithub: true,
    now: NOW,
    ...overrides,
  };
}

describe("deriveAttention", () => {
  it("returns nothing for a healthy active project", () => {
    const snapshot: SnapshotData = { ciStatus: "passing" };
    expect(deriveAttention(base({ snapshot }))).toEqual([]);
  });

  it("flags failing CI", () => {
    const snapshot: SnapshotData = { ciStatus: "failing" };
    const items = deriveAttention(base({ snapshot }));
    expect(items.map((i) => i.kind)).toContain("ci_failing");
  });

  it("does not flag failing CI on paused/archived projects", () => {
    const snapshot: SnapshotData = { ciStatus: "failing" };
    expect(
      deriveAttention(base({ snapshot, status: "paused" })),
    ).toEqual([]);
    expect(
      deriveAttention(base({ snapshot, status: "archived" })),
    ).toEqual([]);
  });

  it("separates fresh PRs (awaiting review) from stale PRs", () => {
    const fresh = new Date(NOW.getTime() - 2 * 86_400_000).toISOString();
    const stale = new Date(NOW.getTime() - 10 * 86_400_000).toISOString();
    const snapshot: SnapshotData = {
      ciStatus: "passing",
      private: {
        openPullRequests: [
          { number: 1, title: "a", author: null, updatedAt: fresh, draft: false, url: "" },
          { number: 2, title: "b", author: null, updatedAt: stale, draft: false, url: "" },
          { number: 3, title: "c", author: null, updatedAt: stale, draft: true, url: "" },
        ],
      },
    };
    const items = deriveAttention(base({ snapshot }));
    const kinds = items.map((i) => i.kind).sort();
    // Draft PR (#3) produces nothing.
    expect(kinds).toEqual(["pr_awaiting_review", "stale_pr"]);
  });

  it("flags unexpected inactivity only for moving statuses", () => {
    const idle = new Date(NOW.getTime() - 20 * 86_400_000).toISOString();
    const active = deriveAttention(
      base({ status: "active", lastActivityAt: idle }),
    );
    expect(active.map((i) => i.kind)).toContain("repo_inactive");

    const quiet = deriveAttention(
      base({ status: "quiet", lastActivityAt: idle }),
    );
    expect(quiet).toEqual([]);
  });

  it("flags stalled milestones with remaining work", () => {
    const idle = new Date(NOW.getTime() - 30 * 86_400_000).toISOString();
    const items = deriveAttention(
      base({
        status: "experimenting",
        lastActivityAt: idle,
        currentMilestone: {
          slug: "m1",
          title: "M1",
          done: 1,
          total: 4,
          percent: 25,
          isCurrent: true,
        },
      }),
    );
    expect(items.map((i) => i.kind)).toContain("milestone_stalled");
  });

  it("flags sync failures", () => {
    const items = deriveAttention(base({ lastSyncError: "GitHub API 401" }));
    expect(items.map((i) => i.kind)).toContain("sync_failed");
  });
});
