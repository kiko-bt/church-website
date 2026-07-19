// Imports one book of the preacher's real Macedonian Bible text and produces
// its English counterpart, ready for `npm run bible:build`.
//
// What this does:
//   1. Reads the Macedonian JSON he provides for one book.
//   2. Strips anything the schema doesn't allow (extra fields), and checks
//      verse/chapter numbering is contiguous. A handful of verse numbers are
//      well-known to be skipped by critical-text translations (see
//      KNOWN_OMITTED_VERSES below) — those are healed automatically with a
//      bracketed editorial note. Any OTHER gap is treated as a likely typo
//      and stops the script — it is never silently "fixed".
//   3. Writes the cleaned file to src/data/bible/mk/<book-id>.json.
//   4. Fetches the matching book from the World English Bible (WEB) — a real,
//      public-domain English translation — from bible-api.com, chapter by
//      chapter. This is NOT a machine translation of the Macedonian text:
//      the project's mk and en Bibles are required to be two independent,
//      real source translations (see .claude/bible-module.md §1). Verse
//      text is never passed through an LLM.
//   5. Writes src/data/bible/en/<book-id>.json.
//
// It does NOT run `npm run bible:build` for you — run that yourself
// afterwards so you see the validator's output directly.
//
// Usage:
//   node --experimental-strip-types scripts/import-bible-book.ts <book-id> <path-to-mk-source.json>
//   npm run bible:import -- <book-id> <path-to-mk-source.json>
//
// Example:
//   npm run bible:import -- matthew "C:/Users/you/Desktop/matthew-from-preacher.json"

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { bookFileSchema, type ParsedBookFile } from "../src/features/bible/bible.schema.ts";
import { BIBLE_CANON } from "../src/features/bible/bible.constants.ts";

const DATA_DIR = resolve(process.cwd(), "src", "data", "bible");

// Verse numbers that modern critical-text translations (which the preacher's
// Macedonian text appears to follow) commonly omit as later scribal
// additions, while traditional/Majority-Text translations (like the WEB)
// keep them. When the Macedonian file skips exactly one of these numbers,
// we insert a bracketed note instead of treating it as a data error.
//
// This list only covers single-verse gaps. Larger disputed passages (the
// Mark 16:9-20 long ending, John 7:53-8:11) are NOT handled here — if the
// preacher's text is missing one of those, the script will stop and you
// must resolve it by hand.
const KNOWN_OMITTED_VERSES: Record<string, ReadonlyArray<{ chapter: number; verse: number }>> = {
  matthew: [
    { chapter: 17, verse: 21 },
    { chapter: 18, verse: 11 },
    { chapter: 21, verse: 44 },
    { chapter: 23, verse: 14 },
  ],
  mark: [
    { chapter: 7, verse: 16 },
    { chapter: 9, verse: 44 },
    { chapter: 9, verse: 46 },
    { chapter: 11, verse: 26 },
    { chapter: 15, verse: 28 },
  ],
  luke: [
    { chapter: 17, verse: 36 },
    { chapter: 23, verse: 17 },
  ],
  john: [{ chapter: 5, verse: 4 }],
  acts: [
    { chapter: 8, verse: 37 },
    { chapter: 15, verse: 34 },
    { chapter: 24, verse: 7 },
    { chapter: 28, verse: 29 },
  ],
  romans: [{ chapter: 16, verse: 24 }],
};

const OMITTED_NOTE_MK = "[Овој стих не се наоѓа во најстарите ракописи.]";

type RawVerse = { number: number; text: string; [key: string]: unknown };
type RawChapter = { number: number; verses: RawVerse[]; [key: string]: unknown };
type RawBook = {
  id?: string;
  name?: string;
  testament?: string;
  chapters: RawChapter[];
  [key: string]: unknown;
};

