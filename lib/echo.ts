import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { disablePusherUnloadListener } from '@/lib/pusher-runtime';
import axios from '@/lib/axios';
import { ensureCsrfCookie, getXsrfToken } from '@/lib/csrf';

let echoInstance: Echo<any> | null = null;

export function getEcho(_token?: string | null): Echo<any> | null {
  if (typeof window === 'undefined') return null;
  if (echoInstance) return echoInstance;

  disablePusherUnloadListener(Pusher);
  (window as any).Pusher = Pusher;

  echoInstance = new Echo({
    broadcaster: 'pusher',
    key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    authEndpoint: `/api/broadcasting/auth`,
    authorizer: (channel: any) => ({
      authorize: (socketId: string, callback: (error: Error | null, data?: any) => void) => {
        ensureCsrfCookie()
          .then(() => {
            const xsrfToken = getXsrfToken();
            return axios.post(
              '/api/broadcasting/auth',
              {
                socket_id: socketId,
                channel_name: channel.name,
              },
              xsrfToken ? { headers: { 'X-XSRF-TOKEN': xsrfToken } } : undefined
            );
          })
          .then((response) => callback(null, response.data))
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

export function disconnectEcho() {
  if (!echoInstance) return;
  echoInstance.disconnect();
  echoInstance = null;

  if (typeof window !== 'undefined') {
    delete (window as any).Echo;
  }
}
