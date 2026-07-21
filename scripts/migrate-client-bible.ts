// Migrates the preacher's COMPLETE Bible delivery — two files, one per
// testament — into the project's per-book dataset, and fetches the matching
// English (WEB) books, in one reproducible run.
//
// This is the bulk counterpart to scripts/import-bible-book.ts (which handles
// a single book). It applies exactly the same rules: same schema, same canon,
// same known-omission healing, same "English is a real independent translation,
// never a machine translation" guarantee (.claude/bible-module.md §1, §4).
//
// What it does:
//   1. Reads the two client files (Old Testament + New Testament).
//   2. Splits them into one file per canonical book and drops every field the
//      schema does not allow (shortName, slug, order, and the file-level
//      metadata block).
//   3. Maps the client's testament values ("old"/"new") to the project's
//      ("OT"/"NT") and corrects non-canonical book ids (song-of-songs ->
//      song-of-solomon). Display names are taken from the client verbatim.
//   4. Heals the known critical-text verse omissions with the shared editorial
//      note. ANY other gap is a hard stop — never silently filled.
//   5. Repairs Latin/Cyrillic homoglyph contamination: the client's New
//      Testament encodes сѐ/нѐ with LATIN "è" (U+00E8) instead of CYRILLIC "ѐ"
//      (U+0450), which breaks Fuse.js search and produces mixed-script words.
//      Only that substitution, only inside otherwise-Cyrillic words. No word,
//      letter or punctuation mark is otherwise altered.
//   6. Fetches each book from the World English Bible via bible-api.com into a
//      local cache (resumable — the API rate-limits aggressively), then checks
//      mk/en versification agrees chapter by chapter before writing anything.
//
// It writes src/data/bible/{mk,en}/<book-id>.json. It does NOT build the
// manifest or search indexes — run `npm run bible:build` afterwards so you see
// the validator's output directly.
//
// Usage:
//   npm run bible:migrate -- <old-testament.json> <new-testament.json>

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import {
  bookFileSchema,
  type ParsedBookFile,
} from "../src/features/bible/bible.schema.ts";
import { BIBLE_CANON, type Testament } from "../src/features/bible/bible.constants.ts";
import { KNOWN_OMITTED_VERSES, OMITTED_NOTE_MK, OMITTED_NOTE_EN } from "./bible-omissions.ts";
import { ENGLISH_REALIGNMENTS } from "./bible-versification.ts";

const DATA_DIR = resolve(process.cwd(), "src", "data", "bible");
const CACHE_DIR = resolve(process.cwd(), ".bible-web-cache");

// The client's file-level "testament" vocabulary -> the project's.
const TESTAMENT_MAP: Record<string, Testament> = { old: "OT", new: "NT" };

// Book ids the client used that differ from the project's canonical slug.
// Identity only — never a change to the book's contents or display name.
const ID_CORRECTIONS: Record<string, string> = {
  "song-of-songs": "song-of-solomon",
};

const LATIN_E_GRAVE = "è"; // è
const CYRILLIC_E_GRAVE = "ѐ"; // ѐ
const CYRILLIC_RE = /[Ѐ-ӿ]/;

type ClientVerse = { verse: number; text: string };
type ClientChapter = { chapter: number; verses: ClientVerse[] };
type ClientBook = {
  id: string;
  name: string;
  testament: string;
  chapters: ClientChapter[];
};
type ClientFile = { testament: string; books: ClientBook[] };

