"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import type { Locale } from "@/constants/locales";
import { BIBLE_CANON } from "@/features/bible/bible.constants";
import {
  lastReadHref,
  lastReadKey,
  loadLastRead,
} from "@/features/bible/bible.reading-position";

type NavLinkProps = {
  href: string;
  exact?: boolean;
  className?: string;
  onClick?: () => void;
  // Set on the "Bible" link only: outside the Bible section, the link points
  // to the reader's last-read chapter in this locale instead of the book list.
  resumeBible?: Locale;
  children: ReactNode;
};

const CANON_IDS: ReadonlySet<string> = new Set(BIBLE_CANON.map((book) => book.id));
const isCanonBook = (bookId: string) => CANON_IDS.has(bookId);

// Last-read chapter link for `locale`, or null when nothing valid is stored or
// storage is unavailable (private mode, blocked site data).
function lastReadChapterHref(locale: Locale): string | null {
  try {
    const lastRead = loadLastRead(window.localStorage, lastReadKey(locale), isCanonBook);
    return lastRead ? lastReadHref(locale, lastRead) : null;
  } catch {
    return null;
  }
}

// Small client island so Navigation/MobileNav can stay server-rendered
// while only the active-state check runs on the client.
export function NavLink({
  href,
  exact = false,
  className,
  onClick,
  resumeBible,
  children,
}: NavLinkProps) {
  const pathname = usePathname();
  const inSection = pathname === href || pathname.startsWith(`${href}/`);
  const isActive = exact ? pathname === href : inSection;

  // Starts null so the first client render matches the server HTML; the
  // stored chapter is read after mount and re-read on every route change.
  const [resumeHref, setResumeHref] = useState<string | null>(null);
  useEffect(() => {
    setResumeHref(resumeBible && !inSection ? lastReadChapterHref(resumeBible) : null);
  }, [resumeBible, inSection, pathname]);

  return (
    <Link
      href={resumeHref ?? href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "rounded-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold",
        isActive
          ? "bg-warm-bg text-accent-gold-strong"
          : "text-text-primary hover:bg-warm-bg hover:text-accent-gold-strong",
        className
      )}
    >
      {children}
    </Link>
  );
}
