import { NextResponse } from "next/server";
import { requireConsoleAccess } from "@/server/auth/guard";
import { getPrivateProject } from "@/server/projects/service";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: RouteContext<"/api/console/projects/[slug]">,
) {
  const { errorResponse } = await requireConsoleAccess();
  if (errorResponse) return errorResponse;
  const { slug } = await params;
  const project = await getPrivateProject(slug);
  if (!project) {
    return NextResponse.json({ error: "Unknown project" }, { status: 404 });
  }
  return NextResponse.json(
    { project },
    { headers: { "Cache-Control": "no-store" } },
  );
}
