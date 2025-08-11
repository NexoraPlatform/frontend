"use client";

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    ArrowLeft,
    BarChart3,
    Clock,
    Target,
    Users,
    CheckCircle,
    XCircle,
    Loader2,
    AlertCircle,
    Award,
    BookOpen,
    Code,
    Type,
    CheckSquare,
    Square
} from 'lucide-react';
import { useTest, useTestStatistics } from '@/hooks/use-api';

interface TestStatisticsPageProps {
    params: {
        id: string;
    };
}

interface QuestionStat {
    questionId: string;
    type: string;
    points: number;
    question: string;
    successRate: number;
    avgTimeSpent: number;
    correctAnswers: number;
    totalAnswers: number;
}

export default function TestStatisticsPage({ id }: {  id: string; }) {
    const { data: test, loading: testLoading, error: testError } = useTest(id);
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

    if (testLoading || statsLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            </div>
        );
    }

    if (testError || statsError) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {testError || statsError || 'Nu s-au putut încărca datele'}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

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
                    <h1 className="text-3xl font-bold">{test.title} - Statistici</h1>
                    <p className="text-muted-foreground">
                        Analiză detaliată a performanței testului
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    {getLevelBadge(test.level)}
                    <Badge variant="outline">
                        {test.service?.title}
                    </Badge>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                            <div className="text-3xl font-bold">{stats.totalAttempts}</div>
                            <p className="text-sm text-muted-foreground">Total Încercări</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                            <div className="text-3xl font-bold">{stats.passedAttempts}</div>
                            <p className="text-sm text-muted-foreground">Teste Trecute</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <Target className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                            <div className="text-3xl font-bold">{stats.averageScore}%</div>
                            <p className="text-sm text-muted-foreground">Scor Mediu</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <Clock className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                            <div className="text-3xl font-bold">{stats.averageTime} min</div>
                            <p className="text-sm text-muted-foreground">Timp Mediu</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <Award className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                            <div className="text-3xl font-bold">{stats.passRate}%</div>
                            <p className="text-sm text-muted-foreground">Rată Promovare</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Pass Rate Chart */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <BarChart3 className="w-5 h-5" />
                        <span>Rata de Promovare</span>
                    </CardTitle>
                    <CardDescription>
                        Procentul de candidați care au trecut testul
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-4">
                        <div className="flex-1">
                            <Progress value={stats.passRate} className="h-8" />
                        </div>
                        <div className="text-2xl font-bold">{stats.passRate}%</div>
                    </div>
                    <div className="flex justify-between mt-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>{stats.passedAttempts} trecuți</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <XCircle className="w-4 h-4 text-red-500" />
                            <span>{stats.totalAttempts - stats.passedAttempts} respinși</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

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
                        {stats.questionStats?.map((questionStat: QuestionStat, index: number) => {
                            const IconComponent = getQuestionTypeIcon(questionStat.type);

                            return (
                                <div key={questionStat.questionId} className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center space-x-2">
                                            <IconComponent className="w-5 h-5 text-primary" />
                                            <Badge variant="outline">
                                                {getQuestionTypeLabel(questionStat.type)}
                                            </Badge>
                                            <Badge variant="secondary">
                                                {questionStat.points} puncte
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Întrebarea {index + 1}
                                        </div>
                                    </div>

                                    <h4 className="font-medium mb-4">{questionStat.question}</h4>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>Rată de Succes</span>
                                                <span>{questionStat.successRate}%</span>
                                            </div>
                                            <Progress value={questionStat.successRate} className="h-2" />
                                        </div>

                                        <div className="flex items-center space-x-2 text-sm">
                                            <Clock className="w-4 h-4 text-orange-500" />
                                            <span>Timp mediu: {questionStat.avgTimeSpent} secunde</span>
                                        </div>

                                        <div className="flex items-center space-x-2 text-sm">
                                            <Users className="w-4 h-4 text-blue-500" />
                                            <span>{questionStat.correctAnswers} din {questionStat.totalAnswers} răspunsuri corecte</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2 text-sm">
                                        {questionStat.successRate < 50 ? (
                                            <Badge className="bg-red-100 text-red-800">Dificilă</Badge>
                                        ) : questionStat.successRate > 80 ? (
                                            <Badge className="bg-green-100 text-green-800">Ușoară</Badge>
                                        ) : (
                                            <Badge className="bg-yellow-100 text-yellow-800">Moderată</Badge>
                                        )}

                                        {questionStat.avgTimeSpent > 60 && (
                                            <Badge className="bg-orange-100 text-orange-800">Consumatoare de timp</Badge>
                                        )}
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
