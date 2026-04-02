'use client';

import nextDynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';

import { ProviderDashboardShell } from '@/components/dashboard/provider-dashboard-shell';
import { Card, CardContent } from '@/components/ui/card';

import type {
    CurrentTestSession,
    TestAnswer,
} from '../_lib/select-tests-page-types';

const LazyTestResultView = nextDynamic(
    () => import('@/components/exams/test-result-view'),
    {
        ssr: false,
        loading: () => (
            <Card className="glass-card border-2 border-border/60">
                <CardContent className="space-y-6 p-8">
                    <div className="mx-auto h-20 w-20 animate-pulse rounded-full bg-muted/70" />
                    <div className="space-y-3">
                        <div className="mx-auto h-8 w-56 animate-pulse rounded bg-muted/70" />
                        <div className="mx-auto h-5 w-80 animate-pulse rounded bg-muted/60" />
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="h-24 animate-pulse rounded-xl bg-muted/60" />
                        <div className="h-24 animate-pulse rounded-xl bg-muted/60" />
                        <div className="h-24 animate-pulse rounded-xl bg-muted/60" />
                    </div>
                </CardContent>
            </Card>
        ),
    }
);

type SelectTestsResultScreenProps = {
    answers: TestAnswer[];
    currentTest: CurrentTestSession;
    testResult: any;
    user: any;
};

export function SelectTestsResultScreen({
    answers,
    currentTest,
    testResult,
    user,
}: SelectTestsResultScreenProps) {
    const t = useTranslations('tests.providerFlow');

    return (
        <ProviderDashboardShell
            title={t('result.title')}
            description={t('result.description')}
            activeMenu="services"
        >
            <div className="mx-auto max-w-4xl">
                <LazyTestResultView
                    answers={answers}
                    currentTest={currentTest}
                    testResult={testResult}
                    user={user}
                />
            </div>
        </ProviderDashboardShell>
    );
}
