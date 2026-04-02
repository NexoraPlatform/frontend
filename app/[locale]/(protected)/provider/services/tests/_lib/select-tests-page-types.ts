export interface TestData {
    serviceId: string;
    serviceName: string;
    level: string;
    category: string;
    programming_language?: string;
    flow?: 'standard' | 'level_upgrade';
    currentLevel?: string;
}

export interface Question {
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

export interface TestAnswer {
    questionId: string;
    answer: string | string[];
    timeSpent?: number;
}

export type ServiceTestStatus = 'idle' | 'processing' | 'completed' | 'failed' | 'cooldown';

export type ServiceTestCard = {
    serviceInfo: TestData;
    requestId: string | null;
    userTestId: string | null;
    status: ServiceTestStatus;
    test: any | null;
    error: string | null;
    nextAvailableAt: string | null;
};

export type CurrentTestSession = {
    test: any;
    serviceInfo: TestData;
    requestId: string | null;
    userTestId: string | null;
};

export type PersistedTestsState = {
    generationRequestIds?: Record<string, string>;
    currentTest?: CurrentTestSession | null;
    currentQuestionIndex?: number;
    answers?: TestAnswer[];
    testInProgress?: boolean;
    timeRemaining?: number;
    testStartTime?: string | null;
    questionStartTime?: string | null;
    evaluationRequestId?: string | null;
};

export type TestRequestState = {
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

export type SelectTestsTranslation = (
    key: string,
    values?: Record<string, any>
) => string;
