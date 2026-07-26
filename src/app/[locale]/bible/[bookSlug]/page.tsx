import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/constants/locales";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { generateBaseMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbSchema } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { BibleBreadcrumb } from "@/components/bible/BibleBreadcrumb";
import { ChapterGrid } from "@/components/bible/ChapterGrid";
import { getAllBookMeta, getDisplayName } from "@/features/bible";

type BibleBookPageProps = {
  params: Promise<{ locale: Locale; bookSlug: string }>;
};

// Book routes come from the manifest — the single source of truth for routing.
// Only these params exist; anything else is a real 404 (see dynamicParams).
export async function generateStaticParams() {
  return getAllBookMeta().map((book) => ({ bookSlug: book.id }));
}

// Reject any book slug not produced by generateStaticParams (e.g. unknown books,
// or non-canonical spellings) with a proper 404 instead of a soft "not found".
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: BibleBookPageProps): Promise<Metadata> {
  const { locale, bookSlug } = await params;
  const t = await getTranslations({ locale, namespace: "bible" });
  const name = getDisplayName(locale, bookSlug);
  return generateBaseMetadata(locale, `/bible/${bookSlug}`, {
    title: name,
    description: t("bookMetaDescription", { book: name }),
  });
}

export default async function BibleBookPage({ params }: BibleBookPageProps) {
  const { locale, bookSlug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("bible");

  // The manifest is enough for this page — chapter count and nothing else — so
  // it renders without loading any verse text.
  const book = getAllBookMeta().find((entry) => entry.id === bookSlug);

  // With dynamicParams=false this is defensive only — the slug is guaranteed to
  // be a real book — but it keeps the type non-nullable and fails safe.
  if (!book) notFound();

  const name = getDisplayName(locale, book.id);

  return (
    <LayoutShell>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: t("breadcrumb"), path: `/${locale}/bible` },
          { name },
        ])}
      />
      <BibleBreadcrumb
        ariaLabel={t("aria.breadcrumb")}
        items={[
          { label: t("breadcrumb"), href: `/${locale}/bible` },
          { label: name },
        ]}
      />
      <PageHeader title={name} className="pt-0" />
      <ChapterGrid
        locale={locale}
        bookId={book.id}
        chapterCount={book.chapters.length}
      />
    </LayoutShell>
  );
}
