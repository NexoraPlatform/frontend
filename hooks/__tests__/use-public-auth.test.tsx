import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SWRConfig } from 'swr';

const { signOutMock, updateUserLanguageMock } = vi.hoisted(() => ({
  signOutMock: vi.fn(),
  updateUserLanguageMock: vi.fn(),
}));

vi.mock('next-auth/react', () => ({
  signOut: (...args: any[]) => signOutMock(...args),
}));

vi.mock('@/lib/api', () => ({
  apiClient: {
    updateUserLanguage: (...args: any[]) => updateUserLanguageMock(...args),
  },
}));

import { usePublicAuth } from '@/hooks/use-public-auth';

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
    {children}
  </SWRConfig>
);

describe('hooks/use-public-auth', () => {
  beforeEach(() => {
    signOutMock.mockReset();
    updateUserLanguageMock.mockReset();
    document.cookie = 'trustora-remember=; Max-Age=0; Path=/';
    document.cookie = 'trustora-browser-session=; Max-Age=0; Path=/';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.cookie = 'trustora-remember=; Max-Age=0; Path=/';
    document.cookie = 'trustora-browser-session=; Max-Age=0; Path=/';
  });

  it('does not fetch public auth data when no readable session-preference cookie exists', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock as typeof fetch);

    const { result } = renderHook(() => usePublicAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not fetch public auth data when explicitly disabled', async () => {
    document.cookie = 'trustora-browser-session=1; Path=/';

    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock as typeof fetch);

    const { result } = renderHook(() => usePublicAuth(false), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('clears readable session-preference cookies after a 401 and avoids refetching on remount', async () => {
    document.cookie = 'trustora-browser-session=1; Path=/';

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ message: 'Unauthenticated' }, 401));
    vi.stubGlobal('fetch', fetchMock as typeof fetch);

    const firstRender = renderHook(() => usePublicAuth(), { wrapper });

    await waitFor(() => expect(firstRender.result.current.loading).toBe(false));
    expect(firstRender.result.current.user).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(document.cookie.includes('trustora-browser-session=1')).toBe(false);

    firstRender.unmount();

    const secondRender = renderHook(() => usePublicAuth(), { wrapper });

    await waitFor(() => expect(secondRender.result.current.loading).toBe(false));
    expect(secondRender.result.current.user).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
