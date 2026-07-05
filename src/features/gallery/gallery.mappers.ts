import type {
  GalleryAlbum,
  GalleryAlbumDocument,
  GalleryImageItem,
} from "./gallery.types";

// Maps a raw album document to the domain model. Images without a resolved URL
// (e.g. a missing asset) are dropped; the cover is the first remaining image.
export function mapGalleryAlbum(doc: GalleryAlbumDocument): GalleryAlbum {
  const images: readonly GalleryImageItem[] = (doc.images ?? [])
    .filter((img): img is typeof img & { url: string } => Boolean(img.url))
    .map((img) => ({
      key: img._key,
      url: img.url,
      alt: img.alt,
      caption: img.caption,
    }));

  const cover = images[0];

  return {
    id: doc._id,
    slug: doc.slug.current,
    title: doc.title,
    description: doc.description,
    date: doc.date,
    featured: doc.featured ?? false,
    images,
    coverImageUrl: cover?.url,
    coverImageAlt: cover?.alt,
  };
}

export function mapGalleryAlbums(
  docs: readonly GalleryAlbumDocument[]
): readonly GalleryAlbum[] {
  return docs.map(mapGalleryAlbum);
}
