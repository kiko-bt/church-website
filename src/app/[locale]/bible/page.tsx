import type { Metadata } from "next";
import type { Locale } from "@/constants/locales";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { generateBaseMetadata } from "@/lib/seo/metadata";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { TestamentSection } from "@/components/bible/TestamentSection";
import { BibleSearch } from "@/components/bible/BibleSearch";
import { getAllBookMeta, getDisplayName } from "@/features/bible";

type BiblePageProps = {
  params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({
  params,
}: BiblePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "bible" });
  return generateBaseMetadata(locale, "/bible", {
    title: t("title"),
    description: t("metaDescription"),
  });
}

export default async function BiblePage({ params }: BiblePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("bible");

  // The manifest is in canonical order and carries no verse text, so listing
  // every book costs nothing; filtering preserves the order.
  const books = getAllBookMeta().map((book) => ({
    id: book.id,
    name: getDisplayName(locale, book.id),
    testament: book.testament,
  }));
  const oldTestament = books.filter((book) => book.testament === "OT");
  const newTestament = books.filter((book) => book.testament === "NT");

  return (
    <LayoutShell>
      <PageHeader title={t("title")} />
      <BibleSearch
        // Remount on locale change so a client-side language switch never
        // reuses the previously loaded (wrong-language) search index or results.
        key={locale}
        locale={locale}
        placeholder={t("searchPlaceholder")}
        ariaLabel={t("aria.search")}
        noResults={t("noResults")}
        errorLabel={t("searchError")}
      />
      <TestamentSection
        locale={locale}
        title={t("oldTestament")}
        books={oldTestament}
      />
      <TestamentSection
        locale={locale}
        title={t("newTestament")}
        books={newTestament}
      />
    </LayoutShell>
  );
}
