# Architecture Rules
# Project: Црква Христово Евангелие - Битола

---

# PURPOSE

This document defines the NON-NEGOTIABLE architecture rules for the entire project.

Claude MUST follow these rules strictly.

These rules exist to:

- prevent hallucinations
- prevent overengineering
- maintain deterministic architecture
- maintain predictable code generation
- maintain stable folder structure
- preserve long-term maintainability
- reduce architectural drift
- enforce production-grade consistency

---

# CORE ENGINEERING PRINCIPLES

## ALWAYS

- prefer simplicity over abstraction
- prefer static generation over runtime complexity
- prefer deterministic local data
- prefer composition over inheritance
- prefer reusable UI sections
- prefer server components by default
- prefer strict typing
- prefer predictable folder structure
- prefer readability over cleverness
- prefer low maintenance solutions
- prefer official documentation only

---

## NEVER

- NEVER create unnecessary abstractions
- NEVER introduce enterprise architecture patterns
- NEVER introduce microservices
- NEVER create a custom backend
- NEVER create a custom authentication system
- NEVER introduce Redux
- NEVER introduce Zustand unless explicitly approved
- NEVER create unnecessary API layers
- NEVER create dynamic runtime architecture without approval
- NEVER use experimental unstable libraries
- NEVER use any package without architectural justification
- NEVER bypass TypeScript strict mode
- NEVER disable ESLint rules globally
- NEVER use `any` type unless explicitly approved
- NEVER duplicate business logic
- NEVER place Bible verse data in Sanity
- NEVER use client components unnecessarily
- NEVER fetch static data at runtime if SSG is possible

---

# OFFICIAL APPLICATION ARCHITECTURE

## Architecture Style

Content-driven architecture.

NOT enterprise architecture.

Concretely implemented as a **Hybrid Feature-Based Architecture**:
feature-sliced domain modules (`src/features/<feature>/`) over a shared,
layer-based core (`app/`, `components/`, `lib/`, shared `types/` and `constants/`).

---

# FEATURE ARCHITECTURE RULES

Features: `bible · sermons · books · gallery · church-settings · contact · home-content`.

ALWAYS:

- give each domain ONE home: `src/features/<feature>/`
- place GROQ queries in `features/<feature>/<feature>.queries.ts`
- place feature types in `features/<feature>/<feature>.types.ts`
- read Bible JSON only through `features/bible/bible.data.ts` accessors
- import a feature via its barrel `@/features/<feature>`
- keep each feature `index.ts` server-safe (never re-export Client Component modules)

NEVER:

- place GROQ queries in `lib/`
- place domain/feature logic in `lib/` (infrastructure clients only)
- import `bible-hierarchical.json` directly in a page or component
- duplicate the Bible data-loading/cast pattern across pages
- re-export `bible-search.ts` (or any `"use client"` module) from a feature barrel

`lib/` is for cross-cutting INFRASTRUCTURE only (Sanity read client, Resend,
i18n, SEO, utils). Shared types/constants stay in `src/types` and `src/constants`.

---

# CMS CONTENT LOCALIZATION CONVENTION

Any CMS-backed or future-CMS feature with bilingual fields follows the same
convention as the Bible JSON:

- the base field name (e.g. `welcomeTitle`) holds Macedonian (default)
- an `_en` suffixed field (e.g. `welcomeTitle_en`) holds English

Rich text / Portable Text fields use the `RichTextContent` placeholder type
(`src/types/sanity.ts`) until `@portabletext/types` is introduced — do not
invent a different rich-text shape.

---

# ARCHITECTURE PRIORITY ORDER

1. architecture.rules.md
2. stack-decisions.md
3. coding-standards.md
4. ui-system.md
5. cms-modeling.md
6. existing implementation patterns
7. official documentation

---

# DATA FLOW

## Frontend Content Flow

User Browser
→ Next.js App Router
→ Static HTML / SSG
→ Local JSON OR Sanity CMS

---

# TYPESCRIPT RULES

Claude MUST assume:

{
  "strict": true
}

- NEVER use any
- ALWAYS type route params
- ALWAYS narrow nullable values

---

## Bible Rendering Flow

Static JSON
→ generateStaticParams()
→ Static Site Generation
→ Static HTML pages
→ Fast reading experience

---

## Contact Flow

Contact Form
→ Next.js Route Handler
→ Zod Validation
→ Resend API
→ Preacher Email

FINAL DECISION: Use Server Actions for simplicity and reduced client JS.

---

# BIBLE ARCHITECTURE RULES

# THIS IS THE MOST IMPORTANT ARCHITECTURE RULESET.

---

## OFFICIAL BIBLE STRATEGY

| Concern | Official Solution |
|---|---|
| Bible text | Local JSON |
| Search | Fuse.js |
| Rendering | SSG |
| PDFs | Sanity assets |
| CMS management | Metadata only |
| Verse navigation | Static routes |
| Chapters | Local static data |
| Search index | Generated locally |
| Bible search | Client-side |
| Download PDFs | Sanity |

---

## NON-NEGOTIABLE RULE

Bible verse data MUST live in the codebase.

NOT inside Sanity.

---

## WHY

Because:

- deterministic local data
- zero CMS query instability
- predictable search
- faster builds
- easier debugging
- lower maintenance
- no API dependency for Bible rendering
- better performance
- simpler architecture

---

# BIBLE JSON STRUCTURE

Claude MUST assume:

```txt
/src/data/bible/

contains:

- bible-hierarchical.json
- bible-search-index.json


# HIERARCHICAL STRUCTURE

```json
{
  "books": [
    {
      "id": "matej",
      "name": "Свето Евангелие според Матеј",
      "testament": "NT",
      "chapters": [
        {
          "number": 1,
          "verses": [
            { "number": 1, "text": "Родословието на Исус Христос...", "text_en": "..." }
          ]
        }
      ]
    }
  ]
}

# SEARCH INDEX STRUCTURE

{
  "searchIndex": [
    {
      "id": "matej_1_1",
      "bookId": "matej",
      "bookName": "Свето Евангелие според Матеј",
      "chapter": 1,
      "verse": 1,
      "text": "Родословието на Исус Христос...",
      "fullReference": "Матеј 1:1"
    }
  ],
  "booksMetadata": [
    { "id": "matej", "name": "Свето Евангелие според Матеј", "testament": "NT" }
  ]
}