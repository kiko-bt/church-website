import type { Locale } from "@/constants/locales";

// Resolves a bilingual CMS field pair to the value for the active locale.
//
// Follows the project's `_en` field-suffix convention: the base field holds
// Macedonian (default), the `_en` field holds English. Used by mappers to turn
// raw bilingual documents into single-locale domain models.
//
// Fallback (defense-in-depth): even though the required `_en` fields are
// validated in the Studio, that validation is not a guaranteed hard publish
// block. So for bilingual STRING fields, when English is requested but the
// `_en` value is missing or blank, fall back to the Macedonian value — the
// English site never renders an empty string where the Macedonian value exists.
//
// The fallback is deliberately scoped to strings. Non-string values (the
// optional Portable Text arrays) are passed through untouched, so their
// existing higher-level fallback — the mapper's `?? []` and the section's
// generic English copy — still applies, rather than showing Macedonian prose on
// the English page.
export function localized<T>(mk: T, en: T, locale: Locale): T {
  if (locale !== "en") return mk;
  if (typeof mk === "string") {
    const enUsable = typeof en === "string" && en.trim() !== "";
    return enUsable ? en : mk;
  }
  return en;
}
