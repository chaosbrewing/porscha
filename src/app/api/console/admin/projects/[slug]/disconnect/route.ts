import { NextRequest, NextResponse } from "next/server";
import { requireConsoleAccess } from "@/server/auth/guard";
import { badOrigin } from "@/server/auth/http";
import { disconnectRepository } from "@/server/projects/admin";

export const dynamic = "force-dynamic";

/** Disconnect the GitHub repository (config + snapshot removed). */
export async function POST(
  req: NextRequest,
  { params }: RouteContext<"/api/console/admin/projects/[slug]/disconnect">,
) {
  const origin = badOrigin(req);
  if (origin) return origin;
  const { errorResponse, user } = await requireConsoleAccess();
  if (errorResponse) return errorResponse;

  const { slug } = await params;
  try {
    const result = await disconnectRepository(user!.id, slug);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status ?? 400 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin] disconnect failed:", err);
    return NextResponse.json(
      { error: "Disconnecting didn't stick — the database may be unavailable." },
      { status: 500 },
    );
  }
}
