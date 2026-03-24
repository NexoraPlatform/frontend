"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Clock3,
  DollarSign,
  FileText,
  FolderKanban,
  PhoneCall,
  RefreshCcw,
  TrendingDown,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

import { PriceDisplay } from "@/components/PriceDisplay";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSectionCard } from "@/components/admin/admin-section-card";
import {
  AdminOverviewItem,
  AdminSidebarCard,
} from "@/components/admin/admin-sidebar-card";
import { AdminSummaryCard } from "@/components/admin/admin-summary-card";
import {
  AdminTableEmptyRow,
  AdminTableLoadingRow,
} from "@/components/admin/admin-state";
import { ProjectAdminShell } from "@/components/admin/project-admin-shell";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import apiClient from "@/lib/api";
import {
  EMPTY_ADMIN_STATS,
  normalizeAdminStats,
  type AdminStats,
} from "@/lib/admin-stats";

type AnalyticsMetricId = "users" | "services" | "revenue" | "projects" | "calls";

type AnalyticsMetricRow = {
  id: AnalyticsMetricId;
  label: string;
  total: number;
  current: number;
  previous: number;
  change: number;
  pending: number | null;
  isCurrency?: boolean;
};

type ChartMetricRow = {
  label: string;
  current: number;
  previous: number;
};

type PipelineMetricRow = {
  label: string;
  monthly: number;
  pending: number;
};

type KeyMetricRow = {
  id: string;
  label: string;
  value: React.ReactNode;
  helper: string;
  tone: "default" | "success" | "warning";
};

const METRIC_ICONS: Record<AnalyticsMetricId, LucideIcon> = {
  users: Users,
  services: FileText,
  revenue: DollarSign,
  projects: FolderKanban,
  calls: PhoneCall,
};

const METRIC_ICON_STYLES: Record<AnalyticsMetricId, string> = {
  users: "bg-primary/10 text-primary",
  services: "bg-blue-500/10 text-blue-500",
  revenue: "bg-purple-500/10 text-purple-500",
  projects: "bg-orange-500/10 text-orange-500",
  calls: "bg-cyan-500/10 text-cyan-500",
};

function derivePreviousValue(current: number, change: number) {
  if (!Number.isFinite(current) || current === 0) return 0;

  const factor = 1 + change / 100;
  if (!Number.isFinite(factor) || factor <= 0) {
    return 0;
  }

  return Math.max(0, Math.round(current / factor));
}

function formatNumberValue(value: number, locale: string) {
  return new Intl.NumberFormat(locale).format(value);
}

