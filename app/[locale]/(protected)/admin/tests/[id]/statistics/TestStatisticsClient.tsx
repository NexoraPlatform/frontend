"use client";

import { useMemo } from "react";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
  Users,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { AdminEmptyState } from "@/components/admin/admin-state";
import { AdminSpinner } from "@/components/admin/admin-state";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { AdminSummaryCard } from "@/components/admin/admin-summary-card";
import {
  AdminTestLevelBadge,
  AdminTestQuestionTypeBadge,
} from "@/components/admin/test-badges";
import { ProjectAdminShell } from "@/components/admin/project-admin-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useTestStatistics } from "@/hooks/use-api";
import { getLocalizedAdminValue } from "@/lib/admin-format";
import {
  type AdminTestQuestion,
  normalizeAdminTestQuestion,
  parseAdminTestStringArray,
} from "@/lib/admin-tests";

type QuestionStat = {
  id: string;
  answer: string[] | string;
  points_earned: number;
  is_correct: boolean;
  skill_test_question_id: number;
};

export default function TestStatisticsClient({ id }: { id: string }) {
  const locale = useLocale();
  const t = useTranslations();
  const { data: stats, loading, error } = useTestStatistics(id);

  const userFullName = `${stats?.test_results?.user?.firstName ?? ""} ${
    stats?.test_results?.user?.lastName ?? ""
  }`.trim();
  const timeSpent = Number(stats?.test_results?.timeSpent ?? 0);
  const serviceName = getLocalizedAdminValue(
    stats?.service?.title ?? stats?.service?.name,
    locale
  );

  const questionMap = useMemo<Map<number, AdminTestQuestion>>(() => {
    const entries: AdminTestQuestion[] = Array.isArray(stats?.questions)
      ? stats.questions.map((question: any) => normalizeAdminTestQuestion(question))
      : [];

    return new Map(entries.map((question) => [Number(question.id), question]));
  }, [stats?.questions]);

  const questionResults: QuestionStat[] = Array.isArray(stats?.test_results?.question_results)
    ? stats.test_results.question_results
    : [];

  const summaryCards = useMemo(
    () => [
      {
        title: t("admin.tests.statistics.user_label"),
        value: userFullName || "-",
        icon: Users,
        color: "bg-gradient-to-br from-primary to-emerald-400",
      },
      {
        title: t("admin.tests.statistics.passed_label"),
        value:
          stats?.test_results?.passed === "YES"
            ? t("admin.tests.statistics.passed_yes")
            : t("admin.tests.statistics.passed_no"),
        icon: CheckCircle,
        color:
          stats?.test_results?.passed === "YES"
            ? "bg-gradient-to-br from-blue-500 to-cyan-400"
            : "bg-gradient-to-br from-red-500 to-pink-400",
      },
      {
        title: t("admin.tests.statistics.score_label"),
        value: `${Number(stats?.test_results?.score ?? 0)}%`,
        icon: Target,
        color: "bg-gradient-to-br from-purple-500 to-pink-400",
      },
      {
        title: t("admin.tests.statistics.time_spent_label"),
        value: `${timeSpent} ${t("admin.tests.minute_suffix")}`,
        icon: Clock,
        color: "bg-gradient-to-br from-orange-500 to-amber-400",
      },
    ],
    [stats?.test_results?.passed, stats?.test_results?.score, t, timeSpent, userFullName]
  );

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

  if (error || !stats) {
    return (
      <ProjectAdminShell>
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || t("admin.tests.statistics.error_loading")}
            </AlertDescription>
          </Alert>
        </div>
      </ProjectAdminShell>
    );
  }

  return (
    <ProjectAdminShell>
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <AdminPageHeader
          title={`${stats.title} - ${userFullName} - ${t("admin.tests.statistics.title_suffix")}`}
          description={t("admin.tests.statistics.subtitle")}
          backHref={`/admin/tests/${id}`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <AdminTestLevelBadge level={String(stats.level ?? "JUNIOR")} />
              <Badge variant="outline">{serviceName || "-"}</Badge>
            </div>
          }
        />

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

        <AdminSectionCard
          delay={0.2}
          title={t("admin.tests.statistics.question_stats_title")}
          description={t("admin.tests.statistics.question_stats_description")}
        >
          {questionResults.length === 0 ? (
            <AdminEmptyState
              icon={Target}
              title={t("admin.tests.statistics.empty_title")}
              description={t("admin.tests.statistics.empty_description")}
            />
          ) : (
            <div className="space-y-4">
              {questionResults.map((questionStat, index) => {
                const question = questionMap.get(Number(questionStat.skill_test_question_id));
                const correctAnswers = question
                  ? parseAdminTestStringArray(question.correctAnswers)
                  : [];
                const userAnswers = parseAdminTestStringArray(questionStat.answer);

                return (
                  <div
                    key={questionStat.id}
                    className="rounded-xl border border-border/60 bg-background/50 p-5"
                  >
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <AdminTestQuestionTypeBadge type={question?.type ?? "SINGLE_CHOICE"} />
                          <Badge variant="secondary">
                            {t("admin.tests.points_template", {
                              count: Number(question?.points ?? 0),
                            })}
                          </Badge>
                          <Badge
                            className={
                              questionStat.is_correct
                                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                : "bg-red-500/20 text-red-600 dark:text-red-400"
                            }
                          >
                            {questionStat.is_correct
                              ? t("admin.tests.statistics.answer_correct")
                              : t("admin.tests.statistics.answer_incorrect")}
                          </Badge>
                        </div>
                        <p className="font-medium">
                          {t("admin.tests.statistics.question_label", { number: index + 1 })}
                        </p>
                      </div>

                      <div className="text-sm font-medium text-primary">
                        {t("admin.tests.statistics.points_earned", {
                          count: Number(questionStat.points_earned ?? 0),
                        })}
                      </div>
                    </div>

                    <p className="mb-4 text-sm">{question?.question || "-"}</p>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-xl border border-border/60 bg-background/50 p-4">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                          {t("admin.tests.statistics.correct_answer")}
                        </p>
                        <p className="mt-2 text-sm">
                          {correctAnswers.length > 0 ? correctAnswers.join(", ") : "-"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-border/60 bg-background/50 p-4">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                          {t("admin.tests.statistics.user_answer")}
                        </p>
                        <p className="mt-2 text-sm">
                          {userAnswers.length > 0 ? userAnswers.join(", ") : "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </AdminSectionCard>
      </div>
    </ProjectAdminShell>
  );
}
