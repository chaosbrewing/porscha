import { NextRequest, NextResponse } from "next/server";
import { env } from "@/server/env";
import { requireConsoleAccess } from "@/server/auth/guard";
import { syncAllProjects } from "@/server/github/sync";

export const dynamic = "force-dynamic";

/**
 * Manual reconciliation trigger — the fallback for missed webhooks.
 * POST only, console-authorized, same-origin.
 */
export async function POST(req: NextRequest) {
  const { errorResponse } = await requireConsoleAccess();
  if (errorResponse) return errorResponse;

  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(env.SITE_URL).origin) {
    return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  }

  const result = await syncAllProjects();
  if (result.skipped) {
    return NextResponse.json(
      { ...result, message: "GitHub sync is not configured (no GITHUB_TOKEN)" },
      { status: 200 },
    );
  }
  return NextResponse.json(result);
}
