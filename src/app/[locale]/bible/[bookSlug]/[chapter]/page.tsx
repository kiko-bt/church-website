import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/constants/locales";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { BibleBreadcrumb } from "@/components/bible/BibleBreadcrumb";
import { VerseList } from "@/components/bible/VerseList";
import { ChapterNav } from "@/components/bible/ChapterNav";
import { generateBaseMetadata } from "@/lib/seo/metadata";
import { buildBreadcrumbSchema } from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";
import { getAllBookMeta, getChapter, getDisplayName } from "@/features/bible";

type BibleChapterPageProps = {
  params: Promise<{ locale: Locale; bookSlug: string; chapter: string }>;
};

// Chapter routes come from the manifest only (no verse corpus is loaded). Each
// book's `chapters` array holds one entry per chapter, so its length is the
// chapter count. Only these exact params are valid — every chapter link the app
// emits uses the canonical form `String(index + 1)`.
export async function generateStaticParams() {
  return getAllBookMeta().flatMap((book) =>
    book.chapters.map((_verseCount, index) => ({
      bookSlug: book.id,
      chapter: String(index + 1),
    }))
  );
}

// Reject anything not generated above with a real 404. This also rules out
// non-canonical numeric forms (e.g. `/john/03`, `/john/9999`) that would
// otherwise resolve via Number() and produce duplicate content at HTTP 200.
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: BibleChapterPageProps): Promise<Metadata> {
  const { locale, bookSlug, chapter } = await params;
  const t = await getTranslations({ locale, namespace: "bible" });
  const name = getDisplayName(locale, bookSlug);
  return generateBaseMetadata(locale, `/bible/${bookSlug}/${chapter}`, {
    title: `${name} ${chapter}`,
    description: t("chapterMetaDescription", { book: name, chapter }),
  });
}

export default async function BibleChapterPage({
  params,
}: BibleChapterPageProps) {
  const { locale, bookSlug, chapter } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("bible");
  const chapterNumber = Number(chapter);
  const chapterData = await getChapter(locale, bookSlug, chapterNumber);

  // Defensive with dynamicParams=false — the params are guaranteed valid — but
  // it keeps the types non-nullable and fails safe.
  if (!chapterData) notFound();

  const name = getDisplayName(locale, bookSlug);

  return (
    <LayoutShell>
      <JsonLd
        data={buildBreadcrumbSchema([
          { name: t("breadcrumb"), path: `/${locale}/bible` },
          { name, path: `/${locale}/bible/${bookSlug}` },
          { name: `${t("chapter")} ${chapter}` },
        ])}
      />
      <BibleBreadcrumb
        ariaLabel={t("aria.breadcrumb")}
        items={[
          { label: t("breadcrumb"), href: `/${locale}/bible` },
          { label: name, href: `/${locale}/bible/${bookSlug}` },
          { label: `${t("chapter")} ${chapter}` },
        ]}
      />

      <header className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-deep-dark sm:text-4xl">
          {name}
        </h1>
        <p className="mt-2 text-lg text-text-primary/70">
          {t("chapter")} {chapter}
        </p>
      </header>

      <VerseList verses={chapterData.verses} ariaLabel={`${name} ${chapter}`} />

      <ChapterNav locale={locale} bookId={bookSlug} chapter={chapterNumber} />
    </LayoutShell>
  );
}
