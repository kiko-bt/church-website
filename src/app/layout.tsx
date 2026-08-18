import type { ReactNode } from "react";
import Script from "next/script";
// Root layout is intentionally minimal.
// The [locale] layout provides <html>, <body>, fonts, and providers.
// This pattern is required for next-intl locale-prefixed routing.
export default function RootLayout 
({
  children,
}: Readonly<{ children: ReactNode }>) {
return (
  <>
    <Script
      src="https://www.googletagmanager.com/gtag/js?id=G-5S46HHB1HT"
      strategy="afterInteractive"
    />
    <Script id="google-analytics" strategy="afterInteractive">
      {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-5S46HHB1HT');
      `}
    </Script>
    {children}
  </>
);}
