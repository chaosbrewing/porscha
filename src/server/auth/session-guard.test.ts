import { describe, expect, it } from "vitest";
import { createSessionToken, readSessionToken } from "./session";
import { classifySession } from "./guard";
import type { Session, SessionUser } from "./session";

const user: SessionUser = {
  id: "github:chaosbrewing",
  githubLogin: "chaosbrewing",
  displayName: "Porscha",
  avatarUrl: null,
};

function session(
  state: Session["state"],
  iatMs = Date.now(),
): Session {
  return { user, state, sid: `sid-${Math.random()}`, iatMs };
}

const base = {
  isAllowlisted: true,
  isDevUser: false,
  enrolled: true,
  sessionsInvalidatedAt: null as Date | null,
};

describe("session tokens", () => {
  it("round-trips state, sid, and iatMs", async () => {
    const token = await createSessionToken(user, "two_factor_pending");
    const parsed = await readSessionToken(token);
    expect(parsed?.state).toBe("two_factor_pending");
    expect(parsed?.user.githubLogin).toBe("chaosbrewing");
    expect(parsed?.sid).toBeTruthy();
    expect(typeof parsed?.iatMs).toBe("number");
  });

  it("rotates the session id on every issuance", async () => {
    const a = await readSessionToken(
      await createSessionToken(user, "two_factor_pending"),
    );
    const b = await readSessionToken(
      await createSessionToken(user, "two_factor_verified"),
    );
    expect(a?.sid).not.toBe(b?.sid);
  });

  it("rejects tampered tokens", async () => {
    const token = await createSessionToken(user, "two_factor_verified");
    expect(await readSessionToken(token.slice(0, -2) + "xx")).toBeNull();
  });
});

describe("classifySession — the console authorization matrix", () => {
  it("anonymous (no session) is unauthenticated", () => {
    expect(classifySession(null, base).state).toBe("unauthenticated");
  });

  it("non-allowlisted users are unauthorized regardless of state", () => {
    const result = classifySession(session("two_factor_verified"), {
      ...base,
      isAllowlisted: false,
    });
    expect(result.state).toBe("unauthorized");
  });

  it("oauth_authenticated alone can NOT access the console", () => {
    const result = classifySession(session("oauth_authenticated"), base);
    expect(result.state).toBe("two_factor_pending");
  });

  it("two_factor_pending can NOT access the console", () => {
    const result = classifySession(session("two_factor_pending"), base);
    expect(result.state).toBe("two_factor_pending");
  });

  it("pending sessions for un-enrolled users flag enrollment", () => {
    const result = classifySession(session("two_factor_pending"), {
      ...base,
      enrolled: false,
    });
    expect(result).toMatchObject({
      state: "two_factor_pending",
      needsEnrollment: true,
    });
  });

  it("two_factor_verified is authorized", () => {
    const result = classifySession(session("two_factor_verified"), base);
    expect(result.state).toBe("authorized");
  });

  it("verified sessions issued before invalidation are rejected", () => {
    const invalidatedAt = new Date();
    const stale = session("two_factor_verified", invalidatedAt.getTime() - 1);
    const result = classifySession(stale, {
      ...base,
      sessionsInvalidatedAt: invalidatedAt,
    });
    expect(result.state).toBe("unauthenticated");
  });

  it("verified sessions issued after invalidation survive", () => {
    const invalidatedAt = new Date();
    const fresh = session("two_factor_verified", invalidatedAt.getTime() + 5);
    const result = classifySession(fresh, {
      ...base,
      sessionsInvalidatedAt: invalidatedAt,
    });
    expect(result.state).toBe("authorized");
  });

  it("dev users are authorized only via the dev path", () => {
    const devUser: SessionUser = {
      id: "dev:porscha",
      githubLogin: "porscha-dev",
      displayName: null,
      avatarUrl: null,
    };
    const result = classifySession(
      { user: devUser, state: "two_factor_verified", sid: "s", iatMs: Date.now() },
      { ...base, isAllowlisted: false, isDevUser: true, enrolled: false },
    );
    expect(result.state).toBe("authorized");
  });
});
