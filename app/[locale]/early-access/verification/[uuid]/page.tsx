"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from 'next-intl';
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Link } from '@/lib/navigation';
import { TrustoraThemeStyles } from "@/components/trustora/theme-styles";
import { apiClient } from "@/lib/api";
import { useParams } from 'next/navigation';

type VerificationStatus = "loading" | "success" | "invalid" | "expired" | "error";

type VerificationResponse = {
    verified: boolean;
    expired?: boolean;
    message?: string;
    application?: {
        id: number;
        user_type: "client" | "provider";
        email: string;
        email_verification: boolean;
        email_verification_expired: boolean;
    };
};

export default function EarlyAccessVerificationPage() {
    const locale = useLocale();
    const t = useTranslations();
    const params = useParams<{ uuid?: string | string[] }>();

    const titleText = t("trustora.early_access.verification.title");
    const subtitleText = t("trustora.early_access.verification.subtitle");
    const successTitle = t("trustora.early_access.verification.success_title");
    const successDescription = t("trustora.early_access.verification.success_description");
    const invalidTitle = t("trustora.early_access.verification.invalid_title");
    const invalidDescription = t("trustora.early_access.verification.invalid_description");
    const expiredTitle = t("trustora.early_access.verification.expired_title");
    const expiredDescription = t("trustora.early_access.verification.expired_description");
    const errorTitle = t("trustora.early_access.verification.error_title");
    const errorDescription = t("trustora.early_access.verification.error_description");
    const backToEarlyAccess = t("trustora.early_access.verification.back");
    const loadingText = t("trustora.early_access.verification.loading");
    const applicationLabel = t("trustora.early_access.verification.application_label");
    const emailLabel = t("trustora.early_access.verification.email_label");
    const typeLabel = t("trustora.early_access.verification.type_label");
    const providerLabel = t("trustora.early_access.verification.user_type_provider");
    const clientLabel = t("trustora.early_access.verification.user_type_client");

    const [status, setStatus] = useState<VerificationStatus>("loading");
    const [details, setDetails] = useState<VerificationResponse | null>(null);

    const code = useMemo(() => {
        const value = params?.uuid;
        return Array.isArray(value) ? value[0] : value;
    }, [params?.uuid]);

    useEffect(() => {
        let active = true;

        const verify = async () => {
            if (!code) {
                setStatus("error");
                return;
            }

            try {
                const payload = (await apiClient.verifyEarlyAccessApplication({
                    code,
                    language: locale === "en" ? "en" : "ro",
                })) as VerificationResponse;

                if (!active) {
                    return;
                }

                setDetails(payload);

                if (payload.verified) {
                    setStatus("success");
                    return;
                }

                if (payload.expired) {
                    setStatus("expired");
                    return;
                }

                setStatus("invalid");
            } catch (error) {
                if (!active) {
                    return;
                }

                if (error instanceof Error && error.message.includes("Invalid verification code")) {
                    setStatus("invalid");
                    return;
                }

                if (error instanceof Error && error.message.includes("expired")) {
                    setStatus("expired");
                    return;
                }

                setStatus("error");
            }
        };

        verify();

        return () => {
            active = false;
        };
    }, [code, locale]);

    const statusMeta = useMemo(() => {
        switch (status) {
            case "success":
                return {
                    title: successTitle,
                    description: details?.message ?? successDescription,
                    icon: CheckCircle2,
                    iconClassName: "text-emerald-600 dark:text-emerald-300",
                    toneClassName: "border-emerald-200/70 bg-emerald-50/70 dark:border-emerald-500/30 dark:bg-emerald-500/10",
                };
            case "invalid":
                return {
                    title: invalidTitle,
                    description: details?.message ?? invalidDescription,
                    icon: AlertTriangle,
                    iconClassName: "text-rose-600 dark:text-rose-300",
                    toneClassName: "border-rose-200/70 bg-rose-50/70 dark:border-rose-500/30 dark:bg-rose-500/10",
                };
            case "expired":
                return {
                    title: expiredTitle,
                    description: details?.message ?? expiredDescription,
                    icon: Clock,
                    iconClassName: "text-amber-600 dark:text-amber-300",
                    toneClassName: "border-amber-200/70 bg-amber-50/70 dark:border-amber-500/30 dark:bg-amber-500/10",
                };
            case "error":
                return {
                    title: errorTitle,
                    description: details?.message ?? errorDescription,
                    icon: AlertTriangle,
                    iconClassName: "text-slate-600 dark:text-slate-200",
                    toneClassName: "border-slate-200/70 bg-slate-50/70 dark:border-slate-500/30 dark:bg-slate-500/10",
                };
            default:
                return {
                    title: loadingText,
                    description: loadingText,
                    icon: Clock,
                    iconClassName: "text-slate-500 dark:text-slate-200",
                    toneClassName: "border-slate-200/70 bg-slate-50/70 dark:border-slate-500/30 dark:bg-slate-500/10",
                };
        }
    }, [
        status,
        successTitle,
        successDescription,
        invalidTitle,
        invalidDescription,
        expiredTitle,
        expiredDescription,
        errorTitle,
        errorDescription,
        loadingText,
        details?.message,
    ]);

    const StatusIcon = statusMeta.icon;

    return (
        <div className="min-h-screen bg-[#F5F7FA] text-[#0F172A] dark:bg-[#070C14] dark:text-[#E6EDF3]">
            <TrustoraThemeStyles />
            <Header />

            <div className="relative mt-8 overflow-hidden">
                <div className="absolute inset-0 hero-gradient" />
                <div className="relative container mx-auto px-4 py-16">
                    <div className="mx-auto max-w-3xl space-y-8">
                        <div className="space-y-3 text-center">
                            <h1 className="text-3xl font-semibold text-[#0F172A] dark:text-white md:text-4xl">
                                {titleText}
                            </h1>
                            <p className="text-base text-slate-600 dark:text-slate-300">
                                {subtitleText}
                            </p>
                        </div>

                        <Card className="glass-card border border-slate-200/60 bg-white/90 shadow-xl backdrop-blur dark:border-[#1E2A3D] dark:bg-[#0B1220]/90">
                            <CardHeader className="space-y-4">
                                <CardTitle className="text-xl">{statusMeta.title}</CardTitle>
                                <Alert className={statusMeta.toneClassName}>
                                    <StatusIcon className={`h-5 w-5 ${statusMeta.iconClassName}`} />
                                    <AlertDescription className="text-sm text-slate-700 dark:text-slate-200">
                                        {statusMeta.description}
                                    </AlertDescription>
                                </Alert>
                            </CardHeader>
                            {status === "success" && details?.application && (
                                <CardContent className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                                        {applicationLabel}
                                    </p>
                                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                                        <span className="text-slate-500 dark:text-slate-400">{emailLabel}</span>
                                        <span className="font-medium text-slate-800 dark:text-slate-100">
                                            {details.application.email}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                                        <span className="text-slate-500 dark:text-slate-400">{typeLabel}</span>
                                        <span className="font-medium text-slate-800 dark:text-slate-100">
                                            {details.application.user_type === "provider" ? providerLabel : clientLabel}
                                        </span>
                                    </div>
                                </CardContent>
                            )}
                            <CardContent className="pt-4">
                                <Button asChild className="w-full btn-primary text-white">
                                    <Link href="/early-access">{backToEarlyAccess}</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
