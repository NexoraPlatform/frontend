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
    const mainContentLabel = await t(locale, "common.main_content");

    return (
        <div className="bg-white text-[#0F172A] dark:bg-[#070C14] dark:text-[#E6EDF3]">
            <TrustoraThemeStyles />
            <Header />
            <main role="main" aria-label={mainContentLabel} id="main-content">
                <TrustoraHeroSection />
                <TrustoraPillarsSection locale={locale} />
                <TrustoraMessagingSection locale={locale} />
                <TrustoraVisualLanguageSection locale={locale} />
                <TrustoraFinalCtaSection locale={locale} />
            </main>
            <Footer />
        </div>
    );
}
