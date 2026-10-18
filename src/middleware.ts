import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "@/constants/locales";

// Locale routing. Lives in src/ — with a src/app directory, Next.js only picks
// up src/middleware.ts (a root middleware.ts is silently ignored).
//
// Every page URL starts with a locale; a path without one is redirected to the
// default locale (`/nope/bible` → `/mk/nope/bible`, a real 404). The options
// below keep the site's existing behavior:
// - localeDetection: false — `/` always opens Macedonian, never guessed from
//   the browser language.
// - localeCookie: false — the site sets no cookies.
// - alternateLinks: false — hreflang links come from page metadata
//   (src/lib/seo/metadata.ts), not a duplicate `Link` header.
export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
  localeDetection: false,
  localeCookie: false,
  alternateLinks: false,
});

// Skips the API, Next/Vercel internals, the PDF proxy (`/pdf/<hash>.pdf`,
// rewritten in next.config.ts) and any path whose LAST segment looks like a
// file (`/robots.txt`, `/icon.png`). A dot elsewhere — `/foo.pdf/bible` — still
// passes through, so it cannot reach the [locale] layout as a fake locale.
export const config = {
  matcher: ["/((?!api|_next|_vercel|pdf/)(?!.*\\.[^/]*$).*)"],
};
