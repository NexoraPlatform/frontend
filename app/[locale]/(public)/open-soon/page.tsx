import type { Metadata } from "next";

import OpenSoonPageClient from "./open-soon-client";
import { generateSEO } from "@/lib/seo";

type OpenSoonPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({
  params,
}: OpenSoonPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isEnglish = locale?.toLowerCase().startsWith("en");

  return generateSEO({
    title: isEnglish
      ? "Trusted infrastructure for the digital economy"
      : "Infrastructura de incredere pentru economia digitala",
    description: isEnglish
      ? "Trustora secures money and work through automated escrow, legal contracts, and verified professionals. Early Access registration starts soon."
      : "Trustora securizeaza banii si munca prin escrow automatizat, contracte legale si profesionisti verificati. Inscrierea pentru Early Access incepe in curand.",
    locale,
    url: "/open-soon",
    robots: {
      index: false,
      follow: false,
    },
  });
}

export default function OpenSoonPage() {
  return <OpenSoonPageClient />;
}
