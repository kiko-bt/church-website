---
paths:
  - "sanity/**"
  - "src/lib/sanity/**"
  - "src/features/sermons/**"
  - "src/features/books/**"
  - "src/features/gallery/**"
  - "src/features/church-settings/**"
  - "src/features/home-content/**"
  - "src/components/portable-text/**"
  - "src/app/api/revalidate/**"
---

# CMS / Sanity rules

Sanity is the official CMS and the preacher's only admin surface. There is no
custom dashboard and never will be. Architecture detail lives in
`docs/cms-architecture.md`.

---

## Responsibility boundary

Sanity manages: sermons · books · PDFs · gallery images · church settings ·
social links · metadata · homepage content (Welcome Text, Main Verse, Short Message).

Sanity does **not** manage: Bible verse data · Bible chapters · searchable verse
content. Those live in local JSON — see `.claude/rules/bible.md`. Sanity stores
Bible PDFs and metadata only.

---

## The Studio is a separate application

The Sanity Studio is a **standalone sibling app** (`../studio-church-ehb/`), kept
out of the website so the site ships no Studio dependencies and the CMS deploys
independently.

The content model lives ONLY in this repository, under `sanity/`:

- `sanity/schemas/**` — objects, singletons, documents
- `sanity/structure.ts` — desk structure (pins singletons)
- `sanity/defineStudioConfig.ts` — shared config factory: schema, structure,
  singleton templates filter, document actions

Both `sanity/sanity.config.ts` (website side) and the standalone Studio's
`sanity.config.ts` consume `defineStudioConfig()`.

ALWAYS:

- add or modify schemas, structure and singleton rules ONLY under
  `church-website/sanity/`
- extend `defineStudioConfig()` for new Studio configuration

NEVER:

- define or copy schemas inside `studio-church-ehb/`
- create a parallel Studio config — there is exactly one factory

---

## Feature pipeline

Every CMS-backed feature follows the same shape. Do not invent a different one.

```
Sanity document
  → <feature>.queries.ts   GROQ (lives in the feature, NEVER in lib/)
  → <feature>.mappers.ts   document → domain object
  → <feature>.types.ts     domain types
  → <feature>.data.ts      cached accessor
  → Server Component
```

- `src/lib/sanity/client.ts` is a **read client only**. Never add a write or
  management token to the website.
- `src/lib/sanity/tags.ts` holds the cache tags; the revalidate route handler
  (`src/app/api/revalidate/`) is the only runtime CMS surface.
- GROQ queries belong to the owning feature, never to `src/lib/`.
- Query exactly the fields the view needs — do not fetch whole documents.

---

## Localization

Bilingual fields follow the Bible convention: the base field name holds Macedonian
(default), an `_en` suffix holds English — `welcomeTitle` / `welcomeTitle_en`.

Rich text is Portable Text. Use the shared `RichTextContent` type
(`src/types/sanity.ts`), backed by `@portabletext/types` (`PortableTextBlock[]`),
rendered by `PortableTextRenderer`. Do not invent a different rich-text shape.

---

## Homepage content

Sanity manages a `homeContent` singleton for preacher-editable homepage copy,
covering three sections: Welcome Text (`WelcomeSection`), Main Verse
(`ScriptureSection`), Short Message (`CTASection`).

Implemented in `src/features/home-content/`, following the same pattern as
`church-settings`. When the Sanity client is not configured, these sections fall
back to `messages/*.json` (`home.welcome.*`, `home.scripture.*`, `home.cta.*`).
Preserve that fallback — it is what keeps the site rendering without CMS access.

---

## Editing experience

The preacher is the editor. CMS UX must stay preacher-friendly, simple, clean and
logically grouped.

ALWAYS: use helper text · use validation rules · minimize unnecessary fields ·
keep the editing experience simple.

Reviewing CMS work: verify preacher-friendly UX, validation rules, minimal fields,
and helper text.
