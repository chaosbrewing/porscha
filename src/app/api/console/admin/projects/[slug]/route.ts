import { NextRequest, NextResponse } from "next/server";
import { requireConsoleAccess } from "@/server/auth/guard";
import { badOrigin, readJson } from "@/server/auth/http";
import { deleteProject, updateProject } from "@/server/projects/admin";
import {
  firstValidationMessage,
  projectAdminInputSchema,
} from "@/server/projects/validation";

export const dynamic = "force-dynamic";

/** Update a project's mutable configuration. two_factor_verified only. */
export async function POST(
  req: NextRequest,
  { params }: RouteContext<"/api/console/admin/projects/[slug]">,
) {
  const origin = badOrigin(req);
  if (origin) return origin;
  const { errorResponse, user } = await requireConsoleAccess();
  if (errorResponse) return errorResponse;

  const { slug } = await params;
  const body = await readJson<unknown>(req);
  const parsed = projectAdminInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: firstValidationMessage(parsed.error) },
      { status: 400 },
    );
  }

  try {
    const result = await updateProject(user!.id, slug, parsed.data);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status ?? 400 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin] update project failed:", err);
    return NextResponse.json(
      { error: "Saving didn't stick — the database may be unavailable." },
      { status: 500 },
    );
  }
}

/** Delete a console-created project. Registry projects are refused. */
export async function DELETE(
  req: NextRequest,
  { params }: RouteContext<"/api/console/admin/projects/[slug]">,
) {
  const origin = badOrigin(req);
  if (origin) return origin;
  const { errorResponse, user } = await requireConsoleAccess();
  if (errorResponse) return errorResponse;

  const { slug } = await params;
  try {
    const result = await deleteProject(user!.id, slug);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status ?? 400 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin] delete project failed:", err);
    return NextResponse.json(
      { error: "Deleting didn't stick — the database may be unavailable." },
      { status: 500 },
    );
  }
}
