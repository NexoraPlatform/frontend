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
import {addDays, isWithinInterval, parseISO} from 'date-fns';
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
            alert('Eroare: ' + error.message);
        }
    };

    const filteredCalls = (callsData?.calls || []).filter((call: any) => {
        const matchesSearch = call.interviewer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            call.interviewer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            call.interviewer?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            call.attendees.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            call.attendees.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            call.attendees?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            call.service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            call.service.category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        switch (status) {
            case 'WAITING':
                return <Badge className="bg-green-100 text-yellow-500"><CheckCircle className="w-3 h-3 mr-1" />In asteptare</Badge>;
            case 'ACCEPTED':
                return <Badge className="bg-gray-100 text-green-500"><XCircle className="w-3 h-3 mr-1" />Acceptat</Badge>;
            case 'FINISHED':
                return <Badge className="bg-yellow-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Finalizat</Badge>;
            case 'REFUSED':
                return <Badge className="bg-yellow-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Refuzat</Badge>;
            case 'NO_SHOW':
                return <Badge className="bg-yellow-100 text-red-400"><AlertCircle className="w-3 h-3 mr-1" />Nu a intrat</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                    <Link href="/admin">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">Gestionare Apeluri de verificare</h1>
                        <p className="text-muted-foreground">
                            Administrează apelurile de verificare pentru servicii
                        </p>
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
                                    placeholder="Caută teste după participant, data..."
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <Select value={passedFilter} onValueChange={setPassedFilter}>
                            <SelectTrigger className="w-full md:w-48">
                                <SelectValue placeholder="Filtru nivel" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Toate Rezultatele</SelectItem>
                                <SelectItem value="1">Da</SelectItem>
                                <SelectItem value="0">Nu</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full md:w-48">
                                <Filter className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Filtru status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Toate statusurile</SelectItem>
                                <SelectItem value="WAITING">In asteptare</SelectItem>
                                <SelectItem value="ACCEPTED">Acceptat</SelectItem>
                                <SelectItem value="FINISED">Finalizat</SelectItem>
                                <SelectItem value="REFUSED">Refuzat</SelectItem>
                                <SelectItem value="NO_SHOW">Nu a intrat</SelectItem>
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
                                        ? `${range[0].startDate.toLocaleDateString()} - ${range[0].endDate.toLocaleDateString()}`
                                        : "Selectează perioada"}
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
                        <span>Lista Apeluri</span>
                    </CardTitle>
                    <CardDescription>
                        {filteredCalls.length} apeluri găsite
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
                                                <span className="font-medium">{call.service?.name}</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <ListTodo className="w-4 h-4 text-green-500" />
                                                <span><a href={`/admin/tests/${call.test_result.skill_test_id}/statistics`}>Vezi detalii test</a></span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <Clock className="w-4 h-4 text-orange-500" />
                                                <span>Programat la {' '}
                                                  {DateTime.fromISO(call.date_time, { setZone: true })
                                                      .toFormat('dd.MM.yyyy HH:mm')} {' '}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <BarChart3 className="w-4 h-4 text-purple-500" />
                                                <span>Nota de trecere: {call.test_result.score}%</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                            <span>Categorie: {call.service?.category?.name}</span>
                                            <span>Creat: {new Date(call.created_at).toLocaleString('ro-RO') }</span>
                                            {call.results && (
                                                <span>{call.results.length} rezultate</span>
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
                                                    Conecteaza-te la interviu
                                                </Link>
                                            </DropdownMenuItem>
                                            {call.status !== 'WAITING' && (
                                                <DropdownMenuItem onClick={() => handleCallAction(call.id, 'WAITING', null)}>
                                                    <PauseCircleOutlineIcon className="w-4 h-4 mr-2" />
                                                    Muta In Asteptare
                                                </DropdownMenuItem>
                                            )}
                                            {call.status !== 'FINISHED' && (
                                                <DropdownMenuItem onClick={() => handleCallAction(call.id, 'FINISHED', null)}>
                                                    <PlaylistAddCheckCircleIcon className="!w-4 !h-4 mr-2" />
                                                    Muta Finalizat
                                                </DropdownMenuItem>
                                            )}
                                            {call.status !== 'ACCEPTED' && (
                                                <DropdownMenuItem onClick={() => handleCallAction(call.id, 'ACCEPTED', null)}>
                                                    <CheckCircleOutlineIcon className="!w-4 !h-4 mr-2" />
                                                    Muta In Acceptat
                                                </DropdownMenuItem>
                                            )}
                                            {call.status !== 'REFUSED' && (
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => setNoteModalCallId(call.id)}>
                                                    <VisibilityOff className="!w-4 !h-4 mr-2" />
                                                    Muta In Refuzat
                                                </DropdownMenuItem>
                                            )}
                                            {noteModalCallId === call.id && (
                                                <div className="mt-2 p-4 border rounded bg-muted space-y-2 w-full max-w-md">
                                                    <label className="text-sm font-medium">Motiv refuz</label>
                                                    <textarea
                                                        value={noteText}
                                                        onChange={(e) => setNoteText(e.target.value)}
                                                        placeholder="Scrie un motiv..."
                                                        className="w-full h-20 border rounded p-2 text-sm"
                                                    />
                                                    <div className="flex justify-end space-x-2">
                                                        <Button variant="secondary" onClick={() => setNoteModalCallId(null)}>
                                                            Anulează
                                                        </Button>
                                                        <Button
                                                            onClick={() => {
                                                                handleCallAction(call.id, 'REFUSED', noteText);
                                                                setNoteModalCallId(null);
                                                                setNoteText('');
                                                            }}
                                                        >
                                                            Confirmă
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                            {call.status !== 'NO_SHOW' && (
                                                <DropdownMenuItem onClick={() => handleCallAction(call.id, 'NO_SHOW', null)}>
                                                    <XCircle className="w-4 h-4 mr-2" />
                                                    Muta In Nu s-a prezentat
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            ))}

                            {filteredCalls.length === 0 && (
                                <div className="text-center py-12">
                                    <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-medium mb-2">Nu s-au găsit call-uri</h3>
                                    <p className="text-muted-foreground mb-4">
                                        Încearcă să modifici filtrele sau termenii de căutare
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
