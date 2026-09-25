# Црква Евангелие Христово — Битола

Content-driven church website, deployed at https://www.hristovoevangelie.org.

The next owner of this repository is the preacher, not an engineer. He must be able
to manage sermons, books, PDFs, gallery images, church settings and contact details
through Sanity, and edit Bible verse text by hand, without developer assistance.
Most rules below exist to keep that true.

Priorities, in order: correctness · stability · predictability · maintainability.

---

# How project instructions load

Global execution policy lives in `~/.claude/CLAUDE.md` and is **not** repeated here.

| Loaded | What |
| --- | --- |
| Every session | this file |
| On demand, by path | `.claude/rules/bible.md` · `cms-sanity.md` · `ui-system.md` |

Precedence, highest first: current instruction → this file → `.claude/rules/*` →
repository evidence (code, config, tests) → official vendor documentation →
assumption.

**Known limitation — Claude Code 2.1.280, upstream issue #95083.** A path-scoped
rule loads only when a matching file is opened with the **Read** tool. Reaching the
same file through Bash (`cat`, `head`, `sed -i`, a heredoc) does **not** load it,
and nothing in the transcript shows that a rule was skipped. Verified by probe on
2026-09-22; nested `CLAUDE.md` files behave the same way. Therefore: when working on
Bible, CMS or UI code via Bash, open the matching `.claude/rules/*.md` explicitly —
and everything that is dangerous to get wrong is duplicated in the Never list below,
which is always resident.

Human documentation, not auto-loaded — read when the task touches it:
`docs/bible-module.md` · `docs/cms-architecture.md` · `docs/operations-runbook.md` ·
`docs/deployment.md` · `docs/backup-restore.md` · `docs/bible-editing-guide.md`

---

# Never

These survive a scoping failure. Violating any of them is a production incident.

## Bible data integrity

- NEVER move Bible verse data into Sanity. Verse text lives in
  `src/data/bible/{mk,en}/<bookId>.json`, committed in this repository.
- NEVER pass verse text through an LLM in either direction — not to translate,
  reword, re-punctuate or "improve" it. Structural changes only.
- NEVER change the order or the ids in `BIBLE_CANON`
  (`src/features/bible/bible.constants.ts`).
- NEVER hand-edit the derived artifacts `src/data/bible/manifest.json` or
  `src/data/bible/search/<locale>.json` — regenerate with `npm run bible:build`.
- NEVER add a `name` field to a book file. Display names exist only in
  `src/features/bible/bible.display-names.ts`.
- NEVER import a Bible JSON file outside `src/features/bible/bible.data.ts`.
  (One deliberate exception exists — see `.claude/rules/bible.md`.)

## Architecture

- NEVER place GROQ queries in `src/lib/`; they belong to the owning feature.
- NEVER re-export a `"use client"` module from a feature `index.ts` barrel.
- NEVER define or copy Sanity schemas outside `church-website/sanity/`.
- NEVER introduce Redux, Zustand, Firebase, a SQL database, a custom backend,
  a custom admin dashboard, or a custom authentication system.
- NEVER refactor the folder structure or change the rendering strategy without
  approval.

## Dependencies and UI

This repository is **not** a shadcn/ui project and never was. See "UI architecture".

- NEVER run `npx shadcn init`, and never add `@radix-ui/*`,
  `class-variance-authority`, or `react-hook-form`. None is installed; none is wanted.
- NEVER rename `src/components/ui/*` to kebab-case — the project uses PascalCase.
- NEVER add any dependency without approval.

Stale references to any of these in git history or superseded files are obsolete —
the code and this file are the source of truth.

---

# Stack

Authoritative versions are in `package.json`; do not restate them elsewhere.
Node 22.x · Next.js 15 App Router · TypeScript strict · Tailwind CSS v4 ·
Sanity · next-intl · next-themes · Zod · Fuse.js · Resend · Vercel.

Deliberate absences, so they are not "fixed" by a future session: no UI component
library, no form library, no state library, no `tailwind.config.*`, no CSS modules.

---

# Architecture invariants

**Hybrid feature-based.** Feature-sliced domain modules under
`src/features/<feature>/` over a shared, layer-based core (`app/` routing,
`components/` UI, `lib/` infrastructure, shared `types/` and `constants/`).

Features: `bible · sermons · books · gallery · church-settings · contact · home-content`

| File | Responsibility |
| --- | --- |
| `<feature>.types.ts` | Domain types |
| `<feature>.queries.ts` | GROQ queries (CMS-backed features only) |
| `<feature>.mappers.ts` | Sanity document → domain object mapping |
| `<feature>.data.ts` | Cached accessors (local JSON readers or CMS fetchers) |
| `<feature>.constants.ts` | Feature constants |
| `<feature>.schema.ts` | Zod schemas specific to the feature |
| `index.ts` | The feature's public API — a server-safe barrel |

