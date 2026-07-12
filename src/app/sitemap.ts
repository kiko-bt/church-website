import type { MetadataRoute } from "next";
import { siteConfig } from "@/constants/site";
import { locales, defaultLocale } from "@/constants/locales";
import { routes } from "@/constants/routes";
import { getAllBookMeta } from "@/features/bible";
import { getSermons } from "@/features/sermons";
import { getBooks } from "@/features/books";
import { getGalleryAlbums } from "@/features/gallery";

// Bilingual sitemap (generated at build, refreshed by ISR alongside the pages).
//
// One entry per canonical path, with `alternates.languages` listing the mk/en
// hreflang pair — the idiomatic next-intl + Next.js pattern. The canonical URL
// uses the default locale (mk); both localized URLs are advertised as language
// alternates. CMS-driven paths are pulled through the same cached accessors the
// pages use, so the sitemap is invalidated on publish with the content and
// never depends on a live CMS at request time (empty list ⇒ those rows are just
// omitted). Bible book + chapter pages come from the local JSON accessors.
type Entry = MetadataRoute.Sitemap[number];

const base = siteConfig.url;

// Build one sitemap row for a locale-relative path (e.g. "/books/x"), attaching
// the mk/en hreflang alternates. Canonical URL is the default-locale variant.
function entry(
  path: string,
  changeFrequency: Entry["changeFrequency"],
  priority: number
): Entry {
  // Normalize the home path ("/") to "" so the URL is `/mk` (matching the
  // canonical tag), not `/mk/` — otherwise the sitemap advertises a URL that
  // Next.js 308-redirects (trailingSlash: false), which search engines penalize.
  const suffix = path === "/" ? "" : path;
  const languages = Object.fromEntries(
    locales.map((locale) => [locale, `${base}/${locale}${suffix}`])
  );
  return {
    url: `${base}/${defaultLocale}${suffix}`,
    changeFrequency,
    priority,
    alternates: { languages },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [sermons, books, albums] = await Promise.all([
    getSermons(),
    getBooks(),
    getGalleryAlbums(),
  ]);

  const staticEntries: Entry[] = [
    entry(routes.home, "weekly", 1),
    entry(routes.bible, "monthly", 0.8),
    entry(routes.sermons, "weekly", 0.7),
    entry(routes.books, "weekly", 0.7),
    entry(routes.gallery, "weekly", 0.7),
    entry(routes.about, "yearly", 0.5),
    entry(routes.contact, "yearly", 0.5),
    entry(routes.privacy, "yearly", 0.3),
  ];

  const sermonEntries = sermons.map((s) =>
    entry(`${routes.sermons}/${s.slug}`, "monthly", 0.6)
  );
  const bookEntries = books.map((b) =>
    entry(`${routes.books}/${b.slug}`, "monthly", 0.6)
  );
  const albumEntries = albums.map((a) =>
    entry(`${routes.gallery}/${a.slug}`, "monthly", 0.6)
  );

  // Bible: book index pages + every chapter reading page (local JSON, so this
  // is free and deterministic — no CMS call).
  const bibleEntries: Entry[] = getAllBookMeta().flatMap((book) => [
    entry(`${routes.bible}/${book.id}`, "yearly", 0.6),
    ...book.chapters.map((_verseCount, index) =>
      entry(`${routes.bible}/${book.id}/${index + 1}`, "yearly", 0.5)
    ),
  ]);

  return [
    ...staticEntries,
    ...sermonEntries,
    ...bookEntries,
    ...albumEntries,
    ...bibleEntries,
  ];
}
