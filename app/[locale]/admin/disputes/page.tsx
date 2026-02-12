"use client";

import { Link } from '@/lib/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ArrowLeft } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

export default function AdminDisputesPage() {
    const locale = useLocale();
  const t = useTranslations();
  const manageTitle = t('admin.disputes.manage_title');
  const manageSubtitle = t('admin.disputes.manage_subtitle');
  const listTitle = t('admin.disputes.list_title');
  const listDescription = t('admin.disputes.list_description');
  const emptyTitle = t('admin.disputes.empty_title');
  const emptyDescription = t('admin.disputes.empty_description');

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="relative mb-10 overflow-hidden rounded-3xl border border-border/60 bg-card/70 p-6 shadow-[0_20px_80px_-60px_rgba(15,23,42,0.4)] backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/60 dark:shadow-[0_20px_80px_-40px_rgba(15,23,42,0.9)] sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_rgba(255,255,255,0)_60%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_rgba(15,23,42,0)_60%)]" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
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
        </div>
        <div className="relative mt-4">
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">{manageTitle}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            {manageSubtitle}
          </p>
        </div>
      </div>

      <Card className="border border-border/60 bg-card/80 text-foreground shadow-[0_16px_40px_-32px_rgba(15,23,42,0.25)] dark:border-slate-800/70 dark:bg-slate-900/70 dark:text-slate-100 dark:shadow-[0_16px_40px_-32px_rgba(15,23,42,0.9)]">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>{listTitle}</span>
          </CardTitle>
          <CardDescription>{listDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 px-6 py-16 text-center dark:border-slate-800/70 dark:bg-slate-900/40">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/80 text-slate-700 shadow-sm dark:bg-slate-950/70 dark:text-slate-200">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{emptyTitle}</h3>
            <p className="text-sm text-muted-foreground">{emptyDescription}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
