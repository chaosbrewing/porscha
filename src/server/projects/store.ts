import "server-only";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { projectRegistry } from "@/config/registry";
import type { SnapshotData } from "@/types/core";

/**
 * Persistence for projects, milestones, snapshots, and activity.
 * All raw database access for the projects feature lives here.
 */

/**
 * Bootstrap the typed registry into the database.
 *
 * The registry is seed data, not the source of truth: any project that
 * has been edited through the console (config_edited_at set) is left
 * completely alone — its row, GitHub connection, and milestones are
 * owned by the database from that point on.
 */
export async function syncRegistryToDb(): Promise<void> {
  const editedRows = await db
    .select({
      slug: schema.projects.slug,
      configEditedAt: schema.projects.configEditedAt,
    })
    .from(schema.projects);
  const consoleOwned = new Set(
    editedRows.filter((r) => r.configEditedAt !== null).map((r) => r.slug),
  );

  for (const p of projectRegistry) {
    if (consoleOwned.has(p.slug)) continue;
    await db
      .insert(schema.projects)
      .values({
        slug: p.slug,
        name: p.name,
        description: p.description,
        type: p.type,
        status: p.status,
        featured: p.featured ?? false,
        isApp: p.isApp ?? false,
        currentMilestone: p.currentMilestone ?? null,
        visibility: p.visibility,
        links: p.links ?? null,
        isPublic: true,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schema.projects.slug,
        set: {
          name: p.name,
          description: p.description,
          type: p.type,
          status: p.status,
          featured: p.featured ?? false,
          isApp: p.isApp ?? false,
          currentMilestone: p.currentMilestone ?? null,
          visibility: p.visibility,
          links: p.links ?? null,
          updatedAt: new Date(),
        },
      });

    if (p.github) {
      await db
        .insert(schema.projectGithubConnections)
        .values({
          projectSlug: p.slug,
          repoFullName: p.github.repository,
          publicRepository: p.github.publicRepository,
        })
        .onConflictDoUpdate({
          target: schema.projectGithubConnections.projectSlug,
          set: {
            repoFullName: p.github.repository,
            publicRepository: p.github.publicRepository,
          },
        });
    }

    for (const [mi, m] of (p.milestones ?? []).entries()) {
      const milestoneId = `${p.slug}/${m.slug}`;
      await db
        .insert(schema.projectMilestones)
        .values({
          id: milestoneId,
          projectSlug: p.slug,
          slug: m.slug,
          title: m.title,
          publicSummary: m.publicSummary ?? null,
          sortOrder: mi,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: schema.projectMilestones.id,
          set: {
            title: m.title,
            publicSummary: m.publicSummary ?? null,
            sortOrder: mi,
            updatedAt: new Date(),
          },
        });

      for (const [wi, w] of m.workItems.entries()) {
        const itemId = `${milestoneId}/${wi}`;
        await db
          .insert(schema.projectWorkItems)
          .values({
            id: itemId,
            milestoneId,
            title: w.title,
            done: w.done,
            githubIssueNumber: w.githubIssue ?? null,
            sortOrder: wi,
          })
          .onConflictDoUpdate({
            target: schema.projectWorkItems.id,
            set: {
              title: w.title,
              done: w.done,
              githubIssueNumber: w.githubIssue ?? null,
              sortOrder: wi,
            },
          });
      }
    }
  }
}

export type DbProjectRow = {
  project: typeof schema.projects.$inferSelect;
  connection: typeof schema.projectGithubConnections.$inferSelect | null;
  snapshot: typeof schema.projectSnapshots.$inferSelect | null;
};

export async function loadProjectRows(): Promise<DbProjectRow[]> {
  const rows = await db
    .select({
      project: schema.projects,
      connection: schema.projectGithubConnections,
      snapshot: schema.projectSnapshots,
    })
    .from(schema.projects)
    .leftJoin(
      schema.projectGithubConnections,
      eq(schema.projects.slug, schema.projectGithubConnections.projectSlug),
    )
    .leftJoin(
      schema.projectSnapshots,
      eq(schema.projects.slug, schema.projectSnapshots.projectSlug),
    );
  return rows;
}

export type DbMilestoneRow = {
  milestone: typeof schema.projectMilestones.$inferSelect;
  items: Array<typeof schema.projectWorkItems.$inferSelect>;
};

