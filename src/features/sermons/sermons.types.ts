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
  readonly featured: boolean;
};
