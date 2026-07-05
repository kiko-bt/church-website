// GROQ queries for the Sermons feature. Results are typed as `SermonDocument`
// and converted to the `Sermon` domain model by sermons.mappers.ts.

export const sermonListQuery = `
  *[_type == "sermon"] | order(date desc) {
    _id,
    title,
    slug,
    preacher,
    date,
    description,
    audioUrl,
    videoUrl,
    featured
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
    videoUrl,
    featured
  }
` as const;
