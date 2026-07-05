import { unstable_cache } from "next/cache";
import type { Locale } from "@/constants/locales";
import { sanityClient } from "@/lib/sanity/client";
import { SANITY_TAGS } from "@/lib/sanity/tags";
import { churchSettingsQuery } from "./church-settings.queries";
import { mapChurchSettings } from "./church-settings.mappers";
import type {
  ChurchSettings,
  ChurchSettingsDocument,
} from "./church-settings.types";

// Resolved church settings for the active locale. Cached under the
// "churchSettings" tag; returns null when Sanity is not configured (consumers
// fall back to siteConfig / message-based values).
export const getChurchSettings = unstable_cache(
  async (locale: Locale): Promise<ChurchSettings | null> => {
    if (!sanityClient) return null;
    const doc =
      await sanityClient.fetch<ChurchSettingsDocument | null>(
        churchSettingsQuery
      );
    return doc ? mapChurchSettings(doc, locale) : null;
  },
  ["church-settings:singleton"],
  { tags: [SANITY_TAGS.churchSettings] }
);
