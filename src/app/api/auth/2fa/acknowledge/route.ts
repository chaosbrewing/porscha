import { NextRequest, NextResponse } from "next/server";
import { requirePendingOrVerified } from "@/server/auth/guard";
import { badOrigin } from "@/server/auth/http";
import { getTwoFactorRow } from "@/server/auth/twofactor";
import {
  createSessionToken,
  sessionCookieOptions,
} from "@/server/auth/session";

export const dynamic = "force-dynamic";

/**
 * After the recovery codes are acknowledged, rotates the pending
 * session into a full two_factor_verified session.
 */
export async function POST(req: NextRequest) {
  const origin = badOrigin(req);
  if (origin) return origin;
  const { errorResponse, result } = await requirePendingOrVerified();
  if (errorResponse) return errorResponse;

  const row = await getTwoFactorRow(result!.user.id);
  if (!row?.enabledAt) {
    return NextResponse.json(
      { error: "Finish setting up your authenticator first" },
      { status: 400 },
    );
  }

  const token = await createSessionToken(result!.user, "two_factor_verified");
  const res = NextResponse.json({ ok: true, redirectTo: "/console/overview" });
  res.cookies.set({ ...sessionCookieOptions(), value: token });
  return res;
}
