import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { requireConsoleAccess } from "@/server/auth/guard";
import { badOrigin, readJson } from "@/server/auth/http";
import { beginAuthenticatorReplacement } from "@/server/auth/twofactor";

export const dynamic = "force-dynamic";

/**
 * Starts authenticator replacement. Requires a fresh TOTP challenge
 * from the current authenticator, then returns the new provisioning
 * QR + manual key.
 */
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

  const result = await beginAuthenticatorReplacement(
    user!.id,
    body.code,
    user!.githubLogin,
  );
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
  const qrDataUrl = await QRCode.toDataURL(result.uri, { margin: 1, width: 220 });
  return NextResponse.json({
    ok: true,
    manualKey: result.secret,
    qrDataUrl,
  });
}
