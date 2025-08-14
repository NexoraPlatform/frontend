'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import Echo from 'laravel-echo';
import type { Channel } from 'laravel-echo';
import Pusher from 'pusher-js';

type RawLaravelNotification = {
    id: string;
    type: string;
    data: any;
    created_at?: string;
    read_at?: string | null;
};

export type AppNotification = {
    id: string;
    type: 'PROJECT_ADDED' | 'ORDER_UPDATE' | 'MESSAGE' | 'SYSTEM';
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    data: any;
};

type Ctx = {
    notifications: AppNotification[];
    unreadCount: number;
    loading: boolean;

    isWebPushSupported: boolean;
    webPushPermission: NotificationPermission;
    isWebPushEnabled: boolean;
    enableWebPush: () => Promise<void>;
    disableWebPush: () => Promise<void>;

    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    refresh: () => Promise<void>;
};

const NotificationContext = createContext<Ctx | null>(null);

function mapType(laraType: string, data: any): AppNotification['type'] {
    const t = (laraType || '').toLowerCase();
    if (t.startsWith('chat.')) return 'MESSAGE';
    if (t === 'project.requested') return 'PROJECT_ADDED';
    if (t === 'budget.accepted' || t === 'budget.rejected' || t === 'budget.suggested' || t === 'budget.decision') {
        return 'ORDER_UPDATE';
    }
    return 'SYSTEM';
}

function normalize(n: RawLaravelNotification): AppNotification {
    const type = mapType(n.type, n.data);
    return {
        id: String(n.id),
        type,
        title: n.data?.title ?? 'Notificare',
        message: n.data?.message ?? '',
        isRead: !!n.read_at,
        createdAt: n.created_at ?? new Date().toISOString(),
        data: n.data ?? {},
    };
}

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replaceAll('-', '+').replaceAll('_', '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
}

let echoSingleton: Echo<any> | null = null;
function getOrCreateEcho(token: string): Echo<any> {
    if (echoSingleton) return echoSingleton;

    (window as any).Pusher = Pusher;
    echoSingleton = new Echo({
        broadcaster: 'pusher',
        key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        authEndpoint: `${process.env.NEXT_PUBLIC_API_URL}/broadcasting/auth`,
        auth: { headers: { Authorization: `Bearer ${token}` } },
        forceTLS: true,
        enableStats: false,
    });

    return echoSingleton;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const [isWebPushSupported] = useState<boolean>(() => {
        return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    });
    const [webPushPermission, setWebPushPermission] = useState<NotificationPermission>(typeof window === 'undefined' ? 'default' : Notification.permission);
    const [isWebPushEnabled, setIsWebPushEnabled] = useState(false);

    const privateChannelRef = useRef<Channel | null>(null);;

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            // server returns pagination { data: [], ... }
            const list = await apiClient.getNotifications({ limit: 50 });
            const arr: RawLaravelNotification[] = Array.isArray((list as any).data) ? (list as any).data : (Array.isArray(list) ? list : []);
            setNotifications(arr.map(normalize));
            const cnt = await apiClient.getNotifications({ unreadOnly: true, limit: 1 }).catch(() => null);
            if (cnt && Array.isArray((cnt as any).data)) {
                // If you prefer a dedicated unread-count endpoint:
                // const res = await fetch(`${API_BASE_URL}/notifications/unread-count`, ...)
                // setUnreadCount(res.unread)
                const onlyUnread = (cnt as any).data as RawLaravelNotification[];
                setUnreadCount(onlyUnread.length); // rough; or call /unread-count in your apiClient
            } else {
                // Better: call the unread count endpoint that you already have
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/unread-count`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
                    cache: 'no-store',
                });
                if (res.ok) {
                    const j = await res.json();
                    setUnreadCount(Number(j.unread ?? 0));
                }
            }
        } finally {
            setLoading(false);
        }
    }, []);

    const refresh = fetchAll;

    // ----- Real-time via Pusher/Laravel Echo (notifications.broadcast) -----
    useEffect(() => {
        if (!user) return;

        const token = localStorage.getItem('auth_token');
        if (!token) return;

        const echo = getOrCreateEcho(token);

        // Laravel Notifications broadcast on private channel: App.Models.User.{id}
        const channelName = `App.Models.User.${user.id}`;
        const ch = echo.private(channelName);

        // Special handler for notifications:
        ch.notification((raw: RawLaravelNotification) => {
            const n = normalize(raw);
            setNotifications(prev => [n, ...prev].slice(0, 200));
            setUnreadCount(prev => prev + 1);
        });

        privateChannelRef.current = ch;

        return () => {
            try {
                if (echo && (echo as any).leave) (echo as any).leave(channelName);
            } catch {}
            privateChannelRef.current = null;
        };
    }, [user]);

    // ----- Web Push subscription status -----
    const readPushStatus = useCallback(async () => {
        if (!isWebPushSupported) return;
        const reg = await navigator.serviceWorker.getRegistration();
        setWebPushPermission(Notification.permission);
        if (!reg) {
            setIsWebPushEnabled(false);
            return;
        }
        const sub = await reg.pushManager.getSubscription();
        setIsWebPushEnabled(!!sub);
    }, [isWebPushSupported]);

    useEffect(() => {
        if (!isWebPushSupported) return;
        readPushStatus();
    }, [isWebPushSupported, readPushStatus]);

    // ----- Actions -----
    const markAsRead = useCallback(async (id: string) => {
        await apiClient.markNotificationAsRead(id);
        setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
        setUnreadCount(prev => Math.max(0, prev - 1));
    }, []);

    const markAllAsRead = useCallback(async () => {
        await apiClient.markAllNotificationsAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
    }, []);

    const deleteNotification = useCallback(async (id: string) => {
        await apiClient.deleteNotification(id);
        setNotifications(prev => prev.filter(n => n.id !== id));
        // if it was unread, adjust count
        setUnreadCount(prev => {
            const wasUnread = notifications.find(n => n.id === id)?.isRead === false;
            return wasUnread ? Math.max(0, prev - 1) : prev;
        });
    }, [notifications]);

    const enableWebPush = useCallback(async () => {
        if (!isWebPushSupported) return;

        // 1) Register SW
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

        // 2) Request permission
        const permission = await Notification.requestPermission();
        setWebPushPermission(permission);
        if (permission !== 'granted') return;

        // 3) Subscribe
        const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
        const subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID),
        });

        // 4) Send to backend
        await apiClient.subscribeToNotifications(subscription, navigator);
        setIsWebPushEnabled(true);
    }, [isWebPushSupported]);

    const disableWebPush = useCallback(async () => {
        if (!isWebPushSupported) return;
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) return;

        const sub = await reg.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();

        try { await apiClient.unsubscribeFromNotifications(); } catch {}

        setIsWebPushEnabled(false);
        setWebPushPermission(Notification.permission);
    }, [isWebPushSupported]);

    // Initial load (list + unread)
    useEffect(() => {
        if (!user) {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            return;
        }
        fetchAll();
    }, [user, fetchAll]);

    const value = useMemo<Ctx>(() => ({
        notifications,
        unreadCount,
        loading,
        isWebPushSupported,
        webPushPermission,
        isWebPushEnabled,
        enableWebPush,
        disableWebPush,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refresh,
    }), [
        notifications, unreadCount, loading,
        isWebPushSupported, webPushPermission, isWebPushEnabled,
        enableWebPush, disableWebPush, markAsRead, markAllAsRead, deleteNotification, refresh
    ]);

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications(): Ctx {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error('useNotifications must be used within <NotificationProvider>');
    return ctx;
}
