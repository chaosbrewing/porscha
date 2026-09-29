import "server-only";

/**
 * Trust for the scheduled sync.
 *
 * Cloudflare's Cron Trigger runs `scheduled()` in workers/entry.js,
 * which has no session and no way to import app code, so it asks the
 * app over HTTP. Anyone can send that request too, so the entry sets a
 * random token on the isolate's global at start-up and sends it along;
 * the route accepts only a match. The token never leaves the isolate,
 * needs no secret management, and is absent in Node (dev, build,
 * tests), where the route simply reports itself unavailable.
 */

const KEY = "__porschaCronToken";

export const CRON_HEADER = "x-porscha-cron";

export function cronToken(): string | undefined {
  const value = (globalThis as Record<string, unknown>)[KEY];
  return typeof value === "string" && value.length >= 16 ? value : undefined;
}

/** Constant-time comparison so the token cannot be guessed byte by byte. */
export function cronRequestIsTrusted(header: string | null): boolean {
  const expected = cronToken();
  if (!expected || !header || header.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ header.charCodeAt(i);
  }
  return diff === 0;
}
