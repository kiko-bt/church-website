---

# `.claude/cms-modeling.md`

```md
# CMS Modeling Rules
# Project: Црква Евангелие Христово - Битола

---

# PURPOSE

This document defines the official CMS architecture and modeling rules.

CMS:

- Sanity CMS
- preacher-friendly
- low maintenance
- minimal complexity

---

# OFFICIAL CMS RESPONSIBILITY

Sanity manages:

- sermons
- books
- PDFs
- gallery images
- church settings
- social links
- metadata
- homepage content (Welcome Text, Main Verse, Short Message)

Sanity DOES NOT manage:

- Bible verse data
- Bible chapters
- searchable verse content

---

# CRITICAL BIBLE RULE

Bible verse data lives in:

- local JSON files
- committed in the repository

NOT inside Sanity.

---

# BIBLE STORAGE ARCHITECTURE

```txt
src/data/bible/
├── mk/<bookId>.json        hand-owned: Macedonian verse text
├── en/<bookId>.json        hand-owned: English verse text
├── manifest.json           derived — routing shape, no verse text
└── search/<locale>.json    derived — Fuse.js index, one entry per verse
```

---

# HOMEPAGE CONTENT

Sanity manages a `homeContent` singleton for preacher-editable
homepage copy, covering three sections:

- Welcome Text (`WelcomeSection`)
- Main Verse (`ScriptureSection`)
- Short Message (`CTASection`)

The feature is fully implemented in `src/features/home-content/`
(types + queries + mapper + cached accessor), following the same
pattern as `church-settings`. When the Sanity client is not
configured, these sections fall back to `messages/*.json`
(`home.welcome.*`, `home.scripture.*`, `home.cta.*`).

Bilingual fields follow the Bible JSON `field` / `field_en`
convention (e.g. `welcomeTitle` / `welcomeTitle_en`). Rich-text
fields are Portable Text: the `RichTextContent` type
(`src/types/sanity.ts`) is backed by `@portabletext/types`
(`PortableTextBlock[]`) and rendered by `PortableTextRenderer`.

---

# STUDIO (STANDALONE) — SINGLE SOURCE OF TRUTH

The Sanity Studio is a **separate sibling application**
(`../studio-church-ehb/`), kept out of the website so the site ships
no Studio dependencies and the CMS deploys independently.

The content model lives ONLY in this repo, under `sanity/`:

- `sanity/schemas/**` — objects, singletons, documents
- `sanity/structure.ts` — desk structure (pins singletons)
- `sanity/defineStudioConfig.ts` — shared config factory (schema +
  structure + singleton templates filter + document actions)

Both `sanity/sanity.config.ts` (website side) and the standalone
Studio's `sanity.config.ts` consume `defineStudioConfig()`.

ALWAYS:

- add/modify schemas, structure, and singleton rules ONLY under
  `church-website/sanity/`
- extend `defineStudioConfig()` for new Studio configuration

NEVER:

- define or copy schemas inside `studio-church-ehb/`
- create a parallel Studio config — there is exactly one factory
