"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, BarChart3, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAsyncTranslation } from '@/hooks/use-async-translation';
import { Locale } from '@/types/locale';

export default function AdminAnalyticsPage() {
  const pathname = usePathname();
  const locale = (pathname.split('/')[1] as Locale) || 'ro';

  const title = useAsyncTranslation(locale, 'admin.analytics.manage_title');
  const subtitle = useAsyncTranslation(locale, 'admin.analytics.manage_subtitle');
  const statsTitle = useAsyncTranslation(locale, 'admin.analytics.stats_title');
  const statsDescription = useAsyncTranslation(locale, 'admin.analytics.stats_description');
  const developmentTitle = useAsyncTranslation(locale, 'admin.analytics.in_development_title');
  const developmentDescription = useAsyncTranslation(locale, 'admin.analytics.in_development_description');

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="relative mb-10 overflow-hidden rounded-3xl border border-border/60 bg-card/70 p-6 shadow-[0_20px_80px_-60px_rgba(15,23,42,0.4)] backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/60 dark:shadow-[0_20px_80px_-40px_rgba(15,23,42,0.9)] sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_rgba(255,255,255,0)_60%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_rgba(15,23,42,0)_60%)]" />
        <div className="relative flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <Link href={`/${locale}/admin`}>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full border border-border/60 bg-white/80 text-slate-900 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-500/40 hover:bg-sky-500/10 hover:text-sky-700 dark:border-slate-800/70 dark:bg-slate-950/70 dark:text-slate-100 dark:hover:border-sky-500/50 dark:hover:bg-sky-500/10 dark:hover:text-sky-200"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Trustora Admin
            </span>
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card className="border border-border/60 bg-card/80 text-foreground shadow-[0_16px_40px_-32px_rgba(15,23,42,0.25)] dark:border-slate-800/70 dark:bg-slate-900/70 dark:text-slate-100 dark:shadow-[0_16px_40px_-32px_rgba(15,23,42,0.9)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <BarChart3 className="h-5 w-5" />
              <span>{statsTitle}</span>
            </CardTitle>
            <CardDescription className="text-muted-foreground">{statsDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-background/70 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {statsTitle}
                  </span>
                  <BarChart3 className="h-4 w-4 text-sky-500 dark:text-sky-300" />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">{statsDescription}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/70 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {developmentTitle}
                  </span>
                  <Sparkles className="h-4 w-4 text-amber-500 dark:text-amber-300" />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">{developmentDescription}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border border-border/60 bg-card/80 text-foreground shadow-[0_16px_40px_-32px_rgba(15,23,42,0.25)] dark:border-slate-800/70 dark:bg-slate-900/70 dark:text-slate-100 dark:shadow-[0_16px_40px_-32px_rgba(15,23,42,0.9)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_rgba(255,255,255,0)_60%)] dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.22),_rgba(15,23,42,0)_60%)]" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Sparkles className="h-5 w-5 text-sky-500 dark:text-sky-300" />
              <span>{developmentTitle}</span>
            </CardTitle>
            <CardDescription className="text-muted-foreground">{developmentDescription}</CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div className="rounded-2xl border border-dashed border-border/60 bg-background/60 p-6 text-center dark:border-slate-800/70 dark:bg-slate-950/60">
              <BarChart3 className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{statsDescription}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
