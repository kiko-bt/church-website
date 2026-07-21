// Realigns the English (WEB) verse BOUNDARIES to the Macedonian delivery's
// numbering, for the handful of chapters where the two traditions divide the
// same words differently.
//
// Why this is needed
// ------------------
// The preacher's Macedonian New Testament follows the critical text
// (Nestle-Aland 28). The World English Bible follows a more traditional
// division. In five chapters the two disagree about WHERE one verse ends and
// the next begins. The project derives ONE manifest from the Macedonian side
// and requires every other locale to match it chapter for chapter and verse
// for verse (.claude/bible-module.md §2), so the English must be renumbered to
// the same scheme or the dataset cannot validate.
//
// What this is NOT
// ----------------
// This is a **numbering** change, never a text change. Every English word,
// punctuation mark and capital letter the WEB supplies is preserved; the only
// thing that moves is the verse boundary between them. Nothing is translated,
// paraphrased, summarized or invented, and no verse content is dropped.
//
// Safety
// ------
// Every rule asserts the exact source text it expects before touching it. If
// bible-api.com ever returns different wording, the assertion fails and the
// migration hard-stops rather than silently mangling the text.

type Verse = { number: number; text: string };
type Chapter = { number: number; verses: Verse[] };

function fail(message: string): never {
  throw new Error(`versification realignment: ${message}`);
}

function renumber(verses: Verse[]): Verse[] {
  return verses.map((verse, index) => ({ number: index + 1, text: verse.text }));
}

function verseAt(chapters: Chapter[], chapter: number, verse: number, book: string): Verse {
  const found = chapters[chapter - 1]?.verses.find((v) => v.number === verse);
  if (!found) fail(`${book} ${chapter}:${verse} not found in the fetched English`);
  return found;
}

// Splits one verse into two at `marker`, which must begin the second half.
function splitVerse(text: string, marker: string, book: string, ref: string): [string, string] {
  const index = text.indexOf(marker);
  if (index <= 0) {
    fail(`${book} ${ref}: expected to split at "${marker}" but it was not found in: ${text}`);
  }
  const head = text.slice(0, index).trim();
  const tail = text.slice(index).trim();
  if (head.length === 0 || tail.length === 0) fail(`${book} ${ref}: split produced an empty half`);
  return [head, tail];
}

function expect(actual: string, needle: string, book: string, ref: string): void {
  if (!actual.includes(needle)) {
    fail(`${book} ${ref}: expected text containing "${needle}", got: ${actual}`);
  }
}

