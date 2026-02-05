'use client';

import React, {
    createContext, useCallback, useContext, useEffect, useMemo, useRef, useState
} from 'react';
import { useAuth } from '@/contexts/auth-context';
import Echo from 'laravel-echo';
import type { Channel } from 'laravel-echo';
import Pusher from 'pusher-js';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLocale, useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';
import { disablePusherUnloadListener } from '@/lib/pusher-runtime';

type RawLaravelNotification = {
    id: string;
    type: string;
    data?: any;
    title?: string;
    message?: string;
    projectId?: string | number;
    groupId?: string | number | null;
    by?: any;
    payload?: any;
    created_at?: string;
    read_at?: string | null;
};

export type AppNotification = {
    id: string;
    type: 'PROJECT_ADDED' | 'ORDER_UPDATE' | 'MESSAGE' | 'PAYMENT' | 'SYSTEM';
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    data: any;
};

type NotificationActor = {
    id?: string;
    name?: string;
    avatar?: string;
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
        if (declared.startsWith('project.')) return 'ORDER_UPDATE';
        if (declared.startsWith('rapyd.')) return 'PAYMENT';
    }
    const cls = (laraType ?? '').split('\\').pop()?.toLowerCase() || '';
    if (!cls) return 'SYSTEM';
    if (cls.includes('chat') && (cls.includes('message') || cls.includes('addedtogroup'))) return 'MESSAGE';
    if (cls.includes('projectproviderrequested') || (cls.includes('project') && cls.includes('requested'))) return 'PROJECT_ADDED';
    if (cls.includes('rapyd')) return 'PAYMENT';
    if (cls.includes('budget') || cls.includes('accepted') || cls.includes('rejected') || cls.includes('suggested') || cls.includes('decision')) {
        return 'ORDER_UPDATE';
    }
    return 'SYSTEM';
}

