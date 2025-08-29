"use client";

import {useState} from "react";
import {useAdminCalls} from "@/hooks/use-api";
import {Badge} from "@/components/ui/badge";
import {
    AlertCircle,
    ArrowLeft, BarChart3,
    BookOpen,
    CalendarIcon,
    CheckCircle, Clock, Eye,
    Filter, ListTodo,
    Loader2, MoreHorizontal,
    Search,
    XCircle
} from "lucide-react";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {DateRange, RangeKeyDict, Range, DefinedRange} from 'react-date-range';
import {isWithinInterval, parseISO} from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { customStaticRanges } from '@/utils/dateShortcuts';
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import { DateTime } from 'luxon';
import apiClient from "@/lib/api";
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import PlaylistAddCheckCircleIcon from '@mui/icons-material/PlaylistAddCheckCircle';
import {VisibilityOff} from "@mui/icons-material";
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import {usePathname} from "next/navigation";
import {Locale} from "@/types/locale";
import { useAsyncTranslation } from '@/hooks/use-async-translation';

export default function CallsPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [serviceFilter] = useState('all');
    const [passedFilter, setPassedFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [noteModalCallId, setNoteModalCallId] = useState<number | null>(null);
    const [noteText, setNoteText] = useState('');
    const [range, setRange] = useState<Range[]>([
        {
            startDate: new Date(2025, 0, 1),
            endDate: new Date(),
            key: 'selection',
        },
    ]);
    const { data: callsData, loading: callsLoading, refetch: refetchCalls } = useAdminCalls();
    const pathname = usePathname();
    const locale = (pathname.split('/')[1] as Locale) || 'ro';

    const tCalls = (key: string) => useAsyncTranslation(locale, `admin.calls.${key}`);
    const title = tCalls('manage_title');
    const subtitle = tCalls('manage_subtitle');
    const searchPlaceholder = tCalls('search_placeholder');
    const passedFilterLabel = tCalls('filters.passed.label');
    const passedFilterAll = tCalls('filters.passed.all');
    const passedFilterYes = tCalls('filters.passed.yes');
    const passedFilterNo = tCalls('filters.passed.no');
    const statusFilterLabel = tCalls('filters.status.label');
    const statusFilterAll = tCalls('filters.status.all');
    const statuses = {
        WAITING: tCalls('statuses.WAITING'),
        ACCEPTED: tCalls('statuses.ACCEPTED'),
        FINISHED: tCalls('statuses.FINISHED'),
        REFUSED: tCalls('statuses.REFUSED'),
        NO_SHOW: tCalls('statuses.NO_SHOW'),
    };
    const dateFilterPlaceholder = tCalls('filters.date.placeholder');
    const listTitle = tCalls('list_title');
    const listDescriptionTemplate = tCalls('list_description');
    const viewTestDetails = tCalls('link_test_details');
    const scheduledAtPrefix = tCalls('scheduled_at_prefix');
    const passingScorePrefix = tCalls('passing_score_prefix');
    const categoryPrefix = tCalls('category_prefix');
    const createdPrefix = tCalls('created_prefix');
    const resultsLabelTemplate = tCalls('results_label');
    const connectToInterview = tCalls('dropdown.connect');
    const moveWaiting = tCalls('dropdown.move_waiting');
    const moveFinished = tCalls('dropdown.move_finished');
    const moveAccepted = tCalls('dropdown.move_accepted');
    const moveRefused = tCalls('dropdown.move_refused');
    const moveNoShow = tCalls('dropdown.move_no_show');
    const refuseReasonLabel = tCalls('dropdown.refuse_reason_label');
    const refuseReasonPlaceholder = tCalls('dropdown.refuse_reason_placeholder');
    const cancelLabel = tCalls('dropdown.cancel');
    const confirmLabel = tCalls('dropdown.confirm');
    const noCallsTitle = tCalls('no_calls_title');
    const noCallsDescription = tCalls('no_calls_description');
    const errorPrefix = tCalls('error_prefix');

    const handleCallAction = async (callId: string, action: string, noteText: string | null) => {
        try {
            if (action === 'WAITING') {
                await apiClient.updateCallStatus(callId, 'WAITING', noteText);
                refetchCalls();
            } else if (action === 'FINISHED') {
                await apiClient.updateCallStatus(callId, 'FINISHED', noteText);
                refetchCalls();
            } else if (action === 'ACCEPTED') {
                await apiClient.updateCallStatus(callId, 'ACCEPTED', noteText);
                refetchCalls();
            } else if (action === 'REFUSED') {
                await apiClient.updateCallStatus(callId, 'REFUSED', noteText);
                refetchCalls();
            } else if (action === 'NO_SHOW') {
                await apiClient.updateCallStatus(callId, 'NO_SHOW', noteText);
                refetchCalls();
            }
        } catch (error: any) {
            alert(errorPrefix + error.message);
        }
    };

    const filteredCalls = (callsData?.calls || []).filter((call: any) => {
        const matchesSearch = call.interviewer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            call.interviewer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            call.interviewer?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            call.attendees.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            call.attendees.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            call.attendees?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            call.service.name[locale].toLowerCase().includes(searchTerm.toLowerCase()) ||
            call.service.category.name[locale].toLowerCase().includes(searchTerm.toLowerCase()) ||
            call.date_time.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesService = serviceFilter === 'all' || call.serviceId === serviceFilter;
        const matchesPassed = passedFilter === 'all' || call.passed === passedFilter;
        const callDate = parseISO(call.date_time);
        const matchesDate = isWithinInterval(callDate, {
            start: range[0].startDate ?? new Date(),
            end: range[0].endDate ?? new Date()
        });
        const matchesStatus = statusFilter === 'all' || call.status === statusFilter;
        return matchesSearch && matchesService && matchesPassed && matchesDate && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        const text = statuses[status as keyof typeof statuses] || status;
        switch (status) {
            case 'WAITING':
                return <Badge className="bg-green-100 text-yellow-500"><CheckCircle className="w-3 h-3 mr-1" />{text}</Badge>;
            case 'ACCEPTED':
                return <Badge className="bg-gray-100 text-green-500"><XCircle className="w-3 h-3 mr-1" />{text}</Badge>;
            case 'FINISHED':
                return <Badge className="bg-yellow-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />{text}</Badge>;
            case 'REFUSED':
                return <Badge className="bg-yellow-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />{text}</Badge>;
            case 'NO_SHOW':
                return <Badge className="bg-yellow-100 text-red-400"><AlertCircle className="w-3 h-3 mr-1" />{text}</Badge>;
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
                        <h1 className="text-3xl font-bold">{title}</h1>
                        <p className="text-muted-foreground">{subtitle}</p>
                    </div>
                </div>
                {/*<Link href="/admin/calls/new">*/}
                {/*    <Button>*/}
                {/*        <Plus className="w-4 h-4 mr-2" />*/}
                {/*        Adaugă Apel*/}
                {/*    </Button>*/}
                {/*</Link>*/}
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <Input
                                    placeholder={searchPlaceholder}
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <Select value={passedFilter} onValueChange={setPassedFilter}>
                            <SelectTrigger className="w-full md:w-48">
                                <SelectValue placeholder={passedFilterLabel} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{passedFilterAll}</SelectItem>
                                <SelectItem value="1">{passedFilterYes}</SelectItem>
                                <SelectItem value="0">{passedFilterNo}</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full md:w-48">
                                <Filter className="w-4 h-4 mr-2" />
                                <SelectValue placeholder={statusFilterLabel} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{statusFilterAll}</SelectItem>
                                <SelectItem value="WAITING">{statuses.WAITING}</SelectItem>
                                <SelectItem value="ACCEPTED">{statuses.ACCEPTED}</SelectItem>
                                <SelectItem value="FINISHED">{statuses.FINISHED}</SelectItem>
                                <SelectItem value="REFUSED">{statuses.REFUSED}</SelectItem>
                                <SelectItem value="NO_SHOW">{statuses.NO_SHOW}</SelectItem>
                            </SelectContent>
                        </Select>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full md:w-60 justify-start text-left font-normal"
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {range[0].startDate && range[0].endDate
                                        ? `${range[0].startDate.toLocaleDateString(locale)} - ${range[0].endDate.toLocaleDateString(locale)}`
                                        : dateFilterPlaceholder}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0 w-auto" align="start">
                                <div className="flex border rounded overflow-hidden">
                                <DefinedRange
                                    ranges={range}
                                    onChange={(item: RangeKeyDict) => setRange([item.selection])}
                                    staticRanges={customStaticRanges}
                                    inputRanges={[]} // dacă vrei să ascunzi inputul cu număr de zile
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
                        <span>{listTitle}</span>
                    </CardTitle>
                    <CardDescription>
                        {listDescriptionTemplate.replace('{count}', filteredCalls.length.toString())}
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
                                <div key={call.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <h3 className="font-semibold text-lg">{call.attendees.firstName} {call.attendees.lastName}</h3>
                                            {getStatusBadge(call.status)}
                                        </div>

                                        {/*<p className="text-muted-foreground mb-3 line-clamp-2">*/}
                                        {/*    {call.test_result.score} % scor trecere*/}
                                        {/*</p>*/}

                                        <div className="flex items-center space-x-6 text-sm mb-3">
                                            <div className="flex items-center space-x-1">
                                                <BookOpen className="w-4 h-4 text-blue-500" />
                                                <span className="font-medium">{call.service?.name?.[locale]}</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <ListTodo className="w-4 h-4 text-green-500" />
                                                <span><a href={`/admin/tests/${call.test_result.skill_test_id}/statistics`}>{viewTestDetails}</a></span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <Clock className="w-4 h-4 text-orange-500" />
                                                <span>{scheduledAtPrefix} {' '}
                                                  {DateTime.fromISO(call.date_time, { setZone: true })
                                                      .toFormat('dd.MM.yyyy HH:mm')} {' '}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <BarChart3 className="w-4 h-4 text-purple-500" />
                                                <span>{passingScorePrefix} {call.test_result.score}%</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                            <span>{categoryPrefix} {call.service?.category?.name?.[locale]}</span>
                                            <span>{createdPrefix} {new Date(call.created_at).toLocaleString(locale)}</span>
                                            {call.results && (
                                                <span>{resultsLabelTemplate.replace('{count}', call.results.length.toString())}</span>
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
                                                    {connectToInterview}
                                                </Link>
                                            </DropdownMenuItem>
                                            {call.status !== 'WAITING' && (
                                                <DropdownMenuItem onClick={() => handleCallAction(call.id, 'WAITING', null)}>
                                                    <PauseCircleOutlineIcon className="w-4 h-4 mr-2" />
                                                    {moveWaiting}
                                                </DropdownMenuItem>
                                            )}
                                            {call.status !== 'FINISHED' && (
                                                <DropdownMenuItem onClick={() => handleCallAction(call.id, 'FINISHED', null)}>
                                                    <PlaylistAddCheckCircleIcon className="!w-4 !h-4 mr-2" />
                                                    {moveFinished}
                                                </DropdownMenuItem>
                                            )}
                                            {call.status !== 'ACCEPTED' && (
                                                <DropdownMenuItem onClick={() => handleCallAction(call.id, 'ACCEPTED', null)}>
                                                    <CheckCircleOutlineIcon className="!w-4 !h-4 mr-2" />
                                                    {moveAccepted}
                                                </DropdownMenuItem>
                                            )}
                                            {call.status !== 'REFUSED' && (
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => setNoteModalCallId(call.id)}>
                                                    <VisibilityOff className="!w-4 !h-4 mr-2" />
                                                    {moveRefused}
                                                </DropdownMenuItem>
                                            )}
                                            {noteModalCallId === call.id && (
                                                <div className="mt-2 p-4 border rounded bg-muted space-y-2 w-full max-w-md">
                                                    <label className="text-sm font-medium">{refuseReasonLabel}</label>
                                                    <textarea
                                                        value={noteText}
                                                        onChange={(e) => setNoteText(e.target.value)}
                                                        placeholder={refuseReasonPlaceholder}
                                                        className="w-full h-20 border rounded p-2 text-sm"
                                                    />
                                                    <div className="flex justify-end space-x-2">
                                                        <Button variant="secondary" onClick={() => setNoteModalCallId(null)}>
                                                            {cancelLabel}
                                                        </Button>
                                                        <Button
                                                            onClick={() => {
                                                                handleCallAction(call.id, 'REFUSED', noteText);
                                                                setNoteModalCallId(null);
                                                                setNoteText('');
                                                            }}
                                                        >
                                                            {confirmLabel}
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                            {call.status !== 'NO_SHOW' && (
                                                <DropdownMenuItem onClick={() => handleCallAction(call.id, 'NO_SHOW', null)}>
                                                    <XCircle className="w-4 h-4 mr-2" />
                                                    {moveNoShow}
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            ))}

                            {filteredCalls.length === 0 && (
                                <div className="text-center py-12">
                                    <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-medium mb-2">{noCallsTitle}</h3>
                                    <p className="text-muted-foreground mb-4">
                                        {noCallsDescription}
                                    </p>

                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
