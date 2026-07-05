import type { Locale } from "@/constants/locales";

// Resolves a bilingual CMS field pair to the value for the active locale.
//
// Follows the project's `_en` field-suffix convention: the base field holds
// Macedonian (default), the `_en` field holds English. Used by mappers to turn
// raw bilingual documents into single-locale domain models.
export function localized<T>(mk: T, en: T, locale: Locale): T {
  return locale === "en" ? en : mk;
}
