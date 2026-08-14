# Setup & operations

## Local development

Prerequisites: Node 22+, PostgreSQL 14+.

```bash
# 1. Install dependencies
npm install

# 2. Create the database
sudo -u postgres psql \
  -c "CREATE USER porscha WITH PASSWORD 'porscha_dev' CREATEDB;" \
  -c "CREATE DATABASE porscha OWNER porscha;"

# 3. Configure the environment
cp .env.example .env.local
# set SESSION_SECRET:  openssl rand -hex 32

# 4. Apply migrations
npm run db:migrate

# 5. Run
npm run dev
```

The registry (seed projects, milestones) is upserted into the database
automatically on first data access — no separate seed step.

To work on the console without a GitHub OAuth app, create
`.env.development.local` containing `AUTH_DEV_LOGIN=true`; a
"Dev sign-in" button appears on `/login`. This file is only loaded by
`next dev`, and env validation refuses the flag in production.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `SITE_URL` | yes | Public origin, e.g. `https://porscha.today` |
| `DATABASE_URL` | yes | Postgres connection string |
| `SESSION_SECRET` | yes | 32+ chars; signs session cookies |
| `GITHUB_OAUTH_CLIENT_ID` / `GITHUB_OAUTH_CLIENT_SECRET` | for sign-in | OAuth app for console auth |
| `ALLOWED_GITHUB_LOGINS` | for sign-in | Comma-separated allowlist for `/console` |
| `GITHUB_TOKEN` | for sync | Fine-grained PAT (read-only: contents, issues, PRs, actions) |
| `GITHUB_WEBHOOK_SECRET` | for webhooks | Shared secret for signature verification |
| `SNAPSHOT_STALE_MINUTES` | no | Staleness threshold (default 30) |
| `AUTH_DEV_LOGIN` | never in prod | Local dev sign-in |

Validation happens once at boot in `src/server/env.ts`; a misconfigured
environment fails loudly with a field-by-field message.

## GitHub configuration

**OAuth app** (console sign-in): create at
GitHub → Settings → Developer settings → OAuth Apps with callback URL
`<SITE_URL>/api/auth/callback`.

**Webhook** (per repository, or once at the organization level):

- Payload URL: `<SITE_URL>/api/github/webhook`
- Content type: `application/json`
- Secret: the value of `GITHUB_WEBHOOK_SECRET`
- Events: `push`, `pull_request`, `issues`, `workflow_run`, `release`

Deliveries from repositories that aren't in the registry are accepted
and dropped, so an org-wide webhook is safe.

**Sync token**: a fine-grained PAT restricted to the registered
repositories with read-only Contents, Issues, Pull requests, and
Actions permissions. Set as `GITHUB_TOKEN`. Then use the console's
"Sync from GitHub" button (or `POST /api/console/sync` as the owner)
for the initial snapshot population and any reconciliation.

## Registering a new project

1. Add a `ProjectConfig` entry in `src/config/registry.ts` (slug, name,
   description, status, optional `github.repository`, and — explicitly —
   each visibility flag).
2. Optionally add a story in `src/content/projects/<slug>.md`.
3. Deploy; the registry upserts on first access. Run a sync to populate
   the snapshot.

Nothing becomes public without its visibility flag; new repositories
are private-by-default.

## Production deployment

Any Node host works (the app is a standard Next.js server — it needs a
long-lived process for SSE; serverless platforms will degrade SSE to
the polling fallback):

```bash
npm ci
npm run build
npm start          # respects PORT
```

- Point `DATABASE_URL` at managed Postgres and run
  `npm run db:migrate` during deploy.
- Set all required env vars; never set `AUTH_DEV_LOGIN`.
- Put the app behind TLS (session cookies are `Secure` in production).
- `/console` and `/api` are `noindex` + robots-disallowed already.

## Testing

```bash
npm run lint
npm run typecheck     # npx next typegen first on a fresh clone
npm test              # unit + integration (integration skips w/o DB)
npm run build
```

The test suite covers the public/private boundary (secret-leak
assertions), webhook signature verification, duplicate-delivery
handling, event normalization, milestone progress, and attention
derivation.

Manual smoke checklist: sign in via `/login`, run a sync, deliver a
test webhook (GitHub's "Redeliver" button works), watch the console
update without a reload, and confirm `/api/public/projects` contains no
repository names, counts, branches, or titles for private projects.
