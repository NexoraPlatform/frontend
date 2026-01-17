"use client";

import { Briefcase, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { LocalizedLink } from "@/components/LocalizedLink";
import { TrustoraStoryCard } from "@/components/trustora/trustora-story-card";
import { TrustoraThemeStyles } from "@/components/trustora/theme-styles";
import { usePathname } from "next/navigation";
import { useAsyncTranslation } from "@/hooks/use-async-translation";
import { Locale } from "@/types/locale";

export default function EarlyAccessPage() {
    const pathname = usePathname();
    const locale = (pathname.split("/")[1] as Locale) || "ro";
    const badgeText = useAsyncTranslation(locale, "trustora.early_access.landing.badge", "Înscrieri early access");
    const titleText = useAsyncTranslation(locale, "trustora.early_access.landing.title", "Alege tipul de cont");
    const titleHighlightText = useAsyncTranslation(
        locale,
        "trustora.early_access.landing.title_highlight",
        "Trustora",
    );
    const descriptionText = useAsyncTranslation(
        locale,
        "trustora.early_access.landing.description",
        "Înscrierile sunt pentru early access: în curând vom lansa early beta, iar cei înscriși vor primi primii invitațiile. Dacă ești client, te ajutăm să găsești prestatori verificați. Dacă ești prestator, îți pregătim profilul pentru proiecte plătite în siguranță.",
    );
    const clientTitle = useAsyncTranslation(locale, "trustora.early_access.landing.client_title", "Sunt client");
    const clientDescription = useAsyncTranslation(
        locale,
        "trustora.early_access.landing.client_description",
        "Completează datele despre companie și nevoile de recrutare. Vei primi acces la prestatori cu scor ridicat.",
    );
    const clientCta = useAsyncTranslation(
        locale,
        "trustora.early_access.landing.client_cta",
        "Încep formularul pentru client",
    );
    const providerTitle = useAsyncTranslation(locale, "trustora.early_access.landing.provider_title", "Sunt prestator");
    const providerDescription = useAsyncTranslation(
        locale,
        "trustora.early_access.landing.provider_description",
        "Spune-ne experiența ta și setările preferate. Îți pregătim profilul pentru proiecte sigure.",
    );
    const providerCta = useAsyncTranslation(
        locale,
        "trustora.early_access.landing.provider_cta",
        "Încep formularul pentru prestator",
    );

    return (
        <div className="min-h-screen bg-[#F5F7FA] text-[#0F172A] dark:bg-[#070C14] dark:text-[#E6EDF3]">
            <TrustoraThemeStyles />
            <Header />

            <div className="relative mt-8 overflow-hidden">
                <div className="absolute inset-0 hero-gradient" />
                <div className="relative container mx-auto px-4 py-16">
                    <div className="mx-auto max-w-3xl space-y-8 text-center">
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-100/60 px-4 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                            {badgeText}
                        </div>
                        <div className="space-y-4">
                            <h1 className="text-4xl font-bold leading-tight text-[#0F172A] dark:text-white md:text-5xl">
                                {titleText} <span className="text-[#1BC47D]">{titleHighlightText}</span>
                            </h1>
                            <p className="text-lg text-slate-600 dark:text-slate-300">
                                {descriptionText}
                            </p>
                        </div>
                    </div>

                    <div className="mt-12 mb-12 grid gap-6 lg:grid-cols-2">
                        <Card
                            id="early-access-client"
                            className="glass-card flex h-full flex-col border border-slate-200/60 bg-white/90 pb-6 shadow-xl backdrop-blur dark:border-[#1E2A3D] dark:bg-[#0B1220]/90"
                        >
                            <CardHeader className="space-y-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                                    <UserRound className="h-6 w-6" />
                                </div>
                                <div className="space-y-2">
                                    <CardTitle className="text-2xl">{clientTitle}</CardTitle>
                                    <CardDescription className="text-sm text-slate-600 dark:text-slate-300">
                                        {clientDescription}
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <div className="mt-auto px-6">
                                <Button asChild className="w-full btn-primary text-white">
                                    <LocalizedLink href="/early-access/client">{clientCta}</LocalizedLink>
                                </Button>
                            </div>
                        </Card>

                        <Card className="glass-card flex h-full flex-col border border-slate-200/60 bg-white/90 pb-6 shadow-xl backdrop-blur dark:border-[#1E2A3D] dark:bg-[#0B1220]/90">
                            <CardHeader className="space-y-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                                    <Briefcase className="h-6 w-6" />
                                </div>
                                <div className="space-y-2">
                                    <CardTitle className="text-2xl">{providerTitle}</CardTitle>
                                    <CardDescription className="text-sm text-slate-600 dark:text-slate-300">
                                        {providerDescription}
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <div className="mt-auto px-6">
                                <Button asChild className="w-full btn-primary text-white">
                                    <LocalizedLink href="/early-access/provider">{providerCta}</LocalizedLink>
                                </Button>
                            </div>
                        </Card>
                    </div>

                    <TrustoraStoryCard />
                </div>
            </div>

            <Footer />
        </div>
    );
}
