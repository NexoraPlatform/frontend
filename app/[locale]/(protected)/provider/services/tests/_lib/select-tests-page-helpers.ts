import parseJson from 'parse-json';

import type {
    Question,
    SelectTestsTranslation,
    ServiceTestCard,
    TestData,
    TestRequestState,
} from './select-tests-page-types';

export const getServiceTestKey = (serviceInfo: TestData) =>
    `${serviceInfo.serviceId}:${serviceInfo.level}`.toLowerCase();

export const parsePersistedDate = (value: unknown): Date | null => {
    if (typeof value !== 'string' || !value) {
        return null;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

export const getNavigationType = (): string | null => {
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

export const parseArrayOfStrings = (value: unknown): string[] => {
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

export const parseQuestionMeta = (value: unknown): Record<string, any> | null => {
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

export const normalizeQuestion = (rawQuestion: any): Question => ({
    id: String(rawQuestion?.id ?? ''),
    type: rawQuestion?.type ?? 'TEXT_INPUT',
    question: String(rawQuestion?.question ?? ''),
    points: Number(rawQuestion?.points ?? 0),
    options: parseArrayOfStrings(rawQuestion?.options),
    correctAnswers: parseArrayOfStrings(
        rawQuestion?.correctAnswers ?? rawQuestion?.correct_answers
    ),
    explanation:
        typeof rawQuestion?.explanation === 'string' ? rawQuestion.explanation : undefined,
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

export const normalizeEditorLanguage = (value: string) => {
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

export const normalizeSkillTest = (rawTest: any) => {
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
        totalQuestions: Number(
            rawTest?.totalQuestions ?? rawTest?.total_questions ?? questions.length
        ),
        status: String(rawTest?.status ?? 'ACTIVE'),
        service: rawTest?.service
            ? {
                  ...rawTest.service,
                  id: rawTest.service?.id != null ? String(rawTest.service.id) : '',
                  name: String(rawTest.service?.name ?? ''),
                  category: rawTest.service?.category
                      ? {
                            ...rawTest.service.category,
                            id:
                                rawTest.service.category?.id != null
                                    ? String(rawTest.service.category.id)
                                    : '',
                            name: String(rawTest.service.category?.name ?? ''),
                        }
                      : null,
              }
            : null,
        questions,
    };
};

export const normalizeTestRequestState = (payload: any): TestRequestState => {
    const result = payload?.result ?? null;
    const normalizedResult = result?.test
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

export const normalizeEvaluationResult = (payload: any) => {
    const result = payload?.result?.result ?? payload?.result ?? payload ?? {};
    const explanations = Array.isArray(result?.explanations)
        ? result.explanations.map((explanation: any) => ({
              questionId: String(
                  explanation?.questionId ?? explanation?.question_id ?? ''
              ),
              score: Number(explanation?.score ?? 0),
              comment: String(explanation?.comment ?? ''),
              isCorrect: Boolean(explanation?.isCorrect ?? explanation?.is_correct),
              explanation:
                  typeof explanation?.explanation === 'string'
                      ? explanation.explanation
                      : undefined,
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

export const normalizeIncomingTestData = (payload: unknown): TestData[] => {
    const normalizedPayload = Array.isArray(payload) ? payload : payload ? [payload] : [];

    return normalizedPayload.map((entry: any) => ({
        ...entry,
        programming_language:
            typeof entry?.programming_language === 'string'
                ? entry.programming_language
                : typeof entry?.programmingLanguage === 'string'
                  ? entry.programmingLanguage
                  : '',
    }));
};

export const createInitialServiceStates = (
    testData: TestData[],
    generationRequestIds: Record<string, string> = {}
) =>
    Object.fromEntries(
        testData.map((serviceInfo) => {
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

export const formatLevelHuman = (level: string) => {
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
};

export const formatLevelLabel = (
    level: string,
    t: SelectTestsTranslation
) => {
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
};

export const formatCooldownDate = (value: string | null, locale: string) => {
    if (!value) return null;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
};

export const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};
