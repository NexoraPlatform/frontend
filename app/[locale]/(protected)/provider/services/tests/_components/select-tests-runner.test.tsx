import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SelectTestsRunner } from './select-tests-runner';

vi.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
}));

vi.mock('@/components/dashboard/provider-dashboard-shell', () => ({
    ProviderDashboardShell: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
}));

vi.mock('@/components/exams/ExamGuard', () => ({
    __esModule: true,
    default: ({
        editorLanguage,
        value,
    }: {
        editorLanguage?: string;
        value?: string;
    }) => (
        <div
            data-testid="exam-guard"
            data-language={editorLanguage ?? ''}
            data-value={value ?? ''}
        />
    ),
}));

describe('SelectTestsRunner', () => {
    beforeEach(() => {
        vi.stubGlobal(
            'ResizeObserver',
            class ResizeObserver {
                observe() {}
                unobserve() {}
                disconnect() {}
            }
        );
    });

    it('keeps the next action disabled until the current question has an answer', () => {
        const onNextQuestion = vi.fn();

        const { rerender } = render(
            <SelectTestsRunner
                answers={[]}
                currentQuestionIndex={0}
                currentTest={{
                    requestId: 'req-1',
                    serviceInfo: {
                        serviceId: 'svc-1',
                        serviceName: 'Node.js',
                        level: 'senior',
                        category: 'Backend',
                    },
                    test: {
                        id: 'test-1',
                        title: 'Node.js Test',
                        questions: [
                            {
                                id: 'question-1',
                                type: 'SINGLE_CHOICE',
                                question: 'Choose the right option',
                                points: 10,
                                options: ['A', 'B'],
                            },
                            {
                                id: 'question-2',
                                type: 'TEXT_INPUT',
                                question: 'Explain',
                                points: 10,
                            },
                        ],
                    },
                    userTestId: 'user-test-1',
                }}
                onAnswerChange={vi.fn()}
                onExamViolationFailed={vi.fn()}
                onNextQuestion={onNextQuestion}
                onPreviousQuestion={vi.fn()}
                onSubmitTest={vi.fn()}
                timeRemaining={600}
            />
        );

        expect(
            (screen.getByRole('button', { name: 'progress.next' }) as HTMLButtonElement)
                .disabled
        ).toBe(true);

        rerender(
            <SelectTestsRunner
                answers={[{ questionId: 'question-1', answer: 'A' }]}
                currentQuestionIndex={0}
                currentTest={{
                    requestId: 'req-1',
                    serviceInfo: {
                        serviceId: 'svc-1',
                        serviceName: 'Node.js',
                        level: 'senior',
                        category: 'Backend',
                    },
                    test: {
                        id: 'test-1',
                        title: 'Node.js Test',
                        questions: [
                            {
                                id: 'question-1',
                                type: 'SINGLE_CHOICE',
                                question: 'Choose the right option',
                                points: 10,
                                options: ['A', 'B'],
                            },
                            {
                                id: 'question-2',
                                type: 'TEXT_INPUT',
                                question: 'Explain',
                                points: 10,
                            },
                        ],
                    },
                    userTestId: 'user-test-1',
                }}
                onAnswerChange={vi.fn()}
                onExamViolationFailed={vi.fn()}
                onNextQuestion={onNextQuestion}
                onPreviousQuestion={vi.fn()}
                onSubmitTest={vi.fn()}
                timeRemaining={600}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'progress.next' }));

        expect(onNextQuestion).toHaveBeenCalledTimes(1);
    });

    it('renders the guarded code editor with a normalized language and submits the last question', () => {
        const onSubmitTest = vi.fn();

        render(
            <SelectTestsRunner
                answers={[{ questionId: 'question-2', answer: 'return true;' }]}
                currentQuestionIndex={0}
                currentTest={{
                    requestId: 'req-2',
                    serviceInfo: {
                        serviceId: 'svc-2',
                        serviceName: 'Next.js',
                        level: 'expert',
                        category: 'Frontend',
                        programming_language: 'NextJS',
                    },
                    test: {
                        id: 'test-2',
                        title: 'Frontend Test',
                        questions: [
                            {
                                id: 'question-2',
                                type: 'CODE_WRITING',
                                question: 'Implement a helper',
                                points: 20,
                                codeTemplate: 'function solve() {}',
                                testCases: [
                                    {
                                        input: '1',
                                        expectedOutput: '2',
                                    },
                                ],
                            },
                        ],
                    },
                    userTestId: 'user-test-2',
                }}
                onAnswerChange={vi.fn()}
                onExamViolationFailed={vi.fn()}
                onNextQuestion={vi.fn()}
                onPreviousQuestion={vi.fn()}
                onSubmitTest={onSubmitTest}
                timeRemaining={245}
            />
        );

        expect(screen.getByText('function solve() {}')).toBeTruthy();
        const guardedEditors = screen.getAllByTestId('exam-guard');
        const codeEditorGuard = guardedEditors.find(
            (element) => element.getAttribute('data-language') === 'javascript'
        );

        expect(codeEditorGuard).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: 'progress.finishTest' }));

        expect(onSubmitTest).toHaveBeenCalledTimes(1);
    });
});
