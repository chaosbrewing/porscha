import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * GitHub webhook signature verification (X-Hub-Signature-256).
 * Constant-time comparison; returns false for anything malformed.
 */
export function verifyWebhookSignature(
  secret: string,
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const provided = signatureHeader.slice("sha256=".length);
  if (provided.length !== expected.length) return false;
  try {
    return timingSafeEqual(
      Buffer.from(provided, "hex"),
      Buffer.from(expected, "hex"),
    );
  } catch {
    return false;
  }
}
