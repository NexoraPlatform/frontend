import { TrustoraLandingHomepage } from "@/components/homepage/trustora-landing-homepage";
import { TrustoraThemeStyles } from "@/components/trustora/theme-styles";
import {
  buildPageKnowledgeGraph,
  generateSEO,
  localizePath,
  serializeJsonLd,
} from "@/lib/seo";
import type { Locale } from "@/types/locale";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { JsonLdScript } from "@/components/seo/json-ld-script";

export const revalidate = 86400;

interface HomePageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const isRo = locale === "ro";

  return generateSEO({
    locale,
    pathname: "/",
    title: isRo
      ? "Încredere financiară automatizată | Trustora"
      : "Financial Trust, Automated | Trustora",
    description: isRo
      ? "Securizează tranzacțiile și automatizează conformitatea cu platforma fintech next-gen Trustora."
      : "Secure your transactions and automate compliance with Trustora's next-gen fintech platform.",
    keywords: [
      "trustora",
      "fintech",
      "financial infrastructure",
      "escrow",
      "digital contracts",
      "compliance automation",
    ],
  });
}

export default async function Home({ params }: HomePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  const heroTitle = t("trustora.landing.hero.title");
  const heroTitleHighlight = t("trustora.landing.hero.title_highlight");
  const heroSubtitle = t("trustora.landing.hero.description");
  const mainContentLabel = t("common.main_content");

  const pageTitle = `${heroTitle} ${heroTitleHighlight}`.replace(/\s+/g, " ").trim();
  const homepageGraph = buildPageKnowledgeGraph({
    locale,
    pathname: "/",
    pageTitle,
    pageDescription: heroSubtitle,
    breadcrumbs: [
      {
        name: locale === "ro" ? "Acasă" : "Home",
        path: localizePath("/", locale),
      },
    ],
  });

  return (
    <div
      className="bg-white text-[#0F172A] dark:bg-[#070C14] dark:text-[#E6EDF3]"
      itemScope
      itemType="https://schema.org/WebPage"
    >
      <JsonLdScript id="homepage" json={serializeJsonLd(homepageGraph)} />

      <TrustoraThemeStyles />

      <main
        role="main"
        aria-label={mainContentLabel}
        itemProp="mainContentOfPage"
      >
        <article itemScope itemType="https://schema.org/Service" className="contents">
          <meta itemProp="name" content={pageTitle} />
          <meta itemProp="description" content={heroSubtitle} />
          <meta
            itemProp="serviceType"
            content={
              locale === "ro"
                ? "Platformă fintech next-gen pentru tranzacții securizate și conformitate automatizată"
                : "Next-gen fintech platform for secure transactions and automated compliance"
            }
          />
          <meta itemProp="areaServed" content="Romania" />
          <TrustoraLandingHomepage />
        </article>
      </main>
    </div>
  );
}
