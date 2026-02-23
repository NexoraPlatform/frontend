import { apiFetch, FetchError } from '@/lib/fetch-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://Trustorabe.dacars.ro/api';

export type RoleLite = {
  id: number;
  name: string;
  slug: string;
};

export type LegalClauseContent = Record<string, string>;

export type LegalClause = {
  id: number;
  identifier: string;
  category: string;
  content: LegalClauseContent;
  created_at: string;
  updated_at: string;
};

export type MilestoneEntry = {
  title: string;
  amount: number;
};

export type ProviderMilestonePayload = {
  providerId: number;
  milestones: MilestoneEntry[];
};

export type ProviderRoleMilestonePayload = {
  provider_role: string;
  milestones: MilestoneEntry[];
};

export type MilestoneStatusInput =
  | 'pending'
  | 'work_in_progress'
  | 'in_progress'
  | 'work in progress'
  | 'finished'
  | 'paid'
  | (string & {});

export type MarkProjectMilestonePayload = {
  milestone: number | string;
  language?: string;
  status?: MilestoneStatusInput;
};

export type ProjectRespondPayload = {
  response: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'NEW_PROPOSE';
  proposedBudget?: number;
  reason?: string;
  refusal_scope?: 'project' | 'milestone' | 'milestones';
  milestone_ids?: Array<string | number>;
  suggestions_limit?: number;
};

export type ProjectProviderBudgetResponsePayload = {
  budget?: number;
  notes?: string;
  [key: string]: unknown;
};

export type ReplacementSuggestionsQuery = {
  milestone_ids?: Array<string | number>;
  exclude_provider_id?: string | number;
  limit?: number;
};

export type ReassignProjectMilestonesPayload = {
  provider_id: string | number;
  milestone_ids: Array<string | number>;
  language?: string;
};

export type CreateProjectPayload = {
  title: string;
  description: string;
  budget: number;
  budgetType: 'FIXED' | 'HOURLY';
  paymentPlan?: string;
  milestoneCount?: number;
  milestones?: ProviderMilestonePayload[];
  [key: string]: unknown;
};

export type GenerateProjectInformationResponse = {
  title: string;
  description: string;
  technologies: string[];
  estimated_budget: number;
  budget_type: string;
  team_structure: unknown[];
  deadline: string;
  additional_services: string[];
  payment_plan?: string;
  milestone_count?: number;
  milestones?: ProviderRoleMilestonePayload[];
  notes?: string;
};

type BudgetPayload = {
  amount: number | null;
  currency: string;
  original_usd?: number | null;
};

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const normalizeMilestoneStatusInput = (
  value: unknown
): 'pending' | 'work_in_progress' | 'finished' | 'paid' | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  if (!normalized) {
    return null;
  }

  if (normalized === 'PENDING') {
    return 'pending';
  }

  if (
    normalized === 'WORK_IN_PROGRESS' ||
    normalized === 'IN_PROGRESS' ||
    normalized === 'WORK IN PROGRESS'
  ) {
    return 'work_in_progress';
  }

  if (normalized === 'FINISHED' || normalized === 'COMPLETED') {
    return 'finished';
  }

  if (normalized === 'PAID') {
    return 'paid';
  }

  return null;
};

const asObject = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
};

const asArray = <T = unknown>(value: unknown): T[] => {
  return Array.isArray(value) ? (value as T[]) : [];
};

const normalizeBudgetPayload = (value: unknown): BudgetPayload => {
  const budgetObject = asObject(value);

  if (budgetObject) {
    const amount = toFiniteNumber(budgetObject.amount);
    const originalUsd = toFiniteNumber(budgetObject.original_usd);
    const currencyRaw = budgetObject.currency;
    const currency =
      typeof currencyRaw === 'string' && currencyRaw.trim() ? currencyRaw : 'USD';

    return {
      amount,
      currency,
      ...(originalUsd !== null ? { original_usd: originalUsd } : {}),
    };
  }

  const amount = toFiniteNumber(value);
  return {
    amount,
    currency: 'USD',
    ...(amount !== null ? { original_usd: amount } : {}),
  };
};

const normalizeProjectLineMilestone = (value: unknown) => {
  const milestone = asObject(value) ?? {};
  const amount = toFiniteNumber(milestone.amount) ?? 0;
  const percentage = toFiniteNumber(milestone.percentage) ?? 0;

  return {
    ...milestone,
    amount,
    percentage,
    status:
      (typeof milestone.status === 'string' && milestone.status) || 'PENDING',
  };
};

const normalizeProjectDeliverable = (value: unknown) => {
  const deliverable = asObject(value) ?? {};
  const metaData = asObject(deliverable.meta_data);

  return {
    ...deliverable,
    meta_data: metaData ?? {},
  };
};

const normalizeProjectLine = (value: unknown) => {
  const line = asObject(value) ?? {};
  const milestones = asArray(line.milestones).map(normalizeProjectLineMilestone);
  const deliverables = asArray(line.deliverables).map(normalizeProjectDeliverable);

  const price = toFiniteNumber(line.price);
  const rawBudgetAllocation = toFiniteNumber(line.budget_allocation);
  const rawBudgetPercentage = toFiniteNumber(line.budget_percentage);
  const budgetPercentage =
    rawBudgetPercentage ??
    (rawBudgetAllocation !== null && rawBudgetAllocation <= 100
      ? rawBudgetAllocation
      : 0);
  const budgetAllocationAmount =
    price ??
    (rawBudgetAllocation !== null && rawBudgetAllocation > 100
      ? rawBudgetAllocation
      : 0);

  return {
    ...line,
    price: price ?? 0,
    budget_allocation: budgetAllocationAmount,
    budget_percentage: budgetPercentage,
    milestones,
    deliverables,
  };
};

