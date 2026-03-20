'use client';

import parseJson from "parse-json";
import nextDynamic from 'next/dynamic';
import { useLocale, useTranslations } from 'next-intl';

export const dynamic = 'force-dynamic';

import { Suspense, lazy, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react';
import { useRouter } from '@/lib/navigation';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
    ArrowLeft,
    AlertCircle,
    Loader2,
    PlayCircle,
    Clock,
    Target,
    Award,
    BookOpen,
    Code,
    Type,
    CheckSquare,
    Square,
    Timer,
    Send
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api';
import { getRoleSlugs } from '@/lib/access';
import { ensureEcho } from '@/lib/echo';
import { ProviderDashboardShell } from '@/components/dashboard/provider-dashboard-shell';
import ExamGuard from '@/components/exams/ExamGuard';

interface TestData {
    serviceId: string;
    serviceName: string;
    level: string;
    category: string;
    programming_language?: string;
    flow?: 'standard' | 'level_upgrade';
    currentLevel?: string;
}

interface Question {
    id: string;
    type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'CODE_WRITING' | 'TEXT_INPUT';
    question: string;
    points: number;
    options?: string[];
    correctAnswers: string[];
    explanation?: string;
    codeTemplate?: string;
    codeSolution?: string;
    expectedOutput?: string;
    testCases?: Array<{
        input: string;
        expectedOutput: string;
        description?: string;
    }>;
    meta?: Record<string, any> | null;
}

interface TestAnswer {
    questionId: string;
    answer: string | string[];
    timeSpent?: number;
}

type ServiceTestStatus = 'idle' | 'processing' | 'completed' | 'failed' | 'cooldown';

type ServiceTestCard = {
    serviceInfo: TestData;
    requestId: string | null;
    userTestId: string | null;
    status: ServiceTestStatus;
    test: any | null;
    error: string | null;
    nextAvailableAt: string | null;
};

type PersistedTestsState = {
    generationRequestIds?: Record<string, string>;
    currentTest?: any | null;
    currentQuestionIndex?: number;
    answers?: TestAnswer[];
    testInProgress?: boolean;
    timeRemaining?: number;
    testStartTime?: string | null;
    questionStartTime?: string | null;
    evaluationRequestId?: string | null;
};

type TestRequestState = {
    requestId: string;
    status: string;
    type: string;
    channel: string;
    serviceId: string | null;
    skillTestId: string | null;
    userTestId: string | null;
    testResultId: string | null;
    result: any;
    error: string | null;
    nextAvailableAt: string | null;
    message: string | null;
    restMessages: boolean;
};

const AnimatedStatusWord = lazy(() => import('@/components/exams/animated-status-word'));

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

const LazyTestStartWarningDialog = nextDynamic(
    () => import('@/components/exams/test-start-warning-dialog'),
    {
        ssr: false,
    }
);

const getServiceTestKey = (serviceInfo: TestData) =>
    `${serviceInfo.serviceId}:${serviceInfo.level}`.toLowerCase();

const parsePersistedDate = (value: unknown): Date | null => {
    if (typeof value !== 'string' || !value) {
        return null;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const getNavigationType = (): string | null => {
    if (typeof window === 'undefined' || typeof window.performance === 'undefined') {
        return null;
    }

    const [entry] = window.performance.getEntriesByType('navigation');
    if (entry && 'type' in entry && typeof entry.type === 'string') {
        return entry.type;
    }

    const legacyNavigation = (window.performance as Performance & {
        navigation?: { type?: number };
    }).navigation;

    if (legacyNavigation?.type === 1) {
        return 'reload';
    }

    if (legacyNavigation?.type === 2) {
        return 'back_forward';
    }

    if (legacyNavigation?.type === 0) {
        return 'navigate';
    }

    return null;
};

const parseArrayOfStrings = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value.filter((entry): entry is string => typeof entry === 'string');
    }

    if (typeof value === 'string') {
        try {
            const parsed = parseJson(value);
            if (Array.isArray(parsed)) {
                return parsed.filter((entry): entry is string => typeof entry === 'string');
            }
        } catch {
            if (value.trim()) {
                return [value];
            }
        }
    }

    return [];
};

const parseQuestionMeta = (value: unknown): Record<string, any> | null => {
    if (!value) {
        return null;
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
        return value as Record<string, any>;
    }

    if (typeof value === 'string') {
        try {
            const parsed = parseJson(value);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                return parsed as Record<string, any>;
            }
        } catch {
            return null;
        }
    }

    return null;
};

