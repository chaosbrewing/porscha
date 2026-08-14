import { NextResponse } from "next/server";
import { getPublicProject } from "@/server/projects/service";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: RouteContext<"/api/public/projects/[slug]">,
) {
  const { slug } = await params;
  const project = await getPublicProject(slug);
  if (!project) {
    return NextResponse.json({ error: "Unknown project" }, { status: 404 });
  }
  return NextResponse.json(
    { project },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
