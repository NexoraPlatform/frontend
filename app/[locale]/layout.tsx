import { ReactNode } from "react";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
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
import {
  TRUSTORA_THEME_ATTRIBUTE,
  TRUSTORA_THEME_DEFAULT,
  TRUSTORA_THEME_STORAGE_KEY,
} from "@/lib/theme";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export const dynamicParams = false;
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  const requestHeaders = await headers();
  const nonce =
    requestHeaders.get("x-nonce") ??
    requestHeaders.get("content-security-policy")?.match(/'nonce-([^']+)'/)?.[1] ??
    undefined;

  if (!locales.includes(locale as (typeof locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await loadMessagesForNamespaces(locale, sharedClientNamespaces);

  const rawGtmId = process.env.GTM_ID?.trim();
  const gtmId = rawGtmId && /^[A-Za-z0-9_-]+$/.test(rawGtmId) ? rawGtmId : null;
  const shouldLoadGtm = Boolean(gtmId);

  const globalJsonLd = serializeJsonLd(buildGlobalKnowledgeGraph(locale));

  return (
    <div className="font-sans antialiased">
      <JsonLdScript id="global" json={globalJsonLd} nonce={nonce} />
      {shouldLoadGtm && gtmId && (
        <GoogleTagManagerLoader gtmId={gtmId} nonce={nonce} />
      )}
      {nonce ? <meta name="csp-nonce" content={nonce} /> : null}
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
            attribute={TRUSTORA_THEME_ATTRIBUTE}
            defaultTheme={TRUSTORA_THEME_DEFAULT}
            enableSystem
            disableTransitionOnChange
            storageKey={TRUSTORA_THEME_STORAGE_KEY}
            nonce={nonce}
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
