import type { SanitySlug } from "@/types/sanity";

// Raw projection from GROQ. The PDF and cover URLs are resolved in the query
// (`asset->url`), so the mapper only flattens and applies defaults.
export type BookDocument = {
  readonly _id: string;
  readonly title: string;
  readonly slug: SanitySlug;
  readonly author: string;
  readonly description?: string;
  readonly pdfUrl: string | null;
  readonly coverImage?: {
    readonly url: string | null;
    readonly alt: string;
  } | null;
  readonly publishedAt?: string;
  readonly featured?: boolean;
};

// Clean domain model consumed by the UI: ready-to-use URLs, flattened slug,
// `featured` always defined.
export type Book = {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly author: string;
  readonly description?: string;
  readonly pdfUrl: string | null;
  readonly coverImageUrl?: string;
  readonly coverImageAlt?: string;
  readonly publishedAt?: string;
  readonly featured: boolean;
};
