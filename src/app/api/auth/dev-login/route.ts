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
  const token = await createSessionToken({
    id: "dev:porscha",
    githubLogin: "porscha-dev",
    displayName: "Porscha (dev)",
    avatarUrl: null,
  });
  const res = NextResponse.redirect(new URL("/console/overview", env.SITE_URL), {
    status: 303,
  });
  res.cookies.set({ ...sessionCookieOptions(), value: token });
  return res;
}
