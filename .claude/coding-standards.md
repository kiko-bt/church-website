# Coding Standards
# Project: Црква Христово Евангелие - Битола

---

# PURPOSE

This document defines the official coding standards for the project.

All generated code MUST follow these standards.

Goals:
- readability
- predictability
- maintainability
- strict typing
- low hallucination risk
- production-grade consistency

---

# GENERAL PRINCIPLES

ALWAYS:
- write explicit code
- prefer readability over cleverness
- prefer deterministic logic
- keep functions small
- keep components focused
- avoid deep nesting
- use stable naming conventions
- follow existing patterns

NEVER:
- introduce unnecessary abstractions
- create giant utility files
- create god components
- duplicate business logic
- bypass TypeScript safety
- suppress lint errors globally

---

# TYPESCRIPT RULES

TypeScript strict mode is REQUIRED.

ALWAYS:
- use explicit types
- type component props
- type route params
- type CMS responses
- validate external data
- use readonly when appropriate
- use union types where beneficial

NEVER:
- use any
- disable strict mode
- ignore TypeScript errors
- cast blindly
- use unknown without narrowing

---

# COMPONENT RULES

Use:
- Server Components by default
- Client Components only when necessary

Client Components are allowed ONLY for:
- forms
- search
- interactive UI
- theme toggles
- controlled inputs

---

# COMPONENT STRUCTURE

Preferred structure:

```tsx
type ComponentProps = {
  title: string;
};

export function Component({ title }: ComponentProps) {
  return (
    <section>
      <h2>{title}</h2>
    </section>
  );
}
```

---

# FEATURE FILE NAMING

Feature code lives in `src/features/<feature>/` and follows fixed names so
locations are predictable for both developers and Claude Code:

| Pattern | Purpose |
|---|---|
| `<feature>.types.ts` | Domain types |
| `<feature>.queries.ts` | GROQ queries (CMS-backed features) |
| `<feature>.data.ts` | Data access / accessors |
| `<feature>.constants.ts` | Feature constants |
| `<feature>.schema.ts` | Zod schema (feature-specific validation) |
| `index.ts` | Server-safe public barrel |

Conventions:

- Feature folder names are kebab-case (`church-settings`).
- Files are prefixed with the feature name (`sermons.queries.ts`), so an open
  editor tab is unambiguous.
- Import features through the barrel: `import { getBook } from "@/features/bible";`
- GROQ queries belong to the feature, never to `lib/`.
- A feature `index.ts` MUST NOT re-export Client Component modules; import those
  (e.g. `@/features/bible/bible-search`) directly in the client component.
- Only create a `<feature>.data.ts` when there is a real consumer (local JSON to
  read or a configured CMS client) — do not add empty stub accessors.