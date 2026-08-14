# Architecture

## Product summary

porscha.today is a living digital workshop with two personalities:

1. **Public workshop** — an editorial site where visitors learn who
   Porscha is, what she makes, and what's currently moving, with
   curated near-realtime progress derived from GitHub.
2. **Private console** — after authentication, the same application is
   Porscha's operational headquarters: what moved today, what needs
   attention, CI health, PRs, issues, milestones, releases.

Target users: visitors/curious peers (public), and exactly one owner
plus explicitly allowlisted collaborators (console).

## Core journeys

**Public:** land on `/` → immediately understand who/what/current →
explore Workshop, Apps, Lab, Gallery, Notes, Porscha.

**Owner:** land on `/console` (redirects to `/console/overview`) →
within seconds answer: what moved, what needs me, are builds healthy,
what's in review, which milestones progress, what went quiet.

## System shape

```
GitHub
   │ webhook (signed)
   ▼
/api/github/webhook ── verify signature ── dedupe delivery id
   │
   ▼
normalizeWebhookEvent()          githubClient + syncProjectFromGitHub()
   │  (fixed public vocabulary)     (REST reconciliation fallback)
   ├── project_activity row                 │
   └── snapshot patch  ◄────────────────────┘  full snapshot rebuild
               │
               ▼
     project_snapshots (Postgres)
               │
        ┌──────┴───────────┐
        ▼                  ▼
 toPublicProjectView   toPrivateProjectView
        │                  │
        ▼                  ▼
  Public API/pages    Console API/pages ── SSE stream ── browser
```

Key modules (all under `src/`):

| Path | Responsibility |
| --- | --- |
| `config/registry.ts` | The explicit project registry + visibility flags |
| `config/site.ts` | Site settings, workshop state, nav |
| `server/env.ts` | zod-validated environment, parsed once |
| `server/db/` | Drizzle schema + pooled client |
| `server/github/` | verify, normalize, ingest, REST client, sync |
| `server/projects/` | store (SQL), progress, attention, transformers, service |
| `server/auth/` | session (jose), GitHub OAuth, guards |
| `server/realtime/bus.ts` | in-process event bus feeding SSE |
| `server/content/loader.ts` | Markdown collections (notes/lab/gallery/bio) |
| `app/(public)/` | public routes |
| `app/console/` | console routes (guarded in layout AND per-API) |
| `app/api/` | auth, webhook, public API, console API, SSE |

UI components live in `components/{public,console,shared}`; UI never
talks to GitHub or the database directly — only to the service layer.

## Data model

Postgres tables (Drizzle schema in `src/server/db/schema.ts`):

- `users` — console sign-ins (id `github:<login>`)
- `projects` — mirrored from the typed registry (idempotent upsert)
- `project_github_connections` — repo per project + last sync result
- `project_milestones` / `project_work_items` — explicit scoped work;
  **progress derives only from completed work items**, never commits
- `project_activity` — normalized events; `public_summary` (safe) +
  `private_payload` (console-only)
- `project_snapshots` — current normalized repository state per project,
  so page loads never reconstruct from raw event history
- `webhook_deliveries` — processed delivery IDs (duplicate protection)
- `site_settings` — key/value extension point
- `gallery_items`, `lab_experiments`, `notes` — file-backed in v1;
  tables exist as the extension point for a future editing interface

The registry (`ProjectConfig`) is the source of truth for identity,
status, visibility, and milestone definitions; the database holds the
GitHub-derived state joined onto it.

## GitHub integration

Two credentials, deliberately isolated:

- **OAuth app** (`GITHUB_OAUTH_CLIENT_ID/SECRET`) — authenticates
  Porscha for the console. Scope `read:user` only.
- **Sync token** (`GITHUB_TOKEN`) — server-only fine-grained PAT used by
  the reconciliation sync. Never involved in auth.

Ingestion paths:

1. **Webhooks** (primary, realtime): `POST /api/github/webhook` verifies
   `X-Hub-Signature-256` (HMAC, constant-time) against the raw body,
   records the delivery ID (retries/duplicates become no-ops), maps the
   repository to a registered project, normalizes to a fixed event
   vocabulary, patches the snapshot, and publishes to the realtime bus.
   Events from unregistered repositories are acknowledged and dropped.
2. **Reconciliation sync** (fallback): `POST /api/console/sync` (owner
   only) or programmatic `syncAllProjects()` rebuilds each snapshot from
   the REST API — repo info, open PRs/issues, workflow runs, releases,
   recent commits, branches. Failures record `last_sync_error`, which
   surfaces as an attention item; the last good snapshot is kept.

## The public/private boundary

This is enforced in one place — `src/server/projects/transformers.ts` —
not in UI code:

- `toPublicProjectView` is an **allowlist**: every public field is
  explicitly constructed, each GitHub-derived signal is emitted only if
  the project's corresponding visibility flag is true, and the
  snapshot's `private` section is never read. Repository URLs appear
  only when `publicRepository: true`.
- Webhook normalization generates `publicSummary` strings from a fixed
  vocabulary ("Development activity", "Change landed", "Build passing")
  — never from commit messages, titles, branch names, or usernames.
- Public activity timestamps are deliberately coarsened into signals
  ("Activity this week") on the public site.
- `toPrivateProjectView` carries operational detail and is only
  reachable through routes that pass `requireConsoleAccess()`.

Tests in `transformers.test.ts` assert that seeded secret strings can
never appear in a serialized public view; treat failures there as
release blockers.

## Authentication & authorization

- Session: `jose`-signed JWT in an httpOnly, `SameSite=Lax`, `Secure`
  cookie. No session state in the browser.
- Sign-in: GitHub OAuth with an HMAC-signed `state` cookie (CSRF).
- Authorization: `ALLOWED_GITHUB_LOGINS` allowlist, re-checked
  server-side on every console page load **and** every console API
  call. Route hiding is not relied on; console routes are also
  `noindex` and disallowed in robots.txt.
- Mutating endpoints (`logout`, `sync`) are POST-only with an origin
  check.
- Dev login exists only when `AUTH_DEV_LOGIN=true`; env validation
  refuses that flag in production builds.

## Realtime

- Webhook/sync publish to an in-process `EventEmitter` bus.
- `/api/console/stream` (SSE, authorized) forwards bus events with
  heartbeats every 25s.
- The client (`ConsoleLive`) refreshes the server-rendered console on
  events (debounced), tracks Live / Updating / Delayed / Disconnected,
  and falls back to slow polling while not live. Snapshot staleness is
  additionally computed server-side (`SNAPSHOT_STALE_MINUTES`).
- Single-process by design in v1; a multi-instance deployment degrades
  to the polling fallback rather than breaking.

## Design system

Tokens live in `src/app/globals.css` (`@theme`): warm paper surfaces,
dark ink text scale, hairline lines, one oxide accent, semantic
ok/warn/alert states, and motion durations (140/240/600ms) with a soft
ease. Typography: Fraunces (display), Inter (text), IBM Plex Mono (meta
labels) — all self-hosted via Fontsource. `prefers-reduced-motion`
disables entrances and the live pulse globally.
