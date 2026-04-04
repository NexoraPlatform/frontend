'use client';

import React, {
    createContext, useCallback, useContext, useEffect, useMemo, useRef, useState
} from 'react';
import { useAuth } from '@/contexts/auth-context';
import Echo from 'laravel-echo';
import type { Channel } from 'laravel-echo';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLocale, useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api';
import { createEchoClient } from '@/lib/echo';
import {
    getNotificationActionTranslationKey,
    getNotificationBadgeTranslationKey,
    getNotificationTone,
    normalizeNotification,
    resolveNotificationLink,
    shouldRefreshUserForNotification,
} from '@/lib/notifications';
import type { AppNotification, RawLaravelNotification } from '@/lib/notifications';
import { ensurePusherClientConfig } from '@/lib/pusher-config';

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
    unread_count?: number;
};

type Ctx = {
    active: boolean;
    activate: () => void;
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

function toText(value: any): string | undefined {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

function getInitials(value?: string) {
    if (!value) return 'N';
    const parts = value.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'N';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function extractUnreadCount(value: any): number {
    const count = Number(
        (typeof value === 'number' ? value : undefined) ??
        value?.count ??
        value?.unreadCount ??
        value?.unread_count ??
        value?.data?.count ??
        value?.data?.unreadCount ??
        value?.data?.unread_count ??
        value?.meta?.count ??
        value?.meta?.unreadCount ??
        value?.meta?.unread_count ??
        0
    );

    return Number.isFinite(count) ? count : 0;
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

const TOAST_ACCENTS = {
    message: 'border-l-4 border-l-[#0B1C2D] dark:border-l-emerald-200',
    info: 'border-l-4 border-l-[#1BC47D]',
    processing: 'border-l-4 border-l-sky-500',
    funded: 'border-l-4 border-l-[#21D19F]',
    success: 'border-l-4 border-l-[#1BC47D]',
    warning: 'border-l-4 border-l-amber-500',
    system: 'border-l-4 border-l-slate-400 dark:border-l-slate-500',
} as const;

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
let echoSingletonInitPromise: Promise<Echo<any> | null> | null = null;
async function getOrCreateEcho(): Promise<Echo<any> | null> {
    if (echoSingleton) return echoSingleton;
    if (echoSingletonInitPromise) return echoSingletonInitPromise;

    echoSingletonInitPromise = (async () => {
        const pusherConfig = await ensurePusherClientConfig();
        if (!pusherConfig) return null;
        echoSingleton = createEchoClient(pusherConfig);
        return echoSingleton;
    })().finally(() => {
        echoSingletonInitPromise = null;
    });

    return echoSingletonInitPromise;
}

const INITIAL_LIMIT = 20;
const LOAD_MORE_LIMIT = 20;

type NotificationProviderProps = {
    children: React.ReactNode;
    lazy?: boolean;
};

export function NotificationProvider({
    children,
    lazy = false,
}: NotificationProviderProps) {
    const { user, refreshUser } = useAuth();
    const t = useTranslations();
    const locale = useLocale();
    const [active, setActive] = useState(!lazy);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(!lazy);
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
    const notificationLanguage = user?.language ?? locale;
    const activate = useCallback(() => {
        setActive(true);
    }, []);

    const mergeNotifications = useCallback((
        current: AppNotification[],
        incoming: AppNotification[],
        prependIncoming = false
    ) => {
        if (incoming.length === 0) {
            return current;
        }

        const merged = new Map<string, AppNotification>();
        const ordered = prependIncoming ? [...incoming, ...current] : [...current, ...incoming];
        ordered.forEach((notification) => {
            if (!notification?.id) {
                return;
            }
            if (!merged.has(notification.id)) {
                merged.set(notification.id, notification);
            }
        });

        return Array.from(merged.values()).slice(0, 200);
    }, []);

    const fetchUnreadCount = useCallback(async () => {
        if (!user) {
            return 0;
        }

        try {
            const response = await apiClient.getUnreadNotificationsCount();
            const count = extractUnreadCount(response);
            setUnreadCount(count);
            return count;
        } catch {
            // Ignore badge refresh failures and keep the current value
            return 0;
        }
    }, [user]);

    const bootstrapUnreadIndicator = useCallback(async () => {
        if (!user) {
            return;
        }

        const directCount = await fetchUnreadCount();
        if (directCount > 0) {
            return;
        }

        try {
            const res: CursorResponse<RawLaravelNotification> = await apiClient.getNotifications({
                unread: true,
                limit: 1,
                language: notificationLanguage,
            } as any);
            const items = Array.isArray(res.data) ? res.data : [];
            const responseUnreadCount = extractUnreadCount(res);
            const unreadFromItems = items.filter((item) => !item?.read_at).length;
            if (responseUnreadCount > 0 || unreadFromItems > 0) {
                setUnreadCount(responseUnreadCount > 0 ? responseUnreadCount : unreadFromItems);
            }
        } catch {
            // Keep the current value if the lightweight unread probe fails
        }
    }, [fetchUnreadCount, notificationLanguage, user]);

    const refresh = useCallback(async () => {
        if (!user || !active) return;

        setLoading(true);
        try {
            const res: CursorResponse<RawLaravelNotification> = await apiClient.getNotifications({
                limit: INITIAL_LIMIT,
                language: notificationLanguage,
            } as any);
            const items = Array.isArray(res.data) ? res.data : [];
            setNotifications(items.map(normalizeNotification));
            setHasMore(!!res.hasMore);
            setNextCursor(res.nextCursor ?? null);
            const responseUnreadCount = extractUnreadCount(res);
            const unreadFromItems = items.filter((item) => !item?.read_at).length;
            if (responseUnreadCount > 0 || unreadFromItems > 0) {
                setUnreadCount(responseUnreadCount > 0 ? responseUnreadCount : unreadFromItems);
            } else {
                await fetchUnreadCount();
            }
        } finally {
            setLoading(false);
        }
    }, [active, fetchUnreadCount, notificationLanguage, user]);

    const loadMore = useCallback(async () => {
        if (!active || !nextCursor || !hasMore || loadingMore) return;
        setLoadingMore(true);
        try {
            const res: CursorResponse<RawLaravelNotification> = await apiClient.getNotifications({
                limit: LOAD_MORE_LIMIT,
                cursor: nextCursor,
                language: notificationLanguage,
            } as any);
            const items = Array.isArray(res.data) ? res.data : [];
            const normalized = items.map(normalizeNotification);
            setNotifications(prev => mergeNotifications(prev, normalized));
            setHasMore(!!res.hasMore);
            setNextCursor(res.nextCursor ?? null);
        } finally {
            setLoadingMore(false);
        }
    }, [active, hasMore, loadingMore, mergeNotifications, nextCursor, notificationLanguage]);

    const markAsRead = useCallback(async (id: string) => {
        await apiClient.markNotificationAsRead(id);
        setNotifications(prev => prev.map(n => (
            n.id === id ? { ...n, isRead: true, readAt: n.readAt ?? new Date().toISOString() } : n
        )));
        setUnreadCount(prev => Math.max(0, prev - 1));
    }, []);

    const markAllAsRead = useCallback(async () => {
        await apiClient.markAllNotificationsAsRead();
        const now = new Date().toISOString();
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: n.readAt ?? now })));
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
        const typeLabel = t(getNotificationBadgeTranslationKey(notification));
        const primaryText = titleText || typeLabel;
        let secondaryText = messageText;
        if (!secondaryText && actorName && actorName !== primaryText) {
            secondaryText = actorName;
        } else if (!secondaryText && typeLabel !== primaryText) {
            secondaryText = typeLabel;
        }

        const link = resolveNotificationLink(notification);
        const tone = getNotificationTone(notification);
        const accentClass = TOAST_ACCENTS[tone] ?? TOAST_ACCENTS.system;
        const actionKey = getNotificationActionTranslationKey(notification);
        const viewLabel = actionKey ? t(actionKey) : t('common.notifications.actions.view');

        const handleClick = async () => {
            if (!notification.isRead) {
                try {
                    await markAsRead(notification.id);
                } catch {
                    // Ignore toast click failures
                }
            }
            if (link && typeof window !== 'undefined') {
                window.location.assign(link);
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
            setIsWebPushEnabled(false);
            setWebPushPermission(getNotificationPermission());
            seenToastIdsRef.current.clear();
            lastUserIdRef.current = null;
            setActive(!lazy);
            return;
        }
        if (!active) {
            setLoading(false);
            return;
        }
        const currentUserId = String(user.id);
        if (lastUserIdRef.current !== currentUserId) {
            seenToastIdsRef.current.clear();
            lastUserIdRef.current = currentUserId;
        }
        void refresh();
    }, [active, lazy, refresh, user]);

    useEffect(() => {
        if (!user || active) return;

        void bootstrapUnreadIndicator();

        const refreshBadge = () => {
            if (document.visibilityState === 'visible') {
                void bootstrapUnreadIndicator();
            }
        };

        const refreshOnFocus = () => {
            void bootstrapUnreadIndicator();
        };

        window.addEventListener('focus', refreshOnFocus);
        document.addEventListener('visibilitychange', refreshBadge);

        return () => {
            window.removeEventListener('focus', refreshOnFocus);
            document.removeEventListener('visibilitychange', refreshBadge);
        };
    }, [active, bootstrapUnreadIndicator, user]);

    useEffect(() => {
        if (!user || !active) return;
        let cancelled = false;
        let localEcho: Echo<any> | null = null;
        let channelName = '';

        void (async () => {
            const echo = await getOrCreateEcho();
            if (!echo || cancelled) return;

            localEcho = echo;
            channelName = `App.Models.User.${user.id}`;
            const ch = echo.private(channelName);
            privateChannelRef.current = ch;

            ch.notification((raw: RawLaravelNotification) => {
                const notification = normalizeNotification(raw);
                setNotifications(prev => mergeNotifications(prev, [notification], true));
                if (!notification.isRead) {
                    setUnreadCount(prev => prev + 1);
                }
                if (shouldRefreshUserForNotification(notification.type)) {
                    void refreshUser();
                }
                showNotificationToast(notification);
                void fetchUnreadCount();
            });
        })();

        return () => {
            cancelled = true;
            if (localEcho && channelName) {
                try { (localEcho as any).leave?.(channelName); } catch {}
            }
            privateChannelRef.current = null;
        };
    }, [active, fetchUnreadCount, mergeNotifications, refreshUser, showNotificationToast, user]);

    const readPushStatus = useCallback(async () => {
        if (!isWebPushSupported) return;
        const reg = await navigator.serviceWorker.getRegistration();
        setWebPushPermission(getNotificationPermission());
        const sub = await reg?.pushManager.getSubscription();
        setIsWebPushEnabled(!!sub);
    }, [isWebPushSupported]);

    useEffect(() => {
        if (!active || !isWebPushSupported) return;
        void readPushStatus();
    }, [active, isWebPushSupported, readPushStatus]);

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
        active,
        activate,
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
        active, activate,
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

export { resolveNotificationLink };
export type { AppNotification };
