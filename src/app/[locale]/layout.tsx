import type { ReactNode } from "react";
import type { Metadata } from "next";
import type { Locale } from "@/constants/locales";
import { locales } from "@/constants/locales";
import { inter, playfairDisplay } from "@/styles/fonts";
import { generateBaseMetadata } from "@/lib/seo/metadata";
import { getMessages, setRequestLocale } from "next-intl/server";
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

  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${playfairDisplay.variable}`}
      suppressHydrationWarning
    >
      <body className="font-body antialiased">
        <Providers locale={locale} messages={messages}>
          <div className="flex min-h-screen flex-col">
            <Header locale={locale} />
            <main className="flex-1" id="main-content">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
