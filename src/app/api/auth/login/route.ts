import { NextResponse } from "next/server";
import { env } from "@/server/env";
import {
  buildAuthorizeUrl,
  generateOAuthState,
  OAUTH_STATE_COOKIE,
} from "@/server/auth/github-oauth";

export const dynamic = "force-dynamic";

/** Starts the GitHub OAuth flow for console sign-in. */
export async function GET() {
  if (!env.oauthConfigured) {
    return NextResponse.redirect(
      new URL("/login?error=not_configured", env.SITE_URL),
    );
  }
  const state = generateOAuthState();
  const res = NextResponse.redirect(buildAuthorizeUrl(state));
  res.cookies.set({
    name: OAUTH_STATE_COOKIE,
    value: state,
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
