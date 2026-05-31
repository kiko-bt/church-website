import type { Metadata } from "next";
import type { Locale } from "@/constants/locales";
import type { BibleHierarchical } from "@/types/bible";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { PageHeader } from "@/components/ui/PageHeader";
import bibleData from "@/data/bible/bible-hierarchical.json";

const bible = bibleData as BibleHierarchical;

type BibleBookPageProps = {
  params: Promise<{ locale: Locale; bookSlug: string }>;
};

export async function generateStaticParams() {
  return bible.books.map((book) => ({ bookSlug: book.id }));
}

export async function generateMetadata({
  params,
}: BibleBookPageProps): Promise<Metadata> {
  const { bookSlug } = await params;
  const book = bible.books.find((b) => b.id === bookSlug);
  return { title: book?.name ?? bookSlug };
}

export default async function BibleBookPage({ params }: BibleBookPageProps) {
  const { locale, bookSlug } = await params;
  const t = await getTranslations("bible");
  const book = bible.books.find((b) => b.id === bookSlug);

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
      <PageHeader title={book.name} />

      <nav aria-label={t("aria.chapters")}>
        <ul className="flex flex-wrap gap-2">
          {book.chapters.map((chapter) => (
            <li key={chapter.number}>
              <Link
                href={`/${locale}/bible/${bookSlug}/${chapter.number}`}
                className={
                  "inline-flex h-10 w-10 items-center justify-center rounded-sm border border-soft-gold " +
                  "text-sm font-medium text-text-primary transition-colors " +
                  "hover:bg-accent-gold hover:text-white hover:border-accent-gold " +
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold"
                }
                aria-label={`${t("chapter")} ${chapter.number}`}
              >
                {chapter.number}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </LayoutShell>
  );
}
