import type { Metadata } from "next";
import type { Locale } from "@/constants/locales";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { TestamentSection } from "@/components/bible/TestamentSection";
import { getAllBooks } from "@/features/bible";

type BiblePageProps = {
  params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({
  params,
}: BiblePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "bible" });
  return {
    title: t("title"),
    description: t("metaDescription"),
  };
}

export default async function BiblePage({ params }: BiblePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("bible");

  // getAllBooks returns books in canonical order; filtering preserves it.
  const books = await getAllBooks(locale);
  const oldTestament = books
    .filter((book) => book.testament === "OT")
    .map((book) => ({ id: book.id, name: book.name }));
  const newTestament = books
    .filter((book) => book.testament === "NT")
    .map((book) => ({ id: book.id, name: book.name }));

  return (
    <LayoutShell>
      <PageHeader title={t("title")} />
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
