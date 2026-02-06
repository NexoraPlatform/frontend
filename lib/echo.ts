import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { apiClient } from '@/lib/api';
import axios, { ensureCsrfCookie } from '@/lib/axios';
import { disablePusherUnloadListener } from '@/lib/pusher-runtime';

let echoInstance: Echo<any> | null = null;

export function getEcho(): Echo<any> | null {
  if (typeof window === 'undefined') return null;
  if (echoInstance) return echoInstance;

  disablePusherUnloadListener(Pusher);
  (window as any).Pusher = Pusher;

  echoInstance = new Echo({
    broadcaster: 'pusher',
    key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    forceTLS: true,
    enableStats: false,
    authorizer: (channel: any) => {
      return {
        authorize: async (socketId: string, callback: Function) => {
          try {
            await ensureCsrfCookie();
            const token = apiClient.getToken?.();
            const response = await axios.post(
              '/broadcasting/auth',
              { socket_id: socketId, channel_name: channel.name },
              {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
              }
            );
            callback(false, response.data);
          } catch (error) {
            callback(true, error);
          }
        },
      };
    },
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
