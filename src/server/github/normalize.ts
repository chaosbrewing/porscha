import type { ActivityType, SnapshotData } from "@/types/core";

/**
 * Webhook event normalization.
 *
 * Raw GitHub payloads become (a) a normalized `ProjectActivity` and
 * (b) a partial snapshot patch. `publicSummary` strings are generated
 * from a fixed vocabulary — never from commit messages, PR titles,
 * issue titles, branch names, or usernames — so they are safe for the
 * public site by construction. Full detail goes into `privatePayload`
 * and the snapshot's `private` section, which only the console can see.
 */

export type NormalizedEvent = {
  activity: {
    type: ActivityType;
    occurredAt: string;
    publicSummary: string;
    privatePayload: unknown;
  } | null;
  snapshotPatch: Partial<SnapshotData> | null;
  repoFullName: string | null;
};

type AnyPayload = Record<string, unknown>;

function get(obj: unknown, path: string[]): unknown {
  let cur: unknown = obj;
  for (const key of path) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as AnyPayload)[key];
  }
  return cur;
}

function str(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}
function num(v: unknown): number | null {
  return typeof v === "number" ? v : null;
}

export function normalizeWebhookEvent(
  eventName: string,
  payload: unknown,
): NormalizedEvent {
  const repoFullName = str(get(payload, ["repository", "full_name"]));
  const now = new Date().toISOString();
  const none: NormalizedEvent = {
    activity: null,
    snapshotPatch: null,
    repoFullName,
  };

  switch (eventName) {
    case "push": {
      const commits = get(payload, ["commits"]);
      const commitCount = Array.isArray(commits) ? commits.length : 0;
      if (commitCount === 0) return none; // branch delete / tag push noise
      return {
        repoFullName,
        activity: {
          type: "push",
          occurredAt: now,
          publicSummary: "Development activity",
          privatePayload: {
            ref: str(get(payload, ["ref"])),
            commitCount,
            headMessage: str(get(payload, ["head_commit", "message"])),
            pusher: str(get(payload, ["pusher", "name"])),
            compareUrl: str(get(payload, ["compare"])),
          },
        },
        snapshotPatch: { lastPushedAt: now },
      };
    }

    case "pull_request": {
      const action = str(get(payload, ["action"]));
      const merged = get(payload, ["pull_request", "merged"]) === true;
      let type: ActivityType | null = null;
      let publicSummary = "";
      if (action === "opened" || action === "reopened") {
        type = "pull_request_opened";
        publicSummary = "Change proposed";
      } else if (action === "closed" && merged) {
        type = "pull_request_merged";
        publicSummary = "Change landed";
      } else if (action === "closed") {
        type = "pull_request_closed";
        publicSummary = "Change withdrawn";
      }
      if (!type) return none;
      return {
        repoFullName,
        activity: {
          type,
          occurredAt: now,
          publicSummary,
          privatePayload: {
            number: num(get(payload, ["pull_request", "number"])),
            title: str(get(payload, ["pull_request", "title"])),
            author: str(get(payload, ["pull_request", "user", "login"])),
            url: str(get(payload, ["pull_request", "html_url"])),
            action,
            merged,
          },
        },
        snapshotPatch: { lastPushedAt: now },
      };
    }

    case "issues": {
      const action = str(get(payload, ["action"]));
      let type: ActivityType | null = null;
      let publicSummary = "";
      if (action === "opened" || action === "reopened") {
        type = "issue_opened";
        publicSummary = "Work item opened";
      } else if (action === "closed") {
        type = "issue_closed";
        publicSummary = "Work item resolved";
      }
      if (!type) return none;
      return {
        repoFullName,
        activity: {
          type,
          occurredAt: now,
          publicSummary,
          privatePayload: {
            number: num(get(payload, ["issue", "number"])),
            title: str(get(payload, ["issue", "title"])),
            url: str(get(payload, ["issue", "html_url"])),
            action,
          },
        },
        snapshotPatch: null,
      };
    }

    case "workflow_run": {
      const action = str(get(payload, ["action"]));
      const status = str(get(payload, ["workflow_run", "status"]));
      const conclusion = str(get(payload, ["workflow_run", "conclusion"]));
      const wf = {
        name: str(get(payload, ["workflow_run", "name"])) ?? "Workflow",
        conclusion,
        status: status ?? "unknown",
        branch: str(get(payload, ["workflow_run", "head_branch"])),
        url: str(get(payload, ["workflow_run", "html_url"])) ?? "",
        updatedAt: now,
      };
      if (action === "requested" || action === "in_progress") {
        return {
          repoFullName,
          activity: {
            type: "workflow_started",
            occurredAt: now,
            publicSummary: "Build started",
            privatePayload: wf,
          },
          snapshotPatch: { ciStatus: "pending", private: { lastWorkflow: wf } },
        };
      }
      if (action === "completed") {
        const passed = conclusion === "success";
        const ignored =
          conclusion === "cancelled" || conclusion === "skipped";
        if (ignored) {
          return { repoFullName, activity: null, snapshotPatch: null };
        }
        return {
          repoFullName,
          activity: {
            type: passed ? "workflow_passed" : "workflow_failed",
            occurredAt: now,
            publicSummary: passed ? "Build passing" : "Build failing",
            privatePayload: wf,
          },
          snapshotPatch: {
            ciStatus: passed ? "passing" : "failing",
            private: { lastWorkflow: wf },
          },
        };
      }
      return none;
    }

    case "release": {
      const action = str(get(payload, ["action"]));
      if (action !== "published") return none;
      const tag = str(get(payload, ["release", "tag_name"])) ?? "release";
      const publishedAt =
        str(get(payload, ["release", "published_at"])) ?? now;
      return {
        repoFullName,
        activity: {
          type: "release_published",
          occurredAt: now,
          // A release tag is deliberately public-safe: releases only
          // surface for projects whose `releases` visibility flag is on.
          publicSummary: `Release ${tag} published`,
          privatePayload: {
            tag,
            name: str(get(payload, ["release", "name"])),
            url: str(get(payload, ["release", "html_url"])),
          },
        },
        snapshotPatch: {
          latestRelease: {
            tag,
            name: str(get(payload, ["release", "name"])),
            publishedAt,
          },
        },
      };
    }

    default:
      return none;
  }
}
