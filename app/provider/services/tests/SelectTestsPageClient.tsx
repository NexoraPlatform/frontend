'use client';

import parseJson from "parse-json";

export const dynamic = 'force-dynamic';

import {useState, useEffect, useCallback} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
    ArrowLeft,
    CheckCircle,
    AlertCircle,
    Loader2,
    PlayCircle,
    Clock,
    Target,
    Award,
    BookOpen,
    Zap,
    Trophy,
    Star,
    Code,
    Type,
    CheckSquare,
    Square,
    Timer,
    Send,
    Eye,
    EyeOff
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api';
import {AnimatePresence, motion} from "framer-motion";

interface TestData {
    serviceId: string;
    serviceName: string;
    level: string;
    category: string;
}

interface Question {
    id: string;
    type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'CODE_WRITING' | 'TEXT_INPUT';
    question: string;
    points: number;
    options?: string;
    correctAnswers: string[];
    explanation?: string;
    codeTemplate?: string;
    codeSolution?: string;
    expectedOutput?: string;
    testCases?: Array<{
        input: string;
        expectedOutput: string;
        description?: string;
    }>;
}

interface TestAnswer {
    questionId: string;
    answer: string | string[];
    timeSpent?: number;
}

type ExplanationQuestion = {
    questionId: string;
    score: number;
    comment: string;
    isCorrect: boolean;
    explanation?: string;
    correctAnswer?: string | string[];
};

