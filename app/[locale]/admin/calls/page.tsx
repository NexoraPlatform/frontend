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
import Link from "next/link";
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
import { usePathname } from "next/navigation";
import { Locale } from "@/types/locale";
import { useAsyncTranslation } from "@/hooks/use-async-translation";

/** Custom hook care grupează toate traducerile pentru pagina de Calls */
function useCallsT(locale: Locale) {
    return {
        title: useAsyncTranslation(locale, "admin.calls.manage_title"),
        subtitle: useAsyncTranslation(locale, "admin.calls.manage_subtitle"),
        searchPlaceholder: useAsyncTranslation(locale, "admin.calls.search_placeholder"),

        passedFilterLabel: useAsyncTranslation(locale, "admin.calls.filters.passed.label"),
        passedFilterAll: useAsyncTranslation(locale, "admin.calls.filters.passed.all"),
        passedFilterYes: useAsyncTranslation(locale, "admin.calls.filters.passed.yes"),
        passedFilterNo: useAsyncTranslation(locale, "admin.calls.filters.passed.no"),

        statusFilterLabel: useAsyncTranslation(locale, "admin.calls.filters.status.label"),
        statusFilterAll: useAsyncTranslation(locale, "admin.calls.filters.status.all"),

        statuses: {
            WAITING: useAsyncTranslation(locale, "admin.calls.statuses.WAITING"),
            ACCEPTED: useAsyncTranslation(locale, "admin.calls.statuses.ACCEPTED"),
            FINISHED: useAsyncTranslation(locale, "admin.calls.statuses.FINISHED"),
            REFUSED: useAsyncTranslation(locale, "admin.calls.statuses.REFUSED"),
            NO_SHOW: useAsyncTranslation(locale, "admin.calls.statuses.NO_SHOW"),
        },

        dateFilterPlaceholder: useAsyncTranslation(locale, "admin.calls.filters.date.placeholder"),
        listTitle: useAsyncTranslation(locale, "admin.calls.list_title"),
        listDescriptionTemplate: useAsyncTranslation(locale, "admin.calls.list_description"),
        viewTestDetails: useAsyncTranslation(locale, "admin.calls.link_test_details"),
        scheduledAtPrefix: useAsyncTranslation(locale, "admin.calls.scheduled_at_prefix"),
        passingScorePrefix: useAsyncTranslation(locale, "admin.calls.passing_score_prefix"),
        categoryPrefix: useAsyncTranslation(locale, "admin.calls.category_prefix"),
        createdPrefix: useAsyncTranslation(locale, "admin.calls.created_prefix"),
        resultsLabelTemplate: useAsyncTranslation(locale, "admin.calls.results_label"),

        connectToInterview: useAsyncTranslation(locale, "admin.calls.dropdown.connect"),
        moveWaiting: useAsyncTranslation(locale, "admin.calls.dropdown.move_waiting"),
        moveFinished: useAsyncTranslation(locale, "admin.calls.dropdown.move_finished"),
        moveAccepted: useAsyncTranslation(locale, "admin.calls.dropdown.move_accepted"),
        moveRefused: useAsyncTranslation(locale, "admin.calls.dropdown.move_refused"),
        moveNoShow: useAsyncTranslation(locale, "admin.calls.dropdown.move_no_show"),
        refuseReasonLabel: useAsyncTranslation(locale, "admin.calls.dropdown.refuse_reason_label"),
        refuseReasonPlaceholder: useAsyncTranslation(locale, "admin.calls.dropdown.refuse_reason_placeholder"),
        cancelLabel: useAsyncTranslation(locale, "admin.calls.dropdown.cancel"),
        confirmLabel: useAsyncTranslation(locale, "admin.calls.dropdown.confirm"),

        noCallsTitle: useAsyncTranslation(locale, "admin.calls.no_calls_title"),
        noCallsDescription: useAsyncTranslation(locale, "admin.calls.no_calls_description"),
        errorPrefix: useAsyncTranslation(locale, "admin.calls.error_prefix"),
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
            startDate: new Date(2025, 0, 1),
            endDate: new Date(),
            key: "selection",
        },
    ]);

    const { data: callsData, loading: callsLoading, refetch: refetchCalls } = useAdminCalls();
    const pathname = usePathname();
    const locale = (pathname.split("/")[1] as Locale) || "ro";

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
        const matchesSearch =
            call.interviewer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            call.interviewer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            call.interviewer?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            call.attendees.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            call.attendees.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            call.attendees?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            call.service.name[locale].toLowerCase().includes(searchTerm.toLowerCase()) ||
            call.service.category.name[locale].toLowerCase().includes(searchTerm.toLowerCase()) ||
            call.date_time.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesService = serviceFilter === "all" || call.serviceId === serviceFilter;
        const matchesPassed = passedFilter === "all" || call.passed === passedFilter; // atenție la tip (string vs number/bool)
        const callDate = parseISO(call.date_time);
        const matchesDate = isWithinInterval(callDate, {
            start: range[0].startDate ?? new Date(),
            end: range[0].endDate ?? new Date(),
        });
        const matchesStatus = statusFilter === "all" || call.status === statusFilter;

        return matchesSearch && matchesService && matchesPassed && matchesDate && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        const text = t.statuses[status as keyof typeof t.statuses] || status;
        switch (status) {
            case "WAITING":
                return (
                    <Badge className="bg-green-100 text-yellow-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {text}
                    </Badge>
                );
            case "ACCEPTED":
                return (
                    <Badge className="bg-gray-100 text-green-500">
                        <XCircle className="w-3 h-3 mr-1" />
                        {text}
                    </Badge>
                );
            case "FINISHED":
                return (
                    <Badge className="bg-yellow-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {text}
                    </Badge>
                );
            case "REFUSED":
                return (
                    <Badge className="bg-yellow-100 text-red-800">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {text}
                    </Badge>
                );
            case "NO_SHOW":
                return (
                    <Badge className="bg-yellow-100 text-red-400">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {text}
                    </Badge>
                );
            default:
                return <Badge variant="secondary">{text}</Badge>;
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                    <Link href="/admin">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">{t.title}</h1>
                        <p className="text-muted-foreground">{t.subtitle}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <Card className="mb-6">
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

            <Card>
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
                                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <h3 className="font-semibold text-lg">
                                                {call.attendees.firstName} {call.attendees.lastName}
                                            </h3>
                                            {getStatusBadge(call.status)}
                                        </div>

                                        <div className="flex items-center space-x-6 text-sm mb-3">
                                            <div className="flex items-center space-x-1">
                                                <BookOpen className="w-4 h-4 text-blue-500" />
                                                <span className="font-medium">{call.service?.name?.[locale]}</span>
                                            </div>

                                            <div className="flex items-center space-x-1">
                                                <ListTodo className="w-4 h-4 text-green-500" />
                                                <span>
                          <a href={`/admin/tests/${call.test_result.skill_test_id}/statistics`}>
                            {t.viewTestDetails}
                          </a>
                        </span>
                                            </div>

                                            <div className="flex items-center space-x-1">
                                                <Clock className="w-4 h-4 text-orange-500" />
                                                <span>
                          {t.scheduledAtPrefix}{" "}
                                                    {DateTime.fromISO(call.date_time, { setZone: true }).toFormat("dd.MM.yyyy HH:mm")}{" "}
                        </span>
                                            </div>

                                            <div className="flex items-center space-x-1">
                                                <BarChart3 className="w-4 h-4 text-purple-500" />
                                                <span>
                          {t.passingScorePrefix} {call.test_result.score}%
                        </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
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

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
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
                                                <div className="mt-2 p-4 border rounded bg-muted space-y-2 w-full max-w-md">
                                                    <label className="text-sm font-medium">{t.refuseReasonLabel}</label>
                                                    <textarea
                                                        value={noteText}
                                                        onChange={(e) => setNoteText(e.target.value)}
                                                        placeholder={t.refuseReasonPlaceholder}
                                                        className="w-full h-20 border rounded p-2 text-sm"
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
                            ))}

                            {filteredCalls.length === 0 && (
                                <div className="text-center py-12">
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
