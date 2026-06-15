import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type ContentSectionProps = {
  heading?: string;
  /** Optional id for the section's heading, enabling `aria-labelledby`. */
  headingId?: string;
  children: ReactNode;
  className?: string;
};

/**
 * Reusable titled content block for long-form, typography-focused pages
 * (About, Privacy). Provides a consistent heading + body rhythm so prose
 * pages stay calm and readable.
 */
export function ContentSection({
  heading,
  headingId,
  children,
  className,
}: ContentSectionProps) {
  return (
    <section
      aria-labelledby={heading ? headingId : undefined}
      className={cn("max-w-3xl", className)}
    >
      {heading && (
        <h2
          id={headingId}
          className="font-heading text-2xl font-semibold text-deep-dark sm:text-3xl"
        >
          {heading}
        </h2>
      )}
      <div className="mt-4 space-y-4 text-base leading-relaxed text-text-primary/80">
        {children}
      </div>
    </section>
  );
}
