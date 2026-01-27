import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { TrustoraFinalCtaSection } from "@/components/trustora/final-cta-section";
import { TrustoraHeroSection } from "@/components/trustora/hero-section";
import { TrustoraMessagingSection } from "@/components/trustora/messaging-section";
import { TrustoraPillarsSection } from "@/components/trustora/pillars-section";
import { TrustoraThemeStyles } from "@/components/trustora/theme-styles";
import { TrustoraVisualLanguageSection } from "@/components/trustora/visual-language-section";
import { Locale } from "@/types/locale";
import {Metadata} from "next";
import { getTranslations } from "next-intl/server";

export const revalidate = 86400; // 24h

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nexoraplatform.com'; // Înlocuiește cu domeniul tău real

    return {
        title: {
            default: 'Trustora - Platforma #1 de Servicii IT și Freelancing', // Asigură-te că ai cheia asta în json
            template: `%s | Trustora` // Branding consistent
        },
        description: 'Găsește experți IT verificați pentru proiectul tău. De la dezvoltare web și aplicații mobile la marketing digital. Postează proiectul gratuit pe Trustora.',
        keywords: ['constructii', 'renovari', 'meseriasi', 'platforma constructii', 'trustora', 'servicii it', 'freelanceri romania', 'dezvoltare web', 'programatori', 'platforma freelancing', 'creare site', 'aplicatii mobile'], // Cuvinte cheie relevante
        metadataBase: new URL(baseUrl),
        alternates: {
            canonical: '/',
            languages: {
                'en': '/en',
                'ro': '/ro',
            },
        },
        openGraph: {
            title: 'Trustora - Platforma #1 de Servicii IT și Freelancing',
            description: 'Găsește experți IT verificați pentru proiectul tău. De la dezvoltare web și aplicații mobile la marketing digital. Postează proiectul gratuit pe Trustora.',
            url: `${baseUrl}/${locale}`,
            siteName: 'Trustora',
            images: [
                {
                    url: '/og-image.jpg', // Asigură-te că ai o imagine de calitate în public/
                    width: 1200,
                    height: 630,
                    alt: 'Trustora Platform Preview',
                },
            ],
            locale: locale,
            type: 'website',
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                'max-video-preview': -1,
                'max-image-preview': 'large',
                'max-snippet': -1,
            },
        },
    };
}

interface HomePageProps {
    params: Promise<{ locale: Locale }>;
}

export default async function Home(props: HomePageProps) {
    const { locale } = await props.params;
    const t = await getTranslations({ locale });
    const mainContentLabel = t("common.main_content");


    return (
        <>
            <div className="bg-white text-[#0F172A] dark:bg-[#070C14] dark:text-[#E6EDF3]">
                <TrustoraThemeStyles />
                <Header />
                <main role="main" aria-label={mainContentLabel} id="main-content" className="pt-8">
                    <TrustoraHeroSection locale={locale} />
                    <TrustoraPillarsSection locale={locale} />
                    <TrustoraMessagingSection locale={locale} />
                    <TrustoraVisualLanguageSection locale={locale} />
                    <TrustoraFinalCtaSection locale={locale} />
                </main>
                <Footer />
            </div>
        </>
    );
}
