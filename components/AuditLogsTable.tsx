"use client";

import React, { useEffect, useState, useCallback, Fragment } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import apiClient, { AuditLog, AuditLogFilters } from '@/lib/api';
import { DateRange } from 'react-day-picker';
import { addDays } from 'date-fns';

export default function AuditLogsTable() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState<AuditLogFilters>({
        page: 1,
        event: undefined,
        user_id: undefined,
        subject_type: undefined,
    });
    const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
    const [expandedRows, setExpandedRows] = useState<number[]>([]);
    const [search, setSearch] = useState('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: addDays(new Date(), -30),
        to: new Date(),
    });

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const apiFilters: AuditLogFilters = {
                ...filters,
                date_from: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
                date_to: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
            };

            const response = await apiClient.fetchAuditLogs(apiFilters);
            if (response && response.data) {
                setLogs(response.data);
                setMeta(response.meta);
            }
        } catch (error) {
            console.error("Failed to fetch audit logs", error);
        } finally {
            setLoading(false);
        }
    }, [filters, dateRange]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]); // Refetch when fetchLogs (dependencies) change

    const handleSearch = () => {
        // Simple logic to try parsing search as user_id or subject_id if needed,
        // or just pass as a generic search if API supports it.
        // For now assuming search maps to user_id for demonstration if numeric.
        const userId = parseInt(search);
        if (!isNaN(userId)) {
            setFilters(prev => ({ ...prev, user_id: userId, page: 1 }));
        } else {
            // Reset if empty
            if (search === '') {
                setFilters(prev => ({ ...prev, user_id: undefined, page: 1 }));
            }
        }
        // Ideally update this to actual search logic
    };

    const toggleRow = (id: number) => {
        setExpandedRows(prev =>
            prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
        );
    };

    const getEventColor = (event: string) => {
        switch (event) {
            case 'created': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
            case 'updated': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
            case 'deleted': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    const renderDiff = (oldVals: any, newVals: any) => {
        if (!oldVals && !newVals) return <div className="text-sm text-gray-500">No changes recorded</div>;

        // Combine keys
        const allKeys = new Set([...Object.keys(oldVals || {}), ...Object.keys(newVals || {})]);

        return (
            <div className="grid grid-cols-1 gap-2 text-sm bg-muted/50 p-4 rounded-md">
                {Array.from(allKeys).map(key => {
                    const oldV = oldVals?.[key];
                    const newV = newVals?.[key];

                    if (JSON.stringify(oldV) === JSON.stringify(newV)) return null; // Skip unchanged

                    return (
                        <div key={key} className="grid grid-cols-12 gap-4 border-b border-border/50 pb-2 last:border-0 last:pb-0">
                            <div className="col-span-3 font-semibold text-muted-foreground">{key}</div>
                            <div className="col-span-4 text-red-600 dark:text-red-400 line-through break-all">
                                {JSON.stringify(oldV)}
                            </div>
                            <div className="col-span-1 text-center text-muted-foreground">→</div>
                            <div className="col-span-4 text-green-600 dark:text-green-400 break-all">
                                {JSON.stringify(newV)}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <Card className="border border-border/60 bg-card/80 shadow-sm">
            <CardHeader>
                <CardTitle>Audit Logs</CardTitle>
                <div className="flex flex-col md:flex-row gap-4 mt-4">
                    {/* Simple Date Picker Placeholder - replacing specific component import if issues arise
                 In real implementation, use the project's standard DatePickerWithRange
             */}
                    <div className="flex gap-2">
                        <Input
                            type="date"
                            className="w-[150px]"
                            value={dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : ''}
                            onChange={(e) => setDateRange(prev => ({ to: prev?.to, from: e.target.value ? new Date(e.target.value) : undefined }))}
                        />
                        <Input
                            type="date"
                            className="w-[150px]"
                            value={dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : ''}
                            onChange={(e) => setDateRange(prev => ({ from: prev?.from, to: e.target.value ? new Date(e.target.value) : undefined }))}
                        />
                    </div>

                    <Select
                        onValueChange={(val) => setFilters(prev => ({ ...prev, event: val === 'all' ? undefined : val, page: 1 }))}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Event Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Events</SelectItem>
                            <SelectItem value="created">Created</SelectItem>
                            <SelectItem value="updated">Updated</SelectItem>
                            <SelectItem value="deleted">Deleted</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="flex w-full max-w-sm items-center space-x-2">
                        <Input
                            type="text"
                            placeholder="Search User ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button type="button" onClick={handleSearch} size="icon">
                            <Search className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border border-border/60">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Actor</TableHead>
                                <TableHead>One-line Action</TableHead>
                                <TableHead>Event</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>IP</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                                    </TableCell>
                                </TableRow>
                            ) : logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                        No audit logs found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log, key) => (
                                    <Fragment key={log.id}>
                                        <TableRow
                                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                                            onClick={() => toggleRow(log.id)}
                                        >
                                            <TableCell>
                                                {expandedRows.includes(log.id) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap font-medium text-xs text-muted-foreground">
                                                {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm')}
                                            </TableCell>
                                            <TableCell>{log.actor_name}</TableCell>
                                            <TableCell>{log.action}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`${getEventColor(log.event)} border`}>
                                                    {log.event}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                                                    {log.subject_type}:{log.subject_id}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">{log.ip}</TableCell>
                                        </TableRow>
                                        {expandedRows.includes(log.id) && (
                                            <TableRow className="bg-muted/10 hover:bg-muted/10">
                                                <TableCell colSpan={7} className="p-4">
                                                    {renderDiff(log.old_values, log.new_values)}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </Fragment>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-end space-x-2 py-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}
                        disabled={filters.page === 1 || loading}
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                    </Button>
                    <div className="text-sm text-muted-foreground">
                        Page {meta.current_page} of {meta.last_page}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
                        disabled={filters.page === meta.last_page || loading}
                    >
                        Next
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card >
    );
}
