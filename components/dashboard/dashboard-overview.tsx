"use client";

import { useMemo, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  CheckCircle,
  DollarSign,
  Eye,
  FolderKanban,
  MessageSquare,
  MoreVertical,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
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
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DashboardStatsResponse, RecentActivityQuick } from "@/lib/api";
import {
  getNewProjectHref,
  getProviderProfileHref,
} from "@/lib/dashboard-navigation";
import { getProviderServicesSelectHref } from "@/lib/provider-services-wizard";

type DashboardOverviewProps = {
  isProvider: boolean;
  userDisplayName: string;
  stats: DashboardStatsResponse | null;
  loadingStats: boolean;
  overviewProjects: any[];
  loadingOverviewProjects: boolean;
  overviewProjectsError: string;
  recentActivities: RecentActivityQuick[];
  loadingRecentActivities: boolean;
  recentActivitiesError: string;
  providerServicesCount: number;
  financeSlotCount: number;
  onTabChange: (tab: "overview" | "projects" | "services" | "messages" | "settings" | "finance") => void;
  onOpenProject: (projectId: string | number) => void;
};

type OverviewCard = {
  title: string;
  value: ReactNode;
  current: number;
  previous: number;
  deltaText: string;
  deltaPositive: boolean;
  footer: string;
  icon: LucideIcon;
  colorClassName: string;
  chartLabel: string;
};

type ActivityMixDatum = {
  label: string;
  value: number;
};

type ProjectTableRow = {
  id: string;
  title: string;
  budgetAmount: number | null;
  budgetCurrency: string;
  status: string;
  dateLabel: string;
};

type QuickAction = {
  label: string;
  icon: string;
  action: () => void;
};

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function derivePreviousValue(current: number, change: number, changeType?: string) {
  if (!Number.isFinite(current)) return 0;

  switch (changeType) {
    case "increase":
      return Math.max(0, current - change);
    case "decrease":
      return Math.max(0, current + Math.abs(change));
    default:
      return Math.max(0, current);
  }
}

function formatSignedValue(value: number) {
  if (value > 0) return `+${value}`;
  return String(value);
}

