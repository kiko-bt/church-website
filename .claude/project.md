# Bible Local Data Rules

Location:

```txt
src/data/bible/
```

Required files:

```txt
src/data/bible/
├── bible-hierarchical.json
├── bible-search-index.json
```

Purpose:

- bible-hierarchical.json
  → used for rendering books, chapters, and verses

- bible-search-index.json
  → optimized Fuse.js search index for client-side searching

These files are:

- generated offline via parsing scripts
- committed into the repository
- statically imported by the application
- NOT fetched from Sanity
- NOT fetched from APIs at runtime

This guarantees:

- deterministic rendering
- predictable search behavior
- zero runtime CMS dependency
- stable SSG generation
- lower architectural complexity

---

# Official App Routes

ALL routes use locale prefixes:

```txt
/mk
/en
```

Examples:

```txt
/mk/bible
/en/bible
```

---

## Route Structure

| Route | Description |
|---|---|
| /[locale] | Homepage |
| /[locale]/about | About page |
| /[locale]/bible | Bible landing page |
| /[locale]/bible/[bookSlug] | Bible book page |
| /[locale]/bible/[bookSlug]/[chapter] | Bible chapter page |
| /[locale]/books | Downloadable PDF books |
| /[locale]/books/[slug] | Single book page |
| /[locale]/sermons | Sermons page |
| /[locale]/sermons/[slug] | Single sermon page |
| /[locale]/gallery | Gallery page |
| /[locale]/contact | Contact page |
| /[locale]/privacy | Privacy page |

---

# Official Folder Structure

```txt
.
├── .claude/
│
├── public/
│
├── messages/
│   ├── en.json
│   └── mk.json
│
├── sanity/
│   ├── schemas/
│   ├── sanity.config.ts
│   └── sanity.client.ts
│
├── src/
│   ├── app/
│   │   └── [locale]/
│   │       ├── page.tsx
│   │       ├── about/
│   │       ├── bible/
│   │       ├── books/
│   │       ├── sermons/
│   │       ├── gallery/
│   │       ├── contact/
│   │       └── privacy/
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── bible/
│   │   ├── books/
│   │   ├── sermons/
│   │   ├── gallery/
│   │   └── contact/
│   │
│   ├── features/
│   │   ├── bible/
│   │   ├── books/
│   │   ├── sermons/
│   │   ├── gallery/
│   │   └── contact/
│   │
│   ├── data/
│   │   └── bible/
│   │       ├── bible-hierarchical.json
│   │       └── bible-search-index.json
│   │
│   ├── lib/
│   │   ├── sanity/
│   │   ├── resend/
│   │   ├── validations/
│   │   ├── i18n/
│   │   ├── search/
│   │   └── utils/
│   │
│   ├── types/
│   ├── constants/
│   └── styles/
│
├── package.json
├── tsconfig.json
├── next.config.ts
├── middleware.ts
└── eslint.config.mjs
```

---

# Folder Structure Rules

ALWAYS:

- maintain deterministic folder structure
- colocate related logic
- keep Bible logic isolated
- keep CMS logic isolated
- keep translation files isolated
- separate UI from features
- separate data from rendering

NEVER:

- place Bible verse JSON inside Sanity
- duplicate feature logic
- place business logic inside UI components
- create random utility folders
- introduce architecture drift