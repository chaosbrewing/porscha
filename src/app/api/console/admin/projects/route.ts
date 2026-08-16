import { NextRequest, NextResponse } from "next/server";
import { requireConsoleAccess } from "@/server/auth/guard";
import { badOrigin, readJson } from "@/server/auth/http";
import { createProject } from "@/server/projects/admin";
import {
  firstValidationMessage,
  projectAdminInputSchema,
} from "@/server/projects/validation";

export const dynamic = "force-dynamic";

/** Create a project. two_factor_verified only, like every mutation. */
export async function POST(req: NextRequest) {
  const origin = badOrigin(req);
  if (origin) return origin;
  const { errorResponse, user } = await requireConsoleAccess();
  if (errorResponse) return errorResponse;

  const body = await readJson<unknown>(req);
  const parsed = projectAdminInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: firstValidationMessage(parsed.error) },
      { status: 400 },
    );
  }

  try {
    const result = await createProject(user!.id, parsed.data);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status ?? 400 },
      );
    }
    return NextResponse.json({ ok: true, slug: parsed.data.slug });
  } catch (err) {
    console.error("[admin] create project failed:", err);
    return NextResponse.json(
      { error: "Saving didn't stick — the database may be unavailable." },
      { status: 500 },
    );
  }
}
