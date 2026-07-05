import type { Locale } from "@/constants/locales";
import { localized } from "@/lib/i18n/localize";
import type { HomeContent, HomeContentDocument } from "./home-content.types";

// Resolves the bilingual home-content document to a single-locale domain model.
export function mapHomeContent(
  doc: HomeContentDocument,
  locale: Locale
): HomeContent {
  return {
    welcomeTitle: localized(doc.welcomeTitle, doc.welcomeTitle_en, locale),
    // Rich-text fields are optional in the CMS; normalize to `[]` so the domain
    // model is always a valid Portable Text array (never null/undefined).
    welcomeBody: localized(doc.welcomeBody, doc.welcomeBody_en, locale) ?? [],
    mainVerseText: localized(doc.mainVerseText, doc.mainVerseText_en, locale),
    mainVerseReference: localized(
      doc.mainVerseReference,
      doc.mainVerseReference_en,
      locale
    ),
    shortMessage:
      localized(doc.shortMessage, doc.shortMessage_en, locale) ?? [],
  };
}
