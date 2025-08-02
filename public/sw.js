// Service Worker for Push Notifications
const CACHE_NAME = 'nexora-notifications-v1';

// Install event
self.addEventListener('install', (event) => {
    console.log('Service Worker installing');
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating');
    event.waitUntil(self.clients.claim());
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
    console.log('Push event received:', event);

    let notificationData = {
        title: 'Nexora',
        body: 'Ai o notificare nouă',
        icon: '/logo.png',
        badge: '/logo.png',
        data: {}
    };

    if (event.data) {
        try {
            const data = event.data.json();
            notificationData = {
                title: data.title || notificationData.title,
                body: data.body || data.message || notificationData.body,
                icon: data.icon || notificationData.icon,
                badge: data.badge || notificationData.badge,
                tag: data.tag || 'nexora-notification',
                data: data.data || {},
                actions: data.actions || [
                    {
                        action: 'view',
                        title: 'Vezi',
                        icon: '/icons/view.png'
                    },
                    {
                        action: 'dismiss',
                        title: 'Închide',
                        icon: '/icons/close.png'
                    }
                ]
            };
        } catch (error) {
            console.error('Error parsing push data:', error);
        }
    }

    const promiseChain = self.registration.showNotification(
        notificationData.title,
        {
            body: notificationData.body,
            icon: notificationData.icon,
            badge: notificationData.badge,
            tag: notificationData.tag,
            data: notificationData.data,
            actions: notificationData.actions,
            vibrate: [200, 100, 200],
            requireInteraction: true
        }
    );

    event.waitUntil(promiseChain);
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event);

    event.notification.close();

    const action = event.action;
    const data = event.notification.data;

    if (action === 'dismiss') {
        return;
    }

    // Default action or 'view' action
    let urlToOpen = '/dashboard';

    if (data && data.url) {
        urlToOpen = data.url;
    } else if (data && data.type) {
        switch (data.type) {
            case 'PROJECT_ADDED':
                urlToOpen = data.projectId ? `/projects/${data.projectId}` : '/projects';
                break;
            case 'ORDER_UPDATE':
                urlToOpen = '/dashboard?tab=orders';
                break;
            case 'MESSAGE':
                urlToOpen = '/dashboard?tab=messages';
                break;
            default:
                urlToOpen = '/dashboard';
        }
    }

    const promiseChain = clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    }).then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (let i = 0; i < clientList.length; i++) {
            const client = clientList[i];
            if (client.url.includes(urlToOpen) && 'focus' in client) {
                return client.focus();
            }
        }

        // If no existing window/tab, open a new one
        if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
        }
    });

    event.waitUntil(promiseChain);
});

// Background sync for offline notifications
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync-notifications') {
        event.waitUntil(syncNotifications());
    }
});

async function syncNotifications() {
    try {
        // Sync any pending notifications when back online
        console.log('Syncing notifications in background');
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}
