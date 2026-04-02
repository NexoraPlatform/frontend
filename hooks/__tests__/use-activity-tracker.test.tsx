import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useActivityTracker } from '../useActivityTracker';
import apiClient from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

vi.mock('@/lib/api', () => ({
  default: {
    updateLastActive: vi.fn(),
    getToken: vi.fn(),
    setToken: vi.fn(),
  },
}));

vi.mock('@/contexts/auth-context', () => ({
  useAuth: vi.fn(),
}));

describe('hooks/useActivityTracker', () => {
  const mockedUseAuth = useAuth as unknown as vi.Mock;
  const mockedApi = apiClient as unknown as {
    updateLastActive: vi.Mock;
    getToken: vi.Mock;
    setToken: vi.Mock;
  };

  beforeEach(() => {
    mockedApi.updateLastActive.mockReset();
    mockedApi.updateLastActive.mockResolvedValue(undefined);
    mockedApi.getToken.mockReset();
    mockedApi.setToken.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('does not call updateLastActive when loading or no user', () => {
    mockedUseAuth.mockReturnValue({ user: null, userLoading: true });
    renderHook(() => useActivityTracker());
    expect(mockedApi.updateLastActive).not.toHaveBeenCalled();

    mockedUseAuth.mockReturnValue({ user: null, userLoading: false });
    renderHook(() => useActivityTracker());
    expect(mockedApi.updateLastActive).not.toHaveBeenCalled();
  });

  it('calls updateLastActive once token is available and on interval', async () => {
    vi.useFakeTimers();
    mockedUseAuth.mockReturnValue({ user: { id: '1' }, userLoading: false });
    mockedApi.getToken.mockReturnValue('token-123');

    const { unmount } = renderHook(() => useActivityTracker());
    expect(mockedApi.updateLastActive).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(mockedApi.updateLastActive).toHaveBeenCalledTimes(2);

    unmount();
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(mockedApi.updateLastActive).toHaveBeenCalledTimes(2);
  });
});