const normalizeQuestion = (rawQuestion: any): Question => ({
    id: String(rawQuestion?.id ?? ''),
    type: rawQuestion?.type ?? 'TEXT_INPUT',
    question: String(rawQuestion?.question ?? ''),
    points: Number(rawQuestion?.points ?? 0),
    options: parseArrayOfStrings(rawQuestion?.options),
    correctAnswers: parseArrayOfStrings(rawQuestion?.correctAnswers ?? rawQuestion?.correct_answers),
    explanation: typeof rawQuestion?.explanation === 'string' ? rawQuestion.explanation : undefined,
    codeTemplate:
        typeof rawQuestion?.codeTemplate === 'string'
            ? rawQuestion.codeTemplate
            : typeof rawQuestion?.code_template === 'string'
                ? rawQuestion.code_template
                : undefined,
    codeSolution:
        typeof rawQuestion?.codeSolution === 'string'
            ? rawQuestion.codeSolution
            : typeof rawQuestion?.code_solution === 'string'
                ? rawQuestion.code_solution
                : undefined,
    expectedOutput:
        typeof rawQuestion?.expectedOutput === 'string'
            ? rawQuestion.expectedOutput
            : typeof rawQuestion?.expected_output === 'string'
                ? rawQuestion.expected_output
                : undefined,
    testCases: Array.isArray(rawQuestion?.testCases)
        ? rawQuestion.testCases
        : Array.isArray(rawQuestion?.test_cases)
            ? rawQuestion.test_cases
            : [],
    meta: parseQuestionMeta(rawQuestion?.meta),
});

const normalizeEditorLanguage = (value: string) => {
    const normalized = value.trim().toLowerCase();

    switch (normalized) {
        case 'js':
        case 'javascript':
        case 'node':
        case 'nodejs':
        case 'next.js':
        case 'nextjs':
        case 'react':
        case 'astro':
        case 'svelte':
            return 'javascript';
        case 'ts':
        case 'typescript':
            return 'typescript';
        case 'php':
        case 'laravel':
            return 'php';
        case 'py':
        case 'python':
            return 'python';
        case 'go':
        case 'golang':
            return 'go';
        case 'java':
            return 'java';
        case 'ruby':
            return 'ruby';
        case 'c#':
        case 'csharp':
            return 'csharp';
        default:
            return normalized || 'javascript';
    }
};

const normalizeSkillTest = (rawTest: any) => {
    const questions = Array.isArray(rawTest?.questions)
        ? rawTest.questions.map(normalizeQuestion)
        : [];

    return {
        ...rawTest,
        id: String(rawTest?.id ?? ''),
        title: String(rawTest?.title ?? ''),
        description: typeof rawTest?.description === 'string' ? rawTest.description : '',
        service_id: rawTest?.service_id != null ? String(rawTest.service_id) : '',
        level: String(rawTest?.level ?? ''),
        timeLimit: Number(rawTest?.timeLimit ?? rawTest?.time_limit ?? 0),
        passingScore: Number(rawTest?.passingScore ?? rawTest?.passing_score ?? 0),
        totalQuestions: Number(rawTest?.totalQuestions ?? rawTest?.total_questions ?? questions.length),
        status: String(rawTest?.status ?? 'ACTIVE'),
        service: rawTest?.service
            ? {
                ...rawTest.service,
                id: rawTest.service?.id != null ? String(rawTest.service.id) : '',
                name: String(rawTest.service?.name ?? ''),
                category: rawTest.service?.category
                    ? {
                        ...rawTest.service.category,
                        id: rawTest.service.category?.id != null ? String(rawTest.service.category.id) : '',
                        name: String(rawTest.service.category?.name ?? ''),
                    }
                    : null,
            }
            : null,
        questions,
    };
};

const normalizeTestRequestState = (payload: any): TestRequestState => {
    const result = payload?.result ?? null;
    const normalizedResult =
        result?.test
            ? {
                ...result,
                test: normalizeSkillTest(result.test),
            }
            : result;

    return {
        requestId: String(payload?.request_id ?? ''),
        status: String(payload?.status ?? 'PROCESSING').toUpperCase(),
        type: String(payload?.type ?? ''),
        channel: String(payload?.channel ?? ''),
        serviceId: payload?.service_id != null ? String(payload.service_id) : null,
        skillTestId: payload?.skill_test_id != null ? String(payload.skill_test_id) : null,
        userTestId: payload?.user_test_id != null ? String(payload.user_test_id) : null,
        testResultId: payload?.test_result_id != null ? String(payload.test_result_id) : null,
        result: normalizedResult,
        error: typeof payload?.error === 'string' ? payload.error : null,
        nextAvailableAt:
            typeof payload?.next_available_at === 'string' ? payload.next_available_at : null,
        message: typeof payload?.message === 'string' ? payload.message : null,
        restMessages: Boolean(payload?.restMessages ?? payload?.rest_messages),
    };
};

