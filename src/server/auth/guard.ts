import "server-only";
import { NextResponse } from "next/server";
import { getSessionUser, isAuthorizedLogin, type SessionUser } from "./session";

/**
 * Server-side authorization guard for console pages and APIs.
 * Every console route calls one of these — route hiding is not a
 * security mechanism here.
 */

export type AuthResult =
  | { state: "unauthenticated" }
  | { state: "unauthorized"; user: SessionUser }
  | { state: "authorized"; user: SessionUser };

export async function checkConsoleAccess(): Promise<AuthResult> {
  const user = await getSessionUser();
  if (!user) return { state: "unauthenticated" };
  // Dev-login users carry the "dev:" id prefix and are always local.
  if (user.id.startsWith("dev:")) return { state: "authorized", user };
  if (!isAuthorizedLogin(user.githubLogin)) {
    return { state: "unauthorized", user };
  }
  return { state: "authorized", user };
}

/** For API route handlers: returns a 401/403 response or null if OK. */
export async function requireConsoleAccess(): Promise<{
  errorResponse: NextResponse | null;
  user: SessionUser | null;
}> {
  const result = await checkConsoleAccess();
  if (result.state === "unauthenticated") {
    return {
      errorResponse: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      ),
      user: null,
    };
  }
  if (result.state === "unauthorized") {
    return {
      errorResponse: NextResponse.json(
        { error: "Not authorized for the console" },
        { status: 403 },
      ),
      user: null,
    };
  }
  return { errorResponse: null, user: result.user };
}
