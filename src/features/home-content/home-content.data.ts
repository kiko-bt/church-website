import { unstable_cache } from "next/cache";
import type { Locale } from "@/constants/locales";
import { sanityClient } from "@/lib/sanity/client";
import { SANITY_TAGS } from "@/lib/sanity/tags";
import { homeContentQuery } from "./home-content.queries";
import { mapHomeContent } from "./home-content.mappers";
import type { HomeContent, HomeContentDocument } from "./home-content.types";

// Resolved home content for the active locale. Cached under the "homeContent"
// tag; returns null when Sanity is not configured (the homepage then renders
// its message-based fallback copy).
export const getHomeContent = unstable_cache(
  async (locale: Locale): Promise<HomeContent | null> => {
    if (!sanityClient) return null;
    const doc =
      await sanityClient.fetch<HomeContentDocument | null>(homeContentQuery);
    return doc ? mapHomeContent(doc, locale) : null;
  },
  ["home-content:singleton"],
  { tags: [SANITY_TAGS.homeContent] }
);
