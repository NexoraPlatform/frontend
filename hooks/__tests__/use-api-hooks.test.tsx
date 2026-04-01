import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  useApi,
  useMyBadgeProgress,
  useMyBadges,
  useMyBadgeRewards,
  usePublicUserBadges,
  useServices,
  useTestResults,
  useProviderProfile,
  useGetProviderProfileByUrl,
} from '../use-api';
import { apiClient } from '@/lib/api';

let currency = 'USD';
vi.mock('@/hooks/useCurrency', () => ({
  useCurrency: () => ({ currency }),
}));

vi.mock('@/lib/api', () => ({
  apiClient: {
    getServices: vi.fn(),
    getTestResults: vi.fn(),
    getProviderProfile: vi.fn(),
    getProviderProfileByUrl: vi.fn(),
    getMyBadges: vi.fn(),
    getMyBadgeProgress: vi.fn(),
    getMyBadgeRewards: vi.fn(),
    getPublicUserBadges: vi.fn(),
  },
}));

describe('hooks/useApi and specific hooks', () => {
  const mockedApi = apiClient as unknown as {
    getServices: vi.Mock;
    getTestResults: vi.Mock;
    getProviderProfile: vi.Mock;
    getProviderProfileByUrl: vi.Mock;
    getMyBadges: vi.Mock;
    getMyBadgeProgress: vi.Mock;
    getMyBadgeRewards: vi.Mock;
    getPublicUserBadges: vi.Mock;
  };

  beforeEach(() => {
    currency = 'USD';
    mockedApi.getServices.mockReset();
    mockedApi.getTestResults.mockReset();
    mockedApi.getProviderProfile.mockReset();
    mockedApi.getProviderProfileByUrl.mockReset();
    mockedApi.getMyBadges.mockReset();
    mockedApi.getMyBadgeProgress.mockReset();
    mockedApi.getMyBadgeRewards.mockReset();
    mockedApi.getPublicUserBadges.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not call apiCall when enabled=false and sets loading false', async () => {
    const apiCall = vi.fn().mockResolvedValue('ok');
    const { result } = renderHook(() => useApi(apiCall, [], false));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(apiCall).not.toHaveBeenCalled();
  });

  it('refetches when dependencies change', async () => {
    const apiCall = vi.fn().mockResolvedValue('ok');
    const { rerender } = renderHook(({ dep }) => useApi(apiCall, [dep]), {
      initialProps: { dep: 'a' },
    });

    await waitFor(() => expect(apiCall).toHaveBeenCalledTimes(1));

    rerender({ dep: 'b' });
    await waitFor(() => expect(apiCall).toHaveBeenCalledTimes(2));
  });

  it('refetches when currency changes', async () => {
    const apiCall = vi.fn().mockResolvedValue('ok');
    const { rerender } = renderHook(() => useApi(apiCall));

    await waitFor(() => expect(apiCall).toHaveBeenCalledTimes(1));

    currency = 'EUR';
    rerender();
    await waitFor(() => expect(apiCall).toHaveBeenCalledTimes(2));
  });

  it('useServices calls apiClient.getServices with params', async () => {
    mockedApi.getServices.mockResolvedValue({ data: [] });

    const params = { search: 'dev', minPrice: 10 };
    const { result } = renderHook(() => useServices(params));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockedApi.getServices).toHaveBeenCalledWith(params);
  });

  it('useTestResults calls apiClient.getTestResults with params', async () => {
    mockedApi.getTestResults.mockResolvedValue({ data: [] });

    const params = { userId: '1', passed: true };
    const { result } = renderHook(() => useTestResults(params));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockedApi.getTestResults).toHaveBeenCalledWith(params);
  });

  it('useProviderProfile respects enabled flag', async () => {
    mockedApi.getProviderProfile.mockResolvedValue({ id: '1' });

    const { result } = renderHook(() => useProviderProfile(false));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockedApi.getProviderProfile).not.toHaveBeenCalled();
  });

  it('useGetProviderProfileByUrl calls apiClient.getProviderProfileByUrl', async () => {
    mockedApi.getProviderProfileByUrl.mockResolvedValue({ id: 'x' });

    const { result } = renderHook(() => useGetProviderProfileByUrl('john-doe'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockedApi.getProviderProfileByUrl).toHaveBeenCalledWith('john-doe');
  });

  it('useMyBadges resolves badge collections for the authenticated user', async () => {
    mockedApi.getMyBadges.mockResolvedValue([{ id: 1 }]);

    const { result } = renderHook(() => useMyBadges());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockedApi.getMyBadges).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual([{ id: 1 }]);
  });

  it('useMyBadgeProgress resolves badge progress data', async () => {
    mockedApi.getMyBadgeProgress.mockResolvedValue([{ id: 2, progress_percent: 80 }]);

    const { result } = renderHook(() => useMyBadgeProgress());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockedApi.getMyBadgeProgress).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual([{ id: 2, progress_percent: 80 }]);
  });

  it('useMyBadgeRewards resolves reward data', async () => {
    mockedApi.getMyBadgeRewards.mockResolvedValue([{ id: 3, reward_type: 'priority_support' }]);

    const { result } = renderHook(() => useMyBadgeRewards());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockedApi.getMyBadgeRewards).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual([{ id: 3, reward_type: 'priority_support' }]);
  });

  it('usePublicUserBadges waits for a user id before fetching', async () => {
    const { result, rerender } = renderHook(
      ({ userId }) => usePublicUserBadges(userId),
      {
        initialProps: { userId: null as string | null },
      }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockedApi.getPublicUserBadges).not.toHaveBeenCalled();

    mockedApi.getPublicUserBadges.mockResolvedValue([{ id: 7 }]);
    rerender({ userId: 'provider-77' });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockedApi.getPublicUserBadges).toHaveBeenCalledWith('provider-77');
    expect(result.current.data).toEqual([{ id: 7 }]);
  });
});
