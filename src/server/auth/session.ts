import "server-only";
import { randomUUID } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env } from "@/server/env";

/**
 * Session handling.
 *
 * A signed, httpOnly, sameSite=lax cookie carrying a short JWT with an
 * explicit authentication state:
 *
 *   anonymous            — no cookie at all
 *   oauth_authenticated  — passed GitHub OAuth only (never sufficient)
 *   two_factor_pending   — allowlisted, awaiting TOTP; short-lived
 *   two_factor_verified  — full console access
 *
 * Each token carries a session id (`sid`) and a millisecond issue time
 * (`iatMs`). Verification rotates the sid; replacing an authenticator
 * stamps `sessionsInvalidatedAt`, and any token with iatMs at or before
 * that instant is rejected.
 */

const SESSION_COOKIE = "porscha_session";
const VERIFIED_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 days
const PENDING_TTL_SECONDS = 60 * 10; // 10 minutes

export type SessionState =
  | "oauth_authenticated"
  | "two_factor_pending"
  | "two_factor_verified";

export type SessionUser = {
  id: string;
  githubLogin: string;
  displayName: string | null;
  avatarUrl: string | null;
};

export type Session = {
  user: SessionUser;
  state: SessionState;
  sid: string;
  iatMs: number;
};

const secretKey = new TextEncoder().encode(env.SESSION_SECRET);

export async function createSessionToken(
  user: SessionUser,
  state: SessionState,
  now = Date.now(),
): Promise<string> {
  const ttl =
    state === "two_factor_verified" ? VERIFIED_TTL_SECONDS : PENDING_TTL_SECONDS;
  return new SignJWT({ user, state, sid: randomUUID(), iatMs: now })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ttl}s`)
    .setIssuer("porscha.today")
    .sign(secretKey);
}

export async function readSessionToken(
  token: string,
): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      issuer: "porscha.today",
    });
    const user = payload.user as SessionUser | undefined;
    const state = payload.state as SessionState | undefined;
    const sid = payload.sid as string | undefined;
    const iatMs = payload.iatMs as number | undefined;
    if (
      !user?.githubLogin ||
      !sid ||
      typeof iatMs !== "number" ||
      (state !== "oauth_authenticated" &&
        state !== "two_factor_pending" &&
        state !== "two_factor_verified")
    ) {
      return null;
    }
    return { user, state, sid, iatMs };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return readSessionToken(token);
}

/** Authorization: is this GitHub login allowed into the console? */
export function isAuthorizedLogin(githubLogin: string): boolean {
  return env.allowedLogins.includes(githubLogin.toLowerCase());
}

export function sessionCookieOptions() {
  return {
    name: SESSION_COOKIE,
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge: VERIFIED_TTL_SECONDS,
  };
}

export async function setSessionCookie(
  user: SessionUser,
  state: SessionState,
): Promise<void> {
  const token = await createSessionToken(user, state);
  const store = await cookies();
  store.set({
    ...sessionCookieOptions(),
    maxAge:
      state === "two_factor_verified"
        ? VERIFIED_TTL_SECONDS
        : PENDING_TTL_SECONDS,
    value: token,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set({ ...sessionCookieOptions(), value: "", maxAge: 0 });
}
