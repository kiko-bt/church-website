# How to Provide the Bible Text for the Website

_A guide for the content owner. No technical background required._

Thank you for preparing the Bible text for the website. This guide explains **exactly
how to organize the text** so it can be added to the site safely and quickly. If you
follow this structure, publishing the complete Bible — Old and New Testament, in both
Macedonian and English — becomes a simple, low-risk step.

Please read it once from top to bottom; it is short.

---

## 1. The big picture

- The Bible is provided as a set of **text files**, in a layout called **JSON**.
- There is **one file per book** (Genesis is one file, Exodus is another, and so on).
- There are **two languages**: one set of files for **Macedonian**, one set for
  **English**. The two are kept separate — each is its own translation.
- You do **not** need to build anything technical. You provide the text in the shape
  shown below (a Word or Excel document per book is also fine — see §6); your developer
  turns it into the final files.

The most important thing is that the **structure and the rules** below are followed
exactly. If they are, the website will accept the text on the first try.

---

## 2. What one book looks like

Below is a complete, tiny example — a book with **one chapter and three verses**.
Every book follows this same pattern, just with more chapters and verses.

```json
{
  "id": "3-john",
  "name": "3 John",
  "testament": "NT",
  "chapters": [
    {
      "number": 1,
      "verses": [
        { "number": 1, "text": "The first verse of this chapter goes here." },
        { "number": 2, "text": "The second verse goes here." },
        { "number": 3, "text": "The third verse goes here." }
      ]
    }
  ]
}
```

What each part means:

| Part | Meaning |
|---|---|
| `id` | The book's short name (given to you in the list in §7). Always lowercase English, e.g. `genesis`, `1-john`. **Same in both languages.** |
| `name` | The book's name **as it should appear on the site**, in this file's language (e.g. `Битие` in the Macedonian file, `Genesis` in the English file). |
| `testament` | `OT` for Old Testament, `NT` for New Testament. |
| `chapters` | The list of chapters, in order. |
| `number` (chapter) | The chapter number: 1, 2, 3, … |
| `verses` | The list of verses in that chapter, in order. |
| `number` (verse) | The verse number: 1, 2, 3, … |
| `text` | The verse text itself. |

---

## 3. The rules that keep it safe

The website automatically checks the text before it goes live. If any rule below is
broken, it will **stop and point out the problem** — nothing broken can reach the site.
Following these rules means it passes the first time:

1. **Every verse must have text.** No empty verses, no blank spaces only.
2. **Numbers start at 1 and go up one at a time** — chapters 1, 2, 3… and verses 1, 2,
   3… **Do not skip a number and do not repeat one.** (The one exception: a handful of New
   Testament verses — e.g. Matthew 17:21, Mark 7:16 — are skipped by some modern translations
   because they're considered later additions not in the earliest manuscripts. If your
   translation does this, that's fine — just tell your developer which verse it is, they know
   how to handle it. Don't skip a number for any other reason.)
3. **Every book must be present**, in both languages — all 39 Old Testament books and
   all 27 New Testament books.
4. **The `id` must match the list in §7 exactly**, and must be the **same in both
   languages**. Only the `name` and the verse `text` differ between Macedonian and English.
5. **Do not add extra information** (no notes, colors, or extra fields) inside these
   files. Footnotes and study notes can be added later, separately.
6. **The number of chapters and verses must be the same in both languages** for each
   book. (Standard Bibles already match; just don't split or merge verses differently
   between the two.)

You do not need to memorize these — they exist so that a small typo can never quietly
break the site. If something is off, we will see a clear message and fix it before
publishing.

---

## 4. Punctuation to be careful with (JSON)

If you (or a helper) type the files directly, a few small technical rules matter:

- Each verse is wrapped in `{ "number": 1, "text": "…" }`.
- The text goes **inside the quotation marks** `"…"`.
- If the verse text itself contains a quotation mark, put a backslash before it: `\"`.
- Items in a list are separated by commas — but there is **no comma after the last
  one**.

If this feels fiddly, **don't worry** — see §6. Providing the text in a document or
spreadsheet is perfectly fine, and your developer will convert it precisely.

---

## 5. File names

- Macedonian files go in a folder called `mk`, English files in a folder called `en`.
- Each file is named after the book's `id` with `.json` at the end — for example
  `genesis.json`, `1-john.json`, `revelation.json`.
- The **same book has the same file name in both folders** (only the contents differ by
  language).

---

## 6. The easiest way to hand it over

You have two options — pick whichever is comfortable:

- **Option A (recommended): one document or spreadsheet per book.** For each book, list
  the chapters and, under each, the verses numbered 1, 2, 3… with the text. Do this once
  for Macedonian and once for English. Your developer converts these into the final
  files exactly.
- **Option B: the JSON files directly**, following §2–§5.

Either way, the content is identical — Option A just lets you focus on the words and
leave the formatting to us.

**Please deliver both languages together**, complete (all 66 books each), so we can
publish the whole Bible in one safe step.

---

## 7. The list of books and their file names

Use these exact `id` values (the file names). The Macedonian and English display names
are examples — use the exact wording you prefer for the site.

**Old Testament (`OT`)** — 39 books:
`genesis`, `exodus`, `leviticus`, `numbers`, `deuteronomy`, `joshua`, `judges`,
`ruth`, `1-samuel`, `2-samuel`, `1-kings`, `2-kings`, `1-chronicles`, `2-chronicles`,
`ezra`, `nehemiah`, `esther`, `job`, `psalms`, `proverbs`, `ecclesiastes`,
`song-of-solomon`, `isaiah`, `jeremiah`, `lamentations`, `ezekiel`, `daniel`, `hosea`,
`joel`, `amos`, `obadiah`, `jonah`, `micah`, `nahum`, `habakkuk`, `zephaniah`,
`haggai`, `zechariah`, `malachi`.

**New Testament (`NT`)** — 27 books:
`matthew`, `mark`, `luke`, `john`, `acts`, `romans`, `1-corinthians`, `2-corinthians`,
`galatians`, `ephesians`, `philippians`, `colossians`, `1-thessalonians`,
`2-thessalonians`, `1-timothy`, `2-timothy`, `titus`, `philemon`, `hebrews`, `james`,
`1-peter`, `2-peter`, `1-john`, `2-john`, `3-john`, `jude`, `revelation`.

---

## 8. One thing to confirm before you start

Please confirm **which Bible translation** you will use for each language, and that you
**have the right to publish it online**. This is the only thing that must be settled
before the text is added — everything else above is just formatting we can handle
together.

Thank you — with the text organized this way, putting the complete Bible online is a
quick and safe final step.
