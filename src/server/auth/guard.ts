import "server-only";
import { NextResponse } from "next/server";
import {
  getSession,
  isAuthorizedLogin,
  type Session,
  type SessionUser,
} from "./session";
import { getSessionsInvalidatedAt, getTwoFactorRow } from "./twofactor";

/**
 * Server-side authorization for console pages and APIs.
 *
 * Only `two_factor_verified` sessions (that survive the invalidation
 * check) are authorized. OAuth-only and pending-2FA sessions are
 * rejected on every console surface — pages, APIs, SSE, and every
 * project-administration mutation. Route hiding is never relied on.
 */

export type AuthResult =
  | { state: "unauthenticated" }
  | { state: "unauthorized"; user: SessionUser }
  | {
      state: "two_factor_pending";
      user: SessionUser;
      needsEnrollment: boolean;
    }
  | { state: "authorized"; user: SessionUser; session: Session };

/**
 * Pure classification of a session, given the user's 2FA metadata.
 * Extracted from the cookie/database plumbing so it can be tested
 * exhaustively.
 */
export function classifySession(
  session: Session | null,
  options: {
    isAllowlisted: boolean;
    isDevUser: boolean;
    enrolled: boolean;
    sessionsInvalidatedAt: Date | null;
  },
): AuthResult {
  if (!session) return { state: "unauthenticated" };
  const { user } = session;

  if (!options.isDevUser && !options.isAllowlisted) {
    return { state: "unauthorized", user };
  }

  if (
    options.sessionsInvalidatedAt &&
    session.iatMs <= options.sessionsInvalidatedAt.getTime()
  ) {
    return { state: "unauthenticated" };
  }

  // Dev users (local development only; production refuses the flag)
  // skip 2FA — there is no GitHub identity to enroll against.
  if (options.isDevUser) {
    return { state: "authorized", user, session };
  }

  if (session.state === "two_factor_verified") {
    return { state: "authorized", user, session };
  }

  // oauth_authenticated and two_factor_pending both land here: the
  // only thing they may do is finish verification.
  return {
    state: "two_factor_pending",
    user,
    needsEnrollment: !options.enrolled,
  };
}

export async function checkConsoleAccess(): Promise<AuthResult> {
  const session = await getSession();
  if (!session) return { state: "unauthenticated" };
  const isDevUser = session.user.id.startsWith("dev:");
  const [row, invalidatedAt] = isDevUser
    ? [null, null]
    : await Promise.all([
        getTwoFactorRow(session.user.id).catch(() => null),
        getSessionsInvalidatedAt(session.user.id).catch(() => null),
      ]);
  return classifySession(session, {
    isAllowlisted: isAuthorizedLogin(session.user.githubLogin),
    isDevUser,
    enrolled: Boolean(row?.enabledAt),
    sessionsInvalidatedAt: invalidatedAt,
  });
}

/** For API route handlers: returns an error response or the session. */
export async function requireConsoleAccess(): Promise<{
  errorResponse: NextResponse | null;
  user: SessionUser | null;
}> {
  const result = await checkConsoleAccess();
  if (result.state === "authorized") {
    return { errorResponse: null, user: result.user };
  }
  if (result.state === "unauthenticated") {
    return {
      errorResponse: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      ),
      user: null,
    };
  }
  if (result.state === "two_factor_pending") {
    return {
      errorResponse: NextResponse.json(
        { error: "Two-factor verification required" },
        { status: 401 },
      ),
      user: null,
    };
  }
  return {
    errorResponse: NextResponse.json(
      { error: "Not authorized for the console" },
      { status: 403 },
    ),
    user: null,
  };
}

export type PendingOrVerified = Extract<
  AuthResult,
  { state: "two_factor_pending" } | { state: "authorized" }
>;

/** For 2FA endpoints: requires a pending (or better) allowlisted session. */
export async function requirePendingOrVerified(): Promise<{
  errorResponse: NextResponse | null;
  result: PendingOrVerified | null;
}> {
  const result = await checkConsoleAccess();
  if (
    result.state === "two_factor_pending" ||
    result.state === "authorized"
  ) {
    return { errorResponse: null, result };
  }
  return {
    errorResponse: NextResponse.json(
      { error: "Sign in with GitHub first" },
      { status: 401 },
    ),
    result: null,
  };
}
