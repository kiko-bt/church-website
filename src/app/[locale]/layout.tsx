import type { ReactNode } from "react";
import type { Metadata } from "next";
import type { Locale } from "@/constants/locales";
import { locales } from "@/constants/locales";
import { inter, playfairDisplay } from "@/styles/fonts";
import { generateBaseMetadata } from "@/lib/seo/metadata";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
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
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-background focus:px-4 focus:py-2 focus:font-medium focus:text-text-primary focus:shadow-md focus:outline-none focus:ring-2 focus:ring-accent-gold"
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
        {/* Vercel Web Analytics + Speed Insights. Both render null and ship
            their own "use client" directive and Suspense boundary, so this
            layout stays a Server Component and no wrapper is needed. Mounted
            here (not in app/layout.tsx) because this layout owns <body>; every
            user-facing route is locale-prefixed, so this covers the whole site
            exactly once — no duplicate initialization. Neither sets cookies.
            Both no-op outside Vercel, so local dev and tests are unaffected. */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