const extractProjectsCollection = (value: unknown): unknown[] => {
  if (Array.isArray(value)) {
    return value;
  }

  const payload = asObject(value);
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload.projects)) {
    return payload.projects;
  }

  const data = payload.data;
  if (Array.isArray(data)) {
    return data;
  }

  const nestedData = asObject(data);
  if (nestedData && Array.isArray(nestedData.projects)) {
    return nestedData.projects;
  }

  return [];
};

const extractProjectEntity = (value: unknown): Record<string, unknown> | null => {
  const payload = asObject(value);
  if (!payload) {
    return null;
  }

  if ('id' in payload || 'slug' in payload || 'project_lines' in payload) {
    return payload;
  }

  const data = asObject(payload.data);
  if (data && ('id' in data || 'slug' in data || 'project_lines' in data)) {
    return data;
  }

  const project = asObject(payload.project);
  if (project && ('id' in project || 'slug' in project || 'project_lines' in project)) {
    return project;
  }

  const nestedProject = data ? asObject(data.project) : null;
  if (nestedProject) {
    return nestedProject;
  }

  return null;
};

const normalizeProjectEntity = (value: unknown) => {
  const project = asObject(value);
  if (!project) {
    return value;
  }

  const budget = normalizeBudgetPayload(project.budget);
  const projectLines = asArray(project.project_lines).map(normalizeProjectLine);
  const projectLineMilestones = asArray(project.project_line_milestones);
  const projectDeliverables = asArray(project.project_deliverables);

  const normalizedProjectLineMilestones =
    projectLineMilestones.length > 0
      ? projectLineMilestones.map(normalizeProjectLineMilestone)
      : projectLines.flatMap((line) =>
        asArray(asObject(line)?.milestones).map(normalizeProjectLineMilestone)
      );

  const normalizedProjectDeliverables =
    projectDeliverables.length > 0
      ? projectDeliverables.map(normalizeProjectDeliverable)
      : projectLines.flatMap((line) =>
        asArray(asObject(line)?.deliverables).map(normalizeProjectDeliverable)
      );

  const title =
    typeof project.title === 'string' && project.title.trim()
      ? project.title
      : 'Untitled project';
  const description =
    typeof project.description === 'string' ? project.description : '';
  const createdAt =
    typeof project.created_at === 'string' && project.created_at
      ? project.created_at
      : new Date().toISOString();
  const status =
    typeof project.status === 'string' && project.status
      ? project.status
      : 'PENDING';

  return {
    ...project,
    title,
    description,
    created_at: createdAt,
    status,
    budget,
    budget_value: budget.amount,
    project_lines: projectLines,
    project_line_milestones: normalizedProjectLineMilestones,
    project_deliverables: normalizedProjectDeliverables,
    providers: asArray(project.providers),
    selected_providers: asArray(project.selected_providers),
    existing_services: asArray(project.existing_services),
    custom_services: asArray(project.custom_services),
    milestones: asArray(project.milestones),
  };
};

const normalizePublicProjectEntity = (value: unknown) => {
  const normalized = asObject(normalizeProjectEntity(value)) ?? {};
  const normalizedBudget = normalizeBudgetPayload(normalized.budget);
  const technologies = asArray(normalized.technologies)
    .map((item) => String(item ?? '').trim())
    .filter(Boolean);
  const deadline =
    (typeof normalized.deadline === 'string' && normalized.deadline) ||
    (typeof normalized.project_duration === 'string' && normalized.project_duration) ||
    '1month';
  const budgetType = String(normalized.budget_type ?? 'fixed').toLowerCase() === 'hourly'
    ? 'hourly'
    : 'fixed';

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const clientRaw = asObject(normalized.client) as any;
  const client = clientRaw
    ? {
      name: String(clientRaw.name || ''),
      location: String(clientRaw.location || ''),
      rating: toFiniteNumber(clientRaw.rating) ?? 0,
      total_reviews: toFiniteNumber(clientRaw.total_reviews) ?? 0,
      ...(typeof clientRaw.avatar_url === 'string' ? { avatar_url: clientRaw.avatar_url } : {}),
    }
    : undefined;

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const milestones = Array.isArray(normalized.milestones) ? (normalized.milestones as any[]) : undefined;

  return {
    id: String(normalized.id ?? ''),
    title:
      (typeof normalized.title === 'string' && normalized.title.trim()) ||
      'Untitled project',
    description:
      (typeof normalized.description === 'string' && normalized.description) || '',
    category:
      (typeof normalized.category === 'string' && normalized.category) || 'General',
    technologies,
    budget: {
      ...normalizedBudget,
      amount: normalizedBudget.amount ?? 0,
      original_usd: normalizedBudget.original_usd ?? 0,
    },
    budget_min: toFiniteNumber(normalized.budget_min) ?? normalizedBudget.amount ?? undefined,
    budget_max: toFiniteNumber(normalized.budget_max) ?? normalizedBudget.amount ?? undefined,
    budget_type: budgetType,
    deadline,
    offers_count: toFiniteNumber(normalized.offers_count) ?? 0,
    is_recommended: Boolean(normalized.is_recommended),
    created_at: typeof normalized.created_at === 'string' ? normalized.created_at : new Date().toISOString(),
    ...(typeof normalized.payment_plan === 'string' ? { payment_plan: normalized.payment_plan } : {}),
    ...(typeof normalized.milestone_count === 'number' ? { milestone_count: normalized.milestone_count } : {}),
    ...(milestones ? { milestones } : {}),
    ...(client ? { client } : {}),
  } as any;
};

export type StatsChangeType = 'increase' | 'decrease' | 'neutral';

export type StatsEntry = {
  value: number;
  change: number;
  change_type: StatsChangeType;
};

export type MoneyStatsEntry = StatsEntry & {
  value: number;
  currency: string;
  change_percentage: number;
};

