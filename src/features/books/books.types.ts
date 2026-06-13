import type { SanityImage, SanityReference, SanitySlug } from "@/types/sanity";

export type Book = {
  readonly _id: string;
  readonly _type: "book";
  readonly title: string;
  readonly slug: SanitySlug;
  readonly author: string;
  readonly description?: string;
  readonly pdfAsset: SanityReference;
  readonly coverImage?: SanityImage;
};
