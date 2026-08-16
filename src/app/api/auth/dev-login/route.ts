import { NextResponse } from "next/server";
import { env } from "@/server/env";
import { createSessionToken, sessionCookieOptions } from "@/server/auth/session";

export const dynamic = "force-dynamic";

/**
 * Development-only sign-in, for working on the console without a GitHub
 * OAuth app. Refuses to exist unless AUTH_DEV_LOGIN=true (see env.ts,
 * which additionally refuses that flag in production).
 */
export async function POST() {
  if (!env.devLoginEnabled) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // Dev sessions are two_factor_verified directly: they exist only in
  // local development — env validation refuses AUTH_DEV_LOGIN in
  // production, so this can never bypass production 2FA.
  const token = await createSessionToken(
    {
      id: "dev:porscha",
      githubLogin: "porscha-dev",
      displayName: "Porscha (dev)",
      avatarUrl: null,
    },
    "two_factor_verified",
  );
  const res = NextResponse.redirect(new URL("/console/overview", env.SITE_URL), {
    status: 303,
  });
  res.cookies.set({ ...sessionCookieOptions(), value: token });
  return res;
}
