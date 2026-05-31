// GROQ query definitions for Sanity CMS.
// Activate after configuring src/lib/sanity/client.ts.

export const sermonListQuery = `
  *[_type == "sermon"] | order(date desc) {
    _id,
    title,
    slug,
    preacher,
    date,
    description
  }
` as const;

export const sermonBySlugQuery = `
  *[_type == "sermon" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    preacher,
    date,
    description,
    audioUrl,
    videoUrl
  }
` as const;

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

export const galleryQuery = `
  *[_type == "galleryImage"] | order(date desc) {
    _id,
    title,
    image,
    date
  }
` as const;

export const churchSettingsQuery = `
  *[_type == "churchSettings"][0] {
    churchName,
    address,
    email,
    phone,
    facebook,
    youtube,
    serviceSchedule
  }
` as const;
