import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import axios from '@/lib/axios';
import { updateUserLanguageAction } from '@/app/actions/secure';

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('@/app/actions/secure', () => ({
  updateUserLanguageAction: vi.fn(),
}));

describe('contexts/auth-context', () => {
  const mockedAxios = axios as unknown as { get: vi.Mock; post: vi.Mock };
  const mockedActions = {
    updateUserLanguageAction: updateUserLanguageAction as unknown as vi.Mock,
  };

  beforeEach(() => {
    localStorage.clear();
    mockedAxios.get.mockReset();
    mockedAxios.post.mockReset();
    mockedActions.updateUserLanguageAction.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets user from api response', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
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

    expect(result.current.user?.id).toBe('123');
    expect(result.current.user?.email).toBe('test@example.com');
  });

  it('setUserLanguage updates local user', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        user: {
          id: 1,
          email: 'test@example.com',
          firstName: 'Old',
          lastName: 'User',
          language: 'ro',
        },
      },
    });

    mockedActions.updateUserLanguageAction.mockResolvedValue({
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
  });
});
