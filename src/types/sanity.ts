import type { PortableTextBlock } from "@portabletext/types";

// Shared Sanity primitives used across CMS feature *raw* document types.
// Feature-specific document types live in their own feature folder,
// e.g. features/sermons/sermons.types.ts. Image/file assets are dereferenced
// to URLs inside GROQ projections, so raw types carry resolved URLs rather than
// asset references.

export type SanitySlug = {
  readonly current: string;
};

// Sanity Portable Text (rich text) content. Backed by the official
// `PortableTextBlock` type from `@portabletext/types` and rendered by the
// shared `PortableTextRenderer` (@/components/portable-text). The matching
// Studio schema is `richText` (sanity/schemas/objects/richText.ts).
export type RichTextContent = PortableTextBlock[];
