import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { GalleryImageItem } from "@/features/gallery";
import { EmptyState } from "@/components/ui/EmptyState";

type GalleryGridProps = {
  images: readonly GalleryImageItem[];
};

/**
 * Responsive photo grid for a single album's images, with a built-in empty
 * state. Each item is a mapped `GalleryImageItem` (resolved Sanity CDN URL +
 * required alt) from `getGalleryAlbumBySlug()` (@/features/gallery), rendered
 * with next/image inside a fixed square box (no CLS). An optional caption is
 * overlaid at the bottom.
 */
export async function GalleryGrid({ images }: GalleryGridProps) {
  const t = await getTranslations("gallery");

  if (images.length === 0) {
    return (
      <EmptyState
        icon={ImageIcon}
        title={t("empty.title")}
        description={t("empty.description")}
      />
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      {images.map((image) => (
        <li
          key={image.key}
          className="group relative aspect-square overflow-hidden rounded-md bg-warm-bg"
        >
          {/* Loading placeholder behind the photo; the loaded image covers it. */}
          <div
            className="absolute inset-0 flex items-center justify-center text-accent-gold/30"
            aria-hidden="true"
          >
            <ImageIcon size={28} />
          </div>
          <Image
            src={image.url}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
          {image.caption && (
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-deep-dark/80 to-transparent px-3 pb-2 pt-6 text-xs font-medium text-background">
              {image.caption}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
