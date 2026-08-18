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
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | for selling | Both required; absent disables purchasing entirely |
| `SALES_CURRENCY` | no | Shop's selling currency, 3 uppercase ISO 4217 letters (default `AUD`) |
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

## Gallery — OBRA

The public gallery is branded **OBRA by Porscha** and still lives at
`/gallery`; the route is unchanged so existing links and the piece
URLs Stripe checkouts return to keep working. Brand art is in
`public/brand/` — `obra-mark.jpg` heads the gallery, `porscha-logo.png`
is the site header. Both are photographed on their own ground rather
than knocked out, so each is shown on a matching plate; a
transparent PNG or SVG could sit directly on the page instead.

**Categories are free text.** `digital` and `canvas` are only the
suggestions offered in the console — anything typed becomes a
category the moment a piece uses it, normalised to lowercase
hyphenated form so a file-backed piece and a console one never split
a category in two. The settings page merges in every category
actually in use, so a newly invented one can still be renamed or
hidden. Discovered categories default to visible: a piece must never
vanish from the wall because nobody had configured its category yet.

**The image is uploaded, never typed.** The upload returns the path
it wrote and the aspect ratio it read from the file's own header
(`src/server/media/dimensions.ts` parses PNG, JPEG, and WebP headers
and the SVG `viewBox` — no decoding, no dependency, Workers-safe).
Accepted formats are PNG, SVG, JPG, and WebP.

**Alt text is derived from the title**, server-side. The field was
removed from the form, the attribute was not: shipping images with
no alt would make the gallery unusable with a screen reader.

The gallery has two sources, reconciled in `src/server/gallery/service.ts`:

- **Markdown** under `src/content/gallery`, baked into the content
  bundle at build time. The file owns the content.
- **`gallery_items` rows** with `origin = "console"` — pieces authored
  in **Console → Settings → Gallery**. The row *is* the piece.

Rows with `origin = "file"` are overlays carrying only console-owned
state (hidden / featured / manual position) for a file-backed piece.
They key off the file's slug, so an overlay can never shadow a
different piece, and a console piece may not claim a slug the bundle
already owns.

Page-level settings (heading, intro, columns, order, category labels
and visibility) live as one JSON row under the `gallery.display` key in
`site_settings`. A malformed or unreachable row falls back to the
defaults in `src/server/gallery/validation.ts` — the public gallery
keeps rendering its file-backed pieces even with the database down.

### Deleting

What delete means depends on where the thing came from:

| | Delete does |
| --- | --- |
| Console-authored piece (`origin = "console"`) | Removes the row. Gone. |
| File-backed piece | Writes a tombstone (`deleted_at`). The piece leaves the site and moves to **Removed**, where **Put back** clears it. |
| Console-created project | Deletes the row; milestones, work items, activity, snapshot, and the GitHub connection cascade. |
| Registry project (`src/config/registry.ts`) | Refused. `syncRegistryToDb` re-creates registry rows, so a delete would resurrect on the next page load. Archive it, or remove the registry entry. |

The asymmetry is the same in both halves: anything with a source in
the repo cannot be deleted by the running app, because the next build
puts it back. A tombstone is the honest version of "remove this now";
deleting the Markdown file or the registry entry is the permanent one.

Deleting a piece does not delete its uploaded R2 object. Keys are
immutable and may be referenced elsewhere, so reclaiming storage is a
bucket lifecycle concern rather than a delete-button one.

### Selling originals

Every piece is a one-off, so the model is simply *available or not*.
Set a price in **Console → Settings → Gallery → edit a piece →
Selling**; the public piece page then offers **Buy this original**.

Enabled only when both `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
are set. Without them no purchase is offered anywhere and the checkout
endpoint returns 503 — the same shape as the other optional
integrations.

**Currency.** Prices default to `SALES_CURRENCY` unless a piece names
its own. The default is **AUD** because that is the shop's chosen
selling currency — a deliberate product decision, not something derived
from where the database or the Worker happens to run. Infrastructure
geography has no bearing on what a buyer is charged; to price in
another currency, change `SALES_CURRENCY`. Both the environment
variable and the per-piece field are validated as three uppercase
letters (ISO 4217 alphabetic), and the lowercase form Stripe expects is
produced at call time rather than stored.

Two rules keep a unique object from being sold twice:

1. **A checkout only starts by winning an atomic conditional UPDATE.**
   The database decides who gets the piece — concurrent buyers cannot
   both see it as available. The loser gets a 409 explaining whether
   waiting would help.
2. **`sold_at` is written only by the Stripe webhook**, after Stripe
   confirms `payment_status: paid`. The browser returning to the
   success URL is never treated as proof of payment: that URL is
   attacker-controlled and can fire before the charge settles.

A reservation holds the piece for 30 minutes, matching the checkout
session's own expiry, and lapses on its own — an abandoned checkout
frees the piece with nobody intervening. `checkout.session.expired`
releases it sooner, and only if the hold still belongs to that session.

No card data touches this site; buyers go to Stripe's hosted checkout,
which also collects the shipping address. Buyer details are not copied
into this database — the order of record lives in Stripe, and only the
session and payment-intent ids are stored, for reconciliation.

**Stripe webhook**: point an endpoint at
`<SITE_URL>/api/stripe/webhook` with events `checkout.session.completed`,
`checkout.session.expired`, `checkout.session.async_payment_succeeded`,
and `checkout.session.async_payment_failed`. Its signing secret is
`STRIPE_WEBHOOK_SECRET`. Signatures are verified against the raw body
with a 5-minute replay window before anything is parsed; events for
objects without a `gallery_slug` are accepted and dropped, so an
account-wide endpoint is safe.

**Media uploads** need an R2 bucket bound as `MEDIA`. It is optional:
without it the upload endpoint returns 503 with an explanation, and
pieces can still point at any path in `public/`. R2 is a Workers
binding, so uploading never works under `next dev` — reference a file
in `public/` locally. To enable it:

```bash
npx wrangler r2 bucket create porscha-media
```

Then add to `wrangler.jsonc` and redeploy:

```jsonc
"r2_buckets": [
  { "binding": "MEDIA", "bucket_name": "porscha-media" }
]
```

Uploaded objects are served publicly from `/media/<key>`. Hiding a
piece hides its page, not the object — treat anything uploaded as
published.

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
