'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle, ArrowLeft, LayoutDashboard, ShieldAlert } from 'lucide-react';
import { useRouter } from '@/lib/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { getDashboardHomeHref, getDashboardTabHref } from '@/lib/dashboard-navigation';

export default function ExamResultFailedClient() {
    const t = useTranslations('tests.examFailure');
    const router = useRouter();
    const { user, loading, userLoading } = useAuth();

    useEffect(() => {
        if (userLoading) {
            return;
        }

        if (!user) {
            router.push('/auth/signin');
        }
    }, [router, user, userLoading]);

    if (loading || userLoading) {
        return (
            <div className="min-h-screen bg-[var(--bg-light)] dark:bg-[#070C14] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[var(--bg-light)] dark:bg-[#070C14] hero-gradient px-4 py-10">
            <div className="mx-auto max-w-4xl">
                <div className="mb-8 flex items-center justify-between gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.push(getDashboardHomeHref())}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <Badge className="border-0 bg-red-100 px-3 py-2 text-red-700">
                        {t('badge')}
                    </Badge>
                </div>

                <Card className="glass-card border-2 border-red-200/80 bg-red-50/70 dark:bg-red-950/15">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-500">
                            <AlertCircle className="h-10 w-10 text-white" />
                        </div>
                        <CardTitle className="text-3xl">{t('title')}</CardTitle>
                        <CardDescription className="text-lg">
                            {t('description')}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-8">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="rounded-2xl border border-red-200/80 bg-white/70 p-5 dark:bg-white/5">
                                <div className="mb-3 flex items-center gap-2 text-red-700">
                                    <ShieldAlert className="h-5 w-5" />
                                    <h3 className="font-semibold">{t('reasons.title')}</h3>
                                </div>
                                <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                                    <p>{t('reasons.leaveTab')}</p>
                                    <p>{t('reasons.loseFocus')}</p>
                                    <p>{t('reasons.integrity')}</p>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-red-200/80 bg-white/70 p-5 dark:bg-white/5">
                                <div className="mb-3 flex items-center gap-2 text-red-700">
                                    <LayoutDashboard className="h-5 w-5" />
                                    <h3 className="font-semibold">{t('nextSteps.title')}</h3>
                                </div>
                                <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                                    <p>{t('nextSteps.review')}</p>
                                    <p>{t('nextSteps.retry')}</p>
                                    <p>{t('nextSteps.contact')}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center gap-3">
                            <Button onClick={() => router.push(getDashboardHomeHref())}>
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                {t('actions.dashboard')}
                            </Button>
                            <Button variant="outline" onClick={() => router.push(getDashboardTabHref('services'))}>
                                {t('actions.services')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
