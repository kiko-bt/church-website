# Bible Module — Architecture & Engineering Rules

The Bible module is the highest-priority feature of the site. This document is
the **binding rule set** — the constraints every change must uphold. It must
remain robust enough to support the reading experience today while remaining
extensible for future features (search, cross-references, bookmarks, reading
plans, sermon integration) **without a structural redesign**.

> Companion docs: **[docs/bible-module.md](../docs/bible-module.md)** (how the
> module works, end to end — design, data flow, operations) ·
> **[docs/bible-dataset-guide.md](../docs/bible-dataset-guide.md)** (plain-language
> instructions for the content owner supplying the real Bible).

---

## 1. Domain model (Translation-rooted, single-language)

- A loaded `BibleBook` / `BibleChapter` / `BibleVerse` always belongs to exactly
  **one translation in one language**.
- The Macedonian and English sites read **different source Bibles**, not machine
  translations of each other. Verse text is therefore **never** stored as a
  bilingual pair, and the code **never assumes verse N aligns across languages**
  (versification can differ between translations).
- **Canonical book slugs** (`genesis`, `1-john`, …) are the only identity used
  for URLs, the manifest, and references. They are **language-independent** and
  **never translated**. Book display names are localized and live only inside
  the per-locale data files.

### Value objects

- **`BibleReference`** — a language-independent pointer to a single verse
  (`{ bookId, chapter, verse }`). Canonical string form: `bookId.chapter.verse`
  (e.g. `john.3.16`). Carries no text.
- **`BibleReferenceRange`** — a span of verses within one book
  (`{ bookId, start:{chapter,verse}, end:{chapter,verse} }`). Canonical string
  form: `john.3.16-18` (same chapter) or `john.3.16-4.2` (cross-chapter). This
  exists **now** so reading plans, sermon references, and cross-references can be
  added later without changing the domain model.

Both value objects live in `bible.reference.ts` and have **zero dependencies**
(safe to import from Server Components, Client Components, and build scripts).

---

## 2. Data storage & the manifest

Bible verse data lives in the repository as static JSON (never in Sanity):

```
src/data/bible/
  manifest.json         # single source of truth for routing / generateStaticParams
  mk/<bookId>.json      # one translation, one book
  en/<bookId>.json
  search/{mk,en}.json   # built later (Phase 7.6), consumed only by the client
```

- The **manifest is the single source of truth** for routing. `generateStaticParams`
  and metadata read the manifest only — never the full verse corpus.
- The manifest describes **shape without text**: which books exist, their
  canonical order and testament, and the verse count of every chapter.
- The manifest **must** include provenance metadata: `translation`, `generatedAt`,
  and `generatorVersion` (plus a schema `version`).
- **One manifest describes the structure of ALL locales.** This is valid because
  routing is language-independent (canonical slugs) and every locale's per-book
  files are validated to conform to the same manifest (same chapter and verse
  counts). It relies on the assumption that the `mk` and `en` datasets share
  versification — which the placeholder guarantees by construction, and which
  holds for typical Protestant-canon translations.
  - **Verified against the real dataset.** When the preacher's complete Macedonian
    Bible was migrated (`npm run bible:migrate`), all 1,189 chapters were compared
    against the WEB English chapter by chapter: **zero divergence**. The delivered
    Macedonian follows traditional (KJV/WEB) versification — including the cases
    that most often differ, such as the Psalm superscriptions, Joel, and Malachi —
    so the single-manifest model holds for the production dataset.
  - **Future caveat:** if a client-supplied translation ever diverges in
    versification (different verse counts in some chapters), this single-manifest
    model must be revisited — most likely by moving to **per-locale manifests**
    (`manifest.<locale>.json`). This is the one place versification divergence
    would surface; see §1 ("never assume verse N aligns across languages").
    `bible:migrate` and `bible:import` both hard-stop rather than write a
    diverging pair, so this can never reach the dataset silently.

---

## 3. Source of truth vs generated artifacts

The **per-book files** (`src/data/bible/mk/*.json`, `src/data/bible/en/*.json`)
are the **source of truth**. `manifest.json` and `search/*.json` are **derived**
from them by `scripts/build-bible-artifacts.ts` (`npm run bible:build`).

- **Never hand-edit `manifest.json` or `search/*.json`.** They are regenerated
  from the book files and a manual edit is silently destroyed on the next build.
- **Never hand-edit the book files to "match" the placeholder.** Real corrections
  come from the source dataset (or, for placeholder, the generator), then
  `bible:build` re-derives the manifest and search indexes.
- For placeholder data, `scripts/generate-placeholder-bible.mjs` writes the book
  files; `bible:build` then derives the rest — the same derivation used for real
  data, so the two paths never diverge.

---

## 4. Placeholder content rules (until the licensed dataset arrives)

The production Bible dataset will be supplied later by the client after
legal/licensing confirmation. Until then the module runs on **placeholder data**.

The placeholder generator **MUST**:

- Generate **entirely original devotional text**. It **MUST NEVER** reproduce or
  closely paraphrase any real Bible translation.
- Produce realistic sentence lengths, paragraph cadence, verse lengths, and
  vocabulary — reverent in tone, so navigation/rendering/search are exercised
  realistically. Example of an acceptable placeholder verse:
  > "The people gathered with thankful hearts, remembering that faith is
  > strengthened through obedience and mercy is shown to those who seek wisdom."
