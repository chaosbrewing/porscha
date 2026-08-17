import { NextRequest, NextResponse } from "next/server";
import { requireConsoleAccess } from "@/server/auth/guard";
import { badOrigin, readJson } from "@/server/auth/http";
import { saveDisplaySettings } from "@/server/gallery/admin";
import { firstValidationMessage } from "@/server/projects/validation";
import { galleryDisplaySchema } from "@/server/gallery/validation";

export const dynamic = "force-dynamic";

/** Save the gallery's page-level display settings. */
export async function POST(req: NextRequest) {
  const origin = badOrigin(req);
  if (origin) return origin;
  const { errorResponse, user } = await requireConsoleAccess();
  if (errorResponse) return errorResponse;

  const parsed = galleryDisplaySchema.safeParse(await readJson<unknown>(req));
  if (!parsed.success) {
    return NextResponse.json(
      { error: firstValidationMessage(parsed.error) },
      { status: 400 },
    );
  }

  try {
    await saveDisplaySettings(user!.id, parsed.data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[gallery] settings save failed:", err);
    return NextResponse.json(
      { error: "Saving didn't stick — the database may be unavailable." },
      { status: 500 },
    );
  }
}
