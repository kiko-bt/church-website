# Bible Module — Design & Operations

The Bible is the most important feature of the site: the church's primary purpose
is ministry and Bible reading. This document explains what the module does, how it
is built, and — most importantly — how to swap the placeholder text for the real,
licensed Bible with **no code changes**.

> Companion docs: **[README](../README.md)** (developer tour) ·
> **[bible-dataset-guide.md](./bible-dataset-guide.md)** (plain-language instructions
> for the content owner supplying the real Bible) ·
> **[.claude/bible-module.md](../.claude/bible-module.md)** (the binding engineering
> rules this document implements).

---

## 1. Purpose & business need

- A visitor can **read the whole Bible** — Old and New Testament, every book, every
  chapter, every verse — in **Macedonian or English**.
- Reading must be **fast on mobile**, work offline of any CMS, and be **shareable**
  (each verse has a stable link).
- The site owner will provide the **final, licensed Bible text later**. Until then
  the module runs on realistic **placeholder** text so everything can be built and
  reviewed. Swapping in the real text must be **trivial and low-risk**.
- The Bible is the **foundation for future ministry features** (search — already
  built — plus cross-references, sermon links, reading plans, verse sharing), so its
  data model was designed to support them without a rewrite.

---

## 2. What it does (functional scope)

| Route | Page | Content |
|---|---|---|
| `/<locale>/bible` | Landing | Search box + all 66 books, split Old / New Testament, in canonical order |
| `/<locale>/bible/<book>` | Book | The book's chapters as a numbered grid |
| `/<locale>/bible/<book>/<chapter>` | Chapter (reading) | Every verse with a `#v<n>` anchor, breadcrumb, previous/next chapter navigation |

- **Localized** UI and book names (`mk` default, `en`); verse text is the language's
  own translation, never machine-translated.
- **Search** across all verses, client-side, on the landing page.
- Deep links: `…/bible/john/3#v16` scrolls to that verse.

---

## 3. Architecture at a glance

| Decision | Choice | Why |
|---|---|---|
| Where verse data lives | **Static JSON in the repo** (never Sanity) | Immutable canonical text; fastest possible delivery; no CMS dependency. Mandated by `CLAUDE.md`. |
| Rendering | **SSG + Server Components** | Text changes only on deploy; static HTML gives the best mobile performance. |
| Book identity | **Canonical, language-independent slugs** (`genesis`, `1-john`) | One URL space for both languages; stable keys for search / future links. |
| File layout | **Manifest + one file per book, per locale** | Small, reviewable files; routing reads only the tiny manifest, never the corpus. |
| Localization of text | **Separate `mk` and `en` datasets** | The two languages are *different translations*, not translations of each other. |
| Search | **Client-side Fuse.js, lazy-loaded index** | No search server; the (large) index loads only when the user searches. |

---

## 4. Domain model

