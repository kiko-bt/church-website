import { unstable_cache } from "next/cache";
import { sanityClient } from "@/lib/sanity/client";
import { SANITY_TAGS } from "@/lib/sanity/tags";
import { sermonListQuery, sermonBySlugQuery } from "./sermons.queries";
import { mapSermon, mapSermons } from "./sermons.mappers";
import type { Sermon, SermonDocument } from "./sermons.types";

// Server-side data accessors. Cached under the "sermon" tag so the
// /api/revalidate webhook can invalidate them on publish. When Sanity is not
// configured, accessors fall back to empty content (build- and dev-safe).

export const getSermons = unstable_cache(
  async (): Promise<readonly Sermon[]> => {
    if (!sanityClient) return [];
    const docs =
      await sanityClient.fetch<readonly SermonDocument[]>(sermonListQuery);
    return mapSermons(docs);
  },
  ["sermons:list"],
  { tags: [SANITY_TAGS.sermon] }
);

export const getSermonBySlug = unstable_cache(
  async (slug: string): Promise<Sermon | null> => {
    if (!sanityClient) return null;
    const doc = await sanityClient.fetch<SermonDocument | null>(
      sermonBySlugQuery,
      { slug }
    );
    return doc ? mapSermon(doc) : null;
  },
  ["sermons:by-slug"],
  { tags: [SANITY_TAGS.sermon] }
);
