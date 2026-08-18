import { NextRequest, NextResponse } from "next/server";
import { requireConsoleAccess } from "@/server/auth/guard";
import { badOrigin } from "@/server/auth/http";
import { restorePiece } from "@/server/gallery/admin";

export const dynamic = "force-dynamic";

/** Return a removed file-backed piece to the wall. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const origin = badOrigin(req);
  if (origin) return origin;
  const { errorResponse, user } = await requireConsoleAccess();
  if (errorResponse) return errorResponse;

  const { slug } = await params;
  try {
    const result = await restorePiece(user!.id, slug);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status ?? 400 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[gallery] restore failed:", err);
    return NextResponse.json(
      { error: "Restoring didn't stick — the database may be unavailable." },
      { status: 500 },
    );
  }
}
