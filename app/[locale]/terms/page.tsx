import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { TermsContent } from "@/components/terms-content";
import { TrustoraThemeStyles } from "@/components/trustora/theme-styles";
import { generateSEO } from "@/lib/seo";

type TermsPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({ params }: TermsPageProps) {
  const { locale } = await params;
  const isEnglish = locale?.toLowerCase().startsWith("en");

  return generateSEO({
    title: isEnglish ? "Terms and Conditions" : "Termeni și condiții",
    description: isEnglish
      ? "Trustora terms and conditions for clients and providers."
      : "Termenii și condițiile de utilizare Trustora pentru clienți și furnizori.",
    url: "/terms",
  });
}

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = await params;

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-[#070C14] dark:text-slate-100">
      <Header />
      <TrustoraThemeStyles />
      <main className="container mx-auto px-4 pb-16 pt-28">
        <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur dark:border-[#1E2A3D] dark:bg-[#0B1220]/90 md:p-10">
          <TermsContent
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