A loaded book/chapter/verse always belongs to **one language**. The model is rooted
in the idea of a *translation* (one language's Bible), never a bilingual pair.

```
Book        id (canonical slug)  ·  name (localized)  ·  testament (OT|NT)  ·  chapters[]
Chapter     number  ·  verses[]
Verse       number  ·  text          ← single language, no bilingual twin
```

Two **value objects** (in `src/features/bible/bible.reference.ts`) are the hinges for
current and future features. They carry coordinates, never text:

- **`BibleReference`** — one verse. Canonical string `book.chapter.verse` → `john.3.16`.
- **`BibleReferenceRange`** — a span within one book. `john.3.16-18` or `john.3.16-4.2`.

Search results, deep links, and every planned feature (cross-references, sermon links,
sharing, reading plans) resolve through these + the canonical slug — so they attach
additively, with no change to the reading pages.

---

## 5. Files & data structure

Everything under `src/data/bible/` is a **generated artifact** (see §8):

```
src/data/bible/
├── manifest.json          # routing/shape for ALL locales — the single source of truth
├── mk/<book>.json         # Macedonian text, one file per book (66)
├── en/<book>.json         # English text, one file per book (66)
└── search/<locale>.json   # flat search index per locale (one entry per verse)
```

**A per-book file** (`en/john.json`):

```jsonc
{
  "id": "john",              // canonical slug — must equal the file name
  "name": "John",            // localized display name for THIS language
  "testament": "NT",         // "OT" or "NT"
  "chapters": [
    {
      "number": 1,
      "verses": [
        { "number": 1, "text": "…" },
        { "number": 2, "text": "…" }
      ]
    }
  ]
}
```

**The manifest** — describes the *shape* of the data (which books, their order and
testament, and how many verses each chapter has). It contains **no verse text**:

```jsonc
{
  "version": 1,
  "metadata": {
    "translation": "placeholder",           // provenance only
    "generatedAt": "2026-07-12T14:03:35Z",
    "generatorVersion": "1.0.0"
  },
  "books": [
    { "id": "genesis", "order": 1, "testament": "OT", "chapters": [31, 25, 24, /* … */] }
    // chapters[i] = number of verses in chapter (i+1); array length = chapter count
  ]
}
```

> **One manifest covers both languages.** This is valid because routing is
> language-independent and both locales are validated to match the same shape. It
> assumes `mk` and `en` share versification (same verse counts) — true for the
> placeholder and for typical Protestant-canon translations. If a future translation
> ever diverges, the module would move to per-locale manifests (`manifest.<locale>.json`).

**The search index** (`search/en.json`) — one entry per verse:

```jsonc
{ "locale": "en", "entries": [ { "reference": "john.3.16", "bookName": "John", "text": "…" } ] }
```

---

## 6. Data flow

**Build (all pages are prerendered):**

```
manifest.json ──▶ generateStaticParams()  ──▶ ~2,512 static routes
                     (books + chapters,          (2 landing + 132 book +
                      no verse text loaded)        2,378 chapter pages)
                                                        │
per-book JSON ──▶ data layer (lazy, validated, cached) ─┘ ──▶ static HTML
```

**Reading a chapter (at request time there is nothing to do — it is static HTML):**

```
/en/bible/john/3  →  getChapter("en","john",3)  →  en/john.json (cached)  →  verses
                     ChapterNav reads the manifest for prev/next (crosses book edges)
```

**Search (client-side, on the landing page only):**

```
user types  →  lazy import search/<locale>.json  →  build Fuse index (once)
            →  match  →  results link to /<locale>/bible/<book>/<chapter>#v<verse>
```

All Bible file access goes through **`src/features/bible/bible.data.ts`** — the only
module allowed to read the JSON. Pages and components never import the JSON directly.

---

## 7. Rendering & performance

- **Reading pages ship zero page-specific JavaScript.** Book and chapter pages are
  pure Server Components — no client bundle, no client fetching, no hydration.
- **Routing never loads verse text** — `generateStaticParams` reads only the manifest.
- **Search is isolated** to the landing page; its multi-MB index is a separate chunk
  loaded **only when the user starts typing**, never in any initial page.
- Verified at build: ~2,512 Bible pages prerender as static HTML; reading routes carry
  no added JS.

---

## 8. Validation — the build fails on bad data

Validation is defined once in `src/features/bible/bible.schema.ts` (Zod + cross-file
checks) and runs **before every build** via the `prebuild` script, and again in the
data layer as files are read. A build **fails** if any of these are true:

malformed JSON · missing/extra fields · empty or whitespace-only verse text ·
unknown book slug · invalid testament · unknown/missing locale · duplicate or
non-contiguous chapters/verses · a data file that disagrees with the manifest ·
a search entry whose reference does not resolve.

This is the safety net that makes swapping the dataset low-risk: **if the new files
are wrong, the site will not build — it cannot deploy broken Bible data.**

---

## 9. Search

- Offline per-locale indexes (`search/<locale>.json`) are generated with the rest of
  the data and validated at build.
- The Fuse.js wrapper lives in `bible-search.ts` (client-only; deliberately **not**
  exported from the server barrel). The client component `BibleSearch.tsx` loads the
  index lazily and matches on verse text and book name.

---

## 10. Commands

```bash
npm run bible:generate   # regenerate the placeholder dataset + search indexes, then validate
npm run bible:validate   # validate the dataset only (also runs automatically before every build)
npm test                 # unit tests (reference value objects, schema/validation, search)
npm run build            # full production build (runs bible:validate first)
```

The generator is `scripts/generate-placeholder-bible.mjs`; the validator is
`scripts/validate-bible.ts`. **Never hand-edit files under `src/data/bible/`** —
regeneration overwrites them.

---

## 11. Replacing the placeholder with the real Bible

This is the whole point of the design. When the licensed Bible is ready:

1. The content owner supplies the text following
   **[bible-dataset-guide.md](./bible-dataset-guide.md)** (plain-language instructions).
2. A developer produces the files under `src/data/bible/` (`manifest.json`, `mk/*.json`,
   `en/*.json`, `search/*.json`) in the exact structure of §5 — either by hand-placing
   provided JSON or by running it through the pipeline.
3. `npm run bible:validate` must pass (the build runs it automatically).
4. Commit and deploy.

**No application code changes are required** — the code is translation-agnostic and
reads whatever valid dataset is present. If the data is malformed, validation stops the
deploy rather than shipping a broken Bible.

---

## 12. Extensibility (no rewrite required)

Each future feature attaches through the `Reference` / `ReferenceRange` value objects
and the canonical slugs:

| Feature | How it attaches |
|---|---|
| Cross-references | Sidecar map `reference → reference[]` |
| Sermon → verse links | Sermon stores a reference; UI links to `…/#v<n>` |
| Bookmarks / highlights | Client storage keyed by the reference string |
| Reading plans | Ordered lists of reference ranges |
| Verse sharing | Format a reference → canonical citation + deep link |

---

## 13. Source map

| File | Responsibility |
|---|---|
| `src/features/bible/bible.types.ts` | Domain model + manifest/search types |
| `src/features/bible/bible.constants.ts` | Canonical 66-book registry (slug, order, testament) |
| `src/features/bible/bible.reference.ts` | `Reference` / `ReferenceRange` value objects (pure) |
| `src/features/bible/bible.schema.ts` | Zod schemas + cross-file validation |
| `src/features/bible/bible.data.ts` | The only reader of the JSON — accessors, cache |
| `src/features/bible/bible-search.ts` | Fuse.js wrapper (client-only) |
| `src/components/bible/*` | Server components (lists, grid, verses, nav, breadcrumb) + `BibleSearch` (client) |
| `src/app/[locale]/bible/**` | The three routes |
| `scripts/generate-placeholder-bible.mjs` | Placeholder generator |
| `scripts/validate-bible.ts` | Dataset validator (the build gate) |
