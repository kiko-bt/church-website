import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type SectionContainerProps = {
  children: ReactNode;
  className?: string;
};

export function SectionContainer({ children, className }: SectionContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 md:max-w-3xl lg:max-w-7xl lg:px-8 2xl:max-w-[1440px]",
        className
      )}
    >
      {children}
    </div>
  );
}
