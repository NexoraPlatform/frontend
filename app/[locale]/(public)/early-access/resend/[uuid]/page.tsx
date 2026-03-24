"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from 'next-intl';
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Link } from '@/lib/navigation';
import { TrustoraThemeStyles } from "@/components/trustora/theme-styles";
import { apiClient } from "@/lib/api";
import { useParams } from 'next/navigation';

type ResendStatus = "loading" | "success" | "not_found" | "verified" | "rate_limited" | "error";

type ResendResponse = {
    resent: boolean;
    verified?: boolean;
    message?: string;
    application?: {
        id: number;
        user_type: "client" | "provider";
        email: string;
        application_id: string;
        email_verification: boolean;
    };
};

export default function EarlyAccessResendPage() {
    const locale = useLocale();
    const t = useTranslations();
    const params = useParams<{ uuid?: string | string[] }>();

    const titleText = t("trustora.early_access.resend.title");
    const subtitleText = t("trustora.early_access.resend.subtitle");
    const successTitle = t("trustora.early_access.resend.success_title");
    const successDescription = t("trustora.early_access.resend.success_description");
    const notFoundTitle = t("trustora.early_access.resend.not_found_title");
    const notFoundDescription = t("trustora.early_access.resend.not_found_description");
    const verifiedTitle = t("trustora.early_access.resend.verified_title");
    const verifiedDescription = t("trustora.early_access.resend.verified_description");
    const rateLimitedTitle = t("trustora.early_access.resend.rate_limited_title");
    const rateLimitedDescription = t("trustora.early_access.resend.rate_limited_description");
    const errorTitle = t("trustora.early_access.resend.error_title");
    const errorDescription = t("trustora.early_access.resend.error_description");
    const backToEarlyAccess = t("trustora.early_access.resend.back");
    const loadingText = t("trustora.early_access.resend.loading");

    const [status, setStatus] = useState<ResendStatus>("loading");
    const [response, setResponse] = useState<ResendResponse | null>(null);

    const applicationId = useMemo(() => {
        const value = params?.uuid;
        return Array.isArray(value) ? value[0] : value;
    }, [params?.uuid]);

    useEffect(() => {
        let active = true;

        const resend = async () => {
            if (!applicationId) {
                setStatus("error");
                return;
            }

            try {
                const payload = await apiClient.resendEarlyAccessVerification({
                    application_id: applicationId,
                    language: locale === "en" ? "en" : "ro",
                });

                if (!active) {
                    return;
                }

                setResponse(payload);

                if (payload.verified) {
                    setStatus("verified");
                    return;
                }

                if (payload.resent) {
                    setStatus("success");
                    return;
                }

                setStatus("error");
            } catch (error) {
                if (!active) {
                    return;
                }

                if (error instanceof Error && error.message.includes("Application not found")) {
                    setStatus("not_found");
                    return;
                }

                if (error instanceof Error && error.message.includes("already verified")) {
                    setStatus("verified");
                    return;
                }

                if (error instanceof Error && error.message.includes("recently")) {
                    setStatus("rate_limited");
                    return;
                }

                setStatus("error");
            }
        };

        resend();

        return () => {
            active = false;
        };
    }, [applicationId, locale]);

    const statusMeta = useMemo(() => {
        switch (status) {
            case "success":
                return {
                    title: successTitle,
                    description: response?.message ?? successDescription,
                    icon: CheckCircle2,
                    toneClassName: "border-emerald-200/70 bg-emerald-50/70 dark:border-emerald-500/30 dark:bg-emerald-500/10",
                    iconClassName: "text-emerald-600 dark:text-emerald-300",
                };
            case "not_found":
                return {
                    title: notFoundTitle,
                    description: response?.message ?? notFoundDescription,
                    icon: AlertTriangle,
                    toneClassName: "border-rose-200/70 bg-rose-50/70 dark:border-rose-500/30 dark:bg-rose-500/10",
                    iconClassName: "text-rose-600 dark:text-rose-300",
                };
            case "verified":
                return {
                    title: verifiedTitle,
                    description: response?.message ?? verifiedDescription,
                    icon: CheckCircle2,
                    toneClassName: "border-sky-200/70 bg-sky-50/70 dark:border-sky-500/30 dark:bg-sky-500/10",
                    iconClassName: "text-sky-600 dark:text-sky-300",
                };
            case "rate_limited":
                return {
                    title: rateLimitedTitle,
                    description: response?.message ?? rateLimitedDescription,
                    icon: Clock,
                    toneClassName: "border-amber-200/70 bg-amber-50/70 dark:border-amber-500/30 dark:bg-amber-500/10",
                    iconClassName: "text-amber-600 dark:text-amber-300",
                };
            case "error":
                return {
                    title: errorTitle,
                    description: response?.message ?? errorDescription,
                    icon: AlertTriangle,
                    toneClassName: "border-slate-200/70 bg-slate-50/70 dark:border-slate-500/30 dark:bg-slate-500/10",
                    iconClassName: "text-slate-600 dark:text-slate-200",
                };
            default:
                return {
                    title: loadingText,
                    description: loadingText,
                    icon: Clock,
                    toneClassName: "border-slate-200/70 bg-slate-50/70 dark:border-slate-500/30 dark:bg-slate-500/10",
                    iconClassName: "text-slate-500 dark:text-slate-200",
                };
        }
    }, [
        status,
        response?.message,
        successTitle,
        successDescription,
        notFoundTitle,
        notFoundDescription,
        verifiedTitle,
        verifiedDescription,
        rateLimitedTitle,
        rateLimitedDescription,
        errorTitle,
        errorDescription,
        loadingText,
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
                            <CardContent>
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
