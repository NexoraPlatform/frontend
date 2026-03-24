"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  Clock,
  Edit,
  Loader2,
  PlayCircle,
  ShieldCheck,
  Target,
  Trash2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { AdminOverviewItem, AdminSidebarCard } from "@/components/admin/admin-sidebar-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { AdminSummaryCard } from "@/components/admin/admin-summary-card";
import { AdminSpinner } from "@/components/admin/admin-state";
import {
  AdminTestLevelBadge,
  AdminTestQuestionTypeBadge,
  AdminTestStatusBadge,
} from "@/components/admin/test-badges";
import { ProjectAdminShell } from "@/components/admin/project-admin-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTest } from "@/hooks/use-api";
import { getLocalizedAdminValue } from "@/lib/admin-format";
import apiClient from "@/lib/api";
import {
  type AdminTestQuestion,
  normalizeAdminTestQuestion,
} from "@/lib/admin-tests";
import { Link, useRouter } from "@/lib/navigation";

export default function TestDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const { data: test, loading, error, refetch } = useTest(id);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const normalizedQuestions = useMemo<AdminTestQuestion[]>(
    () =>
      Array.isArray(test?.questions)
        ? test.questions.map((question: any) => normalizeAdminTestQuestion(question))
        : [],
    [test?.questions]
  );

  const serviceName = useMemo(
    () =>
      getLocalizedAdminValue(test?.service?.title ?? test?.service?.name, locale) || "-",
    [locale, test?.service?.name, test?.service?.title]
  );

  const categoryName = useMemo(
    () => getLocalizedAdminValue(test?.service?.category?.name, locale) || "-",
    [locale, test?.service?.category?.name]
  );

  const totalPoints = useMemo(
    () =>
      normalizedQuestions.reduce(
        (sum: number, question: AdminTestQuestion) => sum + Number(question.points || 0),
        0
      ),
    [normalizedQuestions]
  );

  const summaryCards = useMemo(
    () => [
      {
        title: t("admin.tests.detail.questions_label"),
        value: normalizedQuestions.length,
        icon: BookOpen,
        color: "bg-gradient-to-br from-primary to-emerald-400",
      },
      {
        title: t("admin.tests.detail.total_points_label"),
        value: totalPoints,
        icon: Target,
        color: "bg-gradient-to-br from-blue-500 to-cyan-400",
      },
      {
        title: t("admin.tests.detail.passing_score_label"),
        value: `${Number(test?.passingScore ?? test?.passing_score ?? 0)}%`,
        icon: ShieldCheck,
        color: "bg-gradient-to-br from-purple-500 to-pink-400",
      },
      {
        title: t("admin.tests.detail.time_limit_label"),
        value: `${Number(test?.timeLimit ?? test?.time_limit ?? 0)} ${t("admin.tests.minute_suffix")}`,
        icon: Clock,
        color: "bg-gradient-to-br from-orange-500 to-amber-400",
      },
    ],
    [
      normalizedQuestions.length,
      t,
      test?.passingScore,
      test?.passing_score,
      test?.timeLimit,
      test?.time_limit,
      totalPoints,
    ]
  );

  const handleAction = async (action: "delete" | "activate" | "deactivate") => {
    setActionLoading(true);
    setActionError("");

    try {
      if (action === "delete") {
        if (!confirm(t("admin.tests.confirm_delete"))) {
          return;
        }

        await apiClient.deleteTest(id);
        router.push("/admin/tests");
        return;
      }

      await apiClient.updateTestStatus(
        id,
        action === "activate" ? "ACTIVE" : "INACTIVE"
      );
      await refetch();
    } catch (nextError: any) {
      setActionError(nextError?.message || t("admin.tests.error_prefix"));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <ProjectAdminShell>
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="glass-effect rounded-2xl border border-border p-12">
            <AdminSpinner className="flex justify-center" />
          </div>
        </div>
      </ProjectAdminShell>
    );
  }

  if (error || !test) {
    return (
      <ProjectAdminShell>
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error || t("admin.tests.detail.not_found")}</AlertDescription>
          </Alert>
        </div>
      </ProjectAdminShell>
    );
  }

  return (
    <ProjectAdminShell>
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <AdminPageHeader
          title={String(test.title ?? "-")}
          description={`${serviceName} - ${categoryName}`}
          backHref="/admin/tests"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <AdminTestLevelBadge level={String(test.level ?? "JUNIOR")} />
              <AdminTestStatusBadge status={String(test.status ?? "DRAFT")} />
            </div>
          }
        />

        {actionError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card, index) => (
            <AdminSummaryCard
              key={String(card.title)}
              title={card.title}
              value={card.value}
              icon={card.icon}
              colorClassName={card.color}
              delay={index * 0.08}
            />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <AdminSectionCard
            delay={0.2}
            title={t("admin.tests.detail.test_details")}
            description={t("admin.tests.detail.general_info")}
          >
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <AdminOverviewItem
                  label={t("admin.tests.detail.service_label")}
                  value={serviceName}
                />
                <AdminOverviewItem
                  label={t("admin.tests.detail.category_label")}
                  value={categoryName}
                />
                <AdminOverviewItem label={t("admin.tests.detail.level_label")}>
                  <div className="flex items-center gap-2">
                    <AdminTestLevelBadge level={String(test.level ?? "JUNIOR")} />
                  </div>
                </AdminOverviewItem>
                <AdminOverviewItem label={t("admin.tests.detail.status_label")}>
                  <div className="flex items-center gap-2">
                    <AdminTestStatusBadge status={String(test.status ?? "DRAFT")} />
                  </div>
                </AdminOverviewItem>
              </div>

              <div className="space-y-4">
                <AdminOverviewItem
                  label={t("admin.tests.detail.created_label")}
                  value={
                    test.created_at
                      ? new Date(test.created_at).toLocaleDateString(
                          locale.startsWith("ro") ? "ro-RO" : "en-US"
                        )
                      : "-"
                  }
                />
                <AdminOverviewItem
                  label={t("admin.tests.detail.time_limit_label")}
                  value={`${Number(test.timeLimit ?? test.time_limit ?? 0)} ${t("admin.tests.minute_suffix")}`}
                />
                <AdminOverviewItem
                  label={t("admin.tests.detail.passing_score_label")}
                  value={`${Number(test.passingScore ?? test.passing_score ?? 0)}%`}
                />
                <AdminOverviewItem
                  label={t("admin.tests.detail.total_points_label")}
                  value={totalPoints}
                />
              </div>
            </div>

            <div className="mt-6">
              <AdminOverviewItem
                label={t("admin.tests.detail.description")}
                value={String(test.description ?? "-")}
              />
            </div>
          </AdminSectionCard>

          <AdminSidebarCard
            delay={0.25}
            icon={ShieldCheck}
            title={t("admin.tests.detail.actions_title")}
            description={t("admin.tests.detail.actions_description")}
          >
            <div className="space-y-3">
              <Link href={`/admin/tests/${id}/edit`} className="block">
                <Button className="w-full bg-primary text-white hover:bg-primary/90">
                  <Edit className="mr-2 h-4 w-4" />
                  {t("admin.tests.detail.edit_test")}
                </Button>
              </Link>

              <Link href={`/admin/tests/${id}/statistics`} className="block">
                <Button type="button" variant="outline" className="w-full border-border bg-transparent">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  {t("admin.tests.detail.view_statistics")}
                </Button>
              </Link>

              <Button
                type="button"
                variant="outline"
                className="w-full border-border bg-transparent"
                onClick={() => window.open(`/tests/preview/${id}`, "_blank", "noopener,noreferrer")}
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                {t("admin.tests.detail.preview")}
              </Button>

              {String(test.status).toUpperCase() === "ACTIVE" ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-border bg-transparent"
                  disabled={actionLoading}
                  onClick={() => handleAction("deactivate")}
                >
                  {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {t("admin.tests.detail.deactivate")}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-border bg-transparent"
                  disabled={actionLoading}
                  onClick={() => handleAction("activate")}
                >
                  {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {t("admin.tests.detail.activate")}
                </Button>
              )}

              <Button
                type="button"
                variant="destructive"
                className="w-full"
                disabled={actionLoading}
                onClick={() => handleAction("delete")}
              >
                {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                <Trash2 className="mr-2 h-4 w-4" />
                {t("admin.tests.detail.delete_test")}
              </Button>
            </div>
          </AdminSidebarCard>
        </div>

        <AdminSectionCard
          delay={0.3}
          title={t("admin.tests.detail.questions_section", {
            count: normalizedQuestions.length,
          })}
          description={t("admin.tests.detail.questions_description")}
        >
          <div className="space-y-4">
            {normalizedQuestions.map((question, index) => (
              <div
                key={question.id}
                className="rounded-xl border border-border/60 bg-background/50 p-5"
              >
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <AdminTestQuestionTypeBadge type={question.type} />
                      <Badge variant="secondary">
                        {t("admin.tests.points_template", { count: question.points })}
                      </Badge>
                    </div>
                    <p className="font-medium">
                      {t("admin.tests.detail.question_label", { number: index + 1 })}
                    </p>
                  </div>
                </div>

                <p className="mb-4 text-sm">{question.question}</p>

                {(question.type === "SINGLE_CHOICE" ||
                  question.type === "MULTIPLE_CHOICE") &&
                question.options.length > 0 ? (
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <div key={`${question.id}-${optionIndex}`} className="flex items-center gap-2 text-sm">
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
                            {t("admin.tests.detail.correct_option")}
                          </Badge>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}

                {question.type === "TEXT_INPUT" ? (
                  <div className="mt-4 rounded-xl border border-border/60 bg-background/50 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      {t("admin.tests.statistics.correct_answer")}
                    </p>
                    <p className="mt-2 text-sm">{question.correctAnswers.join(", ") || "-"}</p>
                  </div>
                ) : null}

                {question.type === "CODE_WRITING" ? (
                  <div className="mt-4 space-y-4">
                    {question.codeTemplate ? (
                      <AdminOverviewItem
                        label={t("admin.tests.detail.code_template")}
                      >
                        <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg text-sm">
                          {question.codeTemplate}
                        </pre>
                      </AdminOverviewItem>
                    ) : null}

                    {question.expectedOutput ? (
                      <AdminOverviewItem
                        label={t("admin.tests.detail.expected_output")}
                        value={question.expectedOutput}
                      />
                    ) : null}

                    {question.testCases.length > 0 ? (
                      <div className="grid gap-4">
                        {question.testCases.map((testCase, caseIndex) => (
                          <div
                            key={`${question.id}-${caseIndex}`}
                            className="rounded-xl border border-border/60 bg-background/50 p-4"
                          >
                            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                              {t("admin.tests.detail.test_cases")}
                            </p>
                            <div className="mt-3 grid gap-3 md:grid-cols-2">
                              <div className="text-sm">
                                <span className="font-medium">
                                  {t("admin.tests.detail.input_label")}
                                </span>{" "}
                                {testCase.input}
                              </div>
                              <div className="text-sm">
                                <span className="font-medium">
                                  {t("admin.tests.detail.expected_output_label")}
                                </span>{" "}
                                {testCase.expectedOutput}
                              </div>
                            </div>
                            {testCase.description ? (
                              <p className="mt-2 text-sm text-muted-foreground">
                                {testCase.description}
                              </p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {question.explanation ? (
                  <div className="mt-4 rounded-xl border border-border/60 bg-background/50 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      {t("admin.tests.detail.explanation")}
                    </p>
                    <p className="mt-2 text-sm">{question.explanation}</p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </AdminSectionCard>
      </div>
    </ProjectAdminShell>
  );
}
