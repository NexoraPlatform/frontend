"use client";

import { Fragment, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarClock,
  CalendarIcon,
  CheckCircle2,
  Clock3,
  Eye,
  MoreHorizontal,
  PhoneCall,
  ShieldCheck,
  UserRound,
  Video,
  XCircle,
} from "lucide-react";
import { format, isWithinInterval, parseISO } from "date-fns";
import { DateRange, DefinedRange, Range, RangeKeyDict } from "react-date-range";
import { useLocale, useTranslations } from "next-intl";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSearchInput } from "@/components/admin/admin-search-input";
import { AdminSectionCard } from "@/components/admin/admin-section-card";
import { AdminSummaryCard } from "@/components/admin/admin-summary-card";
import {
  AdminTableEmptyRow,
  AdminTableLoadingRow,
} from "@/components/admin/admin-state";
import { ProjectAdminShell } from "@/components/admin/project-admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminCalls } from "@/hooks/use-api";
import apiClient from "@/lib/api";
import { getLocalizedAdminValue } from "@/lib/admin-format";
import { Link } from "@/lib/navigation";
import { sanitizeExternalRedirectUrl } from "@/lib/navigation-security";
import { customStaticRanges } from "@/utils/dateShortcuts";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

const VIDEO_CALL_ALLOWED_HOSTS = (
  process.env.NEXT_PUBLIC_VIDEO_CALL_ALLOWED_HOSTS ||
  "cal.com,meet.google.com,zoom.us,teams.microsoft.com,whereby.com,webex.com,meet.jit.si"
)
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

type AdminCallUser = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
};

type AdminCallItem = {
  id: string | number;
  status?: string | null;
  passed?: boolean | number | string | null;
  date_time?: string | null;
  created_at?: string | null;
  call_url?: string | null;
  notes?: string | null;
  attendees?: AdminCallUser | null;
  interviewer?: AdminCallUser | null;
  service?: {
    name?: unknown;
    category?: {
      name?: unknown;
    } | null;
  } | null;
  test_result?: {
    score?: number | string | null;
    skill_test_id?: string | number | null;
  } | null;
  results?: unknown[] | null;
};

const CALL_STATUS_STYLES: Record<string, string> = {
  WAITING:
    "bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  ACCEPTED:
    "bg-sky-500/15 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  FINISHED:
    "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  REFUSED:
    "bg-red-500/15 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  NO_SHOW:
    "bg-rose-500/15 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
};

function normalizePassedValue(value: AdminCallItem["passed"]) {
  return value === true || value === 1 || value === "1";
}

function formatUserName(user?: AdminCallUser | null) {
  const name = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  return name || user?.email || "";
}

