import { unstable_cache } from "next/cache";
import { sanityClient } from "@/lib/sanity/client";
import { SANITY_TAGS } from "@/lib/sanity/tags";
import {
  galleryListQuery,
  galleryAlbumBySlugQuery,
} from "./gallery.queries";
import { mapGalleryAlbum, mapGalleryAlbums } from "./gallery.mappers";
import type { GalleryAlbum, GalleryAlbumDocument } from "./gallery.types";

// Server-side data accessors, cached under the "gallery" tag. Fall back to
// empty content when Sanity is not configured.

export const getGalleryAlbums = unstable_cache(
  async (): Promise<readonly GalleryAlbum[]> => {
    if (!sanityClient) return [];
    const docs =
      await sanityClient.fetch<readonly GalleryAlbumDocument[]>(galleryListQuery);
    return mapGalleryAlbums(docs);
  },
  ["gallery:albums"],
  { tags: [SANITY_TAGS.gallery] }
);

export const getGalleryAlbumBySlug = unstable_cache(
  async (slug: string): Promise<GalleryAlbum | null> => {
    if (!sanityClient) return null;
    const doc = await sanityClient.fetch<GalleryAlbumDocument | null>(
      galleryAlbumBySlugQuery,
      { slug }
    );
    return doc ? mapGalleryAlbum(doc) : null;
  },
  ["gallery:album-by-slug"],
  { tags: [SANITY_TAGS.gallery] }
);
