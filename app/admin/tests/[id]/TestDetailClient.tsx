"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    ArrowLeft,
    BookOpen,
    Clock,
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

interface TestDetailsPageProps {
    params: {
        id: string;
    };
}

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
    options?: string[];
    correctAnswers: string[];
    codeTemplate?: string;
    expectedOutput?: string;
    testCases?: TestCase[];
    explanation?: string;
}

export default function TestDetailsClient({ id }: { id: string; }) {
    const router = useRouter();
    const { data: test, loading, error, refetch } = useTest(id);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState('');

    const handleAction = async (action: string) => {
        setActionLoading(true);
        setActionError('');

        try {
            if (action === 'delete') {
                if (confirm('Ești sigur că vrei să ștergi acest test?')) {
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
            setActionError(error.message || 'A apărut o eroare');
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

    const getQuestionTypeLabel = (type: string) => {
        switch (type) {
            case 'SINGLE_CHOICE': return 'Alegere Unică';
            case 'MULTIPLE_CHOICE': return 'Alegere Multiplă';
            case 'CODE_WRITING': return 'Scriere Cod';
            case 'TEXT_INPUT': return 'Răspuns Text';
            default: return type;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Activ</Badge>;
            case 'INACTIVE':
                return <Badge className="bg-gray-100 text-gray-800"><XCircle className="w-3 h-3 mr-1" />Inactiv</Badge>;
            case 'DRAFT':
                return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />Draft</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
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
                            {test.service?.title} - {test.service?.category?.name}
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
                        <span>Detalii Test</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-semibold text-lg mb-4">Informații Generale</h3>
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="text-muted-foreground">Serviciu:</div>
                                    <div className="font-medium">{test.service?.title}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="text-muted-foreground">Categorie:</div>
                                    <div className="font-medium">{test.service?.category?.name}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="text-muted-foreground">Nivel:</div>
                                    <div>{getLevelBadge(test.level)}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="text-muted-foreground">Status:</div>
                                    <div>{getStatusBadge(test.status)}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="text-muted-foreground">Creat la:</div>
                                    <div>{new Date(test.createdAt).toLocaleDateString('ro-RO')}</div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold text-lg mb-4">Configurație Test</h3>
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="text-muted-foreground">Timp Limită:</div>
                                    <div className="font-medium">{test.timeLimit} minute</div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="text-muted-foreground">Nota de Trecere:</div>
                                    <div className="font-medium">{test.passingScore}%</div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="text-muted-foreground">Număr Întrebări:</div>
                                    <div className="font-medium">{test.totalQuestions}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="text-muted-foreground">Punctaj Total:</div>
                                    <div className="font-medium">{test.questions.reduce((sum: number, q: { points: number }) => sum + q.points, 0)} puncte</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t">
                        <h3 className="font-semibold text-lg mb-2">Descriere</h3>
                        <p className="text-muted-foreground">{test.description}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Questions */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Target className="w-5 h-5" />
                        <span>Întrebări ({test.questions.length})</span>
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
                                                {question.points} puncte
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Întrebarea {index + 1}
                                        </div>
                                    </div>

                                    <h4 className="font-medium mb-4">{question.question}</h4>

                                    {/* Single/Multiple Choice Options */}
                                    {(question.type === 'SINGLE_CHOICE' || question.type === 'MULTIPLE_CHOICE') && question.options && (
                                        <div className="space-y-1 mb-4">
                                            {question.options.map((option, optIndex) => (
                                                <div key={optIndex} className="flex items-center space-x-2 text-sm">
                          <span className={question.correctAnswers.includes(option) ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                            {String.fromCharCode(65 + optIndex)}. {option}
                          </span>
                                                    {question.correctAnswers.includes(option) && (
                                                        <Badge className="bg-green-100 text-green-800 text-xs">Corect</Badge>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Code Writing */}
                                    {question.type === 'CODE_WRITING' && (
                                        <div className="space-y-3 mb-4">
                                            {question.codeTemplate && (
                                                <div>
                                                    <div className="text-sm font-medium mb-1">Template Cod:</div>
                                                    <pre className="bg-muted p-3 rounded-lg text-sm font-mono overflow-x-auto">
                            {question.codeTemplate}
                          </pre>
                                                </div>
                                            )}

                                            {question.expectedOutput && (
                                                <div>
                                                    <div className="text-sm font-medium mb-1">Output Așteptat:</div>
                                                    <div className="bg-muted p-3 rounded-lg text-sm">
                                                        {question.expectedOutput}
                                                    </div>
                                                </div>
                                            )}

                                            {question.testCases && question.testCases.length > 0 && (
                                                <div>
                                                    <div className="text-sm font-medium mb-1">Test Cases:</div>
                                                    <div className="space-y-2">
                                                        {question.testCases.map((testCase, tcIndex) => (
                                                            <div key={tcIndex} className="bg-muted p-3 rounded-lg text-sm">
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <strong>Input:</strong> {testCase.input}
                                                                    </div>
                                                                    <div>
                                                                        <strong>Output așteptat:</strong> {testCase.expectedOutput}
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
                                            <div className="text-sm font-medium mb-1">Răspuns Corect:</div>
                                            <div className="bg-muted p-3 rounded-lg text-sm">
                                                {question.correctAnswers.join(', ')}
                                            </div>
                                        </div>
                                    )}

                                    {/* Explanation */}
                                    {question.explanation && (
                                        <div>
                                            <div className="text-sm font-medium mb-1">Explicație:</div>
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
                        Editează Test
                    </Button>
                </Link>

                <Link href={`/admin/tests/${id}/statistics`}>
                    <Button variant="outline">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Vezi Statistici
                    </Button>
                </Link>

                {test.status === 'ACTIVE' ? (
                    <Button
                        variant="outline"
                        onClick={() => handleAction('deactivate')}
                        disabled={actionLoading}
                    >
                        <XCircle className="w-4 h-4 mr-2" />
                        Dezactivează
                    </Button>
                ) : (
                    <Button
                        variant="outline"
                        onClick={() => handleAction('activate')}
                        disabled={actionLoading}
                    >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Activează
                    </Button>
                )}

                <Button
                    variant="outline"
                    onClick={() => window.open(`/tests/preview/${id}`, '_blank')}
                >
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Previzualizare
                </Button>

                <Button
                    variant="destructive"
                    onClick={() => handleAction('delete')}
                    disabled={actionLoading}
                >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Șterge Test
                </Button>
            </div>
        </div>
    );
}
