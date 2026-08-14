import { NextRequest, NextResponse } from "next/server";
import { env } from "@/server/env";
import { clearSessionCookie } from "@/server/auth/session";

export const dynamic = "force-dynamic";

/** Signs out. POST only, so a stray link prefetch can't end a session. */
export async function POST(req: NextRequest) {
  await clearSessionCookie();
  // Origin check: same-site form posts only.
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(env.SITE_URL).origin) {
    return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  }
  return NextResponse.redirect(new URL("/", env.SITE_URL), { status: 303 });
}
