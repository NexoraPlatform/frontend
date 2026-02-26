
    let notificationData = {
        title: 'Trustora',
        body: 'Ai o notificare nouă',
        icon: '',
        badge: '/logo.webp',
        data: {}
    };
    self.addEventListener('push', (event) => {
        let data = {};
        try {
            data = event.data ? event.data.json() : {};
        } catch (e) {
            data = { title: 'Notificare', body: event.data?.text?.() ?? '' };
        }

        const title = data.title || 'Notificare';
        const options = {
            body: data.body || data.message || '',
            icon: data.icon || '/trustora-logo2-60.avif',
            badge: data.badge || '/trustora2-logo-60.avif',
            data: {
                link: data.link || data.url || '/',
                meta: data.meta || data.payload || {},
            },
        };

        event.waitUntil(self.registration.showNotification(title, options));
    });

    const sanitizeNotificationLink = (value) => {
        if (typeof value !== 'string') return '/';
        const target = value.trim();
        if (!target || target.startsWith('//')) return '/';
        if (target.startsWith('/')) return target;
        try {
            const parsed = new URL(target);
            if (parsed.origin !== self.location.origin) return '/';
            if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '/';
            return `${parsed.pathname}${parsed.search}${parsed.hash}`;
        } catch {
            return '/';
        }
    };

    self.addEventListener('notificationclick', (event) => {
        event.notification.close();
        const link = sanitizeNotificationLink(event.notification.data?.link || '/');

        event.waitUntil((async () => {
            const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
            for (const client of allClients) {
                // Prefer focusing an existing tab
                if ('focus' in client) {
                    await client.focus();
                    if ('navigate' in client) {
                        try { await client.navigate(link); } catch {}
                    } else {
                        client.postMessage({ type: 'NAVIGATE', link });
                    }
                    return;
                }
            }
            // Or open a new tab
            await clients.openWindow(link);
        })());
    });
