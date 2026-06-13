// GROQ query definitions for the Gallery feature.
// Activate after configuring src/lib/sanity/client.ts.

export const galleryQuery = `
  *[_type == "galleryImage"] | order(date desc) {
    _id,
    title,
    image,
    date
  }
` as const;
