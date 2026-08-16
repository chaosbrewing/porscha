import { NextRequest, NextResponse } from "next/server";
import { requireConsoleAccess } from "@/server/auth/guard";
import { badOrigin, readJson } from "@/server/auth/http";
import { confirmAuthenticatorReplacement } from "@/server/auth/twofactor";
import {
  createSessionToken,
  sessionCookieOptions,
} from "@/server/auth/session";

export const dynamic = "force-dynamic";

/**
 * Confirms authenticator replacement with a code from the NEW device.
 * Every existing session is invalidated; this response carries a fresh
 * session for the current browser.
 */
export async function POST(req: NextRequest) {
  const origin = badOrigin(req);
  if (origin) return origin;
  const { errorResponse, user } = await requireConsoleAccess();
  if (errorResponse) return errorResponse;

  const body = await readJson<{ code?: string }>(req);
  if (!body?.code) {
    return NextResponse.json(
      { error: "Enter the code from the new authenticator" },
      { status: 400 },
    );
  }

  const result = await confirmAuthenticatorReplacement(user!.id, body.code);
  if (!result.ok) {
    return NextResponse.json(
      { error: "That code didn't work. Scan the QR again and retry." },
      { status: 400 },
    );
  }

  // New token must postdate the invalidation instant.
  const issuedAt = Math.max(
    Date.now(),
    (result.invalidatedAt?.getTime() ?? 0) + 1,
  );
  const token = await createSessionToken(
    user!,
    "two_factor_verified",
    issuedAt,
  );
  const res = NextResponse.json({ ok: true });
  res.cookies.set({ ...sessionCookieOptions(), value: token });
  return res;
}
