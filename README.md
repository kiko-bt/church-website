# Црква Евангелие Христово - Битола

Official website for the Church of the Gospel of Christ, Bitola, North Macedonia.

A content-driven, bilingual (Macedonian / English) church website. A non-technical
administrator (the preacher) manages all content — sermons, books & PDFs, photo
albums, homepage copy, and church settings — through **Sanity Studio**, without
touching code. The site is statically generated and updates on publish via
on-demand revalidation.

> New here? Read **[Architecture](#architecture)** → **[CMS Architecture](#cms-architecture)**
> → **[Adding a New CMS Feature](#adding-a-new-cms-feature)**. That's the 15-minute tour.

---

## Tech Stack

| Area | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Server Components) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| CMS | Sanity |
| Rich text | Portable Text (`@portabletext/react`) |
| i18n | next-intl (`mk` default / `en`) |
| Theme | next-themes |
| Rendering | SSG + ISR (on-demand revalidation) |
| Hosting | Vercel |

Content modules and their data sources:

| Module | Data Source | Rendering |
|---|---|---|
| Homepage copy | Sanity (`homeContent` singleton) | SSG |
| Church settings | Sanity (`churchSettings` singleton) | SSG |
| Sermons | Sanity (`sermon`) | SSG + ISR |
| Books / PDFs | Sanity (`book`) | SSG + ISR |
| Gallery albums | Sanity (`galleryAlbum`) | SSG + ISR |
| Bible (text + PDFs) | Local JSON (never Sanity) | SSG |
| Contact form | _Planned_ (React Hook Form + Zod + Resend) | — |

The Bible module deliberately keeps all verse data and PDFs local to the
codebase — see `CLAUDE.md`. The contact form is scaffolded (`features/contact`
Zod schema) but not yet built; the contact page currently directs visitors to
email.

---

## Prerequisites

- **Node.js** 22 LTS
- **npm** 10.9.2

---

## Getting Started

```bash
git clone <repo-url>
cd church-website
npm install

cp .env.example .env.local   # fill in values (all optional for a first run)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you are redirected to `/mk`
(the default locale).

**Sanity is optional for local development.** When `NEXT_PUBLIC_SANITY_PROJECT_ID`
is unset, every content accessor returns empty/null and the pages render their
built-in fallbacks (translated placeholder copy, empty states). The build stays
green without any CMS credentials.

### Environment variables

See `.env.example` for the annotated list. Summary:

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | for live content | Enables the Sanity read client |
| `NEXT_PUBLIC_SANITY_DATASET` | defaults to `production` | Sanity dataset name |
| `NEXT_PUBLIC_SITE_URL` | for correct SEO | Base URL for canonical / hreflang / OG (no trailing slash) |
| `SANITY_REVALIDATE_SECRET` | for the webhook | Shared secret guarding `/api/revalidate` |
| `SANITY_API_TOKEN` | no (reserved) | Unused by the read client (public CDN reads); only needed if drafts / a private dataset are added later |

The read client reads the **published** dataset over the public CDN, so the
dataset must be public and no token is required.

---

## Architecture

```
src/
├── app/[locale]/         # Localized routes (mk / en). Server Components, SSG.
├── components/           # Presentational + section components (feature-grouped)
├── features/             # One self-contained folder per content type (the CMS core)
├── lib/
│   ├── sanity/           # Read client + cache-tag constants
│   ├── i18n/             # next-intl request config + `localized()` helper
│   └── seo/              # generateBaseMetadata / toMetaDescription
├── constants/            # locales, site config (fallback identity)
├── types/                # Shared Sanity primitives (SanitySlug, RichTextContent)
└── data/bible/           # Local Bible JSON (out of CMS scope)

sanity/                   # Sanity Studio: schemas, desk structure, config
src/app/api/revalidate/   # The ONLY infrastructure API route (publish webhook)
```

Principles the whole codebase holds to:

- **Server Components by default.** No client component unless it needs
  interactivity (theme toggle, mobile nav). Data is fetched on the server.
- **Static first.** Every content route is prerendered (`generateStaticParams`)
  and revalidated on demand — no per-request Sanity calls in the hot path.
- **One source of truth per fact.** Church identity lives on `churchSettings`;
  homepage copy on `homeContent`; nothing is restated across schemas.
- **Fallbacks everywhere.** Any CMS read can return null; the UI always has a
  translated/message-based fallback so the site never depends on a live CMS to render.

---

## CMS Architecture

Every content type follows the **same** one-directional pipeline. This is the
project's permanent foundation — extend it, don't replace it.

```
Sanity Document        (raw, in the Studio)
      │  GROQ query — dereferences assets to URLs
      ▼
<Entity>Document       (raw shape, typed;  *.types.ts)
      │  Mapper        (raw → clean;  *.mappers.ts)
      ▼
<Entity>  (domain)     (clean model the UI consumes;  *.types.ts)
      │  Accessor      (unstable_cache + tag;  *.data.ts)
      ▼
Server Component  →  UI  →  SSG / ISR
```

**Why the mapper boundary exists:** raw Sanity documents carry `_id`,
`slug.current`, asset references, bilingual `_en` field pairs, and optional
fields. The mapper resolves all of that once — flattening `slug` to a string,
projecting `asset->url` in GROQ, picking the active locale via `localized()`,
and defaulting optionals (`featured ?? false`, rich text `?? []`). Components
therefore only ever see clean, non-surprising domain models. **Raw Sanity
documents never reach a component.**

Each feature folder (`src/features/<feature>/`) owns exactly five files:

| File | Responsibility |
|---|---|
| `<feature>.types.ts` | Raw `<Entity>Document` **and** clean `<Entity>` domain model |
| `<feature>.queries.ts` | GROQ queries (list + by-slug), assets dereferenced to URLs |
| `<feature>.mappers.ts` | `map<Entity>()` raw → domain (+ a list variant) |
| `<feature>.data.ts` | Cached accessors (`get<Entity>s` / `get<Entity>BySlug`) |
| `index.ts` | Barrel — the feature's public API |

Singletons (`churchSettings`, `homeContent`) skip the by-slug variant and are
queried by fixed `_id` (see below); they also carry no separate `.queries.ts`
sometimes — they follow the same shape otherwise.

---

## Caching & Revalidation

Content flows from an editor's **Publish** to the live site without a redeploy:

```
Editor clicks Publish in Sanity Studio
        │
        ▼
Sanity webhook  POST /api/revalidate   (x-sanity-revalidate-secret header)
        │  validates secret + Zod-parses the body's `_type`
        ▼
revalidateTag("<tag>")     e.g. book, sermon, gallery, churchSettings, homeContent
        │
        ▼
Next.js drops the matching cached reads → next request re-fetches & re-renders
```

Key mechanics:

- **`unstable_cache`** wraps every accessor. The cache key includes the
  accessor's arguments, so `getChurchSettings("mk")` and `("en")` cache
  independently, and repeated calls within one render (metadata + page) are
  deduplicated into a single fetch.
- **Cache tags** live in `src/lib/sanity/tags.ts` (`SANITY_TAGS`) — the single
  source shared by both the accessors and the `/api/revalidate` route, so the
  thing that gets cached and the thing that gets invalidated can never drift.
- **`/api/revalidate`** is the only non-static route and the only infrastructure
  API route. Secret transport: the `x-sanity-revalidate-secret` header
  (production) or a `?secret=` query param (local testing only; the header wins).
- **Published perspective.** The client sets `perspective: "published"`
  explicitly, so drafts never leak — and published docs keep a bare `_id`, which
  the fixed-id singleton queries (`*[_id == "churchSettings"][0]`) rely on.
- **Singletons are locked.** `sanity/structure.ts` pins the two singletons to
  fixed document ids and `sanity.config.ts` strips create/delete/duplicate
  actions, so an editor cannot create a second `churchSettings`/`homeContent`.

---

## Localization

- Routes: `/mk` (default) and `/en`, handled by `middleware.ts` (next-intl).
- **UI chrome** (labels, nav, buttons) is translated via `messages/{mk,en}.json`.
- **Editorial chrome** (homepage copy, service schedule, SEO defaults) is
  bilingual in the CMS via the **`_en` field-suffix** convention; the mapper
  resolves it with `localized(mk, en, locale)`.
- **Preacher content** (sermon/book/gallery titles, descriptions, captions) is
  **single-language Macedonian** — no `_en` fields, per project policy.
- Time zone is pinned to `Europe/Skopje` (`constants/locales.ts`) so date
  formatting is identical on server and client (no hydration mismatch).

---

## Portable Text

Long-form homepage copy (`welcomeBody`, `shortMessage`) is Portable Text
(the `richText` schema — a deliberately small set: normal / h2 / h3 / quote,
bullet & numbered lists, bold / italic, and https|mailto links).

It is rendered by the shared, server-safe
`src/components/portable-text/PortableTextRenderer.tsx`. The renderer is
colour-neutral: block elements inherit `color`/`font-size` from the caller's
`className`, so the same component reads correctly on light and dark sections.
An empty array renders nothing. Book/sermon/album descriptions are plain `text`
(not Portable Text) and render with `whitespace-pre-line`.

---

## Sanity Studio

Studio schemas, desk structure, and config live in `sanity/`:

```
sanity/
├── schemas/
│   ├── objects/      # imageWithAlt, socialLinks, seo, richText
│   ├── singletons/   # churchSettings, homeContent
│   ├── documents/    # sermon, book, galleryAlbum
│   └── index.ts      # schemaTypes + SINGLETON_TYPES
├── structure.ts      # Desk structure (pins singletons)
└── sanity.config.ts  # Studio config (singleton action filtering)
```

The Studio is **not yet mounted** as a `/studio` route or wired to an npm
script — running it locally requires the Sanity CLI pointed at this config (a
small future setup task; see the roadmap). Content authoring conventions:
image `alt` text is required; singletons cannot be duplicated or deleted.

---

## Adding a New CMS Feature

Follow the established pattern end-to-end — this keeps every feature identical:

1. **Schema** — add a document in `sanity/schemas/documents/<name>.ts`, register
   it in `sanity/schemas/index.ts`, and add it to `sanity/structure.ts`.
2. **Types** — in `src/features/<name>/<name>.types.ts`, define the raw
   `<Name>Document` and the clean `<Name>` domain model.
3. **Query** — `<name>.queries.ts`: GROQ list + by-slug, dereferencing every
   asset to a URL (`"url": asset->url`).
4. **Mapper** — `<name>.mappers.ts`: `map<Name>()` raw → domain (flatten slug,
   default optionals, resolve locale for any `_en` pairs).
5. **Accessor** — `<name>.data.ts`: wrap fetch + map in `unstable_cache(...,
   { tags: [SANITY_TAGS.<name>] })`; guard `if (!sanityClient) return []/null`.
6. **Tag** — add the tag to `SANITY_TAGS` and map its document `_type` in
   `src/app/api/revalidate/route.ts`.
7. **UI** — Server Components under `src/components/<name>/` and a route under
   `src/app/[locale]/<name>/`; use `generateStaticParams` for detail pages.
8. **Metadata** — route `generateMetadata` through `generateBaseMetadata(locale,
   path, overrides)` so canonical / hreflang / OG stay consistent.
9. **Barrel + docs** — export from `index.ts`; note anything non-obvious.

The Books feature (`src/features/books/` + `src/app/[locale]/books/`) is the
reference implementation — copy its shape.

---

## SEO

All metadata flows through `src/lib/seo/metadata.ts`:

- `generateBaseMetadata(locale, path?, overrides?)` produces a self-referential
  canonical URL, `mk`/`en` hreflang alternates, Open Graph, and robots for every
  page. The locale layout sets the `%s | <brand>` title template; leaf pages pass
  a bare title override and inherit the rest.
- Brand name / description / OG image come from `churchSettings` when configured,
  falling back to `siteConfig`. Detail pages override title/description and (for
  books/albums) the OG image with the cover.
- `toMetaDescription()` collapses and length-caps plain-text descriptions.

---

## Development & Production Workflow

```bash
npm run dev       # Development server (http://localhost:3000)
npm run build     # Production build
npm run start     # Serve the production build
npm run lint      # ESLint
```

**Build verification** (run before committing anything non-trivial):

```bash
npx tsc --noEmit  # strict type check — must be 0 errors
npm run lint      # must be clean
npm run build     # must succeed; confirm content routes are ○/● (static), not ƒ
```

Only `/api/revalidate` should appear as a dynamic (`ƒ`) route. If a content page
turns dynamic, a request-time API (headers/cookies) or an uncached fetch has
crept in.

**Common maintenance tasks:**

- _Content typo / new sermon / new album_ → the preacher edits in Sanity Studio
  and clicks Publish. The webhook revalidates automatically; no deploy.
- _New church name / address / social link_ → edit the `churchSettings` singleton.
- _Add a translated UI label_ → add the key to **both** `messages/mk.json` and
  `messages/en.json`.
- _Add a content type_ → follow [Adding a New CMS Feature](#adding-a-new-cms-feature).

---

## Deployment

Deployed on **Vercel**. Before the first deploy:

1. Set all environment variables from `.env.example` in the Vercel dashboard —
   in particular `NEXT_PUBLIC_SITE_URL` (canonical/OG/hreflang derive from it)
   and `SANITY_REVALIDATE_SECRET`.
2. Create a Sanity webhook (on publish) pointing at
   `https://<domain>/api/revalidate` with the `x-sanity-revalidate-secret`
   header set to the same secret. Ensure the webhook body includes `_type`.
3. Ensure the Sanity dataset is public (the read client uses public CDN reads).

---

## Future Roadmap

Realistic, deferred enhancements (not blockers):

- **`sitemap.ts` / `robots.ts`** — enumerate locales + CMS slugs via the existing
  accessors (natural next SEO step).
- **Contact form** — wire the existing `features/contact` Zod schema to a Resend
  server action.
- **Mount Sanity Studio** — add `sanity.cli.ts` + an npm script (or a `/studio`
  route via `next-sanity`) so the Studio runs without the standalone CLI.
- **`churchSettings.logo`** — project the modeled field and wire it into `Logo`
  (needs no new dependency: `asset->metadata.dimensions` gives CLS-safe sizing).
- **`featured` highlights** — the flag is mapped end-to-end on book/sermon/album,
  ready to surface featured items on the homepage.
```