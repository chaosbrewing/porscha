import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import { env } from "@/server/env";

/**
 * GitHub OAuth for console sign-in. Deliberately separate from the
 * ingestion layer — the OAuth app authenticates Porscha; the sync token
 * reads repositories. Neither knows about the other.
 */

const AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const TOKEN_URL = "https://github.com/login/oauth/access_token";
const USER_URL = "https://api.github.com/user";

export const OAUTH_STATE_COOKIE = "porscha_oauth_state";

/** Signed random state value for CSRF protection of the OAuth flow. */
export function generateOAuthState(): string {
  const nonce = randomBytes(16).toString("hex");
  const sig = createHmac("sha256", env.SESSION_SECRET)
    .update(nonce)
    .digest("hex")
    .slice(0, 16);
  return `${nonce}.${sig}`;
}

export function verifyOAuthState(state: string | null): boolean {
  if (!state) return false;
  const [nonce, sig] = state.split(".");
  if (!nonce || !sig) return false;
  const expected = createHmac("sha256", env.SESSION_SECRET)
    .update(nonce)
    .digest("hex")
    .slice(0, 16);
  return sig === expected;
}

export function buildAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.GITHUB_OAUTH_CLIENT_ID ?? "",
    redirect_uri: `${env.SITE_URL}/api/auth/callback`,
    scope: "read:user",
    state,
  });
  return `${AUTHORIZE_URL}?${params}`;
}

export async function exchangeCodeForUser(code: string): Promise<{
  login: string;
  name: string | null;
  avatarUrl: string | null;
} | null> {
  const tokenRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: env.GITHUB_OAUTH_CLIENT_ID,
      client_secret: env.GITHUB_OAUTH_CLIENT_SECRET,
      code,
    }),
    cache: "no-store",
  });
  if (!tokenRes.ok) return null;
  const tokenJson = (await tokenRes.json()) as { access_token?: string };
  if (!tokenJson.access_token) return null;

  const userRes = await fetch(USER_URL, {
    headers: {
      Authorization: `Bearer ${tokenJson.access_token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "porscha.today",
    },
    cache: "no-store",
  });
  if (!userRes.ok) return null;
  const user = (await userRes.json()) as {
    login?: string;
    name?: string | null;
    avatar_url?: string | null;
  };
  if (!user.login) return null;
  return {
    login: user.login,
    name: user.name ?? null,
    avatarUrl: user.avatar_url ?? null,
  };
}
