// The canonical book ORDER and identity of the Bible module.
//
// Nothing here is localized — display names live in bible.display-names.ts.
// This file holds only the facts that define routing and identity: the stable
// URL slug (`id`), the 1-based position in the canon (`order`), and the
// testament. Those are the same for any translation of the 66-book canon.
//
// This order is FIXED. `scripts/validate-bible.ts` fails the build if the
// manifest disagrees with it, and bible.display-names.test.ts asserts it.

export type Testament = "OT" | "NT";

type CanonBook = {
  readonly id: string;
  readonly order: number;
  readonly testament: Testament;
};

// The Protestant 66-book canon in canonical order (39 OT + 27 NT). Slugs are
// lowercase and hyphen-separated; they are identifiers, never display text, and
// are NEVER translated.
export const BIBLE_CANON: readonly CanonBook[] = [
  // --- Old Testament (39) ---
  { id: "genesis", order: 1, testament: "OT" },
  { id: "exodus", order: 2, testament: "OT" },
  { id: "leviticus", order: 3, testament: "OT" },
  { id: "numbers", order: 4, testament: "OT" },
  { id: "deuteronomy", order: 5, testament: "OT" },
  { id: "joshua", order: 6, testament: "OT" },
  { id: "judges", order: 7, testament: "OT" },
  { id: "ruth", order: 8, testament: "OT" },
  { id: "1-samuel", order: 9, testament: "OT" },
  { id: "2-samuel", order: 10, testament: "OT" },
  { id: "1-kings", order: 11, testament: "OT" },
  { id: "2-kings", order: 12, testament: "OT" },
  { id: "1-chronicles", order: 13, testament: "OT" },
  { id: "2-chronicles", order: 14, testament: "OT" },
  { id: "ezra", order: 15, testament: "OT" },
  { id: "nehemiah", order: 16, testament: "OT" },
  { id: "esther", order: 17, testament: "OT" },
  { id: "job", order: 18, testament: "OT" },
  { id: "psalms", order: 19, testament: "OT" },
  { id: "proverbs", order: 20, testament: "OT" },
  { id: "ecclesiastes", order: 21, testament: "OT" },
  { id: "song-of-solomon", order: 22, testament: "OT" },
  { id: "isaiah", order: 23, testament: "OT" },
  { id: "jeremiah", order: 24, testament: "OT" },
  { id: "lamentations", order: 25, testament: "OT" },
  { id: "ezekiel", order: 26, testament: "OT" },
  { id: "daniel", order: 27, testament: "OT" },
  { id: "hosea", order: 28, testament: "OT" },
  { id: "joel", order: 29, testament: "OT" },
  { id: "amos", order: 30, testament: "OT" },
  { id: "obadiah", order: 31, testament: "OT" },
  { id: "jonah", order: 32, testament: "OT" },
  { id: "micah", order: 33, testament: "OT" },
  { id: "nahum", order: 34, testament: "OT" },
  { id: "habakkuk", order: 35, testament: "OT" },
  { id: "zephaniah", order: 36, testament: "OT" },
  { id: "haggai", order: 37, testament: "OT" },
  { id: "zechariah", order: 38, testament: "OT" },
  { id: "malachi", order: 39, testament: "OT" },
  // --- New Testament (27) ---
  { id: "matthew", order: 40, testament: "NT" },
  { id: "mark", order: 41, testament: "NT" },
  { id: "luke", order: 42, testament: "NT" },
  { id: "john", order: 43, testament: "NT" },
  { id: "acts", order: 44, testament: "NT" },
  { id: "romans", order: 45, testament: "NT" },
  { id: "1-corinthians", order: 46, testament: "NT" },
  { id: "2-corinthians", order: 47, testament: "NT" },
  { id: "galatians", order: 48, testament: "NT" },
  { id: "ephesians", order: 49, testament: "NT" },
  { id: "philippians", order: 50, testament: "NT" },
  { id: "colossians", order: 51, testament: "NT" },
  { id: "1-thessalonians", order: 52, testament: "NT" },
  { id: "2-thessalonians", order: 53, testament: "NT" },
  { id: "1-timothy", order: 54, testament: "NT" },
  { id: "2-timothy", order: 55, testament: "NT" },
  { id: "titus", order: 56, testament: "NT" },
  { id: "philemon", order: 57, testament: "NT" },
  { id: "hebrews", order: 58, testament: "NT" },
  { id: "james", order: 59, testament: "NT" },
  { id: "1-peter", order: 60, testament: "NT" },
  { id: "2-peter", order: 61, testament: "NT" },
  { id: "1-john", order: 62, testament: "NT" },
  { id: "2-john", order: 63, testament: "NT" },
  { id: "3-john", order: 64, testament: "NT" },
  { id: "jude", order: 65, testament: "NT" },
  { id: "revelation", order: 66, testament: "NT" },
] as const;
