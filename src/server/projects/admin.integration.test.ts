import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { ProjectAdminInput } from "./validation";
import { closedVisibility } from "./validation";

/**
 * DB-backed project administration tests: creation, editing,
 * visibility defaults, milestone-derived progress, archival, and the
 * registry-vs-console ownership rules. Skipped when Postgres is down.
 */

const ACTOR = "github:admin-test-actor";
const SLUG = "admin-test-project";
let dbUp = false;

function input(overrides: Partial<ProjectAdminInput> = {}): ProjectAdminInput {
  return {
    slug: SLUG,
    name: "Admin Test Project",
    description: "Created by the admin integration tests.",
    type: "app",
    status: "building",
    featured: false,
    isApp: false,
    isPublic: false,
    github: null,
    visibility: { ...closedVisibility },
    currentMilestone: null,
    milestones: [],
    ...overrides,
  };
}

async function removeTestProject() {
  const { db, schema } = await import("@/server/db/client");
  const { eq, like } = await import("drizzle-orm");
  await db.delete(schema.projects).where(eq(schema.projects.slug, SLUG));
  await db
    .delete(schema.projectAdminEvents)
    .where(like(schema.projectAdminEvents.projectSlug, "admin-test-%"));
}

beforeAll(async () => {
  const { dbHealthy, syncRegistryToDb } = await import("./store");
  dbUp = await dbHealthy();
  if (!dbUp) return;
  await syncRegistryToDb();
  await removeTestProject();
});

afterAll(async () => {
  if (!dbUp) return;
  await removeTestProject();
  // Restore habi to registry ownership after the sync-survival test.
  const { db, schema } = await import("@/server/db/client");
  const { eq } = await import("drizzle-orm");
  await db
    .update(schema.projects)
    .set({ configEditedAt: null })
    .where(eq(schema.projects.slug, "habi"));
  const { syncRegistryToDb } = await import("./store");
  await syncRegistryToDb();
});

