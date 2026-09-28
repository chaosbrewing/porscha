# porscha.today

Porscha's place on the internet: an introduction, not a biography.
Visitors gradually meet her through selected work, art, a living
snapshot and small fragments — without being handed her private life.
Behind sign-in, the same app is her private operational console.

## What it is

**Public site.** Controlled discovery through four windows into the
same person:

- `/` — the opening screen: a name, two lines, a question, four doors
- `/work` — My work: Sulit Co., Obra, Experiments (+ `/work/experiments`)
- `/building` — Sulit Co., as an editorial project page
- `/now` — Currently: a living snapshot table
- `/art` — Obra, a small digital gallery (+ `/art/[piece]`)
- `/me` — Who I am: Fragments, the Making interlude, Selected chapters,
  The little things, and an intentional ending

Everything a visitor reads lives as plain data in `src/content/site/`
(see [Content](#content)). Old routes (`/porscha`, `/workshop`, `/apps`,
`/lab`, `/notes`, `/gallery`) redirect permanently to their successors.

**Private console.** After signing in (GitHub OAuth, allowlisted), the
same site becomes Porscha's operational console at `/console`:

- Overview — greeting, calculated active/attention/quiet counts
- Workbench — per-project status, branch, CI health, milestone, recency
- Attention — only genuinely actionable problems (failed CI, stale PRs,
  stalled milestones, unexpected inactivity, sync failures)
- Activity — unified filterable stream across all registered projects
- Project detail — PRs, issues, CI, commits, releases, branches, milestones
- Settings — the Obra gallery: upload pieces, order, hide, sell originals
- Live updates over Server-Sent Events, with staleness fallbacks

Projects tracked in the console are private tooling; the public site no
longer lists them. Only intentionally selected work is published.

## Stack

- **Next.js 16** (App Router, Turbopack) + **TypeScript** + **Tailwind v4**
- **PostgreSQL** via **Drizzle ORM** (migrations in `drizzle/`)
- **GitHub webhooks** → signature-verified ingestion → normalized activity
  + per-project snapshots; REST reconciliation sync as fallback
- **jose**-signed session cookies; GitHub OAuth for console sign-in
- **Vitest** for unit + integration tests
- Typed content modules for the public site; Markdown (gray-matter +
  marked) for file-backed gallery pieces

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

## Content

| What | Where |
| --- | --- |
| Opening screen, navigation, site title | `src/content/site/site.ts` |
| Currently snapshot | `src/content/site/currently.ts` |
| Fragments | `src/content/site/fragments.ts` |
| Making interlude | `src/content/site/making.ts` |
| Selected chapters | `src/content/site/chapters.ts` |
| The little things | `src/content/site/little-things.ts` |
| My work, Sulit Co., Experiments | `src/content/site/work.ts` |
| Social links, contact, the ending | `src/content/site/links.ts` |
| Gallery pieces (file-backed) | `src/content/gallery/*.md` (console uploads live in Postgres/R2) |

`npm test` checks the content layer: every link points somewhere real,
every image exists, and nothing that looks like a phone number, email
address or street address is published.

## Images

The approved portrait lives at `public/portrait/porscha.jpg` and is the
one visual on the opening screen. Obra's file-backed paintings live in
`public/art/`. The remaining images on `/me` are documented placeholders;
see `public/placeholders/README.md` for exactly what should replace each
file. Export images without EXIF or location metadata.

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
