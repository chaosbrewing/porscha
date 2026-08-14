import { describe, expect, it } from "vitest";
import { normalizeWebhookEvent } from "./normalize";

describe("normalizeWebhookEvent", () => {
  it("normalizes push events with a safe public summary", () => {
    const result = normalizeWebhookEvent("push", {
      repository: { full_name: "chaosbrewing/kubli" },
      ref: "refs/heads/secret-feature-branch",
      commits: [{ id: "1" }, { id: "2" }],
      head_commit: { message: "SECRET commit message" },
      pusher: { name: "secret-user" },
    });
    expect(result.repoFullName).toBe("chaosbrewing/kubli");
    expect(result.activity?.type).toBe("push");
    expect(result.activity?.publicSummary).toBe("Development activity");
    // Private detail is captured, but never in the public summary.
    expect(result.activity?.publicSummary).not.toContain("SECRET");
    expect(result.activity?.publicSummary).not.toContain("secret-feature");
    expect(result.snapshotPatch?.lastPushedAt).toBeTruthy();
  });

  it("ignores pushes with no commits (branch deletes)", () => {
    const result = normalizeWebhookEvent("push", {
      repository: { full_name: "chaosbrewing/kubli" },
      commits: [],
    });
    expect(result.activity).toBeNull();
  });

  it("distinguishes merged from closed pull requests", () => {
    const merged = normalizeWebhookEvent("pull_request", {
      repository: { full_name: "chaosbrewing/kubli" },
      action: "closed",
      pull_request: { merged: true, number: 5, title: "Secret PR title" },
    });
    expect(merged.activity?.type).toBe("pull_request_merged");
    expect(merged.activity?.publicSummary).toBe("Change landed");
    expect(merged.activity?.publicSummary).not.toContain("Secret");

    const closed = normalizeWebhookEvent("pull_request", {
      repository: { full_name: "chaosbrewing/kubli" },
      action: "closed",
      pull_request: { merged: false, number: 5, title: "Secret PR title" },
    });
    expect(closed.activity?.type).toBe("pull_request_closed");
  });

  it("maps workflow completion to CI status", () => {
    const failed = normalizeWebhookEvent("workflow_run", {
      repository: { full_name: "chaosbrewing/kubli" },
      action: "completed",
      workflow_run: {
        status: "completed",
        conclusion: "failure",
        name: "CI",
        head_branch: "main",
        html_url: "https://example.com",
      },
    });
    expect(failed.activity?.type).toBe("workflow_failed");
    expect(failed.snapshotPatch?.ciStatus).toBe("failing");

    const passed = normalizeWebhookEvent("workflow_run", {
      repository: { full_name: "chaosbrewing/kubli" },
      action: "completed",
      workflow_run: { status: "completed", conclusion: "success" },
    });
    expect(passed.snapshotPatch?.ciStatus).toBe("passing");
  });

  it("ignores cancelled and skipped workflow runs", () => {
    const cancelled = normalizeWebhookEvent("workflow_run", {
      repository: { full_name: "chaosbrewing/kubli" },
      action: "completed",
      workflow_run: { status: "completed", conclusion: "cancelled" },
    });
    expect(cancelled.activity).toBeNull();
    expect(cancelled.snapshotPatch).toBeNull();
  });

  it("captures published releases into the snapshot", () => {
    const result = normalizeWebhookEvent("release", {
      repository: { full_name: "chaosbrewing/kubli" },
      action: "published",
      release: {
        tag_name: "v0.3.0",
        name: "Capture flow beta",
        published_at: "2026-08-01T00:00:00Z",
      },
    });
    expect(result.activity?.type).toBe("release_published");
    expect(result.snapshotPatch?.latestRelease?.tag).toBe("v0.3.0");
  });

  it("returns nothing for unhandled events", () => {
    const result = normalizeWebhookEvent("star", {
      repository: { full_name: "chaosbrewing/kubli" },
    });
    expect(result.activity).toBeNull();
    expect(result.snapshotPatch).toBeNull();
  });

  it("tolerates malformed payloads without throwing", () => {
    expect(() => normalizeWebhookEvent("push", null)).not.toThrow();
    expect(() => normalizeWebhookEvent("pull_request", "junk")).not.toThrow();
    expect(() => normalizeWebhookEvent("workflow_run", 42)).not.toThrow();
  });
});
