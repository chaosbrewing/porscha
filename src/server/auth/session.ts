import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env } from "@/server/env";

/**
 * Session handling. A signed, httpOnly, sameSite=lax cookie carrying a
 * short JWT. No session data lives client-readable; authorization is
 * re-checked server-side on every console request.
 */

const SESSION_COOKIE = "porscha_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 days

export type SessionUser = {
  id: string;
  githubLogin: string;
  displayName: string | null;
  avatarUrl: string | null;
};

const secretKey = new TextEncoder().encode(env.SESSION_SECRET);

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .setIssuer("porscha.today")
    .sign(secretKey);
}

export async function readSessionToken(
  token: string,
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      issuer: "porscha.today",
    });
    const user = payload.user as SessionUser | undefined;
    if (!user?.githubLogin) return null;
    return user;
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
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
    maxAge: SESSION_TTL_SECONDS,
  };
}

export async function setSessionCookie(user: SessionUser): Promise<void> {
  const token = await createSessionToken(user);
  const store = await cookies();
  store.set({ ...sessionCookieOptions(), value: token });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set({ ...sessionCookieOptions(), value: "", maxAge: 0 });
}
