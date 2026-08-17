/**
 * RealtimeHub — Durable Object fanning realtime events out to console
 * SSE streams on Cloudflare Workers.
 *
 * Worker isolates share no memory, so the in-process EventEmitter used
 * by the Node runtime cannot deliver a webhook-triggered event to an
 * SSE stream served by a different isolate. A single named instance of
 * this object ("global") is the meeting point instead:
 *
 *   - `POST /publish` — body is a RealtimeEvent JSON; broadcast to all
 *     connected subscribers as an SSE `update` event.
 *   - `GET /subscribe` — long-lived SSE response used verbatim by
 *     /api/console/stream (which performs authorization first; this
 *     object is only reachable through the Worker's binding, never
 *     from the network).
 *
 * The wire format mirrors src/server/realtime/bus.ts exactly:
 * `retry:` hint, `hello` event, `update` events, and `: heartbeat`
 * comments every 25s so clients can detect a dead connection.
 */

const HEARTBEAT_MS = 25_000;
const RETRY_MS = 5_000;

export class RealtimeHub {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    /** @type {Set<{enqueue: (chunk: Uint8Array) => boolean}>} */
    this.subscribers = new Set();
    this.heartbeatTimer = null;
    this.encoder = new TextEncoder();
  }

  broadcast(text) {
    const chunk = this.encoder.encode(text);
    for (const subscriber of [...this.subscribers]) {
      if (!subscriber.enqueue(chunk)) {
        this.subscribers.delete(subscriber);
      }
    }
    this.stopHeartbeatIfIdle();
  }

  ensureHeartbeat() {
    if (this.heartbeatTimer !== null) return;
    this.heartbeatTimer = setInterval(() => {
      this.broadcast(`: heartbeat ${Date.now()}\n\n`);
    }, HEARTBEAT_MS);
  }

  stopHeartbeatIfIdle() {
    if (this.subscribers.size === 0 && this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/publish") {
      const payload = await request.text();
      this.broadcast(`event: update\ndata: ${payload}\n\n`);
      return new Response(null, { status: 204 });
    }

    if (request.method === "GET" && url.pathname === "/subscribe") {
      const encoder = this.encoder;
      let subscriber;
      const hub = this;
      const stream = new ReadableStream({
        start(controller) {
          subscriber = {
            enqueue(chunk) {
              try {
                controller.enqueue(chunk);
                return true;
              } catch {
                return false;
              }
            },
          };
          hub.subscribers.add(subscriber);
          subscriber.enqueue(encoder.encode(`retry: ${RETRY_MS}\n\n`));
          subscriber.enqueue(
            encoder.encode(
              `event: hello\ndata: ${JSON.stringify({ at: new Date().toISOString() })}\n\n`,
            ),
          );
          hub.ensureHeartbeat();
        },
        cancel() {
          hub.subscribers.delete(subscriber);
          hub.stopHeartbeatIfIdle();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-store, no-transform",
        },
      });
    }

    return new Response("Not found", { status: 404 });
  }
}
