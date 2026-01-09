import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { TrustoraFinalCtaSection } from "@/components/trustora/final-cta-section";
import { TrustoraHeroSection } from "@/components/trustora/hero-section";
import { TrustoraMessagingSection } from "@/components/trustora/messaging-section";
import { TrustoraPillarsSection } from "@/components/trustora/pillars-section";
import { TrustoraThemeStyles } from "@/components/trustora/theme-styles";
import { TrustoraVisualLanguageSection } from "@/components/trustora/visual-language-section";
import { t } from "@/lib/i18n";
import { Locale } from "@/types/locale";

export const revalidate = 86400; // 24h

interface HomePageProps {
    params: Promise<{ locale: Locale }>;
}

export default async function Home(props: HomePageProps) {
    const { locale } = await props.params;
    const [
        // features section heading
        featuresBadge,
        featuresTitle,
        featuresSubtitle,

        // why section heading
        whyBadge,
        whyTitle,
        whySubtitle,

        // CTA
        ctaTitle,
        ctaSubtitle,
        ctaStartNow,
        ctaBecomeExpert,

        // common labels
        completedLabel,
        growthLabel,
        exploreLabel,
        exploreServicesInCategory,

        // accessibility labels
        mainContentLabel,
        serviceCategoriesListLabel,
        categoryLabel,
        nexoraBenefitsListLabel,
        benefitLabel,
        statisticLabel,

        // FEATURES cards
        securePlatform,
        securePlatformDescription,
        expertTeam,
        expertTeamDescription,
        globalReach,
        globalReachDescription,
        awardWinning,
        awardWinningDescription,

        learnMoreAbout,
        findMore
    ] = await Promise.all([
        t(locale, "homepage.features.badge"),
        t(locale, "homepage.features.title"),
        t(locale, "homepage.features.subtitle"),

        t(locale, "homepage.why_nexora.badge"),
        t(locale, "homepage.why_nexora.title"),
        t(locale, "homepage.why_nexora.subtitle"),

        t(locale, "homepage.cta.title"),
        t(locale, "homepage.cta.subtitle"),
        t(locale, "homepage.cta.start_now"),
        t(locale, "homepage.cta.become_expert"),

        t(locale, "common.completed"),
        t(locale, "common.growth"),
        t(locale, "common.explore"),
        t(locale, "homepage.explore_services_in_category"),

        t(locale, "common.main_content"),
        t(locale, "common.service_categories_list"),
        t(locale, "common.category_label"),
        t(locale, "common.nexora_benefits_list"),
        t(locale, "common.benefit_label"),
        t(locale, "common.statistic_label"),

        t(locale, "homepage.why_nexora.secure_platform"),
        t(locale, "homepage.why_nexora.secure_platform_description"),
        t(locale, "homepage.why_nexora.expert_team"),
        t(locale, "homepage.why_nexora.expert_team_description"),
        t(locale, "homepage.why_nexora.global_reach"),
        t(locale, "homepage.why_nexora.global_reach_description"),
        t(locale, "homepage.why_nexora.award_winning"),
        t(locale, "homepage.why_nexora.award_winning_description"),

        t(locale, "common.learn_more_about"),
        t(locale, "common.find_more"),
    ]);

    return (
        <div className="bg-white text-[#0F172A] dark:bg-[#070C14] dark:text-[#E6EDF3]">
            <TrustoraThemeStyles />
            <Header />
            <main role="main" aria-label={mainContentLabel} id="main-content">
                <TrustoraHeroSection />
                <TrustoraPillarsSection />
                <TrustoraMessagingSection />
                <TrustoraVisualLanguageSection />
                <TrustoraFinalCtaSection />
            </main>
            <Footer />
        </div>
    );
}
