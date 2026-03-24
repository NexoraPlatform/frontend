import { ReactNode } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { GoogleTagManagerLoader } from "@/components/analytics/google-tag-manager-loader";
import { LocaleSync } from "@/components/LocaleSync";
import { JsonLdScript } from "@/components/seo/json-ld-script";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { loadMessagesForNamespaces, sharedClientNamespaces } from "@/lib/i18n";
import { locales } from "@/lib/navigation";
import { buildGlobalKnowledgeGraph, serializeJsonLd } from "@/lib/seo";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export const dynamicParams = false;
export const dynamic = "auto";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!locales.includes(locale as (typeof locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await loadMessagesForNamespaces(locale, sharedClientNamespaces);

  const rawGtmId = process.env.GTM_ID?.trim();
  const gtmId = rawGtmId && /^[A-Za-z0-9_-]+$/.test(rawGtmId) ? rawGtmId : null;
  const isProduction = process.env.NODE_ENV === "production";
  const shouldLoadGtm = isProduction && Boolean(gtmId);

  const globalJsonLd = serializeJsonLd(buildGlobalKnowledgeGraph(locale));

  return (
    <div className="font-sans antialiased">
      <JsonLdScript id="global" json={globalJsonLd} />
      {shouldLoadGtm && gtmId && (
        <GoogleTagManagerLoader gtmId={gtmId} />
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
        <CurrencyProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            storageKey="trustora-theme"
          >
            <LocaleSync />
            <div id="main-content" tabIndex={-1}>
              {children}
            </div>
            <Toaster position="top-right" expand={false} richColors closeButton />
          </ThemeProvider>
        </CurrencyProvider>
      </NextIntlClientProvider>
    </div>
  );
}
