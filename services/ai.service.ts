import { http } from '@/lib/fetch-client';
import type {
  AiAssistantMessage,
  AiBriefBuilderResultEnvelope,
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
  messages: AiAssistantMessage[];
  [key: string]: unknown;
}

export const aiService = {
  async recommendServices(payload: { brief: string }) {
    return http.post<AiRecommendServicesResponse | Record<string, unknown>>(
      '/api/ai/recommend-services',
      payload
    );
  },

  async buildBrief(payload: AiBriefBuilderPayload) {
    return http.post<AiBriefResponse | Record<string, unknown>>(
      '/api/ai/brief-builder',
      payload
    );
  },

  async getBriefBuilderResult(id: number | string) {
    return http.get<AiBriefResponse | AiBriefBuilderResultEnvelope | Record<string, unknown>>(
      `/api/ai/brief-builder/${encodeURIComponent(String(id))}`
    );
  },
};

export default aiService;
