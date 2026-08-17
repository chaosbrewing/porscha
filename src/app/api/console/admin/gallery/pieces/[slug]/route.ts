import { NextRequest, NextResponse } from "next/server";
import { requireConsoleAccess } from "@/server/auth/guard";
import { badOrigin, readJson } from "@/server/auth/http";
import { editPiece, removePiece, savePieceOverlay } from "@/server/gallery/admin";
import { firstValidationMessage } from "@/server/projects/validation";
import {
  galleryOverlaySchema,
  galleryPieceUpdateSchema,
} from "@/server/gallery/validation";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

/** Edit a console-authored piece's content. */
export async function PUT(req: NextRequest, { params }: Ctx) {
  const origin = badOrigin(req);
  if (origin) return origin;
  const { errorResponse, user } = await requireConsoleAccess();
  if (errorResponse) return errorResponse;

  const { slug } = await params;
  const parsed = galleryPieceUpdateSchema.safeParse(await readJson<unknown>(req));
  if (!parsed.success) {
    return NextResponse.json(
      { error: firstValidationMessage(parsed.error) },
      { status: 400 },
    );
  }

  try {
    const result = await editPiece(user!.id, slug, parsed.data);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status ?? 400 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[gallery] edit piece failed:", err);
    return NextResponse.json(
      { error: "Saving didn't stick — the database may be unavailable." },
      { status: 500 },
    );
  }
}

/**
 * Set the console-owned flags. Works for file-backed pieces too — this
 * is the only mutation that does.
 */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const origin = badOrigin(req);
  if (origin) return origin;
  const { errorResponse, user } = await requireConsoleAccess();
  if (errorResponse) return errorResponse;

  const { slug } = await params;
  const parsed = galleryOverlaySchema.safeParse(await readJson<unknown>(req));
  if (!parsed.success) {
    return NextResponse.json(
      { error: firstValidationMessage(parsed.error) },
      { status: 400 },
    );
  }

  try {
    const result = await savePieceOverlay(user!.id, slug, parsed.data);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status ?? 400 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[gallery] overlay save failed:", err);
    return NextResponse.json(
      { error: "Saving didn't stick — the database may be unavailable." },
      { status: 500 },
    );
  }
}

/** Delete a console-authored piece. File-backed pieces are refused. */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const origin = badOrigin(req);
  if (origin) return origin;
  const { errorResponse, user } = await requireConsoleAccess();
  if (errorResponse) return errorResponse;

  const { slug } = await params;
  try {
    const result = await removePiece(user!.id, slug);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status ?? 400 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[gallery] delete piece failed:", err);
    return NextResponse.json(
      { error: "Deleting didn't stick — the database may be unavailable." },
      { status: 500 },
    );
  }
}
