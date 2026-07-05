import type { RichTextContent } from "@/types/sanity";

// Raw `homeContent` singleton as returned by GROQ. Bilingual via the `_en`
// suffix convention; rich-text fields are Portable Text (`RichTextContent`).
//
// The rich-text fields are optional in the schema, so GROQ returns them as
// `undefined`/`null` when an editor leaves them empty. They are typed optional
// here to reflect that reality; the mapper normalizes them to `[]` so the
// domain model stays non-nullable and safe for Portable Text rendering.
export type HomeContentDocument = {
  readonly welcomeTitle: string;
  readonly welcomeTitle_en: string;
  readonly welcomeBody?: RichTextContent;
  readonly welcomeBody_en?: RichTextContent;
  readonly mainVerseText: string;
  readonly mainVerseText_en: string;
  readonly mainVerseReference: string;
  readonly mainVerseReference_en: string;
  readonly shortMessage?: RichTextContent;
  readonly shortMessage_en?: RichTextContent;
};

// Clean, locale-resolved domain model. The mapper picks the active locale, so
// the UI consumes single-language values (no `_en` fields downstream).
export type HomeContent = {
  readonly welcomeTitle: string;
  readonly welcomeBody: RichTextContent;
  readonly mainVerseText: string;
  readonly mainVerseReference: string;
  readonly shortMessage: RichTextContent;
};
