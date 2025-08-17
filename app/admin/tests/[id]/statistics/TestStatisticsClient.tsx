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
            case 'SINGLE_CHOICE': return 'Alegere Unică';
            case 'MULTIPLE_CHOICE': return 'Alegere Multiplă';
            case 'CODE_WRITING': return 'Scriere Cod';
            case 'TEXT_INPUT': return 'Răspuns Text';
            default: return type;
        }
    };

    type Level = 'JUNIOR' | 'MEDIU' | 'SENIOR' | 'EXPERT';

    const getLevelBadge = (level: Level) => {
        const colors: Record<Level, string> = {
            JUNIOR: 'bg-green-100 text-green-800',
            MEDIU: 'bg-blue-100 text-blue-800',
            SENIOR: 'bg-purple-100 text-purple-800',
            EXPERT: 'bg-orange-100 text-orange-800',
        };

        return <Badge className={colors[level]}>{level}</Badge>;
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
                        {statsError || 'Nu s-au putut încărca datele'}
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
    console.log(stats)
    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center space-x-4 mb-8">
                <Link href="/admin/tests">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold">{stats.title} - {stats.test_results.user.firstName} {stats.test_results.user.lastName} - Statistici</h1>
                    <p className="text-muted-foreground">
                        Analiză detaliată a performanței testului
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                            <div className="text-3xl font-bold">{stats.test_results.user.firstName} {stats.test_results.user.lastName}</div>
                            <p className="text-sm text-muted-foreground">Utilizator</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <CheckCircle className={`w-8 h-8 ${stats.test_results.passed === 'YES' ? 'text-green-500' : 'text-red-500'} mx-auto mb-2`} />
                            <div className="text-3xl font-bold">{stats.test_results.passed === 'YES' ? 'Da' : 'Nu'}</div>
                            <p className="text-sm text-muted-foreground">Test Trecut</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <Target className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                            <div className="text-3xl font-bold">{Number(stats.test_results.score)}%</div>
                            <p className="text-sm text-muted-foreground">Scor</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <Clock className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                            <div className="text-3xl font-bold">{formatTime(stats.test_results.timeSpent)}</div>
                            <p className="text-sm text-muted-foreground">Timp petrecut</p>
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
                        <span>Statistici per Întrebare</span>
                    </CardTitle>
                    <CardDescription>
                        Performanța candidaților pentru fiecare întrebare
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
                                                {question.points} puncte
                                            </Badge>
                                        </div>
                                        <div className="text-xl font-bold text-blue-500">
                                            Întrebarea {index + 1}
                                        </div>
                                    </div>

                                    <h4 className="font-medium mb-4">{question.question}</h4>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>Raspuns {questionStat.is_correct ? 'corect' : 'incorect' }</span>
                                                <span>{questionStat.points_earned} puncte</span>
                                            </div>
                                            <Progress value={100} className="h-2" indicatorClassName={`${questionStat.is_correct ? 'bg-green-500' : 'bg-red-500'}`} />
                                        </div>


                                    </div>

                                    <div className="flex items-center space-x-2 text-sm mb-2">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        <span>Raspuns corect</span>
                                        <span>
                                            {correctAnswers.map((ans, idx) => (
                                                <span key={idx} className="font-bold text-green-500">{ans}{idx < correctAnswers.length - 1 ? ', ' : ''}</span>
                                            ))}
                                        </span>

                                    </div>

                                    <div className="flex items-center space-x-2 text-sm mb-2">
                                        <Users className="w-4 h-4 text-blue-500" />
                                        <span>Raspuns utilizator</span>
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
