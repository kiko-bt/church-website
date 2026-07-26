// Public API of the Bible feature, for Server Components.
//
// `bible.data` imports the manifest and validates on load, so this barrel is
// server-oriented. Client Components must not import it — they import the
// dependency-free `bible.reference` / `bible.display-names` modules directly.
// `bible-search` (Fuse.js) and `bible.schema` are deliberately not re-exported.
export * from "./bible.constants";
export * from "./bible.data";
export * from "./bible.display-names";
export type * from "./bible.types";
