// Verse numbers that modern critical-text translations (which the preacher's
// Macedonian text follows) commonly omit as later scribal additions, while
// traditional/Majority-Text translations (like the WEB) keep them. When a
// Macedonian source skips exactly one of these numbers, the importer inserts a
// bracketed editorial note instead of treating it as a data error — which keeps
// mk and en on the same versification (see .claude/bible-module.md §2).
//
// This list only covers single-verse gaps. Larger disputed passages (the
// Mark 16:9-20 long ending, John 7:53-8:11) are NOT handled here — a source
// missing one of those must stop the importer and be resolved by hand.
//
// Shared by scripts/import-bible-book.ts (one book at a time) and
// scripts/migrate-client-bible.ts (the full two-file delivery) so both heal
// exactly the same set, with exactly the same note.

export const KNOWN_OMITTED_VERSES: Record<
  string,
  ReadonlyArray<{ chapter: number; verse: number }>
> = {
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

export const OMITTED_NOTE_MK = "[Овој стих не се наоѓа во најстарите ракописи.]";

// The English counterpart. The World English Bible returns a handful of these
// same verses as an EMPTY string (Acts 8:37, Acts 15:34, Acts 24:7,
// Luke 17:36) — it omits them for the same critical-text reason. An empty
// verse violates the schema, so the note goes in, exactly mirroring the
// Macedonian side, and the reader is told why the verse is blank rather than
// being shown a gap.
export const OMITTED_NOTE_EN = "[This verse is not found in the earliest manuscripts.]";
