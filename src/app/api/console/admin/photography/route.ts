import { NextRequest, NextResponse } from "next/server";
import { requireConsoleAccess } from "@/server/auth/guard";
import { badOrigin, readJson } from "@/server/auth/http";
import { savePhotography } from "@/server/photography/admin";
import { photographySettingsSchema } from "@/server/photography/validation";
import { firstValidationMessage } from "@/server/projects/validation";

export const dynamic = "force-dynamic";

/** Save every photography slot at once; the public pages read it next render. */
export async function POST(req: NextRequest) {
  const origin = badOrigin(req);
  if (origin) return origin;
  const { errorResponse, user } = await requireConsoleAccess();
  if (errorResponse) return errorResponse;

  const parsed = photographySettingsSchema.safeParse(await readJson<unknown>(req));
  if (!parsed.success) {
    return NextResponse.json(
      { error: firstValidationMessage(parsed.error) },
      { status: 400 },
    );
  }

  try {
    await savePhotography(user!.id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[photography] settings save failed:", err);
    return NextResponse.json(
      { error: "Saving didn't stick — the database may be unavailable." },
      { status: 500 },
    );
  }
}
