import type { Metadata } from "next";
import type { Locale } from "@/constants/locales";
import { getBooks } from "@/features/books";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { generateBaseMetadata } from "@/lib/seo/metadata";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { BooksGrid } from "@/components/books/BooksGrid";

type BooksPageProps = {
  params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({
  params,
}: BooksPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "books" });
  return generateBaseMetadata(locale, "/books", {
    title: t("title"),
    description: t("metaDescription"),
  });
}

export default async function BooksPage({ params }: BooksPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("books");

  // Sourced from Sanity via the books data accessor (cached, tag-revalidated).
  // Falls back to an empty list (empty state) when Sanity is not configured.
  const books = await getBooks();

  return (
    <LayoutShell>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="pb-12">
        <BooksGrid books={books} locale={locale} />
      </div>
    </LayoutShell>
  );
}
