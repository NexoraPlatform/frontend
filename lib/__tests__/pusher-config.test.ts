import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ensurePusherClientConfig,
  resetPusherClientConfigState,
} from '@/lib/pusher-config';

describe('lib/pusher-config', () => {
  beforeEach(() => {
    resetPusherClientConfigState();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('permanently stops retrying when realtime is not configured on the server', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'Realtime is not configured' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    vi.stubGlobal('fetch', fetchMock as typeof fetch);
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(ensurePusherClientConfig()).resolves.toBeNull();
    await expect(ensurePusherClientConfig()).resolves.toBeNull();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('backs off temporarily after transient realtime config failures', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-25T22:00:00.000Z'));

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Rate limiting is temporarily unavailable. Please retry shortly.' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ key: 'pusher-key', cluster: 'eu' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

    vi.stubGlobal('fetch', fetchMock as typeof fetch);
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(ensurePusherClientConfig()).resolves.toBeNull();
    await expect(ensurePusherClientConfig()).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    vi.setSystemTime(new Date('2026-03-25T22:00:16.000Z'));

    await expect(ensurePusherClientConfig()).resolves.toEqual({
      key: 'pusher-key',
      cluster: 'eu',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
