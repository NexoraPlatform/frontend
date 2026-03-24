"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  BookOpen,
  CheckCircle,
  Eye,
  MoreHorizontal,
  Plus,
  Target,
  Trash2,
  XCircle,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSearchInput } from "@/components/admin/admin-search-input";
import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { AdminSummaryCard } from "@/components/admin/admin-summary-card";
import {
  AdminTableEmptyRow,
  AdminTableLoadingRow,
} from "@/components/admin/admin-state";
import {
  AdminTestLevelBadge,
  AdminTestStatusBadge,
} from "@/components/admin/test-badges";
import { ProjectAdminShell } from "@/components/admin/project-admin-shell";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminTests } from "@/hooks/use-api";
import { getLocalizedAdminValue } from "@/lib/admin-format";
import apiClient from "@/lib/api";
import { Link } from "@/lib/navigation";

type AdminTestListItem = {
  id: string | number;
  title?: string;
  description?: string;
  level?: string;
  status?: string;
  timeLimit?: number;
  time_limit?: number;
  passingScore?: number;
  passing_score?: number;
  totalQuestions?: number;
  total_questions?: number;
  created_at?: string;
  results?: any[];
  service?: {
    id?: string | number;
    title?: unknown;
    name?: unknown;
    category?: {
      name?: unknown;
    };
  };
};

