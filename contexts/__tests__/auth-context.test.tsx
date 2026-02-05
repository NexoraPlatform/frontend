import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api';
import { getCurrentUserAction, updateUserLanguageAction } from '@/app/actions/secure';

vi.mock('@/lib/api', () => ({
  apiClient: {
    setToken: vi.fn(),
    removeToken: vi.fn(),
    register: vi.fn(),
    updateUserLanguage: vi.fn(),
  },
}));

vi.mock('@/app/actions/secure', () => ({
  getCurrentUserAction: vi.fn(),
  updateUserLanguageAction: vi.fn(),
}));

const mockUseSession = vi.fn();
const mockSignIn = vi.fn();
const mockSignOut = vi.fn();

vi.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useSession: () => mockUseSession(),
  signIn: (...args: any[]) => mockSignIn(...args),
  signOut: (...args: any[]) => mockSignOut(...args),
}));

describe('contexts/auth-context', () => {
  const mockedApi = apiClient as unknown as {
    setToken: vi.Mock;
    removeToken: vi.Mock;
  };
  const mockedActions = {
    getCurrentUserAction: getCurrentUserAction as unknown as vi.Mock,
    updateUserLanguageAction: updateUserLanguageAction as unknown as vi.Mock,
  };

  beforeEach(() => {
    localStorage.clear();
    mockUseSession.mockReset();
    mockedApi.setToken.mockReset();
    mockedApi.removeToken.mockReset();
    mockedActions.getCurrentUserAction.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets token and user from session (authenticated)', async () => {
    mockUseSession.mockReturnValue({
      status: 'authenticated',
      update: vi.fn(),
      data: {
        accessToken: 'token-123',
        user: {
          id: 123,
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        },
      },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.user).not.toBeNull());

    expect(mockedApi.setToken).toHaveBeenCalledWith('token-123');
    expect(localStorage.getItem('auth_token')).toBe('token-123');
    expect(result.current.user?.id).toBe('123');
    expect(result.current.user?.email).toBe('test@example.com');
  });

  it('removes token and user on unauthenticated', async () => {
    localStorage.setItem('auth_token', 'old-token');
    localStorage.setItem('user_data', JSON.stringify({ id: '1' }));

    mockUseSession.mockReturnValue({
      status: 'unauthenticated',
      update: vi.fn(),
      data: null,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.user).toBeNull());

    expect(mockedApi.removeToken).toHaveBeenCalled();
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('user_data')).toBeNull();
  });

  it('refreshUser calls server action and updates session when changed', async () => {
    const updateMock = vi.fn();
    mockUseSession.mockReturnValue({
      status: 'authenticated',
      update: updateMock,
      data: {
        accessToken: 'token-123',
        user: {
          id: 1,
          email: 'test@example.com',
          firstName: 'Old',
          lastName: 'User',
        },
      },
    });

    mockedActions.getCurrentUserAction.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      firstName: 'New',
      lastName: 'User',
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.user).not.toBeNull());

    await act(async () => {
      await result.current.refreshUser();
    });

    expect(mockedActions.getCurrentUserAction).toHaveBeenCalled();
    expect(updateMock).toHaveBeenCalled();
    expect(result.current.user?.firstName).toBe('New');
  });
});
