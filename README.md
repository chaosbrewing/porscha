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

Everything a visitor reads is editable in the console under
**Settings → Pages**: pick a page from the dropdown, change any word,
list or picture, save, and it is live. Each page is stored as one JSON
document in `site_settings` (key `site.page.<name>`), validated by the
schemas in `src/content/site/schema.ts`. "Back to defaults" drops the
stored document and the page returns to the typed defaults:

| Page | Defaults | Fields |
| --- | --- | --- |
| Site-wide | `src/content/site/global.ts` | name, description, navigation, social links, contact |
| Home | `src/content/site/home.ts` | opening lines, the question, the doors, the one image, note |
| My work | `src/content/site/work.ts` | heading, intro, the three windows |
| What I’m building | `src/content/site/work.ts` | eyebrow, header, sub-header, projects (logo, name, description, media, linked text) |
| Experiments | `src/content/site/work.ts` | heading, intro, empty note, items |
| Currently | `src/content/site/now.ts` | snapshot rows, updated, note |
| Who I am | `src/content/site/me.ts` | fragments, Making, chapters, little things, ending |

The editor is driven by `src/components/console/site-editor/fields.ts`;
adding a field there (and to the schema) is how new content becomes
editable. Obra is managed under **Settings → Gallery**: every piece is a
console-owned row in `gallery_items`, uploads go to R2 with EXIF, XMP
and IPTC stripped, and categories group the wall.

`npm test` checks that every page's defaults satisfy its schema, that
links resolve, that images exist, and that nothing that looks like a
phone number, email address or street address is published.

## Images

The approved portrait lives at `public/portrait/porscha.jpg` and is the
one visual on the opening screen. The wax-seal mark in the header,
footer and social preview lives at `public/brand/seal.png`; the browser
icons are `src/app/icon.png` and `src/app/apple-icon.png`. Obra's original images live in
`public/art/` until replaced from the console. The remaining images on
`/me` are documented placeholders (see `public/placeholders/README.md`);
replace them from Settings → Pages → Who I am. Uploads through the
console are stripped of metadata; anything committed directly should be
exported without EXIF or location data.

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
