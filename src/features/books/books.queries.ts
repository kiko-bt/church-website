// GROQ queries for the Books feature. The PDF file asset and cover image are
// dereferenced to URLs here so the domain model never carries raw asset refs.

export const bookListQuery = `
  *[_type == "book"] | order(coalesce(publishedAt, _createdAt) desc) {
    _id,
    title,
    slug,
    author,
    description,
    "pdfUrl": pdfFile.asset->url,
    coverImage{ "url": asset->url, alt },
    publishedAt,
    featured
  }
` as const;

export const bookBySlugQuery = `
  *[_type == "book" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    author,
    description,
    "pdfUrl": pdfFile.asset->url,
    coverImage{ "url": asset->url, alt },
    publishedAt,
    featured
  }
` as const;
