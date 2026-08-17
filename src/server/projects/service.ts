import "server-only";
import { env } from "@/server/env";
import type {
  ActivityFeedItem,
  AttentionItem,
  ConsoleOverview,
  PrivateProjectView,
  PublicProjectView,
  SnapshotData,
} from "@/types/core";
import { projectRegistry } from "@/config/registry";
import { greetingForHour } from "@/lib/dates";
import { siteConfig } from "@/config/site";
import { computeAllMilestones } from "./progress";
import { deriveAttention } from "./attention";
import {
  toPublicProjectView,
  toPrivateProjectView,
  type ProjectRecord,
} from "./transformers";
import {
  loadMilestones,
  loadProjectRows,
  loadRecentActivity,
  syncRegistryToDb,
  type DbProjectRow,
  type DbMilestoneRow,
} from "./store";

/**
 * Project service — the only module UI code talks to for project data.
 *
 * Reads DB state (snapshots, milestones) joined with the registry. If
 * the database is unreachable, public views degrade to registry-only
 * data (no GitHub-derived signals) instead of erroring, and the
 * degradation is reported so pages can show a stale-data notice.
 */

function rowToRecord(row: DbProjectRow): ProjectRecord {
  return {
    slug: row.project.slug,
    name: row.project.name,
    description: row.project.description,
    type: row.project.type as ProjectRecord["type"],
    status: row.project.status as ProjectRecord["status"],
    featured: row.project.featured,
    isApp: row.project.isApp,
    isPublic: row.project.isPublic,
    logoPath: row.project.logoPath,
    visibility: row.project.visibility as ProjectRecord["visibility"],
    links: (row.project.links ?? null) as ProjectRecord["links"],
    currentMilestone: row.project.currentMilestone,
    repoFullName: row.connection?.repoFullName ?? null,
    publicRepository: row.connection?.publicRepository ?? false,
    lastSyncError: row.connection?.lastSyncError ?? null,
  };
}

function registryToRecord(slug: string): ProjectRecord | null {
  const p = projectRegistry.find((x) => x.slug === slug);
  if (!p) return null;
  return {
    slug: p.slug,
    name: p.name,
    description: p.description,
    type: p.type,
    status: p.status,
    featured: p.featured ?? false,
    isApp: p.isApp ?? false,
    isPublic: true,
    // The registry has no logo field; uploads are console-only.
    logoPath: null,
    visibility: p.visibility,
    links: p.links ?? null,
    currentMilestone: p.currentMilestone ?? null,
    repoFullName: p.github?.repository ?? null,
    publicRepository: p.github?.publicRepository ?? false,
    lastSyncError: null,
  };
}

function milestonesFromRows(
  record: ProjectRecord,
  rows: DbMilestoneRow[] | undefined,
) {
  if (rows && rows.length > 0) {
    return computeAllMilestones(
      rows.map((r) => ({
        slug: r.milestone.slug,
        title: r.milestone.title,
        publicSummary: r.milestone.publicSummary,
        workItems: r.items.map((i) => ({ done: i.done })),
      })),
      record.currentMilestone,
    );
  }
  // Fall back to registry definitions (pre-DB or degraded mode).
  const cfg = projectRegistry.find((p) => p.slug === record.slug);
  return computeAllMilestones(
    (cfg?.milestones ?? []).map((m) => ({
      slug: m.slug,
      title: m.title,
      publicSummary: m.publicSummary,
      workItems: m.workItems.map((w) => ({ done: w.done })),
    })),
    record.currentMilestone,
  );
}

let registrySynced = false;
async function ensureRegistrySynced(): Promise<void> {
  if (registrySynced) return;
  await syncRegistryToDb();
  registrySynced = true;
}

type LoadResult = {
  records: Array<{
    record: ProjectRecord;
    snapshot: SnapshotData | null;
    snapshotUpdatedAt: string | null;
  }>;
  degraded: boolean;
};

async function loadAll(): Promise<LoadResult> {
  try {
    await ensureRegistrySynced();
    const rows = await loadProjectRows();
    return {
      degraded: false,
      records: rows.map((row) => ({
        record: rowToRecord(row),
        snapshot: (row.snapshot?.data ?? null) as SnapshotData | null,
        snapshotUpdatedAt: row.snapshot?.updatedAt?.toISOString() ?? null,
      })),
    };
  } catch (err) {
    console.error("[projects] database unavailable, degrading:", err);
    return {
      degraded: true,
      records: projectRegistry
        .map((p) => registryToRecord(p.slug))
        .filter((r): r is ProjectRecord => r !== null)
        .map((record) => ({ record, snapshot: null, snapshotUpdatedAt: null })),
    };
  }
}

async function loadMilestoneMap(): Promise<Map<string, DbMilestoneRow[]>> {
  try {
    return await loadMilestones();
  } catch {
    return new Map();
  }
}

/* --------------------------- Public API --------------------------- */

export async function getPublicProjects(): Promise<{
  projects: PublicProjectView[];
  degraded: boolean;
}> {
  const [{ records, degraded }, milestoneMap] = await Promise.all([
    loadAll(),
    loadMilestoneMap(),
  ]);
  const statusOrder = [
    "building",
    "active",
    "experimenting",
    "quiet",
    "paused",
    "shipped",
    "archived",
  ];
  return {
    degraded,
    projects: records
      // Projects hidden from the public site never reach the
      // serializer at all.
      .filter(({ record }) => record.isPublic)
      .map(({ record, snapshot }) =>
        toPublicProjectView(
          record,
          snapshot,
          milestonesFromRows(record, milestoneMap.get(record.slug)),
        ),
      )
      .sort(
        (a, b) =>
          statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status),
      ),
  };
}

