# CLAUDE.md

# Project Overview

Project Name:
Црква Евангелие Христово - Битола

Project Type:
Content-driven church website.

Primary Goal:
Build a stable, modern, responsive, low-maintenance church website where a non-technical preacher can easily manage sermons, books, PDFs, gallery images, church settings, and contact information without developer assistance.

This project is:

- production-grade
- CMS-first
- mobile-first
- content-driven
- low-maintenance
- AI-assisted
- performance-oriented
- deterministic
- SEO-friendly

---

# Official Tech Stack

| Area                 | Technology                   |
| -------------------- | ---------------------------- |
| Runtime              | Node.js 22 LTS               |
| Package Manager      | npm 10.9.2                   |
| Framework            | Next.js 15 App Router        |
| Language             | TypeScript Strict            |
| Styling              | Tailwind CSS                 |
| UI Components        | shadcn/ui                    |
| CMS                  | Sanity                       |
| Forms                | React Hook Form              |
| Validation           | Zod                          |
| Email Service        | Resend                       |
| Internationalization | next-intl                    |
| Theme System         | next-themes                  |
| Search               | Fuse.js                      |
| Analytics            | Vercel Analytics             |
| Hosting              | Vercel                       |
| Rendering Strategy   | Static Site Generation (SSG) |
| Architecture Style   | Content-driven               |
| AI Workflow          | Claude-driven                |

---

# Core Engineering Principles

ALWAYS:

- follow deterministic architecture
- prefer simplicity over abstraction
- prioritize maintainability
- prioritize readability
- prioritize predictable rendering
- prefer static generation
- prefer reusable components
- use strict typing
- use production-safe patterns
- keep architecture stable
- follow CMS-first thinking
- optimize for long-term maintenance

NEVER:

- invent architecture
- invent APIs
- invent package behavior
- add new libraries without approval
- create unnecessary abstractions
- introduce backend complexity
- introduce microservices
- use Redux
- use Firebase
- use SQL databases
- create custom admin dashboards
- create custom authentication systems
- refactor architecture without approval

---

# AI Execution Modes

## SAFE MODE

- Never change architecture without approval.
- Never install additional libraries without approval.
- Never refactor folder structures without approval.
- Never modify rendering strategy without approval.

## ZERO-HALLUCINATION MODE

- Use official documentation only.
- Validate imports before implementation.
- Never assume package behavior.
- Never invent unsupported APIs.
- Follow existing architecture patterns only.

## STRICT IMPLEMENTATION MODE

- Follow exact folder structure.
- Follow exact naming conventions.
- Follow exact rendering strategy.
- Follow exact stack decisions.
- No spontaneous abstractions.
- No hidden architecture decisions.

## SELF-REVIEW MODE

After every implementation:

- review TypeScript correctness
- review accessibility
- review responsiveness
- review architecture consistency
- review translations
- review server/client boundaries
- review rendering strategy
- review CMS consistency

---

# Official Architecture Rules

## Rendering Strategy

Preferred rendering:

- SSG first
- static rendering first
- avoid unnecessary dynamic rendering

Use:

- generateStaticParams()
- static pages
- server components by default

Avoid:

- unnecessary runtime APIs
- unnecessary client components
- unnecessary useEffect
- unnecessary useState

---

# Next.js Rules

Use:

- App Router only
- Server Components by default
- Client Components only when necessary

Never:

- use Pages Router
- overuse "use client"
- create unnecessary API routes
- fetch client-side when static rendering is possible

---

# TypeScript Rules

TypeScript strict mode is REQUIRED.

Always:

- prefer explicit typing
- use typed route params
- use typed CMS queries
- validate external input with Zod
- use readonly where appropriate

Never:

- use any
- disable strict mode
- bypass type safety
- ignore TypeScript errors

---

# Tailwind & UI Rules

Use:

- Tailwind CSS only
- shadcn/ui only
- semantic layouts
- responsive-first design
- accessible components
- typography consistency

Avoid:

- random CSS systems
- inline styles unless necessary
- duplicated component patterns
- inconsistent spacing systems

---

# UI Component Rules

## shadcn/ui Justification

The project uses **shadcn/ui** as the sole UI component library.

Why shadcn/ui:

- Built on Radix UI – accessible, unstyled primitives
- Tailwind CSS integration – matches our styling system
- Copy-paste nature – no npm package lock-in, full control
- Server Component compatible – works with Next.js 15 App Router
- Lightweight – only components we actually use
- No global state – avoids unnecessary complexity
- Production-grade – used in thousands of production sites

Claude MUST:

- Use shadcn/ui components (Button, Card, Dialog, etc.)
- Never introduce alternative UI libraries
- Copy component source code into `src/components/ui/` as per shadcn/cli
- Style components only via Tailwind classes or shadcn theming variables

---

# Translation Rules

Translate ONLY:

- UI labels
- navigation
- buttons
- forms
- helper text
- UI messages

DO NOT translate:

- Bible books
- Bible verses
- uploaded PDFs
- sermons content
- books content
- preacher-generated content

Languages:

- Macedonian (default)
- English

Routing structure:

- /mk
- /en

