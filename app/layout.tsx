import dynamic from "next/dynamic";
import { JetBrains_Mono, Manrope } from "next/font/google";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import type { ReactNode } from "react";

import ActivityTracker from "@/components/ActivityTracker";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/auth-context";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { buildGlobalKnowledgeGraph, buildRootMetadata, serializeJsonLd } from "@/lib/seo";
import { getServerUser } from "@/lib/server-auth";

import "./globals.css";

const OneSignalInit = dynamic(() => import("@/components/OneSignalInit"), {
  loading: () => null,
});

const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-manrope",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = buildRootMetadata();

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  maximumScale: 5,
  userScalable: true,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0B1C2D" },
    { media: "(prefers-color-scheme: dark)", color: "#070C14" },
  ],
};

const globalJsonLd = serializeJsonLd(buildGlobalKnowledgeGraph());

export default async function RootLayout({ children }: { children: ReactNode }) {
  const initialUser = await getServerUser();
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID?.trim();
  const shouldLoadOneSignal = Boolean(process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta httpEquiv="x-dns-prefetch-control" content="on" />
        <meta name="color-scheme" content="light dark" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://images.pexels.com" crossOrigin="" />
        <link rel="dns-prefetch" href="//images.pexels.com" />
        <link rel="dns-prefetch" href="//cdn.onesignal.com" />
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: globalJsonLd }}
        />

        {gtmId ? (
          <Script id="gtm-lazy" strategy="lazyOnload">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':Date.now(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}
          </Script>
        ) : null}
      </head>

      <body
        className={`${manrope.variable} ${jetBrainsMono.variable} ${manrope.className} font-sans antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[100] focus:rounded-md focus:bg-[#0B1C2D] focus:px-3 focus:py-2 focus:text-white"
        >
          Skip to main content
        </a>

        {gtmId ? (
          <noscript>
            <iframe
              title="Google Tag Manager"
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        ) : null}

        <AuthProvider initialUser={initialUser}>
          <CurrencyProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
              storageKey="trustora-theme"
            >
              <ActivityTracker />
              {shouldLoadOneSignal ? <OneSignalInit /> : null}
              {children}
              <Toaster position="top-right" expand={false} richColors closeButton />
            </ThemeProvider>
          </CurrencyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
