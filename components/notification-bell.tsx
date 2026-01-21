'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from '@/lib/navigation';
import { formatDistanceToNow } from 'date-fns';
import { enUS, ro as roLocale } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
    Bell, BellRing, Check, CheckCheck, Settings, Eye, Clock,
    Rocket, Package, MessageSquare, Cog
} from 'lucide-react';

import { useNotifications } from '@/contexts/notification-context';
import type { AppNotification } from '@/contexts/notification-context';
import { useLocale, useTranslations } from 'next-intl';

export function NotificationBell() {
    const router = useRouter();
    const locale = useLocale();
    const t = useTranslations();
    const notificationsTitle = t('common.notifications.title');
    const openNotificationsAria = t('common.notifications.open_aria');
    const unreadCountTemplate = t('common.notifications.unread_count');
    const allReadText = t('common.notifications.all_read');
    const webPushTitle = t('common.notifications.web_push_title');
    const webPushUnsupported = t('common.notifications.web_push_unsupported');
    const webPushDenied = t('common.notifications.web_push_denied');
    const webPushEnabledHint = t('common.notifications.web_push_enabled_hint');
    const notificationsListLabel = t('common.notifications.list_aria');
    const noNotificationsText = t('common.notifications.empty');
    const endOfListText = t('common.notifications.end_of_list');
    const seeAllText = t('common.notifications.see_all');
    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        isWebPushSupported,
        isWebPushEnabled,
        webPushPermission,
        enableWebPush,
        disableWebPush,
        loading,
        loadingMore,
        hasMore,
        refresh,
        loadMore,
    } = useNotifications();
    const distanceLocale = locale === 'en' ? enUS : roLocale;
    const unreadCountText = unreadCountTemplate.replace('{count}', String(unreadCount));

    const [showSettings, setShowSettings] = useState(false);
    const [open, setOpen] = useState(false);

    const viewportRef = useRef<HTMLDivElement | null>(null);

    // onScroll simplu pe containerul nostru
    const handleScroll = () => {
        const el = viewportRef.current;
        if (!el || loading || loadingMore || !hasMore) return;
        const threshold = 96; // px până la capăt
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - threshold) {
            void loadMore();
        }
    };

    useEffect(() => {
        if (!open) return;
        const el = viewportRef.current;
        if (!el) return;
        // trigger loadMore dacă lista e scurtă și avem more
        if (hasMore && el.scrollHeight <= el.clientHeight) {
            void loadMore();
        }
    }, [open, hasMore, loadMore]);

    const getNotificationColor = (type: AppNotification['type'], isRead: boolean) => {
        if (isRead) return 'bg-gray-50 dark:bg-gray-900/50';
        switch (type) {
            case 'PROJECT_ADDED': return 'bg-emerald-50/70 dark:bg-emerald-500/10 border-l-4 border-l-[#1BC47D]';
            case 'ORDER_UPDATE': return 'bg-emerald-100/60 dark:bg-emerald-500/15 border-l-4 border-l-[#21D19F]';
            case 'MESSAGE': return 'bg-slate-50 dark:bg-[#0B1220] border-l-4 border-l-[#0B1C2D]';
            case 'SYSTEM':
            default: return 'bg-amber-50 dark:bg-amber-950/40 border-l-4 border-l-amber-500';
        }
    };

    const getNotificationIcon = (type: AppNotification['type']) => {
        switch (type) {
            case 'PROJECT_ADDED': return <Rocket className="w-4 h-4 text-emerald-600" />;
            case 'ORDER_UPDATE': return <Package className="w-4 h-4 text-emerald-500" />;
            case 'MESSAGE': return <MessageSquare className="w-4 h-4 text-[#0B1C2D] dark:text-emerald-200" />;
            case 'SYSTEM':
            default: return <Cog className="w-4 h-4 text-amber-500" />;
        }
    };

    const navigateFor = (n: AppNotification) => {
        const link = n.data?.link as string | undefined;
        if (link) return link;
        switch (n.type) {
            case 'PROJECT_ADDED': return n.data?.projectId ? `/projects/${n.data.projectId}` : '/projects';
            case 'ORDER_UPDATE': return '/dashboard?tab=orders';
            case 'MESSAGE': return '/dashboard?tab=messages';
            default: return '/dashboard';
        }
    };

    const onClickNotification = async (n: AppNotification) => {
        if (!n.isRead) await markAsRead(n.id);
        router.push(navigateFor(n));
    };

    const handleWebPushToggle = async (enabled: boolean) => {
        if (enabled) await enableWebPush();
        else await disableWebPush();
    };

    return (
        <Popover
            onOpenChange={(isOpen) => {
                setOpen(isOpen);
                if (isOpen && notifications.length === 0) void refresh();
            }}
        >
            <PopoverTrigger asChild>
                <Button
                    aria-label={openNotificationsAria}
                    variant="ghost"
                    size="icon"
                    className="relative w-11 h-11 rounded-xl text-[#0B1C2D] transition-all duration-200 hover:scale-105 hover:bg-emerald-50/70 hover:text-[#0B1C2D] dark:text-white dark:hover:bg-emerald-500/10 dark:hover:text-white"
                >
                    {unreadCount > 0 ? <BellRing className="h-5 w-5 text-emerald-600" /> : <Bell className="h-5 w-5" />}
                    {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-gradient-to-r from-[#E5484D] to-[#F5A623] text-white text-xs border-2 border-background">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-96 p-0" align="end">
                <Card className="border-0 shadow-2xl rounded-2xl overflow-hidden bg-white/95 dark:bg-[#0B1220]">
                    <CardHeader className="pb-3 border-b border-emerald-100/60 dark:border-emerald-500/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg text-[#0B1C2D] dark:text-white">{notificationsTitle}</CardTitle>
                                <CardDescription>
                                    {unreadCount > 0 ? unreadCountText : allReadText}
                                </CardDescription>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button variant="ghost" size="icon" onClick={() => setShowSettings(s => !s)} className="w-8 h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50/70 dark:text-emerald-300 dark:hover:bg-emerald-500/10">
                                    <Settings className="w-4 h-4" />
                                </Button>
                                {unreadCount > 0 && (
                                    <Button variant="ghost" size="icon" onClick={markAllAsRead} className="w-8 h-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50/70 dark:text-emerald-300 dark:hover:bg-emerald-500/10">
                                        <CheckCheck className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>

                    {showSettings && (
                        <>
                            <CardContent className="py-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">{webPushTitle}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {!isWebPushSupported
                                                ? webPushUnsupported
                                                : webPushPermission === 'denied'
                                                    ? webPushDenied
                                                    : webPushEnabledHint}
                                        </div>
                                    </div>
                                    <Switch
                                        checked={isWebPushEnabled}
                                        onCheckedChange={handleWebPushToggle}
                                        disabled={!isWebPushSupported || webPushPermission === 'denied'}
                                    />
                                </div>
                            </CardContent>
                            <Separator />
                        </>
                    )}

                    <CardContent className="p-0">
                        {/* container propriu scrollabil */}
                        <div
                            ref={viewportRef}
                            className="h-72 overflow-auto"
                            onScroll={handleScroll}
                            role="list"
                            aria-label={notificationsListLabel}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="text-center py-8 px-4">
                                    <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                    <p className="text-muted-foreground">{noNotificationsText}</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {notifications.map((n) => (
                                        <div
                                            key={n.id}
                                            className={`p-4 cursor-pointer transition-colors hover:bg-emerald-50/60 dark:hover:bg-emerald-500/10 ${getNotificationColor(n.type, n.isRead)}`}
                                            onClick={() => onClickNotification(n)}
                                            role="listitem"
                                        >
                                            <div className="flex items-start space-x-3">
                                                <div className="flex-shrink-0 mt-1">
                                                    {n.type === 'PROJECT_ADDED' ? <Rocket className="w-4 h-4 text-emerald-600" /> :
                                                        n.type === 'ORDER_UPDATE' ? <Package className="w-4 h-4 text-emerald-500" /> :
                                                            n.type === 'MESSAGE' ? <MessageSquare className="w-4 h-4 text-[#0B1C2D] dark:text-emerald-200" /> :
                                                                <Cog className="w-4 h-4 text-amber-500" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <p className={`text-sm font-medium ${!n.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                                {n.title}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{n.message}</p>
                                                            <div className="flex items-center space-x-2 mt-2">
                                                                <Clock className="w-3 h-3 text-muted-foreground" />
                                                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: distanceLocale })}
                                </span>
                                                            </div>
                                                        </div>
                                                        {!n.isRead && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={async (e) => { e.stopPropagation(); await markAsRead(n.id); }}
                                                                className="w-6 h-6"
                                                            >
                                                                <Check className="w-3 h-3" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {loadingMore && (
                                        <div className="flex items-center justify-center py-3">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                                        </div>
                                    )}

                                    {!hasMore && (
                                        <div className="py-3 text-center text-xs text-muted-foreground">
                                            {endOfListText}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardContent>

                    {notifications.length > 0 && (
                        <>
                            <Separator />
                            <CardContent className="py-3">
                                <Button variant="outline" className="w-full" size="sm" onClick={() => router.push('/notifications')}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    {seeAllText}
                                </Button>
                            </CardContent>
                        </>
                    )}
                </Card>
            </PopoverContent>
        </Popover>
    );
}