const normalizeEvaluationResult = (payload: any) => {
    const result = payload?.result?.result ?? payload?.result ?? payload ?? {};
    const explanations = Array.isArray(result?.explanations)
        ? result.explanations.map((explanation: any) => ({
            questionId: String(explanation?.questionId ?? explanation?.question_id ?? ''),
            score: Number(explanation?.score ?? 0),
            comment: String(explanation?.comment ?? ''),
            isCorrect: Boolean(explanation?.isCorrect ?? explanation?.is_correct),
            explanation:
                typeof explanation?.explanation === 'string' ? explanation.explanation : undefined,
            correctAnswer:
                explanation?.correctAnswer ??
                explanation?.correct_answer ??
                undefined,
        }))
        : [];

    return {
        score: Number(result?.score ?? 0),
        passed: Boolean(result?.passed),
        feedback: String(result?.feedback ?? ''),
        explanations,
        timeSpent: Number(result?.timeSpent ?? result?.time_spent ?? 0),
        test_result_id:
            result?.test_result_id != null
                ? String(result.test_result_id)
                : result?.testResultId != null
                    ? String(result.testResultId)
                    : null,
        error: Boolean(result?.error),
    };
};

export default function SelectTestsPageClient() {
    const { user, loading, userLoading, refreshUser } = useAuth();
    const locale = useLocale();
    const t = useTranslations('tests.providerFlow');
    const [testData, setTestData] = useState<TestData[]>([]);
    const [serviceTests, setServiceTests] = useState<Record<string, ServiceTestCard>>({});
    const [currentTest, setCurrentTest] = useState<any>(null);
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
    const router = useRouter();
    const searchParams = useSearchParams();
    const dataParam = searchParams.get('data');
    const [showQuestions, setShowQuestions] = useState(false);
    const [key, setKey] = useState(0);
    const [loadingResults, setLoadingResults] = useState(false);
    const [evaluationRequestId, setEvaluationRequestId] = useState<string | null>(null);
    const [hasInitializedState, setHasInitializedState] = useState(false);
    const [startWarningOpen, setStartWarningOpen] = useState(false);
    const [pendingStartTest, setPendingStartTest] = useState<any | null>(null);
    const serviceTestsRef = useRef<Record<string, ServiceTestCard>>({});
    const evaluationRequestIdRef = useRef<string | null>(null);
    const roleRefreshAttemptedRef = useRef(false);
    const isPageUnloadingRef = useRef(false);
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
                return status === 'completed' || status === 'failed' || status === 'cooldown';
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

    const formatLevelHuman = useCallback((level: string) => {
        const normalized = level.trim().toUpperCase();

        if (normalized === 'JUNIOR') return 'Junior';
        if (normalized === 'MEDIU' || normalized === 'MID' || normalized === 'INTERMEDIATE') {
            return 'Mid';
        }
        if (normalized === 'SENIOR') return 'Senior';

        if (!normalized) {
            return '';
        }

        return normalized.charAt(0) + normalized.slice(1).toLowerCase();
    }, []);

    const formatLevelLabel = useCallback((level: string) => {
        const normalized = level.trim().toUpperCase();

        switch (normalized) {
            case 'JUNIOR':
                return t('levels.junior');
            case 'MEDIU':
            case 'MID':
            case 'INTERMEDIATE':
                return t('levels.intermediate');
            case 'SENIOR':
                return t('levels.senior');
            case 'EXPERT':
                return t('levels.expert');
            default:
                return normalized || level;
        }
    }, [t]);

    const formatCooldownDate = useCallback((value: string | null) => {
        if (!value) return null;

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return new Intl.DateTimeFormat(locale, {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(date);
    }, [locale]);

    useEffect(() => {
        serviceTestsRef.current = serviceTests;
    }, [serviceTests]);

    useEffect(() => {
        evaluationRequestIdRef.current = evaluationRequestId;
    }, [evaluationRequestId]);

    useEffect(() => {
        isPageUnloadingRef.current = false;

        const markPageUnloading = () => {
            isPageUnloadingRef.current = true;
        };

        window.addEventListener('beforeunload', markPageUnloading);
        window.addEventListener('pagehide', markPageUnloading);

        return () => {
            window.removeEventListener('beforeunload', markPageUnloading);
            window.removeEventListener('pagehide', markPageUnloading);

            if (!isPageUnloadingRef.current) {
                clearPersistedState();
            }
        };
    }, [clearPersistedState]);

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
            setKey((k) => k + 1);
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

            if (requestState.status === 'FAILED' || requestState.status === 'FAILED_BROADCAST') {
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

    const applyEvaluationRequestState = useCallback((requestState: TestRequestState) => {
        if (requestState.status === 'COMPLETED') {
            setEvaluationRequestId(null);
            setTestResult(normalizeEvaluationResult(requestState.result));
            setTestCompleted(true);
            setTestInProgress(false);
            setLoadingResults(false);
            setError('');
            return;
        }

        if (requestState.status === 'FAILED' || requestState.status === 'FAILED_BROADCAST') {
            setEvaluationRequestId(null);
            setTestCompleted(false);
            setTestInProgress(false);
            setLoadingResults(false);
            setError(requestState.error ?? t('errors.defaultEvaluation'));
            return;
        }

        setEvaluationRequestId(requestState.requestId);
        setLoadingResults(true);
    }, [t]);

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
                const expectedType = options?.expectedType ?? (state.type as 'generation' | 'evaluation');

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
                        error:
                            requestError?.message ??
                            t('errors.generationState'),
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
        if (userLoading) return;

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
            router.push('/dashboard');
            return;
        }

        if (!dataParam) {
            router.push('/provider/services/select');
            return;
        }

        try {
            setHasInitializedState(false);
            setLoadingTests(true);
            setError('');
            setTestCompleted(false);
            setTestResult(null);

            const parsedData = JSON.parse(decodeURIComponent(dataParam));
            const normalizedTestData = (Array.isArray(parsedData)
                ? parsedData
                : parsedData
                    ? [parsedData]
                    : []
            ).map((entry) => ({
                ...entry,
                programming_language:
                    typeof entry?.programming_language === 'string'
                        ? entry.programming_language
                        : typeof entry?.programmingLanguage === 'string'
                            ? entry.programmingLanguage
                            : '',
            }));
            const shouldRestoreAttemptState = getNavigationType() === 'reload';
            const persistedState = shouldRestoreAttemptState
                ? readPersistedState()
                : {};

            if (!shouldRestoreAttemptState) {
                clearPersistedState();
            }

            const generationRequestIds = persistedState.generationRequestIds ?? {};
            const restoredCurrentTest = shouldRestoreAttemptState
                ? persistedState.currentTest ?? null
                : null;
            const restoredTestInProgress = Boolean(persistedState.testInProgress && restoredCurrentTest);
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
            const questionCount = Array.isArray(restoredCurrentTest?.test?.questions)
                ? restoredCurrentTest.test.questions.length
                : 0;
            const restoredQuestionIndex = restoredTestInProgress && questionCount > 0
                ? Math.min(
                    Math.max(Number(persistedState.currentQuestionIndex ?? 0), 0),
                    questionCount - 1
                )
                : 0;
            const initialServiceStates = Object.fromEntries(
                normalizedTestData.map((serviceInfo) => {
                    const serviceKey = getServiceTestKey(serviceInfo);
                    const existingRequestId = generationRequestIds[serviceKey] ?? null;

                    return [
                        serviceKey,
                        {
                            serviceInfo,
                            requestId: existingRequestId,
                            userTestId: null,
                            status: existingRequestId ? 'processing' : 'idle',
                            test: null,
                            error: null,
                            nextAvailableAt: null,
                        } satisfies ServiceTestCard,
                    ];
                })
            ) as Record<string, ServiceTestCard>;

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
        } catch (loadError) {
            setError(t('errors.invalidData'));
            setLoadingTests(false);
            router.push('/provider/services/select');
        }
    }, [
        dataParam,
        initializeServiceTests,
        readPersistedState,
        clearPersistedState,
        refreshUser,
        router,
        syncTestRequest,
        hasRoleInfo,
        isProvider,
        user,
        userLoading,
        t,
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

            if (evaluationRequestIdRef.current && evaluationRequestIdRef.current === requestId) {
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
                void syncTestRequest(evaluationRequestId, { expectedType: 'evaluation' });
            }
        }, 5000);

        return () => window.clearInterval(interval);
    }, [evaluationRequestId, loadingResults, serviceTests, syncTestRequest]);

    const handleSubmitTest = useCallback(async () => {
        setLoadingResults(true);
        try {
            setTestInProgress(false);
            setTestCompleted(false);
            setTestResult(null);

            const totalTimeSpent = testStartTime
                ? Math.floor((Date.now() - testStartTime.getTime()) / (1000 * 60))
                : currentTest.test.timeLimit;
            const currentServiceTestData = currentTest?.serviceInfo ?? testData[0] ?? null;

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

            const evaluationRequest = await apiClient.takeTest(currentTest.test.id, formattedData);
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
    }, [answers, currentTest, formatLevelHuman, locale, syncTestRequest, t, testData, testStartTime]);

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
    }, [currentTest, handleSubmitTest, hasInitializedState, loadingResults, testInProgress, timeRemaining]);

    // Timer pentru test
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (testInProgress && timeRemaining > 0) {
            interval = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        handleSubmitTest();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [handleSubmitTest, testInProgress, timeRemaining]);

    const startTest = useCallback(async (test: any) => {
        try {
            setStartWarningOpen(false);
            setPendingStartTest(null);
            setCurrentTest(test);
            setCurrentQuestionIndex(0);
            setAnswers([]);
            setTimeRemaining(test.test.timeLimit * 60); // convertim minutele în secunde
            setTestStartTime(new Date());
            setQuestionStartTime(new Date());
            setTestInProgress(true);
            setTestCompleted(false);
            setTestResult(null);
            setEvaluationRequestId(null);
            setLoadingResults(false);
            setError('');
        } catch (error: any) {
            setError(t('errors.startTest'));
        }
    }, [t]);

    const handleStartWarningConfirm = useCallback(() => {
        if (!pendingStartTest) {
            return;
        }

        void startTest(pendingStartTest);
    }, [pendingStartTest, startTest]);

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

    const handleAnswerChange = (questionId: string, answer: string | string[]) => {
        setAnswers(prev => {
            const existing = prev.find(a => a.questionId === questionId);
            if (existing) {
                return prev.map(a =>
                    a.questionId === questionId
                        ? { ...a, answer }
                        : a
                );
            } else {
                return [...prev, { questionId, answer }];
            }
        });
    };

    const nextQuestion = () => {

        if (questionStartTime) {
            const timeSpent = Math.floor((Date.now() - questionStartTime.getTime()) / 1000);
            const currentQuestion = currentTest.test.questions[currentQuestionIndex];

            setAnswers(prev =>
                prev.map(a =>
                    a.questionId === currentQuestion.id
                        ? { ...a, timeSpent }
                        : a
                )
            );
        }

        if (currentQuestionIndex < currentTest.test.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setQuestionStartTime(new Date());
        } else {
            handleSubmitTest();
        }
    };

    const previousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
            setQuestionStartTime(new Date());
        }
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const getQuestionTypeIcon = (type: string) => {
        switch (type) {
            case 'SINGLE_CHOICE': return Square;
            case 'MULTIPLE_CHOICE': return CheckSquare;
            case 'CODE_WRITING': return Code;
            case 'TEXT_INPUT': return Type;
            default: return BookOpen;
        }
    };

    const getQuestionTypeLabel = (type: string) => {
        switch (type) {
            case 'SINGLE_CHOICE': return t('questionTypes.singleChoice');
            case 'MULTIPLE_CHOICE': return t('questionTypes.multipleChoice');
            case 'CODE_WRITING': return t('questionTypes.codeWriting');
            case 'TEXT_INPUT': return t('questionTypes.textInput');
            default: return type;
        }
    };

    const renderQuestion = (question: Question, codeInput?: ReactNode) => {
        const currentAnswer = answers.find(a => a.questionId === question.id)?.answer;
        const Icon = getQuestionTypeIcon(question.type);

        // @ts-ignore
        return (
            <Card className="glass-card border-emerald-100/60">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Icon className="w-5 h-5 text-primary" />
                            <Badge variant="outline">
                                {getQuestionTypeLabel(question.type)}
                            </Badge>
                            <Badge className="bg-blue-100 text-blue-800">
                                {t('question.points', { count: question.points })}
                            </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {t('question.counter', {
                                current: currentQuestionIndex + 1,
                                total: currentTest.test.questions.length,
                            })}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-4">
                            {question.question}
                        </h3>
                    </div>

                    {/* Single Choice */}
                    {question.type === 'SINGLE_CHOICE' && question.options && (
                        <RadioGroup
                            value={currentAnswer as string || ''}
                            onValueChange={(value) => handleAnswerChange(question.id, value)}
                        >
                            {question.options.map((option: string, index: number) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                                    <Label htmlFor={`${question.id}-${index}`} className="cursor-pointer">
                                        {option}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    )}

                    {/* Multiple Choice */}
                    {question.type === 'MULTIPLE_CHOICE' && question.options && (
                        <div className="space-y-3">

                            {question.options.map((option: string, index: number) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`${question.id}-${index}`}
                                        checked={Array.isArray(currentAnswer) && currentAnswer.includes(option)}
                                        onCheckedChange={(checked) => {
                                            const currentAnswers = Array.isArray(currentAnswer) ? currentAnswer : [];
                                            const newAnswers = checked
                                                ? [...currentAnswers, option]
                                                : currentAnswers.filter(a => a !== option);
                                            handleAnswerChange(question.id, newAnswers);
                                        }}
                                    />
                                    <Label htmlFor={`${question.id}-${index}`} className="cursor-pointer">
                                        {option}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Code Writing */}
                    {question.type === 'CODE_WRITING' && (
                        <div className="space-y-4">
                            {question.codeTemplate && (
                                <div>
                                    <Label className="text-sm font-medium mb-2 block">{t('question.template')}</Label>
                                    <pre className="bg-muted p-3 rounded-lg text-sm font-mono overflow-x-auto">
                                        {question.codeTemplate}
                                    </pre>
                                </div>
                            )}

                            {question.testCases && question.testCases.length > 0 && (
                                <div>
                                    <Label className="text-sm font-medium mb-2 block">{t('question.testCases')}</Label>
                                    <div className="space-y-2">
                                        {question.testCases.map((testCase, index) => (
                                            <div key={index} className="bg-muted p-3 rounded-lg text-sm">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <strong>{t('question.input')}</strong> {testCase.input}
                                                    </div>
                                                    <div>
                                                        <strong>{t('question.expectedOutput')}</strong> {testCase.expectedOutput}
                                                    </div>
                                                </div>
                                                {testCase.description && (
                                                    <div className="mt-2 text-muted-foreground">
                                                        {testCase.description}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <Label className="text-sm font-medium mb-2 block">
                                    {t('question.writeCode')}
                                </Label>
                                {codeInput}
                            </div>
                        </div>
                    )}

                    {/* Text Input */}
                    {question.type === 'TEXT_INPUT' && (
                        <div>
                            <Label htmlFor={`text-${question.id}`} className="text-sm font-medium mb-2 block">
                                {t('question.yourAnswer')}
                            </Label>
                            <Input
                                id={`text-${question.id}`}
                                value={currentAnswer as string || ''}
                                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                placeholder={t('question.writeAnswerPlaceholder')}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    };

    if (loading || userLoading || isRefreshingRole) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[var(--bg-light)] dark:bg-[#070C14] hero-gradient">
                <div className="flex flex-col items-center justify-center p-4">
                    <Loader2 className="w-10 h-10 text-[var(--emerald-green)] animate-spin mb-4" />
                    <p className="text-lg text-slate-700 dark:text-slate-200 font-medium h-8">
                        {t('loading.generatingPrefix')}{" "}
                        <Suspense
                            fallback={
                                <span className="inline-block font-bold text-[var(--emerald-green)]">
                                    {showQuestions ? t('loading.words.questions') : t('loading.words.test')}
                                </span>
                            }
                        >
                            <AnimatedStatusWord animationKey={key}>
                                {showQuestions ? t('loading.words.questions') : t('loading.words.test')}
                            </AnimatedStatusWord>
                        </Suspense>
                        !
                    </p>
                </div>
            </div>
        );
    }

    if (!user || (hasRoleInfo && !isProvider)) {
        return null;
    }

    if (loadingResults) {
        return (
            <ProviderDashboardShell
                title={t('shell.title')}
                description={t('shell.waitingResultDescription')}
                activeMenu="services"
            >
                <div className="flex min-h-[55vh] items-center justify-center">
                    <div className="flex flex-col items-center justify-center p-4">
                        <Loader2 className="mb-4 h-10 w-10 animate-spin text-[var(--emerald-green)]" />
                        <p className="h-8 text-lg font-medium text-slate-700 dark:text-slate-200">
                            {t('loading.waitingResultPrefix')}{" "}
                            <Suspense
                                fallback={
                                    <span className="inline-block font-bold text-[var(--emerald-green)]">
                                        {t('loading.words.result')}
                                    </span>
                                }
                            >
                                <AnimatedStatusWord animationKey={key}>
                                    {t('loading.words.result')}
                                </AnimatedStatusWord>
                            </Suspense>
                            !
                        </p>
                    </div>
                </div>
            </ProviderDashboardShell>
        );
    }

    if (loadingTests || isInitialGenerationProcessing) {
        return (
            <ProviderDashboardShell
                title={t('shell.title')}
                description={t('shell.generatingDescription')}
                activeMenu="services"
            >
                <div className="flex min-h-[55vh] items-center justify-center">
                    <div className="flex flex-col items-center justify-center p-4">
                        <Loader2 className="mb-4 h-10 w-10 animate-spin text-[var(--emerald-green)]" />
                        <p className="h-8 text-lg font-medium text-slate-700 dark:text-slate-200">
                            {t('loading.generatingPrefix')}{" "}
                            <Suspense
                                fallback={
                                    <span className="inline-block font-bold text-[var(--emerald-green)]">
                                        {showQuestions ? t('loading.words.questions') : t('loading.words.test')}
                                    </span>
                                }
                            >
                                <AnimatedStatusWord animationKey={key}>
                                    {showQuestions ? t('loading.words.questions') : t('loading.words.test')}
                                </AnimatedStatusWord>
                            </Suspense>
                            !
                        </p>
                    </div>
                </div>
            </ProviderDashboardShell>
        );
    }

    // Afișare rezultat test
    if (testCompleted && testResult && currentTest) {
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

    // Test în progres
    if (testInProgress && currentTest) {

        const currentQuestion = currentTest.test.questions[currentQuestionIndex];
        const progress = ((currentQuestionIndex + 1) / currentTest.test.questions.length) * 100;
        const hasAnswer = answers.some(a => a.questionId === currentQuestion.id);
        const currentCodeAnswer = answers.find(
            (answer) => answer.questionId === currentQuestion.id
        )?.answer;
        const codeEditor =
            currentQuestion.type === 'CODE_WRITING' ? (
                <ExamGuard
                    testId={currentTest.userTestId ?? currentTest.test.id}
                    initialStrikes={0}
                    editorLanguage={normalizeEditorLanguage(
                        currentTest?.serviceInfo?.programming_language || 'javascript'
                    )}
                    value={
                        typeof currentCodeAnswer === 'string'
                            ? currentCodeAnswer
                            : currentQuestion.codeTemplate || ''
                    }
                    onChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                    onFailed={handleExamViolationFailed}
                />
            ) : null;

        return (
            <ProviderDashboardShell
                title={currentTest.test.title}
                description={currentTest.serviceInfo.serviceName}
                activeMenu="services"
            >
                <div className="space-y-6">
                    {/* Test Header */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h1 className="text-2xl font-bold">{currentTest.test.title}</h1>
                                <p className="text-muted-foreground">{currentTest.serviceInfo.serviceName}</p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div
                                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${timeRemaining < 300 ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                                        }`}
                                >
                                    <Timer className="w-4 h-4" />
                                    <span className="font-mono font-bold">
                                        {formatTime(timeRemaining)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>{t('progress.label')}</span>
                                <span>{t('progress.counter', {
                                    current: currentQuestionIndex + 1,
                                    total: currentTest.test.questions.length,
                                })}</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>
                    </div>

                    {currentQuestion.type !== 'CODE_WRITING' ? (
                        <ExamGuard
                            testId={currentTest.userTestId ?? currentTest.test.id}
                            initialStrikes={0}
                            onFailed={handleExamViolationFailed}
                        />
                    ) : null}

                    {/* Întrebarea curentă */}
                    {renderQuestion(currentQuestion, codeEditor)}

                    {/* Navigare */}
                    <div className="flex justify-between mt-6">
                        <Button
                            variant="outline"
                            onClick={previousQuestion}
                            disabled={currentQuestionIndex === 0}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            {t('progress.previous')}
                        </Button>

                        <div className="flex space-x-3">
                            {currentQuestionIndex === currentTest.test.questions.length - 1 ? (
                                <Button
                                    onClick={handleSubmitTest}
                                    className="btn-primary px-8"
                                    disabled={!hasAnswer}
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    {t('progress.finishTest')}
                                </Button>
                            ) : (
                                <Button
                                    onClick={nextQuestion}
                                    disabled={!hasAnswer}
                                >
                                    {t('progress.next')}
                                    <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </ProviderDashboardShell>
        );
    }

    // Lista testelor disponibile
    return (
        <ProviderDashboardShell
            title={t('shell.title')}
            description={t('shell.description')}
            activeMenu="services"
        >
            <div className="space-y-8">
                {/* Header */}
                <div className="flex items-center space-x-4 mb-8">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
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

                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Lista testelor */}
                <div className="space-y-6">
                    {testData.map((serviceInfo, index) => {
                        const serviceTest = serviceTests[getServiceTestKey(serviceInfo)];

                        if (!serviceTest || serviceTest.status === 'idle' || serviceTest.status === 'processing') {
                            return (
                                <Card key={`${serviceInfo.serviceId}-${serviceInfo.level}-${index}`} className="glass-card border-emerald-100/60">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-xl">{serviceInfo.serviceName}</CardTitle>
                                                <CardDescription className="mt-1">
                                                    {t('list.levelLabel', { level: formatLevelLabel(serviceInfo.level) })}
                                                </CardDescription>
                                            </div>
                                            <Badge className="bg-emerald-100 text-emerald-800">
                                                {serviceInfo.category}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex items-center justify-between gap-4">
                                        <div className="flex items-center space-x-3 text-muted-foreground">
                                            <Loader2 className="w-5 h-5 animate-spin text-[var(--emerald-green)]" />
                                            <div>
                                                <p className="font-medium text-foreground">
                                                    {t('list.processingTitle')}
                                                </p>
                                                <p className="text-sm">
                                                    {t('list.processingDescription')}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant="outline">{t('list.processingBadge')}</Badge>
                                    </CardContent>
                                </Card>
                            );
                        }

                        if (serviceTest.status === 'cooldown') {
                            return (
                                <Card key={`${serviceInfo.serviceId}-${serviceInfo.level}-${index}`} className="glass-card border-amber-200/80">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-xl">{serviceInfo.serviceName}</CardTitle>
                                                <CardDescription className="mt-1">
                                                    {t('list.levelLabel', { level: formatLevelLabel(serviceInfo.level) })}
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
                                                {serviceTest.error ?? t('list.cooldownDefault')}
                                            </AlertDescription>
                                        </Alert>
                                        {serviceTest.nextAvailableAt ? (
                                            <p className="text-sm text-muted-foreground">
                                                {t('list.availableAgainAt', {
                                                    date: formatCooldownDate(serviceTest.nextAvailableAt) ?? '',
                                                })}
                                            </p>
                                        ) : null}
                                    </CardContent>
                                </Card>
                            );
                        }

                        if (serviceTest.status === 'failed' || !serviceTest.test) {
                            return (
                                <Card key={`${serviceInfo.serviceId}-${serviceInfo.level}-${index}`} className="glass-card border-red-200/80">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-xl">{serviceInfo.serviceName}</CardTitle>
                                                <CardDescription className="mt-1">
                                                    {t('list.levelLabel', { level: formatLevelLabel(serviceInfo.level) })}
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
                                                {serviceTest.error ?? t('list.failedDefault')}
                                            </AlertDescription>
                                        </Alert>
                                    </CardContent>
                                </Card>
                            );
                        }

                        return (
                            <Card key={`${serviceInfo.serviceId}-${serviceInfo.level}-${index}`} className="glass-card border-emerald-100/60">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-xl">{serviceTest.test.title}</CardTitle>
                                            <CardDescription className="mt-1">
                                                {t('list.testCardDescription', {
                                                    service: serviceInfo.serviceName,
                                                    level: formatLevelLabel(serviceInfo.level),
                                                })}
                                            </CardDescription>
                                        </div>
                                        <Badge className="bg-emerald-100 text-emerald-800">
                                            {serviceInfo.category}
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <CardContent>
                                    <p className="text-muted-foreground mb-4">{serviceTest.test.description}</p>

                                    <div className="grid xs:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                        <div className="flex items-center space-x-2 text-sm">
                                            <BookOpen className="w-4 h-4 text-[var(--emerald-green)]" />
                                            <span>{t('list.questionCount', {
                                                count: serviceTest.test.totalQuestions || serviceTest.test.questions.length,
                                            })}</span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-sm">
                                            <Clock className="w-4 h-4 text-amber-500" />
                                            <span>{t('list.minuteCount', {
                                                count: serviceTest.test.timeLimit,
                                            })}</span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-sm">
                                            <Target className="w-4 h-4 text-[var(--emerald-green)]" />
                                            <span>{t('list.passingScore', {
                                                score: serviceTest.test.passingScore,
                                            })}</span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-sm">
                                            <Award className="w-4 h-4 text-emerald-500" />
                                            <span>{t('list.certification')}</span>
                                        </div>
                                    </div>

                                    <Button
                                        className="btn-primary"
                                        onClick={() => {
                                            setPendingStartTest({
                                                test: serviceTest.test,
                                                serviceInfo,
                                                requestId: serviceTest.requestId,
                                                userTestId: serviceTest.userTestId,
                                            });
                                            setStartWarningOpen(true);
                                        }}
                                    >
                                        <PlayCircle className="w-4 h-4 mr-2" />
                                        {t('list.startTest')}
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}

                    {testData.length === 0 && !loadingTests && (
                        <div className="text-center py-12">
                            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">{t('list.emptyTitle')}</h3>
                            <p className="text-muted-foreground mb-4">
                                {error ?? t('list.emptyDescription')}
                            </p>
                            <Button variant="outline" onClick={() => router.back()}>
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                {t('list.back')}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
            <LazyTestStartWarningDialog
                open={startWarningOpen}
                onOpenChange={(open) => {
                    setStartWarningOpen(open);
                    if (!open) {
                        setPendingStartTest(null);
                    }
                }}
                onConfirm={handleStartWarningConfirm}
            />
        </ProviderDashboardShell>
    );
}
