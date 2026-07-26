// LOCKED canonical Bible book display names — the permanent source of truth.
//
// These names and their order are FIXED and MUST NOT be changed. They were
// approved by the content owner (the preacher) and are what production ships.
// Order is defined by BIBLE_CANON (bible.constants.ts); this file defines the
// localized *display name* for every book in every locale.
//
// Why this file exists (do not delete it):
//   The Bible dataset is (re)generated from the preacher's raw delivery by
//   `scripts/migrate-client-bible.ts`. That raw delivery uses DIFFERENT, longer
//   book names (e.g. "Евангелие според Матеј", "Послание до Римјаните"), so
//   every re-migration or re-import USED TO overwrite the approved names and
//   silently revert them. This registry is the single authority the migration
//   stamps into the book files, and `scripts/validate-bible.ts` fails the build
//   if any book file's name drifts from it. Together that makes the names
//   immutable: a wrong name can never reach production, and a re-migration
//   produces the correct names automatically.
//
// To change a name you MUST edit it here (and only here), then run
// `npm run bible:build`. Nowhere else. See .claude/bible-module.md §3.

import type { Locale } from "@/constants/locales";

// Per-locale display name for every canonical book id. Every id in BIBLE_CANON
// MUST have an entry in every locale — enforced by assertDisplayNamesComplete()
// (called by the validator and the build script) so a newly added book cannot
// be forgotten here.
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

// The locked display name for one book in one locale. Throws if either the
// locale or the book id is unknown — callers rely on this being total over the
// canon, so a missing entry is a programming error, not a runtime fallback.
export function getDisplayName(locale: Locale, bookId: string): string {
  const name = BIBLE_DISPLAY_NAMES[locale]?.[bookId];
  if (name === undefined) {
    throw new Error(
      `No locked display name for book "${bookId}" in locale "${locale}" ` +
        `(add it to src/features/bible/bible.display-names.ts).`
    );
  }
  return name;
}

// Guards that the registry covers exactly the canon, in every locale: every
// canonical book has a name, and there are no stray entries for unknown ids.
// Returns human-readable error strings (empty = OK) so the validator can fold
// them into its report. Also called by the build script. `canonBookIds` is the
// list of BIBLE_CANON ids, passed in so this module has no runtime dependency
// on bible.constants (keeping it safe to run under the plain Node scripts).
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
