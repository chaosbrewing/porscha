/**
 * Cloudflare Worker entrypoint for porscha.today.
 *
 * Wraps the OpenNext-generated handler (`.open-next/worker.js`, built
 * by `opennextjs-cloudflare build`) with:
 *   - the canonical-host redirect (www.porscha.today → porscha.today)
 *   - the RealtimeHub Durable Object powering console SSE fan-out
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

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.hostname === `www.${CANONICAL_HOST}`) {
      url.hostname = CANONICAL_HOST;
      return Response.redirect(url.toString(), 301);
    }
    return openNextHandler.fetch(request, env, ctx);
  },
};
