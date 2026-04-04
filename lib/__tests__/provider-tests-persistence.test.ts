import { describe, expect, it } from 'vitest';
import {
  PROVIDER_TESTS_RELOAD_MARKER_KEY,
  markProviderTestsReloadIntent,
  consumeProviderTestsReloadIntent,
} from '../provider-tests-persistence';

const createStorageMock = () => {
  const storage = new Map<string, string>();

  return {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      storage.set(key, value);
    },
    removeItem: (key: string) => {
      storage.delete(key);
    },
  };
};

describe('lib/provider-tests-persistence', () => {
  it('restores only when the reload marker matches the current storage key', () => {
    const storage = createStorageMock();

    markProviderTestsReloadIntent(storage, 'tests:key-1', 1000);

    expect(
      consumeProviderTestsReloadIntent(storage, 'tests:key-1', 'reload', 1200)
    ).toBe(true);
  });

  it('does not restore when navigation is not a reload', () => {
    const storage = createStorageMock();

    markProviderTestsReloadIntent(storage, 'tests:key-1', 1000);

    expect(
      consumeProviderTestsReloadIntent(storage, 'tests:key-1', 'navigate', 1200)
    ).toBe(false);
  });

  it('does not restore when the reload marker belongs to a different test payload', () => {
    const storage = createStorageMock();

    markProviderTestsReloadIntent(storage, 'tests:key-1', 1000);

    expect(
      consumeProviderTestsReloadIntent(storage, 'tests:key-2', 'reload', 1200)
    ).toBe(false);
  });

  it('does not restore when the reload marker is stale', () => {
    const storage = createStorageMock();

    markProviderTestsReloadIntent(storage, 'tests:key-1', 1000);

    expect(
      consumeProviderTestsReloadIntent(storage, 'tests:key-1', 'reload', 40_000)
    ).toBe(false);
  });

  it('always consumes the marker after checking it', () => {
    const storage = createStorageMock();

    markProviderTestsReloadIntent(storage, 'tests:key-1', 1000);

    consumeProviderTestsReloadIntent(storage, 'tests:key-1', 'reload', 1200);

    expect(storage.getItem(PROVIDER_TESTS_RELOAD_MARKER_KEY)).toBeNull();
  });
});