// Each rule takes the fetched WEB chapters and returns them renumbered to the
// Macedonian scheme. Keyed by canonical book id.
export const ENGLISH_REALIGNMENTS: Record<string, (chapters: Chapter[]) => Chapter[]> = {
  // 3 John — the WEB closes the letter in 14 verses; NA28 splits its verse 14
  // into 14 ("I hope to see you soon…") and 15 ("Peace be to you…").
  "3-john": (chapters) => {
    const book = "3-john";
    const chapter = chapters[0]!;
    if (chapter.verses.length !== 14) fail(`${book}: expected 14 WEB verses, got ${chapter.verses.length}`);

    const v14 = verseAt(chapters, 1, 14, book);
    expect(v14.text, "Peace be to you", book, "1:14");
    const [head, tail] = splitVerse(v14.text, "Peace be to you", book, "1:14");

    const verses = chapter.verses.filter((v) => v.number !== 14);
    verses.push({ number: 14, text: head }, { number: 15, text: tail });
    verses.sort((a, b) => a.number - b.number);
    return [{ number: 1, verses: renumber(verses) }];
  },

  // 2 Corinthians 13 — the WEB has 14 verses; NA28 has 13, joining the WEB's
  // v12 ("Greet one another with a holy kiss.") and v13 ("All the saints greet
  // you.") into a single verse 12, which shifts the benediction to v13.
  "2-corinthians": (chapters) => {
    const book = "2-corinthians";
    const target = chapters[12]!;
    if (target.verses.length !== 14) fail(`${book} 13: expected 14 WEB verses, got ${target.verses.length}`);

    const v12 = verseAt(chapters, 13, 12, book);
    const v13 = verseAt(chapters, 13, 13, book);
    const v14 = verseAt(chapters, 13, 14, book);
    expect(v12.text, "holy kiss", book, "13:12");
    expect(v13.text, "saints greet you", book, "13:13");
    expect(v14.text, "fellowship of the Holy Spirit", book, "13:14");

    const verses = target.verses
      .filter((v) => v.number < 12)
      .concat([
        { number: 12, text: `${v12.text} ${v13.text}`.replace(/\s+/g, " ").trim() },
        { number: 13, text: v14.text },
      ]);

    return chapters.map((chapter, index) =>
      index === 12 ? { number: chapter.number, verses: renumber(verses) } : chapter
    );
  },

  // Revelation 12/13 — NA28 ends chapter 12 with v18 ("And he stood on the
  // sand of the sea."); the WEB folds that same sentence into the opening of
  // 13:1. Move the sentence back to 12:18; chapter 13 keeps its own count.
  revelation: (chapters) => {
    const book = "revelation";
    const ch12 = chapters[11]!;
    const ch13 = chapters[12]!;
    if (ch12.verses.length !== 17) fail(`${book} 12: expected 17 WEB verses, got ${ch12.verses.length}`);

    const first = verseAt(chapters, 13, 1, book);
    expect(first.text, "sand of the sea", book, "13:1");
    const [moved, remainder] = splitVerse(first.text, "I saw a beast", book, "13:1");

    const newCh12: Chapter = {
      number: 12,
      verses: renumber([...ch12.verses, { number: 18, text: moved }]),
    };
    const newCh13: Chapter = {
      number: 13,
      verses: renumber([
        { number: 1, text: remainder },
        ...ch13.verses.filter((v) => v.number !== 1),
      ]),
    };

    return chapters.map((chapter, index) => {
      if (index === 11) return newCh12;
      if (index === 12) return newCh13;
      return chapter;
    });
  },

  // Romans 14/16 — the doxology ("Now to him who is able to establish you…").
  // The WEB places it at 14:24-26 and leaves 16:25 empty; NA28 and the
  // Macedonian delivery place it at the traditional 16:25-27. Move the three
  // verses to the end of chapter 16, which also resolves the WEB's blank 16:25.
  romans: (chapters) => {
    const book = "romans";
    const ch14 = chapters[13]!;
    const ch16 = chapters[15]!;
    if (ch14.verses.length !== 26) fail(`${book} 14: expected 26 WEB verses, got ${ch14.verses.length}`);

    const doxology = [24, 25, 26].map((n) => verseAt(chapters, 14, n, book));
    expect(doxology[0]!.text, "who is able to establish you", book, "14:24");
    expect(doxology[2]!.text, "only wise God", book, "14:26");

    const v24 = verseAt(chapters, 16, 24, book);
    expect(v24.text, "grace of our Lord Jesus Christ", book, "16:24");

    // 16:25 arrives from the API as an empty string precisely because the
    // doxology was placed in chapter 14. Confirm that, then fill it.
    const blank = ch16.verses.find((v) => v.number === 25);
    if (!blank || blank.text.trim().length !== 0) {
      fail(`${book} 16:25: expected the WEB's empty placeholder verse, got: ${blank?.text}`);
    }

    const newCh14: Chapter = {
      number: 14,
      verses: renumber(ch14.verses.filter((v) => v.number < 24)),
    };
    const newCh16: Chapter = {
      number: 16,
      verses: renumber([
        ...ch16.verses.filter((v) => v.number <= 24),
        { number: 25, text: doxology[0]!.text },
        { number: 26, text: doxology[1]!.text },
        { number: 27, text: doxology[2]!.text },
      ]),
    };

    return chapters.map((chapter, index) => {
      if (index === 13) return newCh14;
      if (index === 15) return newCh16;
      return chapter;
    });
  },
};
