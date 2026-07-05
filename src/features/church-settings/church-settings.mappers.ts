import type { Locale } from "@/constants/locales";
import { localized } from "@/lib/i18n/localize";
import type {
  ChurchSettings,
  ChurchSettingsDocument,
} from "./church-settings.types";

// Resolves the church-settings document to a clean, locale-aware domain model.
export function mapChurchSettings(
  doc: ChurchSettingsDocument,
  locale: Locale
): ChurchSettings {
  return {
    id: doc._id,
    churchName: doc.churchName,
    address: doc.address,
    email: doc.email,
    phone: doc.phone,
    serviceSchedule: localized(
      doc.serviceSchedule,
      doc.serviceSchedule_en,
      locale
    ),
    social: {
      facebook: doc.social?.facebook,
      youtube: doc.social?.youtube,
      instagram: doc.social?.instagram,
    },
    seo: {
      metaTitle: localized(doc.seo?.metaTitle, doc.seo?.metaTitle_en, locale),
      metaDescription: localized(
        doc.seo?.metaDescription,
        doc.seo?.metaDescription_en,
        locale
      ),
      ogImageUrl: doc.seo?.ogImage?.url ?? undefined,
      ogImageAlt: doc.seo?.ogImage?.alt,
    },
  };
}
