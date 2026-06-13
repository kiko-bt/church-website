// GROQ query definitions for the Books feature.
// Activate after configuring src/lib/sanity/client.ts.

export const bookListQuery = `
  *[_type == "book"] | order(title asc) {
    _id,
    title,
    slug,
    author,
    description,
    pdfAsset,
    coverImage
  }
` as const;

export const bookBySlugQuery = `
  *[_type == "book" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    author,
    description,
    pdfAsset,
    coverImage
  }
` as const;