export default function SelectTestsPageClient() {
    const { user, loading } = useAuth();
    const [testData, setTestData] = useState<TestData[]>([]);
    const [availableTests, setAvailableTests] = useState<any[]>([]);
    const [currentTest, setCurrentTest] = useState<any>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<TestAnswer[]>([]);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [testStartTime, setTestStartTime] = useState<Date | null>(null);
    const [questionStartTime, setQuestionStartTime] = useState<Date | null>(null);
    const [testInProgress, setTestInProgress] = useState(false);
    const [testCompleted, setTestCompleted] = useState(false);
    const [testResult, setTestResult] = useState<any>(null);
    const [showExplanations, setShowExplanations] = useState(false);
    const [error, setError] = useState('');
    const [loadingTests, setLoadingTests] = useState(true);
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showQuestions, setShowQuestions] = useState(false);
    const [key, setKey] = useState(0);
    const [loadingResults, setLoadingResults] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setShowQuestions((prev) => !prev);
            setKey((k) => k + 1);
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/signin');
        }
        if (user && user.role !== 'PROVIDER') {
            router.push('/dashboard');
        }

        const dataParam = searchParams.get('data');
        if (dataParam) {
            try {
                const parsedData = JSON.parse(decodeURIComponent(dataParam));

                setTestData(parsedData);
                loadAvailableTests(parsedData);
            } catch (error) {
                setError('Date invalide');
                router.push('/provider/services/select');
            }
        } else {
            router.push('/provider/services/select');
        }
    }, [user, loading, router, searchParams]);

    const handleSubmitTest = useCallback(async () => {
        setLoadingResults(true);
        try {
            setTestInProgress(false);

            const totalTimeSpent = testStartTime
                ? Math.floor((Date.now() - testStartTime.getTime()) / (1000 * 60))
                : currentTest.test.timeLimit;

            // Format answers correctly for the API
            const formattedData = {
                testId: currentTest.test.id,
                answers: answers,
                timeSpent: totalTimeSpent,
                testData: testData,
            };

            const result = await apiClient.takeTest(currentTest.test.id, formattedData);

            setTestResult(result);
            setTestCompleted(true);
        } catch (error: any) {
            setError('Nu s-a putut trimite testul: ' + error.message);
            setTestInProgress(false);
        } finally {
            setLoadingResults(false);
        }
    }, [answers, currentTest.test.id, currentTest.test.timeLimit, testData, testStartTime]);

    // Timer pentru test
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (testInProgress && timeRemaining > 0) {
            interval = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        handleSubmitTest();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [handleSubmitTest, testInProgress, timeRemaining]);

    const loadAvailableTests = async (testDataArray: TestData[]) => {
        try {
            const tests = [];
            for (const testInfo of testDataArray) {
                const test = await apiClient.findByServiceAndLevel(testInfo.serviceId, testInfo.level);

                if (test) {
                    tests.push({
                        test: test.test,
                        serviceInfo: testInfo
                    });
                }
            }

            setAvailableTests(tests);
        } catch (error: any) {
            setError(error.message ?? 'Nu s-au putut încărca testele');
        } finally {
            setLoadingTests(false);
        }
    };

    const startTest = async (test: any) => {
        try {
            setCurrentTest(test);
            setCurrentQuestionIndex(0);
            setAnswers([]);
            setTimeRemaining(test.test.timeLimit * 60); // convertim minutele în secunde
            setTestStartTime(new Date());
            setQuestionStartTime(new Date());
            setTestInProgress(true);
            setTestCompleted(false);
            setTestResult(null);
            setError('');
        } catch (error: any) {
            setError('Nu s-a putut începe testul');
        }
    };

    const handleAnswerChange = (questionId: string, answer: string | string[]) => {
        setAnswers(prev => {
            const existing = prev.find(a => a.questionId === questionId);
            if (existing) {
                return prev.map(a =>
                    a.questionId === questionId
                        ? { ...a, answer }
                        : a
                );
            } else {
                return [...prev, { questionId, answer }];
            }
        });
    };

    const nextQuestion = () => {

        if (questionStartTime) {
            const timeSpent = Math.floor((Date.now() - questionStartTime.getTime()) / 1000);
            const currentQuestion = currentTest.test.questions[currentQuestionIndex];

            setAnswers(prev =>
                prev.map(a =>
                    a.questionId === currentQuestion.id
                        ? { ...a, timeSpent }
                        : a
                )
            );
        }

        if (currentQuestionIndex < currentTest.test.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setQuestionStartTime(new Date());
        } else {
            handleSubmitTest();
        }
    };

    const previousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
            setQuestionStartTime(new Date());
        }
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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

    const renderQuestion = (question: Question) => {
        const currentAnswer = answers.find(a => a.questionId === question.id)?.answer;
        const Icon = getQuestionTypeIcon(question.type);

        // @ts-ignore
        return (
            <Card className="border-2">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Icon className="w-5 h-5 text-primary" />
                            <Badge variant="outline">
                                {getQuestionTypeLabel(question.type)}
                            </Badge>
                            <Badge className="bg-blue-100 text-blue-800">
                                {question.points} puncte
                            </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Întrebarea {currentQuestionIndex + 1} din {currentTest.test.questions.length}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-4">
                            {question.question}
                        </h3>
                    </div>

                    {/* Single Choice */}
                    {question.type === 'SINGLE_CHOICE' && question.options && (
                        <RadioGroup
                            value={currentAnswer as string || ''}
                            onValueChange={(value) => handleAnswerChange(question.id, value)}
                        >
                            {parseJson(question.options).map((option: string, index: number) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                                    <Label htmlFor={`${question.id}-${index}`} className="cursor-pointer">
                                        {option}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    )}

                    {/* Multiple Choice */}
                    {question.type === 'MULTIPLE_CHOICE' && question.options && (
                        <div className="space-y-3">

                            {parseJson(question.options).map((option: string, index: number) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`${question.id}-${index}`}
                                        checked={Array.isArray(currentAnswer) && currentAnswer.includes(option)}
                                        onCheckedChange={(checked) => {
                                            const currentAnswers = Array.isArray(currentAnswer) ? currentAnswer : [];
                                            const newAnswers = checked
                                                ? [...currentAnswers, option]
                                                : currentAnswers.filter(a => a !== option);
                                            handleAnswerChange(question.id, newAnswers);
                                        }}
                                    />
                                    <Label htmlFor={`${question.id}-${index}`} className="cursor-pointer">
                                        {option}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Code Writing */}
                    {question.type === 'CODE_WRITING' && (
                        <div className="space-y-4">
                            {question.codeTemplate && (
                                <div>
                                    <Label className="text-sm font-medium mb-2 block">Template:</Label>
                                    <pre className="bg-muted p-3 rounded-lg text-sm font-mono overflow-x-auto">
                    {question.codeTemplate}
                  </pre>
                                </div>
                            )}

                            {question.testCases && question.testCases.length > 0 && (
                                <div>
                                    <Label className="text-sm font-medium mb-2 block">Test Cases:</Label>
                                    <div className="space-y-2">
                                        {question.testCases.map((testCase, index) => (
                                            <div key={index} className="bg-muted p-3 rounded-lg text-sm">
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

                            <div>
                                <Label htmlFor={`code-${question.id}`} className="text-sm font-medium mb-2 block">
                                    Scrie codul tău:
                                </Label>
                                <Textarea
                                    id={`code-${question.id}`}
                                    value={currentAnswer as string || question.codeTemplate || ''}
                                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                    placeholder="Scrie codul aici..."
                                    rows={10}
                                    className="font-mono text-sm"
                                />
                            </div>
                        </div>
                    )}

                    {/* Text Input */}
                    {question.type === 'TEXT_INPUT' && (
                        <div>
                            <Label htmlFor={`text-${question.id}`} className="text-sm font-medium mb-2 block">
                                Răspunsul tău:
                            </Label>
                            <Input
                                id={`text-${question.id}`}
                                value={currentAnswer as string || ''}
                                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                placeholder="Scrie răspunsul aici..."
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    };

    if (loadingResults) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="flex flex-col items-center justify-center p-4">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />

                    <p className="text-lg text-gray-700 font-medium h-8">
                        Se asteapta{" "}
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={key}
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 4 }}
                                transition={{ duration: 0.4 }}
                                className="font-bold text-blue-600 inline-block"
                            >
                                rezultatul
                            </motion.span>
                        </AnimatePresence>
                        !
                    </p>
                </div>
            </div>
        );
    }

    if (loading || loadingTests) {

        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="flex flex-col items-center justify-center p-4">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />

                    <p className="text-lg text-gray-700 font-medium h-8">
                        Se generează{" "}
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={key}
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 4 }}
                                transition={{ duration: 0.4 }}
                                className="font-bold text-blue-600 inline-block"
                            >
                                {showQuestions ? "întrebările" : "testul"}
                            </motion.span>
                        </AnimatePresence>
                        !
                    </p>
                </div>
            </div>
        );
    }

    if (!user || user.role !== 'PROVIDER') {
        return null;
    }

    // Afișare rezultat test
    if (testCompleted && testResult) {
        return (
            <div className="min-h-screen bg-background">
                <Header />

                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-4xl mx-auto">
                        <Card className={`border-2 ${testResult.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                            <CardHeader className="text-center">
                                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${
                                    testResult.passed ? 'bg-green-500' : 'bg-red-500'
                                }`}>
                                    {testResult.passed ? (
                                        <Trophy className="w-10 h-10 text-white" />
                                    ) : (
                                        <AlertCircle className="w-10 h-10 text-white" />
                                    )}
                                </div>
                                <CardTitle className="text-3xl mb-2">
                                    {testResult.passed ? 'Felicitări! Ai trecut testul!' : 'Nu ai trecut testul'}
                                </CardTitle>
                                <CardDescription className="text-lg">
                                    {testResult.passed
                                        ? 'Ai demonstrat competența necesară pentru acest nivel'
                                        : 'Poți reîncerca testul după 30 de zile'
                                    }
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    <div className="text-center">
                                        <div className={`text-4xl font-bold mb-2 ${testResult.passed ? 'text-green-600' : 'text-red-600'}`}>
                                            {testResult.score}%
                                        </div>
                                        <div className="text-sm text-muted-foreground">Scorul tău</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-4xl font-bold mb-2 text-blue-600">
                                            {currentTest.test.passingScore}%
                                        </div>
                                        <div className="text-sm text-muted-foreground">Nota de trecere</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-4xl font-bold mb-2 text-purple-600">
                                            {testResult.timeSpent || 0}
                                        </div>
                                        <div className="text-sm text-muted-foreground">Minute folosite</div>
                                    </div>
                                </div>

                                <div className="flex justify-center space-x-4">
                                    <Button onClick={() => setShowExplanations(!showExplanations)} variant="outline">
                                        {showExplanations ? (
                                            <>
                                                <EyeOff className="w-4 h-4 mr-2" />
                                                Ascunde Explicațiile
                                            </>
                                        ) : (
                                            <>
                                                <Eye className="w-4 h-4 mr-2" />
                                                Vezi Explicațiile
                                            </>
                                        )}
                                    </Button>
                                    <Button onClick={() => router.push('/dashboard')}>
                                        Înapoi la Dashboard
                                    </Button>
                                </div>

                                {/* Explicații răspunsuri */}
                                {showExplanations && (
                                    <div className="mt-8 space-y-6">
                                        <h3 className="text-xl font-semibold">Explicații Răspunsuri</h3>
                                        {testResult.explanations.map((question: ExplanationQuestion, index: number) => {
                                            const userAnswer = answers.find(a => a.questionId === question.questionId);

                                            return (
                                                <Card key={question.questionId} className={`border ${question.isCorrect ? 'border-green-200' : 'border-red-200'}`}>
                                                    <CardHeader>
                                                        <div className="flex items-center space-x-2">
                                                            <Badge className={question.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                                                {question.isCorrect ? 'Corect' : 'Incorect'}
                                                            </Badge>
                                                            <span className="font-medium">Întrebarea {index + 1}</span>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <div className="space-y-2 mb-4">
                                                            <div>
                                                                <strong>Răspunsul tău:</strong>{' '}
                                                                {Array.isArray(userAnswer?.answer)
                                                                    ? userAnswer?.answer.join(', ')
                                                                    : userAnswer?.answer || 'Nu ai răspuns'}
                                                            </div>
                                                            <div>
                                                                <strong>Răspunsul corect:</strong>{' '}
                                                                {Array.isArray(question.correctAnswer)
                                                                    ? question.correctAnswer.join(', ')
                                                                    : question.correctAnswer || 'Nespecificat'}
                                                            </div>
                                                        </div>

                                                        {question.explanation && (
                                                            <div className="bg-muted p-3 rounded-lg">
                                                                <strong>Explicație:</strong> {question.explanation}
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Footer />
            </div>
        );
    }

    // Test în progres
    if (testInProgress && currentTest) {

        const currentQuestion = currentTest.test.questions[currentQuestionIndex];
        const progress = ((currentQuestionIndex + 1) / currentTest.test.questions.length) * 100;
        const hasAnswer = answers.some(a => a.questionId === currentQuestion.id);

        return (
            <div className="min-h-screen bg-background">
                <Header />

                <div className="container mx-auto px-4 py-8">
                    {/* Test Header */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h1 className="text-2xl font-bold">{currentTest.test.title}</h1>
                                <p className="text-muted-foreground">{currentTest.serviceInfo.serviceName}</p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                                    timeRemaining < 300 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                    <Timer className="w-4 h-4" />
                                    <span className="font-mono font-bold">
                    {formatTime(timeRemaining)}
                  </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Progres</span>
                                <span>{currentQuestionIndex + 1} din {currentTest.test.questions.length}</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>
                    </div>

                    {/* Întrebarea curentă */}
                    {renderQuestion(currentQuestion)}

                    {/* Navigare */}
                    <div className="flex justify-between mt-6">
                        <Button
                            variant="outline"
                            onClick={previousQuestion}
                            disabled={currentQuestionIndex === 0}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Anterior
                        </Button>

                        <div className="flex space-x-3">
                            {currentQuestionIndex === currentTest.test.questions.length - 1 ? (
                                <Button
                                    onClick={handleSubmitTest}
                                    className="px-8"
                                    disabled={!hasAnswer}
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    Finalizează Testul
                                </Button>
                            ) : (
                                <Button
                                    onClick={nextQuestion}
                                    disabled={!hasAnswer}
                                >
                                    Următoarea
                                    <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <Footer />
            </div>
        );
    }

    // Lista testelor disponibile
    return (
        <div className="min-h-screen bg-background">
            <Header />

            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center space-x-4 mb-8">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold">Teste de Competență</h1>
                        <p className="text-muted-foreground">
                            Demonstrează-ți cunoștințele pentru serviciile selectate
                        </p>
                    </div>
                </div>

                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Lista testelor */}
                <div className="space-y-6">
                    {availableTests.map((test, index) => (
                        <Card key={index} className="border-2">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xl">{test.test.title}</CardTitle>
                                        <CardDescription className="mt-1">
                                            {test.serviceInfo.serviceName} - Nivel {test.serviceInfo.level}
                                        </CardDescription>
                                    </div>
                                    <Badge className="bg-blue-100 text-blue-800">
                                        {test.serviceInfo.category}
                                    </Badge>
                                </div>
                            </CardHeader>

                            <CardContent>
                                <p className="text-muted-foreground mb-4">{test.test.description}</p>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    <div className="flex items-center space-x-2 text-sm">
                                        <BookOpen className="w-4 h-4 text-blue-500" />
                                        <span>{test.test.totalQuestions || test.test.questions.length} întrebări</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm">
                                        <Clock className="w-4 h-4 text-orange-500" />
                                        <span>{test.test.timeLimit} minute</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm">
                                        <Target className="w-4 h-4 text-green-500" />
                                        <span>Nota de trecere: {test.test.passingScore}%</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm">
                                        <Award className="w-4 h-4 text-purple-500" />
                                        <span>Certificare</span>
                                    </div>
                                </div>

                                <Button onClick={() => startTest(test)}>
                                    <PlayCircle className="w-4 h-4 mr-2" />
                                    Începe Testul
                                </Button>
                            </CardContent>
                        </Card>
                    ))}

                    {availableTests.length === 0 && !loadingTests && (
                        <div className="text-center py-12">
                            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">Nu există teste disponibile</h3>
                            <p className="text-muted-foreground mb-4">
                                {error ?? 'Administratorii nu au creat încă testele pentru serviciile selectate'}
                            </p>
                            <Button variant="outline" onClick={() => router.back()}>
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Înapoi
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <Footer />
        </div>
    );
}

// Funcție pentru verificarea corectitudinii răspunsurilor
function checkAnswerCorrectness(question: Question, answer: any): boolean {
    if (!answer) return false;

    switch (question.type) {
        case 'SINGLE_CHOICE':
            return question.correctAnswers.includes(answer);

        case 'MULTIPLE_CHOICE':
            if (!Array.isArray(answer)) return false;
            // Verifică dacă toate răspunsurile selectate sunt corecte și dacă toate răspunsurile corecte au fost selectate
            const correctSet = new Set(question.correctAnswers);
            const answerSet = new Set(answer);

            // Verifică dacă toate răspunsurile selectate sunt corecte
            for (const a of answerSet) {
                if (!correctSet.has(a)) return false;
            }

            // Verifică dacă toate răspunsurile corecte au fost selectate
            return correctSet.size === answerSet.size;

        case 'TEXT_INPUT':
            return question.correctAnswers.some(correct =>
                correct.toLowerCase().trim() === (answer as string).toLowerCase().trim()
            );

        case 'CODE_WRITING':
            // Pentru întrebări de cod, considerăm că evaluarea se face pe server
            // Aici doar verificăm dacă utilizatorul a introdus ceva
            return answer && (answer as string).trim().length > 0;

        default:
            return false;
    }
}
