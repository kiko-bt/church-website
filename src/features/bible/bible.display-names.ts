// THE Bible book display names. This file is the only place they exist.
//
// The names below were approved by the content owner and are what production
// ships. The book JSON files hold no name — pages resolve one by book id at
// render time — so this is both the lock and the edit point.
//
// To rename a book: edit it here, then run `npm run bible:build`. The build is
// required, not optional: the search index stamps a copy of each name in so
// Fuse can match on it, and the validator fails until that copy is refreshed.
//
// The book ORDER is separate and lives in bible.constants.ts (BIBLE_CANON).

import type { Locale } from "@/constants/locales";

// Every id in BIBLE_CANON must have an entry in every locale — enforced by
// assertDisplayNamesComplete() below, which the validator and the build script
// both call, so a book can never be silently missing a name.
export const BIBLE_DISPLAY_NAMES: Record<Locale, Record<string, string>> = {
  mk: {
    // --- Old Testament ---
    genesis: "1 Мојсеева — Битие",
    exodus: "2 Мојсеева — Излез",
    leviticus: "3 Мојсеева — Левит",
    numbers: "4 Мојсеева — Броеви",
    deuteronomy: "5 Мојсеева — Второзаконие",
    joshua: "Исус Навин",
    judges: "Судии",
    ruth: "Рута",
    "1-samuel": "1 Самоил",
    "2-samuel": "2 Самоил",
    "1-kings": "1 Цареви",
    "2-kings": "2 Цареви",
    "1-chronicles": "1 Летописи",
    "2-chronicles": "2 Летописи",
    ezra: "Ездра",
    nehemiah: "Неемија",
    esther: "Естира",
    job: "Јов",
    psalms: "Псалми",
    proverbs: "Изреки",
    ecclesiastes: "Проповедник",
    "song-of-solomon": "Песна над песните",
    isaiah: "Исаија",
    jeremiah: "Еремија",
    lamentations: "Плачот на Еремија",
    ezekiel: "Езекиел",
    daniel: "Даниел",
    hosea: "Осија",
    joel: "Јоил",
    amos: "Амос",
    obadiah: "Авдија",
    jonah: "Јона",
    micah: "Михеј",
    nahum: "Наум",
    habakkuk: "Авакум",
    zephaniah: "Софонија",
    haggai: "Агеј",
    zechariah: "Захарија",
    malachi: "Малахија",
    // --- New Testament ---
    matthew: "Матеј",
    mark: "Марко",
    luke: "Лука",
    john: "Јован",
    acts: "Дела на апостолите",
    romans: "Римјаните",
    "1-corinthians": "1 Коринтјаните",
    "2-corinthians": "2 Коринтјаните",
    galatians: "Галатјаните",
    ephesians: "Ефесјаните",
    philippians: "Филипјаните",
    colossians: "Колосјаните",
    "1-thessalonians": "1 Солунјаните",
    "2-thessalonians": "2 Солунјаните",
    "1-timothy": "1 Тимотеј",
    "2-timothy": "2 Тимотеј",
    titus: "Тит",
    philemon: "Филимон",
    hebrews: "Евреите",
    james: "Јаков",
    "1-peter": "1 Петар",
    "2-peter": "2 Петар",
    "1-john": "1 Јован",
    "2-john": "2 Јован",
    "3-john": "3 Јован",
    jude: "Јуда",
    revelation: "Откровение",
  },
  en: {
    // --- Old Testament ---
    genesis: "The First Book of Moses — Genesis",
    exodus: "The Second Book of Moses — Exodus",
    leviticus: "The Third Book of Moses — Leviticus",
    numbers: "The Fourth Book of Moses — Numbers",
    deuteronomy: "The Fifth Book of Moses — Deuteronomy",
    joshua: "Joshua",
    judges: "Judges",
    ruth: "Ruth",
    "1-samuel": "First Samuel",
    "2-samuel": "Second Samuel",
    "1-kings": "First Kings",
    "2-kings": "Second Kings",
    "1-chronicles": "First Chronicles",
    "2-chronicles": "Second Chronicles",
    ezra: "Ezra",
    nehemiah: "Nehemiah",
    esther: "Esther",
    job: "Job",
    psalms: "Psalms",
    proverbs: "Proverbs",
    ecclesiastes: "Ecclesiastes",
    "song-of-solomon": "Song of Songs",
    isaiah: "Isaiah",
    jeremiah: "Jeremiah",
    lamentations: "Lamentations",
    ezekiel: "Ezekiel",
    daniel: "Daniel",
    hosea: "Hosea",
    joel: "Joel",
    amos: "Amos",
    obadiah: "Obadiah",
    jonah: "Jonah",
    micah: "Micah",
    nahum: "Nahum",
    habakkuk: "Habakkuk",
    zephaniah: "Zephaniah",
    haggai: "Haggai",
    zechariah: "Zechariah",
    malachi: "Malachi",
    // --- New Testament ---
    matthew: "Matthew",
    mark: "Mark",
    luke: "Luke",
    john: "John",
    acts: "Acts",
    romans: "Romans",
    "1-corinthians": "1 Corinthians",
    "2-corinthians": "2 Corinthians",
    galatians: "Galatians",
    ephesians: "Ephesians",
    philippians: "Philippians",
    colossians: "Colossians",
    "1-thessalonians": "1 Thessalonians",
    "2-thessalonians": "2 Thessalonians",
    "1-timothy": "1 Timothy",
    "2-timothy": "2 Timothy",
    titus: "Titus",
    philemon: "Philemon",
    hebrews: "Hebrews",
    james: "James",
    "1-peter": "1 Peter",
    "2-peter": "2 Peter",
    "1-john": "1 John",
    "2-john": "2 John",
    "3-john": "3 John",
    jude: "Jude",
    revelation: "Revelation",
  },
};

// Throws on an unknown locale or book id: callers rely on this being total over
// the canon, so a missing entry is a programming error, not something to paper
// over with a fallback.
export function getDisplayName(locale: Locale, bookId: string): string {
  const name = BIBLE_DISPLAY_NAMES[locale]?.[bookId];
  if (name === undefined) {
    throw new Error(
      `No display name for book "${bookId}" in locale "${locale}" ` +
        `(add it to src/features/bible/bible.display-names.ts).`
    );
  }
  return name;
}

// Guards that the registry covers exactly the canon, in every locale. Returns
// human-readable error strings (empty = OK) so the validator can fold them into
// its report. `canonBookIds` is passed in rather than imported so this module
// keeps zero runtime dependencies and stays cheap for a Client Component.
export function assertDisplayNamesComplete(
  locales: readonly Locale[],
  canonBookIds: readonly string[]
): string[] {
  const errors: string[] = [];
  const canonIds = new Set(canonBookIds);
  for (const locale of locales) {
    const table = BIBLE_DISPLAY_NAMES[locale];
    if (!table) {
      errors.push(`display-names: missing table for locale "${locale}"`);
      continue;
    }
    for (const id of canonIds) {
      if (!(id in table)) {
        errors.push(`display-names: ${locale} is missing book "${id}"`);
      }
    }
    for (const id of Object.keys(table)) {
      if (!canonIds.has(id)) {
        errors.push(`display-names: ${locale} has stray non-canonical id "${id}"`);
      }
    }
  }
  return errors;
}
