import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import * as OTPAuth from "otpauth";
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import { env } from "@/server/env";
import {
  decryptSecret,
  encryptSecret,
  hashRecoveryCode,
} from "./secret-crypto";

/**
 * Two-factor authentication service.
 *
 * TOTP verification uses the maintained `otpauth` library (RFC 6238)
 * with a ±1 time-step window. Secrets are AES-256-GCM encrypted at
 * rest; recovery codes are stored as SHA-256 hashes only. Nothing in
 * this module ever logs a secret, a code, or the encryption key.
 */

const TOTP_PERIOD = 30;
const TOTP_DIGITS = 6;
const RECOVERY_CODE_COUNT = 10;

/* Rate limiting: after this many failed verifications inside the
 * window, verification pauses for the cooldown. Server-side state,
 * persisted in security_events. */
const RATE_LIMIT_MAX_FAILURES = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60_000;
const RATE_LIMIT_COOLDOWN_MS = 5 * 60_000;

const ISSUER = "porscha.today";

function buildTotp(secretBase32: string, label: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: ISSUER,
    label,
    algorithm: "SHA1",
    digits: TOTP_DIGITS,
    period: TOTP_PERIOD,
    secret: OTPAuth.Secret.fromBase32(secretBase32),
  });
}

export function generateTotpSecret(): string {
  return new OTPAuth.Secret({ size: 20 }).base32;
}

export function provisioningUri(secretBase32: string, label: string): string {
  return buildTotp(secretBase32, label).toString();
}

/**
 * Pure TOTP check with clock-skew window. Returns the matched
 * time-step counter, or null when the code is invalid.
 */
export function verifyTotpCode(
  secretBase32: string,
  code: string,
  now = Date.now(),
): number | null {
  const cleaned = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(cleaned)) return null;
  const totp = buildTotp(secretBase32, "verify");
  const delta = totp.validate({ token: cleaned, window: 1, timestamp: now });
  if (delta === null) return null;
  return Math.floor(now / 1000 / TOTP_PERIOD) + delta;
}

