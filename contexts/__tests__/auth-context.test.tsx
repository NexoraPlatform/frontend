import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api';

const mockSignIn = vi.fn();
const mockSignOut = vi.fn();
const mockUpdate = vi.fn();
const mockUseSession = vi.fn();

vi.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSession: () => mockUseSession(),
  signIn: (...args: any[]) => mockSignIn(...args),
  signOut: (...args: any[]) => mockSignOut(...args),
}));

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
    mockSignIn.mockReset();
    mockSignOut.mockReset();
    mockUpdate.mockReset();
    mockUseSession.mockReset();

    mockSignIn.mockResolvedValue({ ok: true, error: null, status: 200, url: null });
    mockSignOut.mockResolvedValue(undefined);
    mockUpdate.mockResolvedValue(null);
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: mockUpdate,
    });

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/sanctum/csrf-cookie')) {
        return new Response(null, { status: 204 });
      }
      return jsonResponse({}, 404);
    });
    vi.stubGlobal('fetch', fetchMock as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('hydrates user from SSR initialUser', async () => {
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

  it('handles unauthenticated session state', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it('setUserLanguage updates local user', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 1,
          email: 'test@example.com',
          firstName: 'Old',
          lastName: 'User',
          language: 'ro',
        },
      },
      status: 'authenticated',
      update: mockUpdate,
    });

    mockedApi.updateUserLanguage.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      firstName: 'Old',
      lastName: 'User',
      language: 'en',
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.user).not.toBeNull());

    await act(async () => {
      await result.current.setUserLanguage('en');
    });

    expect(result.current.user?.language).toBe('en');
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('logs in through backend + next-auth credentials', async () => {
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
    expect(mockSignIn).toHaveBeenCalledWith(
      'credentials',
      expect.objectContaining({ email: 'login@example.com', password: 'secret', redirect: false })
    );
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes('/api/auth/login'))).toBe(
      true
    );
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes('/api/auth/me'))).toBe(true);
  });

  it('falls back to login payload roles and permissions when profile refresh fails', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url.includes('/sanctum/csrf-cookie')) {
        return new Response(null, { status: 204 });
      }

      if (url.includes('/api/auth/login')) {
        return jsonResponse({
          access_token: 'token',
          user: {
            id: 9,
            email: 'roles@example.com',
            firstName: 'Role',
            lastName: 'User',
          },
          roles: [{ slug: 'provider' }],
          permissions: ['projects.create'],
        });
      }

      if (url.includes('/api/auth/me')) {
        return jsonResponse({ message: 'Unavailable' }, 500);
      }

      return jsonResponse({}, 404);
    });
    vi.stubGlobal('fetch', fetchMock as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('roles@example.com', 'secret');
    });

    await waitFor(() => expect(result.current.user?.id).toBe('9'));
    expect(result.current.user?.role_slugs).toEqual(['provider']);
    expect(result.current.user?.permissions).toEqual(['projects.create']);
  });
});
