// Web Push Notifications Service
export class NotificationService {
    private static instance: NotificationService;
    private registration: ServiceWorkerRegistration | null = null;
    private subscription: PushSubscription | null = null;

    static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    async initialize(): Promise<boolean> {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('Push notifications not supported');
            return false;
        }

        try {
            // Register service worker
            this.registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered:', this.registration);

            // Request notification permission
            const permission = await this.requestPermission();
            if (permission !== 'granted') {
                console.warn('Notification permission denied');
                return false;
            }

            // Subscribe to push notifications
            await this.subscribeToPush();
            return true;
        } catch (error) {
            console.error('Failed to initialize notifications:', error);
            return false;
        }
    }

    async requestPermission(): Promise<NotificationPermission> {
        if (!('Notification' in window)) {
            return 'denied';
        }

        if (Notification.permission === 'granted') {
            return 'granted';
        }

        if (Notification.permission === 'denied') {
            return 'denied';
        }

        return await Notification.requestPermission();
    }

    async subscribeToPush(): Promise<PushSubscription | null> {
        if (!this.registration) {
            console.error('Service worker not registered');
            return null;
        }

        try {
            // Generate VAPID keys for your application
            const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
                'BEl62iUYgUivxIkv69yViEuiBIa40HcCWLdHw0h4NyXgNdmkdHh1P1zUhzLFKw';

            this.subscription = await this.registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
            });

            console.log('Push subscription:', this.subscription);

            // Send subscription to server
            await this.sendSubscriptionToServer(this.subscription);
            return this.subscription;
        } catch (error) {
            console.error('Failed to subscribe to push notifications:', error);
            return null;
        }
    }

    private urlBase64ToUint8Array(base64String: string): Uint8Array {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
        try {
            const response = await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify({
                    subscription: subscription.toJSON(),
                    userAgent: navigator.userAgent
                })
            });

            if (!response.ok) {
                throw new Error('Failed to send subscription to server');
            }
        } catch (error) {
            console.error('Error sending subscription to server:', error);
        }
    }

    async showNotification(title: string, options: NotificationOptions = {}): Promise<void> {
        if (!this.registration) {
            console.error('Service worker not registered');
            return;
        }

        const defaultOptions: NotificationOptions = {
            icon: '/logo.png',
            badge: '/logo.png',
            vibrate: [200, 100, 200],
            data: {
                timestamp: Date.now()
            },
            actions: [
                {
                    action: 'view',
                    title: 'Vezi Proiectul',
                    icon: '/icons/view.png'
                },
                {
                    action: 'dismiss',
                    title: 'Închide',
                    icon: '/icons/close.png'
                }
            ]
        };

        const finalOptions = { ...defaultOptions, ...options };

        try {
            await this.registration.showNotification(title, finalOptions);
        } catch (error) {
            console.error('Failed to show notification:', error);
        }
    }

    async unsubscribe(): Promise<boolean> {
        if (!this.subscription) {
            return true;
        }

        try {
            const success = await this.subscription.unsubscribe();
            if (success) {
                this.subscription = null;
                // Notify server about unsubscription
                await fetch('/api/notifications/unsubscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                    }
                });
            }
            return success;
        } catch (error) {
            console.error('Failed to unsubscribe:', error);
            return false;
        }
    }

    isSupported(): boolean {
        return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    }

    getPermissionStatus(): NotificationPermission {
        return Notification.permission;
    }
}

export const notificationService = NotificationService.getInstance();
