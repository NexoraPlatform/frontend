'use client';

import type { ReactNode } from 'react';

import { useTranslations } from 'next-intl';
import {
    ArrowLeft,
    BookOpen,
    CheckSquare,
    Code,
    Send,
    Square,
    Timer,
    Type,
} from 'lucide-react';

import { ProviderDashboardShell } from '@/components/dashboard/provider-dashboard-shell';
import ExamGuard from '@/components/exams/ExamGuard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import {
    formatTime,
    normalizeEditorLanguage,
} from '../_lib/select-tests-page-helpers';
import type {
    CurrentTestSession,
    Question,
    TestAnswer,
} from '../_lib/select-tests-page-types';

type SelectTestsRunnerProps = {
    answers: TestAnswer[];
    currentQuestionIndex: number;
    currentTest: CurrentTestSession;
    onAnswerChange: (questionId: string, answer: string | string[]) => void;
    onExamViolationFailed: () => void;
    onNextQuestion: () => void | Promise<void>;
    onPreviousQuestion: () => void;
    onSubmitTest: () => void | Promise<void>;
    timeRemaining: number;
};

const getQuestionTypeIcon = (type: string) => {
    switch (type) {
        case 'SINGLE_CHOICE':
            return Square;
        case 'MULTIPLE_CHOICE':
            return CheckSquare;
        case 'CODE_WRITING':
            return Code;
        case 'TEXT_INPUT':
            return Type;
        default:
            return BookOpen;
    }
};

