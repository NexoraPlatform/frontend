"use client";

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@/lib/navigation';
import { Activity as ActivityIcon, Loader2, TrendingUp, FileText, ArrowRight } from 'lucide-react';
import apiClient, { RecentActivityQuick } from '@/lib/api';

const getActivityIcon = (title: string) => {
    const lowerTitle = title.toLowerCase();

    if (lowerTitle.includes('project created')) {
        return { icon: FileText, color: 'text-blue-500' };
    } else if (lowerTitle.includes('paid')) {
        return { icon: TrendingUp, color: 'text-green-500' };
    } else if (lowerTitle.includes('proposal')) {
        return { icon: FileText, color: 'text-yellow-500' };
    } else {
        return { icon: ActivityIcon, color: 'text-gray-500' };
    }
};

export default function ActivityFeed() {
    const [activities, setActivities] = useState<RecentActivityQuick[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchActivities = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await apiClient.getRecentActivitiesQuick();
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
    }, []);

    return (
        <Card className="border border-border/60 bg-card/80 text-foreground shadow-[0_16px_40px_-32px_rgba(15,23,42,0.25)] dark:border-slate-800/70 dark:bg-slate-900/70 dark:text-slate-100 dark:shadow-[0_16px_40px_-32px_rgba(15,23,42,0.9)]">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center space-x-2 text-foreground">
                    <ActivityIcon className="w-5 h-5" />
                    <span>Recent Activity (Quick View)</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {loading && activities.length === 0 ? (
                    <div className="flex justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : error ? (
                    <div className="text-center text-red-500 py-4">{error}</div>
                ) : (
                    <div className="space-y-4">
                        {activities.length === 0 ? (
                            <div className="text-center text-muted-foreground py-4">No recent activity.</div>
                        ) : (
                            activities.map((activity, index) => {
                                const { icon: Icon, color } = getActivityIcon(activity.title);
                                return (
                                    <div key={index} className="flex items-center space-x-3 rounded-2xl border border-border/60 bg-background/60 p-3 transition-colors hover:border-sky-500/30 hover:bg-background dark:border-slate-800/70 dark:bg-slate-950/60 dark:hover:border-sky-500/30 dark:hover:bg-slate-950">
                                        <div className={`w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center ${color}`}>
                                            <Icon className="w-4 h-4" />
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

                        {activities.length >= 5 && (
                            <div className="pt-4 border-t border-border/60 dark:border-slate-800/70">
                                <Link href="/admin/activity" className="w-full">
                                    <Button variant="ghost" className="w-full justify-between text-muted-foreground hover:text-foreground">
                                        <span>View All Activity</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
