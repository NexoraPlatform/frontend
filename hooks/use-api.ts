'use client';

import {useState, useEffect, useCallback, useRef} from 'react';
import { apiClient } from '../lib/api';
import { useCurrency } from '@/hooks/useCurrency';
import { FetchError } from '@/lib/fetch-client';

function stableStringify(obj: any) {
  return JSON.stringify(obj, Object.keys(obj).sort());
}

type UseApiOptions<T> = {
  initialData?: T | null;
  revalidateOnMount?: boolean;
};

export function useApi<T>(
    apiCall: () => Promise<T>,
    dependencies: any[] = [],
    enabled: boolean = true,
    options?: UseApiOptions<T>
) {
  const hasInitialData = options ? Object.prototype.hasOwnProperty.call(options, 'initialData') : false;
  const revalidateOnMount = options?.revalidateOnMount ?? !hasInitialData;
  const [data, setData] = useState<T | null>(() => (
    hasInitialData ? options?.initialData ?? null : null
  ));
  const [loading, setLoading] = useState(() => enabled && (!hasInitialData || revalidateOnMount));
  const [error, setError] = useState<string | null>(null);
  const { currency } = useCurrency();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      setData(result);
    } catch (err) {
      if (err instanceof FetchError) {
        const payload = err.data as Record<string, unknown> | null;
        const message =
          (payload?.message as string | undefined) ||
          (payload?.error as string | undefined) ||
          err.message;
        setError(message);
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  // eliminăm deps duplicate cu stable stringify
  const lastDeps = useRef<string>("");
  const skipInitialFetchRef = useRef(hasInitialData && !revalidateOnMount);
  const depsString = stableStringify([...dependencies, currency]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    if (depsString === lastDeps.current) return; // nu a schimbat efectiv deps
    lastDeps.current = depsString;
    if (skipInitialFetchRef.current) {
      skipInitialFetchRef.current = false;
      setLoading(false);
      return;
    }
    fetchData();
  }, [depsString, fetchData, enabled]);

  return { data, loading, error, refetch: fetchData };
}

export function useServices(params?: any) {
  return useApi(() => apiClient.getServices(params), [JSON.stringify(params)]);
}

export function useGetTestResult(params?: any) {
  return useApi(() => apiClient.getTestResult(params), [JSON.stringify(params)]);
}

export function useService(id: string) {
  return useApi(() => apiClient.getService(id), [id]);
}

export function useCategories() {
  return useApi(() => apiClient.getCategories(), []);
}

export function useMainCategories() {
  return useApi(() => apiClient.getMainCategories(), []);
}

export function useAdminCategories() {
  return useApi(() => apiClient.getAllCategories(), []);
}

export function useAdminLegalServiceCategories(params?: {
  search?: string;
  service_group?: string;
  default_contract_type?: 'SERVICES' | 'WORK_FOR_RESULT' | 'MIXED';
  ip_transfer_expected?: boolean;
  dpa_required_by_default?: boolean;
  personal_data_processing_likely?: boolean;
  service_levels_required?: boolean;
  regulated_activity_risk?: boolean;
  export_control_risk?: boolean;
  is_active?: boolean;
  sort_by?:
    | 'service_code'
    | 'service_name'
    | 'service_group'
    | 'sort_order'
    | 'created_at'
    | 'updated_at';
  page?: number;
}) {
  return useApi(
    () => apiClient.getAdminLegalServiceCategories(params),
    [JSON.stringify(params)]
  );
}

export function useGetServicesGroupedByCategory(
  params?: { page?: number; limit?: number; search?: string }
) {
    return useApi(
      () => apiClient.getServicesGroupedByCategory(params),
      [JSON.stringify(params)]
    );
}

export function useProfile() {
  return useApi(() => apiClient.getProfile(), []);
}

export function useBadgeCatalog(enabled: boolean = true) {
  return useApi(() => apiClient.getBadgeCatalog(), [], enabled);
}

export function useMyBadges(enabled: boolean = true) {
  return useApi(() => apiClient.getMyBadges(), [], enabled);
}

