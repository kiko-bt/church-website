import type { SanityImage } from "@/types/sanity";

export type GalleryImage = {
  readonly _id: string;
  readonly _type: "galleryImage";
  readonly title?: string;
  readonly image: SanityImage;
  readonly date?: string;
};
