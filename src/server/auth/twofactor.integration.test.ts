import { afterAll, beforeAll, describe, expect, it } from "vitest";
import * as OTPAuth from "otpauth";

/**
 * DB-backed 2FA lifecycle tests: enrollment, encrypted storage,
 * verification, replay, recovery codes, rate limiting, and
 * authenticator replacement. Skipped when Postgres is unreachable.
 */

const USER_ID = "github:tfa-test-user";
let dbUp = false;

function codeFor(secret: string, atMs = Date.now()): string {
  return new OTPAuth.TOTP({
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  }).generate({ timestamp: atMs });
}

/** A code from the NEXT time step — valid within the ±1 window and
 *  always ahead of the last-used counter. */
function nextStepCode(secret: string): string {
  return codeFor(secret, Date.now() + 30_000);
}

async function cleanup() {
  const { db, schema } = await import("@/server/db/client");
  const { eq } = await import("drizzle-orm");
  await db
    .delete(schema.securityEvents)
    .where(eq(schema.securityEvents.userId, USER_ID));
  await db.delete(schema.users).where(eq(schema.users.id, USER_ID));
}

beforeAll(async () => {
  const { dbHealthy, touchUser } = await import("@/server/projects/store");
  dbUp = await dbHealthy();
  if (!dbUp) return;
  await cleanup();
  await touchUser({
    id: USER_ID,
    githubLogin: "tfa-test-user",
    displayName: null,
    avatarUrl: null,
  });
});

afterAll(async () => {
  if (dbUp) await cleanup();
});