export function useMyBadgeProgress(enabled: boolean = true) {
  return useApi(() => apiClient.getMyBadgeProgress(), [], enabled);
}

export function useMyBadgeRewards(enabled: boolean = true) {
  return useApi(() => apiClient.getMyBadgeRewards(), [], enabled);
}

export function useMyReviewOpportunities(enabled: boolean = true) {
  return useApi(() => apiClient.getMyReviewOpportunities(), [], enabled);
}

export function useMyReviews(
  params?: {
    scope?: 'all' | 'authored' | 'received';
    status?: string;
    per_page?: number;
    page?: number;
  },
  enabled: boolean = true
) {
  return useApi(() => apiClient.getMyReviews(params), [JSON.stringify(params)], enabled);
}

export function useTestExamDetails() {
  return useApi(() => apiClient.getTestExamsDetails(), []);
}

export function useEarlyAccessGrouped(params?: { page?: number; per_page?: number }) {
  return useApi(() => apiClient.getEarlyAccessGrouped(params), [JSON.stringify(params)]);
}

export function useAdminStats() {
  return useApi(() => apiClient.getAdminStats(), []);
}

export function useAdminUsers() {
  return useApi(() => apiClient.getUsers(), []);
}

export function useAdminServices() {
  return useApi(() => apiClient.getAllServices(), []);
}

export function useAdminCalls() {
  return useApi(() => apiClient.getCalls(), []);
}

// Tests hooks
export function useTests(params?: any) {
  return useApi(() => apiClient.getTests(params), [JSON.stringify(params)]);
}

export function useAdminTests() {
  return useApi(() => apiClient.getTests(), []);
}

export function useTest(id: string) {
  return useApi(() => apiClient.getTest(id), [id]);
}

export function useTestResults(params?: any) {
  return useApi(() => apiClient.getTestResults(params), [JSON.stringify(params)]);
}

export function useMyTestResults(params?: any) {
  return useApi(() => apiClient.getMyTestResults(params), [JSON.stringify(params)]);
}

export function useTestStatistics(testId: string) {
  return useApi(() => apiClient.getTestStatistics(testId), [testId]);
}

// Provider Profile hooks
export function useProviderProfileById(providerId: string) {
  return useApi(() => apiClient.getProviderProfileById(providerId), [providerId]);
}

export function useProviderProfile(enabled: boolean = true) {
  return useApi(() => apiClient.getProviderProfile(), [], enabled);
}

export function useGetProviderProfileByUrl(url: string) {
  return useApi(() => apiClient.getProviderProfileByUrl(url), [url]);
}

export function usePublicUserBadges(
  userId: string | number | null | undefined,
  enabled: boolean = true
) {
  return useApi(
    () => apiClient.getPublicUserBadges(String(userId)),
    [String(userId ?? '')],
    enabled && Boolean(userId)
  );
}

export function usePublicUserReviews(
  userId: string | number | null | undefined,
  params?: {
    per_page?: number;
    page?: number;
  },
  enabled: boolean = true
) {
  return useApi(
    () => apiClient.getPublicUserReviews(String(userId), params),
    [String(userId ?? ''), JSON.stringify(params)],
    enabled && Boolean(userId)
  );
}

export function usePublicUserFeaturedBadges(
  userId: string | number | null | undefined,
  enabled: boolean = true
) {
  return useApi(
    () => apiClient.getPublicUserFeaturedBadges(String(userId)),
    [String(userId ?? '')],
    enabled && Boolean(userId)
  );
}

export function useProviderServices(providerId: string) {
  return useApi(() => apiClient.getProviderServices(providerId), [providerId]);
}

export function useGetLanguages() {
  return useApi(() => apiClient.getLanguages(), []);
}

// Projects hooks
export function useProjects(params?: any) {
  return useApi(() => apiClient.getProjects(params), [JSON.stringify(params)]);
}

export function useProject(id: string) {
  return useApi(() => apiClient.getProject(id), [id]);
}
