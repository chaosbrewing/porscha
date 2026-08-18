import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

/**
 * DB-backed sale-ownership tests. Skipped when Postgres is down.
 *
 * The predicates in `transitions.test.ts` state the rule; these prove
 * the SQL enforces the same one, since the conditions live in WHERE
 * clauses where a unit test cannot reach them. The late-session case is
 * the reason this file exists: it is the one that loses a sale to the
 * wrong buyer if the ownership term is ever dropped.
 */

const SLUG = "sales-test-original";
const SESSION_A = "cs_test_session_A";
const SESSION_B = "cs_test_session_B";
let dbUp = false;

async function seed(overrides: Record<string, unknown> = {}) {
  const { db, schema } = await import("@/server/db/client");
  await db
    .insert(schema.galleryItems)
    .values({
      slug: SLUG,
      title: "Sales Test Original",
      category: "digital",
      origin: "console",
      mediaPath: "/gallery/test.svg",
      alt: "test",
      forSale: true,
      priceCents: 85_000,
      currency: "AUD",
      ...overrides,
    })
    .onConflictDoUpdate({
      target: schema.galleryItems.slug,
      set: {
        soldAt: null,
        reservedUntil: null,
        stripeSessionId: null,
        stripePaymentIntentId: null,
        forSale: true,
        priceCents: 85_000,
        ...overrides,
      },
    });
}

async function readRow() {
  const { db, schema } = await import("@/server/db/client");
  const { eq } = await import("drizzle-orm");
  const [row] = await db
    .select()
    .from(schema.galleryItems)
    .where(eq(schema.galleryItems.slug, SLUG));
  return row;
}

async function cleanup() {
  const { db, schema } = await import("@/server/db/client");
  const { eq } = await import("drizzle-orm");
  await db.delete(schema.galleryItems).where(eq(schema.galleryItems.slug, SLUG));
}

beforeAll(async () => {
  const { dbHealthy } = await import("@/server/projects/store");
  dbUp = await dbHealthy().catch(() => false);
  if (dbUp) await cleanup();
});

afterAll(async () => {
  if (dbUp) await cleanup();
});

beforeEach(async () => {
  if (dbUp) await seed();
});

