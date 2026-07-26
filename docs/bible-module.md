# Bible Module — Source of Truth

The Bible is the most important feature of the site: the church's primary purpose is
ministry and Bible reading. This document is the single source of truth for the module
— organized by responsibility, not by history.

> Companion docs: **[README](../README.md)** (developer tour) ·
> **[bible-dataset-guide.md](./bible-dataset-guide.md)** (plain-language instructions for
> the content owner supplying the real Bible) ·
> **[.claude/bible-module.md](../.claude/bible-module.md)** (the binding engineering rules
> this document implements).

**Contents:** [1. Purpose](#1-purpose) · [2. Requirements](#2-requirements) ·
[3. Business Rules](#3-business-rules) · [4. Architecture](#4-architecture) ·
[5. Design Decisions](#5-design-decisions) · [6. Folder Structure](#6-folder-structure) ·
[7. Data Model](#7-data-model) · [8. Rendering Pipeline](#8-rendering-pipeline) ·
[9. Validation Pipeline](#9-validation-pipeline) · [10. Search](#10-search) ·
[11. Dataset Replacement](#11-dataset-replacement) · [12. Performance](#12-performance) ·
[13. Future Extensions](#13-future-extensions)

---

## 1. Purpose

The module lets a visitor **read the entire Bible** — Old and New Testament, every book,
chapter, and verse — in **Macedonian or English**, with a fast, shareable, offline-of-any-CMS
reading experience. It is also the **foundation for future ministry features** (search is
already built; cross-references, sermon links, reading plans, and verse sharing are designed
for), so its data model is deliberately extensible.

The real, licensed Bible text will be provided later by the content owner. Until then the
module runs on realistic **placeholder** text, and swapping in the real text is a
**no-code change**.

---

## 2. Requirements

**Functional**

- Read the full 66-book Protestant canon: Old and New Testament, books, chapters, verses.
- Two languages (`mk` default, `en`), each its own translation.
- Landing page listing books by testament, in canonical order, with search.
- Chapter reading view with per-verse anchors, breadcrumb, and previous/next navigation.
- Full-text search across all verses.
- Deep, shareable links to a specific verse (`…/bible/john/3#v16`).

**Non-functional**

- Static generation (SSG) for every page.
- Zero client JavaScript on the reading path.
- No runtime database or CMS dependency for verse text.
- Canonical, language-independent routing.
- Automatic validation that blocks deployment of bad data.

---

## 3. Business Rules

These are invariants — every change must uphold them.

1. **Verse data lives in the repository, never in the CMS.** Sanity stores only Bible PDFs
   and metadata, never verse text.
2. **Book slugs are canonical and never translated.** `genesis`, `1-john` are identity and
   URL; display names are localized.
3. **Macedonian and English are different translations**, not translations of each other.
   Verse text is never machine-translated.
4. **The per-book files are the source of truth.** `manifest.json` and `search/*.json` are
   derived from them and are never hand-edited.
5. **All generated files are artifacts.** Corrections are made to the source book files (or
   the pipeline), never to the manifest or search indexes directly.
6. **Both languages share versification** — the same chapter and verse counts per book. (True
   for the placeholder and for typical Protestant-canon translations; see §5.)
7. **A translation may be published only if licensed.** Confirming rights is a prerequisite to
   supplying the real dataset.

---

## 4. Architecture

Two flows define the module: how data becomes a live page, and how the generated artifacts
are produced.

**Reading pipeline (build → serve):**

```
manifest.json ──▶ generateStaticParams()  ──▶ static routes
                                                    │
per-book JSON ──▶ data layer (validated, cached) ───┘ ──▶ static HTML  (0 JS while reading)
```

**Generated-artifact flow (how the dataset is produced):**

```
book files (mk/*.json, en/*.json)        ← the source of truth (real or placeholder)
      │
      ▼
build-bible-artifacts.ts   (npm run bible:build)
      │
      ├──▶ manifest.json          (routing/shape, no verse text)
      └──▶ search/<locale>.json    (one entry per verse)
      │
      ▼
validate-bible.ts          (npm run bible:validate)   ← blocks the build if anything is wrong
      │
      ▼
next build  ──▶ static HTML  ──▶ deploy
```

For placeholder data, `generate-placeholder-bible.mjs` writes the book files first; from that
point the flow is identical to real data.

---

## 5. Design Decisions

The *why* behind the architecture. Each decision exists to protect a specific property.

**Why a manifest?**
Routing must never scan verse text. The manifest keeps route generation independent of Bible
content — `generateStaticParams` reads only the manifest (which books, their order and
testament, and each chapter's verse count), so building ~2,500 routes never loads the corpus.

**Why per-book files (not one big file)?**
- Small, reviewable commits — a fix to one book touches one small file, not a multi-megabyte blob.
- Lower memory — a chapter page loads only its book, not the whole Bible.
- Better cache locality — each book is parsed and cached once.
- Easier translation replacement — books can be delivered and swapped independently.

**Why canonical, language-independent slugs?**
A verse's location must be one thing in both languages. Canonical slugs give one URL space,
stable keys for search and future references, and book names that localize without changing
identity or links.

**Why static JSON (not a CMS or database)?**
Bible text is immutable canonical content that changes only on deploy. Static JSON gives the
fastest possible delivery, no runtime dependency, and deterministic builds. A CMS or database
would add runtime failure modes for content that never changes between deployments.

**Why derive the manifest and search from the book files?**
The book files are the single source of truth. Deriving the manifest and search indexes means
they can never silently drift from the text, and replacing the Bible is "replace the book
files and re-derive" — not "hand-edit three things and hope they agree."

**Why one manifest for both locales?**
Routing is language-independent, and every locale is validated to conform to the same shape.
This keeps routing simple. It relies on both translations sharing versification; if a future
translation diverges, the module moves to per-locale manifests (`manifest.<locale>.json`).

**Why client-side search?**
Search needs a full-text index but no search server. A prebuilt index loaded lazily in the
browser keeps the reading path free of any search cost and avoids a backend service.

---

## 6. Folder Structure

```
src/
├── data/bible/                 # GENERATED ARTIFACTS — never hand-edit
│   ├── manifest.json           #   derived: routing/shape for all locales, no verse text
│   ├── mk/<book>.json          #   SOURCE OF TRUTH: Macedonian text, one file per book (66)
│   ├── en/<book>.json          #   SOURCE OF TRUTH: English text, one file per book (66)
│   └── search/<locale>.json    #   derived: flat search index, one entry per verse
├── features/bible/             # The module's code
│   ├── bible.types.ts          #   Domain model + manifest/search types
│   ├── bible.constants.ts      #   Canonical 66-book registry (slug, order, testament)
│   ├── bible.reference.ts      #   Reference / ReferenceRange value objects (pure)
│   ├── bible.schema.ts         #   Zod schemas + cross-file validation
│   ├── bible.data.ts           #   The ONLY reader of the JSON — accessors + cache
│   ├── bible-search.ts         #   Fuse.js wrapper (client-only)
│   └── index.ts                #   Server-safe public API (barrel)
├── components/bible/           # Server components + BibleSearch (client)
└── app/[locale]/bible/**       # The three routes (landing, book, chapter)

scripts/
├── generate-placeholder-bible.mjs   # Writes placeholder BOOK FILES only
├── import-bible-book.ts             # Imports ONE real book: cleans mk, fetches matching en
├── build-bible-artifacts.ts         # Derives manifest + search FROM the book files
└── validate-bible.ts                # The build gate
```

---

## 7. Data Model

A loaded book/chapter/verse always belongs to **one language**.

```
Book        id (canonical slug)  ·  name (localized)  ·  testament (OT|NT)  ·  chapters[]
Chapter     number  ·  verses[]
Verse       number  ·  text          ← single language, no bilingual twin
```

**Value objects** (in `bible.reference.ts`) carry coordinates, never text — they are the
hinges for search and every future feature:

- **`BibleReference`** — one verse. Canonical string `book.chapter.verse` → `john.3.16`.
- **`BibleReferenceRange`** — a span within one book. `john.3.16-18` or `john.3.16-4.2`.

**Manifest** — shape without text: `version`, provenance `metadata`
(`translation`, `generatedAt`, `generatorVersion`), and `books[]` where each book has
`id`, `order`, `testament`, and `chapters` (an array of per-chapter verse counts).

**Search entry** — `{ reference, bookName, text }`, one per verse.

The exact JSON shapes are shown in [bible-dataset-guide.md](./bible-dataset-guide.md).

---

## 8. Rendering Pipeline

```
/en/bible/john/3
      │
      ▼
generateStaticParams()   reads manifest.json only → knows john has N chapters
      │
      ▼
getChapter("en","john",3)   loads en/john.json (validated on read, cached)
      │
      ▼
Server Components render verses + breadcrumb + prev/next  →  static HTML
```

- **SSG + Server Components.** Every landing, book, and chapter page is prerendered.
- **`dynamicParams = false`** on book and chapter routes: any URL not generated (unknown book,
  out-of-range or non-canonical chapter like `/john/03`) returns a real **404**, not a soft
  200.
- **Prev/next navigation crosses book boundaries**, computed from the manifest (no verse text
  loaded).
- **Reading pages ship zero page-specific JavaScript.**

---

## 9. Validation Pipeline

Validation is defined once in `bible.schema.ts` (Zod schemas + cross-file checks) and runs
**before every build** via the `prebuild` script (`bible:validate`), and again in the data
layer as files are read. **The build fails — and cannot deploy — if any check fails.**

Every guarantee, explicitly:

- ✓ malformed JSON
- ✓ missing required fields / unexpected extra fields (strict objects)
- ✓ empty or whitespace-only verse text
- ✓ invalid book slug (not in the canonical registry)
- ✓ invalid testament (not `OT` / `NT`)
- ✓ unknown or missing locale
- ✓ duplicate book ids
- ✓ duplicate chapters
- ✓ duplicate verses
- ✓ invalid ordering (canon order / chapter / verse numbering not contiguous `1..N`)
- ✓ missing or extra chapters / verses
- ✓ manifest ↔ file mismatch (a data file that disagrees with the manifest)
- ✓ search index: exactly one entry per verse (no out-of-canon references, duplicates, or gaps)
- ✓ locale consistency (each locale conforms to the same manifest)
- ✓ **display name lock** — every book file's `name` must equal the approved name
  in `bible.display-names.ts` (see §9.1)

This is the safety net that makes swapping the dataset low-risk: **if the new files are wrong,
the site will not build.**

### 9.1 Locked display names & order (immutable)

The **canonical 66-book order** (`BIBLE_CANON`) and the **localized display names**
(Macedonian + English) are approved by the content owner and are **fixed forever**.
They must not change across future commits, on any branch. Three mechanisms make
this an invariant rather than a convention:

1. **Single source of truth** — `src/features/bible/bible.display-names.ts` holds
   the approved name for every book in every locale. It is the only place a name
   is ever edited.
2. **Stamp + enforce** — `bible:build` stamps those names into every book file
   before deriving the manifest/search; `bible:validate` (run on `prebuild`, so
   before any deploy) fails if a book file's name has drifted from the registry.
3. **Migration + CI** — `migrate-client-bible.ts` stamps the locked names (never
   the raw delivery's), `bible.display-names.test.ts` asserts the lock in the test
   suite, and `.github/workflows/bible-guard.yml` runs validation + tests on every
   PR and push to `main`, blocking any change to a name or the order from merging.

**Why this exists:** the preacher's raw delivery uses different, longer book names
(e.g. `Евангелие според Матеј`, `Послание до Римјаните`). Before this lock, every
re-import silently reverted the approved names. Now a re-import — or any stray edit
— either produces the correct names or fails the build.

**To change a name** (rare, content-owner approval required): edit
`bible.display-names.ts` only, run `npm run bible:build`, commit. Binding rules:
`.claude/bible-module.md` §3.1.

---

## 10. Search

```
user types
      │
      ▼
lazy-load search/<locale>.json     (on first focus / keystroke — never in the initial page)
      │
      ▼
Fuse.js  (built once, in memory)
      │
      ▼
results
      │
      ▼
deep link  →  /<locale>/bible/<book>/<chapter>#v<verse>
```

- Indexes are generated with the dataset and validated at build (§9).
- The Fuse wrapper (`bible-search.ts`) is **client-only** and deliberately **not** exported
  from the server barrel; the reading path stays 0-JS.
- **Robustness:** the search component is remounted per locale (so a language switch never
  reuses the wrong-language index), a failed index load surfaces an error and can be retried,
  and the load is preloaded on input focus to overlap the download with typing.

---

## 11. Dataset Replacement

**This is the payoff of the whole design. No code changes are required.**

Replace only:

```
src/data/bible/mk/*
src/data/bible/en/*
```

Then run:

```bash
npm run bible:build
```

`bible:build` re-derives `manifest.json` and `search/*.json` from the new book files, **re-stamps
the locked display names** (§9.1 — the new files' own book names are ignored), and then
validates the whole dataset.

- If validation **succeeds** → commit and deploy. Nothing else changes.
- If validation **fails** → it prints exactly what is wrong; fix the source files and re-run.
  Broken Bible data can never reach production.

> Do **not** hand-edit `manifest.json` or `search/*.json`, and do **not** run
> `bible:generate` after placing real files — that regenerates *placeholder* text and would
> overwrite them. Real data flow is: replace book files → `bible:build` → deploy.

The content owner's plain-language instructions for writing the files are in
**[bible-dataset-guide.md](./bible-dataset-guide.md)**.

### 11.1 Importing one real book at a time

The content owner delivers the Bible **book by book**, in Macedonian, following
`bible-dataset-guide.md`. `scripts/import-bible-book.ts` (`npm run bible:import`) automates
turning that single delivery into a validated `mk/*.json` + `en/*.json` pair:

```bash
npm run bible:import -- <book-id> <path-to-mk-source-file.json>
npm run bible:build
```

What it does, and does **not** do:

- Cleans the Macedonian file: strips any field the schema doesn't allow (§3 below), checks
  chapter/verse numbering is contiguous.
- **Never machine-translates.** Per business rule §3.3, mk and en must be two real, independent
  source translations. For English it fetches the matching book from the **World English Bible**
  (WEB) — a real, public-domain translation — from `bible-api.com`, chapter by chapter. No verse
  text is ever passed through an LLM.
- Verifies the mk and en chapter/verse counts match exactly (shared versification, §5 "Why one
  manifest for both locales"). If they don't, it writes **nothing** for that book and prints
  exactly which chapters disagree — that needs a human to resolve, not an automatic guess.
- Handles the well-known **critical-text omissions** (Matthew 17:21, Mark 7:16, John 5:4, and a
  short fixed list of similar verses — see `KNOWN_OMITTED_VERSES` in the script): if the
  Macedonian source skips exactly one of these numbers, it inserts a bracketed editorial note so
  numbering stays contiguous and aligned with the WEB. Any **other** gap is treated as a likely
  typo in the source and stops the script — it is never silently patched.
- Does **not** run `bible:build` for you — run it yourself afterward and read its output.

This script only ever writes `src/data/bible/mk/<id>.json` and `src/data/bible/en/<id>.json`. It
never touches `manifest.json` or `search/*.json` (§3) — those still only come from `bible:build`.

### 11.2 Migrating a complete two-file delivery

The content owner ultimately delivered the **whole Bible at once**, as two files — one per
testament (`starzavet.json`, `novzavet.json`) — rather than book by book.
`scripts/migrate-client-bible.ts` (`npm run bible:migrate`) is the bulk counterpart to §11.1:

```bash
npm run bible:migrate -- ./starzavet.json ./novzavet.json
npm run bible:build
```

> **The two delivery files are no longer in the repository.** They were ~9 MB of verse text that
> is now fully represented (and validated) under `src/data/bible/`, so committing them would have
> duplicated the dataset. Everything the migration *drops* — each book's `shortName` and `slug`,
> the delivered ordering, and the file-level metadata including `textBasis`
> ("Nestle-Aland 28 — современо јазично прочистена верзија") — was extracted first into
> **[bible-delivery-provenance.json](./bible-delivery-provenance.json)** (19 KB), along with the
> SHA-256 of each original file. Re-running `bible:migrate` therefore requires obtaining the
> originals from the content owner again; the checksums in the provenance file let you confirm
> you received the same delivery.

It enforces the **same rules** as `bible:import` — same schema, same canon, the same
`KNOWN_OMITTED_VERSES` healing (both scripts import it from `scripts/bible-omissions.ts`, so
they can never drift apart), the same real-WEB English fetch, and the same
"nothing is written unless mk and en versification agrees" guarantee. On top of that it:

- Splits the two files into 66 per-book files and drops the delivery's extra fields
  (`shortName`, `slug`, `order`, and the file-level metadata block).
- Maps the delivery's `"old"` / `"new"` testament vocabulary to the project's `OT` / `NT`.
- Corrects non-canonical book ids via `ID_CORRECTIONS` (the delivery used `song-of-songs`;
  the project canon uses `song-of-solomon`). This is an **identity** correction only — it never
  changes a book's contents or its display name.
- Repairs a **homoglyph** in the delivered New Testament: `сѐ` / `нѐ` were encoded with the
  **Latin** `è` (U+00E8) instead of the **Cyrillic** `ѐ` (U+0450), which silently breaks Fuse.js
  search and produces mixed-script words for screen readers. The Old Testament file used the
  correct Cyrillic character throughout, so this was an artifact of how the NT was exported.
  Only that one substitution is applied, and only inside otherwise-Cyrillic words.
- Caches the WEB download in `.bible-web-cache/` (git-ignored) so a rate-limited or interrupted
  run resumes instead of re-downloading. `bible-api.com` throttles aggressively; a full run
  takes a couple of hours.

Verse text is **never** otherwise altered — no rewording, re-punctuation, or re-capitalization.

#### English-side corrections

Two things had to be handled on the English side. Both are **numbering / completeness** fixes;
neither rewords the WEB.

**1. Single-chapter books.** `bible-api.com` reads `Jude 1` as Jude *verse* 1, not chapter 1, and
returns a single verse. Obadiah, Philemon, 2 John, 3 John and Jude must be requested as a verse
range (`Jude 1:1-25`). `bible:migrate` does this automatically for any one-chapter book.
**Note:** `scripts/import-bible-book.ts` still has this bug — if it is ever used for one of those
five books it will silently produce a one-verse file. Worth fixing before that happens.

**2. Versification realignment** (`scripts/bible-versification.ts`). In five chapters the WEB
divides the same words differently from the NA28-based Macedonian. Because the project derives
one manifest from mk, the English is renumbered to match. Every English word is preserved — only
the boundary between verses moves:

| Book | WEB | Macedonian (NA28) | Action |
|---|---|---|---|
| 3 John 1 | 14 verses | 15 | Split WEB v14 at "Peace be to you." |
| 2 Cor 13 | 14 verses | 13 | Merge WEB v12+v13; benediction becomes v13 |
| Revelation 12/13 | 17 / 18 | 18 / 18 | Move "Then I stood on the sand of the sea." from 13:1 to 12:18 |
| Romans 14/16 | 26 / 25 | 23 / 27 | Move the doxology from 14:24-26 to 16:25-27 |

Each rule asserts the exact source wording it expects before touching it, so if the WEB text ever
changes upstream the migration **hard-stops** instead of mangling the text.

**3. Empty WEB verses.** The WEB returns Luke 17:36, Acts 8:37, Acts 15:34 and Acts 24:7 as empty
strings — it omits them for the same critical-text reason the Macedonian does. An empty verse
fails the schema, so `OMITTED_NOTE_EN` ("[This verse is not found in the earliest manuscripts.]")
is inserted, exactly mirroring the Macedonian side. Any *other* empty verse is a hard stop.

---

## 12. Performance

- **Reading pages: 0 KB page-specific JavaScript** — pure Server Components, no hydration, no
  client fetching.
- **Routing never loads verse text** — `generateStaticParams` reads only the manifest.
- **Verse text loads per book, cached** — each book is parsed once per build/process.
- **Search is isolated** to the landing page; its multi-MB index is a separate chunk loaded
  only on interaction.
- **Known trade-off (accepted for launch):** the first search parses the multi-MB index (the
  Macedonian index is largest) and builds the Fuse index over ~30k entries on the main thread.
  Network cost is mitigated by compression, caching, and focus-preload; the parse/build cost
  is not. Acceptable for this site's traffic — escalate to a Web Worker or a prebuilt Fuse
  index if real-device testing shows jank.

---

## 13. Future Extensions

Each attaches through the `Reference` / `ReferenceRange` value objects and the canonical slugs
— additively, with no structural redesign:

| Feature | How it attaches |
|---|---|
| Cross-references | Sidecar map `reference → reference[]` |
| Sermon → verse links | Sermon stores a reference; UI links to `…/#v<n>` |
| Bookmarks / highlights | Client storage keyed by the reference string |
| Reading plans | Ordered lists of reference ranges |
| Footnotes / study notes | Optional per-verse field or a sidecar keyed by reference |
| Verse sharing | Format a reference → canonical citation + deep link |

---

## Commands

```bash
npm run bible:import -- <book-id> <path>   # import ONE real book (mk clean + matching en), see §11.1
npm run bible:migrate -- <ot.json> <nt.json>  # migrate a complete two-file delivery, see §11.2
npm run bible:build      # re-derive manifest + search from the book files, then validate
npm run bible:generate   # (placeholder only) regenerate placeholder book files, then bible:build
npm run bible:validate   # validate the dataset (runs automatically before every build)
npm test                 # unit tests (reference value objects, schema/validation, search)
npm run build            # full production build (runs bible:validate first)
```
