// GROQ queries for the Gallery feature. Albums embed their images as an array
// of `imageWithAlt`; each image asset is dereferenced to a URL here.

export const galleryListQuery = `
  *[_type == "galleryAlbum"] | order(coalesce(date, _createdAt) desc) {
    _id,
    title,
    slug,
    description,
    date,
    featured,
    images[]{ _key, "url": asset->url, alt, caption }
  }
` as const;

export const galleryAlbumBySlugQuery = `
  *[_type == "galleryAlbum" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    description,
    date,
    featured,
    images[]{ _key, "url": asset->url, alt, caption }
  }
` as const;
