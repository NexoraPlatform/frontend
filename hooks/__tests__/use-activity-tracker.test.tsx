import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useActivityTracker } from '../useActivityTracker';
import apiClient from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

vi.mock('@/lib/api', () => ({
  default: {
    updateLastActive: vi.fn(),
  },
}));

vi.mock('@/contexts/auth-context', () => ({
  useAuth: vi.fn(),
}));

describe('hooks/useActivityTracker', () => {
  const mockedUseAuth = useAuth as unknown as vi.Mock;
  const mockedApi = apiClient as unknown as {
    updateLastActive: vi.Mock;
  };

  beforeEach(() => {
    mockedApi.updateLastActive.mockReset();
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

  it('calls updateLastActive on interval once user is available', async () => {
    vi.useFakeTimers();
    mockedUseAuth.mockReturnValue({ user: { id: '1' }, userLoading: false });

    const { unmount } = renderHook(() => useActivityTracker());

    await waitFor(() => {
      expect(mockedApi.updateLastActive).toHaveBeenCalledTimes(1);
    });

    vi.advanceTimersByTime(60_000);
    expect(mockedApi.updateLastActive).toHaveBeenCalledTimes(2);

    unmount();
    vi.advanceTimersByTime(60_000);
    expect(mockedApi.updateLastActive).toHaveBeenCalledTimes(2);
  });
});
