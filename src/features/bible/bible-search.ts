import Fuse, { type IFuseOptions } from "fuse.js";
import type { BibleSearchEntry } from "./bible.types";

// Client-side Bible search powered by Fuse.js.
//
// This module imports Fuse and is therefore a CLIENT dependency. It is
// deliberately NOT re-exported from features/bible/index.ts so the feature
// barrel stays safe to import from Server Components — import it directly from
// the client search component instead.

const FUSE_OPTIONS: IFuseOptions<BibleSearchEntry> = {
  keys: ["text", "bookName"],
  threshold: 0.3,
  ignoreLocation: true,
  minMatchCharLength: 2,
};

export function createBibleSearch(
  entries: readonly BibleSearchEntry[]
): Fuse<BibleSearchEntry> {
  return new Fuse(entries as BibleSearchEntry[], FUSE_OPTIONS);
}

export function searchBible(
  fuse: Fuse<BibleSearchEntry>,
  query: string,
  limit = 30
): BibleSearchEntry[] {
  return fuse.search(query, { limit }).map((result) => result.item);
}