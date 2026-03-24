"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Edit,
  Loader2,
  Plus,
  Save,
  ShieldCheck,
  Target,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { AdminOverviewItem, AdminSidebarCard } from "@/components/admin/admin-sidebar-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSearchInput } from "@/components/admin/admin-search-input";
import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { AdminEmptyState, AdminSpinner } from "@/components/admin/admin-state";
import {
  AdminTestLevelBadge,
  AdminTestQuestionTypeBadge,
  getAdminTestQuestionIcon,
} from "@/components/admin/test-badges";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAdminServices, useApi } from "@/hooks/use-api";
import apiClient from "@/lib/api";
import { getLocalizedAdminValue } from "@/lib/admin-format";
import {
  createDefaultAdminTestValues,
  createEmptyAdminTestQuestion,
  normalizeAdminTestQuestion,
  parseAdminTestStringArray,
  serializeAdminTestQuestionForApi,
  type AdminTestEditorValues,
  type AdminTestQuestion,
  type AdminTestQuestionType,
} from "@/lib/admin-tests";
import { Link, useRouter } from "@/lib/navigation";

type TestEditorFormProps = {
  mode: "create" | "edit";
  testId?: string;
};

type ServiceOption = {
  id: string;
  label: string;
};

const createQuestionTypeState = (type: AdminTestQuestionType): AdminTestQuestion => {
  const nextQuestion = createEmptyAdminTestQuestion();
  nextQuestion.type = type;

  if (type === "CODE_WRITING") {
    nextQuestion.options = [];
    nextQuestion.correctAnswers = ["CODE_SOLUTION"];
  }

  if (type === "TEXT_INPUT") {
    nextQuestion.options = [];
  }

  return nextQuestion;
};

