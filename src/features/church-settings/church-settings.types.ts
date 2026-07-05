// Raw `churchSettings` singleton as returned by GROQ. The service schedule is
// bilingual (`_en`); other contact fields are language-neutral. SEO defaults
// and social links are nested objects.

export type SeoDocument = {
  readonly metaTitle?: string;
  readonly metaTitle_en?: string;
  readonly metaDescription?: string;
  readonly metaDescription_en?: string;
  readonly ogImage?: { readonly url: string | null; readonly alt: string } | null;
};

export type ChurchSettingsDocument = {
  readonly _id: string;
  readonly churchName: string;
  readonly address: string;
  readonly email: string;
  readonly phone?: string;
  readonly serviceSchedule?: string;
  readonly serviceSchedule_en?: string;
  readonly social?: {
    readonly facebook?: string;
    readonly youtube?: string;
    readonly instagram?: string;
  } | null;
  readonly seo?: SeoDocument | null;
};

// Clean, locale-resolved domain model consumed by the UI.
export type ChurchSettings = {
  readonly id: string;
  readonly churchName: string;
  readonly address: string;
  readonly email: string;
  readonly phone?: string;
  readonly serviceSchedule?: string;
  readonly social: {
    readonly facebook?: string;
    readonly youtube?: string;
    readonly instagram?: string;
  };
  readonly seo: {
    readonly metaTitle?: string;
    readonly metaDescription?: string;
    readonly ogImageUrl?: string;
    readonly ogImageAlt?: string;
  };
};
