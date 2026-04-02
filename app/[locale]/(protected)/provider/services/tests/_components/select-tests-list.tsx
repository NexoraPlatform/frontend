'use client';

import type { ComponentType } from 'react';

import nextDynamic from 'next/dynamic';
import { useLocale, useTranslations } from 'next-intl';
import {
    AlertCircle,
    ArrowLeft,
    Award,
    BookOpen,
    Clock,
    Loader2,
    PlayCircle,
    Target,
} from 'lucide-react';

import { ProviderDashboardShell } from '@/components/dashboard/provider-dashboard-shell';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

import {
    formatCooldownDate,
    formatLevelLabel,
    getServiceTestKey,
} from '../_lib/select-tests-page-helpers';
import type {
    CurrentTestSession,
    ServiceTestCard,
    TestData,
} from '../_lib/select-tests-page-types';

type StartWarningDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
};

const LazyTestStartWarningDialog = nextDynamic(
    () => import('@/components/exams/test-start-warning-dialog'),
    {
        ssr: false,
    }
) as ComponentType<StartWarningDialogProps>;

type SelectTestsListProps = {
    error: string;
    loadingTests: boolean;
    onBack: () => void;
    onStartRequested: (nextTest: CurrentTestSession) => void;
    onStartWarningConfirm: () => void;
    onStartWarningOpenChange: (open: boolean) => void;
    serviceTests: Record<string, ServiceTestCard>;
    startWarningOpen: boolean;
    testData: TestData[];
    StartWarningDialogComponent?: ComponentType<StartWarningDialogProps>;
};

