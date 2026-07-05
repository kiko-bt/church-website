import type { SanitySlug } from "@/types/sanity";

// Raw projection from GROQ. Each embedded image asset is dereferenced to a URL.
export type GalleryImageDocument = {
  readonly _key: string;
  readonly url: string | null;
  readonly alt: string;
  readonly caption?: string;
};

export type GalleryAlbumDocument = {
  readonly _id: string;
  readonly title: string;
  readonly slug: SanitySlug;
  readonly description?: string;
  readonly date?: string;
  readonly featured?: boolean;
  readonly images?: readonly GalleryImageDocument[];
};

// Clean domain models consumed by the UI.
export type GalleryImageItem = {
  readonly key: string;
  readonly url: string;
  readonly alt: string;
  readonly caption?: string;
};

export type GalleryAlbum = {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly description?: string;
  readonly date?: string;
  readonly featured: boolean;
  readonly images: readonly GalleryImageItem[];
  readonly coverImageUrl?: string;
  readonly coverImageAlt?: string;
};
