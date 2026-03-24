"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import {
  ChevronDown,
  ChevronUp,
  History,
  PencilLine,
  PlusCircle,
  Search,
  Trash2,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import {
  formatAuditSubjectType,
  formatAuditValue,
  getAuditDiffEntries,
  getAuditEventVisual,
} from "@/lib/admin-audit-logs";
import apiClient, { type AuditLog, type AuditLogFilters } from "@/lib/api";
import { AdminOverviewItem, AdminSidebarCard } from "@/components/admin/admin-sidebar-card";
import { AdminSearchInput } from "@/components/admin/admin-search-input";
import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { AdminSummaryCard } from "@/components/admin/admin-summary-card";
import {
  AdminTableEmptyRow,
  AdminTableLoadingRow,
} from "@/components/admin/admin-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

function formatAuditTimestamp(value: string, locale: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function buildDefaultDateRange() {
  const today = new Date();
  return {
    from: format(addDays(today, -30), "yyyy-MM-dd"),
    to: format(today, "yyyy-MM-dd"),
  };
}

export default function AuditLogsTable() {
  const locale = useLocale();
  const t = useTranslations();
  const dateLocale = locale === "ro" ? "ro-RO" : "en-US";
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AuditLogFilters>({
    page: 1,
    event: undefined,
    user_id: undefined,
    subject_type: undefined,
  });
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState(buildDefaultDateRange);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const apiFilters: AuditLogFilters = {
        ...filters,
        date_from: dateRange.from || undefined,
        date_to: dateRange.to || undefined,
      };
      const response = await apiClient.fetchAuditLogs(apiFilters);

      if (response?.data) {
        setLogs(response.data);
        setMeta(response.meta);
      } else {
        setLogs([]);
        setMeta({ current_page: 1, last_page: 1, total: 0 });
        setError(t("admin.audit_logs.error_message"));
      }
    } catch (fetchError) {
      console.error("Failed to fetch audit logs", fetchError);
      setLogs([]);
      setMeta({ current_page: 1, last_page: 1, total: 0 });
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : t("admin.audit_logs.error_message")
      );
    } finally {
      setLoading(false);
    }
  }, [dateRange.from, dateRange.to, filters, t]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  const subjectTypeOptions = useMemo(() => {
    const values = new Set<string>();

    logs.forEach((log) => {
      if (log.subject_type) {
        values.add(log.subject_type);
      }
    });

    if (filters.subject_type) {
      values.add(filters.subject_type);
    }

    return Array.from(values).sort((left, right) => left.localeCompare(right));
  }, [filters.subject_type, logs]);

  const filteredLogs = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return logs.filter((log) => {
      if (!query) return true;

      return [
        log.actor_name,
        log.action,
        log.event,
        formatAuditSubjectType(log.subject_type),
        String(log.subject_id),
        log.ip,
        String(log.id),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [logs, searchTerm]);

  const summaryCards = useMemo(
    () => [
      {
        title: t("admin.audit_logs.summary.cards.total"),
        value: meta.total,
        icon: History,
        color: "bg-gradient-to-br from-primary to-emerald-400",
      },
      {
        title: t("admin.audit_logs.summary.cards.created"),
        value: filteredLogs.filter((log) => log.event === "created").length,
        icon: PlusCircle,
        color: "bg-gradient-to-br from-emerald-500 to-lime-400",
      },
      {
        title: t("admin.audit_logs.summary.cards.updated"),
        value: filteredLogs.filter((log) => log.event === "updated").length,
        icon: PencilLine,
        color: "bg-gradient-to-br from-blue-500 to-cyan-400",
      },
      {
        title: t("admin.audit_logs.summary.cards.deleted"),
        value: filteredLogs.filter((log) => log.event === "deleted").length,
        icon: Trash2,
        color: "bg-gradient-to-br from-rose-500 to-red-400",
      },
    ],
    [filteredLogs, meta.total, t]
  );

  const toggleRow = (id: number) => {
    setExpandedRows((currentRows) =>
      currentRows.includes(id)
        ? currentRows.filter((rowId) => rowId !== id)
        : [...currentRows, id]
    );
  };

  const handleSearch = () => {
    const numericUserId = Number.parseInt(searchTerm.trim(), 10);

    setFilters((currentFilters) => ({
      ...currentFilters,
      user_id: Number.isNaN(numericUserId) ? undefined : numericUserId,
      page: 1,
    }));
  };

  return (
    <div className="space-y-8">
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
          title={t("admin.audit_logs.list_title")}
          description={t("admin.audit_logs.list_description", {
            count: filteredLogs.length,
          })}
        >
          <div className="mb-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_190px_200px]">
            <div className="flex flex-col gap-4 lg:col-span-2 xl:col-span-1 xl:flex-row">
              <AdminSearchInput
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t("admin.audit_logs.search_placeholder")}
                className="relative flex-1"
              />
              <Button
                type="button"
                onClick={handleSearch}
                className="h-11 px-5"
              >
                <Search className="mr-2 h-4 w-4" />
                {t("admin.audit_logs.actions.search")}
              </Button>
            </div>

            <Select
              value={filters.event ?? "all"}
              onValueChange={(value) =>
                setFilters((currentFilters) => ({
                  ...currentFilters,
                  event: value === "all" ? undefined : value,
                  page: 1,
                }))
              }
            >
              <SelectTrigger className="h-11 border-border bg-transparent">
                <SelectValue placeholder={t("admin.audit_logs.filters.event_label")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("admin.audit_logs.filters.all_events")}
                </SelectItem>
                <SelectItem value="created">
                  {t("admin.audit_logs.events.created")}
                </SelectItem>
                <SelectItem value="updated">
                  {t("admin.audit_logs.events.updated")}
                </SelectItem>
                <SelectItem value="deleted">
                  {t("admin.audit_logs.events.deleted")}
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.subject_type ?? "all"}
              onValueChange={(value) =>
                setFilters((currentFilters) => ({
                  ...currentFilters,
                  subject_type: value === "all" ? undefined : value,
                  page: 1,
                }))
              }
            >
              <SelectTrigger className="h-11 border-border bg-transparent">
                <SelectValue placeholder={t("admin.audit_logs.filters.subject_label")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("admin.audit_logs.filters.all_subjects")}
                </SelectItem>
                {subjectTypeOptions.map((subjectType) => (
                  <SelectItem key={subjectType} value={subjectType}>
                    {formatAuditSubjectType(subjectType)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:max-w-[420px]">
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {t("admin.audit_logs.filters.from_label")}
              </label>
              <Input
                type="date"
                className="h-11 border-border bg-transparent"
                value={dateRange.from}
                onChange={(event) => {
                  setDateRange((currentRange) => ({
                    ...currentRange,
                    from: event.target.value,
                  }));
                  setFilters((currentFilters) => ({ ...currentFilters, page: 1 }));
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {t("admin.audit_logs.filters.to_label")}
              </label>
              <Input
                type="date"
                className="h-11 border-border bg-transparent"
                value={dateRange.to}
                onChange={(event) => {
                  setDateRange((currentRange) => ({
                    ...currentRange,
                    to: event.target.value,
                  }));
                  setFilters((currentFilters) => ({ ...currentFilters, page: 1 }));
                }}
              />
            </div>
          </div>

          {error ? (
            <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm font-medium text-destructive">
                {t("admin.audit_logs.error_prefix")}
                {error}
              </p>
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="w-[56px] px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.audit_logs.table.expand")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.audit_logs.table.recorded")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.audit_logs.table.actor")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.audit_logs.table.action")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.audit_logs.table.event")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.audit_logs.table.subject")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.audit_logs.table.ip")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? <AdminTableLoadingRow colSpan={7} /> : null}

                {!loading &&
                  filteredLogs.map((log) => {
                    const visual = getAuditEventVisual(log.event);
                    const Icon = visual.icon;
                    const isExpanded = expandedRows.includes(log.id);
                    const diffEntries = getAuditDiffEntries(log);

                    return (
                      <Fragment key={log.id}>
                        <tr
                          className="cursor-pointer border-b border-border/70 transition-colors hover:bg-secondary/20"
                          onClick={() => toggleRow(log.id)}
                        >
                          <td className="px-4 py-4 align-top">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </td>
                          <td className="px-4 py-4 align-top">
                            <div className="min-w-[170px] space-y-1">
                              <p className="text-sm font-medium text-foreground">
                                {formatAuditTimestamp(log.created_at, dateLocale)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                #{log.id}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <div className="min-w-[160px] space-y-1">
                              <p className="font-medium text-foreground">{log.actor_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {t("admin.audit_logs.table.log_id", {
                                  id: log.id,
                                })}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <div className="min-w-[240px] space-y-2">
                              <p className="font-medium text-foreground">{log.action}</p>
                              <div className="flex items-center gap-2">
                                <div
                                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${visual.iconBackgroundClassName}`}
                                >
                                  <Icon className={`h-4 w-4 ${visual.iconClassName}`} />
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {diffEntries.length
                                    ? t("admin.audit_logs.table.changes_count", {
                                        count: diffEntries.length,
                                      })
                                    : t("admin.audit_logs.table.no_changes_short")}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <Badge
                              variant="outline"
                              className={`border ${visual.badgeClassName}`}
                            >
                              {t(`admin.audit_logs.events.${log.event}`)}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <div className="min-w-[180px] space-y-1">
                              <p className="font-medium text-foreground">
                                {formatAuditSubjectType(log.subject_type)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {t("admin.audit_logs.table.subject_id", {
                                  id: log.subject_id,
                                })}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top text-sm text-muted-foreground">
                            {log.ip}
                          </td>
                        </tr>
                        {isExpanded ? (
                          <tr className="border-b border-border/70 bg-secondary/10">
                            <td colSpan={7} className="px-4 py-4">
                              {diffEntries.length ? (
                                <div className="space-y-3">
                                  <div className="grid gap-3 lg:grid-cols-[180px_minmax(0,1fr)_48px_minmax(0,1fr)]">
                                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                      {t("admin.audit_logs.diff.field")}
                                    </p>
                                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                      {t("admin.audit_logs.diff.before")}
                                    </p>
                                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                      {t("admin.audit_logs.diff.arrow")}
                                    </p>
                                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                      {t("admin.audit_logs.diff.after")}
                                    </p>
                                  </div>
                                  {diffEntries.map((entry) => (
                                    <div
                                      key={`${log.id}-${entry.key}`}
                                      className="grid gap-3 rounded-2xl border border-border/60 bg-background/70 p-4 lg:grid-cols-[180px_minmax(0,1fr)_48px_minmax(0,1fr)]"
                                    >
                                      <p className="text-sm font-medium text-foreground">
                                        {entry.key}
                                      </p>
                                      <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-xl bg-rose-500/5 p-3 text-xs text-rose-700 dark:text-rose-300">
                                        {formatAuditValue(entry.oldValue)}
                                      </pre>
                                      <div className="flex items-center justify-center text-muted-foreground">
                                        →
                                      </div>
                                      <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-xl bg-emerald-500/5 p-3 text-xs text-emerald-700 dark:text-emerald-300">
                                        {formatAuditValue(entry.newValue)}
                                      </pre>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">
                                  {t("admin.audit_logs.no_changes")}
                                </p>
                              )}
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}

                {!loading && filteredLogs.length === 0 ? (
                  <AdminTableEmptyRow
                    colSpan={7}
                    icon={History}
                    title={t("admin.audit_logs.empty_title")}
                    description={t("admin.audit_logs.empty_description")}
                  />
                ) : null}
              </tbody>
            </table>
          </div>

          {meta.last_page > 1 ? (
            <div className="mt-6 border-t border-border pt-6">
              <div className="mb-4 flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <p>
                  {t("admin.audit_logs.pagination.page", {
                    page: meta.current_page,
                    lastPage: meta.last_page,
                  })}
                </p>
                <p>{t("admin.audit_logs.pagination.total", { total: meta.total })}</p>
              </div>

              <Pagination className="justify-start">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                        if ((filters.page ?? 1) > 1 && !loading) {
                          setFilters((currentFilters) => ({
                            ...currentFilters,
                            page: (currentFilters.page ?? 1) - 1,
                          }));
                        }
                      }}
                      className={
                        (filters.page ?? 1) === 1 || loading
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
                        if ((filters.page ?? 1) < meta.last_page && !loading) {
                          setFilters((currentFilters) => ({
                            ...currentFilters,
                            page: (currentFilters.page ?? 1) + 1,
                          }));
                        }
                      }}
                      className={
                        (filters.page ?? 1) === meta.last_page || loading
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
            icon={History}
            title={t("admin.audit_logs.sidebar_title")}
            description={t("admin.audit_logs.sidebar_description")}
            delay={0.28}
          >
            <div className="space-y-4">
              <AdminOverviewItem
                label={t("admin.audit_logs.sidebar.current_page")}
                value={String(meta.current_page)}
              />
              <AdminOverviewItem
                label={t("admin.audit_logs.sidebar.visible_rows")}
                value={String(filteredLogs.length)}
              />
              <AdminOverviewItem
                label={t("admin.audit_logs.sidebar.total_records")}
                value={String(meta.total)}
              />
              <AdminOverviewItem
                label={t("admin.audit_logs.sidebar.range")}
                value={
                  dateRange.from && dateRange.to
                    ? `${dateRange.from} → ${dateRange.to}`
                    : t("admin.audit_logs.sidebar.all_dates")
                }
              />
              <AdminOverviewItem
                label={t("admin.audit_logs.sidebar.event_filter")}
                value={
                  filters.event
                    ? t(`admin.audit_logs.events.${filters.event}`)
                    : t("admin.audit_logs.filters.all_events")
                }
              />
              <AdminOverviewItem
                label={t("admin.audit_logs.sidebar.user_filter")}
                value={
                  filters.user_id
                    ? t("admin.audit_logs.table.user_filter", {
                        id: filters.user_id,
                      })
                    : t("admin.audit_logs.sidebar.all_users")
                }
              />
              <AdminOverviewItem
                label={t("admin.audit_logs.sidebar.subject_filter")}
                value={
                  filters.subject_type
                    ? formatAuditSubjectType(filters.subject_type)
                    : t("admin.audit_logs.sidebar.all_subjects")
                }
              />
            </div>
          </AdminSidebarCard>

          <AdminSidebarCard
            icon={PencilLine}
            title={t("admin.audit_logs.legend_title")}
            description={t("admin.audit_logs.legend_description")}
            delay={0.34}
          >
            <div className="space-y-3">
              {(["created", "updated", "deleted"] as const).map((eventKey) => {
                const visual = getAuditEventVisual(eventKey);
                const Icon = visual.icon;

                return (
                  <div
                    key={eventKey}
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/50 p-3"
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${visual.iconBackgroundClassName}`}
                    >
                      <Icon className={`h-4 w-4 ${visual.iconClassName}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {t(`admin.audit_logs.events.${eventKey}`)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t(`admin.audit_logs.legend.${eventKey}`)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <p className="text-xs leading-6 text-muted-foreground">
                {t("admin.audit_logs.sidebar.expand_note")}
              </p>
            </div>
          </AdminSidebarCard>
        </div>
      </div>
    </div>
  );
}
