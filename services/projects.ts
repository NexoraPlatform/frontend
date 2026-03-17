import { http } from '@/lib/fetch-client';
import type { AiBriefFinalBrief } from '@/types/ai';
import type { DeliveryProvider, Project } from '@/types/projects';

export type IdLike = string | number;

export interface ProjectBriefLinePayload {
  service_id?: IdLike | null;
  service_name: string;
  delivery_provider: DeliveryProvider;
  description: string;
  budget_percentage: number;
  milestones: Array<{
    title: string;
    description?: string | null;
    percentage?: number;
    amount: number;
    assigned_provider_id?: number | null;
    provider_id?: number | null;
    providerId?: number | null;
  }>;
}

export interface CreateProjectPayload {
  clientId?: IdLike;
  title: string;
  description?: string;
  budget?: number;
  currency?: string;
  paymentPlan?: string;
  project_terms?: {
    license_provider: 'CLIENT';
    allow_open_source: boolean;
    nda_active: boolean;
  };
  brief: {
    title?: string;
    project_lines: ProjectBriefLinePayload[];
  };
  project_lines?: Array<{
    id?: IdLike;
    service_id?: IdLike | null;
    service_name: string;
    delivery_provider: DeliveryProvider;
    status?: string;
    price?: number;
    budget_allocation: number;
    budget_percentage?: number;
    milestones: Array<{
      title: string;
      description?: string | null;
      percentage?: number;
      amount: number;
      assigned_provider_id?: number | null;
      provider_id?: number | null;
      providerId?: number | null;
    }>;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

export interface CreateProjectOptions {
  language?: string;
}

export interface SubmitDeliverablePayload {
  project_line_id: IdLike;
  resource_id?: string;
  repo_url?: string;
  figma_link?: string;
  property_id?: string;
  [key: string]: unknown;
}

export interface CreateProjectApiResponse {
  success?: boolean;
  message?: string;
  data: Project;
  [key: string]: unknown;
}

const toObject = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
};

export const projectsService = {
  async createProject(payload: CreateProjectPayload, options?: CreateProjectOptions) {
    return http.post<CreateProjectApiResponse | Record<string, unknown>>('/api/projects', payload, {
      ...(options?.language ? { params: { language: options.language } } : {}),
    });
  },

  async submitDeliverable(projectId: IdLike, payload: SubmitDeliverablePayload) {
    return http.post<Record<string, unknown>>(`/api/projects/${projectId}/deliverables`, payload);
  },

  buildProjectLinesFromBrief(
    brief: AiBriefFinalBrief,
    totalBudget: number,
    defaultStatus: string = 'pending'
  ) {
    return brief.project_lines.map((line, index) => {
      const safeBudget = Number.isFinite(totalBudget) ? totalBudget : 0;
      const percentage = Number(line.budget_percentage || 0);
      const budgetAllocation =
        safeBudget > 0 && percentage > 0 ? Number(((safeBudget * percentage) / 100).toFixed(2)) : 0;

      return {
        id: `line-${index + 1}`,
        service_id: undefined,
        service_name: line.service_name,
        delivery_provider: line.delivery_provider,
        status: defaultStatus,
        description: line.description,
        price: budgetAllocation,
        budget_allocation: percentage,
        budget_percentage: percentage,
        milestones: line.milestones ?? [],
      };
    });
  },

  extractCreatedProject(response: unknown): Project | null {
    const root = toObject(response);
    if (!root) {
      return null;
    }

    const data = toObject(root.data);
    if (data) {
      return data as Project;
    }

    return root as Project;
  },
};

export default projectsService;
