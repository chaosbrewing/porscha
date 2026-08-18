import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Stripe webhook signature verification (Stripe-Signature header).
 *
 * The header looks like `t=1699999999,v1=<hex>,v1=<hex>`; the signed
 * payload is `${t}.${rawBody}`. Multiple v1 values appear during a
 * secret rotation, so any match counts.
 *
 * The timestamp check is not decoration: without it a captured payload
 * and its signature stay replayable forever.
 */
export function verifyStripeSignature(
  secret: string,
  rawBody: string,
  signatureHeader: string | null,
  toleranceSeconds = 300,
  nowMs: number = Date.now(),
): boolean {
  if (!signatureHeader) return false;

  let timestamp: string | null = null;
  const provided: string[] = [];
  for (const part of signatureHeader.split(",")) {
    const [k, v] = part.trim().split("=");
    if (k === "t") timestamp = v ?? null;
    else if (k === "v1" && v) provided.push(v);
  }
  if (!timestamp || provided.length === 0) return false;

  const sent = Number(timestamp);
  if (!Number.isFinite(sent)) return false;
  if (Math.abs(nowMs / 1000 - sent) > toleranceSeconds) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  return provided.some((candidate) => {
    if (candidate.length !== expected.length) return false;
    try {
      return timingSafeEqual(
        Buffer.from(candidate, "hex"),
        Buffer.from(expected, "hex"),
      );
    } catch {
      return false;
    }
  });
}