export type ProviderDashboardStats = {
  active_projects: StatsEntry;
  monthly_revenue: MoneyStatsEntry;
  average_rating: StatsEntry;
  new_requests: StatsEntry;
};

export type ClientDashboardStats = {
  projects_posted: StatsEntry;
  budget_spent: MoneyStatsEntry;
  projects_completed: StatsEntry;
  active_providers: StatsEntry;
};

export type DashboardStatsResponse =
  | { role: 'provider'; stats: ProviderDashboardStats }
  | { role: 'client'; stats: ClientDashboardStats };

export type ActivityType = 'project_created' | 'invoice_paid' | 'proposal_received' | 'project_paid';

export interface Activity {
  id: number;
  type: ActivityType;
  metadata: Record<string, string>;
  read_at: string | null;
  created_at: string;
  created_at_human: string;
}

export interface ActivityPageResponse {
  data: Activity[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

export interface ActivityFeedResponse {
  data: Activity[];
  meta: {
    current_page: number;
    last_page: number;
  };
}

export interface RecentActivityQuick {
  title: string;
  time_ago: string;
}

export interface AuditLog {
  id: number;
  actor_name: string;
  action: string;
  event: 'created' | 'updated' | 'deleted';
  subject_type: string;
  subject_id: number;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip: string;
  created_at: string;
}

export interface AuditLogFilters {
  user_id?: number;
  subject_type?: string;
  event?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
}

export interface AuditLogResponse {
  data: AuditLog[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
}

export class ApiClient {
  constructor(_baseURL: string) { }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await apiFetch<T | null>(endpoint, {
        ...options,
        method: options.method || 'GET',
        body: options.body as any,
        withCredentials: true,
      });
      return (response ?? ({} as T)) as T;
    } catch (error) {
      if (error instanceof FetchError) {
        const payload = error.data as Record<string, unknown> | null;
        const message =
          (payload && (payload.message as string)) ||
          (payload && (payload.error as string)) ||
          error.message;
        throw new Error(message);
      }
      throw error;
    }
  }

  // Auth endpoints
  async login(credentials: { email: string; password: string }) {
    const response = await this.request<{
      access_token: string;
      user: any;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    return response;
  }

  async me() {
    return this.request<any>(`/auth/me`, {
      method: 'GET',
    });
  }

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: string;
    company_name?: string;
    tax_id?: string;
    trade_registry_number?: string;
    billing_address?: string;
    billing_city?: string;
    billing_state?: string;
    billing_postal_code?: string;
  }) {
    const response = await this.request<{
      access_token: string;
      user: any;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    return response;
  }

  async getProfile() {
    return this.request<any>('/auth/profile');
  }

  async getTestExamsDetails() {
    return this.request<any>('/auth/test-exams-details');
  }

  async getTestResult(id: string) {
    return this.request<any>(`/test/result/${id}`);
  }

  async createEarlyAccessApplication(payload: {
    user_type: 'client' | 'provider';
    email: string;
    language?: string;
    contact_name?: string;
    company_name?: string;
    hiring_needs?: string;
    typical_project_budget?: number;
    hire_frequency?: string;
    lost_money?: boolean;
    escrow_help?: boolean;
    full_name?: string;
    country?: string;
    primary_skill?: string;
    years_experience?: number;
    has_clients?: boolean;
    unpaid_work?: boolean;
    wants_escrow?: boolean;
    profile_note?: string;
  }) {
    return this.request<{
      email_exists: boolean;
      application?: {
        id: number;
        user_type: 'client' | 'provider';
        full_name: string | null;
        contact_name: string | null;
        company_name: string | null;
        email: string;
        country: string | null;
        primary_skill: string | null;
        years_experience: number | null;
        has_clients: boolean | null;
        unpaid_work: boolean | null;
        wants_escrow: boolean | null;
        hiring_needs: string | null;
        typical_project_budget: number | null;
        hire_frequency: string | null;
        lost_money: boolean | null;
        escrow_help: boolean | null;
        score: number;
        created_at: string;
        updated_at: string;
      };
    }>('/early-access', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async verifyEarlyAccessApplication(payload: { code: string; language?: 'en' | 'ro' }) {
    return this.request<{
      verified: boolean;
      expired?: boolean;
      message?: string;
      application?: {
        id: number;
        user_type: 'client' | 'provider';
        email: string;
        email_verification: boolean;
        email_verification_expired: boolean;
      };
    }>('/early-access/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async resendEarlyAccessVerification(payload: {
    application_id: string;
    language?: 'en' | 'ro';
  }) {
    return this.request<{
      resent: boolean;
      verified?: boolean;
      message?: string;
      application?: {
        id: number;
        user_type: 'client' | 'provider';
        email: string;
        application_id: string;
        email_verification: boolean;
      };
    }>('/early-access/resend', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async subscribeToNewsletter(payload: {
    email: string;
    user_type: 'client' | 'provider';
    name?: string;
    company?: string;
    language?: 'ro' | 'en';
  }) {
    return this.request<{
      success: boolean,
      data: {
        id: number;
        email: string;
        name: string | null;
        user_type: 'client' | 'provider';
        company: string | null;
        subscribed_at: string;
        unsubscribed_at: string | null;
        created_at: string;
        updated_at: string;
      };
    }>('/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async unsubscribeFromNewsletter(token: string) {
    return this.request<{ unsubscribed: boolean }>('/newsletter/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async getNewsletterTemplates() {
    return this.request<{ templates: string[] }>('/newsletter/templates');
  }

  async getNewsletterTemplateContent(template: string) {
    return this.request<{ template: string; content: string }>(`/newsletter/templates/${template}`);
  }

  async sendNewsletter(payload: {
    template: string;
    subject: string;
    data?: Record<string, string>;
    user_type?: 'client' | 'provider';
    recipients?: string[];
    language?: 'ro' | 'en';
  }) {
    return this.request<{ sent: number }>('/newsletter/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getNewsletterSubscribers(params?: { per_page?: number; only_active?: boolean }) {
    const searchParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }
      if (typeof value === 'boolean') {
        searchParams.append(key, value ? 'true' : 'false');
      } else {
        searchParams.append(key, value.toString());
      }
    });

    const query = searchParams.toString();
    const endpoint = query ? `/newsletter?${query}` : '/newsletter';

    return this.request<{
      data: Array<{
        id: number;
        email: string;
        name: string | null;
        user_type: 'client' | 'provider';
        company: string | null;
        language: 'ro' | 'en';
        unsubscribe_token: string;
        subscribed_at: string;
        unsubscribed_at: string | null;
        created_at: string;
        updated_at: string;
      }>;
      pagination?: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
      };
    }>(endpoint);
  }

  // Early access endpoints
  async getEarlyAccessGrouped(params?: { page?: number; per_page?: number }) {
    const searchParams = new URLSearchParams();

    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const query = searchParams.toString();
    const endpoint = query ? `/early-access/grouped?${query}` : '/early-access/grouped';

    return this.request<{
      providers: any[];
      clients: any[];
      pagination?: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
      };
    }>(endpoint);
  }

  // Services endpoints
  async getServices(params?: {
    search?: string;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    skills?: string[];
    location?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
    language?: string;
  }) {
    const searchParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v.toString()));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    const query = searchParams.toString();
    const endpoint = query ? `/services?${query}` : '/services';

    return this.request<any>(endpoint);
  }

  async getPopularServices() {
    return this.request<any>(`/services/popular`);
  }

  // Servicii disponibile pentru prestatori să se înscrie
  async getAvailableServicesForProvider(categoryId?: string) {
    const params = categoryId ? `?categoryId=${categoryId}` : '';
    return this.request<any>(`/services/available-for-providers${params}`);
  }

  async getAllServices() {
    return this.request<any>('/admin/services');
  }

  async getService(id: string) {
    return this.request<any>(`/services/${id}`);
  }

  async getDeliveryProviders() {
    return this.request<any>('/general/delivery-providers');
  }

  async createService(serviceData: any) {
    return this.request<any>('/admin/services', {
      method: 'POST',
      body: JSON.stringify(serviceData),
    });
  }

  async updateService(id: string, serviceData: any) {
    return this.request<any>(`/admin/services/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(serviceData),
    });
  }

  async getServicesByCategoryId(categoryId: string) {
    return this.request<any>(`/services/category/${categoryId}`);
  }

  async getServicesGroupedByCategory(params?: { page?: number; limit?: number; search?: string }) {
    const searchParams = new URLSearchParams();
    if (params) {
      if (typeof params.page === 'number' && Number.isFinite(params.page) && params.page > 0) {
        searchParams.set('page', String(params.page));
      }
      if (typeof params.limit === 'number' && Number.isFinite(params.limit) && params.limit > 0) {
        searchParams.set('limit', String(params.limit));
      }
      if (typeof params.search === 'string' && params.search.trim().length > 0) {
        searchParams.set('search', params.search.trim());
      }
    }

    const query = searchParams.toString();
    const endpoint = query
      ? `/services/categories/grouped?${query}`
      : '/services/categories/grouped';

    return this.request<any>(endpoint);
  }

  async deleteService(id: string) {
    return this.request<any>(`/admin/services/${id}`, {
      method: 'DELETE',
    });
  }

  async updateServiceStatus(serviceId: string, status: string) {
    return this.request<any>(`/admin/services/${serviceId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Service Provider endpoints
  async addServiceProvider(serviceId: string, providerData: any) {
    return this.request<any>(`/services/${serviceId}/providers`, {
      method: 'POST',
      body: JSON.stringify(providerData),
    });
  }

  async updateServiceProvider(serviceId: string, providerId: string, providerData: any) {
    return this.request<any>(`/services/${serviceId}/providers/${providerId}`, {
      method: 'PATCH',
      body: JSON.stringify(providerData),
    });
  }

  async removeServiceProvider(serviceId: string, providerId: string) {
    return this.request<any>(`/services/${serviceId}/providers/${providerId}`, {
      method: 'DELETE',
    });
  }

  // Categories endpoints
  async getCategories() {
    return this.request<any>('/categories');
  }

  async getMainCategories() {
    return this.request<any>('/categories/main');
  }

  async getAllCategories() {
    return this.request<any>('/admin/categories');
  }

  async getCategoryById(categoryId: any) {
    return this.request<any>('/admin/categories/' + categoryId, {
      method: 'GET',
    });
  }

  async getCategorySlugById(categoryId: any) {
    return this.request<any>(`/admin/categories/${categoryId}/slug`, {
      method: 'GET',
    });
  }

  async createCategory(categoryData: any) {
    return this.request<any>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }

  async updateCategory(id: string, categoryData: any) {
    return this.request<any>(`/admin/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(categoryData),
    });
  }

  async deleteCategory(id: string) {
    return this.request<any>(`/admin/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Legal clauses endpoints
  async getAdminLegalClauses(params?: {
    search?: string;
    category?: string;
    identifier?: string;
    sort_by?: 'identifier' | 'category' | 'created_at' | 'updated_at';
    sort_dir?: 'asc' | 'desc';
    per_page?: number;
    page?: number;
    lang?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      if (params.search) searchParams.append('search', params.search);
      if (params.category) searchParams.append('category', params.category);
      if (params.identifier) searchParams.append('identifier', params.identifier);
      if (params.sort_by) searchParams.append('sort_by', params.sort_by);
      if (params.sort_dir) searchParams.append('sort_dir', params.sort_dir);
      if (params.per_page) searchParams.append('per_page', params.per_page.toString());
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.lang) searchParams.append('lang', params.lang);
    }
    const qs = searchParams.toString();
    return this.request<any>(`/admin/legal/clauses${qs ? `?${qs}` : ''}`);
  }

  async getAdminLegalClause(clauseId: string | number, language?: string) {
    return this.request<any>(`/admin/legal/clauses/${clauseId}?lang=${language ?? 'ro'}`);
  }

  async getAdminLegalClauseCategory() {
    return this.request<any>(`/admin/legal/clauses/category`);
  }

  async createAdminLegalClause(payload: {
    identifier: string;
    category: string;
    content: LegalClauseContent;
  }) {
    return this.request<any>('/admin/legal/clauses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateAdminLegalClause(
    clauseId: string | number,
    payload: {
      identifier?: string;
      category?: string;
      content?: LegalClauseContent;
    }
  ) {
    return this.request<any>(`/admin/legal/clauses/${clauseId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async deleteAdminLegalClause(clauseId: string | number) {
    return this.request<any>(`/admin/legal/clauses/${clauseId}`, {
      method: 'DELETE',
    });
  }

  // Users endpoints
  async getUsers(params?: any) {
    const searchParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v.toString()));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    return this.request<any>(`/admin/users?${searchParams.toString()}`);
  }

  async setSuperadmin(userId: number | string) {
    return this.request<any>(`/admin/access/users/${userId}/make-super`, {
      method: 'POST',
    })
  }

  async removeSuperadmin(userId: number | string) {
    return this.request<any>(`/admin/access/users/${userId}/remove-super`, {
      method: 'POST',
    })
  }

  async createRole(data: any) {
    return this.request<any>(`/admin/access/`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getPermissions() {
    return this.request<any>(`/admin/access/permissions`);
  }

  async allowUserPermission(userId: number, permissionSlug: string) {
    return this.request<any>(`/admin/access/${userId}/allow-permission`, {
      method: 'POST',
      body: JSON.stringify({ permission: permissionSlug }),
    });
  }

  async denyUserPermission(userId: number, permissionSlug: string) {
    return this.request<any>(`/admin/access/${userId}/deny-permission`, {
      method: 'POST',
      body: JSON.stringify({ permission: permissionSlug }),
    });
  }

  async removeUserPermission(userId: number, slug: string) {
    return this.request<any>(`/admin/access/${userId}/permissions`, {
      method: 'DELETE',
      body: JSON.stringify({ permission: slug }),
    });

  }

  async getRole(roleId: number) {
    return this.request<any>(`/admin/access/${roleId}`);
  }

  async updateRole(roleId: number, data: any) {
    return this.request<any>(`/admin/access/${roleId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updateRoleSortOrder(roleId: number, sortOrder: number) {
    return this.request<any>(`/admin/access/${roleId}/sort-order`, {
      method: 'PATCH',
      body: JSON.stringify({ sortOrder }),
    });
  }

  async createUser(userData: any) {
    return this.request<any>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getUserById(userId: number) {
    return this.request<any>(`/admin/users/${userId}`)
  }

  async updateUser(userId: number, userData: any) {
    return this.request<any>(`/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ userData }),

    });
  }

  async deleteUser(userId: string) {
    return this.request<any>(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async getProviders(params?: any) {
    const searchParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v.toString()));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    return this.request<any>(`/users/providers?${searchParams.toString()}`);
  }

  async updateUserStatus(userId: string, status: string) {
    return this.request<any>(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Orders endpoints
  async getOrders(params?: any) {
    const searchParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request<any>(`/admin/orders?${searchParams.toString()}`);
  }

  async createOrder(orderData: any) {
    return this.request<any>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async updateOrder(id: string, orderData: any) {
    return this.request<any>(`/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(orderData),
    });
  }

  // Reviews endpoints
  async getReviews(params?: any) {
    const searchParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request<any>(`/reviews?${searchParams.toString()}`);
  }

  async createReview(reviewData: any) {
    return this.request<any>('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  }

  // Admin endpoints
  async getAdminStats() {
    return this.request<any>('/admin/stats');
  }

  // Search endpoints
  async globalSearch(query: string, filters?: any) {
    const searchParams = new URLSearchParams();
    searchParams.append('q', query);

    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v.toString()));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    return this.request<any>(`/search?${searchParams.toString()}`);
  }

  async getSearchSuggestions(query: string) {
    return this.request<any>(`/search/suggestions?q=${encodeURIComponent(query)}`);
  }

  async getTrendingSearches() {
    return this.request<any>('/search/trending');
  }

  async getCalls(params?: {
    serviceId?: string;
    user_id?: string;
    passed: number;
    date_time: string;
    test_result_id: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request<any>(`/admin/calls?${searchParams.toString()}`);
  }

  // Tests endpoints
  async getTests(params?: {
    serviceId?: string;
    level?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request<any>(`/admin/tests?${searchParams.toString()}`);
  }

  async getAvailableTests() {
    return this.request<any>('/tests/available');
  }

  async getTest(id: string) {
    return this.request<any>(`/tests/${id}`);
  }

  async findByServiceAndLevel(serviceId: string, level: string) {
    return this.request<any>(`/tests/service/${serviceId}/level/${level}`);
  }

  async createTest(testData: any) {
    return this.request<any>('/admin/tests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
  }

  async updateTest(id: string, testData: any) {
    return this.request<any>(`/tests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(testData),
    });
  }

  async deleteTest(id: string) {
    return this.request<any>(`/tests/${id}`, {
      method: 'DELETE',
    });
  }

  async updateCallStatus(callId: string, status: string, noteText: string | null) {
    return this.request<any>(`/admin/calls/${callId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note: noteText }),
    });
  }

  async updateTestStatus(testId: string, status: string) {
    return this.request<any>(`/tests/${testId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async takeTest(testId: string, testData: any) {
    return this.request<any>(`/tests/${testId}/take`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
  }

  async getTestResults(params?: {
    userId?: string;
    testId?: string;
    passed?: boolean;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request<any>(`/tests/results/all?${searchParams.toString()}`);
  }

  async getMyTestResults(params?: {
    testId?: string;
    passed?: boolean;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request<any>(`/tests/results/my?${searchParams.toString()}`);
  }

  async getTestStatistics(testId: string) {
    return this.request<any>(`/admin/tests/${testId}/statistics`);
  }

  // API pentru certificări
  async getCertifications(userId?: string) {
    const endpoint = userId ? `/certifications/${userId}` : '/certifications';
    return this.request<any>(endpoint);
  }

  async createCertification(certificationData: any) {
    return this.request<any>('/certifications', {
      method: 'POST',
      body: JSON.stringify(certificationData),
    });
  }

  // Provider Profile endpoints
  async getProviderProfileById(providerId: string) {
    return this.request<any>(`/users/providers/${providerId}`);
  }

  async getProviderProfile() {
    return this.request<any>(`/users/providers/profile`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async updateProviderProfile(profileData: any) {
    return this.request<any>('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  }

  async updateUserCompanyDetails(userCompanyDetails: any) {
    return this.request<any>(`/users/update/company`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userCompanyDetails),
    })
  }

  async getCompanyManagers(companyId: string | number | undefined) {
    const searchParams = new URLSearchParams();
    if (companyId) {
      searchParams.append('company_id', companyId.toString());
    }
    return this.request<any>(`/users/company/editors?${searchParams.toString()}`);
  }

  async searchUserForCompany(search: string) {
    const searchParams = new URLSearchParams();
    if (search) {
      searchParams.append('search', search);
    }

    return this.request<any>(`/users/company/search/users?${searchParams.toString()}`);
  }

  async getCompanyMembers(companyId: string | number | undefined) {
    const searchParams = new URLSearchParams();
    if (companyId) {
      searchParams.append('company_id', companyId.toString());
    }

    return this.request<any>(`/users/company/members?${searchParams.toString()}`);
  }

  async updateCompanyEditorsOrOwnership(
    companyId: string | number | undefined,
    members: string[] | null | undefined,
    owner: string | null | undefined,
  ) {
    const payload: Record<string, unknown> = {
      company_id: companyId,
    };

    if (members !== null && members !== undefined) {
      payload.editor_emails = members;
    }

    if (owner) {
      payload.transfer_owner_email = owner;
    }

    return this.request<any>(`/users/company/access`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  }

  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('avatar', file);

    return this.request<any>('/users/avatar', {
      method: 'POST',
      body: formData,
      headers: {
      },
    });
  }

  async getProviderServices(providerId: string) {
    return this.request<any>(`/users/providers/${providerId}/services`);
  }

  async getProviderReviews(providerId: string, params?: {
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request<any>(`/reviews?revieweeId=${providerId}&${searchParams.toString()}`);
  }

  async getProviderPortfolio(providerId: string) {
    return this.request<any>(`/users/providers/${providerId}/portfolio`);
  }

  async getLanguages() {
    return this.request<any>('/languages');
  }

  async getProviderProfileByUrl(url: string) {
    return this.request<any>(`/provider/${url}`);
  }

  // Projects endpoints
  async getProjects(params?: {
    clientId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
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
  }

  async getProjectBySlug(slug: string) {
    const response = await this.request<any>(`/projects/slug/${slug}`);
    const project = extractProjectEntity(response);
    return project ? normalizeProjectEntity(project) : response;
  }

  async getPublicProjects(params?: {
    page?: number;
    search?: string;
    category?: string;
    technologies?: string[];
    budget_min?: number;
    budget_max?: number;
  }) {
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
  }

  async getProviderProjectRequests() {
    const response = await this.request<any>('/projects/requests', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const projects = extractProjectsCollection(response).map(normalizeProjectEntity);
    const payload = asObject(response);

    return {
      ...(payload ?? {}),
      projects,
    };
  }

  async respondToProjectRequest(projectId: string, response: ProjectRespondPayload, language?: string) {
    const params = new URLSearchParams();
    if (language) params.set('language', language);
    const qs = params.toString();
    const payload: Record<string, unknown> = {
      response: response.response,
      ...(response.proposedBudget !== undefined ? { proposedBudget: response.proposedBudget } : {}),
      ...(response.reason ? { reason: response.reason } : {}),
      ...(response.refusal_scope ? { refusal_scope: response.refusal_scope } : {}),
      ...(Array.isArray(response.milestone_ids) && response.milestone_ids.length > 0
        ? { milestone_ids: response.milestone_ids.map((id) => String(id)) }
        : {}),
      ...(typeof response.suggestions_limit === 'number' ? { suggestions_limit: response.suggestions_limit } : {}),
    };
    return this.request<any>(`/projects/${projectId}/respond${qs ? `?${qs}` : ''}`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async markProjectMilestone(projectId: number | string, payload: MarkProjectMilestonePayload) {
    const normalizedStatus = normalizeMilestoneStatusInput(payload?.status);
    const response = await this.request<any>(`/projects/${projectId}/markMilestone`, {
      method: 'POST',
      body: JSON.stringify({
        milestone: String(payload.milestone),
        ...(payload.language ? { language: payload.language } : {}),
        ...(normalizedStatus ? { status: normalizedStatus } : {}),
      }),
      headers: {
        'Content-Type': 'application/json',
      }
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
  }

  async markMilestoneAsComplete(
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
  }

  async getClientProjectRequests() {
    const response = await this.request<any>('/projects/my-requests', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const projects = extractProjectsCollection(response).map(normalizeProjectEntity);
    const payload = asObject(response);

    return {
      ...(payload ?? {}),
      projects,
    };
  }

  async githubInitiate() {
    return this.request<any>(`/auth/github/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }

  async connectGithub() {
    return this.request<any>('/auth/github/redirect', {
      method: 'GET',
      headers: {
      }
    })
  }

  async createGithubRepo(projectId: string | number, target: string) {
    return this.request<any>(`/projects/${projectId}/create-repo`, {
      method: 'POST',
      body: JSON.stringify({ target: target }),
      headers: {
        'Content-Type': 'application/json',
      }
    })
  }

  async respondToBudgetProposal(
    projectId: string,
    providerId: string,
    response: ProjectProviderBudgetResponsePayload,
    language?: string
  ) {
    const params = new URLSearchParams();
    if (language) params.set('language', language);
    const qs = params.toString();
    return this.request<any>(`/projects/${projectId}/providers/${providerId}/budget-response${qs ? `?${qs}` : ''}`, {
      method: 'POST',
      body: JSON.stringify(response),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getReplacementProviderSuggestions(projectId: string | number, query?: ReplacementSuggestionsQuery) {
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
  }

  async reassignProjectMilestones(projectId: string | number, payload: ReassignProjectMilestonesPayload) {
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
  }

  async generateProjectContract(projectId: string, clientId: string, providerId: string) {
    return this.request<any>(`/contract/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ project_id: projectId, client_id: clientId, provider_id: providerId }),
    });
  }

  async createProject(projectData: CreateProjectPayload, language?: string) {
    const params = new URLSearchParams();
    if (language) params.set('language', language);
    const qs = params.toString();
    const response = await this.request<any>(`/projects${qs ? `?${qs}` : ''}`, {
      method: 'POST',
      body: JSON.stringify(projectData),
      headers: {
        'Content-Type': 'application/json',
      }
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
  }

  async getProject(id: string) {
    const response = await this.request<any>(`/projects/${id}`);
    const project = extractProjectEntity(response);
    return project ? normalizeProjectEntity(project) : response;
  }

  async updateProject(id: string, projectData: any) {
    return this.request<any>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(projectData),
    });
  }

  async deleteProject(id: string) {
    return this.request<any>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  async getClientProjects(clientId: string, limit?: number) {
    const endpoint = limit !== undefined && limit !== null
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
  }

  async getSuggestedProviders(
    services: { service: string; level: string }[]
  ) {

    return this.request<any>(`/providers/suggestions`, {
      method: 'POST',
      body: JSON.stringify({ services }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getTechnologies() {
    return this.request<any>('/technologies');
  }

  async getTechnologiesByCategory(categoryId: string) {
    return this.request<any>(`/services/category/${categoryId}`);
  }

  async generateProjectInformation(projectData: any) {
    return this.request<GenerateProjectInformationResponse>('/projects/generate-information-by-ai', {
      method: 'POST',
      body: JSON.stringify(projectData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async updateLastActive() {
    return this.request<any>('/users/active', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }



  // Notifications endpoints
  async getNotifications(params?: {
    unreadOnly?: boolean;
    unread?: boolean;
    type?: string;
    page?: number;
    limit?: number;
    cursor?: string; // <-- NOU, pt. cursor-based pagination
    language?: string;
  }) {
    const sp = new URLSearchParams();
    const normalizedParams: Record<string, unknown> = { ...(params || {}) };
    if (normalizedParams.unread === undefined && normalizedParams.unreadOnly !== undefined) {
      normalizedParams.unread = normalizedParams.unreadOnly;
      delete normalizedParams.unreadOnly;
    }
    Object.entries(normalizedParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        sp.append(key, String(value));
      }
    });
    return this.request<any>(`/notifications?${sp.toString()}`);
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request<any>(`/notifications/${notificationId}/read`, {
      method: 'PATCH'
    });
  }

  async subscribeToNotifications(subscription: PushSubscription, navigator: Navigator) {
    return this.request<any>('/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        userAgent: navigator.userAgent
      })
    });
  }

  async unsubscribeFromNotifications() {
    return this.request<any>('/notifications/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }

  async markAllNotificationsAsRead() {
    return this.request<any>('/notifications/read-all');
  }

  async deleteNotification(notificationId: string) {
    return this.request<any>(`/notifications/${notificationId}`, {
      method: 'DELETE'
    });
  }

  async sendNotification(data: {
    userIds: string[];
    title: string;
    message: string;
    type: string;
    data?: any;
    webPushOnly?: boolean;
  }) {
    return this.request<any>('/notifications/send', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async rapydOnboarding(language?: string) {
    const params = new URLSearchParams();
    if (language) params.set('language', language);
    const qs = params.toString();
    return this.request<any>(`/rapyd/onboard${qs ? `?${qs}` : ''}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  async rapydCheckoutSession(
    projectId: string | number,
    currency: string,
    countryCode: string,
    milestoneId?: string | number,
    language?: string
  ) {
    const params = new URLSearchParams();
    if (language) params.set('language', language);
    const qs = params.toString();
    const milestoneSegment =
      milestoneId !== undefined && milestoneId !== null ? `/${milestoneId}` : '';
    return this.request<any>(`/rapyd/checkout/${projectId}${milestoneSegment}${qs ? `?${qs}` : ''}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ currency: currency, country: countryCode })
    })
  }

  async rapydReleasePayment(
    projectId: string | number,
    milestoneId?: string | number,
    language?: string
  ) {
    const params = new URLSearchParams();
    if (language) params.set('language', language);
    const qs = params.toString();
    const requestBody = {
      project_id: projectId,
      ...(milestoneId !== undefined && milestoneId !== null ? { milestone_id: String(milestoneId) } : {}),
    };

    try {
      return await this.request<any>(`/rapyd/release${qs ? `?${qs}` : ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
    } catch {
      return this.request<any>(`/rapyd/escrow/release${qs ? `?${qs}` : ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
    }
  }

  async rapydGetWalletBalance(language?: string) {
    const qs = language ? `?language=${encodeURIComponent(language)}` : '';
    return this.request<any>(`/rapyd/balance${qs}`);
  }

  async rapydCreatePayoutBank(amount: number | string, currency?: string | null, language?: string) {
    const params = new URLSearchParams();
    if (language) params.set('language', language);
    const qs = params.toString();
    return this.request<any>(`/rapyd/payout/bank${qs ? `?${qs}` : ''}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        ...(currency ? { currency } : {}),
      })
    });
  }

  async getCurrencies(search: string | null) {
    const searchParams = new URLSearchParams();

    if (search) {
      searchParams.set('search', search);
    }
    return this.request<any>(`/users/currencies?${searchParams.toString()}`);
  }

  async updateUserLanguage(language: string) {
    return this.request<any>(`/users/language`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lang: language }),
    });
  }



  async updateOneSignalToken(token: string) {
    return this.request<any>(`/user/update-push-token`, {
      method: 'POST',
      body: JSON.stringify({ push_token: token }),
      headers: {
        'Content-Type': 'application/json',
      }
    })
  }

  // Chat endpoints
  async getChatGroups() {
    return this.request<any>('/chat/groups');
  }

  async createChatGroup(groupData: {
    name: string;
    type: 'PROJECT' | 'PROVIDER_ONLY' | 'DIRECT';
    projectId?: string;
    participantIds: string[];
  }, language?: string) {
    const params = new URLSearchParams();
    if (language) params.set('language', language);
    const qs = params.toString();
    return this.request<any>(`/chat/groups${qs ? `?${qs}` : ''}`, {
      method: 'POST',
      body: JSON.stringify(groupData),
    });
  }

  async getChatMessages(groupId: string, page = 1, limit = 50) {
    return this.request<any>(`/chat/groups/${groupId}/messages?page=${page}&limit=${limit}`);
  }

  async sendChatMessage(groupId: string, content: string, attachments?: any[], language?: string) {
    const params = new URLSearchParams();
    if (language) params.set('language', language);
    const qs = params.toString();
    return this.request<any>(`/chat/groups/${groupId}/messages${qs ? `?${qs}` : ''}`, {
      method: 'POST',
      body: JSON.stringify({ content, attachments }),
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }

  async editChatMessage(messageId: string, content: string) {
    return this.request<any>(`/chat/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
  }

  async deleteChatMessage(messageId: string) {
    return this.request<any>(`/chat/messages/${messageId}`, {
      method: 'DELETE',
    });
  }

  async markChatMessagesAsRead(groupId: string, messageId?: string) {
    return this.request<any>(`/chat/groups/${groupId}/read`, {
      method: 'POST',
      body: JSON.stringify({ messageId }),
    });
  }

  async joinChatGroup(groupId: string) {
    return this.request<any>(`/chat/groups/${groupId}/join`, {
      method: 'POST',
    });
  }

  async leaveChatGroup(groupId: string) {
    return this.request<any>(`/chat/groups/${groupId}/leave`, {
      method: 'POST',
    });
  }

  async getProviderUserNameByProfileUrl(profileUrl: string) {
    return this.request<any>(`/users/providers/${profileUrl}/name`);
  }

  async getProjectNameByProjectUrl(projectUrl: string) {
    return this.request<any>(`/project/${projectUrl}/name`);
  }

  async getRoles(params: {
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const sp = new URLSearchParams();
    if (params.search) sp.set('search', params.search);
    if (params.page) sp.set('page', String(params.page));
    if (params.pageSize) sp.set('page_size', String(params.pageSize)); // DRF-style
    const qs = sp.toString();
    return this.request<any>(`/admin/access/${qs ? `?${qs}` : ''}`, {
      method: 'GET',
    });
  }

  async getRolesLite() {
    const data = await this.request<any>('/admin/access?page_size=1000', { method: 'GET' });
    const results = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
    return results.map((r: any) => ({ id: r.id, name: r.name, slug: r.slug })) as RoleLite[];
  }

  async getRolePermissionSlugs(slug: string) {
    return this.request<any>(`/admin/access/slug/${slug}/permissions`)
  }

  async updateRolePermissionsBySlug(roleId: number, permissionSlugs: string[]) {
    return this.request<{ ok: boolean }>(`/admin/access/${roleId}/sync-permission`, {
      method: 'PUT',
      body: JSON.stringify({ permission_slugs: permissionSlugs }),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  }

  async updateRolePermissions(roleId: number, data: any) {
    return this.request<any>(`/admin/access/${roleId}/permissions`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteRole(roleId: number) {
    return this.request<any>(`/roles/${roleId}`, {
      method: 'DELETE',
    });
  }


  // Dashboard endpoints
  async getDashboardStats() {
    return this.request<DashboardStatsResponse>('/dashboard/stats');
  }

  async getRecentActivities(page: number = 1) {
    return this.request<ActivityFeedResponse>(`/activities?page=${page}`);
  }

  async getActivities(page: number = 1) {
    return this.request<ActivityPageResponse>(`/activities?page=${page}`);
  }

  async getRecentActivitiesQuick() {
    return this.request<RecentActivityQuick[]>('/activities/recent');
  }

  // Audit Logs
  async fetchAuditLogs(filters: AuditLogFilters) {
    const searchParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    const query = searchParams.toString();
    const endpoint = query ? `/admin/audit-logs?${query}` : '/admin/audit-logs';

    return this.request<AuditLogResponse>(endpoint);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
