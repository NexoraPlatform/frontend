import { ReactNode } from "react";
import dynamic from "next/dynamic";
import { JetBrains_Mono, Manrope } from "next/font/google";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";

import ActivityTracker from "@/components/ActivityTracker";
import { LocaleSync } from "@/components/LocaleSync";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/auth-context";
import { ChatProvider } from "@/contexts/chat-context";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { NotificationProvider } from "@/contexts/notification-context";
import { buildGlobalKnowledgeGraph, serializeJsonLd } from "@/lib/seo";
import { getServerUser } from "@/lib/server-auth";

import "../globals.css";

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

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'ro' }];
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Enable static rendering
  setRequestLocale(locale);

  const messages = await getMessages();
  const initialUser = await getServerUser();
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID?.trim();
  const shouldLoadOneSignal = Boolean(process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID);

  const globalJsonLd = serializeJsonLd(buildGlobalKnowledgeGraph());

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta httpEquiv="x-dns-prefetch-control" content="on" />
        <meta name="color-scheme" content="light dark" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: globalJsonLd }}
        />

        {/* Resource Hints */}
        <link rel="preconnect" href="https://backend.trustora.ro" />
        <link rel="preconnect" href="https://cdn.onesignal.com" />
        <title>Trustora</title>
      </head>
      <body className={`${manrope.variable} ${jetBrainsMono.variable} ${manrope.className} font-sans antialiased`}>
        {gtmId && (
          <Script id="gtm" strategy="lazyOnload">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':Date.now(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}
          </Script>
        )}
        {gtmId && (
          <noscript>
            <iframe
              title="Google Tag Manager"
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}

        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthProvider initialUser={initialUser}>
            <CurrencyProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
                storageKey="trustora-theme"
              >
                <LocaleSync />
                <ActivityTracker />
                <NotificationProvider>
                  <ChatProvider>
                    {children}
                  </ChatProvider>
                </NotificationProvider>
                <Toaster position="top-right" expand={false} richColors closeButton />
                {shouldLoadOneSignal && <OneSignalInit />}
              </ThemeProvider>
            </CurrencyProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
