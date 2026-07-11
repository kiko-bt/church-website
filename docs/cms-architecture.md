# CMS Architecture — Production Content Pipeline

How a content change made by the preacher becomes a live page, end to end. This
is the permanent foundation of the project — extend it, never replace it.

> Companion docs: **[README](../README.md)** (developer tour) ·
> **[deployment.md](./deployment.md)** (how to stand this up in production).

> **The webhook is not optional — it is the mechanism.** The Next.js Data Cache
> (`unstable_cache`) is invalidated **only** by `revalidateTag()`, which is called
> **only** by the Sanity webhook hitting `/api/revalidate`. There is no
> time-based expiry. So if the webhook is missing or failing, **Publish changes
> nothing on the live site** until the next deploy. Configuring and verifying the
> webhook is therefore the difference between "content updates automatically" and
> "content is frozen." See deployment.md §5 and §9.

---

## The pipeline at a glance

```
Editor  (the preacher, in a browser)
   │  edits a document, clicks Publish
   ▼
Sanity Studio  (studio-church-ehb — a separate app)
   │  writes the published version to the Sanity Content Lake
   ▼
Sanity  →  fires the configured webhook (on create/update/delete of published docs)
   │
   ▼
HTTPS POST  https://www.hristovoevangelie.org/api/revalidate
   │  headers: x-sanity-revalidate-secret: <secret>
   │  body:    { "_type": "sermon", ... }
   ▼
/api/revalidate  (the only dynamic route in the app)
   │  1. isAuthorized() — constant compare against SANITY_REVALIDATE_SECRET
   │  2. Zod-parse the body → require a non-empty `_type`
   │  3. map `_type` → SANITY_TAGS tag  (sermon, book, gallery, churchSettings, homeContent)
   ▼
revalidateTag("<tag>")
   │  drops every unstable_cache entry tagged with that value
   ▼
Next.js Data Cache  (the tagged accessor reads are now stale)
   │
   ▼
Next request for an affected page  →  ISR regeneration
   │  accessor re-fetches from Sanity → mapper → Server Component → HTML
   ▼
Fresh static page served to every subsequent visitor  (no redeploy)
```

Nothing in this chain requires a developer or a deploy. The preacher publishes;
the next visitor sees the change.

---

## Stage by stage — what happens and why

### 1. Editor → Sanity Studio

The preacher works in the **standalone Studio** (`studio-church-ehb/`), a
separate application from the public site. It defines no schema of its own — it
imports the entire configuration from `church-website/sanity/defineStudioConfig.ts`,
which is the single source of truth. The editor sees a fixed desk structure
(Church Settings, Home Page, Sermons, Books, Gallery Albums); the two singletons
cannot be created, deleted, or duplicated (enforced by `defineStudioConfig`).

**Why a separate Studio:** the public site ships zero Studio code (smaller,
faster, isolated), and the CMS can be versioned/deployed independently. See the
README's _Sanity Studio (standalone)_ section.

### 2. Publish → Sanity Content Lake

Clicking **Publish** writes the *published* version of the document to Sanity's
Content Lake. The public site only ever reads the published perspective, so an
in-progress draft never affects the live site until Publish is clicked.

**Why:** `src/lib/sanity/client.ts` pins `perspective: "published"`. Drafts are
physically excluded from every read — safe by construction, not by convention.

### 3. Sanity → Webhook (HTTPS POST)

A **GROQ-powered webhook** (configured once — see deployment.md) fires whenever a
published document is created, updated, or deleted. It POSTs to
`/api/revalidate` over HTTPS with:

- a custom header `x-sanity-revalidate-secret: <SANITY_REVALIDATE_SECRET>`, and
- a JSON body that includes the document's `_type`.

**Why a header, not a query param:** headers are not recorded in proxy/access
logs, so the shared secret does not leak. In production the route **ignores** a
`?secret=` query param entirely.

**Why a shared secret:** `/api/revalidate` is a public URL. The secret is the
only thing that authorizes cache invalidation — without it, anyone could force
revalidations. It is a password *you generate*, stored identically in Vercel and
in the webhook config. It is not issued by Sanity.

### 4. `/api/revalidate` → Secret validation

The route is the project's **single approved infrastructure API route** and the
only non-static route in the app. On each POST it:

1. **Authorizes** — reads `SANITY_REVALIDATE_SECRET` from the server env and
   compares it to the header value. No secret configured, or a mismatch → `401`.
2. **Validates** — Zod-parses the body and requires a non-empty `_type`. Malformed
   body → `400`. Errors are generic (no internals leaked).
3. **Maps** — looks up `_type` in `TYPE_TO_TAG`. An unrecognized type is
   acknowledged (`200`, `revalidated: false`) without touching the cache — so
   adding a Studio-only document type never errors the webhook.

**Why validate the body:** the route trusts nothing from the network. The secret
proves *who*; Zod proves the *shape*.

### 5. `revalidateTag()` → Data Cache invalidation

For a recognized `_type`, the route calls `revalidateTag("<tag>")`. Every content
accessor wraps its Sanity read in `unstable_cache(..., { tags: [SANITY_TAGS.x] })`,
so this one call marks all matching cached reads stale in the Next.js Data Cache.

**Why tags, and why one shared constant:** `SANITY_TAGS` (`src/lib/sanity/tags.ts`)
is imported by **both** the accessors and the route. The thing that gets cached
and the thing that gets invalidated are literally the same symbol, so they can
never drift. Publishing a `sermon` invalidates exactly the sermon reads —
list and detail — and nothing else.

### 6. ISR regeneration → Fresh page

The invalidation is lazy. The **next** request for an affected page finds the
cache stale, re-runs the accessor (fetch → mapper → clean domain model), and the
Server Component re-renders fresh static HTML, which is then cached again for
subsequent visitors. This is Next.js **Incremental Static Regeneration** driven
by on-demand tag revalidation — not time-based polling.

**Why this is the right model for a church site:** pages are static and instant
for visitors (SSG), the CMS has zero involvement in the hot path, and content
still updates within one request of publishing — with no rebuild, no redeploy,
and no per-request CMS dependency. If Sanity is briefly unreachable, already-
rendered pages keep serving, and every accessor has a fallback for the cold path.

---

## Invariants this pipeline depends on

These are load-bearing. Breaking any one silently degrades correctness or
performance:

| Invariant | Enforced by | If violated |
|---|---|---|
| Only `/api/revalidate` is dynamic | `generateStaticParams` on every content route; middleware excludes `/api` | A content page turning dynamic (`ƒ`) means an uncached read/ request-time API crept in |
| Every accessor is tagged | `unstable_cache(..., { tags: [...] })` in each `*.data.ts` | An untagged read can never be revalidated → stale forever |
| Tags are one shared constant | `SANITY_TAGS` imported by accessors **and** the route | Drift → publishing invalidates the wrong (or no) cache |
| Published perspective only | `perspective: "published"` in `client.ts` | Drafts could leak to the public site |
| Secret in the header, not the URL | `route.ts` ignores `?secret=` in production | Secret leaks into access logs |
| Dataset is public | Sanity project settings | CDN reads fail without a token → empty site |

## Adding a new content type to the pipeline

The webhook needs no change per type — it already forwards `_type`. To wire a new
type end to end: add its tag to `SANITY_TAGS`, map its `_type` in
`TYPE_TO_TAG` (`route.ts`), and tag its accessor. Full checklist:
README → _Adding a New CMS Feature_.
