'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useSearchParams } from 'next/navigation';
import { TrustoraThemeStyles } from '@/components/trustora/theme-styles';
import { useTranslations } from 'next-intl';

export default function AccessDeniedPage() {
    const t = useTranslations('accessDenied');
    const searchParams = useSearchParams();
    const from = searchParams.get('from');
    return (
        <div className="min-h-screen bg-[#F5F7FA] text-[#0F172A] dark:bg-[#070C14] dark:text-[#E6EDF3]">
            <TrustoraThemeStyles />
            <Header />
            <main className="relative overflow-hidden pt-16">
                <div className="absolute inset-0 hero-gradient" />
                <div className="relative container mx-auto px-4 py-20">
                    <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-100/60 px-4 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                {t('hero.badge')}
                            </div>
                            <div className="space-y-3">
                                <h1 className="text-4xl font-bold leading-tight text-[#0F172A] dark:text-white md:text-5xl">
                                    {t('hero.title')}
                                </h1>
                                <p className="text-lg text-slate-600 dark:text-slate-300">
                                    {t('hero.description')}
                                </p>
                                {from && (
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {t('hero.attempted', { path: from })}
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-4">
                                <Button className="btn-primary" asChild>
                                    <a href="/dashboard">
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        {t('hero.primary_cta')}
                                    </a>
                                </Button>
                                <Button variant="outline" className="border-slate-200/60 bg-white/80 dark:border-[#1E2A3D] dark:bg-[#0B1220]" asChild>
                                    <a href="/">
                                        <Home className="h-4 w-4 mr-2" />
                                        {t('hero.secondary_cta')}
                                    </a>
                                </Button>
                            </div>
                        </div>
                        <Card className="glass-card border border-slate-200/60 bg-white/90 shadow-2xl backdrop-blur dark:border-[#1E2A3D] dark:bg-[#0B1220]/90">
                            <CardHeader className="space-y-3 text-left">
                                <div className="w-12 h-12 rounded-full bg-emerald-100/70 flex items-center justify-center">
                                    <AlertTriangle className="h-6 w-6 text-emerald-600" />
                                </div>
                                <CardTitle className="text-2xl text-[#0F172A] dark:text-white">{t('card.title')}</CardTitle>
                                <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                                    {t('card.description')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                                <div className="glass-card rounded-xl border border-slate-200/60 bg-white/80 px-4 py-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                                    <p className="font-semibold text-[#0F172A] dark:text-white">{t('card.actions.title')}</p>
                                    <ul className="mt-2 space-y-2 text-sm">
                                        <li className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                            {t('card.actions.items.0')}
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                            {t('card.actions.items.1')}
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                            {t('card.actions.items.2')}
                                        </li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
