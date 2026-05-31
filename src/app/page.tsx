import { redirect } from "next/navigation";
import { defaultLocale } from "@/constants/locales";

// Redirect bare "/" to the default locale.
// The next-intl middleware handles this at the edge once installed.
export default function RootPage() {
  redirect(`/${defaultLocale}`);
}
