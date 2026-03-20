'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Eye, EyeOff, Trophy } from 'lucide-react';

type TestAnswer = {
    questionId: string;
    answer: string | string[];
};

type ExplanationQuestion = {
    questionId: string;
    score: number;
    comment: string;
    isCorrect: boolean;
    explanation?: string;
    correctAnswer?: string | string[];
};

type TestResultViewProps = {
    answers: TestAnswer[];
    currentTest: any;
    testResult: any;
    user: {
        email: string;
        firstName?: string | null;
        lastName?: string | null;
    };
};

const ExamInterviewCalendar = dynamic(
    () => import('@/components/exams/exam-interview-calendar'),
    {
        ssr: false,
        loading: () => (
            <div className="h-[600px] w-full animate-pulse rounded-xl bg-muted/60" />
        ),
    }
);

export default function TestResultView({
    answers,
    currentTest,
    testResult,
    user,
}: TestResultViewProps) {
    const router = useRouter();
    const t = useTranslations('tests.providerFlow');
    const [showExplanations, setShowExplanations] = useState(false);

    return (
        <Card
            className={`glass-card border-2 ${testResult.passed ? 'border-emerald-200/80 bg-emerald-50/70' : 'border-red-200/80 bg-red-50/70'}`}
        >
            <CardHeader className="text-center">
                <div
                    className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${testResult.passed ? 'bg-green-500' : 'bg-red-500'}`}
                >
                    {testResult.passed ? (
                        <Trophy className="h-10 w-10 text-white" />
                    ) : (
                        <AlertCircle className="h-10 w-10 text-white" />
                    )}
                </div>
                <CardTitle className="mb-2 text-3xl">
                    {testResult.passed ? t('result.passedTitle') : t('result.failedTitle')}
                </CardTitle>
                <CardDescription className="text-lg">
                    {testResult.passed
                        ? t('result.passedDescription')
                        : t('result.failedDescription')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-8 grid gap-6 xs:grid-cols-1 md:grid-cols-3">
                    <div className="text-center">
                        <div className={`mb-2 text-4xl font-bold ${testResult.passed ? 'text-green-600' : 'text-red-600'}`}>
                            {testResult.score}%
                        </div>
                        <div className="text-sm text-muted-foreground">{t('result.scoreLabel')}</div>
                    </div>
                    <div className="text-center">
                        <div className="mb-2 text-4xl font-bold text-blue-600">
                            {currentTest.test.passingScore}%
                        </div>
                        <div className="text-sm text-muted-foreground">{t('result.passingScoreLabel')}</div>
                    </div>
                    <div className="text-center">
                        <div className="mb-2 text-4xl font-bold text-purple-600">
                            {testResult.timeSpent || 0}
                        </div>
                        <div className="text-sm text-muted-foreground">{t('result.timeSpentLabel')}</div>
                    </div>
                </div>

                <div className="flex justify-center space-x-4">
                    <Button
                        onClick={() => setShowExplanations((prev) => !prev)}
                        variant="outline"
                    >
                        {showExplanations ? (
                            <>
                                <EyeOff className="mr-2 h-4 w-4" />
                                {t('result.hideExplanations')}
                            </>
                        ) : (
                            <>
                                <Eye className="mr-2 h-4 w-4" />
                                {t('result.showExplanations')}
                            </>
                        )}
                    </Button>
                    <Button onClick={() => router.push('/dashboard')}>
                        {t('result.backToDashboard')}
                    </Button>
                </div>

                {testResult.passed ? (
                    <div className="mt-8 border-t border-border/50 pt-8">
                        <h3 className="mb-4 text-center text-xl font-semibold">
                            {t('result.calendarTitle')}
                        </h3>
                        <p className="mb-6 text-center text-muted-foreground">
                            {t('result.calendarDescription')}
                        </p>
                        <div className="h-[600px] w-full overflow-hidden rounded-xl border border-border/50 bg-background/50">
                            <ExamInterviewCalendar
                                fullName={`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()}
                                email={user.email}
                                note={t('result.calendarNote', {
                                    title: currentTest.test.title,
                                })}
                                serviceId={currentTest.serviceInfo.serviceId}
                            />
                        </div>
                    </div>
                ) : null}

                {showExplanations ? (
                    <div className="mt-8 space-y-6">
                        <h3 className="text-xl font-semibold">{t('result.explanationsTitle')}</h3>
                        {testResult.explanations.map(
                            (question: ExplanationQuestion, index: number) => {
                                const userAnswer = answers.find(
                                    (answer) => answer.questionId === question.questionId
                                );

                                return (
                                    <Card
                                        key={question.questionId}
                                        className={`glass-card border ${question.isCorrect ? 'border-emerald-200/80' : 'border-red-200/80'}`}
                                    >
                                        <CardHeader>
                                            <div className="flex items-center space-x-2">
                                                <Badge
                                                    className={
                                                        question.isCorrect
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }
                                                >
                                                    {question.isCorrect
                                                        ? t('result.correct')
                                                        : t('result.incorrect')}
                                                </Badge>
                                                <span className="font-medium">
                                                    {t('result.questionLabel', {
                                                        index: index + 1,
                                                    })}
                                                </span>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="mb-4 space-y-2">
                                                <div>
                                                    <strong>{t('result.yourAnswer')}</strong>{' '}
                                                    {Array.isArray(userAnswer?.answer)
                                                        ? userAnswer?.answer.join(', ')
                                                        : userAnswer?.answer || t('result.noAnswer')}
                                                </div>
                                                <div>
                                                    <strong>{t('result.correctAnswer')}</strong>{' '}
                                                    {Array.isArray(question.correctAnswer)
                                                        ? question.correctAnswer.join(', ')
                                                        : question.correctAnswer || t('result.unspecified')}
                                                </div>
                                            </div>

                                            {question.explanation ? (
                                                <div className="rounded-lg bg-muted p-3">
                                                    <strong>{t('result.explanation')}</strong>{' '}
                                                    {question.explanation}
                                                </div>
                                            ) : null}
                                        </CardContent>
                                    </Card>
                                );
                            }
                        )}
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );
}
