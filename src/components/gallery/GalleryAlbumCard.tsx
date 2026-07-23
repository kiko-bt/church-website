import Link from "next/link";
import Image from "next/image";
import { Images } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/constants/locales";
import type { GalleryAlbum } from "@/features/gallery";

type GalleryAlbumCardProps = {
  album: GalleryAlbum;
  locale: Locale;
};

/**
 * Presentational card for a single gallery album in the listing. `album` is a
 * mapped domain model from `getGalleryAlbums()` (@/features/gallery).
 *
 * The cover is the album's first image (resolved in the mapper), rendered with
 * next/image inside a fixed 4:3 box (no CLS). Albums without a usable cover
 * fall back to a typographic placeholder.
 */
export async function GalleryAlbumCard({ album, locale }: GalleryAlbumCardProps) {
  const t = await getTranslations("gallery");

  // `date` is an optional ISO date string; format it for the active locale,
  // matching the books/sermons listing convention.
  const formattedDate = album.date
    ? new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(album.date))
    : null;

  return (
    <Link
      href={`/${locale}/gallery/${album.slug}`}
      className="group flex flex-col overflow-hidden rounded-md border border-soft-gold/40 bg-background transition-all duration-300 hover:border-accent-gold/60 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-warm-bg">
        {/* Sits behind the image: a loading placeholder while the cover fetches,
            and the fallback when an album has no usable cover. */}
        <div
          className="absolute inset-0 flex items-center justify-center text-accent-gold/30"
          aria-hidden="true"
        >
          <Images size={40} />
        </div>
        {album.coverImageUrl && (
          <Image
            src={album.coverImageUrl}
            alt={album.coverImageAlt ?? album.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h2 className="font-heading text-lg font-semibold text-deep-dark group-hover:text-accent-gold-strong">
          {album.title}
        </h2>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-text-primary/70">
          {formattedDate && <span>{formattedDate}</span>}
          {formattedDate && <span aria-hidden="true">·</span>}
          <span>{t("photoCount", { count: album.images.length })}</span>
        </div>
      </div>
    </Link>
  );
}
