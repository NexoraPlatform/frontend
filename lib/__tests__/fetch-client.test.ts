import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getSessionMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
}));

vi.mock('next-auth/react', () => ({
  getSession: getSessionMock,
}));

import {
  FetchError,
  clearBrowserSessionAuthCache,
  createApiFetch,
  setBrowserSessionAuthCache,
} from '../fetch-client';

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('lib/fetch-client', () => {
  beforeEach(() => {
    clearBrowserSessionAuthCache();
    getSessionMock.mockReset();
    localStorage.clear();
    document.cookie = 'trustora-remember=; Max-Age=0; Path=/';
    document.cookie = 'trustora-browser-session=; Max-Age=0; Path=/';
    document.documentElement.lang = 'ro';
    window.history.pushState({}, '', '/ro/dashboard');
  });

  afterEach(() => {
    clearBrowserSessionAuthCache();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.cookie = 'trustora-remember=; Max-Age=0; Path=/';
    document.cookie = 'trustora-browser-session=; Max-Age=0; Path=/';
  });

  it('refreshes the session token and retries once when the API returns 401', async () => {
    setBrowserSessionAuthCache({
      accessToken: 'old-access-token',
      tokenType: 'Bearer',
    });

    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async (_input: RequestInfo | URL, init?: RequestInit) => {
        const headers = new Headers(init?.headers);
        expect(headers.get('Authorization')).toBe('Bearer old-access-token');
        return jsonResponse({ message: 'Unauthenticated' }, 401);
      })
      .mockImplementationOnce(async (input: RequestInfo | URL) => {
        expect(new URL(String(input), window.location.origin).pathname).toBe('/api/auth/refresh');
        return jsonResponse({
          accessToken: 'new-access-token',
          tokenType: 'Bearer',
          refreshToken: 'new-refresh-token',
        });
      })
      .mockImplementationOnce(async (_input: RequestInfo | URL, init?: RequestInit) => {
        const headers = new Headers(init?.headers);
        expect(headers.get('Authorization')).toBe('Bearer new-access-token');
        return jsonResponse({ ok: true });
      });

    vi.stubGlobal('fetch', fetchMock as typeof fetch);

    const apiFetch = createApiFetch({ baseURL: window.location.origin });
    const response = await apiFetch<{ ok: boolean }>('/protected', { method: 'GET' });

    expect(response).toEqual({ ok: true });
    expect(getSessionMock).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('refreshes the session before the request when the cached access token is expired', async () => {
    setBrowserSessionAuthCache({
      accessToken: 'expired-access-token',
      tokenType: 'Bearer',
      refreshToken: 'refresh-token',
      accessTokenExpiresAt: Date.now() - 1_000,
    });

    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async (input: RequestInfo | URL) => {
        expect(new URL(String(input), window.location.origin).pathname).toBe('/api/auth/refresh');
        return jsonResponse({
          accessToken: 'refreshed-access-token',
          tokenType: 'Bearer',
          refreshToken: 'rotated-refresh-token',
          accessTokenExpiresAt: Date.now() + 60_000,
        });
      })
      .mockImplementationOnce(async (_input: RequestInfo | URL, init?: RequestInit) => {
        const headers = new Headers(init?.headers);
        expect(headers.get('Authorization')).toBe('Bearer refreshed-access-token');
        return jsonResponse({ ok: true });
      });

    vi.stubGlobal('fetch', fetchMock as typeof fetch);

    const apiFetch = createApiFetch({ baseURL: window.location.origin });
    const response = await apiFetch<{ ok: boolean }>('/protected', { method: 'GET' });

    expect(response).toEqual({ ok: true });
    expect(getSessionMock).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('refreshes the session before the request when only the refresh token is still available', async () => {
    document.cookie = 'trustora-browser-session=1; Path=/';

    getSessionMock.mockResolvedValue({
      refreshToken: 'still-valid-refresh-token',
      tokenType: 'Bearer',
    });

    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async (input: RequestInfo | URL) => {
        expect(new URL(String(input), window.location.origin).pathname).toBe('/api/auth/refresh');
        return jsonResponse({
          accessToken: 'brand-new-access-token',
          tokenType: 'Bearer',
          refreshToken: 'brand-new-refresh-token',
          accessTokenExpiresAt: Date.now() + 60_000,
        });
      })
      .mockImplementationOnce(async (_input: RequestInfo | URL, init?: RequestInit) => {
        const headers = new Headers(init?.headers);
        expect(headers.get('Authorization')).toBe('Bearer brand-new-access-token');
        return jsonResponse({ ok: true });
      });

    vi.stubGlobal('fetch', fetchMock as typeof fetch);

    const apiFetch = createApiFetch({ baseURL: window.location.origin });
    const response = await apiFetch<{ ok: boolean }>('/protected', { method: 'GET' });

    expect(response).toEqual({ ok: true });
    expect(getSessionMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not query next-auth session when no readable session-preference cookie exists', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ message: 'Unauthenticated' }, 401));

    vi.stubGlobal('fetch', fetchMock as typeof fetch);

    const apiFetch = createApiFetch({ baseURL: window.location.origin });

    await expect(apiFetch('/protected', { method: 'GET' })).rejects.toMatchObject<Partial<FetchError>>(
      {
        status: 401,
        message: 'Unauthenticated',
      }
    );

    expect(getSessionMock).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(new URL(String(fetchMock.mock.calls[0]?.[0]), window.location.origin).pathname).toBe(
      '/api/protected'
    );
  });

  it('does not keep retrying refresh when the session is already marked with a terminal auth error', async () => {
    document.cookie = 'trustora-browser-session=1; Path=/';

    getSessionMock.mockResolvedValue({
      refreshToken: 'stale-refresh-token',
      tokenType: 'Bearer',
      error: 'RefreshAccessTokenError',
    });

    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({ message: 'Unauthenticated' }, 401));

    vi.stubGlobal('fetch', fetchMock as typeof fetch);

    const apiFetch = createApiFetch({ baseURL: window.location.origin });

    await expect(apiFetch('/protected', { method: 'GET' })).rejects.toMatchObject<Partial<FetchError>>(
      {
        status: 401,
        message: 'Unauthenticated',
      }
    );

    expect(getSessionMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(new URL(String(fetchMock.mock.calls[0]?.[0]), window.location.origin).pathname).toBe(
      '/api/protected'
    );
  });

  it('does not retry endlessly when refresh token fails', async () => {
    setBrowserSessionAuthCache({
      accessToken: 'old-access-token',
      tokenType: 'Bearer',
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ message: 'Unauthenticated' }, 401))
      .mockResolvedValueOnce(jsonResponse({ message: 'Refresh failed' }, 401));

    vi.stubGlobal('fetch', fetchMock as typeof fetch);

    const apiFetch = createApiFetch({ baseURL: window.location.origin });

    await expect(apiFetch('/protected', { method: 'GET' })).rejects.toMatchObject<Partial<FetchError>>(
      {
        status: 401,
        message: 'Unauthenticated',
      }
    );

    expect(getSessionMock).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
