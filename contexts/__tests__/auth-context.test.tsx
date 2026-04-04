import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api';

const mockSignIn = vi.fn();
const mockSignOut = vi.fn();
const mockGetSession = vi.fn();
const mockUpdate = vi.fn();
const mockUseSession = vi.fn();

vi.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSession: () => mockUseSession(),
  getSession: () => mockGetSession(),
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
    document.cookie = 'trustora-remember=; Max-Age=0; Path=/';
    document.cookie = 'trustora-browser-session=; Max-Age=0; Path=/';
    mockedApi.updateUserLanguage.mockReset();
    mockSignIn.mockReset();
    mockSignOut.mockReset();
    mockGetSession.mockReset();
    mockUpdate.mockReset();
    mockUseSession.mockReset();

    mockSignIn.mockResolvedValue({ ok: true, error: null, status: 200, url: null });
    mockSignOut.mockResolvedValue(undefined);
    mockGetSession.mockResolvedValue(null);
    mockUpdate.mockResolvedValue(null);
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: mockUpdate,
    });

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      return jsonResponse({}, 404);
    });
    vi.stubGlobal('fetch', fetchMock as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.cookie = 'trustora-remember=; Max-Age=0; Path=/';
    document.cookie = 'trustora-browser-session=; Max-Age=0; Path=/';
  });

  it('hydrates user from SSR initialUser', async () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: mockUpdate,
    });

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

  it('clears stale SSR initialUser when session becomes unauthenticated', async () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: mockUpdate,
    });

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

    const { result, rerender } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.user?.id).toBe('123'));

    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: mockUpdate,
    });

    rerender();

    await waitFor(() => expect(result.current.user).toBeNull());
  });

  it('handles unauthenticated session state', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes('/api/auth/me'))).toBe(false);
  });

  it('does not clear session-preference cookies for a plain unauthenticated state', async () => {
    document.cookie = 'trustora-browser-session=1; Path=/';

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(document.cookie.includes('trustora-browser-session=1')).toBe(true);
  });

  it('keeps authenticated sessions active even when readable remember-me cookies are missing', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 11,
          email: 'expired@example.com',
          firstName: 'Expired',
          lastName: 'User',
        },
        accessToken: 'active-access-token',
        rememberMe: false,
      },
      status: 'authenticated',
      update: mockUpdate,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.user?.id).toBe('11'));
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('treats an authenticated Auth.js session without backend tokens as logged out', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 12,
          email: 'broken-session@example.com',
          firstName: 'Broken',
          lastName: 'Session',
        },
        error: 'RefreshAccessTokenError',
      },
      status: 'authenticated',
      update: mockUpdate,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it('recovers the authenticated user from getSession when the client hook starts unauthenticated', async () => {
    mockGetSession.mockResolvedValue({
      accessToken: 'browser-access-token',
      user: {
        id: 21,
        email: 'browser-session@example.com',
        firstName: 'Browser',
        lastName: 'Session',
      },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.user?.id).toBe('21'));
    expect(result.current.user?.email).toBe('browser-session@example.com');
  });

  it('falls back to /api/auth/me when getSession returns auth tokens without a usable user', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url.includes('/api/auth/me')) {
        return jsonResponse({
          user: {
            id: 33,
            email: 'server-auth@example.com',
            firstName: 'Server',
            lastName: 'Auth',
          },
        });
      }

      return jsonResponse({}, 404);
    });
    vi.stubGlobal('fetch', fetchMock as any);
    mockGetSession.mockResolvedValue({
      accessToken: 'browser-access-token',
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.user?.id).toBe('33'));
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes('/api/auth/me'))).toBe(true);
  });

  it('adopts a new SSR session snapshot after client-side navigation without requiring a refresh', async () => {
    let latestAuth: ReturnType<typeof useAuth> | null = null;

    function Harness() {
      latestAuth = useAuth();
      return null;
    }

    const { rerender } = render(
      <AuthProvider initialSession={null}>
        <Harness />
      </AuthProvider>
    );

    await waitFor(() => expect(latestAuth?.loading).toBe(false));
    expect(latestAuth?.user).toBeNull();

    rerender(
      <AuthProvider
        initialSession={{
          user: {
            id: 44,
            email: 'navigated@example.com',
            firstName: 'Route',
            lastName: 'Snapshot',
          },
          accessToken: 'navigated-access-token',
        }}
      >
        <Harness />
      </AuthProvider>
    );

    await waitFor(() => expect(latestAuth?.user?.id).toBe('44'));
    expect(latestAuth?.user?.email).toBe('navigated@example.com');
  });

  it('setUserLanguage updates local user', async () => {
    document.cookie = 'trustora-remember=1; Path=/';

    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 1,
          email: 'test@example.com',
          firstName: 'Old',
          lastName: 'User',
          language: 'ro',
        },
        accessToken: 'language-access-token',
        rememberMe: true,
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
    mockSignIn.mockImplementation(async () => {
      expect(document.cookie.includes('trustora-browser-session=1')).toBe(true);
      return { ok: true, error: null, status: 200, url: null };
    });

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();

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
    mockGetSession.mockResolvedValue({
      accessToken: 'login-access-token',
      user: {
        id: 7,
        email: 'login@example.com',
        firstName: 'Log',
        lastName: 'In',
      },
    });

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
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes('/api/auth/me'))).toBe(true);
  });

  it('clears session-preference cookies again when credentials sign-in fails', async () => {
    mockSignIn.mockResolvedValue({
      ok: false,
      error: 'CredentialsSignin',
      status: 401,
      url: null,
      code: 'invalid_credentials',
    });

    const fetchMock = vi.fn(async () => jsonResponse({}, 404));
    vi.stubGlobal('fetch', fetchMock as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    let loginError: Error | null = null;
    await act(async () => {
      try {
        await result.current.login('login@example.com', 'wrong');
      } catch (error) {
        loginError = error as Error;
      }
    });

    expect(loginError?.message).toBe('The provided credentials are incorrect.');
    expect(document.cookie.includes('trustora-browser-session=1')).toBe(false);
    expect(document.cookie.includes('trustora-remember=1')).toBe(false);
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes('/api/auth/login'))).toBe(false);
  });

  it('falls back to login payload roles and permissions when profile refresh fails', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url.includes('/api/auth/me')) {
        return jsonResponse({ message: 'Unavailable' }, 500);
      }

      return jsonResponse({}, 404);
    });
    vi.stubGlobal('fetch', fetchMock as any);
    mockGetSession.mockResolvedValue({
      accessToken: 'roles-access-token',
      user: {
        id: 9,
        email: 'roles@example.com',
        firstName: 'Role',
        lastName: 'User',
        roles: [{ slug: 'provider' }],
        permissions: ['projects.create'],
      },
    });

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

  it('surfaces mapped login error details without re-authenticating against the backend', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({}, 404));
    vi.stubGlobal('fetch', fetchMock as any);
    mockSignIn.mockResolvedValue({
      ok: false,
      error: 'CredentialsSignin',
      code: 'passport_grant',
      status: 200,
      url: null,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    let loginError: Error | null = null;
    await act(async () => {
      try {
        await result.current.login('broken@example.com', 'secret');
      } catch (error) {
        loginError = error as Error;
      }
    });

    expect(loginError?.message).toBe('Laravel Passport password grant is not enabled on the backend.');
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes('/api/auth/login'))).toBe(false);
  });

  it('surfaces frontend Passport client configuration errors without re-authenticating against the backend', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({}, 404));
    vi.stubGlobal('fetch', fetchMock as any);
    mockSignIn.mockResolvedValue({
      ok: false,
      error: 'CredentialsSignin',
      code: 'passport_client',
      status: 200,
      url: null,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    let loginError: Error | null = null;
    await act(async () => {
      try {
        await result.current.login('broken@example.com', 'secret');
      } catch (error) {
        loginError = error as Error;
      }
    });

    expect(loginError?.message).toBe(
      'Passport client configuration is invalid or incomplete on the frontend server.'
    );
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes('/api/auth/login'))).toBe(false);
  });

  it('preserves direct login error messages returned by signIn without issuing a second login request', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({}, 404));
    vi.stubGlobal('fetch', fetchMock as any);
    mockSignIn.mockResolvedValue({
      ok: false,
      error: 'Account is temporarily locked. Please try again later.',
      status: 429,
      url: null,
      code: undefined,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    let loginError: Error | null = null;
    await act(async () => {
      try {
        await result.current.login('locked@example.com', 'secret');
      } catch (error) {
        loginError = error as Error;
      }
    });

    expect(loginError?.message).toBe('Account is temporarily locked. Please try again later.');
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes('/api/auth/login'))).toBe(false);
  });
});
