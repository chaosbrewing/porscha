import { NextRequest, NextResponse } from "next/server";
import { env } from "@/server/env";
import { purchasablePiece, startCheckout } from "@/server/sales/service";

export const dynamic = "force-dynamic";

/**
 * Start a checkout for an original. Public — anyone may buy — but
 * same-origin only, so a third-party page can't spend someone's click
 * reserving a piece.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const siteOrigin = new URL(env.SITE_URL).origin;
  const origin = req.headers.get("origin");
  if (origin && origin !== siteOrigin) {
    return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  }

  const { slug } = await params;
  const piece = await purchasablePiece(slug);
  if (!piece) {
    return NextResponse.json({ error: "No such piece." }, { status: 404 });
  }

  const result = await startCheckout(piece, siteOrigin);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true, url: result.url });
}
