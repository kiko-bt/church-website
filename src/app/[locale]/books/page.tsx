import type { Metadata } from "next";
import type { Locale } from "@/constants/locales";
import type { Book } from "@/features/books";
import { getTranslations, setRequestLocale } from "next-intl/server";
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
  return {
    title: t("title"),
    description: t("metaDescription"),
  };
}

export default async function BooksPage({ params }: BooksPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("books");

  // Future CMS integration point: replace with the result of `bookListQuery`
  // (@/features/books) once Sanity is wired in. Empty for now — the grid
  // renders its empty state.
  const books: readonly Book[] = [];

  return (
    <LayoutShell>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="pb-12">
        <BooksGrid books={books} locale={locale} />
      </div>
    </LayoutShell>
  );
}
