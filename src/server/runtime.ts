import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Runtime detection for the Cloudflare Workers deployment.
 *
 * The application runs in two server runtimes:
 *  - Node.js: `next dev`, `next build` (prerendering), `next start`,
 *    and the vitest suite.
 *  - Cloudflare Workers (workerd): production via @opennextjs/cloudflare.
 *
 * workerd identifies itself through `navigator.userAgent`, which is the
 * mechanism Cloudflare documents for feature detection. Everything
 * runtime-specific (database connection, content source, realtime bus)
 * branches on this exactly once, inside its own adapter module — the
 * service and route layers stay runtime-agnostic.
 */
export const isCloudflareWorkers =
  typeof navigator !== "undefined" &&
  navigator.userAgent === "Cloudflare-Workers";

/**
 * The Cloudflare request context (bindings + execution context).
 * Only callable when `isCloudflareWorkers` is true.
 */
export function requireCloudflareContext() {
  if (!isCloudflareWorkers) {
    throw new Error(
      "requireCloudflareContext() called outside the Workers runtime",
    );
  }
  return getCloudflareContext();
}
