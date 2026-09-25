---
paths:
  - "src/components/**"
  - "src/styles/**"
  - "src/app/globals.css"
  - "src/app/**/*.tsx"
---

# UI system

## What this project actually uses

Hand-written Tailwind components. **There is no UI component library.**

Verified against the repository: there is no `components.json`, no `@radix-ui/*`
package, and no `class-variance-authority`. `src/components/ui/` contains bespoke
PascalCase components (`Button`, `ContentSection`, `EmptyState`, `FeatureCard`,
`LocaleSwitcher`, `Logo`, `PageHeader`, `SectionContainer`, `ThemeToggle`).

NEVER run `npx shadcn init`, add Radix, add `class-variance-authority`, create a
`components.json`, or rename these files to kebab-case. Earlier revisions of the
project documentation described a shadcn/ui setup that was never implemented; do
not "restore" it.

Composition helper: `cn()` from `src/lib/utils/cn.ts` (`clsx` + `tailwind-merge`).

Components must be reusable, small, readable and accessible.

---

## Styling architecture

Single source of truth: **`src/app/globals.css`**. There is no `variables.css` or
`typography.css` — Tailwind v4's CSS-first config keeps tokens, base styles and
typography in one file. Do not split it without approval.

There is **no `tailwind.config.*`**. Spacing, radius, shadow, transition and
breakpoint scales use Tailwind v4 defaults. Do not introduce a config file or
duplicate these scales as custom tokens without approval.

Color tokens are CSS custom properties, switched by the `.dark` class (applied by
`next-themes` via `attribute="class"`), and exposed to Tailwind via `@theme inline`
so utilities resolve the live variable:

| Token | Utility examples |
| --- | --- |
| `--background` | `bg-background` |
| `--warm-bg` | `bg-warm-bg` |
| `--soft-gold` | `bg-soft-gold`, `border-soft-gold` |
| `--accent-gold` | `text-accent-gold`, `bg-accent-gold` |
| `--text-primary` | `text-text-primary` |
| `--deep-dark` | `text-deep-dark`, `bg-deep-dark` |

Use the tokens, never hardcoded hex. The approved palette is `#FDFDFD` background,
`#F5F1E9` warm background, `#E6D7A3` soft gold, `#C9A227` accent gold, `#2D2D2D`
dark text, `#0F172A` deep dark.

---

## Typography

Playfair Display (headings) + Inter (body) are the approved, reviewed fonts. Do NOT
replace them with Geist, Noto Sans or any other family without approval.

Both load via `next/font/google` with Cyrillic support (`subsets` include
`cyrillic`) so Macedonian text renders correctly. Defined in `src/styles/fonts.ts`,
exposed as `--font-heading` / `--font-body`, consumed via `font-heading` /
`font-body`.

Headings elegant and spacious; body optimized for long-form reading.

---

## Layout primitives

| Component | Purpose |
| --- | --- |
| `src/components/ui/SectionContainer.tsx` | `max-w-7xl` responsive container for full-bleed home page sections |
| `src/components/layout/LayoutShell.tsx` | `max-w-7xl` + vertical padding for standard inner pages |
| `src/components/providers/Providers.tsx` | `NextIntlClientProvider` (outer) wraps `ThemeProvider` (inner) — do not change this order |
| `src/app/[locale]/layout.tsx` | Owns `<html>`/`<body>`, fonts, `Providers`, Header/main/Footer flex column |
| `src/app/layout.tsx` | Minimal passthrough — do not add markup here |

---

## Client islands

When a server-rendered list of links needs active-route highlighting:

- keep the parent (`Navigation.tsx`, `MobileNav.tsx`) on its existing server/client
  boundary
- extract ONLY the active-state check into `src/components/layout/NavLink.tsx`,
  a small client component using `usePathname()`
- do NOT convert an entire server component to a client component just to read the
  current path
- `NavLink` sets `aria-current="page"` on the active link

This client-island pattern is the default for any future case where a server
component needs a small piece of route- or browser-only state.

---

## Theme system

`next-themes` with `attribute="class"`, `defaultTheme="light"`,
`enableSystem={false}`, `disableTransitionOnChange`.

- Binary light/dark toggle ONLY — no "system" option. A single `ThemeToggle`
  button (Sun/Moon icon swap) switches between the two. Do not add a "system"
  option without explicit approval.
- SSR-safe: `ThemeToggle` renders a placeholder until mounted to avoid hydration
  mismatch; `<html>` has `suppressHydrationWarning`.
- Persistence uses `next-themes`' default `localStorage` mechanism — do not add
  custom persistence logic.

Dark mode must stay elegant, with readable typography and soft contrast.

---

## Language switcher

`src/components/ui/LocaleSwitcher.tsx`:

- Client component using `usePathname()` + `useRouter()` to swap the locale segment
  of the current path (`mk` ↔ `en`).
- Rendered as a `role="group"` with `aria-label` from `locale.switchTo`.
- The current locale's button is `disabled` and `aria-pressed="true"`.
- Lives in the header action cluster alongside `ThemeToggle` and `MobileNav`.

---

## Responsive rules

Mobile-first, scaling progressively. Tailwind v4 default breakpoints, no custom
scale:

| Breakpoint | Width | Typical use |
| --- | --- | --- |
| (default) | 0px | Mobile |
| `sm` | 640px | Desktop nav cutover (Navigation shows, MobileNav hides) |
| `md` | 768px | Tablet / small desktop |
| `lg` | 1024px | Desktop |
| `xl` / `2xl` | 1280px / 1536px | Large desktop |

Test small phones, tablets and desktops. Avoid crowded layouts, aggressive
gradients and overly animated UI.

---

## Icons and motion

Icons: **Lucide only** (`lucide-react`). Never mix icon systems.

Animation: subtle transitions only. No large motion systems, no distracting motion.

---

## Bible reading experience

The highest UI priority: long-form readability, excellent typography, clear chapter
navigation, verse anchors, searchable landing page, minimal distractions. Zero
client JavaScript on the reading path.

---

## Review

Responsive behavior · accessibility (semantic HTML, keyboard, contrast, heading
hierarchy) · typography · spacing consistency · color tokens via `@theme inline`
rather than hardcoded hex · binary light/dark theme.
