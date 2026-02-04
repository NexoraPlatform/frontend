import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { disablePusherUnloadListener } from '@/lib/pusher-runtime';

let echoInstance: Echo<any> | null = null;

export function getEcho(token?: string | null): Echo<any> | null {
  if (typeof window === 'undefined') return null;
  if (!token) return null;
  if (echoInstance) return echoInstance;

  disablePusherUnloadListener(Pusher);
  (window as any).Pusher = Pusher;

  echoInstance = new Echo({
    broadcaster: 'pusher',
    key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    authEndpoint: `${process.env.NEXT_PUBLIC_API_URL}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
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
