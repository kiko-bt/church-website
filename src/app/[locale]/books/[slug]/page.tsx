import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { BookOpen, Download } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/constants/locales";
import { getBooks, getBookBySlug } from "@/features/books";
import { generateBaseMetadata, toMetaDescription } from "@/lib/seo/metadata";
import {
  buildBookSchema,
  buildBreadcrumbSchema,
} from "@/lib/seo/structured-data";
import { JsonLd } from "@/components/seo/JsonLd";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { Button } from "@/components/ui/Button";

type BookPageProps = {
  params: Promise<{ locale: Locale; slug: string }>;
};

// Prerender every published book at build time (per locale, via the parent
// segment). Empty when Sanity is not configured — new books are then generated
// on-demand and cached (ISR), so publishing never requires a redeploy.
export async function generateStaticParams() {
  const books = await getBooks();
  return books.map((book) => ({ slug: book.slug }));
}

export async function generateMetadata({
  params,
}: BookPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const book = await getBookBySlug(slug);
  const path = `/books/${slug}`;

  // Unknown slug → generic base metadata (the page itself renders a 404).
  if (!book) return generateBaseMetadata(locale, path);

  // Reuse the shared SEO helper (canonical, hreflang, robots, churchSettings
  // brand + OG defaults); override only the book-specific fields.
  return generateBaseMetadata(locale, path, {
    title: book.title,
    description: toMetaDescription(book.description),
    image: book.coverImageUrl
      ? { url: book.coverImageUrl, alt: book.coverImageAlt ?? book.title }
      : undefined,
  });
}

export default async function BookPage({ params }: BookPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("books");

  // Cached, tag-revalidated accessor (deduped with generateMetadata's call).
  const book = await getBookBySlug(slug);
  if (!book) notFound();

  const structuredData = [
    buildBreadcrumbSchema([
      { name: t("title"), path: `/${locale}/books` },
      { name: book.title },
    ]),
    buildBookSchema(book, locale),
  ];

  const formattedDate = book.publishedAt
    ? new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(book.publishedAt))
    : null;

  return (
    <LayoutShell>
      <JsonLd data={structuredData} />
      <article className="py-8">
        <div className="grid gap-8 md:grid-cols-[minmax(0,18rem)_1fr] md:gap-10">
          <div className="relative aspect-[3/4] w-full max-w-xs overflow-hidden rounded-md border border-soft-gold/40 bg-warm-bg">
            {book.coverImageUrl ? (
              <Image
                src={book.coverImageUrl}
                alt={book.coverImageAlt ?? book.title}
                fill
                sizes="(min-width: 768px) 18rem, 100vw"
                className="object-cover"
                priority
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-accent-gold/50"
                aria-hidden="true"
              >
                <BookOpen size={56} />
              </div>
            )}
          </div>

          <div>
            <h1 className="font-heading text-3xl font-bold text-deep-dark sm:text-4xl">
              {book.title}
            </h1>
            <p className="mt-3 text-lg text-text-primary/70">
              {t("by")}: {book.author}
            </p>
            {formattedDate && (
              <p className="mt-1 text-sm text-text-primary/70">
                {formattedDate}
              </p>
            )}

            <div className="mt-6">
              {book.pdfDownloadUrl ? (
                <Button
                  href={book.pdfDownloadUrl}
                  external
                  download
                  variant="primary"
                  size="lg"
                >
                  <Download size={18} aria-hidden="true" />
                  {t("downloadPdf")}
                </Button>
              ) : (
                // Broken/missing PDF reference → disabled, never a dead link.
                <Button variant="primary" size="lg" disabled>
                  <Download size={18} aria-hidden="true" />
                  {t("comingSoon")}
                </Button>
              )}
            </div>

            {book.description && (
              <div className="mt-8 whitespace-pre-line text-lg leading-relaxed text-text-primary/80">
                {book.description}
              </div>
            )}
          </div>
        </div>
      </article>
    </LayoutShell>
  );
}