function fail(message: string): never {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// Collapses whitespace (a no-op on a clean source, kept identical to
// import-bible-book.ts) and repairs the homoglyph described in step 5 above.
function normalizeText(raw: string, stats: { egraveChars: number; egraveVerses: number }): string {
  const collapsed = raw.replace(/\s+/g, " ").trim();
  if (!collapsed.includes(LATIN_E_GRAVE)) return collapsed;

  let changed = 0;
  const repaired = collapsed.replace(/\p{L}+/gu, (word) => {
    if (!word.includes(LATIN_E_GRAVE) || !CYRILLIC_RE.test(word)) return word;
    changed += word.split(LATIN_E_GRAVE).length - 1;
    return word.replaceAll(LATIN_E_GRAVE, CYRILLIC_E_GRAVE);
  });
  if (changed > 0) {
    stats.egraveChars += changed;
    stats.egraveVerses += 1;
  }
  return repaired;
}

// --- Step 1-5: the Macedonian side ----------------------------------------

function migrateBook(
  src: ClientBook,
  stats: { egraveChars: number; egraveVerses: number },
  dropped: Set<string>,
  healed: string[]
): ParsedBookFile {
  const id = ID_CORRECTIONS[src.id] ?? src.id;
  const canonBook = BIBLE_CANON.find((book) => book.id === id);
  if (!canonBook) {
    fail(
      `"${src.id}" is not a canonical book id (see docs/bible-dataset-guide.md §7). ` +
        `If the client uses a different name for it, add it to ID_CORRECTIONS.`
    );
  }

  const testament = TESTAMENT_MAP[src.testament];
  if (!testament) fail(`${id}: unrecognized testament value "${src.testament}"`);
  if (testament !== canonBook.testament) {
    fail(`${id}: client says ${testament}, the canon says ${canonBook.testament}`);
  }
  if (!src.name || src.name.trim().length === 0) {
    fail(`${id}: source has no "name" (the book's Macedonian display name)`);
  }

  for (const key of Object.keys(src)) {
    if (!["id", "name", "testament", "chapters"].includes(key)) dropped.add(key);
  }

  const omissions = KNOWN_OMITTED_VERSES[id] ?? [];

  const chapters = src.chapters.map((chapter, chapterIndex) => {
    if (chapter.chapter !== chapterIndex + 1) {
      fail(
        `mk/${id}: chapters are not contiguous — found chapter ${chapter.chapter} at ` +
          `position ${chapterIndex + 1}`
      );
    }
    for (const key of Object.keys(chapter)) {
      if (!["chapter", "verses"].includes(key)) dropped.add(`chapter.${key}`);
    }

    const verses = chapter.verses.map((verse) => {
      for (const key of Object.keys(verse)) {
        if (!["verse", "text"].includes(key)) dropped.add(`verse.${key}`);
      }
      const text = normalizeText(verse.text, stats);
      if (text.length === 0) {
        fail(`mk/${id} ch.${chapter.chapter} v.${verse.verse}: empty verse text`);
      }
      return { number: verse.verse, text };
    });

    verses.sort((a, b) => a.number - b.number);
    const seen = new Set<number>();
    for (const verse of verses) {
      if (seen.has(verse.number)) {
        fail(`mk/${id} ch.${chapter.chapter}: duplicate verse number ${verse.number}`);
      }
      seen.add(verse.number);
    }

    // Heal known single-verse gaps; anything else is a hard stop.
    const maxVerse = Math.max(...verses.map((verse) => verse.number));
    for (let n = 1; n <= maxVerse; n++) {
      if (seen.has(n)) continue;
      const known = omissions.find((o) => o.chapter === chapter.chapter && o.verse === n);
      if (!known) {
        fail(
          `mk/${id} ch.${chapter.chapter}: verse ${n} is missing and is NOT a known/expected ` +
            `omission. This looks like a real gap in the source — check with the preacher ` +
            `rather than skip it.`
        );
      }
      verses.push({ number: n, text: OMITTED_NOTE_MK });
      healed.push(`${id} ${chapter.chapter}:${n}`);
    }
    verses.sort((a, b) => a.number - b.number);

    return { number: chapter.chapter, verses };
  });

  const parsed = bookFileSchema.safeParse({
    id,
    name: src.name.trim(),
    testament,
    chapters,
  });
  if (!parsed.success) {
    fail(
      `mk/${id} failed schema validation:\n` +
        parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n")
    );
  }
  return parsed.data;
}

// --- Step 6: the English (WEB) side ---------------------------------------

function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

// `singleChapterVerses` must be set for one-chapter books. bible-api.com reads
// "Jude 1" as Jude VERSE 1, not chapter 1 — asking for a chapter there silently
// returns a single verse. Those books have to be requested as a verse range.
async function fetchWebChapter(
  apiBookName: string,
  chapter: number,
  singleChapterVerses: number | null,
  attempt = 1
): Promise<{ number: number; text: string }[]> {
  const reference =
    singleChapterVerses === null
      ? `${apiBookName}+${chapter}`
      : `${apiBookName}+1:1-${singleChapterVerses}`;
  const url = `https://bible-api.com/${encodeURIComponent(reference)}?translation=web`;

  let body = "";
  let ok = false;
  let json: { verses?: { verse: number; text: string }[] } = {};
  try {
    const res = await fetch(url);
    body = await res.text();
    ok = res.ok;
    try {
      json = JSON.parse(body);
    } catch {
      json = {};
    }
  } catch (error) {
    body = String(error);
  }

  if (!ok || !json.verses || json.verses.length === 0) {
    if (attempt >= 10) {
      fail(
        `failed to fetch ${apiBookName} ${chapter} from bible-api.com after ${attempt} ` +
          `attempts (last response: ${body.slice(0, 200)})`
      );
    }
    const backoff = 2000 * attempt;
    console.warn(`    ${apiBookName} ${chapter}: rate-limited, retrying in ${backoff}ms...`);
    await sleep(backoff);
    return fetchWebChapter(apiBookName, chapter, singleChapterVerses, attempt + 1);
  }

  return json.verses.map((verse) => ({ number: verse.verse, text: cleanText(verse.text) }));
}

// Fetches one WEB book, caching it on disk so an interrupted or rate-limited
// run never has to re-download what it already has.
async function fetchWebBook(
  id: string,
  testament: Testament,
  apiBookName: string,
  mkBook: ParsedBookFile,
  blanksFilled: string[]
): Promise<ParsedBookFile> {
  const chapterCount = mkBook.chapters.length;
  const cachePath = join(CACHE_DIR, `${id}.json`);
  let chapters: { number: number; verses: { number: number; text: string }[] }[];

  if (existsSync(cachePath)) {
    chapters = JSON.parse(readFileSync(cachePath, "utf8")).chapters;
  } else {
    // One-chapter books need a verse-range request (see fetchWebChapter).
    const singleChapterVerses =
      chapterCount === 1 ? mkBook.chapters[0]!.verses.length : null;
    chapters = [];
    for (let chapter = 1; chapter <= chapterCount; chapter++) {
      chapters.push({
        number: chapter,
        verses: await fetchWebChapter(apiBookName, chapter, singleChapterVerses),
      });
      await sleep(700); // stay under bible-api.com's rate limit
    }
    mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(cachePath, JSON.stringify({ id, chapters }, null, 2), "utf8");
  }

  // Realign verse boundaries to the Macedonian numbering where the two
  // traditions divide the same words differently (see bible-versification.ts).
  const realign = ENGLISH_REALIGNMENTS[id];
  if (realign) chapters = realign(chapters);

  // The WEB returns the critical-text omissions it shares with the Macedonian
  // source as empty strings. Fill them with the English editorial note, exactly
  // mirroring what the mk side does — an empty verse is not publishable.
  for (const chapter of chapters) {
    for (const verse of chapter.verses) {
      if (verse.text.trim().length === 0) {
        const known = (KNOWN_OMITTED_VERSES[id] ?? []).find(
          (o) => o.chapter === chapter.number && o.verse === verse.number
        );
        if (!known) {
          fail(
            `en/${id} ch.${chapter.number} v.${verse.number}: the WEB returned an empty verse ` +
              `that is NOT a known critical-text omission. Investigate before publishing.`
          );
        }
        verse.text = OMITTED_NOTE_EN;
        blanksFilled.push(`${id} ${chapter.number}:${verse.number}`);
      }
    }
  }

  const parsed = bookFileSchema.safeParse({ id, name: apiBookName, testament, chapters });
  if (!parsed.success) {
    fail(
      `en/${id} failed schema validation:\n` +
        parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n")
    );
  }
  return parsed.data;
}

// --- main ------------------------------------------------------------------

async function main(): Promise<void> {
  const [otPath, ntPath] = process.argv.slice(2);
  if (!otPath || !ntPath) {
    fail(
      "usage: npm run bible:migrate -- <old-testament.json> <new-testament.json>\n" +
        "  example: npm run bible:migrate -- ./starzavet.json ./novzavet.json"
    );
  }

  const stats = { egraveChars: 0, egraveVerses: 0 };
  const dropped = new Set<string>();
  const healed: string[] = [];
  const mkBooks = new Map<string, ParsedBookFile>();

  console.log("1. Migrating the Macedonian delivery...");
  for (const path of [otPath, ntPath]) {
    const abs = resolve(path);
    if (!existsSync(abs)) fail(`source file not found: ${abs}`);

    let doc: ClientFile;
    try {
      doc = JSON.parse(readFileSync(abs, "utf8"));
    } catch (error) {
      fail(`${abs} is not valid JSON: ${(error as Error).message}`);
    }
    if (!Array.isArray(doc.books)) fail(`${abs} has no "books" array`);

    for (const src of doc.books) {
      const book = migrateBook(src, stats, dropped, healed);
      if (mkBooks.has(book.id)) fail(`book "${book.id}" appears in both source files`);
      mkBooks.set(book.id, book);
    }
    console.log(`   ${abs}: ${doc.books.length} book(s)`);
  }

  // Completeness against the canon, before anything is written.
  const missing = BIBLE_CANON.filter((book) => !mkBooks.has(book.id)).map((book) => book.id);
  if (missing.length > 0) {
    fail(`the delivery is missing ${missing.length} canonical book(s): ${missing.join(", ")}`);
  }
  if (mkBooks.size !== BIBLE_CANON.length) {
    fail(`got ${mkBooks.size} books, the canon has ${BIBLE_CANON.length}`);
  }

  console.log(`   dropped non-schema fields: ${[...dropped].join(", ") || "(none)"}`);
  console.log(`   healed known omissions (${healed.length}): ${healed.join(", ") || "(none)"}`);
  console.log(
    `   repaired Latin è -> Cyrillic ѐ: ${stats.egraveChars} character(s) in ${stats.egraveVerses} verse(s)`
  );

  console.log(`\n2. Fetching the World English Bible (public domain)...`);
  console.log(`   cache: ${CACHE_DIR}`);
  const enBooks = new Map<string, ParsedBookFile>();
  const blanksFilled: string[] = [];
  for (const canonBook of BIBLE_CANON) {
    const mkBook = mkBooks.get(canonBook.id)!;
    // Reuse the existing English file's display name as the API query — it is
    // already a real, correctly capitalized English book title.
    const existingEnPath = join(DATA_DIR, "en", `${canonBook.id}.json`);
    if (!existsSync(existingEnPath)) {
      fail(`no existing en/${canonBook.id}.json to read the English book title from`);
    }
    const apiBookName = JSON.parse(readFileSync(existingEnPath, "utf8")).name as string;

    const enBook = await fetchWebBook(
      canonBook.id,
      canonBook.testament,
      apiBookName,
      mkBook,
      blanksFilled
    );
    enBooks.set(canonBook.id, enBook);
    console.log(`   ${canonBook.id}: ${enBook.chapters.length} ch`);
  }
  console.log(
    `   realigned to mk versification: ${Object.keys(ENGLISH_REALIGNMENTS).join(", ")}`
  );
  console.log(
    `   filled empty WEB verses with the English note (${blanksFilled.length}): ` +
      `${blanksFilled.join(", ") || "(none)"}`
  );

  console.log(`\n3. Checking mk/en versification agrees, book by book...`);
  const mismatches: string[] = [];
  for (const canonBook of BIBLE_CANON) {
    const mkBook = mkBooks.get(canonBook.id)!;
    const enBook = enBooks.get(canonBook.id)!;
    if (mkBook.chapters.length !== enBook.chapters.length) {
      mismatches.push(
        `  ${canonBook.id}: mk has ${mkBook.chapters.length} chapters, en has ${enBook.chapters.length}`
      );
      continue;
    }
    mkBook.chapters.forEach((chapter, index) => {
      const enCount = enBook.chapters[index]!.verses.length;
      if (chapter.verses.length !== enCount) {
        mismatches.push(
          `  ${canonBook.id} ch.${index + 1}: mk has ${chapter.verses.length} verses, en has ${enCount}`
        );
      }
    });
  }
  if (mismatches.length > 0) {
    fail(
      `mk and en versification disagree — NOTHING was written. The project derives one ` +
        `manifest from mk and requires en to match it exactly (.claude/bible-module.md §2). ` +
        `Resolve these by hand against a Bible reference, then re-run:\n${mismatches.join("\n")}`
    );
  }
  console.log(`   ✔ all 66 books agree`);

  console.log(`\n4. Writing src/data/bible/{mk,en}/ ...`);
  for (const locale of ["mk", "en"] as const) {
    mkdirSync(join(DATA_DIR, locale), { recursive: true });
  }
  for (const canonBook of BIBLE_CANON) {
    writeFileSync(
      join(DATA_DIR, "mk", `${canonBook.id}.json`),
      `${JSON.stringify(mkBooks.get(canonBook.id), null, 2)}\n`,
      "utf8"
    );
    writeFileSync(
      join(DATA_DIR, "en", `${canonBook.id}.json`),
      `${JSON.stringify(enBooks.get(canonBook.id), null, 2)}\n`,
      "utf8"
    );
  }

  const totalVerses = [...mkBooks.values()].reduce(
    (sum, book) => sum + book.chapters.reduce((s, chapter) => s + chapter.verses.length, 0),
    0
  );
  console.log(
    `\n✔ Migrated ${mkBooks.size} books, ${totalVerses} verses per locale (mk, en).\n` +
      `Next: npm run bible:build\n`
  );
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
