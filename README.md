# porscha.today

POR$CHA — Founder • Artist • Builder. An editorial magazine printed on
black, in three worlds: an art practice, a software company, and the
authenticated operational console where both get built.

## What it is

**Public magazine.** ART • APPS • HEADQUARTERS:

- `/` — the cover: masthead, portrait, socials, and the three worlds
- `/art` — OBRA by Porscha; originals, one of one (+ `/art/[piece]`)
- `/apps` — Apps by Chaos Origins, one spread per product
- `/headquarters` — the operating layer: focus, bench, notes, experiments
- `/porscha` — biography
- `/workshop` — the central project index (+ `/workshop/[project]`)
- `/lab` — numbered experiments (+ `/lab/[experiment]`)
- `/notes` — lightweight Markdown publishing (+ `/notes/[slug]`)

`/gallery` permanently redirects to `/art`; `/gallery/[piece]` stays a
live alias (Stripe returns buyers to it) that declares `/art/[piece]` as
its canonical URL.

Projects show curated, near-realtime development progress derived from
GitHub **without exposing private repository information** — every signal
is gated by an explicit per-project visibility flag.

**Private console.** After signing in (GitHub OAuth, allowlisted), the
same site becomes Porscha's operational console at `/console`:

- Overview — greeting, calculated active/attention/quiet counts
- Workbench — per-project status, branch, CI health, milestone, recency
- Attention — only genuinely actionable problems (failed CI, stale PRs,
  stalled milestones, unexpected inactivity, sync failures)
- Activity — unified filterable stream across all registered projects
- Project detail — PRs, issues, CI, commits, releases, branches, milestones
- Live updates over Server-Sent Events, with staleness fallbacks
- Settings → Gallery — the wall's pieces, categories and display
- Settings → Photography — every editorial photograph on the public
  site, including one frame per app; uploads land in R2 and a slot with
  no photograph shows a reserved plate at the same proportions

v1 is **read-only** by design; the service layer is structured so write
actions (merge, rerun, create issue) can be added safely later.

## Stack

- **Next.js 16** (App Router, Turbopack) + **TypeScript** + **Tailwind v4**
- **PostgreSQL** via **Drizzle ORM** (migrations in `drizzle/`)
- **GitHub webhooks** → signature-verified ingestion → normalized activity
  + per-project snapshots; REST reconciliation sync as fallback
- **jose**-signed session cookies; GitHub OAuth for console sign-in
- **Vitest** for unit + integration tests
- Markdown content (gray-matter + marked) for notes/lab/gallery/bio

## Quick start

```bash
npm install
cp .env.example .env.local        # fill in SESSION_SECRET at minimum
createdb porscha                  # or use docs/SETUP.md's full walkthrough
npm run db:migrate
npm run dev
```

Development conveniences:

- `AUTH_DEV_LOGIN=true` in `.env.development.local` enables a local
  "Dev sign-in" button on `/login` (never allowed in production).
- Without `GITHUB_TOKEN`, sync is skipped and pages show honest
  empty/stale states.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript (run `npx next typegen` first if route types are missing) |
| `npm test` | Vitest (integration tests skip if Postgres is down) |
| `npm run db:generate` | Generate SQL migration from schema changes |
| `npm run db:migrate` | Apply migrations |

## The portrait

The homepage hero renders Porscha's editorial portrait from
`public/portrait/porscha.jpg` (or `.png`/`.webp`). Until the file exists,
an intentional placeholder composition holds the slot. See
`public/portrait/README.md` for guidance.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — architecture, data
  model, GitHub integration, the public/private boundary, realtime
- [`docs/SETUP.md`](docs/SETUP.md) — local setup, environment variables,
  database, webhook configuration, deployment, testing
- [`docs/DEPLOY.md`](docs/DEPLOY.md) — production deployment runbook
  (Cloudflare Workers + OpenNext + Hyperdrive + Supabase) and
  verification
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — known limitations, future
  roadmap, release notes
