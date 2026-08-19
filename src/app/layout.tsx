import type { ReactNode } from "react";

// Root layout is intentionally minimal.
// The [locale] layout provides <html>, <body>, fonts, and providers.
// This pattern is required for next-intl locale-prefixed routing.
export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <>{children}</>;
}