- Be **deterministic**: identical inputs (generator version + structural seed)
  always produce identical verse text and structure. The only intentionally
  non-deterministic field is `generatedAt` (provenance).
- Use **real structural facts** (the 66-book canon, real book names, real
  chapter counts) so the placeholder resembles a real Bible and the production
  dataset is a **shape-identical drop-in**.

**Scope of "real structure" — verse counts are generated, not real.** The
placeholder mirrors the real canon at the *book* and *chapter* level (66 books,
real chapter counts, 1,189 chapters total). **Verse counts per chapter are
deterministically generated** in a representative range (≈12–38), *not* copied
from the real canon. Consequently the placeholder holds ≈29,780 verses/locale
versus the real canon's ≈31,102 — this difference is **intentional**. Mirroring
exact per-chapter verse counts is deliberately out of scope: the production
dataset will supply the real counts, and because the manifest is the single
source of truth for routing, that swap requires **no code changes**.

### Replacement contract (no code changes)

Replacing placeholder data with the production dataset must require **only**:

```
Replace the JSON files under src/data/bible/  →  Commit  →  Deploy
```

No application code changes. The architecture is translation-agnostic.

### Real-book intake tools

Two scripts turn preacher-supplied Macedonian text into a validated `mk`/`en` pair:

- `scripts/import-bible-book.ts` (`npm run bible:import -- <book-id> <path>`) — **one book**;
  see [docs/bible-module.md §11.1](../docs/bible-module.md#111-importing-one-real-book-at-a-time).
- `scripts/migrate-client-bible.ts` (`npm run bible:migrate -- <ot.json> <nt.json>`) — a
  **complete two-file delivery** (one file per testament); see
  [docs/bible-module.md §11.2](../docs/bible-module.md#112-migrating-a-complete-two-file-delivery).

Rules they exist to enforce, that any future change to **either** MUST preserve:

- **English is never machine-translated from the Macedonian text.** It is fetched from a real,
  independent public-domain source (currently the World English Bible via bible-api.com), per
  §1's "different source Bibles" rule. Verse text must never be passed through an LLM.
- **Only a fixed, known list of critical-text verse omissions may be auto-healed**
  (`KNOWN_OMITTED_VERSES`, shared by both scripts via `scripts/bible-omissions.ts` so they can
  never drift apart). Any other missing verse number must hard-stop the script — it is very
  likely a real error in the supplied source, not something to paper over.
- **Nothing is written unless mk and en versification agrees** chapter by chapter. A divergence
  is a human decision (see §2's per-locale-manifest caveat), never an automatic fix.
- **Verse text is transformed only structurally.** The one sanctioned character-level repair is
  Latin→Cyrillic homoglyph correction inside otherwise-Cyrillic words (the delivered NT encoded
  `сѐ`/`нѐ` with Latin `è` U+00E8). Any new text-altering rule needs explicit approval and must
  be reported per-occurrence.

---

## 5. Data access boundary

- Bible JSON files (`manifest.json`, `mk/*.json`, `en/*.json`) **must never be
  imported directly outside the data layer**. All access flows through
  `src/features/bible/bible.data.ts`.
- The feature barrel (`features/bible/index.ts`) stays **server-safe**: it must
  not re-export the Fuse.js-backed client search module.

---

## 6. Validation (build must fail on bad data)

Validation is defined once in `bible.schema.ts` (Zod) and enforced at build
time. The build **MUST FAIL** for any of:

- malformed JSON
- missing required fields or unexpected extra fields
- **empty or whitespace-only verse text**
- **invalid book slugs** (not in the canonical registry)
- **invalid testament values** (not `OT` / `NT`)
- **unknown locales** (not `mk` / `en`)
- duplicate book ids, duplicate chapters, or duplicate verses
- invalid ordering (canonical order not contiguous `1..N`; chapters or verses
  not contiguous `1..N`)
- **missing or extra chapters/verses**
- **manifest ↔ file mismatches** (a book/chapter/verse count in a data file that
  disagrees with the manifest)
- an invalid or inconsistent manifest

---

## 7. Rendering & extensibility

- **SSG + Server Components.** Zero client JavaScript on the reading path.
- Chapter pages provide breadcrumbs, per-verse anchors (`#v1`), previous/next
  chapter navigation, and localized UI.
- Future features attach via `BibleReference` / `BibleReferenceRange` and the
  canonical slugs — additively, with no structural redesign:
  cross-references, footnotes, study notes, bookmarks, highlights,
  reading plans, audio, sermon references, verse sharing.

---

## 8. Search (implemented)

- **Offline indexes are generated artifacts.** `src/data/bible/search/<locale>.json`
  is produced by the same generator/pipeline as the rest of the dataset (one
  entry per verse: `{ reference, bookName, text }`). Never edit by hand (§3), and
  they are validated at build time (§6): entry count must equal the verse count
  and every `reference` must resolve within the manifest.
- **Search is client-side (Fuse.js), lazy-loaded.** The index is loaded only when
  the user starts typing — it is **never** part of any initial page payload. The
  Fuse wrapper lives in `features/bible/bible-search.ts` and is imported directly
  by the client component; it is **not** re-exported from the server barrel (§5).
- **The reading path stays 0-JS.** Search lives on the Bible landing page only.
  Book and chapter (reading) pages remain pure Server Components with no
  client-side JavaScript, fetching, or state.
- Results link to `/<locale>/bible/<book>/<chapter>#v<verse>`, resolved from the
  entry's canonical `reference` via `bible.reference.ts`.
