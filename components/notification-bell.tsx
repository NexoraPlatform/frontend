'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ro } from 'date-fns/locale';

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

export function NotificationBell() {
    const router = useRouter();
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
            case 'PROJECT_ADDED': return 'bg-blue-50 dark:bg-blue-950/50 border-l-4 border-l-blue-500';
            case 'ORDER_UPDATE': return 'bg-green-50 dark:bg-green-950/50 border-l-4 border-l-green-500';
            case 'MESSAGE': return 'bg-purple-50 dark:bg-purple-950/50 border-l-4 border-l-purple-500';
            case 'SYSTEM':
            default: return 'bg-orange-50 dark:bg-orange-950/50 border-l-4 border-l-orange-500';
        }
    };

    const getNotificationIcon = (type: AppNotification['type']) => {
        switch (type) {
            case 'PROJECT_ADDED': return <Rocket className="w-4 h-4 text-blue-500" />;
            case 'ORDER_UPDATE': return <Package className="w-4 h-4 text-green-500" />;
            case 'MESSAGE': return <MessageSquare className="w-4 h-4 text-purple-500" />;
            case 'SYSTEM':
            default: return <Cog className="w-4 h-4 text-orange-500" />;
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
                    aria-label="Deschide notificarile"
                    variant="ghost"
                    size="icon"
                    className="relative w-11 h-11 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-xl transition-all duration-200 hover:scale-105"
                >
                    {unreadCount > 0 ? <BellRing className="h-5 w-5 text-blue-600" /> : <Bell className="h-5 w-5" />}
                    {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs border-2 border-background">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-96 p-0" align="end">
                <Card className="border-0 shadow-lg">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">Notificări</CardTitle>
                                <CardDescription>
                                    {unreadCount > 0 ? `${unreadCount} notificări necitite` : 'Toate notificările sunt citite'}
                                </CardDescription>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button variant="ghost" size="icon" onClick={() => setShowSettings(s => !s)} className="w-8 h-8">
                                    <Settings className="w-4 h-4" />
                                </Button>
                                {unreadCount > 0 && (
                                    <Button variant="ghost" size="icon" onClick={markAllAsRead} className="w-8 h-8">
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
                                        <div className="font-medium">Notificări Web Push</div>
                                        <div className="text-sm text-muted-foreground">
                                            {!isWebPushSupported
                                                ? 'Nu sunt suportate de browser'
                                                : webPushPermission === 'denied'
                                                    ? 'Permisiunea a fost refuzată'
                                                    : 'Primește notificări chiar și când site-ul este închis'}
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
                            aria-label="Lista notificări"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="text-center py-8 px-4">
                                    <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                    <p className="text-muted-foreground">Nu ai notificări</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {notifications.map((n) => (
                                        <div
                                            key={n.id}
                                            className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${getNotificationColor(n.type, n.isRead)}`}
                                            onClick={() => onClickNotification(n)}
                                            role="listitem"
                                        >
                                            <div className="flex items-start space-x-3">
                                                <div className="flex-shrink-0 mt-1">
                                                    {n.type === 'PROJECT_ADDED' ? <Rocket className="w-4 h-4 text-blue-500" /> :
                                                        n.type === 'ORDER_UPDATE' ? <Package className="w-4 h-4 text-green-500" /> :
                                                            n.type === 'MESSAGE' ? <MessageSquare className="w-4 h-4 text-purple-500" /> :
                                                                <Cog className="w-4 h-4 text-orange-500" />}
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
                                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: ro })}
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
                                            Ai ajuns la capăt
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
                                    Vezi Toate Notificările
                                </Button>
                            </CardContent>
                        </>
                    )}
                </Card>
            </PopoverContent>
        </Popover>
    );
}
