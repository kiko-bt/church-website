import type { ReactNode } from "react";
import type { Metadata } from "next";
import type { Locale } from "@/constants/locales";
import { locales } from "@/constants/locales";
import { inter, playfairDisplay } from "@/styles/fonts";
import { generateBaseMetadata } from "@/lib/seo/metadata";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { Providers } from "@/components/providers/Providers";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "@/app/globals.css";

// Next.js 15 dynamic route params are typed as `string` at the framework level.
// We cast to `Locale` after reading, which is safe because the middleware
// only routes valid locales to this layout.
type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  return generateBaseMetadata(locale as Locale);
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale as Locale;

  // Enable static rendering: without this, next-intl cannot resolve the active
  // locale during SSG (the request header is unavailable at build time) and
  // falls back to `defaultLocale`, baking the wrong language into every page.
  // Must run before `getMessages()` / any `getTranslations()` call.
  setRequestLocale(locale);

  const [messages, t] = await Promise.all([
    getMessages(),
    getTranslations("common"),
  ]);

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${playfairDisplay.variable}`}
      suppressHydrationWarning
    >
      <body className="font-body antialiased">
        {/* Skip link: the first focusable element, so keyboard and screen-reader
            users can bypass the header/nav straight to the page content
            (WCAG 2.4.1). Visually hidden until focused. */}
        <a
          href="#main-content"
          className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-50 focus-visible:rounded-sm focus-visible:bg-background focus-visible:px-4 focus-visible:py-2 focus-visible:font-medium focus-visible:text-text-primary focus-visible:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold"
        >
          {t("skipToContent")}
        </a>
        <Providers locale={locale} messages={messages}>
          <div className="flex min-h-screen flex-col">
            <Header locale={locale} />
            <main className="flex-1" id="main-content" tabIndex={-1}>
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
