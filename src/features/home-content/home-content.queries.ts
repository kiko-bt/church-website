// GROQ query for the Home Content singleton.
// Activate after configuring src/lib/sanity/client.ts.

export const homeContentQuery = `
  *[_type == "homeContent"][0] {
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
