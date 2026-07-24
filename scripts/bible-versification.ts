// Realigns the English (WEB) verse BOUNDARIES to the Macedonian delivery's
// numbering, for the handful of chapters where the two traditions divide the
// same words differently.
//
// Why this is needed
// ------------------
// The preacher's Macedonian New Testament and the World English Bible divide a
// handful of chapters differently — they disagree about WHERE one verse ends
// and the next begins. The project derives ONE manifest from the Macedonian
// side and requires every other locale to match it chapter for chapter and
// verse for verse (.claude/bible-module.md §2), so the English must be
// renumbered to the same scheme or the dataset cannot validate.
//
// This table is DELIVERY-SPECIFIC: it is tuned to the exact edition the client
// supplied. The current edition matches the WEB in 2 Corinthians 13 and
// Revelation 12 (so those need no realignment) but diverges in 3 John, Romans,
// and Acts 14 (handled below).
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

  // Acts 14 — the WEB divides the close of the chapter into 27 ("…opened a door
  // of faith to the Gentiles.") and 28 ("They stayed there with the disciples
  // for a long time."); this edition's Macedonian joins them into a single
  // verse 27. Merge the WEB's v27 and v28 into v27 so the two agree.
  acts: (chapters) => {
    const book = "acts";
    const target = chapters[13]!; // chapter 14
    if (target.verses.length !== 28) fail(`${book} 14: expected 28 WEB verses, got ${target.verses.length}`);

    const v27 = verseAt(chapters, 14, 27, book);
    const v28 = verseAt(chapters, 14, 28, book);
    expect(v27.text, "door of faith", book, "14:27");
    expect(v28.text, "stayed there", book, "14:28");

    const verses = target.verses
      .filter((v) => v.number < 27)
      .concat([{ number: 27, text: `${v27.text} ${v28.text}`.replace(/\s+/g, " ").trim() }]);

    return chapters.map((chapter, index) =>
      index === 13 ? { number: chapter.number, verses: renumber(verses) } : chapter
    );
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