export async function getPublicProject(
  slug: string,
): Promise<PublicProjectView | null> {
  const { projects } = await getPublicProjects();
  return projects.find((p) => p.slug === slug) ?? null;
}

/* --------------------------- Console API -------------------------- */

async function buildPrivateViews(
  includeDetailFor?: string,
): Promise<{ views: PrivateProjectView[]; degraded: boolean }> {
  const [{ records, degraded }, milestoneMap] = await Promise.all([
    loadAll(),
    loadMilestoneMap(),
  ]);
  const views = records.map(({ record, snapshot, snapshotUpdatedAt }) => {
    const milestones = milestonesFromRows(record, milestoneMap.get(record.slug));
    const current = milestones.find((m) => m.isCurrent) ?? null;
    const attention: AttentionItem[] = deriveAttention({
      slug: record.slug,
      name: record.name,
      status: record.status,
      snapshot,
      snapshotUpdatedAt,
      lastActivityAt: snapshot?.lastPushedAt ?? null,
      currentMilestone: current,
      lastSyncError: record.lastSyncError,
      hasGithub: record.repoFullName !== null,
    });
    return toPrivateProjectView(
      record,
      snapshot,
      snapshotUpdatedAt,
      milestones,
      attention,
      env.SNAPSHOT_STALE_MINUTES,
      includeDetailFor === record.slug,
    );
  });
  return { views, degraded };
}

export async function getConsoleOverview(): Promise<
  ConsoleOverview & { degraded: boolean }
> {
  const { views, degraded } = await buildPrivateViews();
  const movingStatuses = new Set(["building", "active", "experimenting"]);
  const active = views.filter((v) => movingStatuses.has(v.status)).length;
  const quiet = views.filter(
    (v) => v.status === "quiet" || v.status === "paused",
  ).length;
  const attention = views
    .flatMap((v) => v.attention)
    .sort((a, b) => (b.since ?? "").localeCompare(a.since ?? ""));
  const needsAttention = new Set(attention.map((a) => a.projectSlug)).size;

  const statusOrder = [
    "building",
    "active",
    "experimenting",
    "quiet",
    "paused",
    "shipped",
    "archived",
  ];

  return {
    greetingName: `${greetingForHour(new Date().getHours())}, ${siteConfig.owner.shortName}.`,
    counts: { active, needsAttention, quiet },
    projects: views.sort(
      (a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status),
    ),
    attention,
    generatedAt: new Date().toISOString(),
    degraded,
  };
}

export async function getPrivateProject(
  slug: string,
): Promise<PrivateProjectView | null> {
  const { views } = await buildPrivateViews(slug);
  return views.find((v) => v.slug === slug) ?? null;
}

export async function getActivityFeed(options?: {
  projectSlug?: string;
  limit?: number;
}): Promise<{ items: ActivityFeedItem[]; degraded: boolean }> {
  try {
    const rows = await loadRecentActivity(
      options?.limit ?? 50,
      options?.projectSlug,
    );
    return {
      degraded: false,
      items: rows.map((r) => ({
        id: r.activity.id,
        projectSlug: r.activity.projectSlug,
        projectName: r.projectName,
        type: r.activity.type as ActivityFeedItem["type"],
        occurredAt: r.activity.occurredAt.toISOString(),
        summary: describeActivity(
          r.activity.type,
          r.activity.privatePayload,
          r.activity.publicSummary,
        ),
      })),
    };
  } catch {
    return { degraded: true, items: [] };
  }
}

/** Console-facing activity description — may use private payload. */
function describeActivity(
  type: string,
  privatePayload: unknown,
  publicSummary: string | null,
): string {
  const p = (privatePayload ?? {}) as Record<string, unknown>;
  switch (type) {
    case "push": {
      const n = typeof p.commitCount === "number" ? p.commitCount : null;
      const ref =
        typeof p.ref === "string" ? p.ref.replace("refs/heads/", "") : null;
      return `${n ?? "New"} commit${n === 1 ? "" : "s"} pushed${ref ? ` to ${ref}` : ""}`;
    }
    case "pull_request_opened":
      return p.title ? `PR opened: ${p.title}` : "Pull request opened";
    case "pull_request_merged":
      return p.title ? `PR merged: ${p.title}` : "Pull request merged";
    case "pull_request_closed":
      return p.title ? `PR closed: ${p.title}` : "Pull request closed";
    case "issue_opened":
      return p.title ? `Issue opened: ${p.title}` : "Issue opened";
    case "issue_closed":
      return p.title ? `Issue closed: ${p.title}` : "Issue closed";
    case "workflow_started":
      return `Workflow started${p.name ? `: ${p.name}` : ""}`;
    case "workflow_passed":
      return `Workflow passed${p.name ? `: ${p.name}` : ""}`;
    case "workflow_failed":
      return `Workflow failed${p.name ? `: ${p.name}` : ""}`;
    case "release_published":
      return p.tag ? `Release ${p.tag} published` : "Release published";
    default:
      return publicSummary ?? "Activity";
  }
}
