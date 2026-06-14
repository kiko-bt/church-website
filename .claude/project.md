# Bible Local Data Rules

Location:

```txt
src/data/bible/
```

Required files:

```txt
src/data/bible/
├── bible-hierarchical.json
├── bible-search-index.json
```

Purpose:

- bible-hierarchical.json
  → used for rendering books, chapters, and verses

- bible-search-index.json
  → optimized Fuse.js search index for client-side searching

These files are:

- generated offline via parsing scripts
- committed into the repository
- statically imported by the application
- NOT fetched from Sanity
- NOT fetched from APIs at runtime

This guarantees:

- deterministic rendering
- predictable search behavior
- zero runtime CMS dependency
- stable SSG generation
- lower architectural complexity

---

# Official App Routes

ALL routes use locale prefixes:

```txt
/mk
/en
```

Examples:

```txt
/mk/bible
/en/bible
```

---

## Route Structure

| Route | Description |
|---|---|
| /[locale] | Homepage |
| /[locale]/about | About page |
| /[locale]/bible | Bible landing page |
| /[locale]/bible/[bookSlug] | Bible book page |
| /[locale]/bible/[bookSlug]/[chapter] | Bible chapter page |
| /[locale]/books | Downloadable PDF books |
| /[locale]/books/[slug] | Single book page |
| /[locale]/sermons | Sermons page |
| /[locale]/sermons/[slug] | Single sermon page |
| /[locale]/gallery | Gallery page |
| /[locale]/contact | Contact page |
| /[locale]/privacy | Privacy page |

---

# Official Folder Structure

```txt
.
├── .claude/
│
├── public/
│
├── messages/
│   ├── en.json
│   └── mk.json
│
├── sanity/
│   ├── schemas/
│   ├── sanity.config.ts
│   └── sanity.client.ts
│
├── src/
│   ├── app/
│   │   └── [locale]/
│   │       ├── page.tsx
│   │       ├── about/
│   │       ├── bible/
│   │       ├── books/
│   │       ├── sermons/
│   │       ├── gallery/
│   │       ├── contact/
│   │       └── privacy/
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── bible/
│   │   ├── books/
│   │   ├── sermons/
│   │   ├── gallery/
│   │   └── contact/
│   │
│   ├── features/
│   │   ├── bible/
│   │   │   ├── bible.types.ts
│   │   │   ├── bible.constants.ts
│   │   │   ├── bible.data.ts
│   │   │   ├── bible-search.ts        # client-only; NOT re-exported by index.ts
│   │   │   └── index.ts
│   │   ├── sermons/
│   │   │   ├── sermons.types.ts
│   │   │   ├── sermons.queries.ts
│   │   │   └── index.ts
│   │   ├── books/
│   │   │   ├── books.types.ts
│   │   │   ├── books.queries.ts
│   │   │   └── index.ts
│   │   ├── gallery/
│   │   │   ├── gallery.types.ts
│   │   │   ├── gallery.queries.ts
│   │   │   └── index.ts
│   │   ├── church-settings/
│   │   │   ├── church-settings.types.ts
│   │   │   ├── church-settings.queries.ts
│   │   │   └── index.ts
│   │   ├── home-content/
│   │   │   ├── home-content.types.ts
│   │   │   ├── home-content.queries.ts
│   │   │   └── index.ts
│   │   └── contact/
│   │       ├── contact.schema.ts
│   │       └── index.ts
│   │
│   ├── data/
│   │   └── bible/
│   │       ├── bible-hierarchical.json
│   │       └── bible-search-index.json
│   │
│   ├── lib/                            # cross-cutting infrastructure ONLY
│   │   ├── sanity/                     # read client only (queries live in features)
│   │   ├── resend/
│   │   ├── i18n/
│   │   ├── seo/
│   │   └── utils/
│   │
│   ├── types/                          # cross-cutting types only (e.g. sanity.ts, navigation.ts)
│   ├── constants/                      # cross-cutting constants only (locales, routes, site, navigation)
│   └── styles/
│
├── package.json
├── tsconfig.json
├── next.config.ts
├── middleware.ts
└── eslint.config.mjs
```

---

# Folder Structure Rules

ALWAYS:

- maintain deterministic folder structure
- colocate related logic
- keep Bible logic isolated
- keep CMS logic isolated
- keep translation files isolated
- separate UI from features
- separate data from rendering

NEVER:

- place Bible verse JSON inside Sanity
- duplicate feature logic
- place business logic inside UI components
- create random utility folders
- introduce architecture drift

---

# Feature Architecture

The project uses a **Hybrid Feature-Based Architecture**: feature-sliced
domain modules under `src/features/<feature>/` layered over a shared,
layer-based core (`app/` routing, `components/` UI, `lib/` infrastructure,
shared `types/` and `constants/`).

## Features

```txt
bible · sermons · books · gallery · church-settings · contact · home-content
```

## Feature folder responsibilities

A feature folder OWNS everything specific to its domain:

| File | Responsibility |
|---|---|
| `<feature>.types.ts` | Domain TypeScript types for the feature |
| `<feature>.queries.ts` | GROQ queries for the feature (CMS-backed features only) |
| `<feature>.data.ts` | Data access / accessors (e.g. local-JSON readers, CMS fetchers) |
| `<feature>.constants.ts` | Constants specific to the feature |
| `<feature>.schema.ts` | Zod schemas specific to the feature (e.g. contact) |
| `<feature>/components/` | Presentational components used only by the feature |
| `index.ts` | The feature's public API (server-safe barrel) |

Pages in `app/` import a feature through its barrel, e.g. `@/features/bible`.

## What stays shared (NOT in a feature)

| Location | Holds |
|---|---|
| `src/components/ui` · `layout` · `home` · `providers` | Shared/presentational UI |
| `src/lib/sanity` (client), `resend`, `i18n`, `seo`, `utils` | Cross-cutting infrastructure |
| `src/types` (`sanity.ts`, `navigation.ts`) | Cross-cutting types (e.g. Sanity primitives, `RichTextContent` Portable Text placeholder) |
| `src/constants` (`locales`, `routes`, `site`, `navigation`) | Cross-cutting constants |

## Rules

- GROQ queries live in `features/<feature>/<feature>.queries.ts` — NEVER in `lib/`.
- `lib/` contains infrastructure clients only — NEVER domain queries or feature logic.
- Bible JSON is read ONLY through `features/bible/bible.data.ts` accessors — never imported directly in pages.
- A feature `index.ts` MUST stay server-safe: do not re-export Client Component
  modules (e.g. `bible-search.ts`); import those directly where needed.
- A new content type = a new self-contained `features/<feature>/` folder; no
  cross-cutting edits required.