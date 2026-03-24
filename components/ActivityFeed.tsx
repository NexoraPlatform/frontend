"use client";

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@/lib/navigation';
import { Activity as ActivityIcon, Loader2, TrendingUp, FileText, ArrowRight } from 'lucide-react';
import apiClient, { RecentActivityQuick } from '@/lib/api';

type ActivityFeedProps = {
    withCard?: boolean;
    title?: string;
};

const getActivityIcon = (activity: RecentActivityQuick) => {
    const actionKey = (activity.action ?? activity.type ?? '').toLowerCase();
    const lowerTitle = activity.title.toLowerCase();

    if (actionKey === 'project.created' || lowerTitle.includes('project created')) {
        return { icon: FileText, color: 'text-blue-500' };
    } else if (actionKey.includes('payment') || lowerTitle.includes('paid')) {
        return { icon: TrendingUp, color: 'text-green-500' };
    } else if (actionKey.includes('proposal') || lowerTitle.includes('proposal')) {
        return { icon: FileText, color: 'text-yellow-500' };
    } else {
        return { icon: ActivityIcon, color: 'text-gray-500' };
    }
};

export default function ActivityFeed({
    withCard = true,
    title = 'Recent Activity (Quick View)',
}: ActivityFeedProps = {}) {
    const [activities, setActivities] = useState<RecentActivityQuick[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const locale = useLocale();

    useEffect(() => {
        const fetchActivities = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await apiClient.getRecentActivitiesQuick(locale === 'ro' ? 'ro' : 'en');
                if (Array.isArray(response)) {
                    setActivities(response);
                } else {
                    console.error("Invalid API response format", response);
                    setError("Failed to load activities");
                }
            } catch (err) {
                console.error("Failed to fetch activities:", err);
                setError("Failed to load activities");
            } finally {
                setLoading(false);
            }
        };

        fetchActivities();
    }, [locale]);

    const content = (
        <>
            {withCard ? (
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center space-x-2 text-foreground">
                        <ActivityIcon className="w-5 h-5" />
                        <span>{title}</span>
                    </CardTitle>
                </CardHeader>
            ) : null}
            <CardContent className={withCard ? undefined : 'p-0'}>
                {loading && activities.length === 0 ? (
                    <div className="flex justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : error ? (
                    <div className="py-4 text-center text-red-500">{error}</div>
                ) : (
                    <div className="space-y-4">
                        {activities.length === 0 ? (
                            <div className="py-4 text-center text-muted-foreground">No recent activity.</div>
                        ) : (
                            activities.map((activity, index) => {
                                const { icon: Icon, color } = getActivityIcon(activity);
                                return (
                                    <div key={activity.id ?? index} className="flex items-center space-x-3 rounded-2xl border border-border/60 bg-background/60 p-3 transition-colors hover:border-sky-500/30 hover:bg-background dark:border-slate-800/70 dark:bg-slate-950/60 dark:hover:border-sky-500/30 dark:hover:bg-slate-950">
                                        <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-muted/60 ${color}`}>
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-foreground">
                                                {activity.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{activity.time_ago}</p>
                                        </div>
                                    </div>
                                );
                            })
                        )}

                        {activities.length >= 5 ? (
                            <div className="border-t border-border/60 pt-4 dark:border-slate-800/70">
                                <Link href="/admin/activity" className="w-full">
                                    <Button variant="ghost" className="w-full justify-between text-muted-foreground hover:text-foreground">
                                        <span>View All Activity</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        ) : null}
                    </div>
                )}
            </CardContent>
        </>
    );

    if (!withCard) {
        return content;
    }

    return (
        <Card className="border border-border/60 bg-card/80 text-foreground shadow-[0_16px_40px_-32px_rgba(15,23,42,0.25)] dark:border-slate-800/70 dark:bg-slate-900/70 dark:text-slate-100 dark:shadow-[0_16px_40px_-32px_rgba(15,23,42,0.9)]">
            {content}
        </Card>
    );
}
