// Single source of truth for Next.js cache tags used by Sanity-backed content.
//
// Feature data accessors tag their cached reads with these values; the
// `/api/revalidate` route maps an incoming Sanity document `_type` to the same
// tag and calls `revalidateTag(...)`. Keeping both sides on this constant
// prevents drift between what is cached and what gets invalidated.
export const SANITY_TAGS = {
  sermon: "sermon",
  book: "book",
  gallery: "gallery",
  churchSettings: "churchSettings",
  homeContent: "homeContent",
} as const;

export type SanityTag = (typeof SANITY_TAGS)[keyof typeof SANITY_TAGS];
