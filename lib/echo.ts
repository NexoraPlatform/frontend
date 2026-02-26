import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { disablePusherUnloadListener } from '@/lib/pusher-runtime';
import { http } from '@/lib/fetch-client';
import { ensureCsrfCookie, getXsrfToken } from '@/lib/csrf';
import { ensurePusherClientConfig, getPusherClientConfig } from '@/lib/pusher-config';

let echoInstance: Echo<any> | null = null;
let echoInitPromise: Promise<Echo<any> | null> | null = null;

export function getEcho(_token?: string | null): Echo<any> | null {
  if (typeof window === 'undefined') return null;
  if (echoInstance) return echoInstance;
  const pusherConfig = getPusherClientConfig();
  if (!pusherConfig) return null;

  disablePusherUnloadListener(Pusher);
  (window as any).Pusher = Pusher;

  echoInstance = new Echo({
    broadcaster: 'pusher',
    key: pusherConfig.key,
    cluster: pusherConfig.cluster,
    authEndpoint: `/api/broadcasting/auth`,
    authorizer: (channel: any) => ({
      authorize: (socketId: string, callback: (error: Error | null, data?: any) => void) => {
        ensureCsrfCookie()
          .then(() => {
            const xsrfToken = getXsrfToken();
            return http.post(
              '/api/broadcasting/auth',
              {
                socket_id: socketId,
                channel_name: channel.name,
              },
              {
                skipAuthHandling: true,
                ...(xsrfToken ? { headers: { 'X-XSRF-TOKEN': xsrfToken } } : {}),
              }
            );
          })
          .then((response) => callback(null, response))
          .catch((error) =>
            callback(error instanceof Error ? error : new Error('Broadcast auth failed'))
          );
      },
    }),
    forceTLS: true,
    enableStats: false,
  });

  (window as any).Echo = echoInstance;

  return echoInstance;
}

export async function ensureEcho(_token?: string | null): Promise<Echo<any> | null> {
  if (typeof window === 'undefined') return null;
  if (echoInstance) return echoInstance;
  if (echoInitPromise) return echoInitPromise;

  echoInitPromise = (async () => {
    const pusherConfig = await ensurePusherClientConfig();
    if (!pusherConfig) return null;
    return getEcho();
  })().finally(() => {
    echoInitPromise = null;
  });

  return echoInitPromise;
}

export function disconnectEcho() {
  if (!echoInstance) return;
  echoInstance.disconnect();
  echoInstance = null;

  if (typeof window !== 'undefined') {
    delete (window as any).Echo;
  }
}
