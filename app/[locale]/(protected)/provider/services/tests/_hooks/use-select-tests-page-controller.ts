'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api';
import { getRoleSlugs } from '@/lib/access';
import { getDashboardHomeHref } from '@/lib/dashboard-navigation';
import { ensureEcho } from '@/lib/echo';
import { useRouter } from '@/lib/navigation';
import {
    consumeProviderTestsReloadIntent,
    markProviderTestsReloadIntent,
} from '@/lib/provider-tests-persistence';
import { getProviderServicesSelectHref } from '@/lib/provider-services-wizard';

import {
    createInitialServiceStates,
    formatLevelHuman,
    getNavigationType,
    getServiceTestKey,
    normalizeEvaluationResult,
    normalizeIncomingTestData,
    normalizeTestRequestState,
    parsePersistedDate,
} from '../_lib/select-tests-page-helpers';
import type {
    CurrentTestSession,
    PersistedTestsState,
    ServiceTestCard,
    TestAnswer,
    TestData,
    TestRequestState,
} from '../_lib/select-tests-page-types';

export function useSelectTestsPageController() {
    const { user, loading, userLoading, refreshUser } = useAuth();
    const locale = useLocale();
    const t = useTranslations('tests.providerFlow');
    const router = useRouter();
    const searchParams = useSearchParams();
    const dataParam = searchParams.get('data');

    const [testData, setTestData] = useState<TestData[]>([]);
    const [serviceTests, setServiceTests] = useState<Record<string, ServiceTestCard>>({});
    const [currentTest, setCurrentTest] = useState<CurrentTestSession | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<TestAnswer[]>([]);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [testStartTime, setTestStartTime] = useState<Date | null>(null);
    const [questionStartTime, setQuestionStartTime] = useState<Date | null>(null);
    const [testInProgress, setTestInProgress] = useState(false);
    const [testCompleted, setTestCompleted] = useState(false);
    const [testResult, setTestResult] = useState<any>(null);
    const [error, setError] = useState('');
    const [loadingTests, setLoadingTests] = useState(true);
    const [isRefreshingRole, setIsRefreshingRole] = useState(false);
    const [showQuestions, setShowQuestions] = useState(false);
    const [key, setKey] = useState(0);
    const [loadingResults, setLoadingResults] = useState(false);
    const [evaluationRequestId, setEvaluationRequestId] = useState<string | null>(null);
    const [hasInitializedState, setHasInitializedState] = useState(false);
    const [startWarningOpen, setStartWarningOpen] = useState(false);
    const [pendingStartTest, setPendingStartTest] = useState<CurrentTestSession | null>(null);

    const serviceTestsRef = useRef<Record<string, ServiceTestCard>>({});
    const evaluationRequestIdRef = useRef<string | null>(null);
    const roleRefreshAttemptedRef = useRef(false);

    const storageKey = useMemo(
        () => (dataParam ? `provider-services-tests:${dataParam}` : null),
        [dataParam]
    );
    const roleSlugs = useMemo(() => getRoleSlugs(user), [user]);
    const hasRoleInfo = roleSlugs.length > 0;
    const isProvider = roleSlugs.includes('provider');

    const availableTests = useMemo(
        () =>
            testData
                .map((serviceInfo) => serviceTests[getServiceTestKey(serviceInfo)])
                .filter((entry): entry is ServiceTestCard => Boolean(entry?.test))
                .map((entry) => ({
                    test: entry.test,
                    serviceInfo: entry.serviceInfo,
                    requestId: entry.requestId,
                    userTestId: entry.userTestId,
                })),
        [serviceTests, testData]
    );

    const resolvedServiceCount = useMemo(
        () =>
            testData.filter((serviceInfo) => {
                const status = serviceTests[getServiceTestKey(serviceInfo)]?.status;
                return (
                    status === 'completed' ||
                    status === 'failed' ||
                    status === 'cooldown'
                );
            }).length,
        [serviceTests, testData]
    );

    const pendingServiceCount = useMemo(
        () =>
            testData.filter((serviceInfo) => {
                const status = serviceTests[getServiceTestKey(serviceInfo)]?.status;
                return !status || status === 'idle' || status === 'processing';
            }).length,
        [serviceTests, testData]
    );

    const isInitialGenerationProcessing =
        !testInProgress &&
        !testCompleted &&
        !loadingResults &&
        testData.length > 0 &&
        availableTests.length === 0 &&
        pendingServiceCount > 0 &&
        resolvedServiceCount === 0;

    const readPersistedState = useCallback((): PersistedTestsState => {
        if (!storageKey || typeof window === 'undefined') {
            return {};
        }

        try {
            const rawState = window.sessionStorage.getItem(storageKey);
            if (!rawState) {
                return {};
            }

            const parsed = JSON.parse(rawState);
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch {
            return {};
        }
    }, [storageKey]);

    const clearPersistedState = useCallback(() => {
        if (!storageKey || typeof window === 'undefined') {
            return;
        }

        window.sessionStorage.removeItem(storageKey);
    }, [storageKey]);

    const clearPersistedAttemptState = useCallback(() => {
        if (!storageKey || typeof window === 'undefined') {
            return;
        }

        const persistedState = readPersistedState();
        const generationRequestIds = persistedState.generationRequestIds ?? {};

        if (Object.keys(generationRequestIds).length === 0) {
            window.sessionStorage.removeItem(storageKey);
            return;
        }

        window.sessionStorage.setItem(
            storageKey,
            JSON.stringify({
                generationRequestIds,
                currentTest: null,
                currentQuestionIndex: 0,
                answers: [],
                testInProgress: false,
                timeRemaining: 0,
                testStartTime: null,
                questionStartTime: null,
                evaluationRequestId: null,
            } satisfies PersistedTestsState)
        );
    }, [readPersistedState, storageKey]);

    useEffect(() => {
        serviceTestsRef.current = serviceTests;
    }, [serviceTests]);

    useEffect(() => {
        evaluationRequestIdRef.current = evaluationRequestId;
    }, [evaluationRequestId]);

    useEffect(() => {
        if (!storageKey || typeof window === 'undefined') {
            return;
        }

        const markPageReloadIntent = () => {
            markProviderTestsReloadIntent(window.sessionStorage, storageKey);
        };

        window.addEventListener('beforeunload', markPageReloadIntent);
        window.addEventListener('pagehide', markPageReloadIntent);

        return () => {
            window.removeEventListener('beforeunload', markPageReloadIntent);
            window.removeEventListener('pagehide', markPageReloadIntent);
        };
    }, [storageKey]);

    useEffect(() => {
        if (!hasInitializedState || !storageKey || typeof window === 'undefined') {
            return;
        }

        const generationRequestIds = Object.fromEntries(
            Object.entries(serviceTests)
                .filter(([, entry]) => Boolean(entry?.requestId))
                .map(([serviceKey, entry]) => [serviceKey, entry.requestId as string])
        );
        const shouldPersistAttemptState =
            testInProgress || loadingResults || Boolean(evaluationRequestId);

        window.sessionStorage.setItem(
            storageKey,
            JSON.stringify({
                generationRequestIds,
                currentTest: shouldPersistAttemptState ? currentTest : null,
                currentQuestionIndex: shouldPersistAttemptState
                    ? currentQuestionIndex
                    : 0,
                answers: shouldPersistAttemptState ? answers : [],
                testInProgress: shouldPersistAttemptState ? testInProgress : false,
                timeRemaining: shouldPersistAttemptState ? timeRemaining : 0,
                testStartTime: shouldPersistAttemptState
                    ? testStartTime?.toISOString() ?? null
                    : null,
                questionStartTime: shouldPersistAttemptState
                    ? questionStartTime?.toISOString() ?? null
                    : null,
                evaluationRequestId: shouldPersistAttemptState
                    ? evaluationRequestId
                    : null,
            } satisfies PersistedTestsState)
        );
    }, [
        answers,
        currentQuestionIndex,
        currentTest,
        evaluationRequestId,
        hasInitializedState,
        loadingResults,
        questionStartTime,
        serviceTests,
        storageKey,
        testInProgress,
        testStartTime,
        timeRemaining,
    ]);

    useEffect(() => {
        const interval = setInterval(() => {
            setShowQuestions((prev) => !prev);
            setKey((prevKey) => prevKey + 1);
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const applyGenerationRequestState = useCallback(
        (serviceInfo: TestData, requestState: TestRequestState) => {
            const serviceKey = getServiceTestKey(serviceInfo);

            if (requestState.status === 'COMPLETED' && requestState.result?.test) {
                setServiceTests((prev) => ({
                    ...prev,
                    [serviceKey]: {
                        serviceInfo,
                        requestId: requestState.requestId,
                        userTestId: requestState.userTestId,
                        status: 'completed',
                        test: requestState.result.test,
                        error: null,
                        nextAvailableAt: null,
                    },
                }));
                return;
            }

            if (
                requestState.status === 'FAILED' ||
                requestState.status === 'FAILED_BROADCAST'
            ) {
                setServiceTests((prev) => ({
                    ...prev,
                    [serviceKey]: {
                        serviceInfo,
                        requestId: requestState.requestId,
                        userTestId: requestState.userTestId,
                        status: 'failed',
                        test: null,
                        error: requestState.error ?? t('errors.defaultGeneration'),
                        nextAvailableAt: null,
                    },
                }));
                return;
            }

            setServiceTests((prev) => ({
                ...prev,
                [serviceKey]: {
                    ...(prev[serviceKey] ?? {
                        serviceInfo,
                        userTestId: null,
                        test: null,
                    }),
                    serviceInfo,
                    requestId: requestState.requestId,
                    userTestId: requestState.userTestId,
                    status: 'processing',
                    error: null,
                    nextAvailableAt: null,
                },
            }));
        },
        [t]
    );

    const applyEvaluationRequestState = useCallback(
        (requestState: TestRequestState) => {
            if (requestState.status === 'COMPLETED') {
                setEvaluationRequestId(null);
                setTestResult(normalizeEvaluationResult(requestState.result));
                setTestCompleted(true);
                setTestInProgress(false);
                setLoadingResults(false);
                setError('');
                clearPersistedAttemptState();
                return;
            }

            if (
                requestState.status === 'FAILED' ||
                requestState.status === 'FAILED_BROADCAST'
            ) {
                setEvaluationRequestId(null);
                setTestCompleted(false);
                setTestInProgress(false);
                setLoadingResults(false);
                setError(requestState.error ?? t('errors.defaultEvaluation'));
                clearPersistedAttemptState();
                return;
            }

            setEvaluationRequestId(requestState.requestId);
            setLoadingResults(true);
        },
        [clearPersistedAttemptState, t]
    );

    const syncTestRequest = useCallback(
        async (
            requestId: string,
            options?: {
                expectedType?: 'generation' | 'evaluation';
                serviceInfo?: TestData;
            }
        ) => {
            if (!requestId) {
                return;
            }

            try {
                const state = normalizeTestRequestState(
                    await apiClient.getTestRequestStatus(requestId)
                );
                const expectedType =
                    options?.expectedType ?? (state.type as 'generation' | 'evaluation');

                if (expectedType === 'evaluation') {
                    applyEvaluationRequestState(state);
                    return;
                }

                if (options?.serviceInfo) {
                    applyGenerationRequestState(options.serviceInfo, state);
                }
            } catch (requestError: any) {
                if (options?.expectedType === 'evaluation') {
                    setLoadingResults(false);
                    setError(
                        t('errors.evaluationStateWithMessage', {
                            message: requestError?.message ?? t('errors.unknown'),
                        })
                    );
                    return;
                }

                const serviceInfo = options?.serviceInfo;
                if (!serviceInfo) {
                    return;
                }

                const serviceKey = getServiceTestKey(serviceInfo);
                setServiceTests((prev) => ({
                    ...prev,
                    [serviceKey]: {
                        ...(prev[serviceKey] ?? {
                            serviceInfo,
                            requestId,
                            test: null,
                        }),
                        serviceInfo,
                        requestId,
                        status: 'failed',
                        test: null,
                        error: requestError?.message ?? t('errors.generationState'),
                        nextAvailableAt: null,
                    },
                }));
            }
        },
        [applyEvaluationRequestState, applyGenerationRequestState, t]
    );

    const initializeServiceTests = useCallback(
        async (
            testDataArray: TestData[],
            existingRequestIds: Record<string, string> = {}
        ) => {
            try {
                await Promise.all(
                    testDataArray.map(async (serviceInfo) => {
                        const serviceKey = getServiceTestKey(serviceInfo);
                        const existingRequestId = existingRequestIds[serviceKey];

                        if (existingRequestId) {
                            await syncTestRequest(existingRequestId, {
                                expectedType: 'generation',
                                serviceInfo,
                            });
                            return;
                        }

                        try {
                            const generationRequest =
                                serviceInfo.flow === 'level_upgrade'
                                    ? await apiClient.findLevelUpgradeTest(
                                          serviceInfo.serviceId,
                                          serviceInfo.level,
                                          locale
                                      )
                                    : await apiClient.findByServiceAndLevel(
                                          serviceInfo.serviceId,
                                          serviceInfo.level,
                                          locale
                                      );
                            const requestId = String(generationRequest?.request_id ?? '');

                            if (!requestId) {
                                throw new Error(t('errors.generationRequestId'));
                            }

                            setServiceTests((prev) => ({
                                ...prev,
                                [serviceKey]: {
                                    ...(prev[serviceKey] ?? {
                                        serviceInfo,
                                        userTestId: null,
                                        test: null,
                                    }),
                                    serviceInfo,
                                    requestId,
                                    userTestId: null,
                                    status: 'processing',
                                    error: null,
                                    nextAvailableAt: null,
                                },
                            }));

                            await syncTestRequest(requestId, {
                                expectedType: 'generation',
                                serviceInfo,
                            });
                        } catch (generationError: any) {
                            if (generationError?.status === 403) {
                                const payload = generationError?.data ?? {};
                                setServiceTests((prev) => ({
                                    ...prev,
                                    [serviceKey]: {
                                        serviceInfo,
                                        requestId: null,
                                        userTestId: null,
                                        status: 'cooldown',
                                        test: null,
                                        error:
                                            typeof payload?.message === 'string'
                                                ? payload.message
                                                : t('errors.cooldownDefault'),
                                        nextAvailableAt:
                                            typeof payload?.next_available_at === 'string'
                                                ? payload.next_available_at
                                                : null,
                                    },
                                }));
                                return;
                            }

                            setServiceTests((prev) => ({
                                ...prev,
                                [serviceKey]: {
                                    serviceInfo,
                                    requestId: null,
                                    userTestId: null,
                                    status: 'failed',
                                    test: null,
                                    error:
                                        generationError?.message ??
                                        t('errors.generationStart'),
                                    nextAvailableAt: null,
                                },
                            }));
                        }
                    })
                );
            } finally {
                setLoadingTests(false);
            }
        },
        [locale, syncTestRequest, t]
    );

    useEffect(() => {
        if (userLoading) {
            return;
        }

        if (!user) {
            router.push('/auth/signin');
            return;
        }

        if (!hasRoleInfo && !roleRefreshAttemptedRef.current) {
            roleRefreshAttemptedRef.current = true;
            setIsRefreshingRole(true);
            void refreshUser().finally(() => {
                setIsRefreshingRole(false);
            });
            return;
        }

        if (hasRoleInfo && !isProvider) {
            router.replace(getDashboardHomeHref());
            return;
        }

        if (!dataParam) {
            router.push(getProviderServicesSelectHref({ reset: true }));
            return;
        }

        try {
            setHasInitializedState(false);
            setLoadingTests(true);
            setError('');
            setTestCompleted(false);
            setTestResult(null);

            const parsedData = JSON.parse(decodeURIComponent(dataParam));
            const normalizedTestData = normalizeIncomingTestData(parsedData);
            const shouldRestoreAttemptState =
                storageKey != null &&
                consumeProviderTestsReloadIntent(
                    window.sessionStorage,
                    storageKey,
                    getNavigationType()
                );
            const persistedState = shouldRestoreAttemptState ? readPersistedState() : {};

            if (!shouldRestoreAttemptState) {
                clearPersistedState();
            }

            const generationRequestIds = persistedState.generationRequestIds ?? {};
            const restoredCurrentTest = shouldRestoreAttemptState
                ? persistedState.currentTest ?? null
                : null;
            const restoredTestInProgress = Boolean(
                persistedState.testInProgress && restoredCurrentTest
            );
            const restoredTestStartTime = shouldRestoreAttemptState
                ? parsePersistedDate(persistedState.testStartTime)
                : null;
            const restoredQuestionStartTime = shouldRestoreAttemptState
                ? parsePersistedDate(persistedState.questionStartTime)
                : null;
            const totalTestSeconds = Number(restoredCurrentTest?.test?.timeLimit ?? 0) * 60;
            const elapsedSeconds =
                restoredTestStartTime != null
                    ? Math.max(
                          0,
                          Math.floor((Date.now() - restoredTestStartTime.getTime()) / 1000)
                      )
                    : 0;
            const fallbackTimeRemaining =
                typeof persistedState.timeRemaining === 'number'
                    ? Math.max(0, persistedState.timeRemaining)
                    : 0;
            const restoredTimeRemaining = restoredTestInProgress
                ? totalTestSeconds > 0
                    ? Math.max(0, totalTestSeconds - elapsedSeconds)
                    : fallbackTimeRemaining
                : 0;
            const restoredQuestionsSource = restoredCurrentTest?.test?.questions;
            const restoredQuestions = Array.isArray(restoredQuestionsSource)
                ? restoredQuestionsSource
                : [];
            const questionCount = restoredQuestions.length;
            const restoredQuestionIndex =
                restoredTestInProgress && questionCount > 0
                    ? Math.min(
                          Math.max(Number(persistedState.currentQuestionIndex ?? 0), 0),
                          questionCount - 1
                      )
                    : 0;
            const initialServiceStates = createInitialServiceStates(
                normalizedTestData,
                generationRequestIds
            );

            setServiceTests(initialServiceStates);
            setTestData(normalizedTestData);
            setCurrentTest(restoredCurrentTest);
            setCurrentQuestionIndex(restoredQuestionIndex);
            setAnswers(
                shouldRestoreAttemptState && Array.isArray(persistedState.answers)
                    ? persistedState.answers
                    : []
            );
            setTestInProgress(restoredTestInProgress);
            setTimeRemaining(restoredTimeRemaining);
            setTestStartTime(restoredTestInProgress ? restoredTestStartTime : null);
            setQuestionStartTime(
                restoredTestInProgress
                    ? restoredQuestionStartTime ?? new Date()
                    : null
            );
            setEvaluationRequestId(
                shouldRestoreAttemptState
                    ? persistedState.evaluationRequestId ?? null
                    : null
            );
            setHasInitializedState(true);
            setLoadingTests(!restoredTestInProgress);

            void initializeServiceTests(normalizedTestData, generationRequestIds);

            if (shouldRestoreAttemptState && persistedState.evaluationRequestId) {
                setLoadingResults(true);
                void syncTestRequest(String(persistedState.evaluationRequestId), {
                    expectedType: 'evaluation',
                });
            } else {
                setLoadingResults(false);
            }
        } catch {
            setError(t('errors.invalidData'));
            setLoadingTests(false);
            router.push(getProviderServicesSelectHref({ reset: true }));
        }
    }, [
        clearPersistedState,
        dataParam,
        hasRoleInfo,
        initializeServiceTests,
        isProvider,
        readPersistedState,
        refreshUser,
        router,
        storageKey,
        syncTestRequest,
        t,
        user,
        userLoading,
    ]);

    useEffect(() => {
        if (!user?.id) {
            return;
        }

        let cancelled = false;
        let channel:
            | {
                  listen: (event: string, callback: (payload: any) => void) => void;
                  stopListening: (event: string) => void;
              }
            | null = null;

        const handleRealtimeUpdate = (payload: any) => {
            const requestId = String(payload?.request_id ?? '');
            if (!requestId) {
                return;
            }

            if (
                evaluationRequestIdRef.current &&
                evaluationRequestIdRef.current === requestId
            ) {
                void syncTestRequest(requestId, { expectedType: 'evaluation' });
                return;
            }

            const matchedServiceState = Object.values(serviceTestsRef.current).find(
                (entry) => entry.requestId === requestId
            );

            if (matchedServiceState) {
                void syncTestRequest(requestId, {
                    expectedType: 'generation',
                    serviceInfo: matchedServiceState.serviceInfo,
                });
            }
        };

        void (async () => {
            const echo = await ensureEcho();
            if (!echo || cancelled) {
                return;
            }

            const privateChannel = echo.private(`user.${user.id}.tests`);
            channel = privateChannel;
            privateChannel.listen('.AiTestUpdated', handleRealtimeUpdate);
            privateChannel.listen('.AiTestFailed', handleRealtimeUpdate);
        })();

        return () => {
            cancelled = true;
            channel?.stopListening('.AiTestUpdated');
            channel?.stopListening('.AiTestFailed');
        };
    }, [syncTestRequest, user?.id]);

    useEffect(() => {
        const generationPending = Object.values(serviceTests).filter(
            (entry) => entry.requestId && entry.status === 'processing'
        );

        if (generationPending.length === 0 && !(loadingResults && evaluationRequestId)) {
            return;
        }

        const interval = window.setInterval(() => {
            generationPending.forEach((entry) => {
                if (!entry.requestId) {
                    return;
                }

                void syncTestRequest(entry.requestId, {
                    expectedType: 'generation',
                    serviceInfo: entry.serviceInfo,
                });
            });

            if (loadingResults && evaluationRequestId) {
                void syncTestRequest(evaluationRequestId, {
                    expectedType: 'evaluation',
                });
            }
        }, 5000);

        return () => window.clearInterval(interval);
    }, [evaluationRequestId, loadingResults, serviceTests, syncTestRequest]);

    const handleSubmitTest = useCallback(async () => {
        if (!currentTest) {
            return;
        }

        setLoadingResults(true);

        try {
            setTestInProgress(false);
            setTestCompleted(false);
            setTestResult(null);

            const totalTimeSpent = testStartTime
                ? Math.floor((Date.now() - testStartTime.getTime()) / (1000 * 60))
                : currentTest.test.timeLimit;
            const currentServiceTestData = currentTest.serviceInfo ?? testData[0] ?? null;

            const formattedData = {
                testId: currentTest.test.id,
                userTestId: currentTest?.userTestId ?? null,
                answers,
                timeSpent: totalTimeSpent,
                testData: currentServiceTestData
                    ? {
                          serviceId: currentServiceTestData.serviceId,
                          levelHuman: formatLevelHuman(currentServiceTestData.level),
                          category: currentServiceTestData.category,
                          service: currentServiceTestData.serviceName,
                          lang: locale,
                      }
                    : null,
            };

            const evaluationRequest = await apiClient.takeTest(
                currentTest.test.id,
                formattedData
            );
            const requestId = String(evaluationRequest?.request_id ?? '');

            if (!requestId) {
                throw new Error(t('errors.evaluationRequestId'));
            }

            setEvaluationRequestId(requestId);
            setError('');
            void syncTestRequest(requestId, { expectedType: 'evaluation' });
        } catch (submitError: any) {
            setError(
                t('errors.submitTestWithMessage', {
                    message: submitError.message,
                })
            );
            setTestInProgress(false);
            setLoadingResults(false);
        }
    }, [answers, currentTest, locale, syncTestRequest, t, testData, testStartTime]);

    useEffect(() => {
        if (
            !hasInitializedState ||
            !testInProgress ||
            !currentTest ||
            loadingResults ||
            timeRemaining > 0
        ) {
            return;
        }

        void handleSubmitTest();
    }, [
        currentTest,
        handleSubmitTest,
        hasInitializedState,
        loadingResults,
        testInProgress,
        timeRemaining,
    ]);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (testInProgress && timeRemaining > 0) {
            interval = setInterval(() => {
                setTimeRemaining((prev) => {
                    if (prev <= 1) {
                        void handleSubmitTest();
                        return 0;
                    }

                    return prev - 1;
                });
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [handleSubmitTest, testInProgress, timeRemaining]);

    const startTest = useCallback(
        async (nextTest: CurrentTestSession) => {
            try {
                setStartWarningOpen(false);
                setPendingStartTest(null);
                setCurrentTest(nextTest);
                setCurrentQuestionIndex(0);
                setAnswers([]);
                setTimeRemaining(nextTest.test.timeLimit * 60);
                setTestStartTime(new Date());
                setQuestionStartTime(new Date());
                setTestInProgress(true);
                setTestCompleted(false);
                setTestResult(null);
                setEvaluationRequestId(null);
                setLoadingResults(false);
                setError('');
            } catch {
                setError(t('errors.startTest'));
            }
        },
        [t]
    );

    const handleStartRequested = useCallback((nextTest: CurrentTestSession) => {
        setPendingStartTest(nextTest);
        setStartWarningOpen(true);
    }, []);

    const handleStartWarningConfirm = useCallback(() => {
        if (!pendingStartTest) {
            return;
        }

        void startTest(pendingStartTest);
    }, [pendingStartTest, startTest]);

    const handleStartWarningOpenChange = useCallback((open: boolean) => {
        setStartWarningOpen(open);
        if (!open) {
            setPendingStartTest(null);
        }
    }, []);

    const handleExamViolationFailed = useCallback(() => {
        clearPersistedState();
        setTestInProgress(false);
        setCurrentTest(null);
        setCurrentQuestionIndex(0);
        setAnswers([]);
        setTimeRemaining(0);
        setTestStartTime(null);
        setQuestionStartTime(null);
        setEvaluationRequestId(null);
        setLoadingResults(false);
        setTestCompleted(false);
        setTestResult(null);
    }, [clearPersistedState]);

    const handleAnswerChange = useCallback(
        (questionId: string, answer: string | string[]) => {
            setAnswers((prev) => {
                const existing = prev.find((entry) => entry.questionId === questionId);
                if (existing) {
                    return prev.map((entry) =>
                        entry.questionId === questionId
                            ? { ...entry, answer }
                            : entry
                    );
                }

                return [...prev, { questionId, answer }];
            });
        },
        []
    );

    const nextQuestion = useCallback(() => {
        if (!currentTest) {
            return;
        }

        if (questionStartTime) {
            const timeSpent = Math.floor((Date.now() - questionStartTime.getTime()) / 1000);
            const currentQuestion = currentTest.test.questions[currentQuestionIndex];

            setAnswers((prev) =>
                prev.map((answer) =>
                    answer.questionId === currentQuestion.id
                        ? { ...answer, timeSpent }
                        : answer
                )
            );
        }

        if (currentQuestionIndex < currentTest.test.questions.length - 1) {
            setCurrentQuestionIndex((prev) => prev + 1);
            setQuestionStartTime(new Date());
        } else {
            void handleSubmitTest();
        }
    }, [
        currentQuestionIndex,
        currentTest,
        handleSubmitTest,
        questionStartTime,
    ]);

    const previousQuestion = useCallback(() => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex((prev) => prev - 1);
            setQuestionStartTime(new Date());
        }
    }, [currentQuestionIndex]);

    const handleBack = useCallback(() => {
        router.back();
    }, [router]);

    return {
        answers,
        currentQuestionIndex,
        currentTest,
        error,
        handleAnswerChange,
        handleBack,
        handleExamViolationFailed,
        handleStartRequested,
        handleStartWarningConfirm,
        handleStartWarningOpenChange,
        handleSubmitTest,
        hasRoleInfo,
        isInitialGenerationProcessing,
        isProvider,
        isRefreshingRole,
        key,
        loading,
        loadingResults,
        loadingTests,
        pendingStartTest,
        previousQuestion,
        nextQuestion,
        serviceTests,
        showQuestions,
        startWarningOpen,
        testCompleted,
        testData,
        testInProgress,
        testResult,
        timeRemaining,
        user,
        userLoading,
    };
}
