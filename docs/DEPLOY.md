# Production deployment — porscha.today

Host: **Cloudflare Workers** (Next.js via `@opennextjs/cloudflare`).
Database: **Supabase Postgres** behind a **Cloudflare Hyperdrive**
binding. Cloudflare terminates TLS for the custom domains and serves
the application directly — there is no separate origin.

```
porscha.today
    ↓
Cloudflare Worker (custom domain, Cloudflare TLS)
    ↓
Next.js via @opennextjs/cloudflare  (+ RealtimeHub Durable Object for SSE)
    ↓
Hyperdrive binding (HYPERDRIVE)
    ↓
Supabase Postgres
```

Repo pieces that make this work:

- `wrangler.jsonc` — Worker config: custom entry, `nodejs_compat`,
  assets, custom domains, `HYPERDRIVE` + `REALTIME_HUB` bindings,
  non-secret vars.
- `open-next.config.ts` — OpenNext adapter config (no ISR cache backend
  needed: dynamic routes are dynamic, static pages ship as assets).
- `workers/entry.js` — wraps the generated handler; www→apex redirect;
  exports the `RealtimeHub` Durable Object (console SSE fan-out).
- `scripts/migrate.mjs` — explicit migration runner (the Worker never
  migrates; see §5).
- `.github/workflows/deploy-cloudflare.yml` — manual QA-gated deploy.

## 1. One-time Cloudflare setup

Prereqs: the Cloudflare account that owns the `porscha.today` zone,
and `npx wrangler login` (or an API token in `CLOUDFLARE_API_TOKEN`).

### 1a. Hyperdrive config

Create the Hyperdrive config from the Supabase Postgres connection
string (dashboard → project `porscha-today` → Connect; prefer the
**direct** connection string — Hyperdrive is the pooler here. If the
direct/IPv6 host is unreachable from your network, the **session
pooler** string also works):

```sh
npx wrangler hyperdrive create porscha-today-db \
  --connection-string="postgresql://postgres:<DB_PASSWORD>@db.rdgsveeporyiplsnztzw.supabase.co:5432/postgres"
```

Paste the returned `id` into the `hyperdrive` block of
`wrangler.jsonc` (replacing `REPLACE_WITH_HYPERDRIVE_ID`) and commit.
The connection string lives only inside Hyperdrive; the Worker sees a
`HYPERDRIVE` binding, and the browser sees nothing.

### 1b. Worker secrets

Set each of these once (`npx wrangler secret put <NAME>`, paste value
when prompted). Values must never be committed or put in
`wrangler.jsonc`:

| Secret | Value |
| --- | --- |
| `SESSION_SECRET` | `openssl rand -hex 32` |
| `TWO_FACTOR_ENCRYPTION_KEY` | `openssl rand -hex 32` — encrypts TOTP secrets at rest; **must differ** from `SESSION_SECRET`; production refuses to serve without it |
| `GITHUB_OAUTH_CLIENT_ID` | from §2 |
| `GITHUB_OAUTH_CLIENT_SECRET` | from §2 |
| `GITHUB_TOKEN` | fine-grained PAT, read-only Contents/Issues/PRs/Actions on the connected repos |
| `GITHUB_WEBHOOK_SECRET` | `openssl rand -hex 32` (same value as the GitHub webhook, §3) |

Non-secret config (`SITE_URL`, `ALLOWED_GITHUB_LOGINS`,
`SNAPSHOT_STALE_MINUTES`) is versioned in `wrangler.jsonc` `vars`.
Do **not** set `AUTH_DEV_LOGIN` in production — the app refuses it.

### 1c. Custom domains

`wrangler.jsonc` declares `porscha.today` and `www.porscha.today` as
Workers **custom domains**; the first `wrangler deploy` registers both
on the zone and provisions Cloudflare-managed TLS. Remove any old DNS
records pointing those hostnames at Railway (or other origins) first —
custom domains replace them with Worker routes. `workers/entry.js`
301-redirects www → apex.

## 2. GitHub OAuth app

<https://github.com/settings/developers> → OAuth Apps:

