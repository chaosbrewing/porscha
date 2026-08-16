import { NextRequest, NextResponse } from "next/server";
import { requirePendingOrVerified } from "@/server/auth/guard";
import { badOrigin, readJson } from "@/server/auth/http";
import { completeEnrollment } from "@/server/auth/twofactor";

export const dynamic = "force-dynamic";

/**
 * Completes 2FA enrollment: verifies the first authenticator code and
 * returns the recovery codes exactly once. The session stays pending
 * until the recovery codes are acknowledged.
 */
export async function POST(req: NextRequest) {
  const origin = badOrigin(req);
  if (origin) return origin;
  const { errorResponse, result } = await requirePendingOrVerified();
  if (errorResponse) return errorResponse;

  const body = await readJson<{ code?: string }>(req);
  if (!body?.code) {
    return NextResponse.json({ error: "Enter the code" }, { status: 400 });
  }

  const outcome = await completeEnrollment(result!.user.id, body.code);
  if (!outcome.ok) {
    return NextResponse.json(
      { error: "That code didn't match. Check your authenticator and try again." },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true, recoveryCodes: outcome.recoveryCodes });
}
