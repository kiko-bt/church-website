import type { Metadata } from "next";
import type { Locale } from "@/constants/locales";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { BibleBreadcrumb } from "@/components/bible/BibleBreadcrumb";
import { ChapterGrid } from "@/components/bible/ChapterGrid";
import { getAllBookMeta, getBook } from "@/features/bible";

type BibleBookPageProps = {
  params: Promise<{ locale: Locale; bookSlug: string }>;
};

// Book routes come from the manifest — the single source of truth for routing.
export async function generateStaticParams() {
  return getAllBookMeta().map((book) => ({ bookSlug: book.id }));
}

export async function generateMetadata({
  params,
}: BibleBookPageProps): Promise<Metadata> {
  const { locale, bookSlug } = await params;
  const book = await getBook(locale, bookSlug);
  return { title: book?.name ?? bookSlug };
}

export default async function BibleBookPage({ params }: BibleBookPageProps) {
  const { locale, bookSlug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("bible");
  const book = await getBook(locale, bookSlug);

  if (!book) {
    return (
      <LayoutShell>
        <p className="py-12 text-center text-text-primary/70">
          {t("notFound.book")}
        </p>
      </LayoutShell>
    );
  }

  return (
    <LayoutShell>
      <BibleBreadcrumb
        ariaLabel={t("aria.breadcrumb")}
        items={[
          { label: t("breadcrumb"), href: `/${locale}/bible` },
          { label: book.name },
        ]}
      />
      <PageHeader title={book.name} className="pt-0" />
      <ChapterGrid
        locale={locale}
        bookId={book.id}
        chapterCount={book.chapters.length}
      />
    </LayoutShell>
  );
}
