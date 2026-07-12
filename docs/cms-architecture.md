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
faster, isolated), and the CMS can be versioned/deployed independently. The exact
config-sharing mechanism is described in
[Studio configuration](#studio-configuration--the-two-repo-layout) below.

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
README → _Adding a content type_.

---

## Studio configuration — the two-repo layout

The Studio (`studio-church-ehb/`) is a **separate application** — the editing UI
only. It defines **no** content model of its own; it imports the entire
configuration from this repo, which stays the single source of truth.

### The source of truth (`church-website/sanity/`)

```
sanity/
├── schemas/
│   ├── objects/            # imageWithAlt, socialLinks, seo, richText
│   ├── singletons/         # churchSettings, homeContent
│   ├── documents/          # sermon, book, galleryAlbum
│   └── index.ts            # schemaTypes + SINGLETON_TYPES
├── structure.ts            # Desk structure (pins the singletons)
├── defineStudioConfig.ts   # Shared config factory: schema + structure +
│                           #   singleton templates filter + document actions
└── sanity.config.ts        # Website-side config — a thin call to the factory
```

### `defineStudioConfig()` — one config, consumed by both apps

`sanity/defineStudioConfig.ts` is the **single place** that assembles the Studio
configuration: the schema types, the custom desk structure, the rule that hides
singletons from the global "create" menu, and the document-action filter that
strips create/delete/duplicate from singletons. The exact same configuration is
used by:

- **this repo** — `sanity/sanity.config.ts` calls `defineStudioConfig({ … })`
  with the project id from the environment; and
- **the standalone Studio** — `studio-church-ehb/sanity.config.ts` imports the
  same factory via the sibling path and only adds the Vision query tool:

  ```ts
  // studio-church-ehb/sanity.config.ts
  import { visionTool } from "@sanity/vision";
  import { defineStudioConfig } from "../church-website/sanity/defineStudioConfig";

  export default defineStudioConfig({
    name: "default",
    title: "Црква Евангелие Христово - Битола",
    projectId: "9nwz9xmi",
    dataset: "production",
    plugins: [visionTool()],
  });
  ```

**Rule:** any new CMS capability (a schema, a structure change, a new singleton
rule) is added to `church-website/sanity/` and flows to the Studio automatically.
**Never** add schema or duplicate this config inside `studio-church-ehb/`.

### Why the sibling-folder layout is required

The Studio imports the config with a **relative path** (`../church-website/…`), so
the two repos must sit side by side under the same parent folder. Because the two
repos have separate `node_modules`, `studio-church-ehb/sanity.cli.ts` also
configures Vite to `dedupe` React/Sanity/styled-components and to `allow` reading
files from the sibling repo — this prevents duplicate-instance ("invalid hook
call") errors when one repo's config pulls modules across the boundary.

> If the repos are ever separated (e.g. deploying the Studio from its own
> checkout), promote `sanity/` into a small shared package the Studio depends on —
> the relative import is the only thing tying them to a shared parent folder.

> **The Studio is not part of the content-update pipeline's runtime.** It writes to
> Sanity's hosted Content Lake; the website reads from there. The Studio does not
> need to be deployed or committed to GitHub for publishing to reach the live site
> (see deployment.md §5). Committing it is optional — for backup and versioning.
