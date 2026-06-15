import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type FeatureCardProps = {
  icon: LucideIcon;
  title: string;
  body: string;
  className?: string;
};

/**
 * Small icon + title + body card used to present a set of related ideas
 * (e.g. the church's values on the About page). Purely presentational.
 */
export function FeatureCard({
  icon: Icon,
  title,
  body,
  className,
}: FeatureCardProps) {
  return (
    <div
      className={cn(
        "rounded-md border border-soft-gold/40 bg-background p-6 transition-colors hover:border-accent-gold/50",
        className
      )}
    >
      <span
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-soft-gold/30 text-accent-gold"
        aria-hidden="true"
      >
        <Icon size={24} />
      </span>
      <h3 className="font-heading text-lg font-semibold text-deep-dark">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-text-primary/75">{body}</p>
    </div>
  );
}
