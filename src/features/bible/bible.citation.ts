// Builds the text a visitor copies to share a verse: the verse itself followed
// by its reference, e.g. „…“ (Ефесјаните 1:21). The surrounding punctuation is
// a UI string (`bible.verseCopy.citation` in messages), so each locale keeps
// its own quotation marks.
//
// This module has ZERO dependencies (no React, no data) so the client copy
// components can import it without pulling in the server data layer.

// Human-readable reference, the same in both locales: "Ефесјаните 1:21".
export function verseReference(
  bookName: string,
  chapter: number,
  verse: number
): string {
  return `${bookName} ${chapter}:${verse}`;
}

// Fills `{text}` and `{reference}` in the citation template. A replacer
// function is used so `$&`, `$1`, … inside the verse text are copied literally
// instead of being read as replacement patterns. Whitespace around the verse
// text (from the DOM) is trimmed; the text itself is never altered.
export function formatVerseCitation(
  template: string,
  text: string,
  reference: string
): string {
  const values: Record<string, string> = { text: text.trim(), reference };
  return template.replace(/\{(text|reference)\}/g, (_match, key: string) => values[key]);
}

// Fills `{reference}` in the copy button's label template
// (`bible.verseCopy.copyLabel`). Client copy buttons format it themselves so
// they need no message-formatting library in the browser.
export function formatCopyLabel(template: string, reference: string): string {
  return template.replace(/\{reference\}/g, () => reference);
}
