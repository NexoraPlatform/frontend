'use client';

import { Suspense, lazy } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';

import { ProviderDashboardShell } from '@/components/dashboard/provider-dashboard-shell';

const AnimatedStatusWord = lazy(() => import('@/components/exams/animated-status-word'));

type SelectTestsLoadingStateProps = {
    animationKey: number;
    fullscreen?: boolean;
    mode: 'generating' | 'waitingResult';
    showQuestions: boolean;
};

export function SelectTestsLoadingState({
    animationKey,
    fullscreen = false,
    mode,
    showQuestions,
}: SelectTestsLoadingStateProps) {
    const t = useTranslations('tests.providerFlow');
    const animatedWord =
        mode === 'waitingResult'
            ? t('loading.words.result')
            : showQuestions
              ? t('loading.words.questions')
              : t('loading.words.test');
    const prefix =
        mode === 'waitingResult'
            ? t('loading.waitingResultPrefix')
            : t('loading.generatingPrefix');
    const shellDescription =
        mode === 'waitingResult'
            ? t('shell.waitingResultDescription')
            : t('shell.generatingDescription');

    const content = (
        <div className="flex flex-col items-center justify-center p-4">
            <Loader2 className="mb-4 h-10 w-10 animate-spin text-[var(--emerald-green)]" />
            <p className="h-8 text-lg font-medium text-slate-700 dark:text-slate-200">
                {prefix}{' '}
                <Suspense
                    fallback={
                        <span className="inline-block font-bold text-[var(--emerald-green)]">
                            {animatedWord}
                        </span>
                    }
                >
                    <AnimatedStatusWord animationKey={animationKey}>
                        {animatedWord}
                    </AnimatedStatusWord>
                </Suspense>
                !
            </p>
        </div>
    );

    if (fullscreen) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[var(--bg-light)] hero-gradient dark:bg-[#070C14]">
                {content}
            </div>
        );
    }

    return (
        <ProviderDashboardShell
            title={t('shell.title')}
            description={shellDescription}
            activeMenu="services"
        >
            <div className="flex min-h-[55vh] items-center justify-center">{content}</div>
        </ProviderDashboardShell>
    );
}
