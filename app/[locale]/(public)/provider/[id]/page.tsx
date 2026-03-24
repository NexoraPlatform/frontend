import type { Metadata } from "next";

import ProviderProfileClient from "./ProviderProfileClient";
import apiClient from "@/lib/api";
import { generateSEO } from "@/lib/seo";

type PageProps = {
    params: Promise<{ locale: string; id: string }>;
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { locale, id } = await params;
    const isEnglish = locale?.toLowerCase().startsWith("en");
    let providerName: string | undefined;

    try {
        providerName = await apiClient.getProviderUserNameByProfileUrl(id);
    } catch {
        providerName = undefined;
    }

    return generateSEO({
        title: providerName
            ? isEnglish
                ? `${providerName} | Provider profile`
                : `${providerName} | Profil prestator`
            : isEnglish
                ? "Provider profile"
                : "Profil prestator",
        description: providerName
            ? isEnglish
                ? `See details about ${providerName}, including offered services and reviews.`
                : `Vezi detalii despre ${providerName}, inclusiv servicii oferite si evaluari.`
            : isEnglish
                ? "See details about the selected provider, including offered services and reviews."
                : "Vezi detalii despre prestatorul selectat, inclusiv servicii oferite si evaluari.",
        locale,
        url: `/provider/${id}`,
    });
}

export default async function ProviderProfilePage({ params }: PageProps) {
    const { id } = await params;
    return <ProviderProfileClient id={id} />;
}
