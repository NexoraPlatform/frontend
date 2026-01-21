"use client";

import { useState } from "react";
import { useAdminCalls } from "@/hooks/use-api";
import { Badge } from "@/components/ui/badge";
import {
    AlertCircle,
    ArrowLeft,
    BarChart3,
    BookOpen,
    CalendarIcon,
    CheckCircle,
    Clock,
    Eye,
    Filter,
    ListTodo,
    Loader2,
    MoreHorizontal,
    Search,
    XCircle,
} from "lucide-react";
import { Link } from '@/lib/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRange, RangeKeyDict, Range, DefinedRange } from "react-date-range";
import { isWithinInterval, parseISO } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { customStaticRanges } from "@/utils/dateShortcuts";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DateTime } from "luxon";
import apiClient from "@/lib/api";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
import PlaylistAddCheckCircleIcon from "@mui/icons-material/PlaylistAddCheckCircle";
import { VisibilityOff } from "@mui/icons-material";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { useLocale, useTranslations } from "next-intl";
import { Locale } from "@/types/locale";

/** Custom hook care grupează toate traducerile pentru pagina de Calls */
function useCallsT(locale: Locale) {
    return {
        title: t("admin.calls.manage_title"),
        subtitle: t("admin.calls.manage_subtitle"),
        searchPlaceholder: t("admin.calls.search_placeholder"),

        passedFilterLabel: t("admin.calls.filters.passed.label"),
        passedFilterAll: t("admin.calls.filters.passed.all"),
        passedFilterYes: t("admin.calls.filters.passed.yes"),
        passedFilterNo: t("admin.calls.filters.passed.no"),

        statusFilterLabel: t("admin.calls.filters.status.label"),
        statusFilterAll: t("admin.calls.filters.status.all"),

        statuses: {
            WAITING: t("admin.calls.statuses.WAITING"),
            ACCEPTED: t("admin.calls.statuses.ACCEPTED"),
            FINISHED: t("admin.calls.statuses.FINISHED"),
            REFUSED: t("admin.calls.statuses.REFUSED"),
            NO_SHOW: t("admin.calls.statuses.NO_SHOW"),
        },

        dateFilterPlaceholder: t("admin.calls.filters.date.placeholder"),
        listTitle: t("admin.calls.list_title"),
        listDescriptionTemplate: t("admin.calls.list_description"),
        viewTestDetails: t("admin.calls.link_test_details"),
        scheduledAtPrefix: t("admin.calls.scheduled_at_prefix"),
        passingScorePrefix: t("admin.calls.passing_score_prefix"),
        categoryPrefix: t("admin.calls.category_prefix"),
        createdPrefix: t("admin.calls.created_prefix"),
        resultsLabelTemplate: t("admin.calls.results_label"),

        connectToInterview: t("admin.calls.dropdown.connect"),
        moveWaiting: t("admin.calls.dropdown.move_waiting"),
        moveFinished: t("admin.calls.dropdown.move_finished"),
        moveAccepted: t("admin.calls.dropdown.move_accepted"),
        moveRefused: t("admin.calls.dropdown.move_refused"),
        moveNoShow: t("admin.calls.dropdown.move_no_show"),
        refuseReasonLabel: t("admin.calls.dropdown.refuse_reason_label"),
        refuseReasonPlaceholder: t("admin.calls.dropdown.refuse_reason_placeholder"),
        cancelLabel: t("admin.calls.dropdown.cancel"),
        confirmLabel: t("admin.calls.dropdown.confirm"),

        noCallsTitle: t("admin.calls.no_calls_title"),
        noCallsDescription: t("admin.calls.no_calls_description"),
        errorPrefix: t("admin.calls.error_prefix"),
    };
}

