import { normalizeMilestoneChangeRequest } from '@/lib/milestone-change-requests';

import type { ApiClientCore } from '../core';
import {
  asArray,
  asObject,
  extractProjectEntity,
  extractProjectsCollection,
  normalizeMilestoneStatusInput,
  normalizeProjectEntity,
  normalizePublicProjectEntity,
} from '../normalizers';
import type {
  CreateProjectPayload,
  GenerateProjectInformationResponse,
  MarkProjectMilestonePayload,
  MilestoneStatusInput,
  ProjectProviderBudgetResponsePayload,
  ProjectRespondPayload,
  ReassignProjectMilestonesPayload,
  ReplacementSuggestionsQuery,
  RespondToProjectMilestoneProposalPayload,
  SubmitProjectMilestoneProposalsPayload,
} from '../types';

export const projectApiMethods = {
  async getProjects(
    this: ApiClientCore,
    params?: {
      clientId?: string;
      status?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const searchParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const query = searchParams.toString();
    const response = await this.request<any>(`/projects${query ? `?${query}` : ''}`);
    const projects = extractProjectsCollection(response);

    if (projects.length > 0) {
      if (Array.isArray(response)) {
        return projects.map(normalizeProjectEntity);
      }

      const payload = asObject(response);
      if (payload && Array.isArray(payload.projects)) {
        return {
          ...payload,
          projects: projects.map(normalizeProjectEntity),
        };
      }

      return projects.map(normalizeProjectEntity);
    }

    const maybeProject = extractProjectEntity(response);
    return maybeProject ? normalizeProjectEntity(maybeProject) : response;
  },

  async getProjectBySlug(this: ApiClientCore, slug: string) {
    const response = await this.request<any>(`/projects/slug/${slug}`);
    const project = extractProjectEntity(response);
    return project ? normalizeProjectEntity(project) : response;
  },

  async getPublicProjects(
    this: ApiClientCore,
    params?: {
      page?: number;
      search?: string;
      category?: string;
      technologies?: string[];
      budget_min?: number;
      budget_max?: number;
    }
  ) {
    const searchParams = new URLSearchParams();
    if (params) {
      if (params.page !== undefined && params.page !== null) {
        searchParams.append('page', params.page.toString());
      }
      if (params.search) {
        searchParams.append('search', params.search);
      }
      if (params.category) {
        searchParams.append('category', params.category);
      }
      if (params.technologies && params.technologies.length > 0) {
        params.technologies.forEach((tech) => searchParams.append('technologies', tech));
      }
      if (params.budget_min !== undefined && params.budget_min !== null) {
        searchParams.append('budget_min', params.budget_min.toString());
      }
      if (params.budget_max !== undefined && params.budget_max !== null) {
        searchParams.append('budget_max', params.budget_max.toString());
      }
    }

    const query = searchParams.toString();
    const response = await this.request<any>(`/projects${query ? `?${query}` : ''}`);
    const projects = extractProjectsCollection(response);

    if (projects.length > 0) {
      return projects.map(normalizePublicProjectEntity);
    }

    if (Array.isArray(response)) {
      return response.map(normalizePublicProjectEntity);
    }

    return [];
  },

  async getProviderProjectRequests(this: ApiClientCore) {
    const response = await this.request<any>('/projects/requests', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const payload = asObject(response);
    if (payload && payload.success === false) {
      const message =
        (typeof payload.message === 'string' && payload.message) ||
        (typeof payload.error === 'string' && payload.error) ||
        'Failed to load project requests.';
      throw new Error(message);
    }
    const projects = extractProjectsCollection(response).map(normalizeProjectEntity);

    return {
      ...(payload ?? {}),
      projects,
    };
  },

  async respondToProjectRequest(
    this: ApiClientCore,
    projectId: string,
    response: ProjectRespondPayload,
    language?: string
  ) {
    const params = new URLSearchParams();
    if (language) params.set('language', language);
    const qs = params.toString();
    const payload: Record<string, unknown> = {
      response: response.response,
      ...(response.proposedBudget !== undefined
        ? { proposedBudget: response.proposedBudget }
        : {}),
      ...(response.reason ? { reason: response.reason } : {}),
      ...(response.refusal_scope ? { refusal_scope: response.refusal_scope } : {}),
      ...(Array.isArray(response.milestone_ids) && response.milestone_ids.length > 0
        ? { milestone_ids: response.milestone_ids.map((id) => String(id)) }
        : {}),
      ...(typeof response.suggestions_limit === 'number'
        ? { suggestions_limit: response.suggestions_limit }
        : {}),
    };
    return this.request<any>(`/projects/${projectId}/respond${qs ? `?${qs}` : ''}`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  async markProjectMilestone(
    this: ApiClientCore,
    projectId: number | string,
    payload: MarkProjectMilestonePayload
  ) {
    const normalizedStatus = normalizeMilestoneStatusInput(payload?.status);

    const response = await this.request<any>(`/projects/${projectId}/markMilestone`, {
      method: 'POST',
      body: JSON.stringify({
        milestone: String(payload.milestone),
        ...(normalizedStatus ? { status: normalizedStatus } : {}),
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const responsePayload = asObject(response);
    if (responsePayload && asObject(responsePayload.data)) {
      return {
        ...responsePayload,
        data: normalizeProjectEntity(responsePayload.data),
      };
    }

    const project = extractProjectEntity(response);
    return project ? normalizeProjectEntity(project) : response;
  },

  async markMilestoneAsComplete(
    this: ApiClientCore & {
      markProjectMilestone: (
        projectId: number | string,
        payload: MarkProjectMilestonePayload
      ) => Promise<any>;
    },
    projectId: number | string,
    milestone: number | string,
    language?: string,
    status?: MilestoneStatusInput
  ) {
    return this.markProjectMilestone(projectId, {
      milestone,
      ...(language ? { language } : {}),
      ...(status ? { status } : {}),
    });
  },

  async getClientProjectRequests(this: ApiClientCore) {
    const response = await this.request<any>('/projects/my-requests', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const payload = asObject(response);
    if (payload && payload.success === false) {
      const message =
        (typeof payload.message === 'string' && payload.message) ||
        (typeof payload.error === 'string' && payload.error) ||
        'Failed to load project requests.';
      throw new Error(message);
    }
    const projects = extractProjectsCollection(response).map(normalizeProjectEntity);

    return {
      ...(payload ?? {}),
      projects,
    };
  },

  async githubInitiate(this: ApiClientCore) {
    return this.request<any>('/auth/github/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  async connectGithub(this: ApiClientCore) {
    return this.request<any>('/auth/github/redirect', {
      method: 'GET',
      headers: {},
    });
  },

  async createGithubRepo(
    this: ApiClientCore,
    projectId: string | number,
    target: string
  ) {
    return this.request<any>(`/projects/${projectId}/create-repo`, {
      method: 'POST',
      body: JSON.stringify({ target }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  async respondToBudgetProposal(
    this: ApiClientCore,
    projectId: string,
    providerId: string,
    response: ProjectProviderBudgetResponsePayload,
    language?: string
  ) {
    const params = new URLSearchParams();
    if (language) params.set('language', language);
    const qs = params.toString();
    const responsePayload = await this.request<any>(
      `/projects/${projectId}/providers/${providerId}/budget-response${qs ? `?${qs}` : ''}`,
      {
        method: 'POST',
        body: JSON.stringify(response),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const project = extractProjectEntity(responsePayload);
    return project
      ? {
          ...(asObject(responsePayload) ?? {}),
          project: normalizeProjectEntity(project),
        }
      : responsePayload;
  },

  async submitProjectMilestoneProposals(
    this: ApiClientCore,
    projectId: string | number,
    payload: SubmitProjectMilestoneProposalsPayload,
    language?: string
  ) {
    const params = new URLSearchParams();
    if (language) params.set('language', language);
    const qs = params.toString();
    const responsePayload = await this.request<any>(
      `/projects/${projectId}/milestone-proposals${qs ? `?${qs}` : ''}`,
      {
        method: 'POST',
        body: JSON.stringify({
          proposals: payload.proposals.map((proposal) => ({
            proposal_type: proposal.proposal_type,
            project_line_id: String(proposal.project_line_id),
            ...(proposal.project_line_milestone_id !== undefined &&
            proposal.project_line_milestone_id !== null
              ? { project_line_milestone_id: String(proposal.project_line_milestone_id) }
              : {}),
            ...(proposal.title ? { title: proposal.title } : {}),
            ...(proposal.description !== undefined ? { description: proposal.description } : {}),
            ...(typeof proposal.amount === 'number' && Number.isFinite(proposal.amount)
              ? { amount: proposal.amount }
              : {}),
            ...(typeof proposal.percentage === 'number' &&
            Number.isFinite(proposal.percentage)
              ? { percentage: proposal.percentage }
              : {}),
            ...(proposal.reason ? { reason: proposal.reason } : {}),
          })),
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const payloadObject = asObject(responsePayload);
    const normalizedProposals = asArray(payloadObject?.proposals).map(
      normalizeMilestoneChangeRequest
    );
    const project = extractProjectEntity(responsePayload);

    return {
      ...(payloadObject ?? {}),
      ...(normalizedProposals.length > 0 ? { proposals: normalizedProposals } : {}),
      ...(project ? { project: normalizeProjectEntity(project) } : {}),
    };
  },

  async respondToProjectMilestoneProposal(
    this: ApiClientCore,
    projectId: string | number,
    proposalId: string | number,
    payload: RespondToProjectMilestoneProposalPayload,
    language?: string
  ) {
    const params = new URLSearchParams();
    if (language) params.set('language', language);
    const qs = params.toString();
    const responsePayload = await this.request<any>(
      `/projects/${projectId}/milestone-proposals/${proposalId}/respond${qs ? `?${qs}` : ''}`,
      {
        method: 'POST',
        body: JSON.stringify({
          response: payload.response,
          ...(payload.reason ? { reason: payload.reason } : {}),
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const payloadObject = asObject(responsePayload);
    const proposal = asObject(payloadObject?.proposal)
      ? normalizeMilestoneChangeRequest(payloadObject?.proposal)
      : null;
    const project = extractProjectEntity(responsePayload);

    return {
      ...(payloadObject ?? {}),
      ...(proposal ? { proposal } : {}),
      ...(project ? { project: normalizeProjectEntity(project) } : {}),
    };
  },

  async getReplacementProviderSuggestions(
    this: ApiClientCore,
    projectId: string | number,
    query?: ReplacementSuggestionsQuery
  ) {
    const params = new URLSearchParams();
    if (query) {
      if (Array.isArray(query.milestone_ids) && query.milestone_ids.length > 0) {
        query.milestone_ids.forEach((id) => {
          params.append('milestone_ids[]', String(id));
        });
      }
      if (query.exclude_provider_id !== undefined && query.exclude_provider_id !== null) {
        params.set('exclude_provider_id', String(query.exclude_provider_id));
      }
      if (typeof query.limit === 'number' && Number.isFinite(query.limit)) {
        params.set('limit', String(query.limit));
      }
    }
    const qs = params.toString();
    return this.request<any>(
      `/projects/${projectId}/replacement-provider-suggestions${qs ? `?${qs}` : ''}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  },

  async reassignProjectMilestones(
    this: ApiClientCore,
    projectId: string | number,
    payload: ReassignProjectMilestonesPayload
  ) {
    return this.request<any>(`/projects/${projectId}/milestones/reassign`, {
      method: 'POST',
      body: JSON.stringify({
        provider_id: payload.provider_id,
        milestone_ids: payload.milestone_ids.map((id) => String(id)),
        ...(payload.language ? { language: payload.language } : {}),
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  async generateProjectContract(this: ApiClientCore, projectId: string | number) {
    return this.request<any>('/contract/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ project_id: projectId }),
    });
  },

  async createProject(
    this: ApiClientCore,
    projectData: CreateProjectPayload,
    language?: string
  ) {
    const params = new URLSearchParams();
    if (language) params.set('language', language);
    const qs = params.toString();
    const response = await this.request<any>(`/projects${qs ? `?${qs}` : ''}`, {
      method: 'POST',
      body: JSON.stringify(projectData),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const payload = asObject(response);
    if (payload && asObject(payload.data)) {
      return {
        ...payload,
        data: normalizeProjectEntity(payload.data),
      };
    }

    const project = extractProjectEntity(response);
    return project ? normalizeProjectEntity(project) : response;
  },

  async getProject(this: ApiClientCore, id: string) {
    const response = await this.request<any>(`/projects/${id}`);
    const project = extractProjectEntity(response);
    return project ? normalizeProjectEntity(project) : response;
  },

  async updateProject(this: ApiClientCore, id: string, projectData: any) {
    return this.request<any>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(projectData),
    });
  },

  async deleteProject(this: ApiClientCore, id: string) {
    return this.request<any>(`/projects/${id}`, {
      method: 'DELETE',
    });
  },

  async getClientProjects(this: ApiClientCore, clientId: string, limit?: number) {
    const endpoint =
      limit !== undefined && limit !== null
        ? `/projects/client/${clientId}/${limit}`
        : `/projects/client/${clientId}`;
    const response = await this.request<any>(endpoint);
    const projects = extractProjectsCollection(response).map(normalizeProjectEntity);

    if (projects.length > 0) {
      const payload = asObject(response);
      if (payload && Array.isArray(payload.projects)) {
        return {
          ...payload,
          projects,
        };
      }

      return projects;
    }

    const project = extractProjectEntity(response);
    return project ? normalizeProjectEntity(project) : response;
  },

  async getSuggestedProviders(
    this: ApiClientCore,
    services: { service: string; level: string }[]
  ) {
    return this.request<any>('/providers/suggestions', {
      method: 'POST',
      body: JSON.stringify({ services }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  async generateProjectInformation(this: ApiClientCore, projectData: any) {
    return this.request<GenerateProjectInformationResponse>(
      '/projects/generate-information-by-ai',
      {
        method: 'POST',
        body: JSON.stringify(projectData),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  },

  async getProjectNameByProjectUrl(this: ApiClientCore, projectUrl: string) {
    const response = await this.request<any>(`/project/${projectUrl}/name`);

    if (typeof response === 'string') {
      return response;
    }

    if (typeof response?.name === 'string') {
      return response.name;
    }

    return undefined;
  },
};

export type ProjectApiMethods = typeof projectApiMethods;
