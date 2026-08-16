# Production deployment — porscha.today

Release: branch `claude/porscha-today-build-6ifsus`, commit `335c557`.
Host: Railway (Node server; SSE-compatible). Database: Supabase Postgres.

## Already done (2026-08-14)

- **Production database provisioned**: Supabase project `porscha-today`
  (ref `rdgsveeporyiplsnztzw`, region `ap-southeast-2`, Postgres 17,
  ~$10/month on the Chaos Prydre org).
- **Migrations applied**: the full `drizzle/0000_init.sql` schema is
  live (12 tables + indexes + FKs). Drizzle's migration journal is
  seeded, so the app's `npm run db:migrate` recognizes the schema as
  current and is a safe no-op on boot.
- **Data-API hardening**: Row Level Security is enabled with no
  policies on every table, so Supabase's auto-generated REST/GraphQL
  API can never expose application data. The app itself connects
  directly over Postgres as the table owner and is unaffected.
- **Deploy config in repo**: `railway.json` (build + `db:migrate`-then-
  `start` boot, health check on `/`), a manual `Deploy to Railway`
  GitHub Action, and `scripts/verify-production.mjs`.

## 1. Railway service (~5 minutes, needs the Railway account)

1. railway.com → New Project → **Deploy from GitHub repo** →
   `chaosbrewing/porscha`, branch `claude/porscha-today-build-6ifsus`
   (or `main` once merged). Railway picks up `railway.json`
   automatically: `npm ci && npm run build`, then
   `npm run db:migrate && npm start`.
2. Service → **Variables** — set:

   | Variable | Value |
   | --- | --- |
   | `SITE_URL` | `https://porscha.today` |
   | `DATABASE_URL` | Supabase **Session pooler** string — dashboard → project `porscha-today` → Connect → "Session pooler" (IPv4-compatible, port 5432). Looks like `postgresql://postgres.rdgsveeporyiplsnztzw:<DB_PASSWORD>@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres`. Reset the DB password there if unknown. Use session mode, not the transaction pooler, for this long-lived server. |
   | `SESSION_SECRET` | `openssl rand -hex 32` |
   | `TWO_FACTOR_ENCRYPTION_KEY` | `openssl rand -hex 32` — encrypts TOTP secrets at rest; must differ from `SESSION_SECRET`. Production refuses to boot without it. |
   | `ALLOWED_GITHUB_LOGINS` | `chaosbrewing` |
   | `GITHUB_OAUTH_CLIENT_ID` / `GITHUB_OAUTH_CLIENT_SECRET` | from step 3 |
   | `GITHUB_TOKEN` | fine-grained PAT, read-only Contents/Issues/PRs/Actions on the registry repos (kubli, PRISM, habi, the-whispering-city, cloakli) |
   | `GITHUB_WEBHOOK_SECRET` | `openssl rand -hex 32` (same value used in step 4) |

   Do **not** set `AUTH_DEV_LOGIN` — the app refuses to boot in
   production with it enabled.
3. Service → **Settings → Networking**: add custom domains
   `porscha.today` and `www.porscha.today`. Railway shows a target
   hostname per domain and provisions origin TLS once DNS resolves.
4. Optional CI deploys afterwards: add a Railway project token as the
   `RAILWAY_TOKEN` Actions secret (+ `RAILWAY_SERVICE_ID` repo
   variable) and use the manual **Deploy to Railway** workflow.

## 2. Cloudflare DNS + TLS (needs the Cloudflare account)

1. DNS: replace the current apex record with a **CNAME** for
   `porscha.today` → the Railway target from step 1.3 (Cloudflare
   flattens apex CNAMEs automatically). Add `www` → its Railway target
   (or → `porscha.today`). Keep both **proxied (orange cloud)**.
2. SSL/TLS → Overview: set **Full (strict)**. Never Flexible.
3. Rules → Redirect Rules: `www.porscha.today/*` → 301 →
   `https://porscha.today/$1` (canonical apex).
4. The previous **525** came from having no origin; once Railway's
   origin certificate is issued and DNS points at it, reload
   https://porscha.today and confirm the 525 is gone.

## 3. GitHub OAuth app (needs the GitHub account)

GitHub → Settings → Developer settings → OAuth Apps → New:

- Homepage URL: `https://porscha.today`
- Authorization callback URL: `https://porscha.today/api/auth/callback`

Copy the client ID + a client secret into the Railway variables.
(OAuth apps cannot be created via API — this is a dashboard step.)

## 4. GitHub webhooks (needs admin on the registry repos)

On each of `chaosbrewing/kubli`, `chaosbrewing/PRISM`,
`chaosbrewing/habi`, `chaosbrewing/the-whispering-city`
(org-level webhook also works — unregistered repos are ignored):

- Payload URL: `https://porscha.today/api/github/webhook`
- Content type: `application/json`
- Secret: the `GITHUB_WEBHOOK_SECRET` value
- Events: `push`, `pull_request`, `issues`, `workflow_run`, `release`

## 5. Verify

```bash
node scripts/verify-production.mjs            # against https://porscha.today
```

checks every public route, 404s, the canonical headline + portrait,
console/API/SSE auth protection, unsigned-webhook rejection, and that
the public API leaks no private repository signals.

Then, by hand:

1. **First sign-in enrolls 2FA (mandatory).** `/console` redirects to
   sign-in → GitHub OAuth → allowlist check → you land on
   `/login/setup-2fa`: scan the QR with any TOTP authenticator, confirm
   a six-digit code, save the ten one-time recovery codes, acknowledge.
   Only then does a full console session exist. Every later sign-in is
   OAuth → `/login/verify` → authenticator code (recovery code as
   fallback). GitHub OAuth alone never opens the console, and there is
   no way to casually disable 2FA — the security page (`/console/security`)
   offers recovery-code regeneration and authenticator replacement,
   both behind a fresh TOTP challenge.
2. Any non-allowlisted GitHub account is refused; sign-out works.
3. Console → **Sync from GitHub** — populates every project snapshot
   (needs `GITHUB_TOKEN`).
4. In a repo's webhook settings, use **Redeliver** on a delivery —
   confirm 200 `processed`, redeliver again → `duplicate`, and watch
   the console update without a reload (indicator: Live).
5. Check Railway logs: no secrets, no crash loops.

Session-state checks (`verify-production.mjs` covers the anonymous
cases; run it with `SESSION_SECRET=<production value>` in the
environment to additionally mint synthetic OAuth-only and pending-2FA
sessions and prove both are rejected by `/console`, the private APIs,
and the project-admin APIs).

## Rollback / notes

- Roll back = redeploy the previous commit from Railway's deploy list;
  the schema has no destructive migrations to unwind.
- Prefer Railway's own Postgres instead? Provision it, point
  `DATABASE_URL` at it, and let boot-time `db:migrate` build the
  schema; then delete the Supabase project to stop its $10/month
  charge. The Supabase project is otherwise ready and hardened.
