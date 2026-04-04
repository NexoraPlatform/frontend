import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { disablePusherUnloadListener } from '@/lib/pusher-runtime';
import { http } from '@/lib/fetch-client';
import { ensurePusherClientConfig, getPusherClientConfig, type PusherClientConfig } from '@/lib/pusher-config';

let echoInstance: Echo<any> | null = null;
let echoInitPromise: Promise<Echo<any> | null> | null = null;

function createEchoAuthorizer(channel: any) {
  return {
    authorize: (socketId: string, callback: (error: Error | null, data?: any) => void) => {
      http
        .post(
          '/api/broadcasting/auth',
          {
            socket_id: socketId,
            channel_name: channel.name,
          },
          {
            skipAuthHandling: true,
          }
        )
        .then((response) => callback(null, response))
        .catch((error) =>
          callback(error instanceof Error ? error : new Error('Broadcast auth failed'))
        );
    },
  };
}

export function createEchoClient(pusherConfig: PusherClientConfig): Echo<any> {
  disablePusherUnloadListener(Pusher);
  if (typeof window !== 'undefined') {
    (window as any).Pusher = Pusher;
  }

  return new Echo({
    broadcaster: 'pusher',
    key: pusherConfig.key,
    cluster: pusherConfig.cluster,
    authEndpoint: `/api/broadcasting/auth`,
    authorizer: (channel: any) => createEchoAuthorizer(channel),
    forceTLS: true,
    enableStats: false,
  });
}

export function getEcho(_token?: string | null): Echo<any> | null {
  if (typeof window === 'undefined') return null;
  if (echoInstance) return echoInstance;
  const pusherConfig = getPusherClientConfig();
  if (!pusherConfig) return null;

  echoInstance = createEchoClient(pusherConfig);

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
