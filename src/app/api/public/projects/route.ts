import { NextResponse } from "next/server";
import { getPublicProjects } from "@/server/projects/service";

export const dynamic = "force-dynamic";

/**
 * Public projects API. Serves `PublicProjectView` only — the privacy
 * boundary is enforced in the transformer, not here and not in the UI.
 */
export async function GET() {
  const { projects, degraded } = await getPublicProjects();
  return NextResponse.json(
    { projects, degraded },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
