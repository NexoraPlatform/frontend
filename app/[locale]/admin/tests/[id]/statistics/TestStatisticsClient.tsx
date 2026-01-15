"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    ArrowLeft,
    Clock,
    Target,
    Users,
    CheckCircle,
    Loader2,
    AlertCircle,
    BookOpen,
    Code,
    Type,
    CheckSquare,
    Square
} from 'lucide-react';
import { useTestStatistics } from '@/hooks/use-api';
import { useLocale } from '@/hooks/use-locale';
import { useAsyncTranslation } from '@/hooks/use-async-translation';
import {useMemo} from "react";

interface QuestionStat {
    id: string;
    answer: string;
    points_earned: number;
    is_correct: boolean;
    skill_test_question_id: number;
    test_result_id: number;
}

export default function TestStatisticsPage({ id }: {  id: string; }) {
    const { data: stats, loading: statsLoading, error: statsError } = useTestStatistics(id);
    const locale = useLocale();
    const subtitle = useAsyncTranslation(locale, 'admin.tests.statistics.subtitle');
    const titleSuffix = useAsyncTranslation(locale, 'admin.tests.statistics.title_suffix');
    const userLabel = useAsyncTranslation(locale, 'admin.tests.statistics.user_label');
    const passedLabel = useAsyncTranslation(locale, 'admin.tests.statistics.passed_label');
    const passedYes = useAsyncTranslation(locale, 'admin.tests.statistics.passed_yes');
    const passedNo = useAsyncTranslation(locale, 'admin.tests.statistics.passed_no');
    const scoreLabel = useAsyncTranslation(locale, 'admin.tests.statistics.score_label');
    const timeSpentLabel = useAsyncTranslation(locale, 'admin.tests.statistics.time_spent_label');
    const questionStatsTitle = useAsyncTranslation(locale, 'admin.tests.statistics.question_stats_title');
    const questionStatsDescription = useAsyncTranslation(locale, 'admin.tests.statistics.question_stats_description');
    const questionLabelTemplate = useAsyncTranslation(locale, 'admin.tests.statistics.question_label');
    const correctAnswerLabel = useAsyncTranslation(locale, 'admin.tests.statistics.correct_answer');
    const userAnswerLabel = useAsyncTranslation(locale, 'admin.tests.statistics.user_answer');
    const errorLoading = useAsyncTranslation(locale, 'admin.tests.statistics.error_loading');
    const answerCorrect = useAsyncTranslation(locale, 'admin.tests.statistics.answer_correct');
    const answerIncorrect = useAsyncTranslation(locale, 'admin.tests.statistics.answer_incorrect');
    const questionTypeSingle = useAsyncTranslation(locale, 'admin.tests.question_types.SINGLE_CHOICE');
    const questionTypeMultiple = useAsyncTranslation(locale, 'admin.tests.question_types.MULTIPLE_CHOICE');
    const questionTypeCode = useAsyncTranslation(locale, 'admin.tests.question_types.CODE_WRITING');
    const questionTypeText = useAsyncTranslation(locale, 'admin.tests.question_types.TEXT_INPUT');
    const pointsTemplate = useAsyncTranslation(locale, 'admin.tests.points_template');
    const levelJunior = useAsyncTranslation(locale, 'admin.tests.levels.JUNIOR');
    const levelMediu = useAsyncTranslation(locale, 'admin.tests.levels.MEDIU');
    const levelSenior = useAsyncTranslation(locale, 'admin.tests.levels.SENIOR');
    const levelExpert = useAsyncTranslation(locale, 'admin.tests.levels.EXPERT');

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

    if (statsLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            </div>
        );
    }

    if (statsError) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {statsError || errorLoading}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    function formatTime(minutes: number): string {
        if (minutes < 60) {
            return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
        }

        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;

        if (mins === 0) {
            return `${hours} hour${hours !== 1 ? 's' : ''}`;
        }

        return `${hours} hour${hours !== 1 ? 's' : ''} ${mins} minute${mins !== 1 ? 's' : ''}`;
    }
    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center space-x-4 mb-8">
                <Link href={`/${locale}/admin/tests`}>
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold">{stats.title} - {stats.test_results.user.firstName} {stats.test_results.user.lastName} - {titleSuffix}</h1>
                    <p className="text-muted-foreground">
                        {subtitle}
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    {getLevelBadge(stats.level)}
                    <Badge variant="outline">
                        {stats.service?.title}
                    </Badge>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid xs:grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                            <div className="text-3xl font-bold">{stats.test_results.user.firstName} {stats.test_results.user.lastName}</div>
                            <p className="text-sm text-muted-foreground">{userLabel}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <CheckCircle className={`w-8 h-8 ${stats.test_results.passed === 'YES' ? 'text-green-500' : 'text-red-500'} mx-auto mb-2`} />
                            <div className="text-3xl font-bold">{stats.test_results.passed === 'YES' ? passedYes : passedNo}</div>
                            <p className="text-sm text-muted-foreground">{passedLabel}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <Target className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                            <div className="text-3xl font-bold">{Number(stats.test_results.score)}%</div>
                            <p className="text-sm text-muted-foreground">{scoreLabel}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <Clock className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                            <div className="text-3xl font-bold">{formatTime(stats.test_results.timeSpent)}</div>
                            <p className="text-sm text-muted-foreground">{timeSpentLabel}</p>
                        </div>
                    </CardContent>
                </Card>

                {/*<Card>*/}
                {/*    <CardContent className="pt-6">*/}
                {/*        <div className="text-center">*/}
                {/*            <Award className="w-8 h-8 text-yellow-500 mx-auto mb-2" />*/}
                {/*            <div className="text-3xl font-bold">{stats.passRate}%</div>*/}
                {/*            <p className="text-sm text-muted-foreground">Rată Promovare</p>*/}
                {/*        </div>*/}
                {/*    </CardContent>*/}
                {/*</Card>*/}
            </div>

            {/* Pass Rate Chart */}
            {/*<Card className="mb-8">*/}
            {/*    <CardHeader>*/}
            {/*        <CardTitle className="flex items-center space-x-2">*/}
            {/*            <BarChart3 className="w-5 h-5" />*/}
            {/*            <span>Rata de Promovare</span>*/}
            {/*        </CardTitle>*/}
            {/*        <CardDescription>*/}
            {/*            Procentul de candidați care au trecut testul*/}
            {/*        </CardDescription>*/}
            {/*    </CardHeader>*/}
            {/*    <CardContent>*/}
            {/*        <div className="flex items-center space-x-4">*/}
            {/*            <div className="flex-1">*/}
            {/*                <Progress value={stats.passRate} className="h-8" />*/}
            {/*            </div>*/}
            {/*            <div className="text-2xl font-bold">{stats.passRate}%</div>*/}
            {/*        </div>*/}
            {/*        <div className="flex justify-between mt-4 text-sm text-muted-foreground">*/}
            {/*            <div className="flex items-center space-x-2">*/}
            {/*                <CheckCircle className="w-4 h-4 text-green-500" />*/}
            {/*                <span>{stats.passedAttempts} trecuți</span>*/}
            {/*            </div>*/}
            {/*            <div className="flex items-center space-x-2">*/}
            {/*                <XCircle className="w-4 h-4 text-red-500" />*/}
            {/*                <span>{stats.totalAttempts - stats.passedAttempts} respinși</span>*/}
            {/*            </div>*/}
            {/*        </div>*/}
            {/*    </CardContent>*/}
            {/*</Card>*/}

            {/* Question Stats */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Target className="w-5 h-5" />
                        <span>{questionStatsTitle}</span>
                    </CardTitle>
                    <CardDescription>
                        {questionStatsDescription}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {stats.test_results?.question_results?.map((questionStat: QuestionStat, index: number) => {
                            const question = stats.questions.find((q: any) => q.id === questionStat.skill_test_question_id);
                            const correctAnswers: string[] =
                                Array.isArray(question.correct_answers)
                                    ? question.correct_answers
                                    : JSON.parse(question.correct_answers as string) || [];

                            const userAnswers: string[] =
                                Array.isArray(questionStat.answer)
                                    ? questionStat.answer
                                    : JSON.parse(questionStat.answer as string) || [];

                            const IconComponent = getQuestionTypeIcon(question.type);

                            return (
                                <div key={questionStat.id} className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center space-x-2">
                                            <IconComponent className="w-5 h-5 text-primary" />
                                            <Badge variant="outline">
                                                {getQuestionTypeLabel(question.type)}
                                            </Badge>
                                            <Badge variant="secondary">
                                                {pointsTemplate.replace('{count}', String(question.points))}
                                            </Badge>
                                        </div>
                                        <div className="text-xl font-bold text-blue-500">
                                            {questionLabelTemplate.replace('{number}', String(index + 1))}
                                        </div>
                                    </div>

                                    <h4 className="font-medium mb-4">{question.question}</h4>

                                    <div className="grid xs:grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>{questionStat.is_correct ? answerCorrect : answerIncorrect}</span>
                                                <span>{pointsTemplate.replace('{count}', String(questionStat.points_earned))}</span>
                                            </div>
                                            <Progress value={100} className="h-2" indicatorClassName={`${questionStat.is_correct ? 'bg-green-500' : 'bg-red-500'}`} />
                                        </div>


                                    </div>

                                    <div className="flex items-center space-x-2 text-sm mb-2">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        <span>{correctAnswerLabel}</span>
                                        <span>
                                            {correctAnswers.map((ans, idx) => (
                                                <span key={idx} className="font-bold text-green-500">{ans}{idx < correctAnswers.length - 1 ? ', ' : ''}</span>
                                            ))}
                                        </span>

                                    </div>

                                    <div className="flex items-center space-x-2 text-sm mb-2">
                                        <Users className="w-4 h-4 text-blue-500" />
                                        <span>{userAnswerLabel}</span>
                                        <span>
                                            {userAnswers.map((ans, idx) => (
                                            <span key={idx} className={`font-bold ${questionStat.is_correct ? 'text-blue-500' : 'text-red-500'}`}>{ans}{idx < userAnswers.length - 1 ? ', ' : ''}</span>
                                        ))}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
