import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type LayoutShellProps = {
  children: ReactNode;
  className?: string;
};

export function LayoutShell({ children, className }: LayoutShellProps) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8", className)}>
      {children}
    </div>
  );
}
