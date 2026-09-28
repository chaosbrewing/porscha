import { NextRequest, NextResponse } from "next/server";
import { CRON_HEADER, cronRequestIsTrusted } from "@/server/github/cron";
import { syncAllProjects } from "@/server/github/sync";

export const dynamic = "force-dynamic";

/**
 * Scheduled reconciliation, called by the Worker's Cron Trigger (see
 * workers/entry.js). Not a console endpoint: it trusts only the
 * isolate-local token the entry sends, and otherwise looks like any
 * other missing route.
 */
export async function POST(req: NextRequest) {
  if (!cronRequestIsTrusted(req.headers.get(CRON_HEADER))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const result = await syncAllProjects();
  if (result.skipped) {
    console.log("[cron] sync skipped: GITHUB_TOKEN is not configured");
  } else {
    console.log("[cron] sync complete:", JSON.stringify(result));
  }
  return NextResponse.json(result);
}