Use:

- next-intl

---

# Bible System (CRITICAL)

The Bible module is the most important module in the project.

## Official Bible Architecture

Bible verse data lives in the codebase.

PDFs and metadata live in Sanity.

This rule is STRICT and MUST NEVER be violated.

---

# Bible Data Rules

Bible content is stored locally as structured JSON — one file per book, per
locale. Book display names are NOT in these files; they live in
`src/features/bible/bible.display-names.ts`.

```txt
src/data/bible/
├── mk/<bookId>.json        hand-owned: Macedonian verse text
├── en/<bookId>.json        hand-owned: English verse text
├── manifest.json           derived — routing shape, no verse text
└── search/<locale>.json    derived — Fuse.js index, one entry per verse
```

The derived files are regenerated by `npm run bible:build`. Never hand-edit them.

---

# Bible Search Rules

Use:

- Fuse.js
- client-side search
- generated local search indexes

Never use:

- Algolia
- Elasticsearch
- database search
- vector databases

---

# Bible Rendering Rules

Bible pages MUST use:

- SSG
- generateStaticParams()

Bible rendering flow:
Local JSON
→ generateStaticParams()
→ static routes
→ static HTML
→ fast reading experience

---

# Bible CMS Rules

Sanity MUST NEVER store:

- verse-level content
- Bible chapters
- searchable verses

Sanity ONLY stores:

- PDF assets
- metadata
- descriptions
- download links

---

# CMS Rules

Sanity is the official CMS and admin dashboard.

CMS UX MUST be:

- preacher-friendly
- simple
- clean
- grouped logically
- easy to maintain

Always:

- use helper text
- use validation rules
- minimize unnecessary fields
- keep editing experience simple

---

# Search Rules

Search strategy:

- client-side Fuse.js

Search targets:

- Bible verses
- Bible books
- local JSON indexes

Avoid:

- external search engines
- complex indexing systems
- unnecessary backend search services

---

# Security Rules

Always:

- validate forms with Zod
- sanitize user input
- use environment variables
- use HTTPS via Vercel
- protect secrets
- use rate limiting for contact forms

Never:

- expose secrets in client components
- hardcode credentials
- trust unvalidated user input

---

# Performance Rules

Prioritize:

- static rendering
- lazy loading
- minimal JavaScript bundles
- image optimization
- fast Lighthouse scores
- mobile performance

Avoid:

- unnecessary dependencies
- large client bundles
- unnecessary hydration
- unnecessary runtime fetches

---

# Folder Structure Authority

The official project structure is:

src/
├── app/
├── components/
├── features/
├── lib/
├── data/
├── types/
├── constants/
└── styles/

This structure MUST remain stable.

---

# Official Design Direction

Design style:

- peaceful
- elegant
- warm
- spiritual
- minimal
- modern
- typography-focused

Colors:

- #FDFDFD
- #F5F1E9
- #E6D7A3
- #C9A227
- #2D2D2D
- #0F172A

Fonts:

- Playfair Display (headings)
- Inter (body)

---

# Accessibility Rules

Always:

- use semantic HTML
- maintain keyboard accessibility
- maintain readable contrast
- support screen readers
- maintain proper heading hierarchy

---

# Deployment Rules

Hosting:

- Vercel

CMS:

- Sanity

Environment:

- production-safe
- HTTPS only

---

# Final Engineering Rule

This project prioritizes:

- correctness over speed
- stability over complexity
- predictability over abstraction
- maintainability over cleverness

All implementations MUST follow:

- official architecture
- official stack
- official rendering strategy
- official CMS boundaries
- official TypeScript rules
- official translation rules

---

# Source of Truth Rule

If implementation uncertainty exists:

1. architecture.rules.md overrides all implementation decisions
2. official documentation overrides assumptions
3. existing architecture overrides new abstractions

No architectural deviations without approval.

---

# Official Documentation References

The following are the primary sources of truth for this project. Claude MUST reference these official resources when implementing features.

- Fuse.js: https://www.fusejs.io/
- Next.js SSG: https://nextjs.org/docs/pages/building-your-application/rendering/static-site-generation
- Sanity Asset API: https://www.sanity.io/docs/http-reference/assets
- Sanity JS Client: https://www.sanity.io/docs/js-client
- Tailwind CSS (v4): https://tailwindcss.com/docs

Claude MUST NOT invent API behavior or rely on outdated unofficial sources.

---

# Supporting Project Documentation

Additional project guidance, standards, and constraints are defined in:

- .claude/architecture.rules.md
- .claude/project.md
- .claude/coding-standards.md
- .claude/cms-modeling.md
- .claude/ui-system.md
- .claude/stack-decisions.md
- .claude/security-rules.md
- .claude/review-checklist.md
- .claude/bible-module.md

When implementing features, review all applicable project documentation before making architectural, UI, CMS, security, or code-generation decisions.

The Bible module has additional binding rules in `.claude/bible-module.md`
(its four sources of truth, the fixed book names and order, the data-access
boundary, and build-time validation requirements). Review it before touching
anything under `src/features/bible/`, `src/data/bible/`, or the Bible routes.
