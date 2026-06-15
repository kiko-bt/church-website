import { ImageIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { GalleryImage } from "@/features/gallery";
import { EmptyState } from "@/components/ui/EmptyState";

type GalleryGridProps = {
  images: readonly GalleryImage[];
};

/**
 * Responsive masonry-like grid of gallery images with a built-in empty state.
 *
 * Future CMS integration point: the page will pass the result of
 * `galleryListQuery` (@/features/gallery) here, and each `image` will be
 * resolved through the Sanity image URL builder once the client is active.
 * Until then an empty array is passed and the empty state is shown.
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
          key={image._id}
          className="group relative aspect-square overflow-hidden rounded-md bg-warm-bg"
        >
          {/* Placeholder until the Sanity image URL builder is wired in. */}
          <div
            className="flex h-full w-full items-center justify-center text-accent-gold/40"
            aria-hidden="true"
          >
            <ImageIcon size={32} />
          </div>
          {image.title && (
            <span className="absolute inset-x-0 bottom-0 bg-deep-dark/70 px-3 py-2 text-xs font-medium text-background">
              {image.title}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
