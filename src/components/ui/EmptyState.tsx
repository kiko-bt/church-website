import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
};

/**
 * Generic empty-state placeholder shown when a content collection has no
 * items yet. Used by the Books, Sermons, and Gallery listings until Sanity
 * is wired in and real content is published.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-md border border-dashed border-soft-gold/60 bg-warm-bg/40 px-6 py-16 text-center",
        className
      )}
    >
      <span
        className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-soft-gold/30 text-accent-gold"
        aria-hidden="true"
      >
        <Icon size={28} />
      </span>
      <h2 className="font-heading text-xl font-semibold text-deep-dark">
        {title}
      </h2>
      {description && (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-text-primary/70">
          {description}
        </p>
      )}
    </div>
  );
}
