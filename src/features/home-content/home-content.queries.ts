// GROQ query for the Home Content singleton. Both language variants are
// fetched; the mapper resolves the active locale.
//
// Bound to the fixed document id pinned by the desk structure
// (sanity/structure.ts) rather than `[0]`, so the query is deterministic even
// if a stray document of this type is ever created outside the Studio UI.

export const homeContentQuery = `
  *[_id == "homeContent"][0] {
    welcomeTitle,
    welcomeTitle_en,
    welcomeBody,
    welcomeBody_en,
    mainVerseText,
    mainVerseText_en,
    mainVerseReference,
    mainVerseReference_en,
    shortMessage,
    shortMessage_en
  }
` as const;