describe("project administration (integration)", () => {
  it("creates a project without a GitHub connection", async (ctx) => {
    if (!dbUp) return ctx.skip();
    const { createProject, getProjectAdminConfig } = await import("./admin");
    const result = await createProject(ACTOR, input());
    expect(result.ok).toBe(true);
    const config = await getProjectAdminConfig(SLUG);
    expect(config?.name).toBe("Admin Test Project");
    expect(config?.github).toBeNull();
  });

  it("rejects a duplicate slug in plain language", async (ctx) => {
    if (!dbUp) return ctx.skip();
    const { createProject } = await import("./admin");
    const result = await createProject(ACTOR, input());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(409);
      expect(result.error).toContain("already taken");
    }
  });

  it("new projects default to hidden with every signal off", async (ctx) => {
    if (!dbUp) return ctx.skip();
    const { getPublicProjects } = await import("./service");
    const { projects } = await getPublicProjects();
    expect(projects.find((p) => p.slug === SLUG)).toBeUndefined();
  });

  it("connects a repository through an edit", async (ctx) => {
    if (!dbUp) return ctx.skip();
    const { updateProject, getProjectAdminConfig } = await import("./admin");
    const result = await updateProject(
      ACTOR,
      SLUG,
      input({
        github: {
          repository: "chaosbrewing/admin-test-repo",
          publicRepository: false,
        },
      }),
    );
    expect(result.ok).toBe(true);
    const config = await getProjectAdminConfig(SLUG);
    expect(config?.github?.repository).toBe("chaosbrewing/admin-test-repo");
  });

  it("edits status and milestone configuration", async (ctx) => {
    if (!dbUp) return ctx.skip();
    const { updateProject, getProjectAdminConfig } = await import("./admin");
    const result = await updateProject(
      ACTOR,
      SLUG,
      input({
        status: "active",
        isPublic: true,
        currentMilestone: "first-cut",
        milestones: [
          {
            slug: "first-cut",
            title: "First cut",
            publicSummary: "Getting it standing.",
            workItems: [
              { title: "Skeleton", done: true },
              { title: "Walking", done: true },
              { title: "Talking", done: false },
              { title: "Singing", done: false },
            ],
          },
        ],
      }),
    );
    expect(result.ok).toBe(true);
    const config = await getProjectAdminConfig(SLUG);
    expect(config?.status).toBe("active");
    expect(config?.milestones[0].workItems).toHaveLength(4);
  });

  it("derives public progress only from scoped work items", async (ctx) => {
    if (!dbUp) return ctx.skip();
    const { getPublicProjects } = await import("./service");
    const { updateProject } = await import("./admin");

    // Signals still off: public entry exists (isPublic) but shows none.
    let { projects } = await getPublicProjects();
    let view = projects.find((p) => p.slug === SLUG);
    expect(view).toBeDefined();
    expect(view?.progress).toBeUndefined();
    expect(view?.currentMilestone).toBeUndefined();

    // Turn milestone + progress signals on → 2 of 4 = 50%.
    await updateProject(
      ACTOR,
      SLUG,
      input({
        status: "active",
        isPublic: true,
        visibility: { ...closedVisibility, progress: true, milestones: true },
        currentMilestone: "first-cut",
        milestones: [
          {
            slug: "first-cut",
            title: "First cut",
            workItems: [
              { title: "Skeleton", done: true },
              { title: "Walking", done: true },
              { title: "Talking", done: false },
              { title: "Singing", done: false },
            ],
          },
        ],
      }),
    );
    ({ projects } = await getPublicProjects());
    view = projects.find((p) => p.slug === SLUG);
    expect(view?.progress).toEqual({ done: 2, total: 4, percent: 50 });
    expect(view?.currentMilestone?.title).toBe("First cut");
  });

  it("shows no fabricated percentage without work items", async (ctx) => {
    if (!dbUp) return ctx.skip();
    const { updateProject } = await import("./admin");
    const { getPublicProjects } = await import("./service");
    await updateProject(
      ACTOR,
      SLUG,
      input({
        status: "active",
        isPublic: true,
        visibility: { ...closedVisibility, progress: true, milestones: true },
        currentMilestone: "vibes",
        milestones: [{ slug: "vibes", title: "Vibes", workItems: [] }],
      }),
    );
    const { projects } = await getPublicProjects();
    const view = projects.find((p) => p.slug === SLUG);
    expect(view?.progress).toBeNull();
  });

  it("a public GitHub repo does not bypass signal visibility", async (ctx) => {
    if (!dbUp) return ctx.skip();
    const { updateProject } = await import("./admin");
    const { getPublicProjects } = await import("./service");
    await updateProject(
      ACTOR,
      SLUG,
      input({
        status: "active",
        isPublic: true,
        github: {
          repository: "chaosbrewing/admin-test-repo",
          publicRepository: true,
        },
        visibility: { ...closedVisibility },
      }),
    );
    const { projects } = await getPublicProjects();
    const view = projects.find((p) => p.slug === SLUG);
    // The explicitly-public repo URL may appear; every derived signal
    // stays hidden because the flags are off.
    expect(view?.activitySignal).toBeUndefined();
    expect(view?.lastPublicActivityAt).toBeUndefined();
    expect(view?.latestRelease).toBeUndefined();
    expect(view?.progress).toBeUndefined();
    expect(view?.currentMilestone).toBeUndefined();
  });

  it("records an audit trail for the whole life of the project", async (ctx) => {
    if (!dbUp) return ctx.skip();
    const { listAdminEvents } = await import("./store");
    const events = await listAdminEvents(SLUG, 50);
    const actions = events.map((e) => e.action);
    expect(actions).toContain("project_created");
    expect(actions).toContain("project_edited");
    expect(actions).toContain("repository_connected");
    expect(actions).toContain("visibility_changed");
  });

  it("console edits survive registry bootstrap", async (ctx) => {
    if (!dbUp) return ctx.skip();
    const { db, schema } = await import("@/server/db/client");
    const { eq } = await import("drizzle-orm");
    const { updateProject, getProjectAdminConfig } = await import("./admin");
    const { syncRegistryToDb } = await import("./store");

    // Edit a registry-seeded project through the console path.
    const habi = await getProjectAdminConfig("habi");
    expect(habi).not.toBeNull();
    const result = await updateProject(ACTOR, "habi", {
      slug: "habi",
      name: "habi (console-edited)",
      description: habi!.description,
      type: "app",
      status: "paused",
      featured: false,
      isApp: true,
      isPublic: true,
      github: habi!.github,
      visibility: { ...closedVisibility },
      currentMilestone: null,
      milestones: [],
    });
    expect(result.ok).toBe(true);

    // Registry bootstrap must not overwrite the console's version.
    await syncRegistryToDb();
    const after = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.slug, "habi"));
    expect(after[0].name).toBe("habi (console-edited)");
    expect(after[0].status).toBe("paused");
    expect(after[0].configEditedAt).not.toBeNull();
  });

  it("archives instead of deleting", async (ctx) => {
    if (!dbUp) return ctx.skip();
    const { archiveProject, getProjectAdminConfig } = await import("./admin");
    const result = await archiveProject(ACTOR, SLUG);
    expect(result.ok).toBe(true);
    const config = await getProjectAdminConfig(SLUG);
    expect(config?.status).toBe("archived");
    expect(config?.isPublic).toBe(false);

    const { getPublicProjects } = await import("./service");
    const { projects } = await getPublicProjects();
    expect(projects.find((p) => p.slug === SLUG)).toBeUndefined();
  });

  it("disconnects the repository and clears its snapshot", async (ctx) => {
    if (!dbUp) return ctx.skip();
    const { disconnectRepository, getProjectAdminConfig } = await import("./admin");
    const result = await disconnectRepository(ACTOR, SLUG);
    expect(result.ok).toBe(true);
    const config = await getProjectAdminConfig(SLUG);
    expect(config?.github).toBeNull();
  });
});
