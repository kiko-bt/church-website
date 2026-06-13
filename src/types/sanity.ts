// Shared Sanity primitives used across multiple CMS features.
// Feature-specific document types live in their own feature folder,
// e.g. features/sermons/sermons.types.ts.

export type SanityReference = {
  readonly _ref: string;
  readonly _type: "reference";
};

export type SanityImage = {
  readonly _type: "image";
  readonly asset: SanityReference;
  readonly alt?: string;
};

export type SanitySlug = {
  readonly current: string;
};