/** Recovery codes look like "K7GT-M2QD-4W": 10 random base32 chars. */
export function generateRecoveryCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTVWXYZ23456789"; // no easily-confused chars
  const bytes = randomBytes(10);
  let raw = "";
  for (const b of bytes) raw += alphabet[b % alphabet.length];
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 10)}`;
}

/* ------------------------- Security events ------------------------ */

export type SecurityEventType =
  | "twofactor_enrolled"
  | "twofactor_verified"
  | "totp_failed"
  | "recovery_code_used"
  | "recovery_failed"
  | "recovery_codes_regenerated"
  | "authenticator_replaced"
  | "verification_rate_limited"
  | "login_denied_unauthorized";

export async function recordSecurityEvent(
  userId: string | null,
  type: SecurityEventType,
  detail?: Record<string, unknown>,
): Promise<void> {
  await db
    .insert(schema.securityEvents)
    .values({ id: randomUUID(), userId, type, detail: detail ?? null })
    .catch((err) => {
      console.error("[security] failed to record event type=%s", type, err);
    });
}

export async function listSecurityEvents(userId: string, limit = 20) {
  return db
    .select()
    .from(schema.securityEvents)
    .where(eq(schema.securityEvents.userId, userId))
    .orderBy(desc(schema.securityEvents.createdAt))
    .limit(limit);
}

/* -------------------------- Rate limiting ------------------------- */

export type RateLimitState =
  | { limited: false; recentFailures: number }
  | { limited: true; retryAfterSeconds: number };

export async function checkVerificationRateLimit(
  userId: string,
  now = new Date(),
): Promise<RateLimitState> {
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);
  const rows = await db
    .select({
      createdAt: schema.securityEvents.createdAt,
      type: schema.securityEvents.type,
    })
    .from(schema.securityEvents)
    .where(
      and(
        eq(schema.securityEvents.userId, userId),
        gt(schema.securityEvents.createdAt, windowStart),
      ),
    )
    .orderBy(desc(schema.securityEvents.createdAt))
    .limit(50);

  const failures = rows.filter(
    (r) => r.type === "totp_failed" || r.type === "recovery_failed",
  );
  if (failures.length < RATE_LIMIT_MAX_FAILURES) {
    return { limited: false, recentFailures: failures.length };
  }
  const newest = failures[0].createdAt.getTime();
  const releaseAt = newest + RATE_LIMIT_COOLDOWN_MS;
  if (now.getTime() >= releaseAt) {
    return { limited: false, recentFailures: 0 };
  }
  return {
    limited: true,
    retryAfterSeconds: Math.ceil((releaseAt - now.getTime()) / 1000),
  };
}

/* ------------------------- Enrollment state ----------------------- */

export type TwoFactorStatus = {
  enrolled: boolean;
  enabledAt: Date | null;
  recoveryCodesRemaining: number;
};

export async function getTwoFactorRow(userId: string) {
  const rows = await db
    .select()
    .from(schema.userTwoFactor)
    .where(eq(schema.userTwoFactor.userId, userId));
  return rows[0] ?? null;
}

export async function getTwoFactorStatus(
  userId: string,
): Promise<TwoFactorStatus> {
  const row = await getTwoFactorRow(userId);
  const remaining = row?.enabledAt
    ? await db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.recoveryCodes)
        .where(
          and(
            eq(schema.recoveryCodes.userId, userId),
            isNull(schema.recoveryCodes.consumedAt),
          ),
        )
        .then((r) => r[0]?.count ?? 0)
    : 0;
  return {
    enrolled: Boolean(row?.enabledAt),
    enabledAt: row?.enabledAt ?? null,
    recoveryCodesRemaining: remaining,
  };
}

/**
 * Start (or restart) enrollment: generates a fresh secret, stores it
 * encrypted with enrollment incomplete, and returns the provisioning
 * details for the QR code. Refuses to touch an enabled enrollment.
 */
export async function beginEnrollment(
  userId: string,
  accountLabel: string,
): Promise<{ secret: string; uri: string }> {
  const existing = await getTwoFactorRow(userId);
  if (existing?.enabledAt) {
    throw new Error("Two-factor authentication is already enabled");
  }
  const secret = generateTotpSecret();
  const secretEnc = encryptSecret(secret, env.TWO_FACTOR_ENCRYPTION_KEY);
  await db
    .insert(schema.userTwoFactor)
    .values({ userId, secretEnc })
    .onConflictDoUpdate({
      target: schema.userTwoFactor.userId,
      set: { secretEnc, enabledAt: null, lastUsedCounter: 0 },
    });
  return { secret, uri: provisioningUri(secret, accountLabel) };
}

/**
 * Idempotent enrollment start: reuses the in-progress secret so a page
 * refresh doesn't silently invalidate an already-scanned QR code.
 */
export async function getOrBeginEnrollment(
  userId: string,
  accountLabel: string,
): Promise<{ secret: string; uri: string }> {
  const existing = await getTwoFactorRow(userId);
  if (existing && !existing.enabledAt) {
    const secret = decryptSecret(
      existing.secretEnc,
      env.TWO_FACTOR_ENCRYPTION_KEY,
    );
    return { secret, uri: provisioningUri(secret, accountLabel) };
  }
  return beginEnrollment(userId, accountLabel);
}

/**
 * Complete enrollment: verify the first code against the pending
 * secret, enable 2FA, and mint recovery codes (returned exactly once).
 */
export async function completeEnrollment(
  userId: string,
  code: string,
): Promise<{ ok: false } | { ok: true; recoveryCodes: string[] }> {
  const row = await getTwoFactorRow(userId);
  if (!row || row.enabledAt) return { ok: false };
  const secret = decryptSecret(row.secretEnc, env.TWO_FACTOR_ENCRYPTION_KEY);
  const counter = verifyTotpCode(secret, code);
  if (counter === null) {
    await recordSecurityEvent(userId, "totp_failed", { phase: "enrollment" });
    return { ok: false };
  }
  const codes = await issueRecoveryCodes(userId);
  await db
    .update(schema.userTwoFactor)
    .set({ enabledAt: new Date(), lastUsedCounter: counter })
    .where(eq(schema.userTwoFactor.userId, userId));
  await recordSecurityEvent(userId, "twofactor_enrolled");
  return { ok: true, recoveryCodes: codes };
}

async function issueRecoveryCodes(userId: string): Promise<string[]> {
  await db
    .delete(schema.recoveryCodes)
    .where(eq(schema.recoveryCodes.userId, userId));
  const codes: string[] = [];
  for (let i = 0; i < RECOVERY_CODE_COUNT; i++) {
    const code = generateRecoveryCode();
    codes.push(code);
    await db.insert(schema.recoveryCodes).values({
      id: randomUUID(),
      userId,
      codeHash: hashRecoveryCode(code),
    });
  }
  return codes;
}

/* -------------------------- Verification -------------------------- */

export type VerificationResult =
  | { outcome: "ok"; method: "totp" }
  | { outcome: "ok"; method: "recovery"; remaining: number }
  | { outcome: "invalid" }
  | { outcome: "rate_limited"; retryAfterSeconds: number };

/** Verify a TOTP code for an enrolled user (with replay prevention). */
export async function verifyTotpForUser(
  userId: string,
  code: string,
  now = Date.now(),
): Promise<VerificationResult> {
  const limit = await checkVerificationRateLimit(userId, new Date(now));
  if (limit.limited) {
    await recordSecurityEvent(userId, "verification_rate_limited");
    return {
      outcome: "rate_limited",
      retryAfterSeconds: limit.retryAfterSeconds,
    };
  }
  const row = await getTwoFactorRow(userId);
  if (!row?.enabledAt) return { outcome: "invalid" };
  const secret = decryptSecret(row.secretEnc, env.TWO_FACTOR_ENCRYPTION_KEY);
  const counter = verifyTotpCode(secret, code, now);
  if (counter === null || counter <= row.lastUsedCounter) {
    // A replayed counter is treated exactly like a wrong code.
    await recordSecurityEvent(userId, "totp_failed", { phase: "login" });
    return { outcome: "invalid" };
  }
  await db
    .update(schema.userTwoFactor)
    .set({ lastUsedCounter: counter })
    .where(eq(schema.userTwoFactor.userId, userId));
  await recordSecurityEvent(userId, "twofactor_verified", { method: "totp" });
  return { outcome: "ok", method: "totp" };
}

/** Verify and consume a single-use recovery code. */
export async function verifyRecoveryCodeForUser(
  userId: string,
  code: string,
): Promise<VerificationResult> {
  const limit = await checkVerificationRateLimit(userId);
  if (limit.limited) {
    await recordSecurityEvent(userId, "verification_rate_limited");
    return {
      outcome: "rate_limited",
      retryAfterSeconds: limit.retryAfterSeconds,
    };
  }
  const hash = hashRecoveryCode(code);
  // Atomic consume: only an unconsumed row flips, so reuse fails.
  const consumed = await db
    .update(schema.recoveryCodes)
    .set({ consumedAt: new Date() })
    .where(
      and(
        eq(schema.recoveryCodes.userId, userId),
        eq(schema.recoveryCodes.codeHash, hash),
        isNull(schema.recoveryCodes.consumedAt),
      ),
    );
  if ((consumed.rowCount ?? 0) === 0) {
    await recordSecurityEvent(userId, "recovery_failed");
    return { outcome: "invalid" };
  }
  const status = await getTwoFactorStatus(userId);
  await recordSecurityEvent(userId, "recovery_code_used", {
    remaining: status.recoveryCodesRemaining,
  });
  return {
    outcome: "ok",
    method: "recovery",
    remaining: status.recoveryCodesRemaining,
  };
}

/* --------------------- Regeneration / replacement ------------------ */

/** Regenerate recovery codes; requires a fresh, valid TOTP code. */
export async function regenerateRecoveryCodes(
  userId: string,
  totpCode: string,
  now = Date.now(),
): Promise<{ ok: false; reason: VerificationResult } | { ok: true; codes: string[] }> {
  const check = await verifyTotpForUser(userId, totpCode, now);
  if (check.outcome !== "ok") return { ok: false, reason: check };
  const codes = await issueRecoveryCodes(userId);
  await recordSecurityEvent(userId, "recovery_codes_regenerated");
  return { ok: true, codes };
}

/**
 * Begin replacing the authenticator: requires a fresh TOTP challenge
 * from the CURRENT authenticator, then stages a new pending secret.
 */
export async function beginAuthenticatorReplacement(
  userId: string,
  currentCode: string,
  accountLabel: string,
  now = Date.now(),
): Promise<
  | { ok: false; reason: VerificationResult }
  | { ok: true; secret: string; uri: string }
> {
  const check = await verifyTotpForUser(userId, currentCode, now);
  if (check.outcome !== "ok") return { ok: false, reason: check };
  const secret = generateTotpSecret();
  await db
    .update(schema.userTwoFactor)
    .set({
      pendingSecretEnc: encryptSecret(secret, env.TWO_FACTOR_ENCRYPTION_KEY),
    })
    .where(eq(schema.userTwoFactor.userId, userId));
  return { ok: true, secret, uri: provisioningUri(secret, accountLabel) };
}

/**
 * Confirm the replacement with a code from the NEW authenticator.
 * Swaps secrets and invalidates every existing session.
 */
export async function confirmAuthenticatorReplacement(
  userId: string,
  newCode: string,
  now = Date.now(),
): Promise<{ ok: boolean; invalidatedAt?: Date }> {
  const row = await getTwoFactorRow(userId);
  if (!row?.enabledAt || !row.pendingSecretEnc) return { ok: false };
  const pending = decryptSecret(
    row.pendingSecretEnc,
    env.TWO_FACTOR_ENCRYPTION_KEY,
  );
  const counter = verifyTotpCode(pending, newCode, now);
  if (counter === null) {
    await recordSecurityEvent(userId, "totp_failed", { phase: "replacement" });
    return { ok: false };
  }
  const invalidatedAt = new Date();
  await db
    .update(schema.userTwoFactor)
    .set({
      secretEnc: row.pendingSecretEnc,
      pendingSecretEnc: null,
      lastUsedCounter: counter,
      sessionsInvalidatedAt: invalidatedAt,
    })
    .where(eq(schema.userTwoFactor.userId, userId));
  await recordSecurityEvent(userId, "authenticator_replaced");
  return { ok: true, invalidatedAt };
}

/** Sessions issued at or before this instant are rejected. */
export async function getSessionsInvalidatedAt(
  userId: string,
): Promise<Date | null> {
  const row = await getTwoFactorRow(userId);
  return row?.sessionsInvalidatedAt ?? null;
}
