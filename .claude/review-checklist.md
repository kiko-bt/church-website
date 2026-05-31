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

---

# UI REVIEW

Check:
- responsive behavior
- accessibility
- typography
- spacing consistency

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