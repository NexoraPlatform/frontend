'use client';

import React, {
    createContext, useCallback, useContext, useEffect, useMemo, useRef, useState
} from 'react';
import { useAuth } from '@/contexts/auth-context';
import Echo from 'laravel-echo';
import type { Channel } from 'laravel-echo';
import Pusher from 'pusher-js';
import { apiClient } from '@/lib/api';

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

type CursorResponse<T> = {
    data: T[];
    nextCursor: string | null;
    prevCursor: string | null;
    hasMore: boolean;
    unreadCount?: number;
};

type Ctx = {
    notifications: AppNotification[];
    unreadCount: number;
    loading: boolean;
    loadingMore: boolean;
    hasMore: boolean;
    refresh: () => Promise<void>;
    loadMore: () => Promise<void>;
    isWebPushSupported: boolean;
    webPushPermission: NotificationPermission;
    isWebPushEnabled: boolean;
    enableWebPush: () => Promise<void>;
    disableWebPush: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
};

const NotificationContext = createContext<Ctx | null>(null);

function mapType(laraType: string | undefined, data?: any): AppNotification['type'] {
    const declared = (data?.type ?? '').toLowerCase();
    if (declared) {
        if (declared.startsWith('chat.')) return 'MESSAGE';
        if (declared === 'project.requested') return 'PROJECT_ADDED';
        if (declared.startsWith('budget.')) return 'ORDER_UPDATE';
    }
    const cls = (laraType ?? '').split('\\').pop()?.toLowerCase() || '';
    if (!cls) return 'SYSTEM';
    if (cls.includes('chat') && (cls.includes('message') || cls.includes('addedtogroup'))) return 'MESSAGE';
    if (cls.includes('projectproviderrequested') || (cls.includes('project') && cls.includes('requested'))) return 'PROJECT_ADDED';
    if (cls.includes('budget') || cls.includes('accepted') || cls.includes('rejected') || cls.includes('suggested') || cls.includes('decision')) {
        return 'ORDER_UPDATE';
    }
    return 'SYSTEM';
}

function normalize(n: RawLaravelNotification): AppNotification {
    const type = mapType(n.type, n.data);
    const title = (n.data?.title ?? '').toString().trim();
    const message = (n.data?.message ?? '').toString().trim();
    return {
        id: String(n.id),
        type,
        title: title || 'Notificare',
        message: message || '',
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

const INITIAL_LIMIT = 10;
const LOAD_MORE_LIMIT = 10;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [isWebPushSupported] = useState<boolean>(() =>
        typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    );
    const [webPushPermission, setWebPushPermission] = useState<NotificationPermission>(
        typeof window === 'undefined' ? 'default' : Notification.permission
    );
    const [isWebPushEnabled, setIsWebPushEnabled] = useState(false);
    const privateChannelRef = useRef<Channel | null>(null);

    const refresh = useCallback(async () => {
        if (!user) return;
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (!token) return;

        setLoading(true);
        try {
            const res: CursorResponse<RawLaravelNotification> = await apiClient.getNotifications({
                limit: INITIAL_LIMIT,
            } as any);
            const items = Array.isArray(res.data) ? res.data : [];
            setNotifications(items.map(normalize));
            if (typeof res.unreadCount === 'number') setUnreadCount(Number(res.unreadCount));
            setHasMore(!!res.hasMore);
            setNextCursor(res.nextCursor ?? null);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const loadMore = useCallback(async () => {
        if (!nextCursor || !hasMore || loadingMore) return;
        setLoadingMore(true);
        try {
            const res: CursorResponse<RawLaravelNotification> = await apiClient.getNotifications({
                limit: LOAD_MORE_LIMIT,
                cursor: nextCursor,
            } as any);
            const items = Array.isArray(res.data) ? res.data : [];
            const normalized = items.map(normalize);
            setNotifications(prev => {
                const seen = new Set(prev.map(p => p.id));
                const merged = [...prev];
                for (const n of normalized) if (!seen.has(n.id)) merged.push(n);
                return merged;
            });
            if (typeof res.unreadCount === 'number') setUnreadCount(Number(res.unreadCount));
            setHasMore(!!res.hasMore);
            setNextCursor(res.nextCursor ?? null);
        } finally {
            setLoadingMore(false);
        }
    }, [nextCursor, hasMore, loadingMore]);

    useEffect(() => {
        if (!user) {
            setNotifications([]);
            setUnreadCount(0);
            setHasMore(false);
            setNextCursor(null);
            setLoading(false);
            return;
        }
        void refresh();
    }, [user, refresh]);

    useEffect(() => {
        if (!user) return;
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (!token) return;

        const echo = getOrCreateEcho(token);
        const channelName = `App.Models.User.${user.id}`;
        const ch = echo.private(channelName);
        privateChannelRef.current = ch;

        ch.notification((raw: RawLaravelNotification) => {
            const n = normalize(raw);
            setNotifications(prev => {
                if (prev.find(x => x.id === n.id)) return prev;
                return [n, ...prev].slice(0, 200);
            });
            if (!n.isRead) setUnreadCount(prev => prev + 1);
        });

        return () => {
            try { (echo as any).leave?.(channelName); } catch {}
            privateChannelRef.current = null;
        };
    }, [user]);

    const readPushStatus = useCallback(async () => {
        if (!isWebPushSupported) return;
        const reg = await navigator.serviceWorker.getRegistration();
        setWebPushPermission(Notification.permission);
        const sub = await reg?.pushManager.getSubscription();
        setIsWebPushEnabled(!!sub);
    }, [isWebPushSupported]);

    useEffect(() => {
        if (!isWebPushSupported) return;
        void readPushStatus();
    }, [isWebPushSupported, readPushStatus]);

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
        const wasUnread = notifications.find(n => n.id === id)?.isRead === false;
        await apiClient.deleteNotification(id);
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
    }, [notifications]);

    const enableWebPush = useCallback(async () => {
        if (!isWebPushSupported) return;
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        const perm = await Notification.requestPermission();
        setWebPushPermission(perm);
        if (perm !== 'granted') return;
        const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
        const subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID),
        });
        await apiClient.subscribeToNotifications(subscription, navigator);
        setIsWebPushEnabled(true);
    }, [isWebPushSupported]);

    const disableWebPush = useCallback(async () => {
        if (!isWebPushSupported) return;
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        await sub?.unsubscribe();
        try { await apiClient.unsubscribeFromNotifications(); } catch {}
        setIsWebPushEnabled(false);
        setWebPushPermission(Notification.permission);
    }, [isWebPushSupported]);

    const value = useMemo<Ctx>(() => ({
        notifications,
        unreadCount,
        loading,
        loadingMore,
        hasMore,
        refresh,
        loadMore,
        isWebPushSupported,
        webPushPermission,
        isWebPushEnabled,
        enableWebPush,
        disableWebPush,
        markAsRead,
        markAllAsRead,
        deleteNotification,
    }), [
        notifications, unreadCount, loading, loadingMore, hasMore,
        refresh, loadMore,
        isWebPushSupported, webPushPermission, isWebPushEnabled,
        enableWebPush, disableWebPush,
        markAsRead, markAllAsRead, deleteNotification
    ]);

    return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications(): Ctx {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error('useNotifications must be used within <NotificationProvider>');
    return ctx;
}
