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

export type Sermon = {
  readonly _id: string;
  readonly _type: "sermon";
  readonly title: string;
  readonly slug: SanitySlug;
  readonly preacher: string;
  readonly date: string;
  readonly description?: string;
  readonly audioUrl?: string;
  readonly videoUrl?: string;
};

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

export type GalleryImage = {
  readonly _id: string;
  readonly _type: "galleryImage";
  readonly title?: string;
  readonly image: SanityImage;
  readonly date?: string;
};

export type ChurchSettings = {
  readonly _id: string;
  readonly _type: "churchSettings";
  readonly churchName: string;
  readonly address: string;
  readonly email: string;
  readonly phone?: string;
  readonly facebook?: string;
  readonly youtube?: string;
  readonly serviceSchedule?: string;
};
