import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyStripeSignature } from "./verify";

/**
 * Stripe webhook signature tests. This endpoint is the only writer of
 * `sold_at`, so a forged or replayed delivery would mark a piece sold
 * without payment. Treat failures here as release blockers.
 */

const SECRET = "whsec_test_secret";
const BODY = '{"type":"checkout.session.completed"}';

function sign(body: string, timestamp: number, secret = SECRET): string {
  const v1 = createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");
  return `t=${timestamp},v1=${v1}`;
}

describe("verifyStripeSignature", () => {
  const now = 1_700_000_000_000;
  const t = Math.floor(now / 1000);

  it("accepts a correctly signed, fresh delivery", () => {
    expect(verifyStripeSignature(SECRET, BODY, sign(BODY, t), 300, now)).toBe(true);
  });

  it("rejects a missing header", () => {
    expect(verifyStripeSignature(SECRET, BODY, null, 300, now)).toBe(false);
  });

  it("rejects a signature made with the wrong secret", () => {
    const header = sign(BODY, t, "whsec_wrong");
    expect(verifyStripeSignature(SECRET, BODY, header, 300, now)).toBe(false);
  });

  it("rejects a tampered body", () => {
    const header = sign(BODY, t);
    const tampered = '{"type":"checkout.session.completed","extra":1}';
    expect(verifyStripeSignature(SECRET, tampered, header, 300, now)).toBe(false);
  });

  it("rejects a replay outside the tolerance window", () => {
    const old = t - 3600;
    expect(verifyStripeSignature(SECRET, BODY, sign(BODY, old), 300, now)).toBe(false);
  });

  it("accepts any valid v1 during a secret rotation", () => {
    const good = createHmac("sha256", SECRET).update(`${t}.${BODY}`).digest("hex");
    const header = `t=${t},v1=${"0".repeat(64)},v1=${good}`;
    expect(verifyStripeSignature(SECRET, BODY, header, 300, now)).toBe(true);
  });

  it("rejects malformed headers", () => {
    for (const header of ["", "garbage", `t=${t}`, `v1=abc`, `t=nope,v1=abc`]) {
      expect(verifyStripeSignature(SECRET, BODY, header, 300, now)).toBe(false);
    }
  });
});
