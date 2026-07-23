import type { Locale } from "@/constants/locales";
import { siteConfig } from "@/constants/site";
import { getChurchSettings } from "@/features/church-settings";
import type { Book } from "@/features/books";

// Schema.org JSON-LD builders. Each returns a plain, serializable object (no
// classes, no new dependency) rendered by the <JsonLd> component. Values come
// from the CMS church-settings singleton when configured, falling back to
// siteConfig so the markup is always complete — even on an unconfigured build.
//
// We intentionally do NOT emit a WebSite `SearchAction`: the site's only search
// is the client-side Bible search, which has no query-string results URL. A
// SearchAction whose target cannot actually run a search violates Google's
// sitelinks-searchbox guidelines, so it is omitted until a real search route
// exists.

export type JsonLdObject = Record<string, unknown>;

const brandName = (settingsName: string | undefined, isEn: boolean): string =>
  settingsName ?? (isEn ? siteConfig.nameEn : siteConfig.name);

// The church as a place of worship AND the site's publishing organization.
// `@id` anchors it so other nodes (WebSite.publisher, Book.publisher) can
// reference the same entity rather than duplicating it.
export async function buildOrganizationSchema(
  locale: Locale
): Promise<JsonLdObject> {
  const isEn = locale === "en";
  const settings = await getChurchSettings(locale);
  const name = brandName(settings?.churchName, isEn);
  const orgId = `${siteConfig.url}/#organization`;

  const sameAs = [
    settings?.social.facebook,
    settings?.social.youtube,
    settings?.social.instagram,
  ].filter((url): url is string => Boolean(url));

  return {
    "@context": "https://schema.org",
    "@type": "Church",
    "@id": orgId,
    name,
    url: `${siteConfig.url}/${locale}`,
    logo: `${siteConfig.url}/images/branding/church-logo.png`,
    image: `${siteConfig.url}/images/branding/church-logo.png`,
    email: settings?.email ?? siteConfig.email,
    ...(settings?.phone ? { telephone: settings.phone } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: settings?.address ?? siteConfig.address,
      addressLocality: siteConfig.addressLocality,
      addressCountry: siteConfig.addressCountry,
    },
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

// The website entity, linked to the organization as its publisher.
export async function buildWebSiteSchema(
  locale: Locale
): Promise<JsonLdObject> {
  const isEn = locale === "en";
  const settings = await getChurchSettings(locale);
  const name = brandName(settings?.churchName, isEn);

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteConfig.url}/#website`,
    url: `${siteConfig.url}/${locale}`,
    name,
    inLanguage: isEn ? "en" : "mk",
    publisher: { "@id": `${siteConfig.url}/#organization` },
  };
}

export type BreadcrumbEntry = {
  readonly name: string;
  // Absolute or site-relative path (e.g. "/mk/bible"). The last crumb (current
  // page) may omit the URL.
  readonly path?: string;
};

export function buildBreadcrumbSchema(
  items: readonly BreadcrumbEntry[]
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.path ? { item: `${siteConfig.url}${item.path}` } : {}),
    })),
  };
}

export function buildBookSchema(book: Book, locale: Locale): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    author: { "@type": "Person", name: book.author },
    inLanguage: "mk",
    url: `${siteConfig.url}/${locale}/books/${book.slug}`,
    ...(book.coverImageUrl ? { image: book.coverImageUrl } : {}),
    ...(book.description ? { description: book.description } : {}),
    ...(book.publishedAt ? { datePublished: book.publishedAt } : {}),
    publisher: { "@id": `${siteConfig.url}/#organization` },
  };
}
