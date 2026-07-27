# Correcting the Bible Text

_For the content owner. No programming knowledge needed._

The complete Bible is already on the website. This guide explains how to fix a
verse — a typo, a punctuation mark, a word — and publish the change.

**You only ever edit one kind of file: the Bible text files.** Nothing else on
the website needs to be touched, and nothing else should be.

---

## 1. Where the text lives

```
src/data/bible/mk/   ← Macedonian, one file per book (66 files)
src/data/bible/en/   ← English, one file per book (66 files)
```

Each file is named after its book: `genesis.json`, `matthew.json`,
`1-john.json`, `revelation.json`. The Macedonian and English files for the same
book share the same name — only the text inside differs.

---

## 2. What a file looks like

```json
{
  "id": "3-john",
  "testament": "NT",
  "chapters": [
    {
      "number": 1,
      "verses": [
        { "number": 1, "text": "Од старешината до милиот Гај…" },
        { "number": 2, "text": "Мил мој, се молам во сѐ да напредуваш…" }
      ]
    }
  ]
}
```

**Change only what is inside the quotation marks after `"text":`.** That is the
verse itself. Everything else — `id`, `testament`, `number` — is the structure
the website relies on to find the verse.

---

## 3. Making a correction

1. Open the book's file (for example `src/data/bible/mk/john.json`).
2. Find the chapter, then the verse number.
3. Edit the words inside the quotation marks.
4. Save.

Then publish:

```bash
git add .
git commit -m "Correct John 3:16"
git push
```

That is all. The website rebuilds and publishes the change automatically.

**You do not need to run anything else.** The search is rebuilt from your text
every time the website publishes, so a corrected verse becomes searchable at the
same moment it appears on the page. There is no separate step to remember.

**Optional — check your change before you publish it.** If you would like to be
sure the file is still valid before pushing, run this in the project folder:

```bash
npm run bible:validate
```

It prints `✔ Bible dataset is valid.` when all is well, or names the exact file
and verse if something is wrong. Skipping it is safe: the same check runs again
automatically when the website publishes, and a mistake stops the publish
instead of reaching visitors.

---

## 4. The four rules

1. **Never leave a verse empty.** Every verse must have text.
2. **Never change a `"number"`,** and never add or remove a verse or a chapter.
   The numbering must stay 1, 2, 3… with nothing skipped or repeated.
3. **If the verse text contains a quotation mark,** put a backslash before it:
   `\"`. A plain `"` inside the text would end the verse early.
4. **Do not add anything new** — no extra fields, notes or colours. The website
   will refuse a file that has them.

If you break one of these by accident, **the website will not publish the
mistake.** The build stops and prints exactly which file and verse is wrong, so
nothing broken can reach visitors.

---

## 5. Things that are not in these files

| You want to change… | Where |
|---|---|
| A verse's words | The book files, as above |
| A book's name (e.g. "Матеј") | Ask your developer — it is one line in `src/features/bible/bible.display-names.ts` |
| The order of the books | Fixed permanently. It cannot be changed by accident, by design. |
| Sermons, books, PDFs, photos, contact details | Sanity Studio — not these files |

---

## 6. A few verses look like this

```
[Овој стих не се наоѓа во најстарите ракописи.]
```

That is intentional. A small number of verse numbers are kept by some
translations and omitted by others. Rather than showing a blank verse or
skipping a number, the site explains why the verse is not there. Leave these as
they are unless you decide otherwise.
