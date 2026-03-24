"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity as ActivityIcon,
  BellRing,
  CircleDollarSign,
  FolderKanban,
  RefreshCcw,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import {
  getAdminActivityContextEntries,
  getAdminActivityMessage,
  getAdminActivityTypeKeys,
  getAdminActivityVisual,
} from "@/lib/admin-activity";
import apiClient, { type Activity, type ActivityPageResponse } from "@/lib/api";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSearchInput } from "@/components/admin/admin-search-input";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ActivityStatusFilter = "all" | "read" | "unread";

function formatActivityDate(value: string, locale: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function AdminActivitiesPage() {
  const locale = useLocale();
  const t = useTranslations();
  const dateLocale = locale === "ro" ? "ro-RO" : "en-US";
  const [activities, setActivities] = useState<Activity[]>([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<ActivityPageResponse["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | Activity["type"]>("all");
  const [statusFilter, setStatusFilter] = useState<ActivityStatusFilter>("all");

  useEffect(() => {
    let active = true;

    const fetchActivities = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.getActivities(page);
        if (!active) return;

        if (response?.data) {
          setActivities(response.data);
          setMeta(response.meta);
        } else {
          setActivities([]);
          setMeta(null);
          setError(t("admin.activity.error_message"));
        }
      } catch (fetchError) {
        console.error("Failed to fetch activities:", fetchError);
        if (!active) return;
        setActivities([]);
        setMeta(null);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : t("admin.activity.error_message")
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void fetchActivities();

    return () => {
      active = false;
    };
  }, [page, reloadToken, t]);

  const filteredActivities = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return activities.filter((activity) => {
      const message = getAdminActivityMessage(activity, t).toLowerCase();
      const category = t(
        `admin.activity.categories.${getAdminActivityVisual(activity.type).categoryKey}`
      ).toLowerCase();
      const typeLabel = t(`admin.activity.types.${activity.type}`).toLowerCase();
      const metadataValues = Object.values(activity.metadata || {})
        .map((value) => String(value).toLowerCase())
        .join(" ");
      const matchesSearch =
        !query ||
        [
          message,
          category,
          typeLabel,
          metadataValues,
          String(activity.id),
          activity.created_at_human.toLowerCase(),
        ].some((value) => value.includes(query));
      const matchesType = typeFilter === "all" || activity.type === typeFilter;
      const isRead = Boolean(activity.read_at);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "read" && isRead) ||
        (statusFilter === "unread" && !isRead);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [activities, searchTerm, statusFilter, t, typeFilter]);

  const summaryCards = useMemo(
    () => [
      {
        title: t("admin.activity.summary.cards.total"),
        value: meta?.total ?? activities.length,
        icon: ActivityIcon,
        color: "bg-gradient-to-br from-primary to-emerald-400",
      },
      {
        title: t("admin.activity.summary.cards.unread"),
        value: filteredActivities.filter((activity) => !activity.read_at).length,
        icon: BellRing,
        color: "bg-gradient-to-br from-amber-500 to-orange-400",
      },
      {
        title: t("admin.activity.summary.cards.finance"),
        value: filteredActivities.filter((activity) =>
          ["invoice_paid", "project_paid"].includes(activity.type)
        ).length,
        icon: CircleDollarSign,
        color: "bg-gradient-to-br from-emerald-500 to-teal-400",
      },
      {
        title: t("admin.activity.summary.cards.projects"),
        value: filteredActivities.filter((activity) =>
          ["project_created", "proposal_received"].includes(activity.type)
        ).length,
        icon: FolderKanban,
        color: "bg-gradient-to-br from-blue-500 to-cyan-400",
      },
    ],
    [activities.length, filteredActivities, meta?.total, t]
  );

  const currentPageSummary = useMemo(
    () => ({
      loadedCount: activities.length,
      unreadCount: activities.filter((activity) => !activity.read_at).length,
      lastPage: meta?.last_page ?? 1,
      totalCount: meta?.total ?? activities.length,
    }),
    [activities, meta?.last_page, meta?.total]
  );

  const handleRefresh = () => {
    setReloadToken((currentToken) => currentToken + 1);
  };

  return (
    <ProjectAdminShell>
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <AdminPageHeader
          title={t("admin.activity.manage_title")}
          description={t("admin.activity.manage_subtitle")}
          action={
            <Button
              variant="outline"
              className="border-border bg-transparent"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCcw className={`mr-2 h-4 w-4${loading ? " animate-spin" : ""}`} />
              {t("admin.activity.actions.refresh")}
            </Button>
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

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <AdminSectionCard
            delay={0.2}
            title={t("admin.activity.list_title")}
            description={t("admin.activity.list_description", {
              count: filteredActivities.length,
            })}
          >
            <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center">
              <AdminSearchInput
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t("admin.activity.search_placeholder")}
              />

              <Select
                value={typeFilter}
                onValueChange={(value) => setTypeFilter(value as "all" | Activity["type"])}
              >
                <SelectTrigger className="h-11 w-full border-border bg-transparent xl:w-56">
                  <SelectValue placeholder={t("admin.activity.filters.type_placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("admin.activity.filters.all_types")}
                  </SelectItem>
                  {getAdminActivityTypeKeys().map((activityType) => (
                    <SelectItem key={activityType} value={activityType}>
                      {t(`admin.activity.types.${activityType}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as ActivityStatusFilter)}
              >
                <SelectTrigger className="h-11 w-full border-border bg-transparent xl:w-52">
                  <SelectValue placeholder={t("admin.activity.filters.status_placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("admin.activity.filters.all_statuses")}
                  </SelectItem>
                  <SelectItem value="unread">
                    {t("admin.activity.filters.unread")}
                  </SelectItem>
                  <SelectItem value="read">
                    {t("admin.activity.filters.read")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error ? (
              <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
                <p className="text-sm font-medium text-destructive">
                  {t("admin.activity.error_prefix")}
                  {error}
                </p>
              </div>
            ) : null}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                      {t("admin.activity.table.event")}
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                      {t("admin.activity.table.context")}
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                      {t("admin.activity.table.category")}
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                      {t("admin.activity.table.recorded")}
                    </th>
                    <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                      {t("admin.activity.table.status")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? <AdminTableLoadingRow colSpan={5} /> : null}

                  {!loading &&
                    filteredActivities.map((activity) => {
                      const visual = getAdminActivityVisual(activity.type);
                      const Icon = visual.icon;
                      const contextEntries = getAdminActivityContextEntries(activity, t);
                      const isRead = Boolean(activity.read_at);

                      return (
                        <tr
                          key={activity.id}
                          className="border-b border-border/70 transition-colors hover:bg-secondary/20"
                        >
                          <td className="px-4 py-4 align-top">
                            <div className="flex min-w-[260px] items-start gap-3">
                              <div
                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${visual.iconBackgroundClassName}`}
                              >
                                <Icon className={`h-5 w-5 ${visual.iconClassName}`} />
                              </div>
                              <div className="space-y-2">
                                <p className="font-medium text-foreground">
                                  {getAdminActivityMessage(activity, t)}
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className={`border ${visual.badgeClassName}`}
                                  >
                                    {t(`admin.activity.types.${activity.type}`)}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {t("admin.activity.table.event_id", { id: activity.id })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <div className="min-w-[220px] space-y-2">
                              {contextEntries.length ? (
                                contextEntries.map((entry) => (
                                  <div key={`${activity.id}-${entry.label}`} className="space-y-1">
                                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                      {entry.label}
                                    </p>
                                    <p className="text-sm text-foreground">{entry.value}</p>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  {t("admin.activity.table.metadata_empty")}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <Badge
                              variant="outline"
                              className={`border ${visual.badgeClassName}`}
                            >
                              {t(
                                `admin.activity.categories.${visual.categoryKey}`
                              )}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <div className="min-w-[170px] space-y-1">
                              <p className="text-sm font-medium text-foreground">
                                {formatActivityDate(activity.created_at, dateLocale)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {activity.created_at_human}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <Badge
                              variant="outline"
                              className={
                                isRead
                                  ? "border-border bg-background/60 text-muted-foreground"
                                  : "border-primary/20 bg-primary/10 text-primary"
                              }
                            >
                              {isRead
                                ? t("admin.activity.table.status_read")
                                : t("admin.activity.table.status_unread")}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}

                  {!loading && filteredActivities.length === 0 ? (
                    <AdminTableEmptyRow
                      colSpan={5}
                      icon={ActivityIcon}
                      title={t("admin.activity.empty_title")}
                      description={t("admin.activity.empty_description")}
                    />
                  ) : null}
                </tbody>
              </table>
            </div>

            {meta && meta.last_page > 1 ? (
              <div className="mt-6 border-t border-border pt-6">
                <div className="mb-4 flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <p>
                    {t("admin.activity.pagination.page", {
                      page,
                      lastPage: meta.last_page,
                    })}
                  </p>
                  <p>{t("admin.activity.pagination.total", { total: meta.total })}</p>
                </div>

                <Pagination className="justify-start">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          if (page > 1 && !loading) {
                            setPage((currentPage) => currentPage - 1);
                          }
                        }}
                        className={
                          page === 1 || loading
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          if (page < meta.last_page && !loading) {
                            setPage((currentPage) => currentPage + 1);
                          }
                        }}
                        className={
                          page === meta.last_page || loading
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            ) : null}
          </AdminSectionCard>

          <div className="space-y-6">
            <AdminSidebarCard
              icon={ActivityIcon}
              title={t("admin.activity.sidebar_title")}
              description={t("admin.activity.sidebar_description")}
              delay={0.28}
            >
              <div className="space-y-4">
                <AdminOverviewItem
                  label={t("admin.activity.sidebar.page")}
                  value={String(page)}
                />
                <AdminOverviewItem
                  label={t("admin.activity.sidebar.loaded")}
                  value={String(currentPageSummary.loadedCount)}
                />
                <AdminOverviewItem
                  label={t("admin.activity.sidebar.total")}
                  value={String(currentPageSummary.totalCount)}
                />
                <AdminOverviewItem
                  label={t("admin.activity.sidebar.unread")}
                  value={String(currentPageSummary.unreadCount)}
                  valueClassName="text-primary"
                />
                <AdminOverviewItem
                  label={t("admin.activity.sidebar.last_page")}
                  value={String(currentPageSummary.lastPage)}
                />
              </div>
            </AdminSidebarCard>

            <AdminSidebarCard
              icon={BellRing}
              title={t("admin.activity.legend_title")}
              description={t("admin.activity.legend_description")}
              delay={0.34}
            >
              <div className="space-y-3">
                {getAdminActivityTypeKeys().map((activityType) => {
                  const visual = getAdminActivityVisual(activityType);
                  const Icon = visual.icon;

                  return (
                    <div
                      key={activityType}
                      className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/50 p-3"
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${visual.iconBackgroundClassName}`}
                      >
                        <Icon className={`h-4 w-4 ${visual.iconClassName}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {t(`admin.activity.types.${activityType}`)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t(
                            `admin.activity.categories.${visual.categoryKey}`
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <p className="text-xs leading-6 text-muted-foreground">
                  {t("admin.activity.sidebar.refresh_note")}
                </p>
              </div>
            </AdminSidebarCard>
          </div>
        </div>
      </div>
    </ProjectAdminShell>
  );
}
