let hasWarnedMissingConfig = false;
let configFetchPromise: Promise<PusherClientConfig | null> | null = null;
let pusherClientConfig: PusherClientConfig | null = null;
let pusherConfigUnavailableUntil = 0;
let pusherConfigPermanentlyDisabled = false;

const PUSHER_CONFIG_RETRY_DELAY_MS = 15_000;
const PUSHER_CONFIG_AUTH_RETRY_DELAY_MS = 5_000;

export type PusherClientConfig = {
  key: string;
  cluster: string;
};

export function getPusherClientConfig(): PusherClientConfig | null {
  return pusherClientConfig;
}

export function resetPusherClientConfigState() {
  hasWarnedMissingConfig = false;
  configFetchPromise = null;
  pusherClientConfig = null;
  pusherConfigUnavailableUntil = 0;
  pusherConfigPermanentlyDisabled = false;
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

async function readPusherConfigErrorMessage(response: Response) {
  try {
    const payload = await response.json().catch(() => null);
    if (payload && typeof payload === 'object' && typeof (payload as { message?: unknown }).message === 'string') {
      return ((payload as { message: string }).message || '').trim();
    }
  } catch {}

  return response.statusText?.trim() || '';
}

export async function ensurePusherClientConfig(): Promise<PusherClientConfig | null> {
  if (pusherClientConfig) return pusherClientConfig;
  if (typeof window === 'undefined') return null;
  if (pusherConfigPermanentlyDisabled) return null;
  if (Date.now() < pusherConfigUnavailableUntil) return null;
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
        const message = await readPusherConfigErrorMessage(response);

        if (response.status === 401 || response.status === 403) {
          pusherConfigUnavailableUntil = Date.now() + PUSHER_CONFIG_AUTH_RETRY_DELAY_MS;
          return null;
        }

        if (response.status === 503 && message === 'Realtime is not configured') {
          pusherConfigPermanentlyDisabled = true;
          warnPusherDisabled('Pusher is disabled: missing server-side realtime configuration.');
          return null;
        }

        pusherConfigUnavailableUntil = Date.now() + PUSHER_CONFIG_RETRY_DELAY_MS;
        warnPusherDisabled(
          `Pusher is disabled: ${message || 'failed to fetch realtime configuration.'}`
        );
        return null;
      }

      const payload = (await response.json()) as Partial<PusherClientConfig> | null;
      const key = typeof payload?.key === 'string' ? payload.key.trim() : '';
      const cluster = typeof payload?.cluster === 'string' ? payload.cluster.trim() : '';

      if (!key || !cluster) {
        pusherConfigPermanentlyDisabled = true;
        warnPusherDisabled('Pusher is disabled: invalid server-side realtime configuration.');
        return null;
      }

      pusherConfigUnavailableUntil = 0;
      pusherConfigPermanentlyDisabled = false;
      pusherClientConfig = { key, cluster };
      return pusherClientConfig;
    } catch {
      pusherConfigUnavailableUntil = Date.now() + PUSHER_CONFIG_RETRY_DELAY_MS;
      warnPusherDisabled('Pusher is disabled: failed to fetch realtime configuration.');
      return null;
    } finally {
      configFetchPromise = null;
    }
  })();

  return configFetchPromise;
}