export async function loadMilestones(
  projectSlugs?: string[],
): Promise<Map<string, DbMilestoneRow[]>> {
  const milestones = projectSlugs
    ? await db
        .select()
        .from(schema.projectMilestones)
        .where(inArray(schema.projectMilestones.projectSlug, projectSlugs))
    : await db.select().from(schema.projectMilestones);

  const ids = milestones.map((m) => m.id);
  const items = ids.length
    ? await db
        .select()
        .from(schema.projectWorkItems)
        .where(inArray(schema.projectWorkItems.milestoneId, ids))
    : [];

  const byProject = new Map<string, DbMilestoneRow[]>();
  for (const m of milestones.sort((a, b) => a.sortOrder - b.sortOrder)) {
    const row: DbMilestoneRow = {
      milestone: m,
      items: items
        .filter((i) => i.milestoneId === m.id)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    };
    const list = byProject.get(m.projectSlug) ?? [];
    list.push(row);
    byProject.set(m.projectSlug, list);
  }
  return byProject;
}

/** Merge a snapshot patch into the stored snapshot (deep for `private`). */
export async function patchSnapshot(
  projectSlug: string,
  patch: Partial<SnapshotData>,
): Promise<void> {
  const existing = await db
    .select()
    .from(schema.projectSnapshots)
    .where(eq(schema.projectSnapshots.projectSlug, projectSlug));
  const current = (existing[0]?.data ?? {}) as SnapshotData;
  const next: SnapshotData = {
    ...current,
    ...patch,
    private: patch.private
      ? { ...current.private, ...patch.private }
      : current.private,
  };
  await db
    .insert(schema.projectSnapshots)
    .values({ projectSlug, data: next, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: schema.projectSnapshots.projectSlug,
      set: { data: next, updatedAt: new Date() },
    });
}

export async function replaceSnapshot(
  projectSlug: string,
  data: SnapshotData,
): Promise<void> {
  await db
    .insert(schema.projectSnapshots)
    .values({ projectSlug, data, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: schema.projectSnapshots.projectSlug,
      set: { data, updatedAt: new Date() },
    });
}

export async function insertActivity(activity: {
  id: string;
  projectSlug: string;
  type: string;
  occurredAt: Date;
  publicSummary: string | null;
  privatePayload: unknown;
}): Promise<boolean> {
  const result = await db
    .insert(schema.projectActivity)
    .values(activity)
    .onConflictDoNothing({ target: schema.projectActivity.id });
  return (result.rowCount ?? 0) > 0;
}

export async function loadRecentActivity(limit = 50, projectSlug?: string) {
  const base = db
    .select({
      activity: schema.projectActivity,
      projectName: schema.projects.name,
    })
    .from(schema.projectActivity)
    .innerJoin(
      schema.projects,
      eq(schema.projectActivity.projectSlug, schema.projects.slug),
    )
    .orderBy(desc(schema.projectActivity.occurredAt))
    .limit(limit);
  if (projectSlug) {
    return base.where(eq(schema.projectActivity.projectSlug, projectSlug));
  }
  return base;
}

/** Record a webhook delivery id; returns false if already processed. */
export async function recordWebhookDelivery(
  deliveryId: string,
  event: string,
): Promise<boolean> {
  const result = await db
    .insert(schema.webhookDeliveries)
    .values({ deliveryId, event })
    .onConflictDoNothing({ target: schema.webhookDeliveries.deliveryId });
  return (result.rowCount ?? 0) > 0;
}

export async function setSyncResult(
  projectSlug: string,
  error: string | null,
): Promise<void> {
  await db
    .update(schema.projectGithubConnections)
    .set({ lastSyncedAt: new Date(), lastSyncError: error })
    .where(eq(schema.projectGithubConnections.projectSlug, projectSlug));
}

export async function touchUser(user: {
  id: string;
  githubLogin: string;
  displayName: string | null;
  avatarUrl: string | null;
}): Promise<void> {
  await db
    .insert(schema.users)
    .values({ ...user, lastSeenAt: new Date() })
    .onConflictDoUpdate({
      target: schema.users.id,
      set: {
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        lastSeenAt: new Date(),
      },
    });
}

