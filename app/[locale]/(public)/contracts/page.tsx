import type { Metadata } from "next";

import ContractGeneratorClient from "./contracts-client";
import { generateSEO } from "@/lib/seo";

type ContractsPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({
  params,
}: ContractsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isEnglish = locale?.toLowerCase().startsWith("en");

  return generateSEO({
    title: isEnglish ? "Contract generator preview" : "Previzualizare generator contracte",
    description: isEnglish
      ? "Internal preview for Trustora's contract generation flow."
      : "Previzualizare interna pentru fluxul de generare contracte Trustora.",
    locale,
    url: "/contracts",
    robots: {
      index: false,
      follow: false,
    },
  });
}

export default function ContractsPage() {
  return <ContractGeneratorClient />;
}
