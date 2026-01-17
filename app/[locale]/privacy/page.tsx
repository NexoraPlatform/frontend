import type { Metadata } from "next";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { PrivacyContent } from "@/components/privacy-content";
import { TrustoraThemeStyles } from "@/components/trustora/theme-styles";
import { generateSEO } from "@/lib/seo";

export const metadata: Metadata = generateSEO({
  title: "Politica de confidențialitate",
  description:
    "Politica de confidențialitate Trustora pentru clienți și furnizori.",
  url: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-[#070C14] dark:text-slate-100">
      <Header />
      <TrustoraThemeStyles />
      <main className="container mx-auto px-4 pb-16 pt-28">
        <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur dark:border-[#1E2A3D] dark:bg-[#0B1220]/90 md:p-10">
          <PrivacyContent className="text-sm md:text-base" headingClassName="text-2xl md:text-3xl" />
        </div>
      </main>
      <Footer />
    </div>
  );
}