/** Cheap connectivity probe used by health/status reporting. */
export async function dbHealthy(): Promise<boolean> {
  try {
    await db.execute(sql`select 1`);
    return true;
  } catch {
    return false;
  }
}

/* --------------------- Project administration --------------------- */

export type ProjectWriteData = {
  slug: string;
  name: string;
  description: string;
  type: string;
  status: string;
  featured: boolean;
  isApp: boolean;
  isPublic: boolean;
  currentMilestone: string | null;
  visibility: unknown;
};

export async function getProjectRow(slug: string) {
  const rows = await db
    .select({
      project: schema.projects,
      connection: schema.projectGithubConnections,
    })
    .from(schema.projects)
    .leftJoin(
      schema.projectGithubConnections,
      eq(schema.projects.slug, schema.projectGithubConnections.projectSlug),
    )
    .where(eq(schema.projects.slug, slug));
  return rows[0] ?? null;
}

/** Insert a console-created project. Returns false on duplicate slug. */
export async function insertProject(data: ProjectWriteData): Promise<boolean> {
  const result = await db
    .insert(schema.projects)
    .values({ ...data, configEditedAt: new Date(), updatedAt: new Date() })
    .onConflictDoNothing({ target: schema.projects.slug });
  return (result.rowCount ?? 0) > 0;
}

/** Update mutable project configuration; stamps console ownership. */
export async function updateProjectConfig(
  slug: string,
  data: Omit<ProjectWriteData, "slug">,
): Promise<boolean> {
  const result = await db
    .update(schema.projects)
    .set({ ...data, configEditedAt: new Date(), updatedAt: new Date() })
    .where(eq(schema.projects.slug, slug));
  return (result.rowCount ?? 0) > 0;
}

export async function setProjectConnection(
  slug: string,
  repoFullName: string,
  publicRepository: boolean,
): Promise<void> {
  await db
    .insert(schema.projectGithubConnections)
    .values({ projectSlug: slug, repoFullName, publicRepository })
    .onConflictDoUpdate({
      target: schema.projectGithubConnections.projectSlug,
      set: { repoFullName, publicRepository },
    });
}

export async function removeProjectConnection(slug: string): Promise<void> {
  await db
    .delete(schema.projectGithubConnections)
    .where(eq(schema.projectGithubConnections.projectSlug, slug));
  await db
    .delete(schema.projectSnapshots)
    .where(eq(schema.projectSnapshots.projectSlug, slug));
}

/** Replace a project's milestones and work items wholesale. */
export async function replaceMilestones(
  slug: string,
  milestones: Array<{
    slug: string;
    title: string;
    publicSummary?: string;
    workItems: Array<{ title: string; done: boolean; githubIssue?: number }>;
  }>,
): Promise<void> {
  await db
    .delete(schema.projectMilestones)
    .where(eq(schema.projectMilestones.projectSlug, slug));
  for (const [mi, m] of milestones.entries()) {
    const milestoneId = `${slug}/${m.slug}`;
    await db.insert(schema.projectMilestones).values({
      id: milestoneId,
      projectSlug: slug,
      slug: m.slug,
      title: m.title,
      publicSummary: m.publicSummary ?? null,
      sortOrder: mi,
      updatedAt: new Date(),
    });
    for (const [wi, w] of m.workItems.entries()) {
      await db.insert(schema.projectWorkItems).values({
        id: `${milestoneId}/${wi}`,
        milestoneId,
        title: w.title,
        done: w.done,
        githubIssueNumber: w.githubIssue ?? null,
        sortOrder: wi,
      });
    }
  }
}

export async function insertAdminEvent(event: {
  projectSlug: string;
  actorId: string;
  action: string;
  detail?: Record<string, unknown>;
}): Promise<void> {
  await db
    .insert(schema.projectAdminEvents)
    .values({
      id: crypto.randomUUID(),
      projectSlug: event.projectSlug,
      actorId: event.actorId,
      action: event.action,
      detail: event.detail ?? null,
    })
    .catch((err) => {
      console.error("[admin] failed to record audit event", err);
    });
}

export async function listAdminEvents(projectSlug: string, limit = 20) {
  return db
    .select()
    .from(schema.projectAdminEvents)
    .where(eq(schema.projectAdminEvents.projectSlug, projectSlug))
    .orderBy(desc(schema.projectAdminEvents.createdAt))
    .limit(limit);
}
