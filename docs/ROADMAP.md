# Known limitations, roadmap, release notes

## Known limitations (v1)

- **Read-only console.** No GitHub write actions (merge, rerun, create,
  comment) — by design. The service layer and route structure leave
  room to add them behind explicit confirmation flows.
- **Webhook-patched counts are partial.** A `pull_request` webhook logs
  activity and freshness but does not recount open PRs/issues; the
  reconciliation sync owns full snapshot rebuilds. Between syncs, list
  detail can lag the activity stream.
- **Single-process realtime.** The SSE bus is in-process. Multiple
  instances still work — clients fall back to polling — but live pushes
  only reflect events ingested by the instance a client is connected to.
- **Configuration-backed content editing.** Registry, milestones, work
  items, and site settings are edited in code. The database tables for
  gallery/lab/notes exist but are unused (extension point).
- **Milestone weighting** is not implemented; progress is a flat
  done/total ratio of scoped work items.
- **No visitor analytics** of any kind (deliberate for now).

## Future roadmap

1. **Write actions** — rerun workflow, merge PR, create issue; POST
   routes with confirmation UI, building on the existing guards.
2. **Private editing interface** — milestones/work items and the
   homepage "currently" line editable from the console, backed by the
   existing `site_settings` and content tables.
3. **Milestone weighting** and per-item GitHub issue linkage (the
   `github_issue_number` column already exists).
4. **Durable realtime** — swap the in-process bus for Postgres
   LISTEN/NOTIFY so SSE survives multi-instance deployments unchanged.
5. **Workshop state automation** — derive Open/Working/Quiet from
   recent activity rather than configuration, if it ever feels honest.
6. **Gallery media pipeline** — original-quality uploads with generated
   responsive variants.

## Release notes

### v0.1.0 — first release

- Public workshop: editorial homepage with portrait slot, Workshop,
  Apps, Lab, Gallery, Notes, and Porscha pages; SEO metadata, sitemap,
  robots; accessible, responsive, reduced-motion-aware.
- Project registry with explicit per-signal visibility; seeded with
  Kubli, PRISM, habi, The Whispering City, and archived cloakli.
- GitHub ingestion: signature-verified webhook endpoint with duplicate
  protection, normalized activity events, per-project snapshots,
  REST reconciliation sync with failure surfacing.
- Strict public/private DTO boundary with leak-tests.
- Console: GitHub OAuth (allowlisted) + guarded APIs, overview with
  calculated counts, attention feed, workbench, filterable activity
  stream, project detail (PRs, issues, CI, commits, releases,
  branches, milestones), manual sync.
- Realtime: SSE live updates with Live/Updating/Delayed/Disconnected
  states and polling fallback; snapshot staleness indicators.
- Postgres data model via Drizzle with SQL migrations; zod-validated
  environment; Vitest unit + integration suite.
