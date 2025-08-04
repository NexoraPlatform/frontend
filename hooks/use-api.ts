import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';

export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  useEffect(() => {
    fetchData();
  }, dependencies);

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

export function useGetServicesGroupedByCategory() {
    return useApi(() => apiClient.getServicesGroupedByCategory(), []);
}

export function useProviders(params?: any) {
  return useApi(() => apiClient.getProviders(params), [JSON.stringify(params)]);
}

export function useOrders(params?: any) {
  return useApi(() => apiClient.getOrders(params), [JSON.stringify(params)]);
}

export function useProfile() {
  return useApi(() => apiClient.getProfile(), []);
}

export function useTestExamDetails() {
  return useApi(() => apiClient.getTestExamsDetails(), []);
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

export function useAdminOrders() {
  return useApi(() => apiClient.getOrders(), []);
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

export function useAvailableTests() {
  return useApi(() => apiClient.getAvailableTests(), []);
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

export function useProviderProfile() {
  return useApi(() => apiClient.getProviderProfile(), []);
}

export function useGetProviderProfileByUrl(url: string) {
  return useApi(() => apiClient.getProviderProfileByUrl(url), [url]);
}

export function useProviderServices(providerId: string) {
  return useApi(() => apiClient.getProviderServices(providerId), [providerId]);
}

export function useProviderReviews(providerId: string, params?: any) {
  return useApi(() => apiClient.getProviderReviews(providerId, params), [providerId, JSON.stringify(params)]);
}

export function useProviderPortfolio(providerId: string) {
  return useApi(() => apiClient.getProviderPortfolio(providerId), [providerId]);
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

export function useTechnologies() {
  return useApi(() => apiClient.getTechnologies(), []);
}

