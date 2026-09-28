/**
 * Cloudflare Worker entrypoint for porscha.today.
 *
 * Wraps the OpenNext-generated handler (`.open-next/worker.js`, built
 * by `opennextjs-cloudflare build`) with:
 *   - the canonical-host redirect (www.porscha.today → porscha.today)
 *   - the RealtimeHub Durable Object powering console SSE fan-out
 *   - the scheduled GitHub sync (Cron Trigger in wrangler.jsonc)
 *
 * OpenNext's own Durable Objects must be re-exported here because this
 * file replaces the generated worker as the script's main module.
 */
import openNextHandler, {
  DOQueueHandler,
  DOShardedTagCache,
  BucketCachePurge,
} from "../.open-next/worker.js";

export { DOQueueHandler, DOShardedTagCache, BucketCachePurge };
export { RealtimeHub } from "./realtime-hub.js";

const CANONICAL_HOST = "porscha.today";

/**
 * The scheduled sync reaches the app over HTTP, so the app needs a way
 * to tell this Worker's own cron apart from anyone else on the
 * internet. A token minted once per isolate and shared through the
 * global does that without a managed secret; see
 * src/server/github/cron.ts for the other half.
 */
const CRON_TOKEN = crypto.randomUUID() + crypto.randomUUID();
globalThis.__porschaCronToken = CRON_TOKEN;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.hostname === `www.${CANONICAL_HOST}`) {
      url.hostname = CANONICAL_HOST;
      return Response.redirect(url.toString(), 301);
    }
    return openNextHandler.fetch(request, env, ctx);
  },

  /** Cron Trigger: reconcile every project with GitHub. */
  async scheduled(event, env, ctx) {
    const request = new Request(`https://${CANONICAL_HOST}/api/internal/sync`, {
      method: "POST",
      headers: { "x-porscha-cron": CRON_TOKEN },
    });
    ctx.waitUntil(
      openNextHandler
        .fetch(request, env, ctx)
        .then(async (res) => {
          const body = await res.text();
          console.log(`[cron] ${event.cron} → ${res.status} ${body.slice(0, 300)}`);
        })
        .catch((err) => console.error("[cron] sync failed:", err)),
    );
  },
};
