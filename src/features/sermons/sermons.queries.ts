// GROQ query definitions for the Sermons feature.
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
