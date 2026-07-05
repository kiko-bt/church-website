import type { Metadata } from "next";
import type { Locale } from "@/constants/locales";
import { siteConfig } from "@/constants/site";
import { getChurchSettings } from "@/features/church-settings";

// OG images type, derived from the public Metadata type (no internal imports).
type OgImages = NonNullable<NonNullable<Metadata["openGraph"]>["images"]>;

// Per-page metadata overrides for content routes (e.g. a book detail page).
// Any field left unset falls back to the site-wide default, so callers only
// specify what is page-specific and never re-implement the base SEO logic.
export type MetadataOverrides = {
  readonly title?: string;
  readonly description?: string;
  readonly image?: { readonly url: string; readonly alt?: string };
};

// Collapses a plain-text field (book/sermon `description`, which are `text` in
// the schema — not Portable Text) into a single-line, length-capped meta
// description. Shared by all content detail pages so the truncation rule lives
// in one place.
export function toMetaDescription(text?: string): string | undefined {
  if (!text) return undefined;
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > 160 ? `${clean.slice(0, 159).trimEnd()}…` : clean;
}

// Site-wide metadata defaults. Church identity (brand name, description, OG
// image) is sourced from the `churchSettings` singleton when configured, and
// falls back to `siteConfig` so the build never depends on a live CMS.
//
// Content routes pass `overrides` to set a page-specific title/description/OG
// image while inheriting canonical, hreflang, robots and churchSettings brand
// defaults. The site URL / canonical / hreflang logic is infrastructure
// (NEXT_PUBLIC_SITE_URL), not church identity, so it stays on `siteConfig`.
export async function generateBaseMetadata(
  locale: Locale,
  path: string = "",
  overrides: MetadataOverrides = {}
): Promise<Metadata> {
  const isEn = locale === "en";
  const settings = await getChurchSettings(locale);

  // Brand name = the single, official church name from the CMS when set; the
  // localized siteConfig name is only a fallback for the unconfigured build.
  const brandName =
    settings?.churchName ?? (isEn ? siteConfig.nameEn : siteConfig.name);
  // The default <title> may use a dedicated SEO meta title; sub-pages always
  // append the brand via the template.
  const defaultTitle = settings?.seo.metaTitle ?? brandName;
  const description =
    overrides.description ??
    settings?.seo.metaDescription ??
    (isEn ? siteConfig.descriptionEn : siteConfig.description);
  const canonicalUrl = `${siteConfig.url}/${locale}${path}`;

  // A page-specific title is returned as a bare string so the ancestor layout's
  // `%s | brand` template brands it. The base call (from the locale layout)
  // returns the template itself.
  const title: Metadata["title"] = overrides.title
    ? overrides.title
    : { default: defaultTitle, template: `%s | ${brandName}` };
  const ogTitle = overrides.title ?? defaultTitle;

  // OG image precedence: an explicit per-page image (e.g. book cover) → the
  // CMS default OG image → the static lockup with known intrinsic dimensions
  // (no CLS / correct aspect ratio for scrapers). Remote URLs carry no known
  // dimensions, so width/height are only set for the local asset.
  const ogImages: OgImages = overrides.image
    ? [{ url: overrides.image.url, alt: overrides.image.alt ?? brandName }]
    : settings?.seo.ogImageUrl
      ? [
          {
            url: settings.seo.ogImageUrl,
            alt: settings.seo.ogImageAlt ?? brandName,
          },
        ]
      : [
          {
            url: "/images/branding/church-logo.png",
            width: 1184,
            height: 864,
            alt: brandName,
          },
        ];

  return {
    title,
    description,
    metadataBase: new URL(siteConfig.url),
    openGraph: {
      type: "website",
      locale: isEn ? "en_US" : "mk_MK",
      siteName: brandName,
      title: ogTitle,
      description,
      url: canonicalUrl,
      images: ogImages,
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        mk: `${siteConfig.url}/mk${path}`,
        en: `${siteConfig.url}/en${path}`,
      },
    },
  };
}
