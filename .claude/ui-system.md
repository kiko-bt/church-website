---

# `.claude/ui-system.md`

```md
# UI System
# Project: Црква Евангелие Христово - Битола

---

# DESIGN PRINCIPLES

Design must feel:

- peaceful
- warm
- elegant
- spiritual
- modern
- clean
- typography-focused

---

# DESIGN GOALS

Prioritize:

- readability
- calm visual hierarchy
- long-form reading comfort
- responsive layouts
- accessibility

---

# COLOR SYSTEM

Official palette:

| Color           | Value   |
| --------------- | ------- |
| Background      | #FDFDFD |
| Warm Background | #F5F1E9 |
| Soft Gold       | #E6D7A3 |
| Accent Gold     | #C9A227 |
| Dark Text       | #2D2D2D |
| Deep Dark       | #0F172A |

---

# STYLING ARCHITECTURE (CONFIRMED)

Single source of truth: `src/app/globals.css` (no separate
`variables.css` / `typography.css` — Tailwind v4's CSS-first config
keeps tokens, base styles, and typography in one file). Do not split
this file without approval.

Color tokens are CSS custom properties, switched by the `.dark` class
(applied by `next-themes` via `attribute="class"`), and exposed to
Tailwind via `@theme inline` so utilities resolve the live variable:

| Token            | Utility examples                     |
| ---------------- | ------------------------------------ |
| `--background`   | `bg-background`                      |
| `--warm-bg`      | `bg-warm-bg`                         |
| `--soft-gold`    | `bg-soft-gold`, `border-soft-gold`   |
| `--accent-gold`  | `text-accent-gold`, `bg-accent-gold` |
| `--text-primary` | `text-text-primary`                  |
| `--deep-dark`    | `text-deep-dark`, `bg-deep-dark`     |

Spacing, radius, shadow, transition, and breakpoint scales use Tailwind
v4 defaults — no `tailwind.config.*` file. Do not introduce one or
duplicate these scales as custom tokens without approval.

---

# TYPOGRAPHY

| Usage    | Font             |
| -------- | ---------------- |
| Headings | Playfair Display |
| Body     | Inter            |

---

# TYPOGRAPHY RULES

Headings:

- elegant
- spacious
- readable

Body:

- readable for long Bible chapters
- optimized line-height
- optimized spacing

---

# TYPOGRAPHY IMPLEMENTATION (CONFIRMED)

- Playfair Display (headings) + Inter (body) are the approved, reviewed
  fonts — do NOT replace with Geist, Noto Sans, or any other family
  without approval.
- Both fonts load via `next/font/google` with Cyrillic support
  (`subsets` include `cyrillic`) so Macedonian text renders correctly.
- Exposed as `--font-heading` / `--font-body` CSS variables, consumed via
  Tailwind utilities (`font-heading`, `font-body`).

---

# LAYOUT RULES

Use:

- responsive containers
- balanced whitespace
- predictable spacing
- consistent sections

Avoid:

- crowded layouts
- overly animated UI
- aggressive gradients

---

# COMPONENT PRINCIPLES

Components MUST:

- be reusable
- remain small
- remain readable
- follow accessibility rules

---

# MOBILE-FIRST RULE

All UI MUST:

- start mobile-first
- scale progressively

Test:

- small phones
- tablets
- desktops

Use Tailwind v4 default breakpoints — no custom breakpoint scale:

| Breakpoint   | Width           | Typical use                                             |
| ------------ | --------------- | ------------------------------------------------------- |
| (default)    | 0px             | Mobile                                                  |
| `sm`         | 640px           | Desktop nav cutover (Navigation shows, MobileNav hides) |
| `md`         | 768px           | Tablet / small desktop                                  |
| `lg`         | 1024px          | Desktop                                                 |
| `xl` / `2xl` | 1280px / 1536px | Large desktop                                           |

---

# BIBLE READING EXPERIENCE

The Bible module is the highest UI priority.

Requirements:

- long-form readability
- excellent typography
- clear chapter navigation
- verse anchors
- searchable experience
- minimal distractions

---

# BUTTON SYSTEM

Buttons MUST:

- use consistent sizing
- use consistent spacing
- maintain contrast accessibility

---

# DARK MODE / THEME SYSTEM (CONFIRMED)

Use:

- next-themes

Implementation:

- `ThemeProvider` with `attribute="class"`, `defaultTheme="light"`,
  `enableSystem={false}`, `disableTransitionOnChange`.
- Binary light/dark toggle ONLY — no "system" theme option. A single
  `ThemeToggle` button (Sun/Moon icon swap) switches between the two.
- SSR-safe: `ThemeToggle` renders a placeholder until mounted to avoid
  hydration mismatch; `<html>` has `suppressHydrationWarning`.
- Persistence uses `next-themes`' default `localStorage` mechanism — do
  not add custom persistence logic.

Requirements:

- persistent theme
- elegant dark mode
- readable typography
- soft contrast

Do not add a "system" theme option without explicit approval.

---

# LANGUAGE SWITCHER (CONFIRMED)

`src/components/ui/LocaleSwitcher.tsx`:

- Client component using `usePathname()` + `useRouter()` to swap the
  locale segment of the current path (`mk` ↔ `en`).
- Rendered as a `role="group"` with `aria-label` from `locale.switchTo`.
- The current locale's button is `disabled` and `aria-pressed="true"`.
- Lives in the header action cluster alongside `ThemeToggle` and
  `MobileNav`.

---

# ICON RULES

Use:

- Lucide icons only

Avoid:

- mixed icon systems

---

# ANIMATION RULES

Use:

- subtle transitions only

Avoid:

- excessive animations
- distracting motion
- large motion systems

---

# ACCESSIBILITY RULES

UI MUST:

- support keyboard navigation
- maintain readable contrast
- support screen readers
- use semantic structure

---

# FINAL RULE

The UI system MUST remain:

- elegant
- readable
- calm
- stable
- maintainable
- spiritually appropriate
