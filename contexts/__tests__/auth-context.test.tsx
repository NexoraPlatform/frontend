import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import axios from '@/lib/axios';
import { apiClient } from '@/lib/api';

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('@/lib/api', () => ({
  apiClient: {
    updateUserLanguage: vi.fn(),
  },
}));

describe('contexts/auth-context', () => {
  const mockedAxios = axios as unknown as { get: vi.Mock; post: vi.Mock };
  const mockedApi = apiClient as unknown as { updateUserLanguage: vi.Mock };

  beforeEach(() => {
    mockedAxios.get.mockReset();
    mockedAxios.post.mockReset();
    mockedApi.updateUserLanguage.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('hydrates user from SSR initialUser without requesting /me', async () => {
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
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it('does not request /me when there is no SSR initial user', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockedAxios.get).not.toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });

  it('setUserLanguage updates local user', async () => {
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
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true });
    vi.stubGlobal('fetch', fetchMock as any);

    mockedAxios.get.mockResolvedValue({
      data: {
        user: {
          id: 7,
          email: 'login@example.com',
          firstName: 'Log',
          lastName: 'In',
        },
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
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/auth/me');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
