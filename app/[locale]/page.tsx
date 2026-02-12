import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { TrustoraFinalCtaSection } from "@/components/trustora/final-cta-section";
import { TrustoraHeroSection } from "@/components/trustora/hero-section";
import { TrustoraMessagingSection } from "@/components/trustora/messaging-section";
import { TrustoraPillarsSection } from "@/components/trustora/pillars-section";
import { TrustoraThemeStyles } from "@/components/trustora/theme-styles";
import { TrustoraVisualLanguageSection } from "@/components/trustora/visual-language-section";
import {
  buildPageKnowledgeGraph,
  generateSEO,
  localizePath,
  serializeJsonLd,
} from "@/lib/seo";
import type { Locale } from "@/types/locale";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

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
    title: isRo ? "Marketplace servicii IT și freelancing" : "IT services and freelancing marketplace",
    description: isRo
      ? "Găsește experți IT verificați pentru proiectele tale: dezvoltare web, aplicații mobile, UI/UX și marketing digital, cu plăți protejate prin escrow."
      : "Find verified IT experts for web development, mobile apps, UI/UX, and digital marketing, with escrow-protected payments.",
    keywords: [
      "trustora",
      "marketplace IT",
      "freelancing",
      "escrow",
      "dezvoltare web",
      "aplicatii mobile",
      "ui ux",
      "digital marketing",
    ],
  });
}

export default async function Home({ params }: HomePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  const heroTitle = t("trustora.hero.title");
  const heroTitleHighlight = t("trustora.hero.title_highlight");
  const heroSubtitle = t("trustora.hero.subtitle");
  const mainContentLabel = t("common.main_content");
  const finalCtaTitle = t("trustora.final_cta.title");

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

  const pillarsHeading =
    locale === "ro"
      ? "Pilonii platformei Trustora pentru servicii IT"
      : "Trustora platform pillars for IT services";
  const messagingHeading =
    locale === "ro"
      ? "Fluxuri pentru clienți și freelanceri IT"
      : "Workflows for clients and IT freelancers";
  const visualHeading = t("trustora.visual.title");

  return (
    <div
      className="bg-white text-[#0F172A] dark:bg-[#070C14] dark:text-[#E6EDF3]"
      itemScope
      itemType="https://schema.org/WebPage"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(homepageGraph) }}
      />

      <TrustoraThemeStyles />

      <header role="banner" itemScope itemType="https://schema.org/WPHeader">
        <Header />
      </header>

      <main
        role="main"
        aria-label={mainContentLabel}
        id="main-content"
        className="pt-8"
        itemProp="mainContentOfPage"
      >
        <article itemScope itemType="https://schema.org/Service" className="contents">
          <meta itemProp="name" content={pageTitle} />
          <meta itemProp="description" content={heroSubtitle} />
          <meta
            itemProp="serviceType"
            content={locale === "ro" ? "Marketplace servicii IT și freelancing" : "IT services marketplace"}
          />
          <meta itemProp="areaServed" content="Romania" />

          <section aria-labelledby="trustora-home-hero-heading">
            <h2 id="trustora-home-hero-heading" className="sr-only">
              {pageTitle}
            </h2>
            <TrustoraHeroSection locale={locale} />
          </section>

          <section aria-labelledby="trustora-home-pillars-heading">
            <h2 id="trustora-home-pillars-heading" className="sr-only">
              {pillarsHeading}
            </h2>
            <TrustoraPillarsSection locale={locale} />
          </section>

          <section aria-labelledby="trustora-home-messaging-heading">
            <h2 id="trustora-home-messaging-heading" className="sr-only">
              {messagingHeading}
            </h2>
            <TrustoraMessagingSection locale={locale} />
          </section>

          <section aria-labelledby="trustora-home-visual-heading">
            <h2 id="trustora-home-visual-heading" className="sr-only">
              {visualHeading}
            </h2>
            <TrustoraVisualLanguageSection locale={locale} />
          </section>

          <aside aria-label={finalCtaTitle}>
            <TrustoraFinalCtaSection locale={locale} />
          </aside>
        </article>
      </main>

      <footer role="contentinfo" itemScope itemType="https://schema.org/WPFooter">
        <Footer />
      </footer>
    </div>
  );
}
