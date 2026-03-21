'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/navigation';
import { ensureCsrfCookie, getXsrfToken } from '@/lib/csrf';

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
const FOCUS_LOSS_CHECK_DELAY_MS = 120;
const VIOLATION_REASONS = {
    TAB_SWITCH: 'tab_switch',
    APP_BLUR: 'app_blur',
    BROWSER_CLOSED: 'browser_closed',
} as const;

type ExamViolationReason =
    (typeof VIOLATION_REASONS)[keyof typeof VIOLATION_REASONS];

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
    const pendingUnloadRef = useRef(false);
    const reportingRef = useRef(false);
    const focusLossTimerRef = useRef<number | null>(null);
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

    useEffect(() => {
        void ensureCsrfCookie().catch((error) => {
            console.error(t('errors.communication'), error);
        });
    }, [t]);

    const clearFocusLossTimer = useCallback(() => {
        if (focusLossTimerRef.current !== null) {
            window.clearTimeout(focusLossTimerRef.current);
            focusLossTimerRef.current = null;
        }
    }, []);

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
        (type: 'minor' | 'critical', reason: ExamViolationReason) => {
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

    const postViolation = useCallback(
        async (
            type: 'minor' | 'critical',
            reason: ExamViolationReason,
            options?: { keepalive?: boolean }
        ) => {
            const attempt = async () => {
                const xsrfToken = getXsrfToken();

                return fetch('/api/exams/violation', {
                    method: 'POST',
                    credentials: 'include',
                    keepalive: options?.keepalive ?? true,
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
                    },
                    body: JSON.stringify({
                        test_id: testId,
                        type,
                        reason,
                        xsrf_token: xsrfToken,
                    }),
                });
            };

            await ensureCsrfCookie().catch(() => undefined);

            let response = await attempt();
            if (response.status === 403 || response.status === 419) {
                await ensureCsrfCookie().catch(() => undefined);
                response = await attempt();
            }

            const payload = await response.json().catch(() => null);
            if (response.status === 409 && payload?.action === 'failed') {
                return payload;
            }

            if (!response.ok) {
                const validationErrors = payload?.errors;
                const validationMessage =
                    validationErrors && typeof validationErrors === 'object'
                        ? Object.values(validationErrors)
                            .flat()
                            .find((entry): entry is string => typeof entry === 'string')
                        : null;
                const message =
                    typeof payload?.message === 'string' && payload.message.trim()
                        ? payload.message
                        : validationMessage
                            ? validationMessage
                        : t('errors.communication');
                throw new Error(message);
            }

            return payload;
        },
        [t, testId]
    );

    const reportUnloadViolation = useCallback(
        (type: 'minor' | 'critical', reason: ExamViolationReason) => {
            if (!testId || !isReady) {
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

            if (sendViolationBeacon(type, reason)) {
                return;
            }

            void postViolation(type, reason, { keepalive: true }).catch((error) => {
                console.error(t('errors.communication'), error);
            });
        },
        [isReady, postViolation, sendViolationBeacon, t]
    );

    const reportViolation = useCallback(
        async (type: 'minor' | 'critical', reason: ExamViolationReason) => {
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
                const payload = await postViolation(type, reason, { keepalive: true });
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
        [handleViolationOutcome, isReady, postViolation, t, testId]
    );

    const scheduleFocusLossViolation = useCallback(
        (reason: ExamViolationReason) => {
            if (isUnloadingRef.current || pendingUnloadRef.current || !isReady) {
                return;
            }

            clearFocusLossTimer();
            focusLossTimerRef.current = window.setTimeout(() => {
                focusLossTimerRef.current = null;

                if (isUnloadingRef.current || pendingUnloadRef.current) {
                    return;
                }

                const isHidden =
                    document.visibilityState !== 'visible' || document.hidden;
                const lostFocus = !document.hasFocus();

                if (isHidden || lostFocus) {
                    void reportViolation('minor', reason);
                }
            }, FOCUS_LOSS_CHECK_DELAY_MS);
        },
        [clearFocusLossTimer, isReady, reportViolation]
    );

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState !== 'visible' || document.hidden) {
                scheduleFocusLossViolation(VIOLATION_REASONS.TAB_SWITCH);
                return;
            }

            clearFocusLossTimer();
        };

        const handleBlur = () => {
            scheduleFocusLossViolation(VIOLATION_REASONS.APP_BLUR);
        };

        const handleFocusOut = () => {
            scheduleFocusLossViolation(VIOLATION_REASONS.APP_BLUR);
        };

        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            clearFocusLossTimer();
            isUnloadingRef.current = true;
            pendingUnloadRef.current = true;
            event.preventDefault();
            event.returnValue = '';
        };

        const handlePageHide = () => {
            clearFocusLossTimer();
            isUnloadingRef.current = true;
            if (pendingUnloadRef.current) {
                reportUnloadViolation('critical', VIOLATION_REASONS.BROWSER_CLOSED);
            }
        };

        const handleFocus = () => {
            isUnloadingRef.current = false;
            pendingUnloadRef.current = false;
            clearFocusLossTimer();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('focusout', handleFocusOut, true);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('pagehide', handlePageHide);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('focusout', handleFocusOut, true);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('pagehide', handlePageHide);
            clearFocusLossTimer();
        };
    }, [
        clearFocusLossTimer,
        reportUnloadViolation,
        scheduleFocusLossViolation,
    ]);

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
