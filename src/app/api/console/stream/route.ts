import { NextRequest } from "next/server";
import { checkConsoleAccess } from "@/server/auth/guard";
import { createRealtimeStream } from "@/server/realtime/bus";

export const dynamic = "force-dynamic";

/**
 * Server-Sent Events stream for live console updates. Authorized
 * server-side like every other console route. Emits `update` events
 * when webhooks/sync change project state, plus heartbeat comments so
 * clients can detect a dead connection. The stream itself comes from
 * the runtime-aware bus (in-process on Node, Durable Object fan-out on
 * Cloudflare Workers) with an identical wire format.
 */
export async function GET(req: NextRequest) {
  const access = await checkConsoleAccess();
  if (access.state !== "authorized") {
    return new Response("Unauthorized", { status: 401 });
  }

  const stream = await createRealtimeStream(req.signal);

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
