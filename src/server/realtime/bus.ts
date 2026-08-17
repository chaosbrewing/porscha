import "server-only";
import { EventEmitter } from "node:events";
import { isCloudflareWorkers, requireCloudflareContext } from "@/server/runtime";

/**
 * Realtime bus, runtime-aware.
 *
 * Node.js (dev/`next start`): an in-process EventEmitter. Webhook
 * ingestion and sync publish here; the console SSE stream subscribes.
 *
 * Cloudflare Workers: requests land on isolates that share no memory —
 * a webhook POST and a console SSE stream will usually be served by
 * different isolates, so an in-process emitter would never deliver.
 * Instead a single Durable Object (`RealtimeHub`, see
 * `workers/realtime-hub.js`) fans events out: publishers POST to it,
 * and the SSE route streams its `/subscribe` response through. The SSE
 * wire format (retry/hello/update/heartbeats) is identical in both
 * runtimes, so the client component needs no changes.
 *
 * The SSE clients also fall back to periodic refresh, so a lost event
 * degrades to a delayed refresh rather than breaking the console.
 */

export type RealtimeEvent =
  | { kind: "activity"; projectSlug: string; activityType: string; at: string }
  | { kind: "snapshot"; projectSlug: string; at: string }
  | { kind: "sync"; status: "started" | "finished" | "failed"; at: string };

export const SSE_HEARTBEAT_MS = 25_000;
export const SSE_RETRY_MS = 5_000;

/* ------------------------- Node.js runtime ------------------------- */

const globalForBus = globalThis as unknown as {
  __porschaBus?: EventEmitter;
};

export const realtimeBus: EventEmitter =
  globalForBus.__porschaBus ?? new EventEmitter();
realtimeBus.setMaxListeners(100);
globalForBus.__porschaBus = realtimeBus;

function createNodeStream(signal: AbortSignal): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      const send = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          // Stream already closed.
        }
      };

      send(`retry: ${SSE_RETRY_MS}\n\n`);
      send(
        `event: hello\ndata: ${JSON.stringify({ at: new Date().toISOString() })}\n\n`,
      );

      const onEvent = (event: RealtimeEvent) => {
        send(`event: update\ndata: ${JSON.stringify(event)}\n\n`);
      };
      realtimeBus.on("event", onEvent);

      const heartbeat = setInterval(() => {
        send(`: heartbeat ${Date.now()}\n\n`);
      }, SSE_HEARTBEAT_MS);

      const cleanup = () => {
        clearInterval(heartbeat);
        realtimeBus.off("event", onEvent);
        try {
          controller.close();
        } catch {
          // Already closed.
        }
      };
      signal.addEventListener("abort", cleanup);
    },
  });
}

/* ----------------------- Workers runtime (DO) ---------------------- */

function getHubStub() {
  const { env } = requireCloudflareContext();
  const namespace = env.REALTIME_HUB;
  if (!namespace) {
    throw new Error(
      "REALTIME_HUB Durable Object binding is not configured " +
        "(see wrangler.jsonc).",
    );
  }
  return namespace.get(namespace.idFromName("global"));
}

/* ------------------------------ API -------------------------------- */

/**
 * Publish a realtime event to every connected console stream. Fire and
 * forget: failures never break ingestion — the console's polling
 * fallback covers a lost event.
 */
export function publishRealtime(event: RealtimeEvent) {
  if (!isCloudflareWorkers) {
    realtimeBus.emit("event", event);
    return;
  }
  try {
    const { ctx } = requireCloudflareContext();
    const delivery = getHubStub()
      .fetch("https://realtime-hub/publish", {
        method: "POST",
        body: JSON.stringify(event),
      })
      .then(() => undefined)
      .catch((err: unknown) => {
        console.error(
          "[realtime] publish failed:",
          err instanceof Error ? err.message : String(err),
        );
      });
    // Keep the delivery alive past the publishing request's response.
    ctx.waitUntil(delivery);
  } catch (err) {
    console.error(
      "[realtime] publish failed:",
      err instanceof Error ? err.message : String(err),
    );
  }
}

/**
 * A complete SSE byte stream (retry + hello + updates + heartbeats)
 * for an already-authorized console client.
 */
export async function createRealtimeStream(
  signal: AbortSignal,
): Promise<ReadableStream<Uint8Array>> {
  if (!isCloudflareWorkers) {
    return createNodeStream(signal);
  }
  const response = await getHubStub().fetch("https://realtime-hub/subscribe", {
    signal,
  });
  if (!response.ok || !response.body) {
    throw new Error(`realtime hub subscribe failed: ${response.status}`);
  }
  return response.body;
}
