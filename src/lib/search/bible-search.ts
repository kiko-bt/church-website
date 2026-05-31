// Client-side Bible search powered by Fuse.js.
// Requires: npm install fuse.js
// This module is imported only in Client Components ("use client").
//
// import Fuse, { type IFuseOptions } from "fuse.js";
// import type { BibleSearchEntry, BibleSearchIndex } from "@/types/bible";
//
// const FUSE_OPTIONS: IFuseOptions<BibleSearchEntry> = {
//   keys: ["text", "bookName", "fullReference"],
//   threshold: 0.3,
//   minMatchCharLength: 2,
// };
//
// export function createBibleSearchIndex(data: BibleSearchIndex) {
//   return new Fuse(data.searchIndex as BibleSearchEntry[], FUSE_OPTIONS);
// }
//
// export type BibleSearchResult = {
//   item: BibleSearchEntry;
//   score?: number;
// };

export type BibleSearchOptions = {
  query: string;
  limit?: number;
};

export {};
