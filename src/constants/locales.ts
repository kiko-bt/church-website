export const locales = ["mk", "en"] as const;
export const defaultLocale = "mk" as const;

export type Locale = (typeof locales)[number];

// Single source of truth for the site's time zone. Used by both the server
// request config and the client provider so date/time formatting is
// deterministic and identical across SSG and the client (no hydration
// mismatch, no next-intl `ENVIRONMENT_FALLBACK` diagnostic). The church is in
// Bitola, North Macedonia.
export const timeZone = "Europe/Skopje" as const;
