import { NextRequest } from "next/server";
import { checkConsoleAccess } from "@/server/auth/guard";
import { realtimeBus, type RealtimeEvent } from "@/server/realtime/bus";

export const dynamic = "force-dynamic";

const HEARTBEAT_MS = 25_000;

/**
 * Server-Sent Events stream for live console updates. Authorized
 * server-side like every other console route. Emits `update` events
 * when webhooks/sync change project state, plus heartbeat comments so
 * clients can detect a dead connection.
 */
export async function GET(req: NextRequest) {
  const access = await checkConsoleAccess();
  if (access.state !== "authorized") {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          // Stream already closed.
        }
      };

      send(`retry: 5000\n\n`);
      send(`event: hello\ndata: ${JSON.stringify({ at: new Date().toISOString() })}\n\n`);

      const onEvent = (event: RealtimeEvent) => {
        send(`event: update\ndata: ${JSON.stringify(event)}\n\n`);
      };
      realtimeBus.on("event", onEvent);

      const heartbeat = setInterval(() => {
        send(`: heartbeat ${Date.now()}\n\n`);
      }, HEARTBEAT_MS);

      const cleanup = () => {
        clearInterval(heartbeat);
        realtimeBus.off("event", onEvent);
        try {
          controller.close();
        } catch {
          // Already closed.
        }
      };
      req.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