function SelectTestsQuestionCard({
    answers,
    codeInput,
    currentQuestion,
    currentQuestionIndex,
    currentTest,
    onAnswerChange,
}: {
    answers: TestAnswer[];
    codeInput?: ReactNode;
    currentQuestion: Question;
    currentQuestionIndex: number;
    currentTest: CurrentTestSession;
    onAnswerChange: (questionId: string, answer: string | string[]) => void;
}) {
    const t = useTranslations('tests.providerFlow');
    const currentAnswer = answers.find((answer) => answer.questionId === currentQuestion.id)?.answer;
    const Icon = getQuestionTypeIcon(currentQuestion.type);

    return (
        <Card className="glass-card border-emerald-100/60">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Icon className="h-5 w-5 text-primary" />
                        <Badge variant="outline">
                            {(() => {
                                switch (currentQuestion.type) {
                                    case 'SINGLE_CHOICE':
                                        return t('questionTypes.singleChoice');
                                    case 'MULTIPLE_CHOICE':
                                        return t('questionTypes.multipleChoice');
                                    case 'CODE_WRITING':
                                        return t('questionTypes.codeWriting');
                                    case 'TEXT_INPUT':
                                        return t('questionTypes.textInput');
                                    default:
                                        return currentQuestion.type;
                                }
                            })()}
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-800">
                            {t('question.points', { count: currentQuestion.points })}
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
                    <h3 className="mb-4 text-lg font-semibold">
                        {currentQuestion.question}
                    </h3>
                </div>

                {currentQuestion.type === 'SINGLE_CHOICE' && currentQuestion.options ? (
                    <RadioGroup
                        value={(currentAnswer as string) || ''}
                        onValueChange={(value) => onAnswerChange(currentQuestion.id, value)}
                    >
                        {currentQuestion.options.map((option: string, index: number) => (
                            <div key={index} className="flex items-center space-x-2">
                                <RadioGroupItem
                                    value={option}
                                    id={`${currentQuestion.id}-${index}`}
                                />
                                <Label
                                    htmlFor={`${currentQuestion.id}-${index}`}
                                    className="cursor-pointer"
                                >
                                    {option}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                ) : null}

                {currentQuestion.type === 'MULTIPLE_CHOICE' && currentQuestion.options ? (
                    <div className="space-y-3">
                        {currentQuestion.options.map((option: string, index: number) => (
                            <div key={index} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`${currentQuestion.id}-${index}`}
                                    checked={
                                        Array.isArray(currentAnswer) &&
                                        currentAnswer.includes(option)
                                    }
                                    onCheckedChange={(checked) => {
                                        const currentAnswers = Array.isArray(currentAnswer)
                                            ? currentAnswer
                                            : [];
                                        const newAnswers = checked
                                            ? [...currentAnswers, option]
                                            : currentAnswers.filter(
                                                  (answer) => answer !== option
                                              );
                                        onAnswerChange(currentQuestion.id, newAnswers);
                                    }}
                                />
                                <Label
                                    htmlFor={`${currentQuestion.id}-${index}`}
                                    className="cursor-pointer"
                                >
                                    {option}
                                </Label>
                            </div>
                        ))}
                    </div>
                ) : null}

                {currentQuestion.type === 'CODE_WRITING' ? (
                    <div className="space-y-4">
                        {currentQuestion.codeTemplate ? (
                            <div>
                                <Label className="mb-2 block text-sm font-medium">
                                    {t('question.template')}
                                </Label>
                                <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-sm font-mono">
                                    {currentQuestion.codeTemplate}
                                </pre>
                            </div>
                        ) : null}

                        {currentQuestion.testCases?.length ? (
                            <div>
                                <Label className="mb-2 block text-sm font-medium">
                                    {t('question.testCases')}
                                </Label>
                                <div className="space-y-2">
                                    {currentQuestion.testCases.map((testCase, index) => (
                                        <div
                                            key={index}
                                            className="rounded-lg bg-muted p-3 text-sm"
                                        >
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <strong>{t('question.input')}</strong>{' '}
                                                    {testCase.input}
                                                </div>
                                                <div>
                                                    <strong>
                                                        {t('question.expectedOutput')}
                                                    </strong>{' '}
                                                    {testCase.expectedOutput}
                                                </div>
                                            </div>
                                            {testCase.description ? (
                                                <div className="mt-2 text-muted-foreground">
                                                    {testCase.description}
                                                </div>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        <div>
                            <Label className="mb-2 block text-sm font-medium">
                                {t('question.writeCode')}
                            </Label>
                            {codeInput}
                        </div>
                    </div>
                ) : null}

                {currentQuestion.type === 'TEXT_INPUT' ? (
                    <div>
                        <Label
                            htmlFor={`text-${currentQuestion.id}`}
                            className="mb-2 block text-sm font-medium"
                        >
                            {t('question.yourAnswer')}
                        </Label>
                        <Input
                            id={`text-${currentQuestion.id}`}
                            value={(currentAnswer as string) || ''}
                            onChange={(event) =>
                                onAnswerChange(currentQuestion.id, event.target.value)
                            }
                            placeholder={t('question.writeAnswerPlaceholder')}
                        />
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );
}

export function SelectTestsRunner({
    answers,
    currentQuestionIndex,
    currentTest,
    onAnswerChange,
    onExamViolationFailed,
    onNextQuestion,
    onPreviousQuestion,
    onSubmitTest,
    timeRemaining,
}: SelectTestsRunnerProps) {
    const t = useTranslations('tests.providerFlow');
    const currentQuestion = currentTest.test.questions[currentQuestionIndex] as Question;
    const progress =
        ((currentQuestionIndex + 1) / currentTest.test.questions.length) * 100;
    const hasAnswer = answers.some((answer) => answer.questionId === currentQuestion.id);
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
                onChange={(value) => onAnswerChange(currentQuestion.id, value)}
                onFailed={onExamViolationFailed}
            />
        ) : null;

    return (
        <ProviderDashboardShell
            title={currentTest.test.title}
            description={currentTest.serviceInfo.serviceName}
            activeMenu="services"
        >
            <div className="space-y-6">
                <div className="mb-6">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">{currentTest.test.title}</h1>
                            <p className="text-muted-foreground">
                                {currentTest.serviceInfo.serviceName}
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div
                                className={`flex items-center space-x-2 rounded-lg px-3 py-2 ${
                                    timeRemaining < 300
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-emerald-100 text-emerald-800'
                                }`}
                            >
                                <Timer className="h-4 w-4" />
                                <span className="font-mono font-bold">
                                    {formatTime(timeRemaining)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>{t('progress.label')}</span>
                            <span>
                                {t('progress.counter', {
                                    current: currentQuestionIndex + 1,
                                    total: currentTest.test.questions.length,
                                })}
                            </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>
                </div>

                {currentQuestion.type !== 'CODE_WRITING' ? (
                    <ExamGuard
                        testId={currentTest.userTestId ?? currentTest.test.id}
                        initialStrikes={0}
                        onFailed={onExamViolationFailed}
                    />
                ) : null}

                <SelectTestsQuestionCard
                    answers={answers}
                    codeInput={codeEditor}
                    currentQuestion={currentQuestion}
                    currentQuestionIndex={currentQuestionIndex}
                    currentTest={currentTest}
                    onAnswerChange={onAnswerChange}
                />

                <div className="mt-6 flex justify-between">
                    <Button
                        variant="outline"
                        onClick={onPreviousQuestion}
                        disabled={currentQuestionIndex === 0}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {t('progress.previous')}
                    </Button>

                    <div className="flex space-x-3">
                        {currentQuestionIndex === currentTest.test.questions.length - 1 ? (
                            <Button
                                onClick={onSubmitTest}
                                className="btn-primary px-8"
                                disabled={!hasAnswer}
                            >
                                <Send className="mr-2 h-4 w-4" />
                                {t('progress.finishTest')}
                            </Button>
                        ) : (
                            <Button onClick={onNextQuestion} disabled={!hasAnswer}>
                                {t('progress.next')}
                                <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </ProviderDashboardShell>
    );
}
