import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import axios from '@/lib/axios';

const mockMutate = vi.fn();
const mockSWR = vi.fn();
const mockRouterPush = vi.fn();

vi.mock('@/lib/api', () => ({
  apiClient: {
    setToken: vi.fn(),
    removeToken: vi.fn(),
    updateUserLanguage: vi.fn(),
  },
}));

vi.mock('swr', () => ({
  default: (...args: any[]) => mockSWR(...args),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

vi.mock('@/lib/axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    defaults: { baseURL: 'https://example.com/api' },
  },
  ensureCsrfCookie: vi.fn(),
}));

describe('contexts/auth-context', () => {
  const mockedApi = apiClient as unknown as {
    setToken: vi.Mock;
    removeToken: vi.Mock;
  };

  beforeEach(() => {
    mockSWR.mockReset();
    mockMutate.mockReset();
    mockedApi.setToken.mockReset();
    mockedApi.removeToken.mockReset();
    mockRouterPush.mockReset();
    (axios.post as unknown as vi.Mock).mockReset();
    (axios.get as unknown as vi.Mock).mockReset();
    useAuthStore.setState({ user: null, token: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets user and token from SWR payload', async () => {
    mockSWR.mockReturnValue({
      data: {
        access_token: 'token-123',
        user: {
          id: 123,
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        },
      },
      error: null,
      mutate: mockMutate,
      isValidating: false,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.user).not.toBeNull());

    expect(mockedApi.setToken).toHaveBeenCalledWith('token-123');
    expect(result.current.user?.id).toBe('123');
    expect(result.current.user?.email).toBe('test@example.com');
  });

  it('login sets token, user and revalidates', async () => {
    mockSWR.mockReturnValue({
      data: null,
      error: null,
      mutate: mockMutate,
      isValidating: false,
    });

    (axios.post as unknown as vi.Mock).mockResolvedValue({
      data: {
        access_token: 'token-456',
        user: {
          id: 456,
          email: 'login@example.com',
          firstName: 'Login',
          lastName: 'User',
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

    expect(mockedApi.setToken).toHaveBeenCalledWith('token-456');
    expect(result.current.user?.email).toBe('login@example.com');
    expect(mockMutate).toHaveBeenCalled();
  });

  it('logout clears store and navigates', async () => {
    mockSWR.mockReturnValue({
      data: null,
      error: null,
      mutate: mockMutate,
      isValidating: false,
    });

    useAuthStore.setState({
      user: {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      } as any,
      token: 'token-1',
    });

    (axios.post as unknown as vi.Mock).mockResolvedValue({ data: {} });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.logout();
    });

    expect(mockedApi.removeToken).toHaveBeenCalled();
    expect(mockRouterPush).toHaveBeenCalledWith('/auth/signin');
    expect(useAuthStore.getState().user).toBeNull();
  });
});
