import { NextRequest, NextResponse } from "next/server";
import { requireConsoleAccess } from "@/server/auth/guard";
import { badOrigin, readJson } from "@/server/auth/http";
import { createPiece, saveOrder } from "@/server/gallery/admin";
import { firstValidationMessage } from "@/server/projects/validation";
import {
  galleryPieceSchema,
  galleryReorderSchema,
} from "@/server/gallery/validation";

export const dynamic = "force-dynamic";

/** Create a console-authored piece. */
export async function POST(req: NextRequest) {
  const origin = badOrigin(req);
  if (origin) return origin;
  const { errorResponse, user } = await requireConsoleAccess();
  if (errorResponse) return errorResponse;

  const parsed = galleryPieceSchema.safeParse(await readJson<unknown>(req));
  if (!parsed.success) {
    return NextResponse.json(
      { error: firstValidationMessage(parsed.error) },
      { status: 400 },
    );
  }

  try {
    const result = await createPiece(user!.id, parsed.data);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status ?? 400 },
      );
    }
    return NextResponse.json({ ok: true, slug: parsed.data.slug });
  } catch (err) {
    console.error("[gallery] create piece failed:", err);
    return NextResponse.json(
      { error: "Saving didn't stick — the database may be unavailable." },
      { status: 500 },
    );
  }
}

/** Rewrite the manual sort order. */
export async function PATCH(req: NextRequest) {
  const origin = badOrigin(req);
  if (origin) return origin;
  const { errorResponse, user } = await requireConsoleAccess();
  if (errorResponse) return errorResponse;

  const parsed = galleryReorderSchema.safeParse(await readJson<unknown>(req));
  if (!parsed.success) {
    return NextResponse.json(
      { error: firstValidationMessage(parsed.error) },
      { status: 400 },
    );
  }

  try {
    await saveOrder(user!.id, parsed.data.order);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[gallery] reorder failed:", err);
    return NextResponse.json(
      { error: "Reordering didn't stick — the database may be unavailable." },
      { status: 500 },
    );
  }
}
