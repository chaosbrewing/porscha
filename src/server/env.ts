import "server-only";
import { z } from "zod";

/**
 * Environment validation. Parsed once at first import on the server.
 *
 * Secrets never reach the browser: nothing here is prefixed NEXT_PUBLIC_
 * and this module is `server-only`.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  /** Public origin of the site, e.g. https://porscha.today */
  SITE_URL: z.string().url().default("http://localhost:3000"),

  /** Postgres connection string. */
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .default("postgres://porscha:porscha_dev@localhost:5432/porscha"),

  /** Secret used to sign session cookies (32+ chars). */
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET must be at least 32 characters"),

  /**
   * AES-256 key encrypting TOTP secrets at rest: exactly 64 hex chars
   * (32 bytes). Independent of SESSION_SECRET. Generate with:
   *   openssl rand -hex 32
   */
  TWO_FACTOR_ENCRYPTION_KEY: z
    .string()
    .regex(
      /^[0-9a-fA-F]{64}$/,
      "TWO_FACTOR_ENCRYPTION_KEY must be exactly 64 hex characters (openssl rand -hex 32)",
    ),

  /** GitHub OAuth app for console sign-in. Optional until configured. */
  GITHUB_OAUTH_CLIENT_ID: z.string().optional(),
  GITHUB_OAUTH_CLIENT_SECRET: z.string().optional(),

  /** Comma-separated GitHub logins allowed into the console. */
  ALLOWED_GITHUB_LOGINS: z.string().default(""),

  /** Server-only token used for repository sync (never sent to clients). */
  GITHUB_TOKEN: z.string().optional(),

  /**
   * Stripe, for selling original pieces. Optional: with either value
   * missing, nothing in the gallery offers a purchase and the
   * checkout endpoint refuses.
   */
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  /**
   * Default currency for pieces that do not name their own.
   *
   * AUD is a deliberate porscha.today product decision — the shop
   * prices in the seller's own currency. It is not derived from where
   * any infrastructure happens to run; hosting region has no bearing on
   * what a buyer is charged. Change it here to change the shop.
   *
   * ISO 4217 alphabetic codes are three uppercase letters.
   */
  SALES_CURRENCY: z
    .string()
    .regex(
      /^[A-Z]{3}$/,
      "SALES_CURRENCY must be a 3-letter uppercase ISO 4217 code, e.g. AUD",
    )
    .default("AUD"),

  /** Shared secret for webhook signature verification. */
  GITHUB_WEBHOOK_SECRET: z.string().optional(),

  /**
   * Development-only escape hatch: enables a local "dev sign-in" that
   * bypasses GitHub OAuth. MUST NEVER be set in production.
   */
  AUTH_DEV_LOGIN: z.enum(["true", "false"]).default("false"),

  /** Snapshot staleness threshold in minutes (default 30). */
  SNAPSHOT_STALE_MINUTES: z.coerce.number().int().positive().default(30),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  const env = parsed.data;

  if (
    env.TWO_FACTOR_ENCRYPTION_KEY.toLowerCase() ===
    env.SESSION_SECRET.toLowerCase()
  ) {
    throw new Error(
      "TWO_FACTOR_ENCRYPTION_KEY must be independent of SESSION_SECRET.",
    );
  }

  if (env.AUTH_DEV_LOGIN === "true" && env.NODE_ENV === "production") {
    // Loud, unmissable, and refused unless explicitly forced for a
    // local production-build smoke test.
    if (process.env.AUTH_DEV_LOGIN_I_KNOW_WHAT_I_AM_DOING !== "true") {
      throw new Error(
        "AUTH_DEV_LOGIN must not be enabled in production. " +
          "Remove AUTH_DEV_LOGIN from the environment.",
      );
    }
    console.warn(
      "[env] WARNING: dev login is enabled in a production build. " +
        "This must only ever happen in a local smoke test.",
    );
  }

  return {
    ...env,
    isProduction: env.NODE_ENV === "production",
    devLoginEnabled: env.AUTH_DEV_LOGIN === "true",
    oauthConfigured: Boolean(
      env.GITHUB_OAUTH_CLIENT_ID && env.GITHUB_OAUTH_CLIENT_SECRET,
    ),
    githubSyncConfigured: Boolean(env.GITHUB_TOKEN),
    webhookConfigured: Boolean(env.GITHUB_WEBHOOK_SECRET),
    salesConfigured: Boolean(
      env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET,
    ),
    allowedLogins: env.ALLOWED_GITHUB_LOGINS.split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  };
}

export const env = loadEnv();
export type Env = ReturnType<typeof loadEnv>;