- Homepage URL: `https://porscha.today`
- Authorization callback URL: `https://porscha.today/api/auth/callback`

Put the client id/secret into Worker secrets (§1b). Console access is
OAuth → `ALLOWED_GITHUB_LOGINS` allowlist → mandatory TOTP.

## 3. GitHub webhooks

On each connected repository (or the org): webhook →
`https://porscha.today/api/github/webhook`, content type
`application/json`, secret = `GITHUB_WEBHOOK_SECRET`, events: pushes,
issues, pull requests, releases, workflow runs. Deliveries are
HMAC-verified (constant-time) and deduplicated by delivery id.

## 4. GitHub Actions secrets (for CI deploys)

| Actions secret | Purpose |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Workers deploy (API token with Workers Scripts:Edit, Workers Custom Domains, Hyperdrive:Read) |
| `CLOUDFLARE_ACCOUNT_ID` | account id (dashboard → Workers & Pages → right sidebar) |
| `DATABASE_URL` | Supabase Postgres string, used **only** by the migration step |

## 5. Migrations

Migrations are an **explicit deployment step**, never implicit in the
Worker (multiple isolates must not race schema changes):

- CI path: the **Deploy to Cloudflare** workflow runs
  `node scripts/migrate.mjs` (drizzle-orm migrator, same
  `drizzle.__drizzle_migrations` journal as drizzle-kit) in its single
  job before `wrangler deploy`, and refuses to deploy unmigrated.
- Manual path: `DATABASE_URL="<supabase string>" npm run db:migrate`
  from a trusted machine, then deploy.

Migrations are additive; already-applied ones are skipped, so re-runs
are safe no-ops.

## 6. Deploying

- **CI (preferred)**: Actions → **Deploy to Cloudflare** → run. Gates:
  `npm ci`, lint, typegen+typecheck, tests, OpenNext build; then
  migrations, `wrangler deploy`, and a live verification pass.
- **Local**: `npm run deploy:cloudflare` (requires `wrangler login`;
  run migrations first).
- **Worker-runtime preview** (no deploy): `npm run preview:cloudflare`
  — builds with OpenNext and serves the real Worker bundle in workerd
  via `wrangler dev`, using the `localConnectionString` from
  `wrangler.jsonc` instead of production Hyperdrive.

## 7. Verification

```sh
node scripts/verify-production.mjs https://porscha.today   # read-only checks
node scripts/diagnose-origin.mjs  https://porscha.today   # who is serving + www redirect
```

or the **Verify production** / **Diagnose origin** workflows. Beyond
that, verify by hand: sign in (OAuth → TOTP), console shows **Live**
(SSE), a webhook test delivery updates the console, and the public
site never exposes private repo data.

## 8. Rollback

Application rollbacks never require touching the database — migrations
are additive, and old application code runs fine against a newer
schema.

- `npx wrangler deployments list` — find the previous deployment.
- `npx wrangler rollback` (optionally with the deployment id) —
  restores the previous Worker version, including its assets.
- Alternatively: check out the previous commit and run the deploy
  workflow/`npm run deploy:cloudflare` again.

Never roll the schema back as part of an app rollback; write a new
forward migration instead if a schema change must be undone.

## 9. Historical notes (clearly marked, kept for context)

- **2026-08-14 — Supabase provisioning**: project `porscha-today`
  (ref `rdgsveeporyiplsnztzw`, region `ap-southeast-2`, Postgres 17).
  Schema migrated; drizzle journal seeded; RLS enabled with no
  policies so Supabase's auto-generated REST/GraphQL API can never
  expose application data (the app connects directly over Postgres as
  table owner and is unaffected). All still true and in use.
- **Retired 2026-08-17 — Railway hosting**: the previous plan deployed
  a Node/Docker server to Railway (`railway.json`, `Dockerfile`,
  Docker-verify and Railway-deploy workflows). Railway never went
  live (its edge answered `Application not found`); the migration to
  Cloudflare Workers replaced all of it. No Railway configuration,
  tokens, domains, or PORT semantics remain in the codebase.
