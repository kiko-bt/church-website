---
paths:
  - "src/features/bible/**"
  - "src/data/bible/**"
  - "src/components/bible/**"
  - "src/app/**/bible/**"
  - "scripts/build-bible-artifacts.ts"
  - "scripts/validate-bible.ts"
  - ".github/workflows/bible-guard.yml"
---

# Bible module — binding engineering rules

The Bible module is the most important module in this project. These are the
constraints every change to it must uphold. How the module actually works is
documented in `docs/bible-module.md`.

The next owner of this repository is the preacher, not an engineer. The only thing
he will ever edit is verse text inside `src/data/bible/{mk,en}/*.json`. Every rule
below exists to keep that true.

---

## 1. Sources of truth

There are exactly four, and nothing may introduce a fifth:

| What | Where |
| --- | --- |
| Verse text | `src/data/bible/{mk,en}/<bookId>.json` |
| Book display names | `src/features/bible/bible.display-names.ts` |
| Book order and identity | `src/features/bible/bible.constants.ts` (`BIBLE_CANON`) |
| Validation rules | `src/features/bible/bible.schema.ts` |

`manifest.json` and `search/*.json` are **derived** by
`scripts/build-bible-artifacts.ts`. Never hand-edit them, and never add a generator
that writes the book files — the book files are hand-owned.

**Bible verse data must never move into Sanity.** Sanity stores Bible PDFs and
metadata only.

---

## 2. Data layout

One file per book, per locale — never one monolithic file, and never a bilingual
verse pair (`mk` and `en` are two independent translations):

```txt
src/data/bible/
├── mk/<bookId>.json        hand-owned: Macedonian verse text
├── en/<bookId>.json        hand-owned: English verse text
├── manifest.json           derived — routing shape, no verse text
└── search/<locale>.json    derived — Fuse.js index, one entry per verse
```

```json
{
  "id": "matthew",
  "testament": "NT",
  "chapters": [{ "number": 1, "verses": [{ "number": 1, "text": "…" }] }]
}
```

Nothing here is fetched from Sanity or from an API at runtime. This guarantees
deterministic rendering, predictable search, zero runtime CMS dependency, stable
SSG, and lower architectural complexity.

---

## 3. Book names and order are fixed

- A book file MUST NOT contain a `name` field. Names exist only in
  `bible.display-names.ts`, resolved by book id at render time. This is why a name
  cannot drift, and why renaming is a single-line edit.
- Book ids are canonical English slugs (`matthew`, `1-john`). They are
  language-independent, are the only identity used for URLs, the manifest and
  references, and are never translated.
- `BIBLE_CANON` order MUST NOT change. `validate-bible.ts` rejects a manifest that
  disagrees with it; `bible.display-names.test.ts` asserts the 66 ids literally;
  `.github/workflows/bible-guard.yml` runs both on every PR and push to `main`.
- Changing a name is a content-owner decision, never a developer's. Edit
  `bible.display-names.ts` only, then run `npm run bible:build`.

---

## 4. Domain model

- A loaded `BibleBook` / `BibleChapter` / `BibleVerse` belongs to exactly **one
  translation in one language**. The Macedonian and English sites read different
  source Bibles, not machine translations of each other.
- **Verse text must never be passed through an LLM**, in either direction — not to
  translate, reword, re-punctuate or "improve" it. Structural changes only.

---

## 5. Data access boundary

- The manifest and the per-book files must never be imported directly outside
  `src/features/bible/bible.data.ts`.
- The one deliberate exception is the search index: `BibleSearch` (a Client
  Component) `import()`s `data/bible/search/<locale>.json` itself, because the data
  layer is server-side and the index must arrive as a lazy client chunk. Nothing
  else may read it, and it stays a dynamic import so it never lands in the initial
  payload.
- `features/bible/index.ts` must stay server-safe: it must not re-export the
  Fuse.js-backed `bible-search.ts`. Import that directly where needed.
- `bible.schema.ts` must keep **zod as its only value import** — everything else
  type-only. That is what lets `scripts/validate-bible.ts` run it under plain Node
  via type-stripping.

---

## 6. One manifest describes both locales

Routing is language-independent, and every locale is validated against the same
manifest, so `mk` and `en` must share versification (identical chapter and verse
counts per book). This holds for the delivered dataset — all 1,189 chapters were
verified to agree.

If a future translation ever diverges, do not loosen the validator: move to
per-locale manifests (`manifest.<locale>.json`). A diverging pair must fail the
build, never be silently accepted.

---

## 7. The build must fail on bad data

Validation is defined once in `bible.schema.ts` and runs on `prebuild`. It MUST
continue to fail for: malformed JSON · missing or unexpected fields · empty or
whitespace-only verse text · a slug outside the canon · an invalid testament · an
unknown locale · duplicate book ids · non-contiguous chapter or verse numbering ·
missing or extra chapters/verses · manifest ↔ file mismatch · a search index that is
not exactly one entry per verse.

Error messages are read by a non-engineer. They must name the file and say what to
do, not just what is wrong.

---

## 8. Rendering

- SSG + Server Components. **Zero client JavaScript on the reading path**; search is
  confined to the landing page.
- Routing reads the manifest only — `generateStaticParams` must never load verse
  text.
- `dynamicParams = false` on the book and chapter routes, so non-canonical URLs
  return a real 404 instead of duplicate content at HTTP 200.

Flow: local JSON → `generateStaticParams()` → static routes → static HTML.

---

## 9. Search

Client-side **Fuse.js** over the locally generated index. Never Algolia,
Elasticsearch, database search, or a vector database.

---

## 10. Commands

```
npm run bible:validate   # read-only integrity check
npm run bible:build      # regenerates manifest + search indexes, then validates
```

Reviewing Bible work: verify local JSON usage, Fuse.js usage, SSG rendering, and
that no Bible data has moved into Sanity.
