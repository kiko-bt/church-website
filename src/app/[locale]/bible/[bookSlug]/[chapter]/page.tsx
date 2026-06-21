import type { Metadata } from "next";
import type { Locale } from "@/constants/locales";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { getAllBooks, getBook, getChapter } from "@/features/bible";

type BibleChapterPageProps = {
  params: Promise<{ locale: Locale; bookSlug: string; chapter: string }>;
};

export async function generateStaticParams() {
  return getAllBooks().flatMap((book) =>
    book.chapters.map((chapter) => ({
      bookSlug: book.id,
      chapter: String(chapter.number),
    }))
  );
}

export async function generateMetadata({
  params,
}: BibleChapterPageProps): Promise<Metadata> {
  const { bookSlug, chapter } = await params;
  const book = getBook(bookSlug);
  return { title: book ? `${book.name} ${chapter}` : bookSlug };
}

export default async function BibleChapterPage({
  params,
}: BibleChapterPageProps) {
  const { locale, bookSlug, chapter } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("bible");
  const chapterNumber = Number(chapter);
  const book = getBook(bookSlug);
  const chapterData = getChapter(bookSlug, chapterNumber);

  if (!book || !chapterData) {
    return (
      <LayoutShell>
        <p className="py-12 text-center text-text-primary/70">
          {t("notFound.chapter")}
        </p>
      </LayoutShell>
    );
  }

  return (
    <LayoutShell>
      {/* Breadcrumb */}
      <nav
        aria-label={t("aria.breadcrumb")}
        className="mb-6 text-sm text-text-primary/60"
      >
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link
              href={`/${locale}/bible`}
              className="hover:text-accent-gold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold rounded-sm"
            >
              {t("breadcrumb")}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href={`/${locale}/bible/${bookSlug}`}
              className="hover:text-accent-gold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold rounded-sm"
            >
              {book.name}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">
            {t("chapter")} {chapter}
          </li>
        </ol>
      </nav>

      {/* Chapter heading */}
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-deep-dark sm:text-4xl">
          {book.name}
        </h1>
        <p className="mt-2 text-lg text-text-primary/60">
          {t("chapter")} {chapter}
        </p>
      </header>

      {/* Verse list */}
      <ol className="bible-text space-y-4" aria-label={`${book.name} ${chapter}`}>
        {chapterData.verses.map((verse) => (
          <li
            key={verse.number}
            id={`v${verse.number}`}
            className="flex gap-4 scroll-mt-20"
          >
            <span
              className="mt-1 shrink-0 text-xs font-semibold text-accent-gold"
              aria-label={`${t("verse")} ${verse.number}`}
            >
              {verse.number}
            </span>
            <p className="leading-relaxed text-text-primary">
              {locale === "en" ? verse.text_en : verse.text}
            </p>
          </li>
        ))}
      </ol>
    </LayoutShell>
  );
}
