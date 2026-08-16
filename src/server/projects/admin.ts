import "server-only";
import type { ProjectVisibility } from "@/types/core";
import {
  getProjectRow,
  insertAdminEvent,
  insertProject,
  removeProjectConnection,
  replaceMilestones,
  setProjectConnection,
  updateProjectConfig,
} from "./store";
import type { ProjectAdminInput } from "./validation";

/**
 * Project administration service. Every mutation runs behind a
 * two_factor_verified session (enforced by the API routes) and records
 * an audit event. The database owns mutable project state from the
 * first console edit onward.
 */

export type AdminResult =
  | { ok: true }
  | { ok: false; error: string; status?: number };

function projectWriteData(input: ProjectAdminInput) {
  return {
    name: input.name,
    description: input.description,
    type: input.type,
    status: input.status,
    featured: input.featured,
    isApp: input.isApp,
    isPublic: input.isPublic,
    currentMilestone: input.currentMilestone,
    visibility: input.visibility satisfies ProjectVisibility,
  };
}

export async function createProject(
  actorId: string,
  input: ProjectAdminInput,
): Promise<AdminResult> {
  const created = await insertProject({ slug: input.slug, ...projectWriteData(input) });
  if (!created) {
    return {
      ok: false,
      status: 409,
      error: `The slug “${input.slug}” is already taken — pick another.`,
    };
  }
  if (input.github) {
    await setProjectConnection(
      input.slug,
      input.github.repository,
      input.github.publicRepository,
    );
  }
  await replaceMilestones(input.slug, input.milestones);
  await insertAdminEvent({
    projectSlug: input.slug,
    actorId,
    action: "project_created",
    detail: {
      type: input.type,
      status: input.status,
      isPublic: input.isPublic,
      repository: input.github?.repository ?? null,
      milestones: input.milestones.length,
    },
  });
  if (input.github) {
    await insertAdminEvent({
      projectSlug: input.slug,
      actorId,
      action: "repository_connected",
      detail: { repository: input.github.repository },
    });
  }
  return { ok: true };
}

export async function updateProject(
  actorId: string,
  slug: string,
  input: ProjectAdminInput,
): Promise<AdminResult> {
  if (slug !== input.slug) {
    return { ok: false, status: 400, error: "Slugs can't be changed after creation." };
  }
  const existing = await getProjectRow(slug);
  if (!existing) {
    return { ok: false, status: 404, error: "That project doesn't exist." };
  }

  const updated = await updateProjectConfig(slug, projectWriteData(input));
  if (!updated) {
    return { ok: false, status: 404, error: "That project doesn't exist." };
  }
  await replaceMilestones(slug, input.milestones);

  const previousRepo = existing.connection?.repoFullName ?? null;
  const nextRepo = input.github?.repository ?? null;
  if (nextRepo && nextRepo !== previousRepo) {
    await setProjectConnection(slug, nextRepo, input.github!.publicRepository);
    await insertAdminEvent({
      projectSlug: slug,
      actorId,
      action: "repository_connected",
      detail: { repository: nextRepo, replaced: previousRepo },
    });
  } else if (!nextRepo && previousRepo) {
    await removeProjectConnection(slug);
    await insertAdminEvent({
      projectSlug: slug,
      actorId,
      action: "repository_disconnected",
      detail: { repository: previousRepo },
    });
  } else if (nextRepo && input.github) {
    // Same repo; the public/private declaration may still have changed.
    await setProjectConnection(slug, nextRepo, input.github.publicRepository);
  }

  const previousVisibility = JSON.stringify(existing.project.visibility);
  if (previousVisibility !== JSON.stringify(input.visibility)) {
    await insertAdminEvent({
      projectSlug: slug,
      actorId,
      action: "visibility_changed",
      detail: { visibility: input.visibility, isPublic: input.isPublic },
    });
  }

  await insertAdminEvent({
    projectSlug: slug,
    actorId,
    action: "project_edited",
    detail: { status: input.status, milestones: input.milestones.length },
  });
  return { ok: true };
}

/** Archive: lifecycle → archived and hidden from the public site. */
export async function archiveProject(
  actorId: string,
  slug: string,
): Promise<AdminResult> {
  const existing = await getProjectRow(slug);
  if (!existing) {
    return { ok: false, status: 404, error: "That project doesn't exist." };
  }
  await updateProjectConfig(slug, {
    name: existing.project.name,
    description: existing.project.description,
    type: existing.project.type,
    status: "archived",
    featured: false,
    isApp: existing.project.isApp,
    isPublic: false,
    currentMilestone: existing.project.currentMilestone,
    visibility: existing.project.visibility,
  });
  await insertAdminEvent({
    projectSlug: slug,
    actorId,
    action: "project_archived",
  });
  return { ok: true };
}

export async function disconnectRepository(
  actorId: string,
  slug: string,
): Promise<AdminResult> {
  const existing = await getProjectRow(slug);
  if (!existing) {
    return { ok: false, status: 404, error: "That project doesn't exist." };
  }
  if (!existing.connection) {
    return { ok: false, status: 400, error: "No repository is connected." };
  }
  const repo = existing.connection.repoFullName;
  await removeProjectConnection(slug);
  // Stamp console ownership so the registry can't re-add the repo.
  await updateProjectConfig(slug, {
    name: existing.project.name,
    description: existing.project.description,
    type: existing.project.type,
    status: existing.project.status,
    featured: existing.project.featured,
    isApp: existing.project.isApp,
    isPublic: existing.project.isPublic,
    currentMilestone: existing.project.currentMilestone,
    visibility: existing.project.visibility,
  });
  await insertAdminEvent({
    projectSlug: slug,
    actorId,
    action: "repository_disconnected",
    detail: { repository: repo },
  });
  return { ok: true };
}

/** Full mutable configuration for the edit form. */
export async function getProjectAdminConfig(slug: string) {
  const row = await getProjectRow(slug);
  if (!row) return null;
  const { loadMilestones } = await import("./store");
  const milestoneMap = await loadMilestones([slug]);
  const milestones = (milestoneMap.get(slug) ?? []).map((m) => ({
    slug: m.milestone.slug,
    title: m.milestone.title,
    publicSummary: m.milestone.publicSummary ?? undefined,
    workItems: m.items.map((i) => ({
      title: i.title,
      done: i.done,
      ...(i.githubIssueNumber ? { githubIssue: i.githubIssueNumber } : {}),
    })),
  }));
  return {
    slug: row.project.slug,
    name: row.project.name,
    description: row.project.description,
    type: row.project.type,
    status: row.project.status,
    featured: row.project.featured,
    isApp: row.project.isApp,
    isPublic: row.project.isPublic,
    github: row.connection
      ? {
          repository: row.connection.repoFullName,
          publicRepository: row.connection.publicRepository,
        }
      : null,
    visibility: row.project.visibility,
    currentMilestone: row.project.currentMilestone,
    milestones,
  };
}
