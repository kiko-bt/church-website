import { Images } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/constants/locales";
import type { GalleryAlbum } from "@/features/gallery";
import { EmptyState } from "@/components/ui/EmptyState";
import { GalleryAlbumCard } from "./GalleryAlbumCard";

type GalleryAlbumsGridProps = {
  albums: readonly GalleryAlbum[];
  locale: Locale;
};

/**
 * Responsive grid of gallery albums with a built-in empty state. The page
 * passes the result of `getGalleryAlbums()` (@/features/gallery); an empty list
 * renders the empty state (also the fallback when Sanity is not configured).
 */
export async function GalleryAlbumsGrid({
  albums,
  locale,
}: GalleryAlbumsGridProps) {
  const t = await getTranslations("gallery");

  if (albums.length === 0) {
    return (
      <EmptyState
        icon={Images}
        title={t("empty.title")}
        description={t("empty.description")}
      />
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {albums.map((album) => (
        <li key={album.id}>
          <GalleryAlbumCard album={album} locale={locale} />
        </li>
      ))}
    </ul>
  );
}