describe("2FA lifecycle (integration)", () => {
  let secret = "";
  let recoveryCodes: string[] = [];

  it("begins enrollment with an encrypted secret at rest", async (ctx) => {
    if (!dbUp) return ctx.skip();
    const tf = await import("./twofactor");
    const enrollment = await tf.beginEnrollment(USER_ID, "tfa-test-user");
    secret = enrollment.secret;
    expect(enrollment.uri).toContain("porscha.today");

    const row = await tf.getTwoFactorRow(USER_ID);
    expect(row).not.toBeNull();
    expect(row!.enabledAt).toBeNull();
    // TOTP secret is never stored in plaintext.
    expect(row!.secretEnc).not.toContain(secret);
    expect(row!.secretEnc.startsWith("v1.")).toBe(true);
  });

  it("keeps the same secret across enrollment-page refreshes", async (ctx) => {
    if (!dbUp) return ctx.skip();
    const tf = await import("./twofactor");
    const again = await tf.getOrBeginEnrollment(USER_ID, "tfa-test-user");
    expect(again.secret).toBe(secret);
  });

  it("rejects a wrong code during enrollment", async (ctx) => {
    if (!dbUp) return ctx.skip();
    const tf = await import("./twofactor");
    const wrong = codeFor(secret) === "000000" ? "000001" : "000000";
    const result = await tf.completeEnrollment(USER_ID, wrong);
    expect(result.ok).toBe(false);
  });

  it("enrolls with the correct code and issues 10 recovery codes", async (ctx) => {
    if (!dbUp) return ctx.skip();
    const tf = await import("./twofactor");
    const result = await tf.completeEnrollment(USER_ID, codeFor(secret));
    expect(result.ok).toBe(true);
    if (result.ok) recoveryCodes = result.recoveryCodes;
    expect(recoveryCodes).toHaveLength(10);

    const status = await tf.getTwoFactorStatus(USER_ID);
    expect(status.enrolled).toBe(true);
    expect(status.recoveryCodesRemaining).toBe(10);
  });

  it("stores only hashes of recovery codes", async (ctx) => {
    if (!dbUp) return ctx.skip();
    const { db, schema } = await import("@/server/db/client");
    const { eq } = await import("drizzle-orm");
    const rows = await db
      .select()
      .from(schema.recoveryCodes)
      .where(eq(schema.recoveryCodes.userId, USER_ID));
    for (const row of rows) {
      expect(row.codeHash).toMatch(/^[0-9a-f]{64}$/);
      for (const code of recoveryCodes) {
        expect(row.codeHash).not.toContain(code.replace(/-/g, ""));
      }
    }
  });

  it("verifies a fresh TOTP code", async (ctx) => {
    if (!dbUp) return ctx.skip();
    const tf = await import("./twofactor");
    const result = await tf.verifyTotpForUser(USER_ID, nextStepCode(secret));
    expect(result.outcome).toBe("ok");
  });

  it("rejects a replay of the just-used time step", async (ctx) => {
    if (!dbUp) return ctx.skip();
    const tf = await import("./twofactor");
    const result = await tf.verifyTotpForUser(USER_ID, nextStepCode(secret));
    expect(result.outcome).toBe("invalid");
  });

  it("accepts a recovery code exactly once", async (ctx) => {
    if (!dbUp) return ctx.skip();
    const tf = await import("./twofactor");
    const first = await tf.verifyRecoveryCodeForUser(USER_ID, recoveryCodes[0]);
    expect(first.outcome).toBe("ok");
    if (first.outcome === "ok" && first.method === "recovery") {
      expect(first.remaining).toBe(9);
    }
    const reuse = await tf.verifyRecoveryCodeForUser(USER_ID, recoveryCodes[0]);
    expect(reuse.outcome).toBe("invalid");
  });

  it("regenerating recovery codes invalidates the old set", async (ctx) => {
    if (!dbUp) return ctx.skip();
    const tf = await import("./twofactor");
    const t = Date.now() + 60_000;
    const result = await tf.regenerateRecoveryCodes(
      USER_ID,
      codeFor(secret, t),
      t,
    );
    expect(result.ok).toBe(true);
    const oldCode = recoveryCodes[1];
    if (result.ok) recoveryCodes = result.codes;
    const status = await tf.getTwoFactorStatus(USER_ID);
    expect(status.recoveryCodesRemaining).toBe(10);
    const reuse = await tf.verifyRecoveryCodeForUser(USER_ID, oldCode);
    expect(reuse.outcome).toBe("invalid");
  });

  it("replacing the authenticator swaps secrets and invalidates sessions", async (ctx) => {
    if (!dbUp) return ctx.skip();
    const tf = await import("./twofactor");
    const t1 = Date.now() + 120_000;
    const start = await tf.beginAuthenticatorReplacement(
      USER_ID,
      codeFor(secret, t1),
      "tfa-test-user",
      t1,
    );
    expect(start.ok).toBe(true);
    if (!start.ok) return;
    const newSecret = start.secret;
    expect(newSecret).not.toBe(secret);

    const confirm = await tf.confirmAuthenticatorReplacement(
      USER_ID,
      codeFor(newSecret, t1),
      t1,
    );
    expect(confirm.ok).toBe(true);
    expect(confirm.invalidatedAt).toBeInstanceOf(Date);

    const invalidatedAt = await tf.getSessionsInvalidatedAt(USER_ID);
    expect(invalidatedAt).not.toBeNull();

    // The old authenticator no longer works.
    const t2 = t1 + 60_000;
    const oldAttempt = await tf.verifyTotpForUser(
      USER_ID,
      codeFor(secret, t2),
      t2,
    );
    expect(oldAttempt.outcome).toBe("invalid");
    secret = newSecret;
  });

  it("rate-limits after repeated failures without leaking detail", async (ctx) => {
    if (!dbUp) return ctx.skip();
    const tf = await import("./twofactor");
    for (let i = 0; i < 5; i++) {
      await tf.verifyTotpForUser(USER_ID, "000000");
    }
    const t3 = Date.now() + 240_000;
    const limited = await tf.verifyTotpForUser(
      USER_ID,
      codeFor(secret, t3),
      t3,
    );
    expect(limited.outcome).toBe("rate_limited");
    if (limited.outcome === "rate_limited") {
      expect(limited.retryAfterSeconds).toBeGreaterThan(0);
    }
    // Failure events record no submitted values.
    const events = await tf.listSecurityEvents(USER_ID, 50);
    for (const e of events) {
      expect(JSON.stringify(e.detail ?? {})).not.toContain("000000");
    }
  });
});
