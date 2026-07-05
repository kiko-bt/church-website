import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/constants/locales";
import { getGalleryAlbums, getGalleryAlbumBySlug } from "@/features/gallery";
import { generateBaseMetadata, toMetaDescription } from "@/lib/seo/metadata";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";

type GalleryAlbumPageProps = {
  params: Promise<{ locale: Locale; slug: string }>;
};

// Prerender every album at build time (per locale, via the parent segment).
// Empty when Sanity is not configured — new albums are then generated
// on-demand and cached (ISR), so publishing never requires a redeploy.
// Mirrors the Books/Sermons implementation exactly.
export async function generateStaticParams() {
  const albums = await getGalleryAlbums();
  return albums.map((album) => ({ slug: album.slug }));
}

export async function generateMetadata({
  params,
}: GalleryAlbumPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const album = await getGalleryAlbumBySlug(slug);
  const path = `/gallery/${slug}`;

  // Unknown slug → generic base metadata (the page itself renders a 404).
  if (!album) return generateBaseMetadata(locale, path);

  // Reuse the shared SEO helper (canonical, hreflang, robots, churchSettings
  // brand + OG defaults); override only the album-specific fields. The album
  // cover (first image) serves as the OG image when present.
  return generateBaseMetadata(locale, path, {
    title: album.title,
    description: toMetaDescription(album.description),
    image: album.coverImageUrl
      ? { url: album.coverImageUrl, alt: album.coverImageAlt ?? album.title }
      : undefined,
  });
}

export default async function GalleryAlbumPage({
  params,
}: GalleryAlbumPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("gallery");

  // Cached, tag-revalidated accessor (deduped with generateMetadata's call).
  const album = await getGalleryAlbumBySlug(slug);
  if (!album) notFound();

  // `date` is optional; format it for the active locale when present.
  const formattedDate = album.date
    ? new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(album.date))
    : null;

  return (
    <LayoutShell>
      <article className="py-8">
        <header className="mx-auto max-w-3xl">
          <h1 className="font-heading text-3xl font-bold text-deep-dark sm:text-4xl">
            {album.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-text-primary/70">
            {formattedDate && <span>{formattedDate}</span>}
            {formattedDate && <span aria-hidden="true">·</span>}
            <span>{t("photoCount", { count: album.images.length })}</span>
          </div>

          {album.description && (
            <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-text-primary/80">
              {album.description}
            </p>
          )}
        </header>

        <div className="mt-10">
          <GalleryGrid images={album.images} />
        </div>
      </article>
    </LayoutShell>
  );
}
