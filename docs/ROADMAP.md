# Known limitations, roadmap, release notes

## Known limitations (v1)

- **Read-only console.** No GitHub write actions (merge, rerun, create,
  comment) — by design. The service layer and route structure leave
  room to add them behind explicit confirmation flows.
- **Webhook-patched counts are partial.** A `pull_request` webhook logs
  activity and freshness but does not recount open PRs/issues; the
  reconciliation sync owns full snapshot rebuilds. Between syncs, list
  detail can lag the activity stream.
- **Realtime fan-out is runtime-specific.** On Cloudflare Workers the
  SSE bus is a Durable Object, so live pushes reach every connected
  client regardless of which isolate ingested the event. On a plain
  Node server the bus is in-process: multiple instances still work —
  clients fall back to polling — but live pushes only reflect events
  ingested by the instance a client is connected to.
- **Registry-backed projects.** Registry, milestones and work items are
  still edited in code; page content and the gallery are console-owned.
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
4. **Durable realtime on Node hosts** — the Workers runtime already
   fans out through a Durable Object; if the app ever returns to a
   multi-instance Node host, swap the in-process bus for Postgres
   LISTEN/NOTIFY so SSE survives that too.
5. **Workshop state automation** — derive Open/Working/Quiet from
   recent activity rather than configuration, if it ever feels honest.
6. **Gallery media pipeline** — original-quality uploads with generated
   responsive variants.

## Release notes

### v0.3.0 — the studio

- Settings → Pages: every word, list and image on the public site is
  editable from the console, per page, with a live preview and a
  "back to defaults" switch. Content is stored per page in
  `site_settings` and validated on both sides by shared zod schemas.
- The wall is console-owned: migration 0007 adopts the 32 committed
  pieces as editable rows. Category is a dropdown, year is optional,
  and a description for screen readers can be set per piece.
- Every console upload passes through metadata stripping (EXIF, XMP,
  IPTC, including GPS) before it is stored.
- "I write songs." joins the fragments.
- The signature is now the wax seal (`public/brand/seal.png`), used in
  the header, footer, margins, browser icons and the social preview.
  New opening portrait.
- The interface follows the boards: photographic doors on the opening
  screen, wide photographic windows on Work, a full-width project
  picture with numbered sections on Building, a picture beside the
  snapshot on Today, and on Me a “little about” opening, filter chips
  over the fragments, chapters on a timeline and a full-bleed ending
  with buttons. Every new picture, note and section is editable from
  Settings → Pages; rows saved before a section existed are filled
  from the defaults rather than discarded.


### v0.2.0 — the introduction

- Public site rebuilt around controlled discovery: opening screen,
  My work, Sulit Co., Currently, Obra, and Who I am (Fragments, the
  Making interlude, Selected chapters, The little things, an ending).
- Visitor-facing copy moved into typed content modules under
  `src/content/site/`; Markdown remains for file-backed gallery pieces.
- Warm ivory / near-black / deep olive palette; Fraunces + Inter;
  single-theme public site (the console keeps its dark variant).
- Old routes redirect permanently; Stripe return URLs follow the gallery
  to `/art`. Project pages are no longer public; the console keeps its
  privacy-boundary preview of the public DTO.
- No analytics or trackers, as before. Static social preview image,
  Person structured data, sitemap and robots refreshed.
- Placeholder images are documented in `public/placeholders/README.md`
  and gallery placeholders retire themselves once real work is hung.


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
