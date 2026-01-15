"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/hooks/use-locale';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Plus,
  AlertCircle,
  Loader2,
  Save,
  Trash2,
  BookOpen,
  Target,
  Code,
  Type,
  CheckSquare,
  Square,
  Edit
} from 'lucide-react';
import { useAdminServices } from '@/hooks/use-api';
import { apiClient } from '@/lib/api';
import { useAsyncTranslation } from '@/hooks/use-async-translation';
import { TrustoraThemeStyles } from '@/components/trustora/theme-styles';

interface Question {
  id: string;
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'CODE_WRITING' | 'TEXT_INPUT';
  question: string;
  points: number;
  options?: string[];
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

export default function NewTestPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    serviceId: '',
    level: 'JUNIOR',
    timeLimit: 60,
    passingScore: 70,
    status: 'DRAFT'
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    id: '',
    type: 'SINGLE_CHOICE',
    question: '',
    points: 10,
    options: ['', '', '', ''],
    correctAnswers: [],
    explanation: ''
  });
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const { data: servicesData } = useAdminServices();
    const locale = useLocale();
  const pageTitle = useAsyncTranslation(locale, 'admin.tests.new.title');
  const pageSubtitle = useAsyncTranslation(locale, 'admin.tests.new.subtitle');

  const questionTypes = [
    { value: 'SINGLE_CHOICE', label: 'Alegere Unică', icon: Square },
    { value: 'MULTIPLE_CHOICE', label: 'Alegere Multiplă', icon: CheckSquare },
    { value: 'CODE_WRITING', label: 'Scriere Cod', icon: Code },
    { value: 'TEXT_INPUT', label: 'Răspuns Text', icon: Type }
  ];

  const levels = [
    { value: 'JUNIOR', label: 'Junior', color: 'bg-green-100 text-green-800' },
    { value: 'MEDIU', label: 'Mediu', color: 'bg-blue-100 text-blue-800' },
    { value: 'SENIOR', label: 'Senior', color: 'bg-purple-100 text-purple-800' },
    { value: 'EXPERT', label: 'Expert', color: 'bg-orange-100 text-orange-800' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (questions.length === 0) {
      setError('Adaugă cel puțin o întrebare');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Mapează întrebările pentru a fi compatibile cu tabelul Laravel
      const mappedQuestions = questions.map((q, index) => ({
        type:
            q.type === 'CODE_WRITING'
                ? 'CODE'
                : q.type === 'TEXT_INPUT'
                    ? 'TRUE_FALSE'
                    : q.type, // mapăm pe enum-ul Laravel

        question: q.question,
        options: q.options?.filter(Boolean) || null,
        correct_answers: q.correctAnswers,
        points: q.points,
        order: index,
        meta: JSON.stringify({
          explanation: q.explanation || '',
          codeTemplate: q.codeTemplate || '',
          codeSolution: q.codeSolution || '',
          expectedOutput: q.expectedOutput || '',
          testCases: q.testCases || [],
        }),
      }));

      await apiClient.createTest({
        ...formData,
        service_id: formData.serviceId, // Laravel așteaptă snake_case
        questions: mappedQuestions,
      });

      router.push('/admin/tests');
    } catch (error: any) {
      setError(error.message || 'A apărut o eroare');
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    if (!currentQuestion.question.trim()) {
      setError('Completează întrebarea');
      return;
    }

    // Verifică dacă este nevoie de răspunsuri corecte în funcție de tipul întrebării
    if (currentQuestion.type !== 'CODE_WRITING' && currentQuestion.correctAnswers.length === 0) {
      setError('Selectează cel puțin un răspuns corect');
      return;
    }

    // Pentru întrebări de tip CODE_WRITING, asigură-te că există cel puțin un output așteptat sau un test case
    if (currentQuestion.type === 'CODE_WRITING' &&
        !currentQuestion.expectedOutput &&
        (!currentQuestion.testCases || currentQuestion.testCases.length === 0)) {
      setError('Adaugă cel puțin un output așteptat sau un test case pentru întrebarea de cod');
      return;
    }

    const questionToAdd = {
      ...currentQuestion,
      id: editingQuestionIndex !== null ? currentQuestion.id : `q${Date.now()}`
    };

    if (editingQuestionIndex !== null) {
      const updatedQuestions = [...questions];
      updatedQuestions[editingQuestionIndex] = questionToAdd;
      setQuestions(updatedQuestions);
      setEditingQuestionIndex(null);
    } else {
      setQuestions([...questions, questionToAdd]);
    }

    // Reset form
    setCurrentQuestion({
      id: '',
      type: 'SINGLE_CHOICE',
      question: '',
      points: 10,
      options: ['', '', '', ''],
      correctAnswers: [],
      explanation: ''
    });
    setError('');
  };

  const editQuestion = (index: number) => {
    setCurrentQuestion(questions[index]);
    setEditingQuestionIndex(index);
  };

  const deleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(currentQuestion.options || [])];
    newOptions[index] = value;
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const handleCorrectAnswerToggle = (answer: string) => {
    const currentAnswers = currentQuestion.correctAnswers || [];

    if (currentQuestion.type === 'SINGLE_CHOICE') {
      setCurrentQuestion({ ...currentQuestion, correctAnswers: [answer] });
    } else {
      const newAnswers = currentAnswers.includes(answer)
        ? currentAnswers.filter(a => a !== answer)
        : [...currentAnswers, answer];
      setCurrentQuestion({ ...currentQuestion, correctAnswers: newAnswers });
    }
  };

  // Când se schimbă tipul întrebării, resetăm anumite câmpuri
  const handleQuestionTypeChange = (type: string) => {
    let updatedQuestion: Question = {
      ...currentQuestion,
      type: type as any,
      correctAnswers: []
    };

    // Resetăm opțiunile pentru întrebări cu alegere
    if (type === 'SINGLE_CHOICE' || type === 'MULTIPLE_CHOICE') {
      updatedQuestion.options = ['', '', '', ''];
      delete updatedQuestion.codeTemplate;
      delete updatedQuestion.codeSolution;
      delete updatedQuestion.expectedOutput;
      delete updatedQuestion.testCases;
    }
    // Resetăm câmpurile pentru întrebări de cod
    else if (type === 'CODE_WRITING') {
      delete updatedQuestion.options;
      updatedQuestion.codeTemplate = '';
      updatedQuestion.codeSolution = '';
      updatedQuestion.expectedOutput = '';
      updatedQuestion.testCases = [];
      // Pentru întrebări de cod, punem un placeholder în correctAnswers
      // doar pentru a trece validarea
      updatedQuestion.correctAnswers = ['CODE_SOLUTION'];
    }
    // Resetăm pentru întrebări cu text
    else if (type === 'TEXT_INPUT') {
      delete updatedQuestion.options;
      delete updatedQuestion.codeTemplate;
      delete updatedQuestion.codeSolution;
      delete updatedQuestion.expectedOutput;
      delete updatedQuestion.testCases;
    }

    setCurrentQuestion(updatedQuestion);
  };

  const addTestCase = () => {
    const newTestCases = [...(currentQuestion.testCases || [])];
    newTestCases.push({ input: '', expectedOutput: '', description: '' });
    setCurrentQuestion({ ...currentQuestion, testCases: newTestCases });
  };

  const updateTestCase = (index: number, field: string, value: string) => {
    const newTestCases = [...(currentQuestion.testCases || [])];
    newTestCases[index] = { ...newTestCases[index], [field]: value };
    setCurrentQuestion({ ...currentQuestion, testCases: newTestCases });
  };

  const removeTestCase = (index: number) => {
    const newTestCases = [...(currentQuestion.testCases || [])];
    newTestCases.splice(index, 1);
    setCurrentQuestion({ ...currentQuestion, testCases: newTestCases });
  };

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <>
      <TrustoraThemeStyles />
      <div className="min-h-screen bg-[var(--bg-light)] dark:bg-[#070C14]">
        <div className="container mx-auto px-4 py-10">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-8">
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
              <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">{pageTitle}</h1>
              <p className="text-sm text-muted-foreground">
                {pageSubtitle}
              </p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Informații de bază */}
            <Card className="glass-card shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white">
                  <BookOpen className="w-5 h-5" />
                  <span>Informații Test</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid xs:grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Titlu Test *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="ex: Test JavaScript Junior"
                      required
                      className="bg-white/80 dark:bg-slate-900/60"
                    />
                  </div>
                  <div>
                    <Label htmlFor="level">Nivel *</Label>
                    <Select value={formData.level} onValueChange={(value) => setFormData({...formData, level: value})}>
                      <SelectTrigger className="bg-white/80 dark:bg-slate-900/60">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {levels.map(level => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descriere *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Descrierea testului..."
                    rows={3}
                    required
                    className="bg-white/80 dark:bg-slate-900/60"
                  />
                </div>

                <div>
                  <Label htmlFor="serviceId">Serviciu *</Label>
                  <Select value={formData.serviceId} onValueChange={(value) => setFormData({...formData, serviceId: value})}>
                    <SelectTrigger className="bg-white/80 dark:bg-slate-900/60">
                      <SelectValue placeholder="Selectează serviciul" />
                    </SelectTrigger>
                    <SelectContent>
                      {(servicesData?.services || []).map((service: any) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.title} - {service.category?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid xs:grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="timeLimit">Timp Limită (minute) *</Label>
                    <Input
                      id="timeLimit"
                      type="number"
                      value={formData.timeLimit}
                      onChange={(e) => setFormData({...formData, timeLimit: parseInt(e.target.value)})}
                      min="5"
                      max="180"
                      required
                      className="bg-white/80 dark:bg-slate-900/60"
                    />
                  </div>
                  <div>
                    <Label htmlFor="passingScore">Nota de Trecere (%) *</Label>
                    <Input
                      id="passingScore"
                      type="number"
                      value={formData.passingScore}
                      onChange={(e) => setFormData({...formData, passingScore: parseInt(e.target.value)})}
                      min="50"
                      max="100"
                      required
                      className="bg-white/80 dark:bg-slate-900/60"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                      <SelectTrigger className="bg-white/80 dark:bg-slate-900/60">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="ACTIVE">Activ</SelectItem>
                        <SelectItem value="INACTIVE">Inactiv</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

        {/* Gestionare întrebări */}
            <Card className="glass-card shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-slate-900 dark:text-white">
                  <div className="flex items-center space-x-2">
                    <Target className="w-5 h-5" />
                    <span>Întrebări ({questions.length})</span>
                    {totalPoints > 0 && (
                      <Badge variant="outline">
                        Total: {totalPoints} puncte
                      </Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="add" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-white/80 dark:bg-slate-900/60">
                    <TabsTrigger value="add">
                      {editingQuestionIndex !== null ? 'Editează Întrebare' : 'Adaugă Întrebare'}
                    </TabsTrigger>
                    <TabsTrigger value="list">Lista Întrebări</TabsTrigger>
                  </TabsList>

              <TabsContent value="add" className="space-y-6">
                <div className="grid xs:grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Tip Întrebare *</Label>
                    <Select
                      value={currentQuestion.type}
                      onValueChange={(value: any) => handleQuestionTypeChange(value)}
                    >
                      <SelectTrigger className="bg-white/80 dark:bg-slate-900/60">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {questionTypes.map(type => {
                          const Icon = type.icon;
                          return (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center space-x-2">
                                <Icon className="w-4 h-4" />
                                <span>{type.label}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="points">Puncte *</Label>
                    <Input
                      id="points"
                      type="number"
                      value={currentQuestion.points}
                      onChange={(e) => setCurrentQuestion({...currentQuestion, points: parseInt(e.target.value)})}
                      min="1"
                      max="100"
                      required
                      className="bg-white/80 dark:bg-slate-900/60"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="question">Întrebarea *</Label>
                  <Textarea
                    id="question"
                    value={currentQuestion.question}
                    onChange={(e) => setCurrentQuestion({...currentQuestion, question: e.target.value})}
                    placeholder="Scrie întrebarea aici..."
                    rows={3}
                    required
                    className="bg-white/80 dark:bg-slate-900/60"
                  />
                </div>

                {/* Opțiuni pentru Single/Multiple Choice */}
                {(currentQuestion.type === 'SINGLE_CHOICE' || currentQuestion.type === 'MULTIPLE_CHOICE') && (
                  <div>
                    <Label>Opțiuni de Răspuns *</Label>
                    <div className="space-y-3">
                      {currentQuestion.options?.map((option, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <Input
                            value={option}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                            placeholder={`Opțiunea ${index + 1}`}
                            className="bg-white/80 dark:bg-slate-900/60"
                          />
                          <Button
                            type="button"
                            variant={currentQuestion.correctAnswers.includes(option) ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleCorrectAnswerToggle(option)}
                            disabled={!option.trim()}
                          >
                            {currentQuestion.correctAnswers.includes(option) ? 'Corect' : 'Marcare'}
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentQuestion({
                          ...currentQuestion,
                          options: [...(currentQuestion.options || []), '']
                        })}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adaugă Opțiune
                      </Button>
                    </div>
                  </div>
                )}

                {/* Template cod pentru CODE_WRITING */}
                {currentQuestion.type === 'CODE_WRITING' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="codeTemplate">Template Cod (opțional)</Label>
                      <Textarea
                        id="codeTemplate"
                        value={currentQuestion.codeTemplate || ''}
                        onChange={(e) => setCurrentQuestion({...currentQuestion, codeTemplate: e.target.value})}
                        placeholder="function solutie() {&#10;  // Completează funcția&#10;}"
                        rows={5}
                        className="font-mono bg-white/80 dark:bg-slate-900/60"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Codul de bază pe care candidatul îl va completa
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="codeSolution">Soluție Cod (pentru evaluare)</Label>
                      <Textarea
                        id="codeSolution"
                        value={currentQuestion.codeSolution || ''}
                        onChange={(e) => setCurrentQuestion({...currentQuestion, codeSolution: e.target.value})}
                        placeholder="function solutie() {&#10;  // Soluția corectă a problemei&#10;  return rezultat;&#10;}"
                        rows={5}
                        className="font-mono bg-white/80 dark:bg-slate-900/60"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Soluția corectă a codului (vizibilă doar pentru administratori)
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="expectedOutput">Output Așteptat</Label>
                      <Input
                        id="expectedOutput"
                        value={currentQuestion.expectedOutput || ''}
                        onChange={(e) => setCurrentQuestion({...currentQuestion, expectedOutput: e.target.value})}
                        placeholder="Rezultatul așteptat"
                        className="bg-white/80 dark:bg-slate-900/60"
                      />
                    </div>

                    {/* Test Cases */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label>Test Cases</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addTestCase}>
                          <Plus className="w-4 h-4 mr-2" />
                          Adaugă Test Case
                        </Button>
                      </div>
                      {currentQuestion.testCases?.map((testCase, index) => (
                          <div key={index} className="border rounded-lg p-4 space-y-3 mb-3 bg-white/70 dark:bg-slate-900/40">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Test Case {index + 1}</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTestCase(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="grid xs:grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <Label>Input</Label>
                              <Input
                                value={testCase.input}
                                onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                                placeholder="Input pentru test"
                                className="bg-white/80 dark:bg-slate-900/60"
                              />
                            </div>
                            <div>
                              <Label>Output Așteptat</Label>
                              <Input
                                value={testCase.expectedOutput}
                                onChange={(e) => updateTestCase(index, 'expectedOutput', e.target.value)}
                                placeholder="Output așteptat"
                                className="bg-white/80 dark:bg-slate-900/60"
                              />
                            </div>
                          </div>
                          <div>
                            <Label>Descriere (opțional)</Label>
                            <Input
                              value={testCase.description || ''}
                              onChange={(e) => updateTestCase(index, 'description', e.target.value)}
                              placeholder="Descrierea test case-ului"
                              className="bg-white/80 dark:bg-slate-900/60"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Răspuns corect pentru TEXT_INPUT */}
                {currentQuestion.type === 'TEXT_INPUT' && (
                  <div>
                    <Label htmlFor="correctAnswer">Răspuns Corect *</Label>
                    <Input
                      id="correctAnswer"
                      value={currentQuestion.correctAnswers[0] || ''}
                      onChange={(e) => setCurrentQuestion({...currentQuestion, correctAnswers: [e.target.value]})}
                      placeholder="Răspunsul corect"
                      required
                      className="bg-white/80 dark:bg-slate-900/60"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="explanation">Explicație (opțional)</Label>
                  <Textarea
                    id="explanation"
                    value={currentQuestion.explanation || ''}
                    onChange={(e) => setCurrentQuestion({...currentQuestion, explanation: e.target.value})}
                    placeholder="Explicația răspunsului corect..."
                    rows={2}
                    className="bg-white/80 dark:bg-slate-900/60"
                  />
                </div>

                <div className="flex space-x-3">
                  <Button type="button" onClick={addQuestion}>
                    {editingQuestionIndex !== null ? (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Actualizează Întrebarea
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Adaugă Întrebarea
                      </>
                    )}
                  </Button>
                  {editingQuestionIndex !== null && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingQuestionIndex(null);
                        setCurrentQuestion({
                          id: '',
                          type: 'SINGLE_CHOICE',
                          question: '',
                          points: 10,
                          options: ['', '', '', ''],
                          correctAnswers: [],
                          explanation: ''
                        });
                      }}
                    >
                      Anulează
                    </Button>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="list">
                {questions.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nicio întrebare adăugată</h3>
                    <p className="text-muted-foreground">
                      Adaugă întrebări pentru a crea testul
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {questions.map((question, index) => (
                  <div key={question.id} className="border rounded-lg p-4 bg-white/70 dark:bg-slate-900/40">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">
                              {questionTypes.find(t => t.value === question.type)?.label}
                            </Badge>
                            <Badge variant="secondary">
                              {question.points} puncte
                            </Badge>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => editQuestion(index)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => deleteQuestion(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <h4 className="font-medium mb-2">
                          {index + 1}. {question.question}
                        </h4>
                        {question.options && (
                          <div className="space-y-1">
                            {question.options.map((option, optIndex) => (
                              <div key={optIndex} className="flex items-center space-x-2 text-sm">
                                <span className={question.correctAnswers.includes(option) ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                                  {String.fromCharCode(65 + optIndex)}. {option}
                                </span>
                                {question.correctAnswers.includes(option) && (
                                  <Badge className="border border-emerald-200/60 bg-emerald-100 text-emerald-800 text-xs dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-200">
                                    Corect
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {question.type === 'CODE_WRITING' && (
                          <div className="space-y-1 text-sm">
                            {question.codeTemplate && (
                              <div className="mb-2">
                                <strong>Template:</strong>
                                <pre className="bg-muted p-2 rounded mt-1 text-xs overflow-x-auto">
                                  {question.codeTemplate}
                                </pre>
                              </div>
                            )}
                            {question.codeSolution && (
                              <div className="mb-2">
                                <strong>Soluție:</strong>
                                <pre className="bg-green-50 dark:bg-green-950/20 p-2 rounded mt-1 text-xs overflow-x-auto border border-green-200 dark:border-green-800">
                                  {question.codeSolution}
                                </pre>
                              </div>
                            )}
                            {question.expectedOutput && (
                              <div className="mb-2">
                                <strong>Output așteptat:</strong> {question.expectedOutput}
                              </div>
                            )}
                            {question.testCases && question.testCases.length > 0 && (
                              <div>
                                <strong>Test Cases:</strong> {question.testCases.length} definite
                              </div>
                            )}
                          </div>
                        )}
                        {question.type === 'TEXT_INPUT' && (
                          <p className="text-sm text-green-600 font-medium">
                            Răspuns corect: {question.correctAnswers[0]}
                          </p>
                        )}
                        {question.explanation && (
                          <p className="text-sm text-muted-foreground mt-2">
                            <strong>Explicație:</strong> {question.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex space-x-4">
                  <Button type="submit" disabled={loading || questions.length === 0} className="flex-1 btn-primary">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Se creează...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Creează Testul
              </>
            )}
          </Button>
          <Link href="/admin/tests">
                  <Button type="button" variant="outline" className="border-slate-200/70 bg-white/70 dark:border-slate-700/60 dark:bg-slate-900/60">
                    Anulează
                  </Button>
                </Link>
              </div>
            </form>
        </div>
      </div>
    </>
  );
}
