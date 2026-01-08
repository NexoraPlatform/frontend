import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { TrustoraFinalCtaSection } from "@/components/trustora/final-cta-section";
import { TrustoraHeroSection } from "@/components/trustora/hero-section";
import { TrustoraMessagingSection } from "@/components/trustora/messaging-section";
import { TrustoraPillarsSection } from "@/components/trustora/pillars-section";
import { TrustoraVisualLanguageSection } from "@/components/trustora/visual-language-section";
import { Locale } from "@/types/locale";

export const revalidate = 86400; // 24h

interface HomePageProps {
    params: Promise<{ locale: Locale }>;
}

export default async function Home(props: HomePageProps) {
    const { locale } = await props.params;
    void locale;

    return (
        <div className="bg-white text-[#0F172A]">
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                        :root {
                            --midnight-blue: #0B1C2D;
                            --emerald-green: #1BC47D;
                            --success-green: #21D19F;
                            --warning-amber: #F5A623;
                            --error-red: #E5484D;
                            --bg-light: #F5F7FA;
                            --text-near-black: #0F172A;
                        }
                        body {
                            font-family: 'Inter', sans-serif;
                            background-color: white;
                            color: var(--text-near-black);
                            scroll-behavior: smooth;
                        }
                        .mono { font-family: 'JetBrains Mono', monospace; }
                        .btn-primary {
                            background-color: var(--emerald-green);
                            color: white;
                            transition: all 0.2s ease;
                        }
                        .btn-primary:hover {
                            filter: brightness(1.05);
                            box-shadow: 0 0 0 4px rgba(27, 196, 125, 0.15);
                        }
                        .glass-card {
                            background: white;
                            border: 1px solid rgba(11, 28, 45, 0.08);
                            border-radius: 12px;
                        }
                        .section-divider {
                            border-bottom: 1px solid rgba(11, 28, 45, 0.05);
                        }
                        .pillar-icon {
                            stroke-width: 1.5px;
                            color: var(--emerald-green);
                        }
                    `,
                }}
            />
            <Header />
            <main role="main" aria-label="Conținut principal" id="main-content">
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
