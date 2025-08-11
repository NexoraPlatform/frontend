"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationService } from '@/lib/notifications';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

interface InAppNotification {
    id: string;
    title: string;
    message: string;
    type: 'PROJECT_ADDED' | 'ORDER_UPDATE' | 'MESSAGE' | 'SYSTEM';
    isRead: boolean;
    data?: any;
    createdAt: string;
    userId: string;
}

interface NotificationContextType {
    // In-app notifications
    notifications: InAppNotification[];
    unreadCount: number;
    markAsRead: (notificationId: string) => void;
    markAllAsRead: () => void;
    deleteNotification: (notificationId: string) => void;

    // Web push notifications
    isWebPushSupported: boolean;
    isWebPushEnabled: boolean;
    webPushPermission: NotificationPermission;
    enableWebPush: () => Promise<boolean>;
    disableWebPush: () => Promise<boolean>;

    // Loading states
    loading: boolean;
    refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<InAppNotification[]>([]);
    const [loading, setLoading] = useState(false);
    const [isWebPushSupported, setIsWebPushSupported] = useState(false);
    const [isWebPushEnabled, setIsWebPushEnabled] = useState(false);
    const [webPushPermission, setWebPushPermission] = useState<NotificationPermission>('default');

    // Initialize notification service
    useEffect(() => {
        const initializeNotifications = async () => {
            if (!user) return;

            // Check web push support
            const supported = notificationService.isSupported();
            setIsWebPushSupported(supported);
            setWebPushPermission(notificationService.getPermissionStatus());

            if (supported) {
                // Try to initialize web push (will only work if user previously granted permission)
                const initialized = await notificationService.initialize();
                setIsWebPushEnabled(initialized);
            }

            // Load in-app notifications
            await refreshNotifications();

            // Set up real-time notifications (you could use WebSocket here)
            setupRealTimeNotifications();
        };

        initializeNotifications();
    }, [user]);

    const refreshNotifications = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        try {
            const response = await apiClient.getNotifications();
            setNotifications(response.notifications || []);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const setupRealTimeNotifications = useCallback(() => {
        if (!user) return;

        // Simulate real-time notifications with polling
        // In production, you'd use WebSocket or Server-Sent Events
        const interval = setInterval(async () => {
            try {
                const response = await apiClient.getNotifications({ unreadOnly: true });
                const newNotifications = response.notifications || [];

                // Check for new notifications
                const existingIds = new Set(notifications.map(n => n.id));
                const reallyNewNotifications = newNotifications.filter((n: any) => !existingIds.has(n.id));

                if (reallyNewNotifications.length > 0) {
                    // Show toast for new notifications
                    reallyNewNotifications.forEach((notification: any) => {
                        showInAppToast(notification);

                        // Show web push notification if enabled
                        if (isWebPushEnabled && notification.type === 'PROJECT_ADDED') {
                            showWebPushNotification(notification);
                        }
                    });

                    // Refresh all notifications
                    await refreshNotifications();
                }
            } catch (error) {
                console.error('Failed to check for new notifications:', error);
            }
        }, 30000); // Check every 30 seconds

        return () => clearInterval(interval);
    }, [user, notifications, refreshNotifications, isWebPushEnabled]);

    const showInAppToast = (notification: InAppNotification) => {
        const getToastIcon = (type: string) => {
            switch (type) {
                case 'PROJECT_ADDED': return '🚀';
                case 'ORDER_UPDATE': return '📦';
                case 'MESSAGE': return '💬';
                case 'SYSTEM': return '⚙️';
                default: return '🔔';
            }
        };

        toast(notification.title, {
            description: notification.message,
            icon: getToastIcon(notification.type),
            action: {
                label: 'Vezi',
                onClick: () => handleNotificationClick(notification)
            }
        });
    };

    const showWebPushNotification = async (notification: InAppNotification) => {
        if (!isWebPushEnabled) return;

        const options: NotificationOptions = {
            body: notification.message,
            icon: '/logo.webp',
            badge: '/logo.webp',
            tag: notification.id,
            data: {
                notificationId: notification.id,
                type: notification.type,
                url: getNotificationUrl(notification)
            },
            actions: [
                {
                    action: 'view',
                    title: 'Vezi Proiectul'
                },
                {
                    action: 'dismiss',
                    title: 'Închide'
                }
            ]
        };

        await notificationService.showNotification(notification.title, options);
    };

    const getNotificationUrl = (notification: InAppNotification): string => {
        switch (notification.type) {
            case 'PROJECT_ADDED':
                return `/projects/${notification.data?.projectId}`;
            case 'ORDER_UPDATE':
                return `/dashboard?tab=orders`;
            case 'MESSAGE':
                return `/dashboard?tab=messages`;
            default:
                return '/dashboard';
        }
    };

    const handleNotificationClick = (notification: InAppNotification) => {
        // Mark as read
        markAsRead(notification.id);

        // Navigate to relevant page
        const url = getNotificationUrl(notification);
        window.location.href = url;
    };

    const markAsRead = async (notificationId: string) => {
        try {
            await apiClient.markNotificationAsRead(notificationId);
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
            );
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await apiClient.markAllNotificationsAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    const deleteNotification = async (notificationId: string) => {
        try {
            await apiClient.deleteNotification(notificationId);
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const enableWebPush = async (): Promise<boolean> => {
        try {
            const success = await notificationService.initialize();
            setIsWebPushEnabled(success);
            setWebPushPermission(notificationService.getPermissionStatus());

            if (success) {
                toast.success('Notificările web au fost activate!', {
                    description: 'Vei primi notificări pentru proiecte noi și actualizări importante.'
                });
            } else {
                toast.error('Nu s-au putut activa notificările web', {
                    description: 'Verifică setările browser-ului pentru notificări.'
                });
            }

            return success;
        } catch (error) {
            console.error('Failed to enable web push:', error);
            toast.error('Eroare la activarea notificărilor');
            return false;
        }
    };

    const disableWebPush = async (): Promise<boolean> => {
        try {
            const success = await notificationService.unsubscribe();
            setIsWebPushEnabled(false);

            if (success) {
                toast.success('Notificările web au fost dezactivate');
            }

            return success;
        } catch (error) {
            console.error('Failed to disable web push:', error);
            return false;
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const value = {
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
        refreshNotifications
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
