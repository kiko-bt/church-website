# Review Checklist
# Project: Црква Христово Евангелие - Битола

---

# BEFORE IMPLEMENTATION

Verify:
- architecture consistency
- rendering strategy
- folder placement
- server/client boundaries

---

# TYPESCRIPT REVIEW

Check:
- strict typing
- no any
- typed props
- typed route params

---

# NEXT.JS REVIEW

Check:
- App Router usage
- Server Components default
- static rendering strategy
- generateStaticParams()
- active-state nav links use the `NavLink` client island
  (`src/components/layout/NavLink.tsx`), not a full server-to-client
  conversion of the parent component

---

# TRANSLATION REVIEW

Check:
- no hardcoded strings in JSX, `aria-label`s, or `generateMetadata()`
  titles/descriptions — everything via `t()` / `getTranslations()`
- `messages/mk.json` and `messages/en.json` have matching keys
- only UI text is translated (Bible verses, sermons, books, PDFs stay
  untranslated)

---

# UI REVIEW

Check:
- responsive behavior (mobile-first, Tailwind default breakpoints)
- accessibility
- typography (Playfair Display + Inter, with Cyrillic support)
- spacing consistency
- color tokens used via `@theme inline` CSS variables, not hardcoded hex
- dark mode (binary light/dark via next-themes, no "system" option)

---

# BIBLE REVIEW

Verify:
- local JSON usage
- Fuse.js usage
- SSG rendering
- no Bible data in Sanity

---

# CMS REVIEW

Verify:
- preacher-friendly UX
- validation rules
- minimal fields
- helper text

---

# PERFORMANCE REVIEW

Check:
- minimal hydration
- optimized images
- static rendering
- lazy loading

---

# SECURITY REVIEW

Verify:
- Zod validation
- protected secrets
- sanitized inputs
- environment variable usage

---

# FINAL REVIEW

Before commit:
- npm run lint
- TypeScript passes
- build passes
- no architecture violations