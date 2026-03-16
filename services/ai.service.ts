import { http } from '@/lib/fetch-client';
import { ensureCsrfCookie, getXsrfToken } from '@/lib/csrf';
import type {
  AiAssistantMessage,
  AiBriefBuilderResultEnvelope,
  AiBriefOtherProvidersByService,
  AiBriefRecommendedProviders,
  AiBriefResponse,
} from '@/types/ai';
import type { DeliveryProvider } from '@/types/projects';

export interface RecommendedServiceCandidate {
  service_id?: number | string;
  service_name: string;
  delivery_provider: DeliveryProvider;
  description?: string;
  [key: string]: unknown;
}

export interface AiRecommendServicesResponse {
  bundle_name?: string;
  services: RecommendedServiceCandidate[];
  [key: string]: unknown;
}

export interface AiBriefBuilderPayload {
  locale?: string;
  channel?: string;
  project_id?: number | string;
  messages: AiAssistantMessage[];
  [key: string]: unknown;
}

export type AiRecommendProvidersServiceInput =
  | string
  | {
      id: number | string;
      name: string;
    };

export interface AiRecommendProvidersPayload {
  project_title: string;
  description: string;
  services: AiRecommendProvidersServiceInput[];
  specific_requirements?: string[];
  top_per_service?: number;
  candidate_limit?: number;
  [key: string]: unknown;
}

export interface AiRecommendProvidersResponse {
  recommended_providers?: AiBriefRecommendedProviders;
  other_providers_by_service?: AiBriefOtherProvidersByService | unknown;
  [key: string]: unknown;
}

const buildAiRequestOptions = async () => {
  if (typeof window === 'undefined') {
    return {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      } as Record<string, string>,
      credentials: 'include' as const,
      withCredentials: true as const,
      baseURL: getAiApiBaseUrl(),
    };
  }

  await ensureCsrfCookie();
  const xsrfToken = getXsrfToken();

  return {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
    },
    credentials: 'include' as const,
    withCredentials: true as const,
    baseURL: getAiApiBaseUrl(),
  };
};

const getAiApiBaseUrl = () =>
  typeof window !== 'undefined' ? window.location.origin : undefined;

export const aiService = {
  async recommendServices(payload: { brief: string }) {
    const requestOptions = await buildAiRequestOptions();
    return http.post<AiRecommendServicesResponse | Record<string, unknown>>(
      '/api/ai/recommend-services',
      payload,
      requestOptions
    );
  },

  async recommendProviders(payload: AiRecommendProvidersPayload) {
    const requestOptions = await buildAiRequestOptions();
    return http.post<AiRecommendProvidersResponse | Record<string, unknown>>(
      '/api/ai/recommend-providers',
      payload,
      requestOptions
    );
  },

  async buildBrief(payload: AiBriefBuilderPayload) {
    const requestOptions = await buildAiRequestOptions();
    return http.post<AiBriefResponse | Record<string, unknown>>(
      '/api/ai/brief-builder',
      payload,
      requestOptions
    );
  },

  async getBriefBuilderResult(id: number | string) {
    const requestOptions = await buildAiRequestOptions();
    return http.get<AiBriefResponse | AiBriefBuilderResultEnvelope | Record<string, unknown>>(
      `/api/ai/brief-builder/${encodeURIComponent(String(id))}`,
      requestOptions
    );
  },
};

export default aiService;