export default function AdminTestsPage() {
  const locale = useLocale();
  const t = useTranslations();
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: testsData, loading: testsLoading, refetch: refetchTests } = useAdminTests();

  const tests: AdminTestListItem[] = Array.isArray(testsData?.tests)
    ? testsData.tests
    : Array.isArray(testsData)
      ? testsData
      : [];

  const filteredTests = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return tests.filter((test) => {
      const title = String(test.title ?? "").toLowerCase();
      const description = String(test.description ?? "").toLowerCase();
      const serviceName = getLocalizedAdminValue(
        test.service?.title ?? test.service?.name,
        locale
      ).toLowerCase();

      const matchesSearch =
        !query ||
        title.includes(query) ||
        description.includes(query) ||
        serviceName.includes(query);
      const matchesLevel =
        levelFilter === "all" || String(test.level ?? "").toUpperCase() === levelFilter;
      const matchesStatus =
        statusFilter === "all" || String(test.status ?? "").toUpperCase() === statusFilter;

      return matchesSearch && matchesLevel && matchesStatus;
    });
  }, [levelFilter, locale, searchTerm, statusFilter, tests]);

  const summaryCards = useMemo(() => {
    const totalQuestions = tests.reduce(
      (sum, test) => sum + Number(test.totalQuestions ?? test.total_questions ?? 0),
      0
    );
    const totalResults = tests.reduce(
      (sum, test) => sum + (Array.isArray(test.results) ? test.results.length : 0),
      0
    );

    return [
      {
        title: t("admin.tests.summary.cards.total"),
        value: tests.length,
        icon: BookOpen,
        color: "bg-gradient-to-br from-primary to-emerald-400",
      },
      {
        title: t("admin.tests.summary.cards.active"),
        value: tests.filter((test) => String(test.status).toUpperCase() === "ACTIVE").length,
        icon: CheckCircle,
        color: "bg-gradient-to-br from-blue-500 to-cyan-400",
      },
      {
        title: t("admin.tests.summary.cards.questions"),
        value: totalQuestions,
        icon: Target,
        color: "bg-gradient-to-br from-purple-500 to-pink-400",
      },
      {
        title: t("admin.tests.summary.cards.results"),
        value: totalResults,
        icon: BarChart3,
        color: "bg-gradient-to-br from-orange-500 to-amber-400",
      },
    ];
  }, [t, tests]);

  const handleTestAction = async (
    testId: string,
    action: "delete" | "activate" | "deactivate"
  ) => {
    try {
      if (action === "delete") {
        if (!confirm(t("admin.tests.confirm_delete"))) {
          return;
        }

        await apiClient.deleteTest(testId);
      } else {
        await apiClient.updateTestStatus(
          testId,
          action === "activate" ? "ACTIVE" : "INACTIVE"
        );
      }

      await refetchTests();
    } catch (error: any) {
      alert(t("admin.tests.error_prefix") + error.message);
    }
  };

  return (
    <ProjectAdminShell>
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <AdminPageHeader
          title={t("admin.tests.manage_title")}
          description={t("admin.tests.manage_subtitle")}
          action={
            <Link href="/admin/tests/new">
              <Button className="bg-primary text-white hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                {t("admin.tests.add_test")}
              </Button>
            </Link>
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
          title={t("admin.tests.list_title")}
          description={t("admin.tests.list_description", { count: filteredTests.length })}
        >
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center">
            <AdminSearchInput
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={t("admin.tests.search_placeholder")}
            />

            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="h-11 w-full border-border bg-transparent lg:w-52">
                <SelectValue placeholder={t("admin.tests.level_filter_placeholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.tests.levels.all")}</SelectItem>
                <SelectItem value="JUNIOR">{t("admin.tests.levels.JUNIOR")}</SelectItem>
                <SelectItem value="MEDIU">{t("admin.tests.levels.MEDIU")}</SelectItem>
                <SelectItem value="SENIOR">{t("admin.tests.levels.SENIOR")}</SelectItem>
                <SelectItem value="EXPERT">{t("admin.tests.levels.EXPERT")}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-11 w-full border-border bg-transparent lg:w-52">
                <SelectValue placeholder={t("admin.tests.status_filter_placeholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.tests.statuses.all")}</SelectItem>
                <SelectItem value="ACTIVE">{t("admin.tests.statuses.ACTIVE")}</SelectItem>
                <SelectItem value="INACTIVE">{t("admin.tests.statuses.INACTIVE")}</SelectItem>
                <SelectItem value="DRAFT">{t("admin.tests.statuses.DRAFT")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.tests.table.test")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.tests.table.service")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.tests.table.level")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.tests.table.status")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.tests.table.configuration")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.tests.table.activity")}
                  </th>
                  <th className="px-4 py-4 text-center text-sm font-medium text-muted-foreground">
                    {t("admin.tests.table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {testsLoading ? (
                  <AdminTableLoadingRow colSpan={7} />
                ) : filteredTests.length === 0 ? (
                  <AdminTableEmptyRow
                    colSpan={7}
                    icon={BookOpen}
                    title={t("admin.tests.no_tests_title")}
                    description={t("admin.tests.no_tests_description")}
                    action={
                      <Link href="/admin/tests/new" className="inline-flex">
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          {t("admin.tests.add_first_test")}
                        </Button>
                      </Link>
                    }
                  />
                ) : (
                  filteredTests.map((test, index) => {
                    const serviceName =
                      getLocalizedAdminValue(
                        test.service?.title ?? test.service?.name,
                        locale
                      ) || "-";
                    const categoryName =
                      getLocalizedAdminValue(test.service?.category?.name, locale) || "-";
                    const questionCount = Number(
                      test.totalQuestions ?? test.total_questions ?? 0
                    );
                    const timeLimit = Number(test.timeLimit ?? test.time_limit ?? 0);
                    const passingScore = Number(
                      test.passingScore ?? test.passing_score ?? 0
                    );
                    const resultsCount = Array.isArray(test.results) ? test.results.length : 0;
                    const createdAt = test.created_at
                      ? new Date(test.created_at).toLocaleDateString(
                          locale.startsWith("ro") ? "ro-RO" : "en-US"
                        )
                      : "-";

                    return (
                      <motion.tr
                        key={String(test.id)}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 + index * 0.04, duration: 0.35 }}
                        className="group border-b border-border/50 transition-colors hover:bg-secondary/30"
                      >
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{test.title || "-"}</p>
                            <p className="max-w-md text-xs text-muted-foreground line-clamp-2">
                              {test.description || "-"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {t("admin.tests.category_prefix")}
                              {categoryName}
                            </p>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm text-muted-foreground">
                          {serviceName}
                        </td>

                        <td className="px-4 py-4">
                          <AdminTestLevelBadge level={String(test.level ?? "JUNIOR")} />
                        </td>

                        <td className="px-4 py-4">
                          <AdminTestStatusBadge status={String(test.status ?? "DRAFT")} />
                        </td>

                        <td className="px-4 py-4">
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>{t("admin.tests.question_count", { count: questionCount })}</p>
                            <p>
                              {timeLimit} {t("admin.tests.minute_suffix")}
                            </p>
                            <p>{t("admin.tests.passing_score", { score: passingScore })}</p>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>{t("admin.tests.results_count", { count: resultsCount })}</p>
                            <p>
                              {t("admin.tests.created_prefix")}
                              {createdAt}
                            </p>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-70 transition-opacity group-hover:opacity-100"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/tests/${test.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  {t("admin.tests.view_details")}
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/tests/${test.id}/statistics`}>
                                  <BarChart3 className="mr-2 h-4 w-4" />
                                  {t("admin.tests.detail.view_statistics")}
                                </Link>
                              </DropdownMenuItem>
                              {String(test.status).toUpperCase() === "ACTIVE" ? (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleTestAction(String(test.id), "deactivate")
                                  }
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  {t("admin.tests.deactivate")}
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleTestAction(String(test.id), "activate")
                                  }
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  {t("admin.tests.activate")}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleTestAction(String(test.id), "delete")}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t("admin.tests.delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </AdminSectionCard>
      </div>
    </ProjectAdminShell>
  );
}
