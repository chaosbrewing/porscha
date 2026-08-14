import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Integration tests for webhook ingestion against a real Postgres
 * database (duplicate-delivery protection, snapshot patching).
 * Skipped automatically when the database is unreachable.
 */

let dbUp = false;

beforeAll(async () => {
  const { dbHealthy } = await import("@/server/projects/store");
  dbUp = await dbHealthy();
  if (!dbUp) return;
  const { syncRegistryToDb } = await import("@/server/projects/store");
  await syncRegistryToDb();
});

afterAll(async () => {
  if (!dbUp) return;
  const { db, schema } = await import("@/server/db/client");
  const { like, eq } = await import("drizzle-orm");
  await db
    .delete(schema.projectActivity)
    .where(like(schema.projectActivity.id, "wh:test-%"));
  await db
    .delete(schema.webhookDeliveries)
    .where(like(schema.webhookDeliveries.deliveryId, "test-%"));
  await db
    .delete(schema.projectSnapshots)
    .where(eq(schema.projectSnapshots.projectSlug, "kubli"));
});

describe("ingestWebhookEvent (integration)", () => {
  it("processes a push event and dedupes the duplicate delivery", async (ctx) => {
    if (!dbUp) return ctx.skip();
    const { ingestWebhookEvent } = await import("./ingest");
    const deliveryId = `test-${Date.now()}`;
    const payload = {
      repository: { full_name: "chaosbrewing/kubli" },
      ref: "refs/heads/main",
      commits: [{ id: "1" }],
      head_commit: { message: "private message" },
    };

    const first = await ingestWebhookEvent("push", deliveryId, payload);
    expect(first.outcome).toBe("processed");

    const second = await ingestWebhookEvent("push", deliveryId, payload);
    expect(second.outcome).toBe("duplicate");
  });

  it("ignores events from unregistered repositories", async (ctx) => {
    if (!dbUp) return ctx.skip();
    const { ingestWebhookEvent } = await import("./ingest");
    const result = await ingestWebhookEvent("push", `test-${Date.now()}-x`, {
      repository: { full_name: "someone-else/unknown-repo" },
      commits: [{ id: "1" }],
    });
    expect(result.outcome).toBe("unregistered_repository");
  });

  it("merges snapshot patches without losing private detail", async (ctx) => {
    if (!dbUp) return ctx.skip();
    const { patchSnapshot } = await import("@/server/projects/store");
    const { db, schema } = await import("@/server/db/client");
    const { eq } = await import("drizzle-orm");

    await patchSnapshot("kubli", {
      ciStatus: "passing",
      private: { activeBranches: ["main"] },
    });
    await patchSnapshot("kubli", { lastPushedAt: "2026-08-14T00:00:00Z" });

    const rows = await db
      .select()
      .from(schema.projectSnapshots)
      .where(eq(schema.projectSnapshots.projectSlug, "kubli"));
    const data = rows[0].data as {
      ciStatus?: string;
      lastPushedAt?: string;
      private?: { activeBranches?: string[] };
    };
    expect(data.ciStatus).toBe("passing");
    expect(data.lastPushedAt).toBe("2026-08-14T00:00:00Z");
    expect(data.private?.activeBranches).toEqual(["main"]);
  });
});
