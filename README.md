# Црква Христово Евангелие - Битола

Official website for the Church of the Gospel of Christ, Bitola, North Macedonia.

---

## What This Project Does

A content-driven church website where a non-technical administrator (preacher) manages all content through **Sanity CMS** — sermons, books, gallery images, and church settings — without touching code.

Key modules:

| Module | Data Source | Rendering |
|---|---|---|
| Bible (text) | Local JSON | SSG |
| Bible (PDFs) | Sanity | SSG |
| Sermons | Sanity | SSG |
| Books / PDFs | Sanity | SSG |
| Gallery | Sanity | SSG |
| Contact form | Server Action + Resend | — |
| Church settings | Sanity | SSG |

---

## Tech Stack

| Area | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui |
| CMS | Sanity |
| i18n | next-intl (mk / en) |
| Theme | next-themes |
| Search | Fuse.js (client-side) |
| Forms | React Hook Form + Zod |
| Email | Resend |
| Fonts | Playfair Display + Inter |
| Hosting | Vercel |

---

## Prerequisites

- **Node.js** 22 LTS
- **npm** 10.9.2

---

## Installation

### 1. Clone and install base dependencies

```bash
git clone <repo-url>
cd church-website
npm install
```

### 2. Install required packages

The foundation is scaffolded. These packages must be installed before running the app:

```bash
npm install next-intl next-themes @sanity/client resend fuse.js react-hook-form @hookform/resolvers lucide-react clsx tailwind-merge class-variance-authority @vercel/analytics
npm install -D prettier
```

### 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=...
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=...
RESEND_API_KEY=...
RESEND_FROM_EMAIL=noreply@your-domain.com
RESEND_TO_EMAIL=preacher@your-domain.com
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### 4. Activate next-intl

After installing next-intl:

1. Uncomment `middleware.ts` (replace pass-through with `createMiddleware`)
2. Uncomment `src/lib/i18n/request.ts` (activate `getRequestConfig`)
3. Uncomment `next.config.ts` (activate `withNextIntl`)
4. Uncomment `NextIntlClientProvider` in `src/app/[locale]/layout.tsx`

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you will be redirected to `/mk` (default locale).

---

## Project Structure

```
.
├── .claude/                  # AI workflow rules (do not modify)
├── messages/
│   ├── mk.json               # Macedonian UI translations
│   └── en.json               # English UI translations
├── public/                   # Static assets
├── sanity/
│   ├── schemas/              # Sanity content schemas (add per feature)
│   ├── sanity.config.ts      # Sanity Studio config (stub)
│   └── sanity.client.ts      # Re-export of Sanity client
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Root layout (minimal — [locale] provides html/body)
│   │   ├── page.tsx          # Redirects / → /mk
│   │   └── [locale]/
│   │       ├── layout.tsx    # Locale layout: html, fonts, Header, Footer
│   │       ├── page.tsx      # Homepage
│   │       ├── about/
│   │       ├── bible/
│   │       │   ├── [bookSlug]/
│   │       │   │   └── [chapter]/
│   │       ├── books/
│   │       │   └── [slug]/
│   │       ├── sermons/
│   │       │   └── [slug]/
│   │       ├── gallery/
│   │       ├── contact/
│   │       └── privacy/
│   ├── components/
│   │   ├── layout/           # Header, Footer, Navigation, LayoutShell
│   │   ├── ui/               # shadcn/ui components (add via npx shadcn@latest add)
│   │   ├── bible/
│   │   ├── sermons/
│   │   ├── books/
│   │   ├── gallery/
│   │   └── contact/
│   ├── features/             # Feature-level business logic (bible, sermons, etc.)
│   ├── lib/
│   │   ├── i18n/request.ts   # next-intl server config
│   │   ├── sanity/           # Sanity client + GROQ queries
│   │   ├── resend/           # Email service
│   │   ├── search/           # Fuse.js Bible search
│   │   ├── seo/              # Metadata generation helpers
│   │   ├── utils/cn.ts       # Tailwind class merging utility
│   │   └── validations/      # Zod schemas
│   ├── data/
│   │   └── bible/
│   │       ├── bible-hierarchical.json    # Bible text (books → chapters → verses)
│   │       └── bible-search-index.json   # Fuse.js search index
│   ├── types/                # Shared TypeScript interfaces
│   ├── constants/            # Locales, routes, site config, Bible constants
│   └── styles/fonts.ts       # Google Fonts configuration
├── middleware.ts              # Locale routing (next-intl)
├── next.config.ts
├── .env.example
└── .prettierrc
```

---

## Bible Architecture

Bible verse data lives **in the codebase as JSON** — never in Sanity.

```
src/data/bible/
├── bible-hierarchical.json   # Full Bible: books → chapters → verses (mk + en)
└── bible-search-index.json   # Flat search index for Fuse.js
```

Both files are generated offline from a parsing script and committed to the repository. The app reads them statically at build time via `generateStaticParams()`.

---

## Adding shadcn/ui Components

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
```

Components are copied into `src/components/ui/`.

---

## Locales

| Code | Language | Route |
|---|---|---|
| `mk` | Macedonian (default) | `/mk/...` |
| `en` | English | `/en/...` |

Translation files: `messages/mk.json`, `messages/en.json`

Only UI labels are translated. Sermon content and Bible books are NOT translated.

---

## Useful Commands

```bash
npm run dev       # Development server
npm run build     # Production build
npm run start     # Production server
npm run lint      # ESLint
```

---

## Deployment

Deployed on **Vercel**. Set all environment variables from `.env.example` in the Vercel dashboard before deploying.
