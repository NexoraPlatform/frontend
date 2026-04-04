import { describe, expect, it, vi } from 'vitest';

import {
    createInitialServiceStates,
    normalizeEditorLanguage,
    normalizeEvaluationResult,
    normalizeIncomingTestData,
    normalizeTestRequestState,
} from './select-tests-page-helpers';

describe('select-tests-page helpers', () => {
    it('normalizes incoming test data and preserves programming language aliases', () => {
        expect(
            normalizeIncomingTestData({
                serviceId: 'svc-1',
                serviceName: 'Node.js',
                level: 'senior',
                category: 'Backend',
                programmingLanguage: 'typescript',
            })
        ).toEqual([
            expect.objectContaining({
                serviceId: 'svc-1',
                programming_language: 'typescript',
            }),
        ]);
    });

    it('creates initial service states with processing status when request ids already exist', () => {
        expect(
            createInitialServiceStates(
                [
                    {
                        serviceId: 'svc-1',
                        serviceName: 'Node.js',
                        level: 'senior',
                        category: 'Backend',
                    },
                ],
                {
                    'svc-1:senior': 'req-1',
                }
            )
        ).toEqual({
            'svc-1:senior': {
                error: null,
                nextAvailableAt: null,
                requestId: 'req-1',
                serviceInfo: {
                    category: 'Backend',
                    level: 'senior',
                    serviceId: 'svc-1',
                    serviceName: 'Node.js',
                },
                status: 'processing',
                test: null,
                userTestId: null,
            },
        });
    });

    it('normalizes request payloads and nested tests from the backend', () => {
        const normalized = normalizeTestRequestState({
            request_id: 101,
            status: 'completed',
            type: 'generation',
            result: {
                test: {
                    id: 9,
                    title: 'Algorithms',
                    description: 'Core algorithm questions',
                    time_limit: 45,
                    passing_score: 70,
                    total_questions: 1,
                    questions: [
                        {
                            id: 1,
                            type: 'MULTIPLE_CHOICE',
                            question: 'Choose',
                            points: 10,
                            options: '["a","b"]',
                            correct_answers: '["a"]',
                            meta: '{"difficulty":"hard"}',
                        },
                    ],
                },
            },
            user_test_id: 55,
            rest_messages: true,
        });

        expect(normalized.requestId).toBe('101');
        expect(normalized.status).toBe('COMPLETED');
        expect(normalized.userTestId).toBe('55');
        expect(normalized.restMessages).toBe(true);
        expect(normalized.result.test.questions).toEqual([
            expect.objectContaining({
                id: '1',
                options: ['a', 'b'],
                correctAnswers: ['a'],
                meta: { difficulty: 'hard' },
            }),
        ]);
    });

    it('normalizes evaluation result payloads with nested result wrappers', () => {
        const normalized = normalizeEvaluationResult({
            result: {
                result: {
                    score: '82',
                    passed: 1,
                    feedback: 'Solid work',
                    time_spent: '14',
                    test_result_id: 77,
                    explanations: [
                        {
                            question_id: 2,
                            score: 5,
                            comment: 'Well done',
                            is_correct: true,
                            correct_answer: ['b'],
                        },
                    ],
                },
            },
        });

        expect(normalized).toEqual(
            expect.objectContaining({
                score: 82,
                passed: true,
                feedback: 'Solid work',
                timeSpent: 14,
                test_result_id: '77',
                explanations: [
                    expect.objectContaining({
                        questionId: '2',
                        isCorrect: true,
                        correctAnswer: ['b'],
                    }),
                ],
            })
        );
    });

    it('normalizes editor languages used by the guarded code editor', () => {
        expect(normalizeEditorLanguage('NextJS')).toBe('javascript');
        expect(normalizeEditorLanguage('PY')).toBe('python');
        expect(normalizeEditorLanguage('')).toBe('javascript');
    });
});
