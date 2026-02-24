import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  apiClient: {
    updateUserLanguage: vi.fn(),
  },
}));

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('contexts/auth-context', () => {
  const mockedApi = apiClient as unknown as { updateUserLanguage: vi.Mock };

  beforeEach(() => {
    mockedApi.updateUserLanguage.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('hydrates user from SSR initialUser', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/sanctum/csrf-cookie')) {
        return new Response(null, { status: 204 });
      }
      if (url.includes('/api/auth/me')) {
        return jsonResponse({
          user: {
            id: 123,
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
          },
        });
      }
      return jsonResponse({}, 404);
    });
    vi.stubGlobal('fetch', fetchMock as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider
        initialUser={{
          id: 123,
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        } as any}
      >
        {children}
      </AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.user).not.toBeNull());
    expect(result.current.user?.id).toBe('123');
    expect(result.current.user?.email).toBe('test@example.com');
  });

  it('handles unauthenticated /me response', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/sanctum/csrf-cookie')) {
        return new Response(null, { status: 204 });
      }
      if (url.includes('/api/auth/me')) {
        return new Response(null, { status: 401 });
      }
      return jsonResponse({}, 404);
    });
    vi.stubGlobal('fetch', fetchMock as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it('setUserLanguage updates local user', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/sanctum/csrf-cookie')) {
        return new Response(null, { status: 204 });
      }
      if (url.includes('/api/auth/me')) {
        return jsonResponse({
          user: {
            id: 1,
            email: 'test@example.com',
            firstName: 'Old',
            lastName: 'User',
            language: 'ro',
          },
        });
      }
      return jsonResponse({}, 404);
    });
    vi.stubGlobal('fetch', fetchMock as any);

    mockedApi.updateUserLanguage.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      firstName: 'Old',
      lastName: 'User',
      language: 'en',
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider
        initialUser={{
          id: 1,
          email: 'test@example.com',
          firstName: 'Old',
          lastName: 'User',
          language: 'ro',
        } as any}
      >
        {children}
      </AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.user).not.toBeNull());

    await act(async () => {
      await result.current.setUserLanguage('en');
    });

    expect(result.current.user?.language).toBe('en');
  });

  it('fetches /me after login when starting unauthenticated', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url.includes('/sanctum/csrf-cookie')) {
        return new Response(null, { status: 204 });
      }

      if (url.includes('/api/auth/login')) {
        return jsonResponse({
          user: {
            id: 7,
            email: 'login@example.com',
            firstName: 'Log',
            lastName: 'In',
          },
        });
      }

      if (url.includes('/api/auth/me')) {
        return jsonResponse({
          user: {
            id: 7,
            email: 'login@example.com',
            firstName: 'Log',
            lastName: 'In',
          },
        });
      }

      return jsonResponse({}, 404);
    });
    vi.stubGlobal('fetch', fetchMock as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('login@example.com', 'secret');
    });

    await waitFor(() => expect(result.current.user?.id).toBe('7'));
    expect(fetchMock).toHaveBeenCalled();
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes('/api/auth/login'))).toBe(
      true
    );
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes('/api/auth/me'))).toBe(true);
  });
});