export default function CallsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [serviceFilter] = useState("all");
    const [passedFilter, setPassedFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [noteModalCallId, setNoteModalCallId] = useState<number | null>(null);
    const [noteText, setNoteText] = useState("");
    const [range, setRange] = useState<Range[]>([
        {
            startDate: undefined,
            endDate: undefined,
            key: "selection",
        },
    ]);

    const { data: callsData, loading: callsLoading, refetch: refetchCalls } = useAdminCalls();
    const locale = useLocale();
  const t = useTranslations();

    // Toate textele printr-un singur hook
    const t = useCallsT(locale);

    const handleCallAction = async (callId: string, action: string, noteTextParam: string | null) => {
        try {
            if (action === "WAITING") {
                await apiClient.updateCallStatus(callId, "WAITING", noteTextParam);
                refetchCalls();
            } else if (action === "FINISHED") {
                await apiClient.updateCallStatus(callId, "FINISHED", noteTextParam);
                refetchCalls();
            } else if (action === "ACCEPTED") {
                await apiClient.updateCallStatus(callId, "ACCEPTED", noteTextParam);
                refetchCalls();
            } else if (action === "REFUSED") {
                await apiClient.updateCallStatus(callId, "REFUSED", noteTextParam);
                refetchCalls();
            } else if (action === "NO_SHOW") {
                await apiClient.updateCallStatus(callId, "NO_SHOW", noteTextParam);
                refetchCalls();
            }
        } catch (error: any) {
            alert(t.errorPrefix + error.message);
        }
    };

    const filteredCalls = (callsData?.calls || []).filter((call: any) => {
        const normalizedSearchTerm = searchTerm.toLowerCase();
        const matchesSearch = [
            call?.interviewer?.firstName,
            call?.interviewer?.lastName,
            call?.interviewer?.email,
            call?.attendees?.firstName,
            call?.attendees?.lastName,
            call?.attendees?.email,
            call?.service?.name?.[locale],
            call?.service?.category?.name?.[locale],
            call?.date_time,
        ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(normalizedSearchTerm));

        const matchesService = serviceFilter === "all" || call.serviceId === serviceFilter;
        const matchesPassed = passedFilter === "all" || call.passed === passedFilter; // atenție la tip (string vs number/bool)
        const callDate = call.date_time ? parseISO(call.date_time) : null;
        const matchesDate =
            (!range[0].startDate || !range[0].endDate) ||
            (callDate &&
                isWithinInterval(callDate, {
                    start: range[0].startDate,
                    end: range[0].endDate,
                }));
        const matchesStatus = statusFilter === "all" || call.status === statusFilter;

        return matchesSearch && matchesService && matchesPassed && matchesDate && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        const text = t.statuses[status as keyof typeof t.statuses] || status;
        switch (status) {
            case "WAITING":
                return (
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {text}
                    </Badge>
                );
            case "ACCEPTED":
                return (
                    <Badge className="bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200">
                        <XCircle className="w-3 h-3 mr-1" />
                        {text}
                    </Badge>
                );
            case "FINISHED":
                return (
                    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {text}
                    </Badge>
                );
            case "REFUSED":
                return (
                    <Badge className="bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-200">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {text}
                    </Badge>
                );
            case "NO_SHOW":
                return (
                    <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {text}
                    </Badge>
                );
            default:
                return <Badge variant="secondary">{text}</Badge>;
        }
    };

    return (
        <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
            <div className="relative mb-10 overflow-hidden rounded-3xl border border-border/60 bg-card/70 p-6 shadow-[0_20px_80px_-60px_rgba(15,23,42,0.4)] backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/60 dark:shadow-[0_20px_80px_-40px_rgba(15,23,42,0.9)] sm:p-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_rgba(255,255,255,0)_60%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_rgba(15,23,42,0)_60%)]" />
                <div className="relative flex flex-col gap-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <Link href="/admin">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 rounded-full border border-border/60 bg-white/80 text-slate-900 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-500/40 hover:bg-sky-500/10 hover:text-sky-700 dark:border-slate-800/70 dark:bg-slate-950/70 dark:text-slate-100 dark:hover:border-sky-500/50 dark:hover:bg-sky-500/10 dark:hover:text-sky-200"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            Trustora Admin
                        </span>
                    </div>
                    <div>
                        <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">{t.title}</h1>
                        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">{t.subtitle}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <Card className="mb-6 border border-border/60 bg-card/80 text-foreground shadow-[0_16px_40px_-32px_rgba(15,23,42,0.25)] dark:border-slate-800/70 dark:bg-slate-900/70 dark:text-slate-100 dark:shadow-[0_16px_40px_-32px_rgba(15,23,42,0.9)]">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                    placeholder={t.searchPlaceholder}
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <Select value={passedFilter} onValueChange={setPassedFilter}>
                            <SelectTrigger className="w-full md:w-48">
                                <SelectValue placeholder={t.passedFilterLabel} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t.passedFilterAll}</SelectItem>
                                <SelectItem value="1">{t.passedFilterYes}</SelectItem>
                                <SelectItem value="0">{t.passedFilterNo}</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full md:w-48">
                                <Filter className="w-4 h-4 mr-2" />
                                <SelectValue placeholder={t.statusFilterLabel} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t.statusFilterAll}</SelectItem>
                                <SelectItem value="WAITING">{t.statuses.WAITING}</SelectItem>
                                <SelectItem value="ACCEPTED">{t.statuses.ACCEPTED}</SelectItem>
                                <SelectItem value="FINISHED">{t.statuses.FINISHED}</SelectItem>
                                <SelectItem value="REFUSED">{t.statuses.REFUSED}</SelectItem>
                                <SelectItem value="NO_SHOW">{t.statuses.NO_SHOW}</SelectItem>
                            </SelectContent>
                        </Select>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full md:w-60 justify-start text-left font-normal">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {range[0].startDate && range[0].endDate
                                        ? `${range[0].startDate.toLocaleDateString(locale)} - ${range[0].endDate.toLocaleDateString(locale)}`
                                        : t.dateFilterPlaceholder}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0 w-auto" align="start">
                                <div className="flex border rounded overflow-hidden">
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
                </CardContent>
            </Card>

            <Card className="border border-border/60 bg-card/80 text-foreground shadow-[0_16px_40px_-32px_rgba(15,23,42,0.25)] dark:border-slate-800/70 dark:bg-slate-900/70 dark:text-slate-100 dark:shadow-[0_16px_40px_-32px_rgba(15,23,42,0.9)]">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <BookOpen className="w-5 h-5" />
                        <span>{t.listTitle}</span>
                    </CardTitle>
                    <CardDescription>
                        {t.listDescriptionTemplate.replace("{count}", filteredCalls.length.toString())}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {callsLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredCalls.map((call: any) => (
                                <div
                                    key={call.id}
                                    className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-background/70 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-500/40 hover:bg-sky-500/5 dark:border-slate-800/70 dark:bg-slate-950/60"
                                >
                                    <div className="flex flex-1 flex-col gap-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-semibold text-lg">
                                                {call.attendees.firstName} {call.attendees.lastName}
                                            </h3>
                                            {getStatusBadge(call.status)}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center space-x-1">
                                                <BookOpen className="w-4 h-4 text-sky-500" />
                                                <span className="font-medium">{call.service?.name?.[locale]}</span>
                                            </div>

                                            <div className="flex items-center space-x-1">
                                                <ListTodo className="w-4 h-4 text-emerald-500" />
                                                <span>
                                                    <a href={`/admin/tests/${call.test_result.skill_test_id}/statistics`}>
                                                        {t.viewTestDetails}
                                                    </a>
                                                </span>
                                            </div>

                                            <div className="flex items-center space-x-1">
                                                <Clock className="w-4 h-4 text-amber-500" />
                                                <span>
                                                    {t.scheduledAtPrefix}{" "}
                                                    {DateTime.fromISO(call.date_time, { setZone: true }).toFormat("dd.MM.yyyy HH:mm")}{" "}
                                                </span>
                                            </div>

                                            <div className="flex items-center space-x-1">
                                                <BarChart3 className="w-4 h-4 text-indigo-500" />
                                                <span>
                                                    {t.passingScorePrefix} {call.test_result.score}%
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                            <span>
                                                {t.categoryPrefix} {call.service?.category?.name?.[locale]}
                                            </span>
                                            <span>
                                                {t.createdPrefix} {new Date(call.created_at).toLocaleString(locale)}
                                            </span>
                                            {call.results && (
                                                <span>
                                                    {t.resultsLabelTemplate.replace("{count}", call.results.length.toString())}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="rounded-full">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link target="_blank" href={call.call_url}>
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        {t.connectToInterview}
                                                    </Link>
                                                </DropdownMenuItem>

                                                {call.status !== "WAITING" && (
                                                    <DropdownMenuItem onClick={() => handleCallAction(call.id, "WAITING", null)}>
                                                        <PauseCircleOutlineIcon className="w-4 h-4 mr-2" />
                                                        {t.moveWaiting}
                                                    </DropdownMenuItem>
                                                )}

                                                {call.status !== "FINISHED" && (
                                                    <DropdownMenuItem onClick={() => handleCallAction(call.id, "FINISHED", null)}>
                                                        <PlaylistAddCheckCircleIcon className="!w-4 !h-4 mr-2" />
                                                        {t.moveFinished}
                                                    </DropdownMenuItem>
                                                )}

                                                {call.status !== "ACCEPTED" && (
                                                    <DropdownMenuItem onClick={() => handleCallAction(call.id, "ACCEPTED", null)}>
                                                        <CheckCircleOutlineIcon className="!w-4 !h-4 mr-2" />
                                                        {t.moveAccepted}
                                                    </DropdownMenuItem>
                                                )}

                                                {call.status !== "REFUSED" && (
                                                    <DropdownMenuItem
                                                        onSelect={(e) => e.preventDefault()}
                                                        onClick={() => setNoteModalCallId(call.id)}
                                                    >
                                                        <VisibilityOff className="!w-4 !h-4 mr-2" />
                                                        {t.moveRefused}
                                                    </DropdownMenuItem>
                                                )}

                                                {noteModalCallId === call.id && (
                                                    <div className="mt-2 w-full max-w-md space-y-2 rounded-2xl border border-border/60 bg-background/70 p-4 text-sm shadow-sm dark:border-slate-800/70 dark:bg-slate-950/70">
                                                        <label className="text-sm font-medium">{t.refuseReasonLabel}</label>
                                                        <textarea
                                                            value={noteText}
                                                            onChange={(e) => setNoteText(e.target.value)}
                                                            placeholder={t.refuseReasonPlaceholder}
                                                            className="h-20 w-full rounded-lg border border-border/60 bg-background/70 p-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40 dark:border-slate-800/70 dark:bg-slate-950/70"
                                                        />
                                                        <div className="flex justify-end space-x-2">
                                                            <Button variant="secondary" onClick={() => setNoteModalCallId(null)}>
                                                                {t.cancelLabel}
                                                            </Button>
                                                            <Button
                                                                onClick={() => {
                                                                    handleCallAction(call.id, "REFUSED", noteText);
                                                                    setNoteModalCallId(null);
                                                                    setNoteText("");
                                                                }}
                                                            >
                                                                {t.confirmLabel}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}

                                                {call.status !== "NO_SHOW" && (
                                                    <DropdownMenuItem onClick={() => handleCallAction(call.id, "NO_SHOW", null)}>
                                                        <XCircle className="w-4 h-4 mr-2" />
                                                        {t.moveNoShow}
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}

                            {filteredCalls.length === 0 && (
                                <div className="rounded-2xl border border-dashed border-border/60 bg-background/60 py-12 text-center dark:border-slate-800/70 dark:bg-slate-950/60">
                                    <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-medium mb-2">{t.noCallsTitle}</h3>
                                    <p className="text-muted-foreground mb-4">{t.noCallsDescription}</p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
