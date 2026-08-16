import { NextRequest, NextResponse } from "next/server";
import { requireConsoleAccess } from "@/server/auth/guard";
import { badOrigin, readJson } from "@/server/auth/http";
import { regenerateRecoveryCodes } from "@/server/auth/twofactor";

export const dynamic = "force-dynamic";

/** Regenerates recovery codes. Requires a fresh TOTP challenge. */
export async function POST(req: NextRequest) {
  const origin = badOrigin(req);
  if (origin) return origin;
  const { errorResponse, user } = await requireConsoleAccess();
  if (errorResponse) return errorResponse;

  const body = await readJson<{ code?: string }>(req);
  if (!body?.code) {
    return NextResponse.json(
      { error: "Enter a current authenticator code" },
      { status: 400 },
    );
  }

  const result = await regenerateRecoveryCodes(user!.id, body.code);
  if (!result.ok) {
    if (result.reason.outcome === "rate_limited") {
      return NextResponse.json(
        { error: "Too many attempts. Try again shortly." },
        { status: 429 },
      );
    }
    return NextResponse.json(
      { error: "That code didn't work. Try again." },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true, recoveryCodes: result.codes });
}
