import type { SanitySlug } from "@/types/sanity";

// Raw shape returned by the GROQ queries (mirrors the Sanity `sermon` schema).
// Only the mapper consumes this — components never see raw documents.
export type SermonDocument = {
  readonly _id: string;
  readonly title: string;
  readonly slug: SanitySlug;
  readonly preacher: string;
  readonly date: string;
  readonly description?: string;
  readonly audioUrl?: string;
  readonly videoUrl?: string;
  readonly bibleReferences?: readonly string[] | null;
  readonly featured?: boolean;
};

// Clean domain model consumed by the UI. Slug is flattened to a string and
// `featured` is always defined.
export type Sermon = {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly preacher: string;
  readonly date: string;
  readonly description?: string;
  readonly audioUrl?: string;
  readonly videoUrl?: string;
  // Free-text scripture citations (e.g. "John 3:16"), always defined (may be
  // empty). Displayed on the detail page; kept as text so the preacher can
  // enter references in any form without a rigid parser.
  readonly bibleReferences: readonly string[];
  readonly featured: boolean;
};
