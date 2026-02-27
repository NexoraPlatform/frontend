let hasWarnedMissingConfig = false;
let configFetchPromise: Promise<PusherClientConfig | null> | null = null;
let pusherClientConfig: PusherClientConfig | null = null;

export type PusherClientConfig = {
  key: string;
  cluster: string;
};

export function getPusherClientConfig(): PusherClientConfig | null {
  return pusherClientConfig;
}

function warnPusherDisabled(message: string) {
  if (
    typeof window === 'undefined' ||
    process.env.NODE_ENV === 'test' ||
    process.env.NODE_ENV === 'production' ||
    hasWarnedMissingConfig
  ) {
    return;
  }
  hasWarnedMissingConfig = true;
  console.warn(message);
}

export async function ensurePusherClientConfig(): Promise<PusherClientConfig | null> {
  if (pusherClientConfig) return pusherClientConfig;
  if (typeof window === 'undefined') return null;
  if (configFetchPromise) return configFetchPromise;

  configFetchPromise = (async () => {
    try {
      const response = await fetch('/api/realtime/pusher-config', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        if (response.status !== 401 && response.status !== 403) {
          warnPusherDisabled('Pusher is disabled: missing server-side realtime configuration.');
        }
        return null;
      }

      const payload = (await response.json()) as Partial<PusherClientConfig> | null;
      const key = typeof payload?.key === 'string' ? payload.key.trim() : '';
      const cluster = typeof payload?.cluster === 'string' ? payload.cluster.trim() : '';

      if (!key || !cluster) {
        warnPusherDisabled('Pusher is disabled: invalid server-side realtime configuration.');
        return null;
      }

      pusherClientConfig = { key, cluster };
      return pusherClientConfig;
    } catch {
      warnPusherDisabled('Pusher is disabled: failed to fetch realtime configuration.');
      return null;
    } finally {
      configFetchPromise = null;
    }
  })();

  return configFetchPromise;
}
