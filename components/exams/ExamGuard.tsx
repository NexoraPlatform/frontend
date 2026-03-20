'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/navigation';
import { getXsrfToken } from '@/lib/csrf';

type ExamGuardProps = {
    testId: string | number;
    initialStrikes?: number;
    editorLanguage?: string;
    value?: string;
    onChange?: (value: string) => void;
    onFailed?: () => void;
};

const STRIKE_LIMIT = 2;
const DUPLICATE_VIOLATION_WINDOW_MS = 1500;

const ExamMonacoEditor = dynamic(
    () => import('@/components/exams/exam-monaco-editor'),
    {
        ssr: false,
        loading: () => (
            <div className="h-[420px] w-full animate-pulse rounded-2xl bg-slate-900/80" />
        ),
    }
);

export default function ExamGuard({
    testId,
    initialStrikes = 0,
    editorLanguage,
    value = '',
    onChange,
    onFailed,
}: ExamGuardProps) {
    const router = useRouter();
    const t = useTranslations('tests.examGuard');
    const [isReady, setIsReady] = useState(false);
    const [currentStrikes, setCurrentStrikes] = useState(initialStrikes);
    const currentStrikesRef = useRef(initialStrikes);
    const isUnloadingRef = useRef(false);
    const reportingRef = useRef(false);
    const lastViolationRef = useRef<{ reason: string; time: number } | null>(
        null
    );

    useEffect(() => {
        isUnloadingRef.current = false;
        setIsReady(false);

        const timer = window.setTimeout(() => {
            setIsReady(true);
        }, 1500);

        return () => {
            window.clearTimeout(timer);
        };
    }, []);

    useEffect(() => {
        setCurrentStrikes(initialStrikes);
        currentStrikesRef.current = initialStrikes;
    }, [initialStrikes]);

    const handleViolationOutcome = useCallback(
        (nextStrikes: number) => {
            currentStrikesRef.current = nextStrikes;
            setCurrentStrikes(nextStrikes);

            if (nextStrikes >= STRIKE_LIMIT) {
                onFailed?.();
                window.alert(t('alerts.failed'));
                router.push('/exam/result/failed');
                return;
            }

            window.alert(
                t('alerts.warning', {
                    current: nextStrikes,
                    limit: STRIKE_LIMIT,
                })
            );
        },
        [onFailed, router, t]
    );

    const sendViolationBeacon = useCallback(
        (type: 'minor' | 'critical', reason: string) => {
            if (
                typeof navigator === 'undefined' ||
                typeof navigator.sendBeacon !== 'function'
            ) {
                return false;
            }

            const payload = new Blob(
                [
                    JSON.stringify({
                        test_id: testId,
                        type,
                        reason,
                        xsrf_token: getXsrfToken(),
                    }),
                ],
                { type: 'application/json' }
            );

            return navigator.sendBeacon('/api/exams/violation', payload);
        },
        [testId]
    );

    const reportViolation = useCallback(
        async (type: 'minor' | 'critical', reason: string) => {
            if (!testId || reportingRef.current || isUnloadingRef.current || !isReady) {
                return;
            }

            const now = Date.now();
            const lastViolation = lastViolationRef.current;
            if (
                lastViolation &&
                now - lastViolation.time < DUPLICATE_VIOLATION_WINDOW_MS
            ) {
                return;
            }

            lastViolationRef.current = { reason, time: now };
            reportingRef.current = true;

            try {
                const optimisticStrikes = Math.min(
                    currentStrikesRef.current + 1,
                    STRIKE_LIMIT
                );

                if (sendViolationBeacon(type, reason)) {
                    handleViolationOutcome(optimisticStrikes);
                    return;
                }

                const response = await fetch('/api/exams/violation', {
                    method: 'POST',
                    credentials: 'include',
                    keepalive: true,
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        ...(getXsrfToken() ? { 'X-XSRF-TOKEN': getXsrfToken() as string } : {}),
                    },
                    body: JSON.stringify({
                        test_id: testId,
                        type,
                        reason,
                        xsrf_token: getXsrfToken(),
                    }),
                });

                const payload = await response.json().catch(() => null);
                const nextStrikes = Number(
                    payload?.current_strikes ?? optimisticStrikes
                );

                if (payload?.action === 'failed') {
                    handleViolationOutcome(STRIKE_LIMIT);
                    return;
                }

                handleViolationOutcome(nextStrikes);
            } catch (error) {
                console.error(t('errors.communication'), error);
            } finally {
                reportingRef.current = false;
            }
        },
        [handleViolationOutcome, isReady, sendViolationBeacon, t, testId]
    );

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && !isUnloadingRef.current && isReady) {
                void reportViolation('minor', 'Tab Switch/Minimize');
            }
        };

        const handleBlur = () => {
            window.setTimeout(() => {
                if (!isUnloadingRef.current && isReady) {
                    void reportViolation('minor', 'Lost Window Focus');
                }
            }, 80);
        };

        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            isUnloadingRef.current = true;
            event.preventDefault();
            event.returnValue = '';
        };

        const handlePageHide = () => {
            isUnloadingRef.current = true;
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('pagehide', handlePageHide);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('pagehide', handlePageHide);
        };
    }, [isReady, reportViolation]);

    if (!editorLanguage) {
        return null;
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-sm dark:border-slate-800">
            <ExamMonacoEditor
                language={editorLanguage}
                value={value}
                onChange={onChange}
            />
        </div>
    );
}