function fail(message: string): never {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// --- Step 1-2: read + normalize the Macedonian source --------------------

function normalizeMk(bookId: string, testament: "OT" | "NT", raw: RawBook): ParsedBookFile {
  const droppedFields = new Set<string>();

  if (raw.id !== undefined && raw.id !== bookId) {
    console.warn(`  note: source "id" was "${raw.id}", overriding to canonical "${bookId}"`);
  }
  if (raw.testament !== undefined && raw.testament !== testament) {
    console.warn(
      `  note: source "testament" was "${raw.testament}", overriding to canonical "${testament}"`
    );
  }
  if (!raw.name || raw.name.trim().length === 0) {
    fail(`source file has no "name" field (the book's Macedonian display name)`);
  }

  for (const key of Object.keys(raw)) {
    if (!["id", "name", "testament", "chapters"].includes(key)) droppedFields.add(key);
  }

  const knownOmissions = KNOWN_OMITTED_VERSES[bookId] ?? [];
  const chapterNumbers = raw.chapters.map((c) => c.number);
  chapterNumbers.forEach((n, i) => {
    if (n !== i + 1) {
      fail(
        `mk/${bookId}: chapters are not contiguous — found chapter ${n} at position ${i + 1}, expected ${i + 1}`
      );
    }
  });

  const chapters = raw.chapters.map((ch) => {
    for (const key of Object.keys(ch)) {
      if (!["number", "verses"].includes(key)) droppedFields.add(`chapter.${key}`);
    }

    const verses = ch.verses.map((v) => {
      for (const key of Object.keys(v)) {
        if (!["number", "text"].includes(key)) droppedFields.add(`verse.${key}`);
      }
      const text = v.text.replace(/\s+/g, " ").trim();
      if (text.length === 0) {
        fail(`mk/${bookId} ch.${ch.number} v.${v.number}: empty verse text`);
      }
      return { number: v.number, text };
    });

    verses.sort((a, b) => a.number - b.number);
    const seen = new Set<number>();
    for (const v of verses) {
      if (seen.has(v.number)) {
        fail(`mk/${bookId} ch.${ch.number}: duplicate verse number ${v.number}`);
      }
      seen.add(v.number);
    }

    // Heal known single-verse gaps; anything else is a hard stop.
    const maxVerse = Math.max(...verses.map((v) => v.number));
    for (let n = 1; n <= maxVerse; n++) {
      if (seen.has(n)) continue;
      const known = knownOmissions.find((o) => o.chapter === ch.number && o.verse === n);
      if (known) {
        verses.push({ number: n, text: OMITTED_NOTE_MK });
        seen.add(n);
        console.warn(
          `  healed known omission: ${bookId} ${ch.number}:${n} (inserted editorial note)`
        );
      } else {
        fail(
          `mk/${bookId} ch.${ch.number}: verse ${n} is missing and is NOT a known/expected ` +
            `omission. This looks like a real gap in the source — check with the preacher ` +
            `rather than skip it.`
        );
      }
    }
    verses.sort((a, b) => a.number - b.number);

    return { number: ch.number, verses };
  });

  if (droppedFields.size > 0) {
    console.warn(`  dropped fields not allowed by the schema: ${[...droppedFields].join(", ")}`);
  }

  const normalized = { id: bookId, name: raw.name.trim(), testament, chapters };
  const parsed = bookFileSchema.safeParse(normalized);
  if (!parsed.success) {
    fail(`mk/${bookId} failed schema validation:\n${parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n")}`);
  }
  return parsed.data;
}

// --- Step 4: fetch the matching WEB (English, public domain) book --------

function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

async function fetchWebChapter(
  apiBookName: string,
  chapter: number,
  attempt = 1
): Promise<{ number: number; text: string }[]> {
  const url = `https://bible-api.com/${encodeURIComponent(apiBookName)}+${chapter}?translation=web`;
  const res = await fetch(url);
  const body = await res.text();

  let json: { verses?: { verse: number; text: string }[] };
  try {
    json = JSON.parse(body);
  } catch {
    json = {};
  }

  if (!res.ok || !json.verses || json.verses.length === 0) {
    if (attempt >= 8) {
      fail(
        `failed to fetch ${apiBookName} ${chapter} from bible-api.com after ${attempt} attempts ` +
          `(last response: ${body.slice(0, 200)})`
      );
    }
    const backoff = 2000 * attempt;
    console.warn(`  ${apiBookName} ${chapter}: rate-limited or failed, retrying in ${backoff}ms...`);
    await sleep(backoff);
    return fetchWebChapter(apiBookName, chapter, attempt + 1);
  }

  return json.verses.map((v) => ({ number: v.verse, text: cleanText(v.text) }));
}

async function fetchWebBook(
  bookId: string,
  testament: "OT" | "NT",
  apiBookName: string,
  chapterCount: number
): Promise<ParsedBookFile> {
  const chapters: RawChapter[] = [];
  for (let ch = 1; ch <= chapterCount; ch++) {
    const verses = await fetchWebChapter(apiBookName, ch);
    chapters.push({ number: ch, verses });
    await sleep(700); // stay under bible-api.com's rate limit
  }

  const normalized = { id: bookId, name: apiBookName, testament, chapters };
  const parsed = bookFileSchema.safeParse(normalized);
  if (!parsed.success) {
    fail(`en/${bookId} failed schema validation:\n${parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n")}`);
  }
  return parsed.data;
}

// --- main ------------------------------------------------------------------

async function main(): Promise<void> {
  const [bookId, sourcePath] = process.argv.slice(2);
  if (!bookId || !sourcePath) {
    fail(
      "usage: npm run bible:import -- <book-id> <path-to-mk-source.json>\n" +
        "  example: npm run bible:import -- matthew ./incoming/matthew.json"
    );
  }

  const canonBook = BIBLE_CANON.find((b) => b.id === bookId);
  if (!canonBook) {
    fail(
      `"${bookId}" is not a canonical book id. See docs/bible-dataset-guide.md §7 for the exact list.`
    );
  }

  const absSourcePath = resolve(sourcePath);
  if (!existsSync(absSourcePath)) {
    fail(`source file not found: ${absSourcePath}`);
  }

  console.log(`Importing "${bookId}" from ${absSourcePath}`);

  let raw: RawBook;
  try {
    raw = JSON.parse(readFileSync(absSourcePath, "utf8"));
  } catch (error) {
    fail(`source file is not valid JSON: ${(error as Error).message}`);
  }

  console.log(`\n1. Validating and cleaning the Macedonian text...`);
  const mkBook = normalizeMk(bookId, canonBook.testament, raw);
  const mkPath = resolve(DATA_DIR, "mk", `${bookId}.json`);
  writeFileSync(mkPath, `${JSON.stringify(mkBook, null, 2)}\n`, "utf8");
  console.log(`  wrote ${mkPath}`);

  // Reuse the existing English placeholder's display name (already a real,
  // correctly capitalized English book title) as the bible-api.com query.
  const existingEnPath = resolve(DATA_DIR, "en", `${bookId}.json`);
  let apiBookName = bookId;
  if (existsSync(existingEnPath)) {
    const existingEn = JSON.parse(readFileSync(existingEnPath, "utf8"));
    if (existingEn.name) apiBookName = existingEn.name;
  } else {
    console.warn(
      `  no existing en/${bookId}.json to read the English title from; using "${bookId}" ` +
        `as the bible-api.com query — verify this resolves to the right book.`
    );
  }

  console.log(`\n2. Fetching "${apiBookName}" (World English Bible, public domain)...`);
  const chapterCount = mkBook.chapters.length;
  const enBook = await fetchWebBook(bookId, canonBook.testament, apiBookName, chapterCount);

  console.log(`\n3. Checking mk/en chapter and verse counts line up...`);
  const mkCounts = mkBook.chapters.map((c) => c.verses.length);
  const enCounts = enBook.chapters.map((c) => c.verses.length);
  const mismatches: string[] = [];
  mkCounts.forEach((count, i) => {
    if (count !== enCounts[i]) {
      mismatches.push(`  chapter ${i + 1}: mk has ${count} verses, en (WEB) has ${enCounts[i]}`);
    }
  });
  if (mismatches.length > 0) {
    fail(
      `mk and en verse counts don't match for "${bookId}" — the en/${bookId}.json file was ` +
        `NOT written. This usually means the WEB translation splits/merges verses differently ` +
        `here. Resolve by hand (check the specific chapters below against a Bible reference), ` +
        `then re-run:\n${mismatches.join("\n")}`
    );
  }

  const enPath = resolve(DATA_DIR, "en", `${bookId}.json`);
  writeFileSync(enPath, `${JSON.stringify(enBook, null, 2)}\n`, "utf8");
  console.log(`  wrote ${enPath}`);

  console.log(
    `\n✔ Done. mk and en "${bookId}" are in sync (${mkCounts.reduce((a, b) => a + b, 0)} verses each).\n` +
      `Next: npm run bible:build\n`
  );
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
