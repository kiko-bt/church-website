import { getRequestConfig } from "next-intl/server";
import { locales, timeZone, type Locale } from "@/constants/locales";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !locales.includes(locale as Locale)) {
    locale = "mk";
  }
  return {
    locale,
    messages: (await import(`../../../messages/${locale}.json`)).default,
    // Pin a global time zone so any date/time formatting is deterministic and
    // identical between the SSG build and the client (avoids hydration
    // mismatches). Mirrored on the client provider via the same constant.
    timeZone,
  };
});