function formatAdminDateTime(value: string | null | undefined, locale: string) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function CallsStatusBadge({
  status,
  label,
}: {
  status: string;
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${CALL_STATUS_STYLES[status] ?? "bg-secondary text-secondary-foreground"}`}
    >
      {label}
    </span>
  );
}

export default function AdminCallsPage() {
  const locale = useLocale();
  const t = useTranslations();
  const [searchTerm, setSearchTerm] = useState("");
  const [passedFilter, setPassedFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [noteModalCallId, setNoteModalCallId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [range, setRange] = useState<Range[]>([
    {
      startDate: undefined,
      endDate: undefined,
      key: "selection",
    },
  ]);

  const { data: callsData, loading: callsLoading, refetch: refetchCalls } = useAdminCalls();
  const statusLabels = {
    WAITING: t("admin.calls.statuses.WAITING"),
    ACCEPTED: t("admin.calls.statuses.ACCEPTED"),
    FINISHED: t("admin.calls.statuses.FINISHED"),
    REFUSED: t("admin.calls.statuses.REFUSED"),
    NO_SHOW: t("admin.calls.statuses.NO_SHOW"),
  } as const;

  const calls: AdminCallItem[] = useMemo(() => {
    if (Array.isArray(callsData?.calls)) {
      return callsData.calls;
    }

    if (Array.isArray(callsData)) {
      return callsData;
    }

    return [];
  }, [callsData]);

  const filteredCalls = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return calls.filter((call) => {
      const participantName = formatUserName(call.attendees).toLowerCase();
      const interviewerName = formatUserName(call.interviewer).toLowerCase();
      const participantEmail = String(call.attendees?.email ?? "").toLowerCase();
      const interviewerEmail = String(call.interviewer?.email ?? "").toLowerCase();
      const serviceName = getLocalizedAdminValue(call.service?.name, locale).toLowerCase();
      const categoryName = getLocalizedAdminValue(
        call.service?.category?.name,
        locale
      ).toLowerCase();
      const status = String(call.status ?? "").toUpperCase();
      const callDate = call.date_time ? parseISO(call.date_time) : null;
      const matchesSearch =
        !query ||
        [
          participantName,
          participantEmail,
          interviewerName,
          interviewerEmail,
          serviceName,
          categoryName,
          String(call.date_time ?? "").toLowerCase(),
        ].some((value) => value.includes(query));
      const matchesPassed =
        passedFilter === "all" ||
        String(Number(normalizePassedValue(call.passed))) === passedFilter;
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const matchesDate =
        (!range[0].startDate || !range[0].endDate) ||
        (callDate &&
          isWithinInterval(callDate, {
            start: range[0].startDate,
            end: range[0].endDate,
          }));

      return matchesSearch && matchesPassed && matchesStatus && Boolean(matchesDate);
    });
  }, [calls, locale, passedFilter, range, searchTerm, statusFilter]);

  const summaryCards = useMemo(
    () => [
      {
        title: t("admin.calls.summary.cards.total"),
        value: calls.length,
        icon: PhoneCall,
        color: "bg-gradient-to-br from-primary to-emerald-400",
      },
      {
        title: t("admin.calls.summary.cards.waiting"),
        value: calls.filter((call) => String(call.status).toUpperCase() === "WAITING").length,
        icon: Clock3,
        color: "bg-gradient-to-br from-amber-500 to-orange-400",
      },
      {
        title: t("admin.calls.summary.cards.accepted"),
        value: calls.filter((call) => String(call.status).toUpperCase() === "ACCEPTED").length,
        icon: ShieldCheck,
        color: "bg-gradient-to-br from-blue-500 to-cyan-400",
      },
      {
        title: t("admin.calls.summary.cards.finished"),
        value: calls.filter((call) => String(call.status).toUpperCase() === "FINISHED").length,
        icon: CheckCircle2,
        color: "bg-gradient-to-br from-emerald-500 to-green-400",
      },
    ],
    [calls, t]
  );

  const handleCallAction = async (
    callId: string,
    action: "WAITING" | "FINISHED" | "ACCEPTED" | "REFUSED" | "NO_SHOW",
    note: string | null
  ) => {
    try {
      await apiClient.updateCallStatus(callId, action, note);
      setNoteModalCallId(null);
      setNoteText("");
      await refetchCalls();
    } catch (error: any) {
      alert(t("admin.calls.error_prefix") + error.message);
    }
  };

  return (
    <ProjectAdminShell>
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <AdminPageHeader
          title={t("admin.calls.manage_title")}
          description={t("admin.calls.manage_subtitle")}
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
          title={t("admin.calls.list_title")}
          description={t("admin.calls.list_description", {
            count: filteredCalls.length,
          })}
        >
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center">
            <AdminSearchInput
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={t("admin.calls.search_placeholder")}
            />

            <Select value={passedFilter} onValueChange={setPassedFilter}>
              <SelectTrigger className="h-11 w-full border-border bg-transparent xl:w-52">
                <SelectValue placeholder={t("admin.calls.filters.passed.label")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.calls.filters.passed.all")}</SelectItem>
                <SelectItem value="1">{t("admin.calls.filters.passed.yes")}</SelectItem>
                <SelectItem value="0">{t("admin.calls.filters.passed.no")}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-11 w-full border-border bg-transparent xl:w-56">
                <SelectValue placeholder={t("admin.calls.filters.status.label")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.calls.filters.status.all")}</SelectItem>
                <SelectItem value="WAITING">{t("admin.calls.statuses.WAITING")}</SelectItem>
                <SelectItem value="ACCEPTED">{t("admin.calls.statuses.ACCEPTED")}</SelectItem>
                <SelectItem value="FINISHED">{t("admin.calls.statuses.FINISHED")}</SelectItem>
                <SelectItem value="REFUSED">{t("admin.calls.statuses.REFUSED")}</SelectItem>
                <SelectItem value="NO_SHOW">{t("admin.calls.statuses.NO_SHOW")}</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-11 w-full justify-start border-border bg-transparent text-left font-normal xl:w-[280px]"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {range[0].startDate && range[0].endDate
                    ? `${format(range[0].startDate, "dd.MM.yyyy")} - ${format(range[0].endDate, "dd.MM.yyyy")}`
                    : t("admin.calls.filters.date.placeholder")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="flex overflow-hidden rounded-xl border border-border">
                  <DefinedRange
                    ranges={range}
                    onChange={(item: RangeKeyDict) => setRange([item.selection])}
                    staticRanges={customStaticRanges}
                    inputRanges={[]}
                  />
                  <DateRange
                    editableDateInputs
                    onChange={(item: RangeKeyDict) => setRange([item.selection])}
                    moveRangeOnFirstSelection={false}
                    ranges={range}
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.calls.table.participant")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.calls.table.interviewer")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.calls.table.service")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.calls.table.schedule")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.calls.table.result")}
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-medium text-muted-foreground">
                    {t("admin.calls.table.status")}
                  </th>
                  <th className="px-4 py-4 text-right text-sm font-medium text-muted-foreground">
                    {t("admin.calls.table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {callsLoading ? <AdminTableLoadingRow colSpan={7} /> : null}

                {!callsLoading &&
                  filteredCalls.map((call) => {
                    const safeCallUrl = sanitizeExternalRedirectUrl(
                      call.call_url,
                      VIDEO_CALL_ALLOWED_HOSTS
                    );
                    const callId = String(call.id);
                    const participantName =
                      formatUserName(call.attendees) ||
                      t("admin.calls.participant_empty");
                    const interviewerName =
                      formatUserName(call.interviewer) ||
                      t("admin.calls.interviewer_empty");
                    const serviceName =
                      getLocalizedAdminValue(call.service?.name, locale) || "-";
                    const categoryName =
                      getLocalizedAdminValue(call.service?.category?.name, locale) || "-";
                    const status = String(call.status ?? "").toUpperCase();
                    const scoreValue = call.test_result?.score;
                    const score =
                      scoreValue === undefined || scoreValue === null || scoreValue === ""
                        ? null
                        : Number(scoreValue);
                    const hasScore = typeof score === "number" && !Number.isNaN(score);
                    const testStatisticsHref = call.test_result?.skill_test_id
                      ? `/admin/tests/${call.test_result.skill_test_id}/statistics`
                      : null;
                    const isRefuseEditorOpen = noteModalCallId === callId;

                    return (
                      <Fragment key={callId}>
                        <tr
                          className="border-b border-border/70 transition-colors hover:bg-secondary/20"
                        >
                          <td className="px-4 py-4 align-top">
                            <div className="flex min-w-[220px] items-start gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <UserRound className="h-5 w-5" />
                              </div>
                              <div className="space-y-1">
                                <p className="font-semibold text-foreground">{participantName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {call.attendees?.email || "-"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <div className="min-w-[180px] space-y-1">
                              <p className="font-medium text-foreground">{interviewerName}</p>
                              <p className="text-sm text-muted-foreground">
                                {call.interviewer?.email || "-"}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <div className="min-w-[210px] space-y-1">
                              <p className="font-medium text-foreground">{serviceName}</p>
                              <p className="text-sm text-muted-foreground">{categoryName}</p>
                              {safeCallUrl ? (
                                <div className="pt-1">
                                  <Badge
                                    variant="secondary"
                                    className="bg-primary/10 text-primary hover:bg-primary/10"
                                  >
                                    <Video className="mr-1 h-3 w-3" />
                                    {t("admin.calls.table.join_available")}
                                  </Badge>
                                </div>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <div className="min-w-[220px] space-y-2">
                              <div className="flex items-center gap-2 text-sm text-foreground">
                                <CalendarClock className="h-4 w-4 text-primary" />
                                <span>
                                  {t("admin.calls.table.scheduled_at", {
                                    date: formatAdminDateTime(call.date_time, locale),
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock3 className="h-4 w-4" />
                                <span>
                                  {t("admin.calls.table.created_at", {
                                    date: formatAdminDateTime(call.created_at, locale),
                                  })}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <div className="min-w-[220px] space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-medium text-foreground">
                                  {hasScore
                                    ? `${Math.round(score)}%`
                                    : t("admin.calls.table.no_score")}
                                </p>
                                <Badge
                                  variant="secondary"
                                  className={
                                    normalizePassedValue(call.passed)
                                      ? "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                                      : call.passed === null || call.passed === undefined
                                        ? "bg-secondary text-secondary-foreground"
                                        : "bg-red-500/15 text-red-700 dark:bg-red-500/20 dark:text-red-300"
                                  }
                                >
                                  {call.passed === null || call.passed === undefined
                                    ? t("admin.calls.table.pending")
                                    : normalizePassedValue(call.passed)
                                      ? t("admin.calls.table.passed")
                                      : t("admin.calls.table.failed")}
                                </Badge>
                              </div>
                              <div className="space-y-1 text-sm text-muted-foreground">
                                <p>
                                  {t("admin.calls.results_label", {
                                    count: Array.isArray(call.results)
                                      ? call.results.length
                                      : 0,
                                  })}
                                </p>
                                {testStatisticsHref ? (
                                  <Link
                                    href={testStatisticsHref}
                                    className="inline-flex items-center gap-1 text-primary transition-colors hover:text-primary/80"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                    {t("admin.calls.link_test_details")}
                                  </Link>
                                ) : null}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <CallsStatusBadge
                              status={status}
                              label={
                                statusLabels[status as keyof typeof statusLabels] ||
                                status ||
                                "-"
                              }
                            />
                          </td>
                          <td className="px-4 py-4 text-right align-top">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="rounded-full"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {safeCallUrl ? (
                                  <DropdownMenuItem asChild>
                                    <a
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      href={safeCallUrl}
                                    >
                                      <Video className="mr-2 h-4 w-4" />
                                      {t("admin.calls.dropdown.connect")}
                                    </a>
                                  </DropdownMenuItem>
                                ) : null}

                                {status !== "WAITING" ? (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      void handleCallAction(callId, "WAITING", null)
                                    }
                                  >
                                    <Clock3 className="mr-2 h-4 w-4" />
                                    {t("admin.calls.dropdown.move_waiting")}
                                  </DropdownMenuItem>
                                ) : null}

                                {status !== "ACCEPTED" ? (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      void handleCallAction(callId, "ACCEPTED", null)
                                    }
                                  >
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                    {t("admin.calls.dropdown.move_accepted")}
                                  </DropdownMenuItem>
                                ) : null}

                                {status !== "FINISHED" ? (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      void handleCallAction(callId, "FINISHED", null)
                                    }
                                  >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    {t("admin.calls.dropdown.move_finished")}
                                  </DropdownMenuItem>
                                ) : null}

                                {status !== "REFUSED" ? (
                                  <DropdownMenuItem
                                    onSelect={(event) => event.preventDefault()}
                                    onClick={() => {
                                      setNoteModalCallId(callId);
                                      setNoteText(call.notes ?? "");
                                    }}
                                  >
                                    <AlertCircle className="mr-2 h-4 w-4" />
                                    {t("admin.calls.dropdown.move_refused")}
                                  </DropdownMenuItem>
                                ) : null}

                                {status !== "NO_SHOW" ? (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      void handleCallAction(callId, "NO_SHOW", null)
                                    }
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    {t("admin.calls.dropdown.move_no_show")}
                                  </DropdownMenuItem>
                                ) : null}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                        {isRefuseEditorOpen ? (
                          <tr className="border-b border-border/70 bg-secondary/10">
                            <td colSpan={7} className="px-4 py-5">
                              <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                                <label className="mb-2 block text-sm font-medium text-foreground">
                                  {t("admin.calls.dropdown.refuse_reason_label")}
                                </label>
                                <textarea
                                  value={noteText}
                                  onChange={(event) => setNoteText(event.target.value)}
                                  placeholder={t(
                                    "admin.calls.dropdown.refuse_reason_placeholder"
                                  )}
                                  className="h-24 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
                                />
                                <div className="mt-4 flex justify-end gap-3">
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setNoteModalCallId(null);
                                      setNoteText("");
                                    }}
                                  >
                                    {t("admin.calls.dropdown.cancel")}
                                  </Button>
                                  <Button
                                    className="bg-primary text-white hover:bg-primary/90"
                                    onClick={() =>
                                      void handleCallAction(callId, "REFUSED", noteText)
                                    }
                                  >
                                    {t("admin.calls.dropdown.confirm")}
                                  </Button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })}

                {!callsLoading && filteredCalls.length === 0 ? (
                  <AdminTableEmptyRow
                    colSpan={7}
                    icon={PhoneCall}
                    title={t("admin.calls.no_calls_title")}
                    description={t("admin.calls.no_calls_description")}
                  />
                ) : null}
              </tbody>
            </table>
          </div>
        </AdminSectionCard>
      </div>
    </ProjectAdminShell>
  );
}
