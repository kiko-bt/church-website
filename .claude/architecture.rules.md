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