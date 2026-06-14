import type { RichTextContent } from "@/types/sanity";

// Future Sanity singleton document for preacher-managed homepage content.
// Localization follows the Bible data convention: a field is Macedonian by
// default, and the `_en` suffix holds the English translation.
//
// Until Sanity is wired in, the homepage renders the equivalent `home.*`
// keys from messages/mk.json and messages/en.json:
//   - welcomeTitle / welcomeBody       -> home.welcome.title / home.welcome.body
//   - mainVerseText / mainVerseReference -> home.scripture.verse / home.scripture.reference
//   - shortMessage                     -> home.cta.title / home.cta.body
export type HomeContent = {
  readonly _id: string;
  readonly _type: "homeContent";
  readonly welcomeTitle: string;
  readonly welcomeTitle_en: string;
  readonly welcomeBody: RichTextContent;
  readonly welcomeBody_en: RichTextContent;
  readonly mainVerseText: string;
  readonly mainVerseText_en: string;
  readonly mainVerseReference: string;
  readonly mainVerseReference_en: string;
  readonly shortMessage: RichTextContent;
  readonly shortMessage_en: RichTextContent;
};
