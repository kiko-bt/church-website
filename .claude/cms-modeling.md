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
├── bible-hierarchical.json
└── bible-search-index.json
```

---

# HOMEPAGE CONTENT (FUTURE CMS)

Sanity will manage a `homeContent` singleton for preacher-editable
homepage copy, covering three sections:

- Welcome Text (`WelcomeSection`)
- Main Verse (`ScriptureSection`)
- Short Message (`CTASection`)

The contract lives in `src/features/home-content/` (types +
inert GROQ placeholder), following the same pattern as
`church-settings`. Until the Sanity client is configured, these
sections render from `messages/*.json` (`home.welcome.*`,
`home.scripture.*`, `home.cta.*`).

Bilingual fields follow the Bible JSON `field` / `field_en`
convention (e.g. `welcomeTitle` / `welcomeTitle_en`). Rich text
fields use the `RichTextContent` placeholder type
(`src/types/sanity.ts`) until `@portabletext/types` is introduced.
