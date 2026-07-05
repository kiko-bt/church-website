// GROQ query for the Church Settings singleton. Both language variants of the
// service schedule and SEO copy are fetched; the mapper resolves the locale.
//
// Bound to the fixed document id pinned by the desk structure
// (sanity/structure.ts) rather than `[0]`, so the query is deterministic even
// if a stray document of this type is ever created outside the Studio UI.

export const churchSettingsQuery = `
  *[_id == "churchSettings"][0] {
    _id,
    churchName,
    address,
    email,
    phone,
    serviceSchedule,
    serviceSchedule_en,
    social,
    seo{
      metaTitle,
      metaTitle_en,
      metaDescription,
      metaDescription_en,
      ogImage{ "url": asset->url, alt }
    }
  }
` as const;
