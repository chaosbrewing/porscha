import { NextRequest, NextResponse } from "next/server";
import { env } from "@/server/env";
import { verifyWebhookSignature } from "@/server/github/verify";
import { ingestWebhookEvent } from "@/server/github/ingest";

export const dynamic = "force-dynamic";

/**
 * GitHub webhook endpoint.
 * Signature is verified against the raw body before anything is parsed;
 * unsigned or mis-signed deliveries are rejected with 401.
 */
export async function POST(req: NextRequest) {
  if (!env.webhookConfigured) {
    return NextResponse.json(
      { error: "Webhook ingestion is not configured" },
      { status: 503 },
    );
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256");
  if (!verifyWebhookSignature(env.GITHUB_WEBHOOK_SECRET!, rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const eventName = req.headers.get("x-github-event");
  const deliveryId = req.headers.get("x-github-delivery");
  if (!eventName || !deliveryId) {
    return NextResponse.json({ error: "Missing event headers" }, { status: 400 });
  }

  if (eventName === "ping") {
    return NextResponse.json({ ok: true, pong: true });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const result = await ingestWebhookEvent(eventName, deliveryId, payload);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[webhook] ingestion failed:", err);
    // 500 so GitHub retries the delivery; dedup makes retries safe.
    return NextResponse.json({ error: "Ingestion failed" }, { status: 500 });
  }
}
