import { NextResponse } from "next/server";
import { requireConsoleAccess } from "@/server/auth/guard";
import { getConsoleOverview } from "@/server/projects/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const { errorResponse } = await requireConsoleAccess();
  if (errorResponse) return errorResponse;
  const overview = await getConsoleOverview();
  return NextResponse.json(overview, {
    headers: { "Cache-Control": "no-store" },
  });
}
