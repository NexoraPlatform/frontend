"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Activity as ActivityIcon,
    Loader2,
    ChevronLeft,
    ChevronRight,
    FileText,
    TrendingUp,
    Users,
    CheckCircle,
    Clock,
    Mail
} from 'lucide-react';
import apiClient, { Activity, ActivityPageResponse } from '@/lib/api';

const renderActivityMessage = (activity: Activity) => {
    const { type, metadata } = activity;

    switch (type) {
        case 'project_created':
            return `Project "${metadata.project_name}" was created`;
        case 'invoice_paid':
            return `Paid invoice ${metadata.invoice_id} of ${metadata.amount}`;
        case 'proposal_received':
            return `New proposal received for project "${metadata.project_name}"`;
        case 'project_paid':
            return `Project "${metadata.project_name}" was paid`;
        default:
            return 'Activity recorded in the system';
    }
};

const getActivityIcon = (type: string) => {
    switch (type) {
        case 'project_created':
            return { icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' };
        case 'invoice_paid':
        case 'project_paid':
            return { icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' };
        case 'proposal_received':
            return { icon: FileText, color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
        default:
            return { icon: ActivityIcon, color: 'text-gray-500', bg: 'bg-gray-500/10' };
    }
};

export default function ActivitiesList() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState<ActivityPageResponse['meta'] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchActivities = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await apiClient.getActivities(page);
                if (response && response.data) {
                    setActivities(response.data);
                    setMeta(response.meta);
                } else {
                    setError("Failed to load activities");
                }
            } catch (err) {
                console.error("Failed to fetch activities:", err);
                setError("An error occurred while loading activities");
            } finally {
                setLoading(false);
            }
        };

        fetchActivities();
    }, [page]);

    const handlePrevPage = () => {
        if (page > 1) setPage(p => p - 1);
    };

    const handleNextPage = () => {
        if (meta && page < meta.last_page) setPage(p => p + 1);
    };

    if (loading && activities.length === 0) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <Card className="border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20">
                <CardContent className="p-6 text-center text-red-600 dark:text-red-400">
                    {error}
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4">
                {activities.map((activity) => {
                    const { icon: Icon, color, bg } = getActivityIcon(activity.type);
                    const isRead = !!activity.read_at;

                    return (
                        <Card key={activity.id} className={`overflow-hidden border border-border/60 bg-card/80 transition-all hover:bg-card dark:border-slate-800/70 dark:bg-slate-900/60 ${!isRead ? 'ring-1 ring-sky-500/30' : ''}`}>
                            <CardContent className="p-4 sm:p-6">
                                <div className="flex items-start gap-4">
                                    <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg} ${color}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                            <p className="text-sm font-semibold text-foreground">
                                                {renderActivityMessage(activity)}
                                            </p>
                                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                                                <Clock className="h-3.5 w-3.5" />
                                                {activity.created_at_human}
                                            </span>
                                        </div>
                                        {/* Activity detail could go here if available */}
                                        <div className="mt-2 flex items-center gap-3">
                                            {!isRead && (
                                                <span className="inline-flex items-center rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-600 dark:text-sky-400">
                                                    New
                                                </span>
                                            )}
                                            <span className="text-[10px] text-muted-foreground">
                                                ID: #{activity.id}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {meta && meta.last_page > 1 && (
                <div className="flex items-center justify-between border-t border-border/60 pt-6 dark:border-slate-800/70">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrevPage}
                        disabled={page === 1 || loading}
                    >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Previous
                    </Button>
                    <div className="text-xs text-muted-foreground">
                        Page {page} of {meta.last_page} ({meta.total} total)
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={page === meta.last_page || loading}
                    >
                        Next
                        <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            )}

            {activities.length === 0 && (
                <div className="flex h-40 flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 bg-muted/30 dark:border-slate-800/70">
                    <ActivityIcon className="mb-2 h-10 w-10 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">No activities found.</p>
                </div>
            )}
        </div>
    );
}
