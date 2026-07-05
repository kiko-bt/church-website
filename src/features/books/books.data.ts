import { unstable_cache } from "next/cache";
import { sanityClient } from "@/lib/sanity/client";
import { SANITY_TAGS } from "@/lib/sanity/tags";
import { bookListQuery, bookBySlugQuery } from "./books.queries";
import { mapBook, mapBooks } from "./books.mappers";
import type { Book, BookDocument } from "./books.types";

// Server-side data accessors, cached under the "book" tag. Fall back to empty
// content when Sanity is not configured.

export const getBooks = unstable_cache(
  async (): Promise<readonly Book[]> => {
    if (!sanityClient) return [];
    const docs = await sanityClient.fetch<readonly BookDocument[]>(bookListQuery);
    return mapBooks(docs);
  },
  ["books:list"],
  { tags: [SANITY_TAGS.book] }
);

export const getBookBySlug = unstable_cache(
  async (slug: string): Promise<Book | null> => {
    if (!sanityClient) return null;
    const doc = await sanityClient.fetch<BookDocument | null>(bookBySlugQuery, {
      slug,
    });
    return doc ? mapBook(doc) : null;
  },
  ["books:by-slug"],
  { tags: [SANITY_TAGS.book] }
);
