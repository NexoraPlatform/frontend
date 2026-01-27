"use client";

import { useState, useMemo } from 'react';
import { useRouter } from '@/lib/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/lib/navigation';
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
import { TrustoraThemeStyles } from '@/components/trustora/theme-styles';

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
    const locale = useLocale();
    const t = useTranslations();
    const { data: test, loading, error, refetch } = useTest(id);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState('');

    const confirmDeleteText = t('admin.tests.confirm_delete');
    const errorPrefix = t('admin.tests.error_prefix');
    const detailTitle = t('admin.tests.detail.test_details');
    const generalInfo = t('admin.tests.detail.general_info');
    const serviceLabel = t('admin.tests.detail.service_label');
    const categoryLabel = t('admin.tests.detail.category_label');
    const levelLabel = t('admin.tests.detail.level_label');
    const statusLabel = t('admin.tests.detail.status_label');
    const createdLabel = t('admin.tests.detail.created_label');
    const testConfig = t('admin.tests.detail.test_config');
    const timeLimitLabel = t('admin.tests.detail.time_limit_label');
    const passingScoreLabel = t('admin.tests.detail.passing_score_label');
    const questionsLabel = t('admin.tests.detail.questions_label');
    const totalPointsLabel = t('admin.tests.detail.total_points_label');
    const descriptionLabel = t('admin.tests.detail.description');
    const codeTemplateLabel = t('admin.tests.detail.code_template');
    const expectedOutputLabel = t('admin.tests.detail.expected_output');
    const testCasesLabel = t('admin.tests.detail.test_cases');
    const inputLabel = t('admin.tests.detail.input_label');
    const expectedOutputCaseLabel = t('admin.tests.detail.expected_output_label');
    const explanationLabel = t('admin.tests.detail.explanation');
    const editTestLabel = t('admin.tests.detail.edit_test');
    const viewStatisticsLabel = t('admin.tests.detail.view_statistics');
    const previewLabel = t('admin.tests.detail.preview');
    const deleteTestLabel = t('admin.tests.detail.delete_test');
    const deactivateLabel = t('admin.tests.detail.deactivate');
    const activateLabel = t('admin.tests.detail.activate');
    const questionTypeSingle = t('admin.tests.question_types.SINGLE_CHOICE');
    const questionTypeMultiple = t('admin.tests.question_types.MULTIPLE_CHOICE');
    const questionTypeCode = t('admin.tests.question_types.CODE_WRITING');
    const questionTypeText = t('admin.tests.question_types.TEXT_INPUT');
    const minuteSuffix = t('admin.tests.minute_suffix');
    const correctAnswerLabel = t('admin.tests.statistics.correct_answer');
    const statusActive = t('admin.tests.statuses.ACTIVE');
    const statusInactive = t('admin.tests.statuses.INACTIVE');
    const statusDraft = t('admin.tests.statuses.DRAFT');
    const levelJunior = t('admin.tests.levels.JUNIOR');
    const levelMediu = t('admin.tests.levels.MEDIU');
    const levelSenior = t('admin.tests.levels.SENIOR');
    const levelExpert = t('admin.tests.levels.EXPERT');

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
        ACTIVE: (
            <Badge className="border border-emerald-200/60 bg-emerald-100 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                {statusActive}
            </Badge>
        ),
        INACTIVE: (
            <Badge className="border border-slate-200/70 bg-slate-100 text-slate-700 dark:border-slate-600/50 dark:bg-slate-800/70 dark:text-slate-200">
                <XCircle className="w-3 h-3 mr-1" />
                {statusInactive}
            </Badge>
        ),
        DRAFT: (
            <Badge className="border border-amber-200/60 bg-amber-100 text-amber-800 dark:border-amber-400/40 dark:bg-amber-500/20 dark:text-amber-200">
                <AlertCircle className="w-3 h-3 mr-1" />
                {statusDraft}
            </Badge>
        ),
    }), [statusActive, statusInactive, statusDraft]);

    const getStatusBadge = (status: string) => {
        return statusBadgeMap[status as keyof typeof statusBadgeMap] || <Badge variant="secondary">{status}</Badge>;
    };

    type Level = 'JUNIOR' | 'MEDIU' | 'SENIOR' | 'EXPERT';

    const levelBadgeMap = useMemo(() => ({
        JUNIOR: {
            label: levelJunior,
            color:
                'border border-emerald-200/60 bg-emerald-100 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-200',
        },
        MEDIU: {
            label: levelMediu,
            color:
                'border border-blue-200/60 bg-blue-100 text-blue-800 dark:border-blue-400/40 dark:bg-blue-500/20 dark:text-blue-200',
        },
        SENIOR: {
            label: levelSenior,
            color:
                'border border-purple-200/60 bg-purple-100 text-purple-800 dark:border-purple-400/40 dark:bg-purple-500/20 dark:text-purple-200',
        },
        EXPERT: {
            label: levelExpert,
            color:
                'border border-orange-200/60 bg-orange-100 text-orange-800 dark:border-orange-400/40 dark:bg-orange-500/20 dark:text-orange-200',
        },
    }), [levelJunior, levelMediu, levelSenior, levelExpert]);

    const getLevelBadge = (level: Level) => {
        const badge = levelBadgeMap[level];
        return <Badge className={badge?.color || 'bg-gray-100 text-gray-800'}>{badge?.label || level}</Badge>;
    };

    if (loading) {
        return (
            <>
                <TrustoraThemeStyles />
                <div className="min-h-screen bg-[var(--bg-light)] dark:bg-[#070C14]">
                    <div className="container mx-auto px-4 py-10">
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <TrustoraThemeStyles />
                <div className="min-h-screen bg-[var(--bg-light)] dark:bg-[#070C14]">
                    <div className="container mx-auto px-4 py-10">
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    </div>
                </div>
            </>
        );
    }
    return (
        <>
            <TrustoraThemeStyles />
            <div className="min-h-screen bg-[var(--bg-light)] dark:bg-[#070C14]">
                <div className="container mx-auto px-4 py-10">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center space-x-4">
                            <Link href="/admin/tests">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="border-slate-200/70 bg-white/70 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/60"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">{test.title}</h1>
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
                    <Card className="mb-8 glass-card shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white">
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
                                            <div className="font-medium">{t('admin.tests.points_template', { count: test.questions.reduce((sum: number, q: { points: number }) => sum + q.points, 0) })} </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-slate-200/70 dark:border-slate-700/60">
                                <h3 className="font-semibold text-lg mb-2">{descriptionLabel}</h3>
                                <p className="text-muted-foreground">{test.description}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Questions */}
                    <Card className="mb-8 glass-card shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white">
                                <Target className="w-5 h-5" />
                                <span>{t('admin.tests.detail.questions_section', { count: test.questions.length })}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {test.questions.map((question: Question, index: number) => {
                                    const IconComponent = getQuestionTypeIcon(question.type);

                                    return (
                                        <div key={question.id} className="border rounded-lg p-4 bg-white/70 dark:bg-slate-900/40">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center space-x-2">
                                                    <IconComponent className="w-5 h-5 text-primary" />
                                                    <Badge variant="outline">
                                                        {getQuestionTypeLabel(question.type)}
                                                    </Badge>
                                                    <Badge variant="secondary">
                                                        {t('admin.tests.points_template', { count: question.points })}
                                                    </Badge>
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {t('admin.tests.detail.question_label', { number: (index + 1) })}
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
                                                                    <Badge className="border border-emerald-200/60 bg-emerald-100 text-emerald-800 text-xs dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-200">
                                                                        Corect
                                                                    </Badge>
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
                            <Button className="btn-primary">
                                <Edit className="w-4 h-4 mr-2" />
                                {editTestLabel}
                            </Button>
                        </Link>

                        <Link href={`/admin/tests/${id}/statistics`}>
                            <Button variant="outline" className="border-slate-200/70 bg-white/70 dark:border-slate-700/60 dark:bg-slate-900/60">
                                <BarChart3 className="w-4 h-4 mr-2" />
                                {viewStatisticsLabel}
                            </Button>
                        </Link>

                        {test.status === 'ACTIVE' ? (
                            <Button
                                variant="outline"
                                className="border-slate-200/70 bg-white/70 dark:border-slate-700/60 dark:bg-slate-900/60"
                                onClick={() => handleAction('deactivate')}
                                disabled={actionLoading}
                            >
                                <XCircle className="w-4 h-4 mr-2" />
                                {deactivateLabel}
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                className="border-slate-200/70 bg-white/70 dark:border-slate-700/60 dark:bg-slate-900/60"
                                onClick={() => handleAction('activate')}
                                disabled={actionLoading}
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                {activateLabel}
                            </Button>
                        )}

                        <Button
                            variant="outline"
                            className="border-slate-200/70 bg-white/70 dark:border-slate-700/60 dark:bg-slate-900/60"
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
            </div>
        </>
    );
}
