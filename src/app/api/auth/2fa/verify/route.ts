import { NextRequest, NextResponse } from "next/server";
import { requirePendingOrVerified } from "@/server/auth/guard";
import { badOrigin, readJson } from "@/server/auth/http";
import {
  verifyRecoveryCodeForUser,
  verifyTotpForUser,
} from "@/server/auth/twofactor";
import {
  createSessionToken,
  sessionCookieOptions,
} from "@/server/auth/session";

export const dynamic = "force-dynamic";

/**
 * Verifies a TOTP or recovery code for a pending session and rotates
 * it into a full two_factor_verified session. Responses never reveal
 * which part of a code was wrong, and submitted values are never
 * logged.
 */
export async function POST(req: NextRequest) {
  const origin = badOrigin(req);
  if (origin) return origin;
  const { errorResponse, result } = await requirePendingOrVerified();
  if (errorResponse) return errorResponse;

  const body = await readJson<{ code?: string; method?: string }>(req);
  if (!body?.code) {
    return NextResponse.json({ error: "Enter the code" }, { status: 400 });
  }

  const userId = result!.user.id;
  const verification =
    body.method === "recovery"
      ? await verifyRecoveryCodeForUser(userId, body.code)
      : await verifyTotpForUser(userId, body.code);

  if (verification.outcome === "rate_limited") {
    return NextResponse.json(
      {
        error: `Too many attempts. Try again in about ${Math.ceil(verification.retryAfterSeconds / 60)} minute${verification.retryAfterSeconds > 90 ? "s" : ""}.`,
        retryAfterSeconds: verification.retryAfterSeconds,
      },
      { status: 429 },
    );
  }
  if (verification.outcome !== "ok") {
    return NextResponse.json(
      { error: "That code didn't work. Try again." },
      { status: 400 },
    );
  }

  const token = await createSessionToken(result!.user, "two_factor_verified");
  const res = NextResponse.json({
    ok: true,
    redirectTo:
      verification.method === "recovery"
        ? "/console/security?recovery=used"
        : "/console/overview",
    ...(verification.method === "recovery"
      ? { recoveryCodesRemaining: verification.remaining }
      : {}),
  });
  res.cookies.set({ ...sessionCookieOptions(), value: token });
  return res;
}