function formatCompactValue(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function MetricValue({
  value,
  isCurrency,
  locale,
}: {
  value: number;
  isCurrency?: boolean;
  locale: string;
}) {
  if (isCurrency) {
    return <PriceDisplay value={value} currency="USD" />;
  }

  return <span>{formatNumberValue(value, locale)}</span>;
}

export function AdminAnalyticsPage() {
  const locale = useLocale();
  const t = useTranslations();
  const numberLocale = locale === "ro" ? "ro-RO" : "en-US";
  const [statsData, setStatsData] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;

    const fetchStats = async () => {
      setLoading(true);
      setErrorMessage(null);

      try {
        const response = await apiClient.getAdminStats();
        if (!active) return;

        setStatsData(normalizeAdminStats(response as Partial<AdminStats>));
      } catch (error) {
        console.error("Failed to load admin analytics", error);
        if (!active) return;

        setErrorMessage(
          error instanceof Error
            ? error.message
            : t("admin.analytics.error_message")
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void fetchStats();

    return () => {
      active = false;
    };
  }, [reloadToken, t]);

  const stats = statsData ?? EMPTY_ADMIN_STATS;
  const hasLoadedStats = statsData !== null;

  const metrics = useMemo<AnalyticsMetricRow[]>(() => {
    const usersChange = Math.round(stats.currentMonthVsLastMonthUsers);
    const servicesChange = Math.round(stats.currentMonthVsLastMonthServices);
    const revenueChange = Math.round(stats.currentMonthVsLastMonthRevenue);
    const projectsChange = Math.round(stats.currentMonthVsLastMonthProjects);

    return [
      {
        id: "users",
        label: t("admin.analytics.metrics.users"),
        total: stats.totalUsers,
        current: stats.currentMonthUsers,
        previous: derivePreviousValue(stats.currentMonthUsers, usersChange),
        change: usersChange,
        pending: stats.pendingUsers,
      },
      {
        id: "services",
        label: t("admin.analytics.metrics.services"),
        total: stats.activeServices,
        current: stats.currentMonthServices,
        previous: derivePreviousValue(stats.currentMonthServices, servicesChange),
        change: servicesChange,
        pending: stats.pendingServices,
      },
      {
        id: "revenue",
        label: t("admin.analytics.metrics.revenue"),
        total: stats.totalRevenue,
        current: stats.currentMonthRevenue,
        previous: derivePreviousValue(stats.currentMonthRevenue, revenueChange),
        change: revenueChange,
        pending: null,
        isCurrency: true,
      },
      {
        id: "projects",
        label: t("admin.analytics.metrics.projects"),
        total: stats.totalProjects,
        current: stats.currentMonthProjects,
        previous: derivePreviousValue(stats.currentMonthProjects, projectsChange),
        change: projectsChange,
        pending: stats.totalPendingProjects,
      },
      {
        id: "calls",
        label: t("admin.analytics.metrics.calls"),
        total: stats.totalScheduleCalls,
        current: stats.totalScheduleCalls,
        previous: 0,
        change: 0,
        pending: stats.pendingCalls,
      },
    ];
  }, [stats, t]);

  const comparisonChartData = useMemo<ChartMetricRow[]>(
    () =>
      metrics
        .filter((metric) => metric.id !== "revenue" && metric.id !== "calls")
        .map((metric) => ({
          label: metric.label,
          current: metric.current,
          previous: metric.previous,
        })),
    [metrics]
  );

  const pipelineChartData = useMemo<PipelineMetricRow[]>(
    () =>
      metrics
        .filter((metric) => metric.id !== "revenue")
        .map((metric) => ({
          label: metric.label,
          monthly: metric.current,
          pending: metric.pending ?? 0,
        })),
    [metrics]
  );

  const summaryCards = useMemo(
    () => [
      {
        id: "users",
        title: t("admin.analytics.summary.cards.users"),
        value: formatNumberValue(stats.totalUsers, numberLocale),
        icon: Users,
        color: "bg-gradient-to-br from-primary to-emerald-400",
        change: Math.round(stats.currentMonthVsLastMonthUsers),
        current: stats.currentMonthUsers,
      },
      {
        id: "services",
        title: t("admin.analytics.summary.cards.services"),
        value: formatNumberValue(stats.activeServices, numberLocale),
        icon: FileText,
        color: "bg-gradient-to-br from-blue-500 to-cyan-400",
        change: Math.round(stats.currentMonthVsLastMonthServices),
        current: stats.currentMonthServices,
      },
      {
        id: "revenue",
        title: t("admin.analytics.summary.cards.revenue"),
        value: <PriceDisplay value={stats.totalRevenue} currency="USD" />,
        icon: DollarSign,
        color: "bg-gradient-to-br from-purple-500 to-pink-400",
        change: Math.round(stats.currentMonthVsLastMonthRevenue),
        current: stats.currentMonthRevenue,
        isCurrency: true,
      },
      {
        id: "projects",
        title: t("admin.analytics.summary.cards.projects"),
        value: formatNumberValue(stats.totalProjects, numberLocale),
        icon: FolderKanban,
        color: "bg-gradient-to-br from-orange-500 to-red-400",
        change: Math.round(stats.currentMonthVsLastMonthProjects),
        current: stats.currentMonthProjects,
      },
    ],
    [numberLocale, stats, t]
  );

  const keyMetrics = useMemo<KeyMetricRow[]>(() => {
    const pendingLoad = stats.pendingUsers + stats.pendingServices + stats.pendingCalls;
    const revenuePerProject =
      stats.totalProjects > 0 ? stats.totalRevenue / stats.totalProjects : 0;
    const projectClearanceRate =
      stats.totalProjects > 0
        ? ((stats.totalProjects - stats.totalPendingProjects) / stats.totalProjects) * 100
        : 0;

    return [
      {
        id: "user-growth",
        label: t("admin.analytics.key_metrics.items.user_growth"),
        value: `${stats.currentMonthVsLastMonthUsers > 0 ? "+" : ""}${Math.round(
          stats.currentMonthVsLastMonthUsers
        )}%`,
        helper: t("admin.analytics.key_metrics.helpers.growth_signal"),
        tone: stats.currentMonthVsLastMonthUsers >= 0 ? "success" : "warning",
      },
      {
        id: "service-growth",
        label: t("admin.analytics.key_metrics.items.service_growth"),
        value: `${stats.currentMonthVsLastMonthServices > 0 ? "+" : ""}${Math.round(
          stats.currentMonthVsLastMonthServices
        )}%`,
        helper: t("admin.analytics.key_metrics.helpers.growth_signal"),
        tone: stats.currentMonthVsLastMonthServices >= 0 ? "success" : "warning",
      },
      {
        id: "revenue-growth",
        label: t("admin.analytics.key_metrics.items.revenue_growth"),
        value: `${stats.currentMonthVsLastMonthRevenue > 0 ? "+" : ""}${Math.round(
          stats.currentMonthVsLastMonthRevenue
        )}%`,
        helper: t("admin.analytics.key_metrics.helpers.growth_signal"),
        tone: stats.currentMonthVsLastMonthRevenue >= 0 ? "success" : "warning",
      },
      {
        id: "avg-revenue",
        label: t("admin.analytics.key_metrics.items.avg_revenue_per_project"),
        value: <PriceDisplay value={revenuePerProject} currency="USD" />,
        helper: t("admin.analytics.key_metrics.helpers.unit_economics"),
        tone: "default",
      },
      {
        id: "project-clearance",
        label: t("admin.analytics.key_metrics.items.project_clearance"),
        value: `${projectClearanceRate.toFixed(1)}%`,
        helper: t("admin.analytics.key_metrics.helpers.delivery_health"),
        tone: projectClearanceRate >= 75 ? "success" : "warning",
      },
      {
        id: "pending-load",
        label: t("admin.analytics.key_metrics.items.pending_load"),
        value: formatNumberValue(pendingLoad, numberLocale),
        helper: t("admin.analytics.key_metrics.helpers.review_queue"),
        tone: pendingLoad > 0 ? "warning" : "default",
      },
    ];
  }, [numberLocale, stats, t]);

  const performanceChartConfig: ChartConfig = {
    current: {
      label: t("admin.analytics.charts.legend.current"),
      color: "#1BC47D",
    },
    previous: {
      label: t("admin.analytics.charts.legend.previous"),
      color: "#94A3B8",
    },
  };

  const pipelineChartConfig: ChartConfig = {
    monthly: {
      label: t("admin.analytics.charts.legend.current"),
      color: "#1BC47D",
    },
    pending: {
      label: t("admin.analytics.charts.legend.pending"),
      color: "#F59E0B",
    },
  };

  const emptyAnalyticsState =
    !loading && !hasLoadedStats && !errorMessage ? (
      <div className="py-10 text-sm text-muted-foreground">
        {t("admin.analytics.empty_description")}
      </div>
    ) : null;

  const handleRefresh = () => {
    setReloadToken((currentToken) => currentToken + 1);
  };

  return (
    <ProjectAdminShell>
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <AdminPageHeader
          title={t("admin.analytics.manage_title")}
          description={t("admin.analytics.manage_subtitle")}
          action={
            <Button
              variant="outline"
              className="border-border bg-transparent"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCcw className={`mr-2 h-4 w-4${loading ? " animate-spin" : ""}`} />
              {t("admin.analytics.actions.refresh")}
            </Button>
          }
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card, index) => (
            <AdminSummaryCard
              key={card.id}
              title={card.title}
              value={card.value}
              icon={card.icon}
              colorClassName={card.color}
              delay={index * 0.08}
              badge={
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                    card.change >= 0
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                  }`}
                >
                  {card.change >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  {card.change > 0 ? "+" : ""}
                  {card.change}%
                </span>
              }
              footer={
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("admin.analytics.comparison.current_month")}
                  </span>
                  <span className="font-medium text-foreground">
                    <MetricValue
                      value={card.current}
                      isCurrency={card.isCurrency}
                      locale={numberLocale}
                    />
                  </span>
                </div>
              }
            />
          ))}
        </div>

        {errorMessage ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm font-medium text-destructive">
              {t("admin.analytics.error_prefix")}
              {errorMessage}
            </p>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <AdminSectionCard
            delay={0.18}
            title={t("admin.analytics.charts.performance_title")}
            description={t("admin.analytics.charts.performance_description")}
          >
            {loading ? (
              <div className="py-10 text-sm text-muted-foreground">
                {t("admin.analytics.loading")}
              </div>
            ) : emptyAnalyticsState ? (
              emptyAnalyticsState
            ) : (
              <>
                <div className="mb-6 grid gap-4 sm:grid-cols-3">
                  {comparisonChartData.map((metric) => (
                    <div
                      key={metric.label}
                      className="rounded-xl border border-border/60 bg-background/60 p-4"
                    >
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {metric.label}
                      </p>
                      <p className="mt-2 text-xl font-bold">
                        {formatNumberValue(metric.current, numberLocale)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("admin.analytics.charts.legend.previous")}:{" "}
                        {formatNumberValue(metric.previous, numberLocale)}
                      </p>
                    </div>
                  ))}
                </div>

                <ChartContainer
                  config={performanceChartConfig}
                  className="h-[300px] w-full"
                >
                  <LineChart
                    accessibilityLayer
                    data={comparisonChartData}
                    margin={{ left: 8, right: 8, top: 12, bottom: 8 }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={12}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={44}
                      tickFormatter={(value) => formatCompactValue(Number(value), numberLocale)}
                    />
                    <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Line
                      type="monotone"
                      dataKey="previous"
                      stroke="var(--color-previous)"
                      strokeWidth={2}
                      dot={{ fill: "var(--color-previous)", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="current"
                      stroke="var(--color-current)"
                      strokeWidth={2}
                      dot={{ fill: "var(--color-current)", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ChartContainer>
              </>
            )}
          </AdminSectionCard>

          <AdminSectionCard
            delay={0.24}
            title={t("admin.analytics.charts.distribution_title")}
            description={t("admin.analytics.charts.distribution_description")}
          >
            {loading ? (
              <div className="py-10 text-sm text-muted-foreground">
                {t("admin.analytics.loading")}
              </div>
            ) : emptyAnalyticsState ? (
              emptyAnalyticsState
            ) : (
              <>
                <div className="mb-6 flex items-center justify-between rounded-xl border border-border/60 bg-background/60 p-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {t("admin.analytics.pipeline.focus_label")}
                    </p>
                    <p className="mt-2 text-xl font-bold">
                      {formatNumberValue(
                        stats.pendingUsers + stats.pendingServices + stats.totalPendingProjects,
                        numberLocale
                      )}
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {t("admin.analytics.charts.legend.pending")}
                  </span>
                </div>

                <ChartContainer config={pipelineChartConfig} className="h-[300px] w-full">
                  <BarChart
                    accessibilityLayer
                    data={pipelineChartData}
                    margin={{ left: 8, right: 8, top: 12, bottom: 8 }}
                    barGap={10}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={12}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={44}
                      tickFormatter={(value) => formatCompactValue(Number(value), numberLocale)}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar
                      dataKey="monthly"
                      fill="var(--color-monthly)"
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar
                      dataKey="pending"
                      fill="var(--color-pending)"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </>
            )}
          </AdminSectionCard>
        </div>

        <AdminSectionCard
          delay={0.3}
          title={t("admin.analytics.key_metrics.title")}
          description={t("admin.analytics.key_metrics.description")}
        >
          {loading ? (
            <div className="py-10 text-sm text-muted-foreground">
              {t("admin.analytics.loading")}
            </div>
          ) : emptyAnalyticsState ? (
            emptyAnalyticsState
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {keyMetrics.map((metric) => (
                <div
                  key={metric.id}
                  className="rounded-xl border border-border/60 bg-background/60 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {metric.label}
                      </p>
                      <div className="mt-2 text-2xl font-bold">{metric.value}</div>
                    </div>
                    <span
                      className={`mt-1 inline-flex h-2.5 w-2.5 rounded-full ${
                        metric.tone === "success"
                          ? "bg-emerald-400"
                          : metric.tone === "warning"
                            ? "bg-amber-400"
                            : "bg-primary"
                      }`}
                    />
                  </div>
                  <p className="mt-4 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {metric.helper}
                  </p>
                </div>
              ))}
            </div>
          )}
        </AdminSectionCard>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <AdminSectionCard
            delay={0.36}
            title={t("admin.analytics.report_table.title")}
            description={t("admin.analytics.report_table.description")}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                      {t("admin.analytics.report_table.metric")}
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                      {t("admin.analytics.report_table.total")}
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                      {t("admin.analytics.report_table.current")}
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                      {t("admin.analytics.report_table.change")}
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                      {t("admin.analytics.report_table.pending")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? <AdminTableLoadingRow colSpan={5} /> : null}

                  {!loading &&
                    metrics.map((metric) => {
                      const Icon = METRIC_ICONS[metric.id];

                      return (
                        <tr
                          key={`${metric.id}-report`}
                          className="group border-b border-border/60 transition-colors hover:bg-secondary/20"
                        >
                          <td className="px-4 py-4 align-top">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-10 w-10 items-center justify-center rounded-lg ${METRIC_ICON_STYLES[metric.id]}`}
                              >
                                <Icon className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{metric.label}</p>
                                <p className="text-xs text-muted-foreground">
                                  {metric.isCurrency
                                    ? t("admin.analytics.report_table.stream_finance")
                                    : t("admin.analytics.report_table.stream_operational")}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top text-sm text-foreground">
                            <MetricValue
                              value={metric.total}
                              isCurrency={metric.isCurrency}
                              locale={numberLocale}
                            />
                          </td>
                          <td className="px-4 py-4 align-top text-sm text-foreground">
                            <MetricValue
                              value={metric.current}
                              isCurrency={metric.isCurrency}
                              locale={numberLocale}
                            />
                          </td>
                          <td className="px-4 py-4 align-top">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                                metric.change >= 0
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                  : "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                              }`}
                            >
                              {metric.change >= 0 ? (
                                <TrendingUp className="h-3.5 w-3.5" />
                              ) : (
                                <TrendingDown className="h-3.5 w-3.5" />
                              )}
                              {metric.change > 0 ? "+" : ""}
                              {metric.change}%
                            </span>
                          </td>
                          <td className="px-4 py-4 align-top text-sm text-muted-foreground">
                            {metric.pending == null ? (
                              "—"
                            ) : (
                              <MetricValue value={metric.pending} locale={numberLocale} />
                            )}
                          </td>
                        </tr>
                      );
                    })}

                  {!loading && !hasLoadedStats ? (
                    <AdminTableEmptyRow
                      colSpan={5}
                      icon={BarChart3}
                      title={t("admin.analytics.empty_title")}
                      description={t("admin.analytics.empty_description")}
                    />
                  ) : null}
                </tbody>
              </table>
            </div>
          </AdminSectionCard>

          <div className="space-y-6">
            <AdminSidebarCard
              icon={Activity}
              title={t("admin.analytics.sidebar.overview_title")}
              description={t("admin.analytics.sidebar.overview_description")}
              delay={0.42}
            >
              <div className="space-y-4">
                <AdminOverviewItem
                  label={t("admin.analytics.sidebar.revenue_now")}
                  valueClassName="text-primary"
                >
                  <PriceDisplay value={stats.currentMonthRevenue} currency="USD" />
                </AdminOverviewItem>
                <AdminOverviewItem
                  label={t("admin.analytics.sidebar.pending_reviews")}
                  value={formatNumberValue(
                    stats.pendingUsers + stats.pendingServices + stats.pendingCalls,
                    numberLocale
                  )}
                />
                <AdminOverviewItem
                  label={t("admin.analytics.sidebar.processed_projects")}
                  value={formatNumberValue(stats.totalProjects, numberLocale)}
                />
                <AdminOverviewItem
                  label={t("admin.analytics.sidebar.scheduled_calls")}
                  value={formatNumberValue(stats.totalScheduleCalls, numberLocale)}
                />
              </div>
            </AdminSidebarCard>

            <AdminSidebarCard
              icon={Clock3}
              title={t("admin.analytics.sidebar.reporting_title")}
              description={t("admin.analytics.sidebar.reporting_description")}
              delay={0.48}
            >
              <div className="space-y-4">
                <AdminOverviewItem
                  label={t("admin.analytics.sidebar.source")}
                  value={t("admin.analytics.sidebar.source_value")}
                />
                <AdminOverviewItem
                  label={t("admin.analytics.sidebar.coverage")}
                  value={t("admin.analytics.sidebar.coverage_value")}
                />
                <AdminOverviewItem
                  label={t("admin.analytics.sidebar.refresh")}
                  value={loading ? t("admin.analytics.loading") : t("admin.analytics.sidebar.live")}
                />
                <p className="text-xs leading-6 text-muted-foreground">
                  {t("admin.analytics.in_development_description")}
                </p>
              </div>
            </AdminSidebarCard>
          </div>
        </div>
      </div>
    </ProjectAdminShell>
  );
}
