export const locales = ["mk", "en"] as const;
export const defaultLocale = "mk" as const;

export type Locale = (typeof locales)[number];
