import { Fragment } from "react";
import Link from "next/link";

export type BreadcrumbItem = {
  readonly label: string;
  // Present ⇒ a link. Absent ⇒ the current page (rendered as aria-current).
  readonly href?: string;
};

type BibleBreadcrumbProps = {
  readonly items: readonly BreadcrumbItem[];
  readonly ariaLabel: string;
};

// Shared, server-rendered breadcrumb for the Bible section. The final item is
// the current page and carries aria-current="page".
export function BibleBreadcrumb({ items, ariaLabel }: BibleBreadcrumbProps) {
  return (
    <nav aria-label={ariaLabel} className="mb-6 text-sm text-text-primary/70">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => (
          <Fragment key={`${item.label}-${index}`}>
            {index > 0 && (
              <li aria-hidden="true" className="px-1">
                /
              </li>
            )}
            <li aria-current={item.href ? undefined : "page"}>
              {item.href ? (
                <Link
                  href={item.href}
                  className="rounded-sm transition-colors hover:text-accent-gold-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-text-primary">{item.label}</span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