- Folder names are kebab-case (`church-settings`); files are prefixed with the
  feature name, so an open editor tab is unambiguous.
- Pages import a feature through its barrel: `import { getBook } from "@/features/bible"`.
- `src/lib/` holds cross-cutting **infrastructure only** — Sanity read client,
  Resend, i18n, SEO, `cn()`. Never domain queries, never feature logic.
- Shared types and constants stay in `src/types` and `src/constants`.
- Only create a `<feature>.data.ts` when there is a real consumer. No stub accessors.
- A new content type is a new self-contained `features/<feature>/` folder, with no
  cross-cutting edits.

**Bilingual field convention.** Any CMS-backed feature with bilingual fields follows
the Bible convention: the base field name holds Macedonian (default), an `_en`
suffix holds English — `welcomeTitle` / `welcomeTitle_en`. Rich text uses the shared
`RichTextContent` type (`src/types/sanity.ts`), backed by `@portabletext/types`
(`PortableTextBlock[]`). Do not invent a different rich-text shape.

---

# Rendering

SSG first. Server Components by default. Client Components only for forms, search,
interactive UI, theme toggle and controlled inputs — and then as small an island as
possible, never by converting a whole parent component.

Do not fetch at runtime what can be generated statically. Avoid unnecessary
`useEffect` / `useState` / API routes.

**Contact flow:** Contact form → **Server Action**
(`src/features/contact/contact.action.ts`) → Zod validation → anti-spam → rate limit
→ Resend → preacher's inbox. Server Actions are the approved transport; do not
reintroduce a route handler for this.

---

# Translation policy

Two locales, Macedonian default, routed as `/mk` and `/en` via next-intl.
Message catalogues: `messages/mk.json`, `messages/en.json` — keys must match.

Translate: UI labels, navigation, buttons, forms, helper text, UI messages,
`aria-label`s, and `generateMetadata()` titles and descriptions.

Never translate: Bible books, Bible verses, sermons, books, uploaded PDFs, or any
preacher-generated content. The Macedonian and English sites read two independent
source Bibles, not translations of one another.

No hardcoded user-facing strings in JSX — everything through `t()` /
`getTranslations()`.

---

# UI architecture

Hand-written Tailwind components. There is no component library.

- `src/components/ui/` — shared primitives, **PascalCase** files
  (`Button.tsx`, `SectionContainer.tsx`, `PageHeader.tsx`, …), composed with the
  `cn()` helper (`src/lib/utils/cn.ts` = `clsx` + `tailwind-merge`).
- Icons: **Lucide only** (`lucide-react`). Never mix icon systems.
- Styling: Tailwind v4 CSS-first. Single source of truth is `src/app/globals.css`.
- Mobile-first, Tailwind default breakpoints, no custom scale.
- Design language: peaceful, warm, elegant, typography-focused, minimal.
  Playfair Display (headings) + Inter (body), both with Cyrillic subsets.

Details, tokens and confirmed patterns: `.claude/rules/ui-system.md`.

---

# Accessibility

Semantic HTML · correct heading hierarchy · keyboard navigable · readable contrast ·
screen-reader support · `aria-current="page"` on the active nav link.

---

# Security

Validate every external input with Zod. Rate-limit the contact form. Secrets only in
environment variables, never in a Client Component. Never expose a Sanity write or
management token — the website uses a read client only.

---

# Verification

Prefer the narrowest check that proves the change.

```
npm run typecheck       # tsc --noEmit
npm run lint
npm test                # node --test
npm run bible:validate  # Bible data integrity (read-only)
npm run bible:build     # regenerates manifest + search indexes (writes files)
npm run build           # runs bible:build via prebuild — writes artifacts
```

`npm run build` regenerates derived Bible artifacts. Do not run it as a casual check
when the working tree must stay clean.

CI: `.github/workflows/bible-guard.yml` runs Bible validation on every PR and push
to `main`; `.github/workflows/monthly-health-check.yml` runs the scheduled health
check.

---

# Official documentation

- Next.js — https://nextjs.org/docs
- Sanity JS client — https://www.sanity.io/docs/js-client
- Sanity asset API — https://www.sanity.io/docs/http-reference/assets
- Tailwind v4 — https://tailwindcss.com/docs
- Fuse.js — https://www.fusejs.io/
- next-intl — https://next-intl.dev/docs

Never invent API behavior or rely on unofficial sources.
