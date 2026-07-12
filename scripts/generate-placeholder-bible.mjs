// Placeholder Bible generator (development only).
//
// Produces a COMPLETE, structurally realistic 66-book dataset with ENTIRELY
// ORIGINAL devotional text. It never reproduces or paraphrases any real Bible
// translation. See .claude/bible-module.md for the binding rules.
//
// Output (all GENERATED ARTIFACTS — never edit by hand):
//   src/data/bible/manifest.json
//   src/data/bible/mk/<id>.json
//   src/data/bible/en/<id>.json
//
// Determinism: identical inputs always produce identical verse text and
// structure. The ONLY non-deterministic field is manifest.metadata.generatedAt
// (provenance). Run with:  npm run bible:generate
//
// Usage: node scripts/generate-placeholder-bible.mjs

import { writeFileSync, rmSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const DATA_DIR = join(process.cwd(), "src", "data", "bible");
const LOCALES = ["mk", "en"];
const MIN_VERSES_PER_CHAPTER = 12;
const MAX_VERSES_PER_CHAPTER = 38;

// ---------------------------------------------------------------------------
// Canonical book table. `chapters` are the real chapter counts (structural
// facts) so the placeholder resembles a real Bible and the production dataset
// is a shape-compatible drop-in. Names are localized display strings only.
// ---------------------------------------------------------------------------

/** @typedef {{ id: string, testament: "OT"|"NT", mk: string, en: string, chapters: number }} BookMeta */

/** @type {BookMeta[]} */
const BOOKS = [
  // --- Old Testament ---
  { id: "genesis", testament: "OT", mk: "Битие", en: "Genesis", chapters: 50 },
  { id: "exodus", testament: "OT", mk: "Излез", en: "Exodus", chapters: 40 },
  { id: "leviticus", testament: "OT", mk: "Левит", en: "Leviticus", chapters: 27 },
  { id: "numbers", testament: "OT", mk: "Броеви", en: "Numbers", chapters: 36 },
  { id: "deuteronomy", testament: "OT", mk: "Второзаконие", en: "Deuteronomy", chapters: 34 },
  { id: "joshua", testament: "OT", mk: "Исус Навин", en: "Joshua", chapters: 24 },
  { id: "judges", testament: "OT", mk: "Судии", en: "Judges", chapters: 21 },
  { id: "ruth", testament: "OT", mk: "Рут", en: "Ruth", chapters: 4 },
  { id: "1-samuel", testament: "OT", mk: "Прва Самоилова", en: "1 Samuel", chapters: 31 },
  { id: "2-samuel", testament: "OT", mk: "Втора Самоилова", en: "2 Samuel", chapters: 24 },
  { id: "1-kings", testament: "OT", mk: "Прва Царства", en: "1 Kings", chapters: 22 },
  { id: "2-kings", testament: "OT", mk: "Втора Царства", en: "2 Kings", chapters: 25 },
  { id: "1-chronicles", testament: "OT", mk: "Прва Летописи", en: "1 Chronicles", chapters: 29 },
  { id: "2-chronicles", testament: "OT", mk: "Втора Летописи", en: "2 Chronicles", chapters: 36 },
  { id: "ezra", testament: "OT", mk: "Езра", en: "Ezra", chapters: 10 },
  { id: "nehemiah", testament: "OT", mk: "Неемија", en: "Nehemiah", chapters: 13 },
  { id: "esther", testament: "OT", mk: "Естира", en: "Esther", chapters: 10 },
  { id: "job", testament: "OT", mk: "Јов", en: "Job", chapters: 42 },
  { id: "psalms", testament: "OT", mk: "Псалми", en: "Psalms", chapters: 150 },
  { id: "proverbs", testament: "OT", mk: "Изреки", en: "Proverbs", chapters: 31 },
  { id: "ecclesiastes", testament: "OT", mk: "Проповедник", en: "Ecclesiastes", chapters: 12 },
  { id: "song-of-solomon", testament: "OT", mk: "Песна над песните", en: "Song of Solomon", chapters: 8 },
  { id: "isaiah", testament: "OT", mk: "Исаија", en: "Isaiah", chapters: 66 },
  { id: "jeremiah", testament: "OT", mk: "Еремија", en: "Jeremiah", chapters: 52 },
  { id: "lamentations", testament: "OT", mk: "Плач Еремиин", en: "Lamentations", chapters: 5 },
  { id: "ezekiel", testament: "OT", mk: "Езекиел", en: "Ezekiel", chapters: 48 },
  { id: "daniel", testament: "OT", mk: "Даниел", en: "Daniel", chapters: 12 },
  { id: "hosea", testament: "OT", mk: "Осија", en: "Hosea", chapters: 14 },
  { id: "joel", testament: "OT", mk: "Јоил", en: "Joel", chapters: 3 },
  { id: "amos", testament: "OT", mk: "Амос", en: "Amos", chapters: 9 },
  { id: "obadiah", testament: "OT", mk: "Авдиј", en: "Obadiah", chapters: 1 },
  { id: "jonah", testament: "OT", mk: "Јона", en: "Jonah", chapters: 4 },
  { id: "micah", testament: "OT", mk: "Михеј", en: "Micah", chapters: 7 },
  { id: "nahum", testament: "OT", mk: "Наум", en: "Nahum", chapters: 3 },
  { id: "habakkuk", testament: "OT", mk: "Авакум", en: "Habakkuk", chapters: 3 },
  { id: "zephaniah", testament: "OT", mk: "Софонија", en: "Zephaniah", chapters: 3 },
  { id: "haggai", testament: "OT", mk: "Агеј", en: "Haggai", chapters: 2 },
  { id: "zechariah", testament: "OT", mk: "Захарија", en: "Zechariah", chapters: 14 },
  { id: "malachi", testament: "OT", mk: "Малахија", en: "Malachi", chapters: 4 },
  // --- New Testament ---
  { id: "matthew", testament: "NT", mk: "Матеј", en: "Matthew", chapters: 28 },
  { id: "mark", testament: "NT", mk: "Марко", en: "Mark", chapters: 16 },
  { id: "luke", testament: "NT", mk: "Лука", en: "Luke", chapters: 24 },
  { id: "john", testament: "NT", mk: "Јован", en: "John", chapters: 21 },
  { id: "acts", testament: "NT", mk: "Дела на апостолите", en: "Acts", chapters: 28 },
  { id: "romans", testament: "NT", mk: "Римјаните", en: "Romans", chapters: 16 },
  { id: "1-corinthians", testament: "NT", mk: "Прва Коринтјаните", en: "1 Corinthians", chapters: 16 },
  { id: "2-corinthians", testament: "NT", mk: "Втора Коринтјаните", en: "2 Corinthians", chapters: 13 },
  { id: "galatians", testament: "NT", mk: "Галатјаните", en: "Galatians", chapters: 6 },
  { id: "ephesians", testament: "NT", mk: "Ефесјаните", en: "Ephesians", chapters: 6 },
  { id: "philippians", testament: "NT", mk: "Филипјаните", en: "Philippians", chapters: 4 },
  { id: "colossians", testament: "NT", mk: "Колосјаните", en: "Colossians", chapters: 4 },
  { id: "1-thessalonians", testament: "NT", mk: "Прва Солунјаните", en: "1 Thessalonians", chapters: 5 },
  { id: "2-thessalonians", testament: "NT", mk: "Втора Солунјаните", en: "2 Thessalonians", chapters: 3 },
  { id: "1-timothy", testament: "NT", mk: "Прва Тимотеј", en: "1 Timothy", chapters: 6 },
  { id: "2-timothy", testament: "NT", mk: "Втора Тимотеј", en: "2 Timothy", chapters: 4 },
  { id: "titus", testament: "NT", mk: "Тит", en: "Titus", chapters: 3 },
  { id: "philemon", testament: "NT", mk: "Филимон", en: "Philemon", chapters: 1 },
  { id: "hebrews", testament: "NT", mk: "Евреите", en: "Hebrews", chapters: 13 },
  { id: "james", testament: "NT", mk: "Јаков", en: "James", chapters: 5 },
  { id: "1-peter", testament: "NT", mk: "Прва Петрово", en: "1 Peter", chapters: 5 },
  { id: "2-peter", testament: "NT", mk: "Втора Петрово", en: "2 Peter", chapters: 3 },
  { id: "1-john", testament: "NT", mk: "Прва Јованово", en: "1 John", chapters: 5 },
  { id: "2-john", testament: "NT", mk: "Втора Јованово", en: "2 John", chapters: 1 },
  { id: "3-john", testament: "NT", mk: "Трета Јованово", en: "3 John", chapters: 1 },
  { id: "jude", testament: "NT", mk: "Јуда", en: "Jude", chapters: 1 },
  { id: "revelation", testament: "NT", mk: "Откровение", en: "Revelation", chapters: 22 },
];

// ---------------------------------------------------------------------------
// Deterministic PRNG (xmur3 seed → mulberry32). Same seed ⇒ same sequence.
// ---------------------------------------------------------------------------

function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededRng(seed) {
  return mulberry32(xmur3(seed)());
}

function pick(rng, items) {
  return items[Math.floor(rng() * items.length)];
}

function intBetween(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

// ---------------------------------------------------------------------------
// Original devotional text banks. Reverent in tone, generic in content —
// deliberately NOT scripture. Kept per-locale and independent (the two locales
// are different "translations", not translations of each other).
// ---------------------------------------------------------------------------

const EN = {
  subjects: [
    "The faithful",
    "The people",
    "The righteous",
    "Those who trust",
    "The humble",
    "Every willing heart",
    "The gathered assembly",
    "All who listen",
    "The steadfast",
    "The children of promise",
  ],
  verbs: [
    "rejoice",
    "give thanks",
    "remember",
    "take courage",
    "find rest",
    "walk humbly",
    "lift up their voices",
    "hold fast",
    "press onward",
    "bow in reverence",
  ],
  connectors: [
    "knowing that",
    "remembering that",
    "trusting that",
    "for",
    "because",
    "and",
  ],
  statements: [
    "mercy is shown to those who seek wisdom",
    "hope is renewed with each new morning",
    "peace settles upon the patient heart",
    "the humble are lifted in their season",
    "light is given to those who walk in truth",
    "the weary are strengthened by quiet trust",
    "kindness returns to the one who gives it freely",
    "understanding grows where the heart stays open",
    "faith is made strong through steady obedience",
    "the generous find joy that does not fade",
    "grace meets the one who waits with courage",
    "a gentle answer turns away the storm",
  ],
};

const MK = {
  subjects: [
    "Верните",
    "Луѓето",
    "Праведните",
    "Оние што се надеваат",
    "Смирените",
    "Секое отворено срце",
    "Собраното мноштво",
    "Сите што слушаат",
    "Постојаните",
    "Децата на ветувањето",
  ],
  verbs: [
    "се радуваат",
    "благодарат",
    "се сеќаваат",
    "добиваат сила",
    "наоѓаат мир",
    "одат смирено",
    "ги подигаат своите гласови",
    "се држат цврсто",
    "продолжуваат напред",
    "се поклонуваат со почит",
  ],
  connectors: [
    "знаејќи дека",
    "сеќавајќи се дека",
    "верувајќи дека",
    "зашто",
    "бидејќи",
    "и",
  ],
  statements: [
    "милоста се покажува кон оние што бараат мудрост",
    "надежта се обновува со секое ново утро",
    "мирот се спушта врз трпеливото срце",
    "смирените се подигаат во своето време",
    "светлина им се дава на оние што одат во вистина",
    "изморените се засилуваат преку тивка доверба",
    "добрината се враќа кон оној што дава дарежливо",
    "разбирањето расте таму каде срцето останува отворено",
    "верата станува силна преку постојана послушност",
    "дарежливите наоѓаат радост што не бледнее",
    "благодатта го пресретнува оној што чека со храброст",
    "благиот одговор ја одвраќа бурата",
  ],
};

const CONJUNCTION = { en: "and", mk: "и" };

// Build one original devotional verse. `rng` makes it deterministic; length
// varies (one or two clauses) to mimic realistic verse cadence.
function buildVerse(rng, locale) {
  const bank = locale === "mk" ? MK : EN;
  const subject = pick(rng, bank.subjects);
  const verb = pick(rng, bank.verbs);
  const connector = pick(rng, bank.connectors);
  const first = pick(rng, bank.statements);

  let text = `${subject} ${verb}, ${connector} ${first}`;
  if (rng() < 0.5) {
    let second = pick(rng, bank.statements);
    while (second === first) second = pick(rng, bank.statements);
    text += `, ${CONJUNCTION[locale]} ${second}`;
  }
  return `${text}.`;
}

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

// Verse counts are locale-independent structure, so both locales share them.
function verseCountsFor(book) {
  const counts = [];
  for (let chapter = 1; chapter <= book.chapters; chapter++) {
    const rng = seededRng(`counts:${book.id}:${chapter}`);
    counts.push(intBetween(rng, MIN_VERSES_PER_CHAPTER, MAX_VERSES_PER_CHAPTER));
  }
  return counts;
}

function buildBookFile(book, locale, verseCounts) {
  const chapters = verseCounts.map((verseCount, chapterIndex) => {
    const chapterNumber = chapterIndex + 1;
    const verses = [];
    for (let verseNumber = 1; verseNumber <= verseCount; verseNumber++) {
      const rng = seededRng(`${locale}:${book.id}:${chapterNumber}:${verseNumber}`);
      verses.push({ number: verseNumber, text: buildVerse(rng, locale) });
    }
    return { number: chapterNumber, verses };
  });

  return {
    id: book.id,
    name: book[locale],
    testament: book.testament,
    chapters,
  };
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function main() {
  // This script writes ONLY the per-book files. The manifest and search indexes
  // are derived from those files by build-bible-artifacts.ts, so the same
  // derivation runs for placeholder and real data alike (see `npm run bible:build`).
  for (const locale of LOCALES) {
    const dir = join(DATA_DIR, locale);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
  }

  let totalVerses = 0;
  let totalChapters = 0;

  for (const book of BOOKS) {
    const verseCounts = verseCountsFor(book);
    totalChapters += verseCounts.length;
    totalVerses += verseCounts.reduce((sum, n) => sum + n, 0);

    for (const locale of LOCALES) {
      writeJson(
        join(DATA_DIR, locale, `${book.id}.json`),
        buildBookFile(book, locale, verseCounts)
      );
    }
  }

  console.log(
    `Generated ${BOOKS.length} placeholder book files per locale ` +
      `(${LOCALES.join(", ")}), ${totalChapters} chapters, ${totalVerses} verses. ` +
      "Run `npm run bible:build` to derive the manifest + search indexes."
  );
}

main();