function toText(value: any): string | undefined {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

function firstText(...values: any[]): string | undefined {
    for (const value of values) {
        const text = toText(value);
        if (text) return text;
    }
    return undefined;
}

function humanize(value?: string): string | undefined {
    if (!value) return undefined;
    const cleaned = value
        .replace(/[_\.]+/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\s+/g, ' ')
        .trim();
    if (!cleaned) return undefined;
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function extractNotificationTitle(data: any): string | undefined {
    return firstText(data?.title);
}

function extractNotificationMessage(data: any): string | undefined {
    return firstText(data?.message);
}

function normalize(n: RawLaravelNotification): AppNotification {
    const rawData = n?.data && typeof n.data === 'object' ? n.data : (n as any);
    const type = mapType(n.type, rawData);
    const title = extractNotificationTitle(rawData) ?? '';
    const message = extractNotificationMessage(rawData) ?? '';
    return {
        id: String(n.id ?? (rawData as any)?.id ?? ''),
        type,
        title: title || humanize(firstText(rawData?.type, rawData?.payload?.type)) || 'Notificare',
        message: message || '',
        isRead: !!n.read_at,
        createdAt: n.created_at ?? (rawData as any)?.created_at ?? new Date().toISOString(),
        data: rawData ?? {},
    };
}

function getInitials(value?: string) {
    if (!value) return 'N';
    const parts = value.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'N';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

const ACTOR_KEYS = [
    'sender',
    'from',
    'actor',
    'user',
    'provider',
    'client',
    'otherUser',
    'participant',
    'member',
    'owner',
    'author',
    'creator',
    'by',
];
const ACTOR_LIST_KEYS = ['participants', 'users', 'members', 'recipients', 'actors'];

const stringValue = (value: any) => (typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined);

const pickString = (obj: any, keys: string[]) => {
    for (const key of keys) {
        const value = stringValue(obj?.[key]);
        if (value) return value;
    }
    return undefined;
};

const pickId = (obj: any, keys: string[]) => {
    for (const key of keys) {
        const value = obj?.[key];
        if (value !== null && value !== undefined && String(value).length > 0) return String(value);
    }
    return undefined;
};

const ID_KEYS = [
    'id',
    'user_id',
    'userId',
    'sender_id',
    'senderId',
    'actor_id',
    'actorId',
    'from_id',
    'fromId',
    'provider_id',
    'providerId',
    'client_id',
    'clientId',
];

const NAME_KEYS = [
    'name',
    'full_name',
    'fullName',
    'display_name',
    'displayName',
    'username',
];

const AVATAR_KEYS = [
    'avatar',
    'avatar_url',
    'avatarUrl',
    'photo',
    'photo_url',
    'photoUrl',
    'image',
    'image_url',
    'imageUrl',
    'picture',
    'picture_url',
    'profile_photo_url',
    'profilePhotoUrl',
    'logo',
];

const DIRECT_NAME_KEYS = [
    'senderName',
    'sender_name',
    'userName',
    'user_name',
    'clientName',
    'client_name',
    'providerName',
    'provider_name',
    'actorName',
    'actor_name',
    'fromName',
    'from_name',
    'authorName',
    'author_name',
];

const DIRECT_AVATAR_KEYS = [
    'senderAvatar',
    'sender_avatar',
    'userAvatar',
    'user_avatar',
    'clientAvatar',
    'client_avatar',
    'providerAvatar',
    'provider_avatar',
    'actorAvatar',
    'actor_avatar',
    'fromAvatar',
    'from_avatar',
    'authorAvatar',
    'author_avatar',
];

function normalizeActor(candidate: any): NotificationActor | null {
    if (!candidate) return null;
    if (typeof candidate !== 'object') {
        const name = stringValue(candidate);
        return name ? { name } : null;
    }

    const unwrapped =
        (candidate.user && typeof candidate.user === 'object' && candidate.user) ||
        (candidate.profile && typeof candidate.profile === 'object' && candidate.profile) ||
        (candidate.account && typeof candidate.account === 'object' && candidate.account) ||
        candidate;

    const id = pickId(unwrapped, ID_KEYS) ?? pickId(candidate, ID_KEYS);
    let name = pickString(unwrapped, NAME_KEYS) ?? pickString(candidate, NAME_KEYS);
    if (!name) {
        const first = pickString(unwrapped, ['first_name', 'firstName', 'first']);
        const last = pickString(unwrapped, ['last_name', 'lastName', 'last']);
        if (first || last) name = [first, last].filter(Boolean).join(' ');
    }

    const avatar = pickString(unwrapped, AVATAR_KEYS) ?? pickString(candidate, AVATAR_KEYS);

    if (!id && !name && !avatar) return null;
    return { id, name, avatar };
}

function resolveNotificationActor(data: any, currentUserId?: string | number): NotificationActor | null {
    if (!data || typeof data !== 'object') return null;

    const candidates: any[] = [];
    const addCandidate = (value: any) => {
        if (value) candidates.push(value);
    };

    for (const key of ACTOR_KEYS) addCandidate(data?.[key]);
    const payload = data?.payload ?? data?.data ?? null;
    for (const key of ACTOR_KEYS) addCandidate(payload?.[key]);

    for (const key of ACTOR_LIST_KEYS) {
        const list = data?.[key] ?? payload?.[key];
        if (Array.isArray(list)) list.forEach(addCandidate);
    }

    const directName = pickString(data, DIRECT_NAME_KEYS) ?? pickString(payload, DIRECT_NAME_KEYS);
    const directAvatar = pickString(data, DIRECT_AVATAR_KEYS) ?? pickString(payload, DIRECT_AVATAR_KEYS);
    const directId = pickId(data, ID_KEYS) ?? pickId(payload, ID_KEYS);
    if (directName || directAvatar || directId) {
        addCandidate({ id: directId, name: directName, avatar: directAvatar });
    }

    const normalized = candidates.map(normalizeActor).filter(Boolean) as NotificationActor[];
    if (normalized.length === 0) return null;

    const currentId = currentUserId != null ? String(currentUserId) : null;
    if (currentId) {
        const other =
            normalized.find((actor) => actor.id && String(actor.id) !== currentId) ||
            normalized.find((actor) => !actor.id);
        return other ?? normalized[0];
    }

    return normalized[0];
}

function resolveNotificationLink(n: AppNotification): string | null {
    const link = n.data?.link;
    const redirectUrl = n.data?.payload?.redirectUrl;
    const resolvedLink =
        (typeof link === 'string' && link.length > 0 && link) ||
        (typeof redirectUrl === 'string' && redirectUrl.length > 0 && redirectUrl) ||
        null;
    if (resolvedLink) return resolvedLink;
    const projectId = n.data?.projectId ?? n.data?.payload?.projectId;
    const groupId = n.data?.groupId ?? n.data?.payload?.groupId;
    if (n.type === 'MESSAGE') {
        if (groupId) return `/dashboard?tab=messages&groupId=${encodeURIComponent(String(groupId))}`;
        return '/dashboard?tab=messages';
    }
    if (projectId) return `/projects/${projectId}`;
    if (n.type === 'PAYMENT') return '/dashboard?tab=finance';
    if (n.type === 'PROJECT_ADDED') return '/projects';
    if (n.type === 'ORDER_UPDATE') return '/dashboard?tab=orders';
    return '/dashboard';
}

const TYPE_LABEL_KEYS: Record<AppNotification['type'], string> = {
    MESSAGE: 'common.notifications.toast.types.message',
    PROJECT_ADDED: 'common.notifications.toast.types.project_added',
    ORDER_UPDATE: 'common.notifications.toast.types.order_update',
    PAYMENT: 'common.notifications.toast.types.payment',
    SYSTEM: 'common.notifications.toast.types.system',
};

const TOAST_ACCENTS: Record<AppNotification['type'], string> = {
    MESSAGE: 'border-l-4 border-l-[#0B1C2D] dark:border-l-emerald-200',
    PROJECT_ADDED: 'border-l-4 border-l-[#1BC47D]',
    ORDER_UPDATE: 'border-l-4 border-l-[#21D19F]',
    PAYMENT: 'border-l-4 border-l-sky-500',
    SYSTEM: 'border-l-4 border-l-amber-500',
};

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replaceAll('-', '+').replaceAll('_', '/');
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
}

function getNotificationPermission(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        return 'default';
    }
    return Notification.permission;
}

let echoSingleton: Echo<any> | null = null;
function getOrCreateEcho(token: string): Echo<any> {
    if (echoSingleton) return echoSingleton;
    disablePusherUnloadListener(Pusher);
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
    const t = useTranslations();
    const locale = useLocale();
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
        () => getNotificationPermission()
    );
    const [isWebPushEnabled, setIsWebPushEnabled] = useState(false);
    const privateChannelRef = useRef<Channel | null>(null);
    const seenToastIdsRef = useRef<Set<string>>(new Set());
    const lastUserIdRef = useRef<string | null>(null);

    const refresh = useCallback(async () => {
        if (!user) return;
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (!token) return;

        setLoading(true);
        try {
            const res: CursorResponse<RawLaravelNotification> = await apiClient.getNotifications({
                limit: INITIAL_LIMIT,
                language: locale,
            } as any);
            const items = Array.isArray(res.data) ? res.data : [];
            setNotifications(items.map(normalize));
            if (typeof res.unreadCount === 'number') setUnreadCount(Number(res.unreadCount));
            setHasMore(!!res.hasMore);
            setNextCursor(res.nextCursor ?? null);
        } finally {
            setLoading(false);
        }
    }, [locale, user]);

    const loadMore = useCallback(async () => {
        if (!nextCursor || !hasMore || loadingMore) return;
        setLoadingMore(true);
        try {
            const res: CursorResponse<RawLaravelNotification> = await apiClient.getNotifications({
                limit: LOAD_MORE_LIMIT,
                cursor: nextCursor,
                language: locale,
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
    }, [nextCursor, hasMore, loadingMore, locale]);

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

    const showNotificationToast = useCallback((notification: AppNotification) => {
        if (notification.isRead) return;
        if (seenToastIdsRef.current.has(notification.id)) return;
        seenToastIdsRef.current.add(notification.id);

        const actor = resolveNotificationActor(notification.data, user?.id);
        const actorName = actor?.name;
        const avatarSrc = actor?.avatar ?? undefined;
        const titleText = toText(notification.title) ?? '';
        const messageText = toText(notification.message) ?? '';
        const typeLabel = t(TYPE_LABEL_KEYS[notification.type]);
        const primaryText = titleText || typeLabel;
        let secondaryText = messageText;
        if (!secondaryText && actorName && actorName !== primaryText) {
            secondaryText = actorName;
        } else if (!secondaryText && typeLabel !== primaryText) {
            secondaryText = typeLabel;
        }

        const link = resolveNotificationLink(notification);
        const accentClass = TOAST_ACCENTS[notification.type] ?? TOAST_ACCENTS.SYSTEM;
        const viewLabel = t('common.notifications.toast.view');

        const handleClick = async () => {
            if (!notification.isRead) {
                try {
                    await markAsRead(notification.id);
                } catch {
                    // Ignore toast click failures
                }
            }
            if (link && typeof window !== 'undefined') {
                window.location.href = link;
            }
        };

        toast.custom(() => (
            <button
                type="button"
                onClick={() => void handleClick()}
                className={`group w-full text-left rounded-xl border border-emerald-100/70 bg-white/95 p-3 shadow-lg ring-1 ring-black/5 backdrop-blur transition hover:-translate-y-0.5 hover:bg-emerald-50/70 hover:shadow-xl dark:border-emerald-500/20 dark:bg-[#0B1220]/95 dark:hover:bg-emerald-500/10 ${accentClass}`}
            >
                <div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={avatarSrc} alt={(actorName ?? titleText) || typeLabel} />
                        <AvatarFallback className="text-xs bg-slate-100 text-[#0B1C2D] dark:bg-[#111B2D] dark:text-[#E6EDF3]">
                            {getInitials(actorName || titleText || typeLabel)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <div className="text-sm font-semibold text-[#0B1C2D] dark:text-white line-clamp-1">
                                {primaryText}
                            </div>
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                                {typeLabel}
                            </span>
                        </div>
                        {secondaryText && (
                            <div className="text-xs text-slate-500 dark:text-[#A3ADC2] line-clamp-2">
                                {secondaryText}
                            </div>
                        )}
                    </div>
                    {link && (
                        <span className="text-xs font-semibold text-emerald-600 group-hover:underline">{viewLabel}</span>
                    )}
                </div>
            </button>
        ), { duration: 6500 });
    }, [markAsRead, t, user?.id]);

    useEffect(() => {
        if (!user) {
            setNotifications([]);
            setUnreadCount(0);
            setHasMore(false);
            setNextCursor(null);
            setLoading(false);
            seenToastIdsRef.current.clear();
            lastUserIdRef.current = null;
            return;
        }
        const currentUserId = String(user.id);
        if (lastUserIdRef.current !== currentUserId) {
            seenToastIdsRef.current.clear();
            lastUserIdRef.current = currentUserId;
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
            showNotificationToast(n);
        });

        return () => {
            try { (echo as any).leave?.(channelName); } catch {}
            privateChannelRef.current = null;
        };
    }, [showNotificationToast, user]);

    const readPushStatus = useCallback(async () => {
        if (!isWebPushSupported) return;
        const reg = await navigator.serviceWorker.getRegistration();
        setWebPushPermission(getNotificationPermission());
        const sub = await reg?.pushManager.getSubscription();
        setIsWebPushEnabled(!!sub);
    }, [isWebPushSupported]);

    useEffect(() => {
        if (!isWebPushSupported) return;
        void readPushStatus();
    }, [isWebPushSupported, readPushStatus]);

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
        setWebPushPermission(getNotificationPermission());
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
