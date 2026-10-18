import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/constants/locales";
import { getBooks, getBookBySlug } from "@/features/books";
import { generateBaseMetadata } from "@/lib/seo/metadata";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { PdfReader } from "@/components/books/PdfReader";

type BookReaderPageProps = {
  params: Promise<{ locale: Locale; slug: string }>;
};

// Same static strategy as the book page: every published book is prerendered,
// new ones are generated on demand and cached (ISR).
export async function generateStaticParams() {
  const books = await getBooks();
  return books.map((book) => ({ slug: book.slug }));
}

export async function generateMetadata({
  params,
}: BookReaderPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const book = await getBookBySlug(slug);
  const path = `/books/${slug}/read`;
  if (!book) return generateBaseMetadata(locale, path);

  const t = await getTranslations({ locale, namespace: "books.reader" });
  const metadata = await generateBaseMetadata(locale, path, {
    title: t("metaTitle", { title: book.title }),
  });
  // The book page is the one search engines should list; the reader only
  // shows the same PDF.
  return { ...metadata, robots: { index: false, follow: true } };
}

// The in-site reader for one book or commentary. Server-rendered frame; the
// PDF itself is rendered by the PdfReader client island.
export default async function BookReaderPage({ params }: BookReaderPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("books.reader");

  const book = await getBookBySlug(slug);
  // No PDF the reader can load → the book page offers the original links.
  if (
    !book ||
    !book.pdfUrl ||
    !book.pdfDownloadUrl ||
    !book.pdfFileId ||
    !book.pdfReaderUrl
  ) {
    notFound();
  }

  return (
    <LayoutShell className="py-4">
      <div className="mb-3 flex min-w-0 items-center gap-3">
        <Link
          href={`/${locale}/books/${slug}`}
          aria-label={t("back")}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-text-primary transition-colors hover:bg-soft-gold/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </Link>
        <h1 className="truncate font-heading text-xl font-bold text-deep-dark sm:text-2xl">
          {book.title}
        </h1>
      </div>

      <PdfReader
        slug={book.slug}
        fileId={book.pdfFileId}
        src={book.pdfReaderUrl}
        pdfUrl={book.pdfUrl}
        downloadUrl={book.pdfDownloadUrl}
        messages={{
          toolbar: t("toolbar"),
          document: t("document"),
          previousPage: t("previousPage"),
          nextPage: t("nextPage"),
          pageNumber: t("pageNumber"),
          pageOf: String(t.raw("pageOf")),
          zoomIn: t("zoomIn"),
          zoomOut: t("zoomOut"),
          openPdf: t("openPdf"),
          download: t("download"),
          loading: t("loading"),
          loadingProgress: String(t.raw("loadingProgress")),
          error: t("error"),
        }}
      />
    </LayoutShell>
  );
}
