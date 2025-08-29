"use client";

import { useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    ArrowLeft,
    BookOpen,
    Target,
    Edit,
    Trash2,
    BarChart3,
    Loader2,
    AlertCircle,
    Code,
    Type,
    CheckSquare,
    Square,
    CheckCircle,
    XCircle,
    PlayCircle
} from 'lucide-react';
import { useTest } from '@/hooks/use-api';
import { apiClient } from '@/lib/api';
import { useAsyncTranslation } from '@/hooks/use-async-translation';
import { Locale } from '@/types/locale';

type QuestionType =
    | 'SINGLE_CHOICE'
    | 'MULTIPLE_CHOICE'
    | 'CODE_WRITING'
    | 'TEXT_INPUT';

interface TestCase {
    input: string;
    expectedOutput: string;
    description?: string;
}

interface Question {
    id: string;
    type: QuestionType;
    question: string;
    points: number;
    options?: string[] | string;
    correct_answers: string[] | string;
    codeTemplate?: string;
    expectedOutput?: string;
    testCases?: TestCase[];
    explanation?: string;
}


export default function TestDetailsClient({ id }: { id: string; }) {
    const router = useRouter();
    const pathname = usePathname();
    const locale = (pathname.split('/')[1] as Locale) || 'ro';
    const { data: test, loading, error, refetch } = useTest(id);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState('');

    const confirmDeleteText = useAsyncTranslation(locale, 'admin.tests.confirm_delete');
    const errorPrefix = useAsyncTranslation(locale, 'admin.tests.error_prefix');
    const detailTitle = useAsyncTranslation(locale, 'admin.tests.detail.test_details');
    const generalInfo = useAsyncTranslation(locale, 'admin.tests.detail.general_info');
    const serviceLabel = useAsyncTranslation(locale, 'admin.tests.detail.service_label');
    const categoryLabel = useAsyncTranslation(locale, 'admin.tests.detail.category_label');
    const levelLabel = useAsyncTranslation(locale, 'admin.tests.detail.level_label');
    const statusLabel = useAsyncTranslation(locale, 'admin.tests.detail.status_label');
    const createdLabel = useAsyncTranslation(locale, 'admin.tests.detail.created_label');
    const testConfig = useAsyncTranslation(locale, 'admin.tests.detail.test_config');
    const timeLimitLabel = useAsyncTranslation(locale, 'admin.tests.detail.time_limit_label');
    const passingScoreLabel = useAsyncTranslation(locale, 'admin.tests.detail.passing_score_label');
    const questionsLabel = useAsyncTranslation(locale, 'admin.tests.detail.questions_label');
    const totalPointsLabel = useAsyncTranslation(locale, 'admin.tests.detail.total_points_label');
    const descriptionLabel = useAsyncTranslation(locale, 'admin.tests.detail.description');
    const questionsSectionTemplate = useAsyncTranslation(locale, 'admin.tests.detail.questions_section');
    const questionLabelTemplate = useAsyncTranslation(locale, 'admin.tests.detail.question_label');
    const codeTemplateLabel = useAsyncTranslation(locale, 'admin.tests.detail.code_template');
    const expectedOutputLabel = useAsyncTranslation(locale, 'admin.tests.detail.expected_output');
    const testCasesLabel = useAsyncTranslation(locale, 'admin.tests.detail.test_cases');
    const inputLabel = useAsyncTranslation(locale, 'admin.tests.detail.input_label');
    const expectedOutputCaseLabel = useAsyncTranslation(locale, 'admin.tests.detail.expected_output_label');
    const explanationLabel = useAsyncTranslation(locale, 'admin.tests.detail.explanation');
    const editTestLabel = useAsyncTranslation(locale, 'admin.tests.detail.edit_test');
    const viewStatisticsLabel = useAsyncTranslation(locale, 'admin.tests.detail.view_statistics');
    const previewLabel = useAsyncTranslation(locale, 'admin.tests.detail.preview');
    const deleteTestLabel = useAsyncTranslation(locale, 'admin.tests.detail.delete_test');
    const deactivateLabel = useAsyncTranslation(locale, 'admin.tests.detail.deactivate');
    const activateLabel = useAsyncTranslation(locale, 'admin.tests.detail.activate');
    const questionTypeSingle = useAsyncTranslation(locale, 'admin.tests.question_types.SINGLE_CHOICE');
    const questionTypeMultiple = useAsyncTranslation(locale, 'admin.tests.question_types.MULTIPLE_CHOICE');
    const questionTypeCode = useAsyncTranslation(locale, 'admin.tests.question_types.CODE_WRITING');
    const questionTypeText = useAsyncTranslation(locale, 'admin.tests.question_types.TEXT_INPUT');
    const pointsTemplate = useAsyncTranslation(locale, 'admin.tests.points_template');
    const minuteSuffix = useAsyncTranslation(locale, 'admin.tests.minute_suffix');
    const correctAnswerLabel = useAsyncTranslation(locale, 'admin.tests.statistics.correct_answer');
    const statusActive = useAsyncTranslation(locale, 'admin.tests.statuses.ACTIVE');
    const statusInactive = useAsyncTranslation(locale, 'admin.tests.statuses.INACTIVE');
    const statusDraft = useAsyncTranslation(locale, 'admin.tests.statuses.DRAFT');
    const levelJunior = useAsyncTranslation(locale, 'admin.tests.levels.JUNIOR');
    const levelMediu = useAsyncTranslation(locale, 'admin.tests.levels.MEDIU');
    const levelSenior = useAsyncTranslation(locale, 'admin.tests.levels.SENIOR');
    const levelExpert = useAsyncTranslation(locale, 'admin.tests.levels.EXPERT');

    const handleAction = async (action: string) => {
        setActionLoading(true);
        setActionError('');

        try {
            if (action === 'delete') {
                if (confirm(confirmDeleteText)) {
                    await apiClient.deleteTest(id);
                    router.push('/admin/tests');
                }
            } else if (action === 'activate') {
                await apiClient.updateTestStatus(id, 'ACTIVE');
                refetch();
            } else if (action === 'deactivate') {
                await apiClient.updateTestStatus(id, 'INACTIVE');
                refetch();
            }
        } catch (error: any) {
            setActionError(error.message || errorPrefix);
        } finally {
            setActionLoading(false);
        }
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

    const questionTypeLabelMap = useMemo(() => ({
        SINGLE_CHOICE: questionTypeSingle,
        MULTIPLE_CHOICE: questionTypeMultiple,
        CODE_WRITING: questionTypeCode,
        TEXT_INPUT: questionTypeText,
    }), [questionTypeSingle, questionTypeMultiple, questionTypeCode, questionTypeText]);

    const getQuestionTypeLabel = (type: string) => {
        return questionTypeLabelMap[type as keyof typeof questionTypeLabelMap] || type;
    };

    const statusBadgeMap = useMemo(() => ({
        ACTIVE: <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />{statusActive}</Badge>,
        INACTIVE: <Badge className="bg-gray-100 text-gray-800"><XCircle className="w-3 h-3 mr-1" />{statusInactive}</Badge>,
        DRAFT: <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />{statusDraft}</Badge>,
    }), [statusActive, statusInactive, statusDraft]);

    const getStatusBadge = (status: string) => {
        return statusBadgeMap[status as keyof typeof statusBadgeMap] || <Badge variant="secondary">{status}</Badge>;
    };

    type Level = 'JUNIOR' | 'MEDIU' | 'SENIOR' | 'EXPERT';

    const levelBadgeMap = useMemo(() => ({
        JUNIOR: { label: levelJunior, color: 'bg-green-100 text-green-800' },
        MEDIU: { label: levelMediu, color: 'bg-blue-100 text-blue-800' },
        SENIOR: { label: levelSenior, color: 'bg-purple-100 text-purple-800' },
        EXPERT: { label: levelExpert, color: 'bg-orange-100 text-orange-800' },
    }), [levelJunior, levelMediu, levelSenior, levelExpert]);

    const getLevelBadge = (level: Level) => {
        const badge = levelBadgeMap[level];
        return <Badge className={badge?.color || 'bg-gray-100 text-gray-800'}>{badge?.label || level}</Badge>;
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }
    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                    <Link href="/admin/tests">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">{test.title}</h1>
                        <p className="text-muted-foreground">
                            {test.service?.title} - {test.service?.category?.name?.[locale]}
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    {getLevelBadge(test.level)}
                    {getStatusBadge(test.status)}
                </div>
            </div>

            {actionError && (
                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{actionError}</AlertDescription>
                </Alert>
            )}

            {/* Test Overview */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <BookOpen className="w-5 h-5" />
                        <span>{detailTitle}</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid xs:grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-semibold text-lg mb-4">{generalInfo}</h3>
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="text-muted-foreground">{serviceLabel}</div>
                                    <div className="font-medium">{test.service?.title}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="text-muted-foreground">{categoryLabel}</div>
                                    <div className="font-medium">{test.service?.category?.name?.[locale]}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="text-muted-foreground">{levelLabel}</div>
                                    <div>{getLevelBadge(test.level)}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="text-muted-foreground">{statusLabel}</div>
                                    <div>{getStatusBadge(test.status)}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="text-muted-foreground">{createdLabel}</div>
                                    <div>{new Date(test.created_at).toLocaleDateString(locale)}</div>
                                </div>
                            </div>
                        </div>

        <div>
            <h3 className="font-semibold text-lg mb-4">{testConfig}</h3>
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    <div className="text-muted-foreground">{timeLimitLabel}</div>
                    <div className="font-medium">{test.timeLimit} {minuteSuffix}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="text-muted-foreground">{passingScoreLabel}</div>
                    <div className="font-medium">{test.passingScore}%</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="text-muted-foreground">{questionsLabel}</div>
                    <div className="font-medium">{test.totalQuestions}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="text-muted-foreground">{totalPointsLabel}</div>
                    <div className="font-medium">{pointsTemplate.replace('{count}', String(test.questions.reduce((sum: number, q: { points: number }) => sum + q.points, 0)))} </div>
                </div>
            </div>
        </div>
    </div>

    <div className="mt-6 pt-6 border-t">
        <h3 className="font-semibold text-lg mb-2">{descriptionLabel}</h3>
        <p className="text-muted-foreground">{test.description}</p>
    </div>
                </CardContent>
            </Card>

            {/* Questions */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Target className="w-5 h-5" />
                        <span>{questionsSectionTemplate.replace('{count}', String(test.questions.length))}</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {test.questions.map((question: Question, index: number) => {
                            const IconComponent = getQuestionTypeIcon(question.type);

                            return (
                                <div key={question.id} className="border rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center space-x-2">
                                            <IconComponent className="w-5 h-5 text-primary" />
                                            <Badge variant="outline">
                                                {getQuestionTypeLabel(question.type)}
                                            </Badge>
                                            <Badge variant="secondary">
                                                {pointsTemplate.replace('{count}', String(question.points))}
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {questionLabelTemplate.replace('{number}', String(index + 1))}
                                        </div>
                                    </div>

                                    <h4 className="font-medium mb-4">{question.question}</h4>

                                    {/* Single/Multiple Choice Options */}
                                    {(question.type === 'SINGLE_CHOICE' || question.type === 'MULTIPLE_CHOICE') && question.options && (() => {
                                        // Normalizează întotdeauna la array
                                        let opts: string[] = [];
                                        if (typeof question.options === 'string') {
                                            try {
                                                opts = JSON.parse(question.options);
                                            } catch {
                                                opts = [];
                                            }
                                        } else {
                                            opts = question.options;
                                        }

                                        return (
                                            <div className="space-y-1 mb-4">
                                                {opts.map((option, optIndex) => (
                                                    <div key={optIndex} className="flex items-center space-x-2 text-sm">
                    <span
                        className={
                            question?.correct_answers?.includes(option)
                                ? 'text-green-600 font-medium'
                                : 'text-muted-foreground'
                        }
                    >
                        {String.fromCharCode(65 + optIndex)}. {option}
                    </span>
                                                        {question?.correct_answers?.includes(option) && (
                                                            <Badge className="bg-green-100 text-green-800 text-xs">Corect</Badge>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}

                                    {/* Code Writing */}
                                    {question.type === 'CODE_WRITING' && (
                                        <div className="space-y-3 mb-4">
                                            {question.codeTemplate && (
                                                <div>
                                                    <div className="text-sm font-medium mb-1">{codeTemplateLabel}</div>
                                                    <pre className="bg-muted p-3 rounded-lg text-sm font-mono overflow-x-auto">
                            {question.codeTemplate}
                          </pre>
                                                </div>
                                            )}

                                            {question.expectedOutput && (
                                                <div>
                                                    <div className="text-sm font-medium mb-1">{expectedOutputLabel}</div>
                                                    <div className="bg-muted p-3 rounded-lg text-sm">
                                                        {question.expectedOutput}
                                                    </div>
                                                </div>
                                            )}

                                            {question.testCases && question.testCases.length > 0 && (
                                                <div>
                                                    <div className="text-sm font-medium mb-1">{testCasesLabel}</div>
                                                    <div className="space-y-2">
                                                        {question.testCases.map((testCase, tcIndex) => (
                                                            <div key={tcIndex} className="bg-muted p-3 rounded-lg text-sm">
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <strong>{inputLabel}</strong> {testCase.input}
                                                                    </div>
                                                                    <div>
                                                                        <strong>{expectedOutputCaseLabel}</strong> {testCase.expectedOutput}
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
                                        </div>
                                    )}

                                    {/* Text Input */}
                                    {question.type === 'TEXT_INPUT' && (
                                        <div className="mb-4">
                                            <div className="text-sm font-medium mb-1">{correctAnswerLabel}</div>
                                            <div className="bg-muted p-3 rounded-lg text-sm">
                                                {JSON.parse(question.correct_answers as string)}
                                            </div>
                                        </div>
                                    )}

                                    {/* Explanation */}
                                    {question.explanation && (
                                        <div>
                                            <div className="text-sm font-medium mb-1">{explanationLabel}</div>
                                            <div className="bg-muted p-3 rounded-lg text-sm">
                                                {question.explanation}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-wrap gap-4">
                <Link href={`/admin/tests/${id}/edit`}>
                    <Button>
                        <Edit className="w-4 h-4 mr-2" />
                        {editTestLabel}
                    </Button>
                </Link>

                <Link href={`/admin/tests/${id}/statistics`}>
                    <Button variant="outline">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        {viewStatisticsLabel}
                    </Button>
                </Link>

                {test.status === 'ACTIVE' ? (
                    <Button
                        variant="outline"
                        onClick={() => handleAction('deactivate')}
                        disabled={actionLoading}
                    >
                        <XCircle className="w-4 h-4 mr-2" />
                        {deactivateLabel}
                    </Button>
                ) : (
                    <Button
                        variant="outline"
                        onClick={() => handleAction('activate')}
                        disabled={actionLoading}
                    >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {activateLabel}
                    </Button>
                )}

                <Button
                    variant="outline"
                    onClick={() => window.open(`/tests/preview/${id}`, '_blank')}
                >
                    <PlayCircle className="w-4 h-4 mr-2" />
                    {previewLabel}
                </Button>

                <Button
                    variant="destructive"
                    onClick={() => handleAction('delete')}
                    disabled={actionLoading}
                >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {deleteTestLabel}
                </Button>
            </div>
        </div>
    );
}
