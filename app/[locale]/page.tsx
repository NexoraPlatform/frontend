import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import {
  HomeFinalCtaSkeleton,
  HomeHeroSkeleton,
  HomeMessagingSkeleton,
  HomePillarsSkeleton,
  HomeVisualSkeleton,
} from "@/components/loading/homepage-sections-skeleton";
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
import { Suspense } from "react";

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
      ? "Marketplace de Freelancing IT cu Plăți Securizate prin Escrow | Trustora"
      : "IT Freelancing Marketplace with Escrow-Secured Payments | Trustora",
    description: isRo
      ? "Intră pe lista de acces anticipat pentru proiecte IT cu profesioniști verificați, plăți protejate prin escrow și contracte digitale clare."
      : "Join early access for IT projects with verified professionals, escrow-protected payments, and clear digital contracts.",
    keywords: [
      "trustora",
      "early access",
      "waitlist",
      "escrow",
      "verified IT experts",
      "digital contracts",
      "software projects",
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
      ? "De ce se înscriu membrii fondatori Trustora"
      : "Why founding members join Trustora";
  const messagingHeading =
    locale === "ro"
      ? "Acces anticipat pentru companii și profesioniști IT"
      : "Early access for companies and IT professionals";
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
        itemProp="mainContentOfPage"
      >
        <article itemScope itemType="https://schema.org/Service" className="contents">
          <meta itemProp="name" content={pageTitle} />
          <meta itemProp="description" content={heroSubtitle} />
          <meta
            itemProp="serviceType"
            content={
              locale === "ro"
                ? "Marketplace de freelancing IT cu plăți securizate prin escrow"
                : "IT freelancing marketplace with escrow-secured payments"
            }
          />
          <meta itemProp="areaServed" content="Romania" />

          <div className="bg-[#060B19]">
            <section aria-labelledby="trustora-home-hero-heading">
              <h2 id="trustora-home-hero-heading" className="sr-only">
                {pageTitle}
              </h2>
              <Suspense fallback={<HomeHeroSkeleton />}>
                <TrustoraHeroSection locale={locale} />
              </Suspense>
            </section>
          </div>

          <section aria-labelledby="trustora-home-pillars-heading">
            <h2 id="trustora-home-pillars-heading" className="sr-only">
              {pillarsHeading}
            </h2>
            <Suspense fallback={<HomePillarsSkeleton />}>
              <TrustoraPillarsSection locale={locale} />
            </Suspense>
          </section>

          <section aria-labelledby="trustora-home-messaging-heading">
            <h2 id="trustora-home-messaging-heading" className="sr-only">
              {messagingHeading}
            </h2>
            <Suspense fallback={<HomeMessagingSkeleton />}>
              <TrustoraMessagingSection locale={locale} />
            </Suspense>
          </section>

          <section aria-labelledby="trustora-home-visual-heading">
            <h2 id="trustora-home-visual-heading" className="sr-only">
              {visualHeading}
            </h2>
            <Suspense fallback={<HomeVisualSkeleton />}>
              <TrustoraVisualLanguageSection locale={locale} />
            </Suspense>
          </section>

          <aside aria-label={finalCtaTitle}>
            <Suspense fallback={<HomeFinalCtaSkeleton />}>
              <TrustoraFinalCtaSection locale={locale} />
            </Suspense>
          </aside>
        </article>
      </main>

      <footer role="contentinfo" itemScope itemType="https://schema.org/WPFooter">
        <Footer />
      </footer>
    </div>
  );
}
