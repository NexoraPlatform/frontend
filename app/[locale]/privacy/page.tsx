import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { PrivacyContent } from "@/components/privacy-content";
import { TrustoraThemeStyles } from "@/components/trustora/theme-styles";
import { generateSEO } from "@/lib/seo";

type PrivacyPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({ params }: PrivacyPageProps) {
  const { locale } = await params;
  const isEnglish = locale?.toLowerCase().startsWith("en");

  return generateSEO({
    title: isEnglish ? "Privacy Policy" : "Politica de confidențialitate",
    description: isEnglish
      ? "Trustora privacy policy for clients and providers."
      : "Politica de confidențialitate Trustora pentru clienți și furnizori.",
    url: "/privacy",
  });
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-[#070C14] dark:text-slate-100">
      <Header />
      <TrustoraThemeStyles />
      <main className="container mx-auto px-4 pb-16 pt-28">
        <div className="mx-auto mb-6 mt-6 max-w-5xl rounded-3xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur dark:border-[#1E2A3D] dark:bg-[#0B1220]/90 md:p-10">
          <PrivacyContent
            className="text-sm md:text-base"
            headingClassName="text-2xl md:text-3xl"
            locale={locale}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
