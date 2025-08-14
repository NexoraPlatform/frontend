'use client';

import { useState, MouseEvent } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ro } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

import {
    Bell,
    BellRing,
    Check,
    CheckCheck,
    Settings,
    Trash2,
    Rocket,
    Package,
    MessageSquare,
    Cog,
    Eye,
    Clock,
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
        deleteNotification,
        isWebPushSupported,
        isWebPushEnabled,
        webPushPermission,
        enableWebPush,
        disableWebPush,
        loading,
        refresh,
    } = useNotifications();

    const [showSettings, setShowSettings] = useState(false);

    const getNotificationIcon = (type: AppNotification['type']) => {
        switch (type) {
            case 'PROJECT_ADDED':
                return <Rocket className="w-4 h-4 text-blue-500" />;
            case 'ORDER_UPDATE':
                return <Package className="w-4 h-4 text-green-500" />;
            case 'MESSAGE':
                return <MessageSquare className="w-4 h-4 text-purple-500" />;
            case 'SYSTEM':
            default:
                return <Cog className="w-4 h-4 text-orange-500" />;
        }
    };

    const getNotificationColor = (type: AppNotification['type'], isRead: boolean) => {
        if (isRead) return 'bg-gray-50 dark:bg-gray-900/50';
        switch (type) {
            case 'PROJECT_ADDED':
                return 'bg-blue-50 dark:bg-blue-950/50 border-l-4 border-l-blue-500';
            case 'ORDER_UPDATE':
                return 'bg-green-50 dark:bg-green-950/50 border-l-4 border-l-green-500';
            case 'MESSAGE':
                return 'bg-purple-50 dark:bg-purple-950/50 border-l-4 border-l-purple-500';
            case 'SYSTEM':
            default:
                return 'bg-orange-50 dark:bg-orange-950/50 border-l-4 border-l-orange-500';
        }
    };

    const navigateFor = (n: AppNotification) => {
        // prefer explicit deep-link if backend sent it (for web push parity)
        const link = n.data?.link as string | undefined;
        if (link) return link;

        switch (n.type) {
            case 'PROJECT_ADDED':
                return n.data?.projectId ? `/projects/${n.data.projectId}` : '/projects';
            case 'ORDER_UPDATE':
                return '/dashboard?tab=orders';
            case 'MESSAGE':
                // If your chat uses groupId, you can deep-link: `/chat/${n.data?.groupId}`
                return '/dashboard?tab=messages';
            default:
                return '/dashboard';
        }
    };

    const onClickNotification = async (n: AppNotification) => {
        if (!n.isRead) {
            await markAsRead(n.id);
        }
        router.push(navigateFor(n));
    };

    const onDelete = async (e: MouseEvent, id: string, wasUnread: boolean) => {
        e.stopPropagation();
        await deleteNotification(id);
        // unreadCount is managed in context; no extra code needed here
    };

    const handleWebPushToggle = async (enabled: boolean) => {
        if (enabled) await enableWebPush();
        else await disableWebPush();
    };
console.log(notifications)
    return (
        <Popover onOpenChange={(open) => open && refresh()}>
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
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setShowSettings((s) => !s)}
                                    className="w-8 h-8"
                                >
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
                                <div className="space-y-4">
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

                                    {webPushPermission === 'denied' && (
                                        <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950/20 p-2 rounded">
                                            Pentru a activa notificările, accesează setările browser-ului și permite notificările
                                            pentru acest site.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                            <Separator />
                        </>
                    )}

                    <CardContent className="p-0">
                        <ScrollArea className="h-96">
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
                                    {notifications.map((n: AppNotification) => (
                                        <div
                                            key={n.id}
                                            className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${getNotificationColor(
                                                n.type,
                                                n.isRead
                                            )}`}
                                            onClick={() => onClickNotification(n)}
                                        >
                                            <div className="flex items-start space-x-3">
                                                <div className="flex-shrink-0 mt-1">{getNotificationIcon(n.type)}</div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <p
                                                                className={`text-sm font-medium ${
                                                                    !n.isRead ? 'text-foreground' : 'text-muted-foreground'
                                                                }`}
                                                            >
                                                                {n.title}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{n.message}</p>
                                                            <div className="flex items-center space-x-2 mt-2">
                                                                <Clock className="w-3 h-3 text-muted-foreground" />
                                                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(n.createdAt), {
                                      addSuffix: true,
                                      locale: ro,
                                  })}
                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center space-x-1 ml-2">
                                                            {!n.isRead && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={async (e) => {
                                                                        e.stopPropagation();
                                                                        await markAsRead(n.id);
                                                                    }}
                                                                    className="w-6 h-6"
                                                                >
                                                                    <Check className="w-3 h-3" />
                                                                </Button>
                                                            )}
                                                            {/*<Button*/}
                                                            {/*    variant={n.isRead ? 'ghost' : 'ghost'}*/}
                                                            {/*    size="icon"*/}
                                                            {/*    onClick={(e) => onDelete(e, n.id, !n.isRead)}*/}
                                                            {/*    className="w-6 h-6 text-red-500 hover:text-red-700"*/}
                                                            {/*>*/}
                                                            {/*    <Trash2 className="w-3 h-3" />*/}
                                                            {/*</Button>*/}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>

                    {notifications.length > 0 && (
                        <>
                            <Separator />
                            <CardContent className="py-3">
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    size="sm"
                                    onClick={() => router.push('/notifications')}
                                >
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
