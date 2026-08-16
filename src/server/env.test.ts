import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Environment validation tests — including the production safeguards
 * that make dev login and a missing 2FA key impossible to ship.
 */

const VALID_KEY = "c".repeat(64);
let saved: NodeJS.ProcessEnv;

beforeEach(() => {
  saved = { ...process.env };
  vi.resetModules();
});

afterEach(() => {
  process.env = saved;
  vi.resetModules();
});

function setBase() {
  process.env.SESSION_SECRET =
    "test-session-secret-0123456789abcdef0123456789abcdef";
  process.env.TWO_FACTOR_ENCRYPTION_KEY = VALID_KEY;
  delete process.env.AUTH_DEV_LOGIN;
  delete process.env.AUTH_DEV_LOGIN_I_KNOW_WHAT_I_AM_DOING;
}

describe("environment validation", () => {
  it("loads with a valid configuration", async () => {
    setBase();
    const { env } = await import("./env");
    expect(env.TWO_FACTOR_ENCRYPTION_KEY).toBe(VALID_KEY);
  });

  it("fails when TWO_FACTOR_ENCRYPTION_KEY is missing", async () => {
    setBase();
    delete process.env.TWO_FACTOR_ENCRYPTION_KEY;
    await expect(import("./env")).rejects.toThrow(/TWO_FACTOR_ENCRYPTION_KEY/);
  });

  it("fails when TWO_FACTOR_ENCRYPTION_KEY is malformed", async () => {
    setBase();
    process.env.TWO_FACTOR_ENCRYPTION_KEY = "not-hex";
    await expect(import("./env")).rejects.toThrow(/64 hex/);
  });

  it("fails when the 2FA key merely copies SESSION_SECRET", async () => {
    setBase();
    process.env.SESSION_SECRET = VALID_KEY;
    process.env.TWO_FACTOR_ENCRYPTION_KEY = VALID_KEY;
    await expect(import("./env")).rejects.toThrow(/independent/);
  });

  it("production refuses AUTH_DEV_LOGIN — dev login cannot bypass 2FA", async () => {
    setBase();
    vi.stubEnv("NODE_ENV", "production");
    process.env.AUTH_DEV_LOGIN = "true";
    await expect(import("./env")).rejects.toThrow(
      /AUTH_DEV_LOGIN must not be enabled in production/,
    );
    vi.unstubAllEnvs();
  });

  it("development allows AUTH_DEV_LOGIN", async () => {
    setBase();
    vi.stubEnv("NODE_ENV", "development");
    process.env.AUTH_DEV_LOGIN = "true";
    const { env } = await import("./env");
    expect(env.devLoginEnabled).toBe(true);
    vi.unstubAllEnvs();
  });
});
