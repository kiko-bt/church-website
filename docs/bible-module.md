# Bible Module

The complete 66-book Bible in Macedonian and English, statically generated, with
client-side search. It is the one module that does **not** use Sanity — all verse
text lives in the repository as JSON.

> For the content owner: **[bible-editing-guide.md](./bible-editing-guide.md)** —
> how to correct the Bible text.
> Binding engineering rules: **[.claude/bible-module.md](../.claude/bible-module.md)**.

---

## 1. How it fits together

```
src/data/bible/mk/<book>.json   ← SOURCE OF TRUTH: verse text (edit these)
src/data/bible/en/<book>.json
src/features/bible/bible.display-names.ts   ← SOURCE OF TRUTH: book names
src/features/bible/bible.constants.ts       ← SOURCE OF TRUTH: book order
            │
            │  npm run bible:build
            ▼
src/data/bible/manifest.json      ← DERIVED: routing shape, no verse text
src/data/bible/search/<locale>.json ← DERIVED: one entry per verse
            │
            │  npm run bible:validate  (runs automatically on prebuild)
            ▼
        next build  →  static HTML
```

Four inputs, two derived artifacts, one build gate. Nothing else.

**Never hand-edit `manifest.json` or `search/*.json`** — they are regenerated
from the four inputs and a manual edit is destroyed on the next build.

---

## 2. Files

```
src/
├── data/bible/
│   ├── mk/<book>.json      66 files — Macedonian verse text
│   ├── en/<book>.json      66 files — English verse text
│   ├── manifest.json       derived
│   └── search/<locale>.json  derived
├── features/bible/
│   ├── bible.constants.ts     BIBLE_CANON — the 66 books in canonical order
│   ├── bible.display-names.ts BIBLE_DISPLAY_NAMES — every book name, per locale
│   ├── bible.types.ts         domain model
│   ├── bible.schema.ts        Zod schemas + cross-file validation rules
│   ├── bible.data.ts          the ONLY reader of the JSON (accessors + cache)
│   ├── bible.reference.ts     parses "john.3.16" (used by search results)
│   ├── bible-search.ts        Fuse.js wrapper (client-only)
│   └── index.ts               server-safe public API
├── components/bible/       server components + BibleSearch (client)
└── app/[locale]/bible/**   three routes: landing, book, chapter

scripts/
├── build-bible-artifacts.ts   derives the manifest + search indexes
└── validate-bible.ts          the build gate
```

---

## 3. Data shape

A book file holds text and structure only — **no book name**:

```json
{
  "id": "3-john",
  "testament": "NT",
  "chapters": [
    { "number": 1, "verses": [{ "number": 1, "text": "…" }] }
  ]
}
```

The manifest describes shape without text: per book `id`, `order`, `testament`,
and `chapters` — an array of per-chapter verse counts, whose length is the
chapter count. A search entry is `{ reference, bookName, text }`, one per verse,
where `reference` is the canonical `bookId.chapter.verse` (e.g. `john.3.16`).

---

## 4. Book names and order

**Names** are defined in `src/features/bible/bible.display-names.ts` and nowhere
else. The book files carry no name; pages resolve one by id at render time.

To rename a book: edit that file, then run `npm run bible:build`. The rebuild is
required — the search index stamps a copy of each name in so Fuse can match on
it, and `bible:validate` fails (naming the book and the command) until that copy
is refreshed. A half-applied rename therefore cannot deploy.

**Order** is defined by `BIBLE_CANON` in `bible.constants.ts`. It is fixed: the
validator fails the build if the manifest disagrees with it, and the test suite
asserts the 66 ids literally, so a reordering cannot pass CI.

`.github/workflows/bible-guard.yml` runs the validator and the tests on every PR
and push to `main`, so neither names nor order can change without an explicit,
reviewed diff to one of those two files.

---

## 5. Rendering

```
/en/bible/john/3
  → generateStaticParams()  reads manifest.json only (never the verse corpus)
  → getChapter("en","john",3)  loads en/john.json, validates, caches
  → Server Components  →  static HTML
```

- **SSG everywhere.** Landing, book and chapter pages are all prerendered.
- **`dynamicParams = false`** on the book and chapter routes, so an unknown book
  or a non-canonical chapter form (`/john/03`, `/john/9999`) is a real 404, not
  a soft 200 with duplicate content.
- **Reading pages ship no page-specific JavaScript.** Search lives only on the
  landing page.
- Previous/next navigation crosses book boundaries and is computed from the
  manifest, so it loads no verse text.

---

## 6. Validation

Rules live once in `bible.schema.ts` and run from `scripts/validate-bible.ts`,
wired to `prebuild` — **bad data cannot deploy**. The data layer re-validates
each file as it is read, as a second gate.

The build fails on: malformed JSON · missing or unexpected fields (strict
objects) · empty or whitespace-only verse text · a book slug not in the canon ·
an invalid testament · an unknown or missing locale · duplicate book ids ·
chapter or verse numbering that is not contiguous `1..N` · missing or extra
chapters/verses · any disagreement between a book file and the manifest · a
search index that is not exactly one entry per verse.

---

## 7. Search

The per-locale index is loaded lazily — on first focus or keystroke — so it is
never in the initial page payload. Matching is in-memory via Fuse.js over
`text` and `bookName`; there is no server round-trip. Results link to
`/<locale>/bible/<book>/<chapter>#v<verse>`.

The search component is remounted per locale (a `key` at the call site), so a
language switch never reuses the wrong-language index. A failed load surfaces an
error and can be retried.

**Known trade-off:** the first search parses a multi-MB index (Macedonian is
~9.7 MB) and builds the Fuse index over ~31k entries on the main thread. Network
cost is mitigated by compression, caching and focus-preload; the parse/build
cost is not. Accepted for this site's traffic — move to a Web Worker or a
prebuilt Fuse index if real-device testing shows jank.

---

## 8. Provenance

- **Macedonian** — the content owner's own edition, Nestle-Aland 28 basis.
- **English** — the World English Bible (public domain, no attribution required).

Where both traditions omit a verse that the numbering still reserves (Matthew
17:21, Mark 7:16, John 5:4, Acts 8:37 and a few others), the verse holds a
bracketed editorial note rather than being left blank, so numbering stays
contiguous and the reader is told why. In five chapters the English verse
boundaries were renumbered to match the Macedonian (3 John 1, Acts 14, Romans
14/16) — a numbering change only; no English word was altered.

A record of the original delivery is in
[bible-delivery-provenance.json](./bible-delivery-provenance.json).

---

## 9. Replacing the text

Replace the files under `src/data/bible/mk/` and `src/data/bible/en/`, then:

```bash
npm run bible:build   # re-derives manifest + search, then validates
```

If validation passes, commit and deploy — no code changes. If it fails, it
prints exactly what is wrong. Both locales must agree on chapter and verse
counts, because one manifest describes both; if a future translation diverges,
that is the point to move to per-locale manifests (`manifest.<locale>.json`).

---

## Commands

```bash
npm run bible:build      # re-derive manifest + search from the book files, then validate
npm run bible:validate   # validate the dataset (runs automatically before every build)
npm test                 # unit tests (name/order locks, schema, search)
npm run build            # production build (runs bible:validate first)
```
