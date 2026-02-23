import { ReactNode } from "react";
import dynamic from "next/dynamic";
import Script from "next/script";
import { notFound } from "next/navigation";
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
import { locales } from "@/lib/navigation";
import { buildGlobalKnowledgeGraph, serializeJsonLd } from "@/lib/seo";

const OneSignalInit = dynamic(() => import("@/components/OneSignalInit"), {
  loading: () => null,
});

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!locales.includes(locale as (typeof locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages({ locale });
  const initialUser = null;
  const rawGtmId = process.env.NEXT_PUBLIC_GTM_ID?.trim();
  const gtmId = rawGtmId && /^[A-Za-z0-9_-]+$/.test(rawGtmId) ? rawGtmId : null;
  const isProduction = process.env.NODE_ENV === "production";
  const shouldLoadOneSignal = isProduction && Boolean(process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID);
  const shouldLoadGtm = isProduction && Boolean(gtmId);

  const globalJsonLd = serializeJsonLd(buildGlobalKnowledgeGraph());

  return (
    <div className="font-sans antialiased">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: globalJsonLd }}
      />
      {shouldLoadGtm && gtmId && (
        <Script id="gtm" strategy="lazyOnload">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':Date.now(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer',${JSON.stringify(gtmId)});`}
        </Script>
      )}
      {shouldLoadGtm && gtmId && (
        <noscript>
          <iframe
            title="Google Tag Manager"
            src={`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(gtmId)}`}
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
                <ChatProvider>{children}</ChatProvider>
              </NotificationProvider>
              <Toaster position="top-right" expand={false} richColors closeButton />
              {shouldLoadOneSignal && <OneSignalInit />}
            </ThemeProvider>
          </CurrencyProvider>
        </AuthProvider>
      </NextIntlClientProvider>
    </div>
  );
}
