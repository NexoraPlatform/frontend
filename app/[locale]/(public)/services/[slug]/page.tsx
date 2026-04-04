import type { Metadata } from "next";

import { ServicesPageClient } from "../services-page-client";
import {
  decodeServiceSlugToSearchTerm,
  getServicesPageInitialData,
} from "../services-page-data";
import { generateSEO } from "@/lib/seo";

type ServiceSlugPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export const revalidate = 300;

function formatServiceTitle(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: ServiceSlugPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const searchTerm = decodeServiceSlugToSearchTerm(slug) ?? slug;
  const formattedTitle = formatServiceTitle(searchTerm);

  return generateSEO({
    locale,
    pathname: `/services/${slug}`,
    title:
      locale === "ro"
        ? `${formattedTitle} - servicii IT`
        : `${formattedTitle} services`,
    description:
      locale === "ro"
        ? `Explorează servicii și furnizori pentru ${formattedTitle} pe Trustora.`
        : `Explore services and providers for ${formattedTitle} on Trustora.`,
  });
}

export default async function ServiceSlugPage({
  params,
}: ServiceSlugPageProps) {
  const { locale, slug } = await params;
  const initialData = await getServicesPageInitialData({
    locale,
    searchTerm: decodeServiceSlugToSearchTerm(slug),
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
