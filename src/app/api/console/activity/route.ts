import { NextRequest, NextResponse } from "next/server";
import { requireConsoleAccess } from "@/server/auth/guard";
import { getActivityFeed } from "@/server/projects/service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { errorResponse } = await requireConsoleAccess();
  if (errorResponse) return errorResponse;
  const url = new URL(req.url);
  const projectSlug = url.searchParams.get("project") ?? undefined;
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);
  const feed = await getActivityFeed({ projectSlug, limit });
  return NextResponse.json(feed, {
    headers: { "Cache-Control": "no-store" },
  });
}