function formatProjectStatus(status: string) {
  return status
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function getProjectStatusStyles(status: string) {
  switch (status) {
    case "COMPLETED":
    case "ACCEPTED":
    case "FINISHED":
      return "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400";
    case "IN_PROGRESS":
    case "WORK_IN_PROGRESS":
      return "bg-sky-500/20 text-sky-600 dark:text-sky-400";
    case "PENDING":
    case "PENDING_RESPONSES":
    case "BUDGET_PROPOSED":
      return "bg-amber-500/20 text-amber-600 dark:text-amber-400";
    case "REJECTED":
    case "CANCELLED":
      return "bg-destructive/20 text-destructive";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function resolveProjectBudget(project: any) {
  if (project?.budget && typeof project.budget === "object") {
    return {
      amount: toFiniteNumber(project.budget.amount),
      currency: String(project.budget.currency ?? project.currency ?? "USD").toUpperCase(),
    };
  }

  return {
    amount: toFiniteNumber(project?.budget),
    currency: String(project?.currency ?? "USD").toUpperCase(),
  };
}

function resolveActivityBucket(
  activity: RecentActivityQuick,
  t: ReturnType<typeof useTranslations>
) {
  const source = String(activity.action ?? activity.type ?? "").toLowerCase();

  if (
    source.includes("invoice") ||
    source.includes("budget") ||
    source.includes("payment")
  ) {
    return t("dashboard.overview_page.charts.groups.finance");
  }

  if (
    source.includes("proposal") ||
    source.includes("provider") ||
    source.includes("client")
  ) {
    return t("dashboard.overview_page.charts.groups.collaboration");
  }

  if (
    source.includes("milestone") ||
    source.includes("deliverable") ||
    source.includes("work")
  ) {
    return t("dashboard.overview_page.charts.groups.delivery");
  }

  if (source.includes("project")) {
    return t("dashboard.overview_page.charts.groups.projects");
  }

  return t("dashboard.overview_page.charts.groups.system");
}

export function DashboardOverview({
  isProvider,
  userDisplayName,
  stats,
  loadingStats,
  overviewProjects,
  loadingOverviewProjects,
  overviewProjectsError,
  recentActivities,
  loadingRecentActivities,
  recentActivitiesError,
  providerServicesCount,
  financeSlotCount,
  onTabChange,
  onOpenProject,
}: DashboardOverviewProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const numberLocale = locale === "ro" ? "ro-RO" : "en-US";
  const dateLocale = locale === "ro" ? "ro-RO" : "en-US";
  const userFirstName = userDisplayName.trim().split(/\s+/)[0] || userDisplayName;
  const chartConfig = useMemo<ChartConfig>(
    () => ({
      previous: {
        label: t("dashboard.overview_page.charts.previous"),
        color: "#94A3B8",
      },
      current: {
        label: t("dashboard.overview_page.charts.current"),
        color: "#1BC47D",
      },
    }),
    [t]
  );
  const mixChartConfig = useMemo<ChartConfig>(
    () => ({
      value: {
        label: t("dashboard.overview_page.charts.value"),
        color: "#1BC47D",
      },
    }),
    [t]
  );

  const cards = useMemo<OverviewCard[]>(() => {
    if (isProvider) {
      const providerStats = stats?.role === "provider" ? stats.stats : null;

      return [
        {
          title: t("dashboard.overview.provider.active_projects.title"),
          value: providerStats
            ? new Intl.NumberFormat(numberLocale).format(providerStats.active_projects.value)
            : t("dashboard.overview.provider.active_projects.value"),
          current: providerStats?.active_projects.value ?? 0,
          previous: providerStats
            ? derivePreviousValue(
                providerStats.active_projects.value,
                providerStats.active_projects.change,
                providerStats.active_projects.change_type
              )
            : 0,
          deltaText: providerStats
            ? formatSignedValue(providerStats.active_projects.change)
            : t("dashboard.overview.provider.active_projects.change"),
          deltaPositive: (providerStats?.active_projects.change ?? 0) >= 0,
          footer: t("dashboard.overview_page.cards.footer"),
          icon: Briefcase,
          colorClassName: "bg-gradient-to-br from-primary to-emerald-400",
          chartLabel: t("dashboard.overview.provider.active_projects.title"),
        },
        {
          title: t("dashboard.overview.provider.monthly_revenue.title"),
          value: providerStats ? (
            <PriceDisplay
              value={providerStats.monthly_revenue.value}
              currency={providerStats.monthly_revenue.currency}
            />
          ) : (
            t("dashboard.overview.provider.monthly_revenue.value")
          ),
          current: providerStats?.monthly_revenue.value ?? 0,
          previous: providerStats
            ? derivePreviousValue(
                providerStats.monthly_revenue.value,
                providerStats.monthly_revenue.change,
                providerStats.monthly_revenue.change_type
              )
            : 0,
          deltaText: providerStats
            ? `${providerStats.monthly_revenue.change_percentage > 0 ? "+" : ""}${providerStats.monthly_revenue.change_percentage}%`
            : t("dashboard.overview.provider.monthly_revenue.change"),
          deltaPositive: (providerStats?.monthly_revenue.change_percentage ?? 0) >= 0,
          footer: t("dashboard.overview_page.cards.footer"),
          icon: DollarSign,
          colorClassName: "bg-gradient-to-br from-blue-500 to-cyan-400",
          chartLabel: t("dashboard.overview.provider.monthly_revenue.title"),
        },
        {
          title: t("dashboard.overview.provider.average_rating.title"),
          value: providerStats
            ? providerStats.average_rating.value.toFixed(1)
            : t("dashboard.overview.provider.average_rating.value"),
          current: providerStats?.average_rating.value ?? 0,
          previous: providerStats
            ? derivePreviousValue(
                providerStats.average_rating.value,
                providerStats.average_rating.change,
                providerStats.average_rating.change_type
              )
            : 0,
          deltaText: providerStats
            ? formatSignedValue(providerStats.average_rating.change)
            : t("dashboard.overview.provider.average_rating.change"),
          deltaPositive: (providerStats?.average_rating.change ?? 0) >= 0,
          footer: t("dashboard.overview_page.cards.footer"),
          icon: Star,
          colorClassName: "bg-gradient-to-br from-purple-500 to-pink-400",
          chartLabel: t("dashboard.overview.provider.average_rating.title"),
        },
        {
          title: t("dashboard.overview.provider.new_requests.title"),
          value: providerStats
            ? new Intl.NumberFormat(numberLocale).format(providerStats.new_requests.value)
            : t("dashboard.overview.provider.new_requests.value"),
          current: providerStats?.new_requests.value ?? 0,
          previous: providerStats
            ? derivePreviousValue(
                providerStats.new_requests.value,
                providerStats.new_requests.change,
                providerStats.new_requests.change_type
              )
            : 0,
          deltaText: providerStats
            ? formatSignedValue(providerStats.new_requests.change)
            : t("dashboard.overview.provider.new_requests.change"),
          deltaPositive: (providerStats?.new_requests.change ?? 0) >= 0,
          footer: t("dashboard.overview_page.cards.footer"),
          icon: MessageSquare,
          colorClassName: "bg-gradient-to-br from-orange-500 to-red-400",
          chartLabel: t("dashboard.overview.provider.new_requests.title"),
        },
      ];
    }

    const clientStats = stats?.role === "client" ? stats.stats : null;

    return [
      {
        title: t("dashboard.overview.client.projects_posted.title"),
        value: clientStats
          ? new Intl.NumberFormat(numberLocale).format(clientStats.projects_posted.value)
          : t("dashboard.overview.client.projects_posted.value"),
        current: clientStats?.projects_posted.value ?? 0,
        previous: clientStats
          ? derivePreviousValue(
              clientStats.projects_posted.value,
              clientStats.projects_posted.change,
              clientStats.projects_posted.change_type
            )
          : 0,
        deltaText: clientStats
          ? formatSignedValue(clientStats.projects_posted.change)
          : t("dashboard.overview.client.projects_posted.change"),
        deltaPositive: (clientStats?.projects_posted.change ?? 0) >= 0,
        footer: t("dashboard.overview_page.cards.footer"),
        icon: FolderKanban,
        colorClassName: "bg-gradient-to-br from-primary to-emerald-400",
        chartLabel: t("dashboard.overview.client.projects_posted.title"),
      },
      {
        title: t("dashboard.overview.client.budget_spent.title"),
        value: clientStats ? (
          <PriceDisplay
            value={clientStats.budget_spent.value}
            currency={clientStats.budget_spent.currency}
          />
        ) : (
          t("dashboard.overview.client.budget_spent.value")
        ),
        current: clientStats?.budget_spent.value ?? 0,
        previous: clientStats
          ? derivePreviousValue(
              clientStats.budget_spent.value,
              clientStats.budget_spent.change,
              clientStats.budget_spent.change_type
            )
          : 0,
        deltaText: clientStats
          ? `${clientStats.budget_spent.change_percentage > 0 ? "+" : ""}${clientStats.budget_spent.change_percentage}%`
          : t("dashboard.overview.client.budget_spent.change"),
        deltaPositive: (clientStats?.budget_spent.change_percentage ?? 0) >= 0,
        footer: t("dashboard.overview_page.cards.footer"),
        icon: DollarSign,
        colorClassName: "bg-gradient-to-br from-blue-500 to-cyan-400",
        chartLabel: t("dashboard.overview.client.budget_spent.title"),
      },
      {
        title: t("dashboard.overview.client.projects_completed.title"),
        value: clientStats
          ? new Intl.NumberFormat(numberLocale).format(clientStats.projects_completed.value)
          : t("dashboard.overview.client.projects_completed.value"),
        current: clientStats?.projects_completed.value ?? 0,
        previous: clientStats
          ? derivePreviousValue(
              clientStats.projects_completed.value,
              clientStats.projects_completed.change,
              clientStats.projects_completed.change_type
            )
          : 0,
        deltaText: clientStats
          ? formatSignedValue(clientStats.projects_completed.change)
          : t("dashboard.overview.client.projects_completed.change"),
        deltaPositive: (clientStats?.projects_completed.change ?? 0) >= 0,
        footer: t("dashboard.overview_page.cards.footer"),
        icon: CheckCircle,
        colorClassName: "bg-gradient-to-br from-purple-500 to-pink-400",
        chartLabel: t("dashboard.overview.client.projects_completed.title"),
      },
      {
        title: t("dashboard.overview.client.active_providers.title"),
        value: clientStats
          ? new Intl.NumberFormat(numberLocale).format(clientStats.active_providers.value)
          : t("dashboard.overview.client.active_providers.value"),
        current: clientStats?.active_providers.value ?? 0,
        previous: clientStats
          ? derivePreviousValue(
              clientStats.active_providers.value,
              clientStats.active_providers.change,
              clientStats.active_providers.change_type
            )
          : 0,
        deltaText: clientStats
          ? formatSignedValue(clientStats.active_providers.change)
          : t("dashboard.overview.client.active_providers.change"),
        deltaPositive: (clientStats?.active_providers.change ?? 0) >= 0,
        footer: t("dashboard.overview_page.cards.footer"),
        icon: Users,
        colorClassName: "bg-gradient-to-br from-orange-500 to-red-400",
        chartLabel: t("dashboard.overview.client.active_providers.title"),
      },
    ];
  }, [isProvider, numberLocale, stats, t]);

  const performanceData = useMemo(
    () =>
      cards.map((card) => ({
        label: card.chartLabel,
        current: card.current,
        previous: card.previous,
      })),
    [cards]
  );

  const activityMixData = useMemo<ActivityMixDatum[]>(() => {
    const bucketCounts = recentActivities.reduce((accumulator, activity) => {
      const bucket = resolveActivityBucket(activity, t);
      accumulator.set(bucket, (accumulator.get(bucket) ?? 0) + 1);
      return accumulator;
    }, new Map<string, number>());

    const fromRecentActivity = Array.from(bucketCounts.entries()).map(([label, value]) => ({
      label,
      value,
    }));

    if (fromRecentActivity.length > 0) {
      return fromRecentActivity.slice(0, 4);
    }

    if (isProvider) {
      return [
        {
          label: t("dashboard.tabs.projects"),
          value: overviewProjects.length,
        },
        {
          label: t("dashboard.tabs.services"),
          value: providerServicesCount,
        },
        {
          label: t("dashboard.activity.title"),
          value: recentActivities.length,
        },
        {
          label: t("dashboard.tabs.finance"),
          value: financeSlotCount,
        },
      ];
    }

    const clientStats = stats?.role === "client" ? stats.stats : null;

    return [
      {
        label: t("dashboard.tabs.projects"),
        value: overviewProjects.length,
      },
      {
        label: t("dashboard.activity.title"),
        value: recentActivities.length,
      },
      {
        label: t("dashboard.overview.client.active_providers.title"),
        value: clientStats?.active_providers.value ?? 0,
      },
      {
        label: t("dashboard.overview.client.projects_completed.title"),
        value: clientStats?.projects_completed.value ?? 0,
      },
    ];
  }, [financeSlotCount, isProvider, overviewProjects.length, providerServicesCount, recentActivities, stats, t]);

  const recentProjectRows = useMemo<ProjectTableRow[]>(
    () =>
      overviewProjects.map((project) => {
        const budget = resolveProjectBudget(project);
        const rawStatus = String(project?.status ?? "pending").trim().toUpperCase();
        const projectDate = new Date(project?.updated_at ?? project?.created_at ?? Date.now());

        return {
          id: String(project?.id ?? Math.random()),
          title: String(project?.title ?? t("dashboard.overview_page.table.untitled_project")),
          budgetAmount: budget.amount,
          budgetCurrency: budget.currency,
          status: rawStatus,
          dateLabel: Number.isNaN(projectDate.getTime())
            ? "—"
            : new Intl.DateTimeFormat(dateLocale, {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(projectDate),
        };
      }),
    [dateLocale, overviewProjects, t]
  );

  const quickActions = useMemo<QuickAction[]>(() => {
    if (isProvider) {
      return [
        {
          label: t("dashboard.quick_actions.provider.add_services"),
          icon: "↗️",
          action: () => router.push(getProviderServicesSelectHref({ reset: true })),
        },
        {
          label: t("dashboard.quick_actions.provider.edit_profile"),
          icon: "👤",
          action: () => router.push(getProviderProfileHref()),
        },
        {
          label: t("dashboard.quick_actions.provider.take_tests"),
          icon: "🧪",
          action: () => router.push("/tests"),
        },
        {
          label: t("dashboard.tabs.finance"),
          icon: "💰",
          action: () => onTabChange("finance"),
        },
      ];
    }

    return [
      {
        label: t("dashboard.quick_actions.client.new_project"),
        icon: "↗️",
        action: () => router.push(getNewProjectHref()),
      },
      {
        label: t("dashboard.quick_actions.client.search_services"),
        icon: "🔎",
        action: () => router.push("/services"),
      },
      {
        label: t("dashboard.quick_actions.client.explore_projects"),
        icon: "📁",
        action: () => router.push("/projects"),
      },
      {
        label: t("dashboard.tabs.messages"),
        icon: "💬",
        action: () => onTabChange("messages"),
      },
    ];
  }, [isProvider, onTabChange, router, t]);

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold">{t("dashboard.hero.welcome", { name: userFirstName })}</h1>
          <p className="mt-2 text-muted-foreground">
            {isProvider
              ? t("dashboard.hero.subtitle.provider")
              : t("dashboard.hero.subtitle.client")}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="hidden items-center space-x-2 rounded-lg px-4 py-2 transition-colors hover:bg-secondary sm:flex"
        >
          <MoreVertical className="h-5 w-5 text-muted-foreground" />
        </motion.button>
      </motion.div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => {
          const Icon = card.icon;

          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className="glass-effect rounded-2xl border border-border p-6 transition-all duration-300 hover:border-primary/40"
            >
              <div className="mb-4 flex items-start justify-between">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.colorClassName}`}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div
                  className={`flex items-center space-x-1 rounded-full px-3 py-1 text-sm font-medium ${
                    card.deltaPositive
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      : "bg-destructive/20 text-destructive"
                  }`}
                >
                  {card.deltaPositive ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownLeft className="h-4 w-4" />
                  )}
                  <span>{card.deltaText}</span>
                </div>
              </div>

              <h3 className="mb-2 text-sm font-medium text-muted-foreground">{card.title}</h3>
              <p className="mb-4 text-3xl font-bold">{card.value}</p>

              <div className="text-xs text-muted-foreground">{card.footer}</div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="glass-effect rounded-2xl border border-border p-6"
        >
          <div className="mb-6">
            <h3 className="mb-1 text-lg font-bold">
              {t("dashboard.overview_page.charts.performance_title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("dashboard.overview_page.charts.performance_description")}
            </p>
          </div>

          {loadingStats || !stats ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              {t("dashboard.loading.dashboard")}
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart
                accessibilityLayer
                data={performanceData}
                margin={{ left: 8, right: 8, top: 12, bottom: 8 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={12} />
                <YAxis tickLine={false} axisLine={false} width={44} />
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
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="glass-effect rounded-2xl border border-border p-6"
        >
          <div className="mb-6">
            <h3 className="mb-1 text-lg font-bold">
              {t("dashboard.overview_page.charts.mix_title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("dashboard.overview_page.charts.mix_description")}
            </p>
          </div>

          {loadingRecentActivities ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              {t("dashboard.loading.projects")}
            </div>
          ) : (
            <ChartContainer config={mixChartConfig} className="h-[300px] w-full">
              <BarChart
                accessibilityLayer
                data={activityMixData}
                margin={{ left: 8, right: 8, top: 12, bottom: 8 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={12} />
                <YAxis tickLine={false} axisLine={false} width={44} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="value" fill="var(--color-value)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
          {recentActivitiesError ? (
            <p className="mt-4 text-xs text-amber-500">{recentActivitiesError}</p>
          ) : null}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="glass-effect rounded-2xl border border-border p-6"
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="mb-1 text-lg font-bold">
              {t("dashboard.overview_page.table.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t("dashboard.overview_page.table.description")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onTabChange("projects")}
            className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            {t("dashboard.overview_page.table.view_all")}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                  {t("dashboard.overview_page.table.project")}
                </th>
                <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                  {t("dashboard.overview_page.table.budget")}
                </th>
                <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                  {t("dashboard.overview_page.table.status")}
                </th>
                <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                  {t("dashboard.overview_page.table.updated")}
                </th>
                <th className="px-4 py-4 text-center text-sm font-medium text-muted-foreground">
                  {t("dashboard.overview_page.table.action")}
                </th>
              </tr>
            </thead>
            <tbody>
              {loadingOverviewProjects ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-muted-foreground">
                    {t("dashboard.loading.projects")}
                  </td>
                </tr>
              ) : recentProjectRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <div className="text-center">
                      <Briefcase className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                      <h3 className="text-lg font-medium">
                        {t("dashboard.overview_page.table.empty_title")}
                      </h3>
                      <p className="mt-2 text-muted-foreground">
                        {t("dashboard.overview_page.table.empty_description")}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                recentProjectRows.map((project, index) => (
                  <motion.tr
                    key={project.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.05, duration: 0.4 }}
                    className="group border-b border-border/50 transition-colors hover:bg-secondary/30"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <FolderKanban className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{project.title}</p>
                          <p className="text-xs text-muted-foreground">ID: {project.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {project.budgetAmount == null ? (
                        <span className="text-sm text-muted-foreground">
                          {t("dashboard.overview_page.table.no_budget")}
                        </span>
                      ) : (
                        <div className="flex items-center space-x-1 text-foreground">
                          <ArrowUpRight className="h-4 w-4 text-primary" />
                          <span className="font-semibold">
                            <PriceDisplay
                              value={project.budgetAmount}
                              currency={project.budgetCurrency}
                            />
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getProjectStatusStyles(project.status)}`}
                      >
                        {formatProjectStatus(project.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">
                      {project.dateLabel}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => onOpenProject(project.id)}
                        className="rounded-lg p-2 opacity-0 transition-opacity hover:bg-secondary group-hover:opacity-100"
                        aria-label={t("dashboard.overview_page.table.view")}
                      >
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {overviewProjectsError ? (
          <p className="mt-4 text-xs text-amber-500">{overviewProjectsError}</p>
        ) : null}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="glass-effect rounded-2xl border border-border p-6"
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="mb-1 text-lg font-bold">{t("dashboard.quick_actions.title")}</h3>
            <p className="text-sm text-muted-foreground">
              {isProvider
                ? t("dashboard.quick_actions.description.provider")
                : t("dashboard.quick_actions.description.client")}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.label}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.05, duration: 0.4 }}
              onClick={action.action}
              className="glass-effect rounded-xl border border-border p-4 text-left transition-all duration-200 hover:border-primary/40 active:scale-95"
            >
              <div className="mb-2 text-2xl">{action.icon}</div>
              <p className="text-sm font-medium">{action.label}</p>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