export function SelectTestsList({
    error,
    loadingTests,
    onBack,
    onStartRequested,
    onStartWarningConfirm,
    onStartWarningOpenChange,
    serviceTests,
    startWarningOpen,
    testData,
    StartWarningDialogComponent = LazyTestStartWarningDialog,
}: SelectTestsListProps) {
    const locale = useLocale();
    const t = useTranslations('tests.providerFlow');

    return (
        <ProviderDashboardShell
            title={t('shell.title')}
            description={t('shell.description')}
            activeMenu="services"
        >
            <div className="space-y-8">
                <div className="mb-8 flex items-center space-x-4">
                    <Button variant="outline" size="icon" onClick={onBack}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold">{t('shell.title')}</h1>
                        <p className="text-muted-foreground">
                            {t('list.headerDescription')}
                        </p>
                    </div>
                    <Badge className="border-0 bg-[#1BC47D]/15 px-3 py-2 text-[#1BC47D]">
                        {t('list.stepBadge')}
                    </Badge>
                </div>

                {error ? (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                ) : null}

                <div className="space-y-6">
                    {testData.map((serviceInfo, index) => {
                        const serviceTest = serviceTests[getServiceTestKey(serviceInfo)];
                        const cardKey = `${serviceInfo.serviceId}-${serviceInfo.level}-${index}`;
                        const levelLabel = formatLevelLabel(serviceInfo.level, t);

                        if (
                            !serviceTest ||
                            serviceTest.status === 'idle' ||
                            serviceTest.status === 'processing'
                        ) {
                            return (
                                <Card key={cardKey} className="glass-card border-emerald-100/60">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-xl">
                                                    {serviceInfo.serviceName}
                                                </CardTitle>
                                                <CardDescription className="mt-1">
                                                    {t('list.levelLabel', {
                                                        level: levelLabel,
                                                    })}
                                                </CardDescription>
                                            </div>
                                            <Badge className="bg-emerald-100 text-emerald-800">
                                                {serviceInfo.category}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex items-center justify-between gap-4">
                                        <div className="flex items-center space-x-3 text-muted-foreground">
                                            <Loader2 className="h-5 w-5 animate-spin text-[var(--emerald-green)]" />
                                            <div>
                                                <p className="font-medium text-foreground">
                                                    {t('list.processingTitle')}
                                                </p>
                                                <p className="text-sm">
                                                    {t('list.processingDescription')}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant="outline">
                                            {t('list.processingBadge')}
                                        </Badge>
                                    </CardContent>
                                </Card>
                            );
                        }

                        if (serviceTest.status === 'cooldown') {
                            return (
                                <Card key={cardKey} className="glass-card border-amber-200/80">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-xl">
                                                    {serviceInfo.serviceName}
                                                </CardTitle>
                                                <CardDescription className="mt-1">
                                                    {t('list.levelLabel', {
                                                        level: levelLabel,
                                                    })}
                                                </CardDescription>
                                            </div>
                                            <Badge className="bg-amber-100 text-amber-800">
                                                {serviceInfo.category}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <Alert>
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription>
                                                {serviceTest.error ??
                                                    t('list.cooldownDefault')}
                                            </AlertDescription>
                                        </Alert>
                                        {serviceTest.nextAvailableAt ? (
                                            <p className="text-sm text-muted-foreground">
                                                {t('list.availableAgainAt', {
                                                    date:
                                                        formatCooldownDate(
                                                            serviceTest.nextAvailableAt,
                                                            locale
                                                        ) ?? '',
                                                })}
                                            </p>
                                        ) : null}
                                    </CardContent>
                                </Card>
                            );
                        }

                        if (serviceTest.status === 'failed' || !serviceTest.test) {
                            return (
                                <Card key={cardKey} className="glass-card border-red-200/80">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-xl">
                                                    {serviceInfo.serviceName}
                                                </CardTitle>
                                                <CardDescription className="mt-1">
                                                    {t('list.levelLabel', {
                                                        level: levelLabel,
                                                    })}
                                                </CardDescription>
                                            </div>
                                            <Badge className="bg-red-100 text-red-800">
                                                {serviceInfo.category}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <Alert variant="destructive">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription>
                                                {serviceTest.error ??
                                                    t('list.failedDefault')}
                                            </AlertDescription>
                                        </Alert>
                                    </CardContent>
                                </Card>
                            );
                        }

                        return (
                            <Card key={cardKey} className="glass-card border-emerald-100/60">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-xl">
                                                {serviceTest.test.title}
                                            </CardTitle>
                                            <CardDescription className="mt-1">
                                                {t('list.testCardDescription', {
                                                    service: serviceInfo.serviceName,
                                                    level: levelLabel,
                                                })}
                                            </CardDescription>
                                        </div>
                                        <Badge className="bg-emerald-100 text-emerald-800">
                                            {serviceInfo.category}
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <CardContent>
                                    <p className="mb-4 text-muted-foreground">
                                        {serviceTest.test.description}
                                    </p>

                                    <div className="mb-6 grid gap-4 xs:grid-cols-2 md:grid-cols-4">
                                        <div className="flex items-center space-x-2 text-sm">
                                            <BookOpen className="h-4 w-4 text-[var(--emerald-green)]" />
                                            <span>
                                                {t('list.questionCount', {
                                                    count:
                                                        serviceTest.test.totalQuestions ||
                                                        serviceTest.test.questions.length,
                                                })}
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-sm">
                                            <Clock className="h-4 w-4 text-amber-500" />
                                            <span>
                                                {t('list.minuteCount', {
                                                    count: serviceTest.test.timeLimit,
                                                })}
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-sm">
                                            <Target className="h-4 w-4 text-[var(--emerald-green)]" />
                                            <span>
                                                {t('list.passingScore', {
                                                    score: serviceTest.test.passingScore,
                                                })}
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-sm">
                                            <Award className="h-4 w-4 text-emerald-500" />
                                            <span>{t('list.certification')}</span>
                                        </div>
                                    </div>

                                    <Button
                                        className="btn-primary"
                                        onClick={() =>
                                            onStartRequested({
                                                test: serviceTest.test,
                                                serviceInfo,
                                                requestId: serviceTest.requestId,
                                                userTestId: serviceTest.userTestId,
                                            })
                                        }
                                    >
                                        <PlayCircle className="mr-2 h-4 w-4" />
                                        {t('list.startTest')}
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}

                    {testData.length === 0 && !loadingTests ? (
                        <div className="py-12 text-center">
                            <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                            <h3 className="mb-2 text-lg font-medium">
                                {t('list.emptyTitle')}
                            </h3>
                            <p className="mb-4 text-muted-foreground">
                                {error ?? t('list.emptyDescription')}
                            </p>
                            <Button variant="outline" onClick={onBack}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                {t('list.back')}
                            </Button>
                        </div>
                    ) : null}
                </div>
            </div>
            <StartWarningDialogComponent
                open={startWarningOpen}
                onOpenChange={onStartWarningOpenChange}
                onConfirm={onStartWarningConfirm}
            />
        </ProviderDashboardShell>
    );
}
