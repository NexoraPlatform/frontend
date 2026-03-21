type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

type ReloadMarker = {
  storageKey: string;
  createdAt: number;
};

export const PROVIDER_TESTS_RELOAD_MARKER_KEY =
  'provider-services-tests:reload-marker';

export const PROVIDER_TESTS_RELOAD_MARKER_TTL_MS = 30_000;

const parseReloadMarker = (value: string | null): ReloadMarker | null => {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.storageKey === 'string' &&
      typeof parsed.createdAt === 'number' &&
      Number.isFinite(parsed.createdAt)
    ) {
      return parsed as ReloadMarker;
    }
  } catch {
    return null;
  }

  return null;
};

export const markProviderTestsReloadIntent = (
  storage: StorageLike,
  storageKey: string,
  now = Date.now()
) => {
  storage.setItem(
    PROVIDER_TESTS_RELOAD_MARKER_KEY,
    JSON.stringify({
      storageKey,
      createdAt: now,
    } satisfies ReloadMarker)
  );
};

export const consumeProviderTestsReloadIntent = (
  storage: StorageLike,
  storageKey: string,
  navigationType: string | null,
  now = Date.now(),
  ttlMs = PROVIDER_TESTS_RELOAD_MARKER_TTL_MS
) => {
  const marker = parseReloadMarker(
    storage.getItem(PROVIDER_TESTS_RELOAD_MARKER_KEY)
  );

  storage.removeItem(PROVIDER_TESTS_RELOAD_MARKER_KEY);

  if (navigationType !== 'reload' || !marker) {
    return false;
  }

  if (marker.storageKey !== storageKey) {
    return false;
  }

  if (now - marker.createdAt > ttlMs) {
    return false;
  }

  return true;
};
