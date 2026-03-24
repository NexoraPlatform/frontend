import {
  buildGlobalKnowledgeGraph,
  buildPageKnowledgeGraph,
  localizePath,
  serializeJsonLd,
} from "@/lib/seo";
import type { Locale } from "@/types/locale";
import enLandingMessages from "@/messages/en/trustora/landing.json";
import roLandingMessages from "@/messages/ro/trustora/landing.json";

const locales: Locale[] = ["en", "ro"];

type LandingSeoContent = {
  breadcrumbName: string;
  pageDescription: string;
  pageTitle: string;
};

const landingSeoContentByLocale: Record<Locale, LandingSeoContent> = {
  en: {
    breadcrumbName: "Home",
    pageDescription: enLandingMessages.landing.hero.description,
    pageTitle: `${enLandingMessages.landing.hero.title} ${enLandingMessages.landing.hero.title_highlight}`
      .replace(/\s+/g, " ")
      .trim(),
  },
  ro: {
    breadcrumbName: "Acasă",
    pageDescription: roLandingMessages.landing.hero.description,
    pageTitle: `${roLandingMessages.landing.hero.title} ${roLandingMessages.landing.hero.title_highlight}`
      .replace(/\s+/g, " ")
      .trim(),
  },
};

export async function sha256Base64(value: string): Promise<string> {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  const bytes = new Uint8Array(digest);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function buildHomepageJsonLd(locale: Locale): string {
  const seoContent = landingSeoContentByLocale[locale];

  return serializeJsonLd(
    buildPageKnowledgeGraph({
      locale,
      pathname: "/",
      pageTitle: seoContent.pageTitle,
      pageDescription: seoContent.pageDescription,
      breadcrumbs: [
        {
          name: seoContent.breadcrumbName,
          path: localizePath("/", locale),
        },
      ],
    })
  );
}

function buildGlobalJsonLd(locale: Locale): string {
  return serializeJsonLd(buildGlobalKnowledgeGraph(locale));
}

export async function buildAllowedJsonLdHashes(): Promise<string[]> {
  const payloads = locales.flatMap((locale) => [
    buildGlobalJsonLd(locale),
    buildHomepageJsonLd(locale),
  ]);

  const hashes = await Promise.all(
    payloads.map(async (payload) => `'sha256-${await sha256Base64(payload)}'`)
  );

  return Array.from(new Set(hashes));
}
