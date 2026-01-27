"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from 'next-intl';
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { TrustoraThemeStyles } from "@/components/trustora/theme-styles";
import { apiClient } from "@/lib/api";
import { useParams } from 'next/navigation';

type UnsubscribeStatus = "loading" | "success" | "error";

export default function NewsletterUnsubscribePage() {
  const t = useTranslations();
  const params = useParams<{ token?: string | string[] }>();
  const [status, setStatus] = useState<UnsubscribeStatus>("loading");

  const titleText = t("common.unsubscribe_title");
  const successText = t("common.unsubscribe_success");
  const descriptionText = t("common.unsubscribe_description");
  const loadingText = t("common.unsubscribe_loading");
  const errorText = t("common.unsubscribe_error");

  const token = useMemo(() => {
    const value = params?.token;
    return Array.isArray(value) ? value[0] : value;
  }, [params?.token]);

  useEffect(() => {
    let active = true;

    const unsubscribe = async () => {
      if (!token) {
        setStatus("error");
        return;
      }

      try {
        const response = await apiClient.unsubscribeFromNewsletter(token);
        if (!active) return;
        setStatus(response?.unsubscribed ? "success" : "error");
      } catch (error) {
        if (!active) return;
        setStatus("error");
      }
    };

    unsubscribe();

    return () => {
      active = false;
    };
  }, [token]);

  const content =
    status === "loading"
      ? {
          icon: Loader2,
          iconClassName: "text-slate-400 animate-spin",
          title: loadingText,
          description: null,
        }
      : status === "success"
        ? {
            icon: CheckCircle2,
            iconClassName: "text-emerald-500",
            title: successText,
            description: descriptionText,
          }
        : {
            icon: AlertTriangle,
            iconClassName: "text-amber-500",
            title: errorText,
            description: null,
          };

  const StatusIcon = content.icon;

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0F172A] dark:bg-[#070C14] dark:text-[#E6EDF3]">
      <TrustoraThemeStyles />
      <Header />

      <main className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl">
          <Card className="border border-slate-200/60 bg-white/90 shadow-xl backdrop-blur dark:border-[#1E2A3D] dark:bg-[#0B1220]/90">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl font-semibold">{titleText}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4 rounded-2xl border border-slate-200/60 bg-slate-50/80 px-4 py-5 dark:border-[#1E2A3D] dark:bg-[#111B2D]">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm dark:bg-[#0B1220]">
                  <StatusIcon className={`h-5 w-5 ${content.iconClassName}`} />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-semibold text-slate-900 dark:text-white">{content.title}</p>
                  {content.description ? (
                    <p className="text-sm text-slate-600 dark:text-slate-300">{content.description}</p>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
