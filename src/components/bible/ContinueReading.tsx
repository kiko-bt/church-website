"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import type { Locale } from "@/constants/locales";
import type { BookLink } from "./TestamentSection";
import {
  lastReadHref,
  lastReadKey,
  loadLastRead,
} from "@/features/bible/bible.reading-position";

type ContinueReadingProps = {
  readonly locale: Locale;
  readonly books: readonly BookLink[];
  readonly label: string;
};

type Resume = {
  readonly href: string;
  readonly name: string;
  readonly chapter: number;
};

// "Continue reading" link on the Bible landing page, pointing at the chapter
// last opened in this locale (recorded by ReadingPositionMemory). Renders
// nothing on the server and whenever nothing valid is remembered, so the
// static page is unchanged for first-time readers.
export function ContinueReading({ locale, books, label }: ContinueReadingProps) {
  const [resume, setResume] = useState<Resume | null>(null);

  useEffect(() => {
    const names = new Map(books.map((book) => [book.id, book.name]));
    let next: Resume | null = null;
    try {
      const lastRead = loadLastRead(window.localStorage, lastReadKey(locale), (id) =>
        names.has(id)
      );
      if (lastRead) {
        next = {
          href: lastReadHref(locale, lastRead),
          name: names.get(lastRead.bookId) ?? lastRead.bookId,
          chapter: lastRead.chapter,
        };
      }
    } catch {
      // Storage unavailable — show nothing.
    }
    setResume(next);
  }, [locale, books]);

  if (!resume) return null;

  return (
    <Link
      href={resume.href}
      className="mb-8 flex min-h-11 items-center gap-3 rounded-sm border border-soft-gold/60 bg-warm-bg px-4 py-3 text-text-primary transition-colors hover:border-accent-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold"
    >
      <BookOpen size={20} aria-hidden="true" className="shrink-0 text-accent-gold-strong" />
      <span className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
        <span className="text-sm text-text-primary/70">{label}</span>{" "}
        <span className="font-heading text-lg font-semibold text-deep-dark">
          {resume.name} {resume.chapter}
        </span>
      </span>
    </Link>
  );
}
