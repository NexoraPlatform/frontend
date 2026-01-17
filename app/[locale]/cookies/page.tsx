import { CookieContent } from "@/components/cookie-content";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { TrustoraThemeStyles } from "@/components/trustora/theme-styles";
import { generateSEO } from "@/lib/seo";

type CookiePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({ params }: CookiePageProps) {
  const { locale } = await params;
  const isEnglish = locale?.toLowerCase().startsWith("en");

  return generateSEO({
    title: isEnglish ? "Cookie Policy" : "Politica de cookie-uri",
    description: isEnglish
      ? "Trustora cookie policy and tracking preferences."
      : "Politica de cookie-uri Trustora și preferințele de tracking.",
    url: "/cookies",
  });
}

export default async function CookiePolicyPage({ params }: CookiePageProps) {
  const { locale } = await params;

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-[#070C14] dark:text-slate-100">
      <Header />
      <TrustoraThemeStyles />
      <main className="container mx-auto px-4 pb-16 pt-28">
        <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur dark:border-[#1E2A3D] dark:bg-[#0B1220]/90 md:p-10">
          <CookieContent
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
