# Црква Евангелие Христово — Битола

Official website of the Church of the Gospel of Christ, Bitola, North Macedonia.

**Live:** https://www.hristovoevangelie.org

A content-driven, bilingual (Macedonian / English) church website. A non-technical
administrator (the preacher) manages all content — sermons, books & PDFs, photo
albums, homepage copy, and church settings — in **Sanity Studio**, without touching
code. Pages are statically generated (SSG) and update on publish via on-demand
revalidation (ISR).

---

## Documentation

Start here — the deep guides live in `docs/`:

| Document | What it covers |
|---|---|
| **[docs/cms-architecture.md](docs/cms-architecture.md)** | The publish → live content pipeline, stage by stage, plus the Studio setup and the invariants it depends on |
| **[docs/bible-module.md](docs/bible-module.md)** | The Bible module — design, data structure, flow, validation, search, and how to swap the placeholder text for the real Bible with no code changes |
| **[docs/bible-dataset-guide.md](docs/bible-dataset-guide.md)** | Plain-language instructions for the content owner on how to structure the Bible text files (hand this to the preacher) |
| **[docs/deployment.md](docs/deployment.md)** | Production runbook: Vercel, Porkbun DNS, HTTPS, environment variables, the Sanity webhook, smoke tests, rollback, troubleshooting, routine operations |
| **[.env.example](.env.example)** | Every environment variable, annotated (local vs Vercel, public vs secret) |
| `CLAUDE.md`, `.claude/*.md` | Engineering rules and non-negotiable architectural constraints (`.claude/bible-module.md` is the binding spec for the Bible) |

---

## Tech stack

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

| Module | Data source | Rendering |
|---|---|---|
| Homepage copy | Sanity (`homeContent` singleton) | SSG |
| Church settings | Sanity (`churchSettings` singleton) | SSG |
| Sermons | Sanity (`sermon`) | SSG + ISR |
| Books / PDFs | Sanity (`book`) | SSG + ISR |
| Gallery albums | Sanity (`galleryAlbum`) | SSG + ISR |
| Bible (text + PDFs) | Local JSON (never Sanity) | SSG |
| Contact form | _Planned_ (React Hook Form + Zod + Resend) | — |

The Bible module deliberately keeps all verse data and PDFs local to the codebase
(see `CLAUDE.md`). The contact form is scaffolded (`features/contact` Zod schema)
but not yet built — the contact page currently directs visitors to email.

---

## Project layout

Two sibling applications, developed independently, that must sit side by side under
a common parent folder:

```
Church Project/
├── church-website/      ← this repo — the public Next.js site AND the CMS source of truth
└── studio-church-ehb/   ← the standalone Sanity Studio (the editing UI only)
```

| Concern | Owner |
|---|---|
| Content model — schemas, desk structure, singleton rules, Studio config | **`church-website/sanity/`** (this repo) |
| Reading & rendering content — queries, mappers, caching, pages | **`church-website/src/`** (this repo) |
| The editing UI authors use | **`studio-church-ehb/`** — imports its config from this repo |