export function TestEditorForm({ mode, testId }: TestEditorFormProps) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations();
  const { data: servicesData, loading: servicesLoading } = useAdminServices();
  const {
    data: testData,
    loading: testLoading,
    error: testError,
  } = useApi(
    () => (testId ? apiClient.getTest(testId) : Promise.resolve(null)),
    [testId],
    mode === "edit"
  );

  const [formData, setFormData] = useState<AdminTestEditorValues>(createDefaultAdminTestValues());
  const [currentQuestion, setCurrentQuestion] = useState<AdminTestQuestion>(createEmptyAdminTestQuestion());
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("builder");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [questionSearch, setQuestionSearch] = useState("");

  const pageTitle =
    mode === "create" ? t("admin.tests.new.title") : t("admin.tests.edit.title");
  const pageSubtitle =
    mode === "create"
      ? t("admin.tests.new.subtitle")
      : t("admin.tests.edit.subtitle");
  const submitLabel =
    mode === "create"
      ? t("admin.tests.editor.create_test")
      : t("admin.tests.editor.save_changes");
  const submittingLabel =
    mode === "create"
      ? t("admin.tests.editor.creating")
      : t("admin.tests.editor.saving");

  useEffect(() => {
    if (mode !== "edit" || !testData) {
      return;
    }

    setFormData({
      title: String(testData.title ?? ""),
      description: String(testData.description ?? ""),
      serviceId: String(testData.serviceId ?? testData.service_id ?? testData.service?.id ?? ""),
      level: String(testData.level ?? "JUNIOR").toUpperCase() as AdminTestEditorValues["level"],
      timeLimit: Number(testData.timeLimit ?? testData.time_limit ?? 60),
      passingScore: Number(testData.passingScore ?? testData.passing_score ?? 70),
      status: String(testData.status ?? "DRAFT").toUpperCase() as AdminTestEditorValues["status"],
      questions: Array.isArray(testData.questions)
        ? testData.questions.map((question: any) => normalizeAdminTestQuestion(question))
        : [],
    });
  }, [mode, testData]);

  const serviceOptions = useMemo<ServiceOption[]>(() => {
    const services = Array.isArray(servicesData?.services)
      ? servicesData.services
      : Array.isArray(servicesData)
        ? servicesData
        : [];

    return services.map((service: any) => {
      const serviceName =
        getLocalizedAdminValue(service?.title ?? service?.name, locale) ||
        String(service?.title ?? service?.name ?? "");
      const categoryName =
        getLocalizedAdminValue(service?.category?.name, locale) ||
        String(service?.category?.name ?? "");

      return {
        id: String(service.id),
        label: categoryName ? `${serviceName} - ${categoryName}` : serviceName,
      };
    });
  }, [locale, servicesData]);

  const selectedServiceLabel = useMemo(
    () =>
      serviceOptions.find((service) => service.id === formData.serviceId)?.label ||
      t("admin.tests.editor.overview.empty"),
    [formData.serviceId, serviceOptions, t]
  );

  const totalPoints = useMemo(
    () => formData.questions.reduce((sum, question) => sum + Number(question.points || 0), 0),
    [formData.questions]
  );

  const summaryCards = useMemo(
    () => [
      {
        label: t("admin.tests.editor.overview.questions"),
        value: formData.questions.length,
      },
      {
        label: t("admin.tests.editor.overview.total_points"),
        value: totalPoints,
      },
      {
        label: t("admin.tests.editor.overview.time_limit"),
        value: `${formData.timeLimit} ${t("admin.tests.minute_suffix")}`,
      },
      {
        label: t("admin.tests.editor.overview.passing_score"),
        value: `${formData.passingScore}%`,
      },
    ],
    [formData.passingScore, formData.questions.length, formData.timeLimit, t, totalPoints]
  );

  const questionTypeOptions = useMemo(
    () =>
      ([
        "SINGLE_CHOICE",
        "MULTIPLE_CHOICE",
        "CODE_WRITING",
        "TEXT_INPUT",
      ] as AdminTestQuestionType[]).map((value) => ({
        value,
        label: t(`admin.tests.question_types.${value}`),
      })),
    [t]
  );

  const filteredQuestions = useMemo(() => {
    const query = questionSearch.trim().toLowerCase();
    if (!query) {
      return formData.questions;
    }

    return formData.questions.filter((question) =>
      [question.question, question.explanation]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [formData.questions, questionSearch]);

  const displayError = error || testError || "";
  const isBusy = loading || (mode === "edit" && testLoading) || servicesLoading;

  const resetQuestionBuilder = (type: AdminTestQuestionType = "SINGLE_CHOICE") => {
    setCurrentQuestion(createQuestionTypeState(type));
    setEditingQuestionIndex(null);
  };

  const handleQuestionTypeChange = (value: string) => {
    const nextType = value as AdminTestQuestionType;
    setCurrentQuestion((prev) => {
      const nextQuestion = createQuestionTypeState(nextType);
      nextQuestion.id = prev.id;
      nextQuestion.question = prev.question;
      nextQuestion.points = prev.points;
      nextQuestion.explanation = prev.explanation;
      return nextQuestion;
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    setCurrentQuestion((prev) => {
      const nextOptions = [...prev.options];
      const previousValue = nextOptions[index];
      nextOptions[index] = value;

      const nextCorrectAnswers = prev.correctAnswers
        .map((answer) => (answer === previousValue ? value : answer))
        .filter(Boolean);

      return {
        ...prev,
        options: nextOptions,
        correctAnswers: nextCorrectAnswers,
      };
    });
  };

  const handleCorrectAnswerToggle = (answer: string) => {
    setCurrentQuestion((prev) => {
      if (prev.type === "SINGLE_CHOICE") {
        return { ...prev, correctAnswers: [answer] };
      }

      const exists = prev.correctAnswers.includes(answer);
      return {
        ...prev,
        correctAnswers: exists
          ? prev.correctAnswers.filter((value) => value !== answer)
          : [...prev.correctAnswers, answer],
      };
    });
  };

  const addTestCase = () => {
    setCurrentQuestion((prev) => ({
      ...prev,
      testCases: [...prev.testCases, { input: "", expectedOutput: "", description: "" }],
    }));
  };

  const updateTestCase = (index: number, field: "input" | "expectedOutput" | "description", value: string) => {
    setCurrentQuestion((prev) => {
      const nextCases = [...prev.testCases];
      nextCases[index] = { ...nextCases[index], [field]: value };
      return { ...prev, testCases: nextCases };
    });
  };

  const removeTestCase = (index: number) => {
    setCurrentQuestion((prev) => ({
      ...prev,
      testCases: prev.testCases.filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  const handleAddQuestion = () => {
    if (!currentQuestion.question.trim()) {
      setError(t("admin.tests.editor.validation.question_required"));
      return;
    }

    if (
      currentQuestion.type !== "CODE_WRITING" &&
      parseAdminTestStringArray(currentQuestion.correctAnswers).length === 0
    ) {
      setError(t("admin.tests.editor.validation.correct_answer_required"));
      return;
    }

    if (
      currentQuestion.type === "CODE_WRITING" &&
      !currentQuestion.expectedOutput &&
      currentQuestion.testCases.length === 0
    ) {
      setError(t("admin.tests.editor.validation.code_result_required"));
      return;
    }

    const normalizedQuestion = normalizeAdminTestQuestion({
      ...currentQuestion,
      id:
        editingQuestionIndex !== null
          ? currentQuestion.id
          : `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    });

    setFormData((prev) => {
      const nextQuestions = [...prev.questions];

      if (editingQuestionIndex !== null) {
        nextQuestions[editingQuestionIndex] = normalizedQuestion;
      } else {
        nextQuestions.push(normalizedQuestion);
      }

      return { ...prev, questions: nextQuestions };
    });

    resetQuestionBuilder();
    setError("");
    setActiveTab("questions");
  };

  const editQuestion = (index: number) => {
    setCurrentQuestion(normalizeAdminTestQuestion(formData.questions[index]));
    setEditingQuestionIndex(index);
    setActiveTab("builder");
  };

  const deleteQuestion = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, currentIndex) => currentIndex !== index),
    }));

    if (editingQuestionIndex === index) {
      resetQuestionBuilder();
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (formData.questions.length === 0) {
      setError(t("admin.tests.editor.validation.at_least_one_question"));
      setActiveTab("questions");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        serviceId: formData.serviceId,
        service_id: formData.serviceId,
        level: formData.level,
        timeLimit: formData.timeLimit,
        passingScore: formData.passingScore,
        status: formData.status,
        questions: formData.questions.map((question, index) =>
          serializeAdminTestQuestionForApi(question, index)
        ),
      };

      if (mode === "create") {
        await apiClient.createTest(payload);
      } else if (testId) {
        await apiClient.updateTest(testId, payload);
      }

      router.push("/admin/tests");
    } catch (nextError: any) {
      setError(nextError?.message || t("admin.tests.error_prefix"));
    } finally {
      setLoading(false);
    }
  };

  if (isBusy) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="glass-effect rounded-2xl border border-border p-12">
          <AdminSpinner className="flex justify-center" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <AdminPageHeader
        title={pageTitle}
        description={pageSubtitle}
        backHref="/admin/tests"
      />

      <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <AdminSectionCard
            delay={0.15}
            title={t("admin.tests.editor.basic_info_title")}
            description={t("admin.tests.editor.basic_info_description")}
          >
            {displayError ? (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{displayError}</AlertDescription>
              </Alert>
            ) : null}

            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">{t("admin.tests.editor.fields.title")}</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, title: event.target.value }))
                    }
                    placeholder={t("admin.tests.editor.placeholders.title")}
                    required
                    className="border-border bg-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">{t("admin.tests.editor.fields.level")}</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        level: value as AdminTestEditorValues["level"],
                      }))
                    }
                  >
                    <SelectTrigger id="level" className="border-border bg-transparent">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="JUNIOR">{t("admin.tests.levels.JUNIOR")}</SelectItem>
                      <SelectItem value="MEDIU">{t("admin.tests.levels.MEDIU")}</SelectItem>
                      <SelectItem value="SENIOR">{t("admin.tests.levels.SENIOR")}</SelectItem>
                      <SelectItem value="EXPERT">{t("admin.tests.levels.EXPERT")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t("admin.tests.editor.fields.description")}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, description: event.target.value }))
                  }
                  placeholder={t("admin.tests.editor.placeholders.description")}
                  rows={4}
                  required
                  className="border-border bg-transparent"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service">{t("admin.tests.editor.fields.service")}</Label>
                <Select
                  value={formData.serviceId}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, serviceId: value }))
                  }
                >
                  <SelectTrigger id="service" className="border-border bg-transparent">
                    <SelectValue placeholder={t("admin.tests.editor.placeholders.service")} />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceOptions.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="timeLimit">{t("admin.tests.editor.fields.time_limit")}</Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    min={5}
                    max={180}
                    value={String(formData.timeLimit)}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        timeLimit: Number.parseInt(event.target.value, 10) || 0,
                      }))
                    }
                    className="border-border bg-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passingScore">
                    {t("admin.tests.editor.fields.passing_score")}
                  </Label>
                  <Input
                    id="passingScore"
                    type="number"
                    min={50}
                    max={100}
                    value={String(formData.passingScore)}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        passingScore: Number.parseInt(event.target.value, 10) || 0,
                      }))
                    }
                    className="border-border bg-transparent"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">{t("admin.tests.editor.fields.status")}</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: value as AdminTestEditorValues["status"],
                      }))
                    }
                  >
                    <SelectTrigger id="status" className="border-border bg-transparent">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">{t("admin.tests.statuses.DRAFT")}</SelectItem>
                      <SelectItem value="ACTIVE">{t("admin.tests.statuses.ACTIVE")}</SelectItem>
                      <SelectItem value="INACTIVE">{t("admin.tests.statuses.INACTIVE")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </AdminSectionCard>

          <AdminSectionCard
            delay={0.2}
            title={t("admin.tests.editor.questions_title")}
            description={t("admin.tests.editor.questions_description")}
            action={
              <Badge variant="outline" className="gap-1">
                {t("admin.tests.editor.total_points_badge", {
                  count: totalPoints,
                  questions: formData.questions.length,
                })}
              </Badge>
            }
            headerClassName="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-6 grid w-full grid-cols-2 bg-secondary/40">
                <TabsTrigger value="builder">
                  {editingQuestionIndex !== null
                    ? t("admin.tests.editor.tabs.edit_question")
                    : t("admin.tests.editor.tabs.add_question")}
                </TabsTrigger>
                <TabsTrigger value="questions">
                  {t("admin.tests.editor.tabs.question_list")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="builder" className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t("admin.tests.editor.fields.question_type")}</Label>
                    <Select
                      value={currentQuestion.type}
                      onValueChange={handleQuestionTypeChange}
                    >
                      <SelectTrigger className="border-border bg-transparent">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {questionTypeOptions.map((option) => {
                          const Icon = getAdminTestQuestionIcon(option.value);

                          return (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <span>{option.label}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="points">{t("admin.tests.editor.fields.points")}</Label>
                    <Input
                      id="points"
                      type="number"
                      min={1}
                      max={100}
                      value={String(currentQuestion.points)}
                      onChange={(event) =>
                        setCurrentQuestion((prev) => ({
                          ...prev,
                          points: Number.parseInt(event.target.value, 10) || 0,
                        }))
                      }
                      className="border-border bg-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="question">{t("admin.tests.editor.fields.question")}</Label>
                  <Textarea
                    id="question"
                    rows={3}
                    value={currentQuestion.question}
                    onChange={(event) =>
                      setCurrentQuestion((prev) => ({
                        ...prev,
                        question: event.target.value,
                      }))
                    }
                    placeholder={t("admin.tests.editor.placeholders.question")}
                    className="border-border bg-transparent"
                  />
                </div>

                {(currentQuestion.type === "SINGLE_CHOICE" ||
                  currentQuestion.type === "MULTIPLE_CHOICE") && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>{t("admin.tests.editor.fields.options")}</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-border bg-transparent"
                        onClick={() =>
                          setCurrentQuestion((prev) => ({
                            ...prev,
                            options: [...prev.options, ""],
                          }))
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {t("admin.tests.editor.actions.add_option")}
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {currentQuestion.options.map((option, index) => {
                        const selected = currentQuestion.correctAnswers.includes(option);

                        return (
                          <div key={`${index}-${option}`} className="flex gap-3">
                            <Input
                              value={option}
                              onChange={(event) =>
                                handleOptionChange(index, event.target.value)
                              }
                              placeholder={t("admin.tests.editor.placeholders.option", {
                                number: index + 1,
                              })}
                              className="border-border bg-transparent"
                            />
                            <Button
                              type="button"
                              variant={selected ? "default" : "outline"}
                              className="shrink-0"
                              disabled={!option.trim()}
                              onClick={() => handleCorrectAnswerToggle(option)}
                            >
                              {selected
                                ? t("admin.tests.editor.actions.marked_correct")
                                : t("admin.tests.editor.actions.mark_correct")}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {currentQuestion.type === "CODE_WRITING" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="codeTemplate">
                        {t("admin.tests.editor.fields.code_template")}
                      </Label>
                      <Textarea
                        id="codeTemplate"
                        rows={5}
                        value={currentQuestion.codeTemplate || ""}
                        onChange={(event) =>
                          setCurrentQuestion((prev) => ({
                            ...prev,
                            codeTemplate: event.target.value,
                          }))
                        }
                        placeholder={t("admin.tests.editor.placeholders.code_template")}
                        className="border-border bg-transparent font-mono"
                      />
                      <p className="text-sm text-muted-foreground">
                        {t("admin.tests.editor.help.code_template")}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="codeSolution">
                        {t("admin.tests.editor.fields.code_solution")}
                      </Label>
                      <Textarea
                        id="codeSolution"
                        rows={5}
                        value={currentQuestion.codeSolution || ""}
                        onChange={(event) =>
                          setCurrentQuestion((prev) => ({
                            ...prev,
                            codeSolution: event.target.value,
                          }))
                        }
                        placeholder={t("admin.tests.editor.placeholders.code_solution")}
                        className="border-border bg-transparent font-mono"
                      />
                      <p className="text-sm text-muted-foreground">
                        {t("admin.tests.editor.help.code_solution")}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expectedOutput">
                        {t("admin.tests.editor.fields.expected_output")}
                      </Label>
                      <Input
                        id="expectedOutput"
                        value={currentQuestion.expectedOutput || ""}
                        onChange={(event) =>
                          setCurrentQuestion((prev) => ({
                            ...prev,
                            expectedOutput: event.target.value,
                          }))
                        }
                        placeholder={t("admin.tests.editor.placeholders.expected_output")}
                        className="border-border bg-transparent"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>{t("admin.tests.editor.fields.test_cases")}</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-border bg-transparent"
                          onClick={addTestCase}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          {t("admin.tests.editor.actions.add_test_case")}
                        </Button>
                      </div>

                      {currentQuestion.testCases.map((testCase, index) => (
                        <div
                          key={`${index}-${testCase.input}-${testCase.expectedOutput}`}
                          className="rounded-xl border border-border/60 bg-background/50 p-4"
                        >
                          <div className="mb-4 flex items-center justify-between">
                            <p className="text-sm font-medium">
                              {t("admin.tests.editor.test_case_label", { number: index + 1 })}
                            </p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTestCase(index)}
                            >
                              {t("admin.tests.editor.actions.remove")}
                            </Button>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label>{t("admin.tests.detail.input_label")}</Label>
                              <Input
                                value={testCase.input}
                                onChange={(event) =>
                                  updateTestCase(index, "input", event.target.value)
                                }
                                placeholder={t("admin.tests.editor.placeholders.test_input")}
                                className="border-border bg-transparent"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>{t("admin.tests.detail.expected_output_label")}</Label>
                              <Input
                                value={testCase.expectedOutput}
                                onChange={(event) =>
                                  updateTestCase(index, "expectedOutput", event.target.value)
                                }
                                placeholder={t("admin.tests.editor.placeholders.test_output")}
                                className="border-border bg-transparent"
                              />
                            </div>
                          </div>

                          <div className="mt-4 space-y-2">
                            <Label>{t("admin.tests.editor.fields.test_case_description")}</Label>
                            <Input
                              value={testCase.description || ""}
                              onChange={(event) =>
                                updateTestCase(index, "description", event.target.value)
                              }
                              placeholder={t("admin.tests.editor.placeholders.test_case_description")}
                              className="border-border bg-transparent"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentQuestion.type === "TEXT_INPUT" && (
                  <div className="space-y-2">
                    <Label htmlFor="correctAnswer">
                      {t("admin.tests.editor.fields.correct_answer")}
                    </Label>
                    <Input
                      id="correctAnswer"
                      value={currentQuestion.correctAnswers[0] || ""}
                      onChange={(event) =>
                        setCurrentQuestion((prev) => ({
                          ...prev,
                          correctAnswers: [event.target.value],
                        }))
                      }
                      placeholder={t("admin.tests.editor.placeholders.correct_answer")}
                      className="border-border bg-transparent"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="explanation">
                    {t("admin.tests.editor.fields.explanation")}
                  </Label>
                  <Textarea
                    id="explanation"
                    rows={3}
                    value={currentQuestion.explanation || ""}
                    onChange={(event) =>
                      setCurrentQuestion((prev) => ({
                        ...prev,
                        explanation: event.target.value,
                      }))
                    }
                    placeholder={t("admin.tests.editor.placeholders.explanation")}
                    className="border-border bg-transparent"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button type="button" onClick={handleAddQuestion}>
                    {editingQuestionIndex !== null ? (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {t("admin.tests.editor.actions.update_question")}
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        {t("admin.tests.editor.actions.add_question")}
                      </>
                    )}
                  </Button>

                  {editingQuestionIndex !== null ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="border-border bg-transparent"
                      onClick={() => resetQuestionBuilder()}
                    >
                      {t("admin.tests.editor.actions.cancel_edit")}
                    </Button>
                  ) : null}
                </div>
              </TabsContent>

              <TabsContent value="questions" className="space-y-6">
                <AdminSearchInput
                  value={questionSearch}
                  onChange={(event) => setQuestionSearch(event.target.value)}
                  placeholder={t("admin.tests.editor.question_search_placeholder")}
                />

                {filteredQuestions.length === 0 ? (
                  <AdminEmptyState
                    icon={Target}
                    title={t("admin.tests.editor.empty_title")}
                    description={t("admin.tests.editor.empty_description")}
                  />
                ) : (
                  <div className="space-y-4">
                    {filteredQuestions.map((question, index) => {
                      const originalIndex = formData.questions.findIndex(
                        (entry) => entry.id === question.id
                      );
                      const Icon = getAdminTestQuestionIcon(question.type);

                      return (
                        <div
                          key={question.id}
                          className="rounded-xl border border-border/60 bg-background/50 p-4"
                        >
                          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <AdminTestQuestionTypeBadge type={question.type} />
                                <Badge variant="secondary">
                                  {t("admin.tests.points_template", { count: question.points })}
                                </Badge>
                              </div>
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                                  <Icon className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {t("admin.tests.detail.question_label", {
                                      number: originalIndex + 1,
                                    })}
                                  </p>
                                  <p className="mt-1 text-sm text-muted-foreground">
                                    {question.question}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="border-border bg-transparent"
                                onClick={() => editQuestion(originalIndex)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="border-border bg-transparent"
                                onClick={() => deleteQuestion(originalIndex)}
                              >
                                {t("admin.tests.editor.actions.remove")}
                              </Button>
                            </div>
                          </div>

                          {(question.type === "SINGLE_CHOICE" ||
                            question.type === "MULTIPLE_CHOICE") &&
                          question.options.length > 0 ? (
                            <div className="space-y-2">
                              {question.options.map((option, optionIndex) => (
                                <div
                                  key={`${question.id}-${optionIndex}`}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  <span
                                    className={
                                      question.correctAnswers.includes(option)
                                        ? "font-medium text-emerald-600 dark:text-emerald-400"
                                        : "text-muted-foreground"
                                    }
                                  >
                                    {String.fromCharCode(65 + optionIndex)}. {option}
                                  </span>
                                  {question.correctAnswers.includes(option) ? (
                                    <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                                      {t("admin.tests.editor.actions.marked_correct")}
                                    </Badge>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </AdminSectionCard>
        </div>

        <div className="space-y-6">
          <AdminSidebarCard
            delay={0.25}
            icon={Target}
            title={t("admin.tests.editor.overview.title")}
            description={t("admin.tests.editor.overview.description")}
          >
            <div className="space-y-4">
              <AdminOverviewItem
                label={t("admin.tests.editor.overview.service")}
                value={selectedServiceLabel}
              />

              <AdminOverviewItem label={t("admin.tests.editor.overview.level")}>
                <div className="flex items-center gap-2">
                  <AdminTestLevelBadge level={formData.level} />
                </div>
              </AdminOverviewItem>

              <div className="grid gap-4 sm:grid-cols-2">
                {summaryCards.map((item) => (
                  <AdminOverviewItem
                    key={String(item.label)}
                    label={item.label}
                    value={item.value}
                    valueClassName="mt-2 text-sm font-medium"
                  />
                ))}
              </div>

              <AdminOverviewItem label={t("admin.tests.editor.overview.status")}>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{t(`admin.tests.statuses.${formData.status}`)}</Badge>
                </div>
              </AdminOverviewItem>
            </div>
          </AdminSidebarCard>

          <AdminSidebarCard
            delay={0.3}
            icon={ShieldCheck}
            title={t("admin.tests.editor.actions.title")}
            description={t("admin.tests.editor.actions.description")}
          >
            <div className="space-y-3">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white hover:bg-primary/90"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {submittingLabel}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {submitLabel}
                  </>
                )}
              </Button>

              <Link href="/admin/tests" className="block">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-border bg-transparent"
                >
                  {t("admin.tests.editor.actions.cancel")}
                </Button>
              </Link>
            </div>
          </AdminSidebarCard>
        </div>
      </form>
    </div>
  );
}
