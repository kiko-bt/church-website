// Public API of the Bible feature.
// NOTE: bible-search.ts is deliberately excluded — it is a Client Component
// dependency (Fuse.js) and must be imported directly where needed so this
// barrel remains server-safe.
export * from "./bible.constants";
export * from "./bible.data";
export type * from "./bible.types";
