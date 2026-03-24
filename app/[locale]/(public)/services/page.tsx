import type { Metadata } from "next";

import { ServicesPageClient } from "./services-page-client";

import {
  getServicesPageInitialData,
  normalizeSearchParam,
} from "./services-page-data";
import { generateSEO } from "@/lib/seo";

type ServicesPageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ search?: string | string[] }>;
};

export const revalidate = 300;

export async function generateMetadata({
  params,
}: ServicesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isEnglish = locale?.toLowerCase().startsWith("en");

  return generateSEO({
    title: isEnglish ? "Services Marketplace" : "Marketplace de servicii",
    description: isEnglish
      ? "Find expert developers across technologies and services."
      : "Gaseste dezvoltatori experti pentru tehnologiile si serviciile tale.",
    locale,
    url: "/services",
  });
}

export default async function ServicesPage({
  params,
  searchParams,
}: ServicesPageProps) {
  const { locale } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialData = await getServicesPageInitialData({
    locale,
    searchTerm: normalizeSearchParam(resolvedSearchParams?.search),
  });

  return (
    <ServicesPageClient
      initialCategories={initialData.initialCategories}
      initialServices={initialData.initialServices}
      initialHasMore={initialData.initialHasMore}
      initialSearchTerm={initialData.initialSearchTerm}
    />
  );
}