`church-website` is the **single source of truth** for the CMS: the Studio owns no
schema of its own and imports everything from
`church-website/sanity/defineStudioConfig.ts`. Because the Studio imports it via a
relative path, the two repos must share a parent folder — details and the reasoning
in **[docs/cms-architecture.md → Studio configuration](docs/cms-architecture.md#studio-configuration--the-two-repo-layout)**.

---

## Quick start

**Prerequisites:** Node.js 22 LTS · npm 10.9.2

```bash
git clone <repo-url>
cd church-website
npm install
cp .env.example .env.local   # all values optional for a first run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you are redirected to `/mk`
(the default locale).

**Sanity is optional locally.** When `NEXT_PUBLIC_SANITY_PROJECT_ID` is unset, every
content accessor returns empty/null and pages render their built-in fallbacks
(translated placeholder copy, empty states). The build stays green without any CMS
credentials.

### Running the Studio

The Studio is a separate app — run it in its own terminal:

```bash
cd studio-church-ehb
npm install
npm run dev        # → http://localhost:3333
```

It needs no `.env` file (its `projectId`/`dataset` are set in its config) and reads
the schema from `../church-website/sanity/`, so both repos must be checked out side
by side. On first visit it shows the desk structure — **Church Settings, Home Page,
Sermons, Books, Gallery Albums**.

### Environment variables

See **[.env.example](.env.example)** for the annotated, authoritative list. Summary:

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | for live content | Enables the Sanity read client |
| `NEXT_PUBLIC_SANITY_DATASET` | defaults to `production` | Sanity dataset name |
| `NEXT_PUBLIC_SITE_URL` | for correct SEO | Base URL for canonical / hreflang / OG / sitemap (the `www` host in production) |
| `SANITY_REVALIDATE_SECRET` | for the webhook | Shared secret guarding `/api/revalidate` |
| `RESEND_TO_EMAIL` | public contact address | Shown on the site unless `churchSettings.email` is set in the CMS |
| `SANITY_API_TOKEN` | no (reserved) | Unused by the read client (public CDN reads); only for future drafts / a private dataset |

The read client reads the **published** dataset over the public CDN, so the dataset
must be public and no token is required. `NEXT_PUBLIC_*` variables are inlined at
build time — changing one in Vercel requires a **redeploy**.

---

## Project structure

```
src/
├── app/[locale]/         # Localized routes (mk / en). Server Components, SSG.
├── components/           # Presentational + section components (feature-grouped)
├── features/             # One self-contained folder per content type (the CMS core)
├── lib/
│   ├── sanity/           # Read client + cache-tag constants
│   ├── i18n/             # next-intl request config + localized() helper
│   └── seo/              # generateBaseMetadata / toMetaDescription
├── constants/            # locales, site config (fallback identity)
├── types/                # Shared Sanity primitives
└── data/bible/           # Local Bible JSON (out of CMS scope)

sanity/                   # CMS source of truth (schemas, structure, defineStudioConfig)
src/app/api/revalidate/   # The ONLY infrastructure API route (the publish webhook)
```

Each `src/features/<feature>/` folder owns exactly five files — the same shape every
time (singletons skip the by-slug variant):

| File | Responsibility |
|---|---|
| `<feature>.types.ts` | Raw `<Entity>Document` **and** clean `<Entity>` domain model |
| `<feature>.queries.ts` | GROQ queries (list + by-slug), assets dereferenced to URLs |
| `<feature>.mappers.ts` | `map<Entity>()` raw → domain |
| `<feature>.data.ts` | Cached accessors (`unstable_cache` + `SANITY_TAGS` tag) |
| `index.ts` | Barrel — the feature's public API |

---

## Architecture principles

Non-negotiable invariants — all new work must uphold every one (the *why* behind each
is in [docs/cms-architecture.md](docs/cms-architecture.md)):

- **Server Components by default.** Client components only where interactivity requires
  it (theme toggle, mobile nav). Data is fetched on the server.
- **SSG is the default.** Every content route is prerendered (`generateStaticParams`)
  and revalidated on demand. Only `/api/revalidate` is dynamic.
- **Raw Sanity documents never reach the UI.** A mapper converts every
  `<Entity>Document` into a clean `<Entity>` domain model — mappers are mandatory.
- **`unstable_cache` on every accessor**, tagged with a `SANITY_TAGS` value. Uncached
  Sanity reads are not allowed in the render path.
- **`SANITY_TAGS` is the single source of cache invalidation** — shared by the
  accessors and `/api/revalidate`, so what is cached and what is invalidated cannot drift.
- **Published perspective only.** The read client is pinned to `perspective: "published"`;
  drafts never reach the site.
- **Localization via `_en` fields.** Bilingual editorial fields use the base (Macedonian)
  + `_en` suffix, resolved in the mapper by `localized()`. Preacher content is Macedonian only.
- **Fallbacks everywhere.** Any CMS read can return null; the UI always has a translated
  fallback so the site never depends on a live CMS to render.

---

## Adding a content type

Follow the established pattern (the **Books** feature — `src/features/books/` +
`src/app/[locale]/books/` — is the reference implementation to copy):

1. **Schema** — add `sanity/schemas/documents/<name>.ts`, register it in
   `sanity/schemas/index.ts`, and add it to `sanity/structure.ts`. The Studio picks
   this up automatically; never add schema inside `studio-church-ehb/`.
2. **Feature folder** — create the five files above (`types`, `queries`, `mappers`,
   `data`, `index`) under `src/features/<name>/`.
3. **Cache tag** — add the tag to `SANITY_TAGS` and map its `_type` in
   `src/app/api/revalidate/route.ts`.
4. **UI** — Server Components under `src/components/<name>/` and a route under
   `src/app/[locale]/<name>/`; use `generateStaticParams` for detail pages.
5. **Metadata** — route `generateMetadata` through `generateBaseMetadata(locale, path,
   overrides)` so canonical / hreflang / OG stay consistent.

---

## Bible module

The Bible module is intentionally designed as a fully **static, translation-agnostic**
subsystem — it is the one module that does not use Sanity. It exists to make Bible
reading fast, reliable, and safe to maintain for years.

### Goals

- Static generation for every chapter
- Zero client JavaScript while reading
- Safe, no-code replacement of Bible translations
- Automatic validation before every deployment
- No runtime database
- Canonical routing independent of language

### Architecture

```
manifest.json
      │
      ▼
generateStaticParams()
      │
      ▼
per-book JSON
      │
      ▼
Zod validation
      │
      ▼
Static HTML
```

The book files (`src/data/bible/{mk,en}/*.json`) are the **source of truth**;
`manifest.json` and `search/*.json` are **derived** from them (`npm run bible:build`)
and never hand-edited. All JSON access goes through `src/features/bible/bible.data.ts`.
Full design, data model, validation, and rationale live in
**[docs/bible-module.md](docs/bible-module.md)** (binding rules: `.claude/bible-module.md`).

### Replacing the Bible translation — no code changes

1. Replace the files in `src/data/bible/mk/` and `src/data/bible/en/`.
2. Run `npm run bible:build` — re-derives the manifest + search indexes and validates.
3. If validation passes, commit and deploy. Nothing else changes.

Hand the content owner **[docs/bible-dataset-guide.md](docs/bible-dataset-guide.md)** —
plain-language instructions for structuring the files.

---

## Scripts & verification

```bash
npm run dev              # Development server (http://localhost:3000)
npm run build            # Production build (runs bible:validate first via prebuild)
npm run start            # Serve the production build
npm run lint             # ESLint
npm test                 # Unit tests (Bible reference/value objects, schema/validation, search)
npm run bible:build      # Re-derive manifest + search indexes from the book files, then validate
npm run bible:generate   # Regenerate the placeholder book files, then bible:build
npm run bible:validate   # Validate the Bible dataset (also runs automatically before every build)
```

Before committing anything non-trivial:

```bash
npx tsc --noEmit  # strict type check — must be 0 errors
npm run lint      # must be clean
npm test          # unit tests — must pass
npm run build     # must succeed; content routes are ○/● (static), not ƒ
```

Only `/api/revalidate` should be a dynamic (`ƒ`) route. If a content page turns
dynamic, a request-time API (headers/cookies) or an uncached fetch has crept in.

---

## Roadmap

Realistic, deferred enhancements (not blockers):

- **Contact form** — wire the existing `features/contact` Zod schema to a Resend server action.
- **`churchSettings.logo`** — project the modeled field and wire it into `Logo`.
- **`featured` highlights** — the flag is mapped end-to-end on book/sermon/album, ready
  to surface featured items on the homepage.
