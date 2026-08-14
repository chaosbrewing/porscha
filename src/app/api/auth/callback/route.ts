import { NextRequest, NextResponse } from "next/server";
import { env } from "@/server/env";
import {
  exchangeCodeForUser,
  OAUTH_STATE_COOKIE,
  verifyOAuthState,
} from "@/server/auth/github-oauth";
import {
  isAuthorizedLogin,
  createSessionToken,
  sessionCookieOptions,
} from "@/server/auth/session";
import { touchUser } from "@/server/projects/store";

export const dynamic = "force-dynamic";

/** GitHub OAuth callback: verifies state, exchanges code, sets session. */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = req.cookies.get(OAUTH_STATE_COOKIE)?.value ?? null;

  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/login?error=${reason}`, env.SITE_URL));

  if (!code || !state || !cookieState || state !== cookieState) {
    return fail("state_mismatch");
  }
  if (!verifyOAuthState(state)) {
    return fail("state_mismatch");
  }

  const ghUser = await exchangeCodeForUser(code);
  if (!ghUser) return fail("exchange_failed");

  if (!isAuthorizedLogin(ghUser.login)) {
    // Authenticated but not authorized — no session is created.
    return fail("unauthorized");
  }

  const user = {
    id: `github:${ghUser.login.toLowerCase()}`,
    githubLogin: ghUser.login,
    displayName: ghUser.name,
    avatarUrl: ghUser.avatarUrl,
  };
  // Best-effort user record; sign-in works even if the DB is down.
  await touchUser(user).catch(() => {});

  const token = await createSessionToken(user);
  const res = NextResponse.redirect(new URL("/console/overview", env.SITE_URL));
  res.cookies.set({ ...sessionCookieOptions(), value: token });
  res.cookies.set({
    name: OAUTH_STATE_COOKIE,
    value: "",
    path: "/",
    maxAge: 0,
  });
  return res;
}
