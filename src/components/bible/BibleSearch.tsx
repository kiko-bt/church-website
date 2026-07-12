"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import type Fuse from "fuse.js";
import type { Locale } from "@/constants/locales";
import type { BibleSearchEntry, BibleSearchIndex } from "@/features/bible";
import { parseReference } from "@/features/bible/bible.reference";
import { createBibleSearch, searchBible } from "@/features/bible/bible-search";

type BibleSearchProps = {
  readonly locale: Locale;
  readonly placeholder: string;
  readonly ariaLabel: string;
  readonly noResults: string;
};

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 200;

// Client-side Bible search. The (large) per-locale index is loaded LAZILY the
// first time the user types — it is never part of the initial page payload, so
// the reading experience stays fast. All matching is in-memory via Fuse.js;
// there is no server round-trip.
export function BibleSearch({
  locale,
  placeholder,
  ariaLabel,
  noResults,
}: BibleSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<readonly BibleSearchEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const fuseRef = useRef<Fuse<BibleSearchEntry> | null>(null);
  const indexPromiseRef = useRef<Promise<Fuse<BibleSearchEntry>> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestQueryRef = useRef("");

  // Load + build the Fuse index once; concurrent callers share one promise.
  const ensureIndex = useCallback(async (): Promise<Fuse<BibleSearchEntry>> => {
    if (fuseRef.current) return fuseRef.current;
    if (!indexPromiseRef.current) {
      indexPromiseRef.current = import(
        `../../data/bible/search/${locale}.json`
      ).then((module) => {
        const index = module.default as BibleSearchIndex;
        const fuse = createBibleSearch(index.entries);
        fuseRef.current = fuse;
        return fuse;
      });
    }
    return indexPromiseRef.current;
  }, [locale]);

  const runSearch = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      if (trimmed.length < MIN_QUERY_LENGTH) {
        setResults([]);
        setHasSearched(false);
        return;
      }
      if (!fuseRef.current) setIsLoading(true);
      const fuse = await ensureIndex();
      setIsLoading(false);
      // Discard results if the query changed while the index was loading.
      if (latestQueryRef.current !== value) return;
      setResults(searchBible(fuse, trimmed));
      setHasSearched(true);
    },
    [ensureIndex]
  );

  const onChange = (value: string) => {
    setQuery(value);
    latestQueryRef.current = value;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void runSearch(value), DEBOUNCE_MS);
  };

  return (
    <search className="mt-2">
      <label htmlFor="bible-search" className="sr-only">
        {ariaLabel}
      </label>
      <input
        id="bible-search"
        type="search"
        value={query}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoComplete="off"
        className="w-full rounded-sm border border-soft-gold bg-transparent px-4 py-2.5 text-text-primary placeholder:text-text-primary/40 focus-visible:border-accent-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold"
      />

      <div aria-live="polite" className="mt-4">
        {isLoading && (
          <p className="text-sm text-text-primary/60">…</p>
        )}

        {!isLoading && hasSearched && results.length === 0 && (
          <p className="text-sm text-text-primary/70">{noResults}</p>
        )}

        {results.length > 0 && (
          <ul className="divide-y divide-soft-gold/30 rounded-sm border border-soft-gold/30">
            {results.map((entry) => {
              const ref = parseReference(entry.reference);
              if (!ref) return null;
              return (
                <li key={entry.reference}>
                  <Link
                    href={`/${locale}/bible/${ref.bookId}/${ref.chapter}#v${ref.verse}`}
                    className="block px-4 py-3 transition-colors hover:bg-warm-bg focus-visible:bg-warm-bg focus-visible:outline-none"
                  >
                    <span className="text-sm font-semibold text-accent-gold">
                      {entry.bookName} {ref.chapter}:{ref.verse}
                    </span>
                    <span className="mt-1 block text-sm text-text-primary/80">
                      {entry.text}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </search>
  );
}
