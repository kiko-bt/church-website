import { redirect } from "next/navigation";
import { defaultLocale } from "@/constants/locales";

// Redirect bare "/" to the default locale.
// src/middleware.ts normally redirects first; this is the fallback.
export default function RootPage() {
  redirect(`/${defaultLocale}`);
}
