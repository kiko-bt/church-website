import { cn } from "@/lib/utils/cn";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  className?: string;
};

export function PageHeader({ title, subtitle, className }: PageHeaderProps) {
  return (
    <header className={cn("pb-8 pt-12", className)}>
      <h1 className="font-heading text-3xl font-bold text-deep-dark sm:text-4xl">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-3 text-lg text-text-primary/70">{subtitle}</p>
      )}
    </header>
  );
}