describe("sale ownership (SQL)", () => {
  it("marks sold when the paying session owns the reservation", async (ctx) => {
    if (!dbUp) return ctx.skip();
    const { attachSession, markSold } = await import("./service");
    const until = new Date(Date.now() + 30 * 60_000);

    await seed({ reservedUntil: until });
    expect(await attachSession(SLUG, until, SESSION_A)).toBe(true);
    expect(await markSold(SLUG, SESSION_A, "pi_1")).toBe(true);

    const row = await readRow();
    expect(row.soldAt).not.toBeNull();
    expect(row.stripePaymentIntentId).toBe("pi_1");
    expect(row.reservedUntil).toBeNull();
  });

  it("is a no-op when the same webhook is redelivered", async (ctx) => {
    if (!dbUp) return ctx.skip();
    const { attachSession, markSold } = await import("./service");
    const until = new Date(Date.now() + 30 * 60_000);

    await seed({ reservedUntil: until });
    await attachSession(SLUG, until, SESSION_A);
    expect(await markSold(SLUG, SESSION_A, "pi_1")).toBe(true);
    // Stripe retries; the second delivery must change nothing.
    expect(await markSold(SLUG, SESSION_A, "pi_1")).toBe(false);
  });

  it("refuses a late payment from a session that no longer holds it", async (ctx) => {
    if (!dbUp) return ctx.skip();
    const { attachSession, markSold } = await import("./service");

    // A reserves, opens a checkout, then abandons it.
    const aUntil = new Date(Date.now() - 60_000); // already lapsed
    await seed({ reservedUntil: aUntil });
    await attachSession(SLUG, aUntil, SESSION_A);

    // B claims the lapsed piece; the claim clears A's session id.
    const bUntil = new Date(Date.now() + 30 * 60_000);
    await seed({ reservedUntil: bUntil, stripeSessionId: null });
    expect(await attachSession(SLUG, bUntil, SESSION_B)).toBe(true);

    // A's late paid webhook arrives. It must not sell.
    expect(await markSold(SLUG, SESSION_A, "pi_late")).toBe(false);

    const row = await readRow();
    expect(row.soldAt).toBeNull();
    expect(row.stripeSessionId).toBe(SESSION_B);
    expect(row.stripePaymentIntentId).toBeNull();

    // B's own payment still completes.
    expect(await markSold(SLUG, SESSION_B, "pi_b")).toBe(true);
    expect((await readRow()).stripePaymentIntentId).toBe("pi_b");
  });

  it("does not let a stale expiry free a newer reservation", async (ctx) => {
    if (!dbUp) return ctx.skip();
    const { attachSession, releaseIfSession } = await import("./service");

    const bUntil = new Date(Date.now() + 30 * 60_000);
    await seed({ reservedUntil: bUntil });
    await attachSession(SLUG, bUntil, SESSION_B);

    // A's abandoned session expires late.
    expect(await releaseIfSession(SLUG, SESSION_A)).toBe(false);

    const row = await readRow();
    expect(row.stripeSessionId).toBe(SESSION_B);
    expect(row.reservedUntil).not.toBeNull();
  });

  it("releases when the expiring session is the one holding it", async (ctx) => {
    if (!dbUp) return ctx.skip();
    const { attachSession, releaseIfSession } = await import("./service");

    const until = new Date(Date.now() + 30 * 60_000);
    await seed({ reservedUntil: until });
    await attachSession(SLUG, until, SESSION_A);

    expect(await releaseIfSession(SLUG, SESSION_A)).toBe(true);
    const row = await readRow();
    expect(row.reservedUntil).toBeNull();
    expect(row.stripeSessionId).toBeNull();
  });
});

describe("claim rollback (SQL)", () => {
  it("releases the claim the failing request made", async (ctx) => {
    if (!dbUp) return ctx.skip();
    const { releaseClaim } = await import("./service");

    const until = new Date(Date.now() + 30 * 60_000);
    await seed({ reservedUntil: until });

    expect(await releaseClaim(SLUG, until)).toBe(true);
    const row = await readRow();
    expect(row.reservedUntil).toBeNull();
    // Freed immediately rather than stranded for the full hold.
    expect(row.soldAt).toBeNull();
  });

  it("never clears a newer buyer's reservation", async (ctx) => {
    if (!dbUp) return ctx.skip();
    const { releaseClaim } = await import("./service");

    const mine = new Date(Date.now() + 10 * 60_000);
    const newer = new Date(Date.now() + 30 * 60_000);
    await seed({ reservedUntil: newer, stripeSessionId: SESSION_B });

    // The failed request tries to roll back its own, older claim.
    expect(await releaseClaim(SLUG, mine)).toBe(false);

    const row = await readRow();
    expect(row.reservedUntil).not.toBeNull();
    expect(row.stripeSessionId).toBe(SESSION_B);
  });

  it("is idempotent", async (ctx) => {
    if (!dbUp) return ctx.skip();
    const { releaseClaim } = await import("./service");

    const until = new Date(Date.now() + 30 * 60_000);
    await seed({ reservedUntil: until });
    expect(await releaseClaim(SLUG, until)).toBe(true);
    expect(await releaseClaim(SLUG, until)).toBe(false);
  });

  it("does not attach a session to a reservation that moved on", async (ctx) => {
    if (!dbUp) return ctx.skip();
    const { attachSession } = await import("./service");

    const mine = new Date(Date.now() + 10 * 60_000);
    const newer = new Date(Date.now() + 30 * 60_000);
    await seed({ reservedUntil: newer });

    expect(await attachSession(SLUG, mine, SESSION_A)).toBe(false);
    expect((await readRow()).stripeSessionId).toBeNull();
  });
});
