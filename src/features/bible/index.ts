// Public API of the Bible feature (server-oriented).
//
// This barrel re-exports the data layer (`bible.data`), which imports the
// manifest and validates on load — so it belongs in Server Components. Client
// Components must NOT import from this barrel; they should import the pure,
// dependency-free `bible.reference` module directly.
//
// NOTE: bible-search.ts is deliberately excluded — it is a Client Component
// dependency (Fuse.js) and must be imported directly where needed. bible.schema
// is likewise internal to the data/validation layer and not re-exported.
export * from "./bible.constants";
export * from "./bible.data";
export * from "./bible.reference";
export type * from "./bible.types";
