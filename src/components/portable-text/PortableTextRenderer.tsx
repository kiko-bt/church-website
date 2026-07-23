import {
  PortableText,
  type PortableTextComponents,
} from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";

/**
 * Shared, server-safe renderer for Sanity Portable Text (`richText` schema).
 *
 * Reusable by any CMS-backed surface (homepage, books, sermons, future pages).
 * Consumes the domain model's `RichTextContent` (already locale-resolved and
 * normalized to a non-nullable array by the mapper layer) — it never touches
 * raw Sanity documents.
 *
 * Styling is deliberately colour-neutral: block elements inherit `color` and
 * base `font-size` from the parent, so the same renderer reads correctly on
 * light and dark section backgrounds. The caller sets the colour/size context
 * via `className`; only structural styles (weight, list markers, quote rule,
 * link colour) are baked in here.
 *
 * Only the blocks/marks defined in the approved schema are mapped:
 * normal / h2 / h3 / blockquote, bullet & numbered lists, strong & em, and a
 * single `link` annotation restricted to https/mailto.
 */

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p>{children}</p>,
    h2: ({ children }) => (
      <h2 className="font-heading text-2xl font-semibold">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="font-heading text-xl font-semibold">{children}</h3>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-accent-gold/60 pl-4 italic">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc space-y-1 pl-5">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal space-y-1 pl-5">{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li>{children}</li>,
    number: ({ children }) => <li>{children}</li>,
  },
  marks: {
    strong: ({ children }) => (
      <strong className="font-semibold">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    link: ({ children, value }) => {
      const href = typeof value?.href === "string" ? value.href : "";
      // Schema restricts hrefs to https/mailto. mailto opens the mail client in
      // place; https links are external, so they open in a new tab with the
      // standard security rel (matching the site's existing link handling).
      const isExternal = href.startsWith("http");
      return (
        <a
          href={href}
          {...(isExternal
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
          className="text-accent-gold-strong underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold"
        >
          {children}
        </a>
      );
    },
  },
};

type PortableTextRendererProps = {
  readonly value: PortableTextBlock[];
  readonly className?: string;
};

export function PortableTextRenderer({
  value,
  className,
}: PortableTextRendererProps) {
  // An empty array (e.g. an editor left the field blank) renders nothing.
  if (value.length === 0) return null;

  return (
    <div className={className}>
      <PortableText value={value} components={components} />
    </div>
  );
}
