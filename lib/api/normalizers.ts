import { normalizeMilestoneChangeRequest } from '@/lib/milestone-change-requests';

import type {
  AdminServiceCategory,
  AdminServiceCategoryContractType,
  AdminServiceCategoryListResponse,
  MilestoneStatusInput,
  ProviderServiceCategory,
  ProviderServiceDetails,
  ProviderServiceRecord,
} from './types';

type BudgetPayload = {
  amount: number | null;
  currency: string;
  original_usd?: number | null;
};

export const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export const toBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value === 1;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === '1' || normalized === 'true' || normalized === 'yes';
  }
  return false;
};

export const normalizeMilestoneStatusInput = (
  value: MilestoneStatusInput | unknown
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

export const asObject = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
};

export const asArray = <T = unknown>(value: unknown): T[] => {
  return Array.isArray(value) ? (value as T[]) : [];
};

const normalizeProviderServiceCategory = (value: unknown): ProviderServiceCategory | null => {
  const category = asObject(value);
  if (!category) {
    return null;
  }

  return {
    id: toFiniteNumber(category.id),
    name: typeof category.name === 'string' ? category.name : '',
    slug: typeof category.slug === 'string' ? category.slug : '',
    description: typeof category.description === 'string' ? category.description : '',
    icon: typeof category.icon === 'string' && category.icon.trim() ? category.icon : null,
    image: typeof category.image === 'string' && category.image.trim() ? category.image : null,
    sortOrder: toFiniteNumber(category.sortOrder ?? category.sort_order),
    isActive: toBoolean(category.isActive ?? category.is_active),
    parent_id: toFiniteNumber(category.parent_id),
    created_at: typeof category.created_at === 'string' ? category.created_at : null,
    updated_at: typeof category.updated_at === 'string' ? category.updated_at : null,
    deleted_at: typeof category.deleted_at === 'string' ? category.deleted_at : null,
  };
};

const normalizeAdminServiceCategory = (value: unknown): AdminServiceCategory | null => {
  const category = asObject(value);
  if (!category) {
    return null;
  }

  const serviceCode =
    typeof category.service_code === 'string'
      ? category.service_code
      : typeof category.code === 'string'
        ? category.code
        : '';
  const serviceName =
    typeof category.service_name === 'string'
      ? category.service_name
      : typeof category.name === 'string'
        ? category.name
        : '';
  const serviceGroup =
    typeof category.service_group === 'string'
      ? category.service_group
      : typeof category.group === 'string'
        ? category.group
        : '';
  const contractTypeValue =
    typeof category.default_contract_type === 'string'
      ? category.default_contract_type.trim().toUpperCase()
      : '';
  const defaultContractType: AdminServiceCategoryContractType =
    contractTypeValue === 'WORK_FOR_RESULT' || contractTypeValue === 'MIXED'
      ? contractTypeValue
      : 'SERVICES';
  const ipTransferExpected = toBoolean(
    category.ip_transfer_expected ?? category.requires_ip_assignment
  );

  return {
    id: toFiniteNumber(category.id),
    service_code: serviceCode,
    service_name: serviceName,
    service_group: serviceGroup,
    description: typeof category.description === 'string' ? category.description : '',
    default_contract_type: defaultContractType,
    milestone_recommended: toBoolean(category.milestone_recommended),
    acceptance_testing_required: toBoolean(category.acceptance_testing_required),
    delivery_spec_required: toBoolean(category.delivery_spec_required),
    ip_transfer_expected: ipTransferExpected,
    background_ip_expected: toBoolean(category.background_ip_expected),
    open_source_risk: toBoolean(category.open_source_risk),
    third_party_material_risk: toBoolean(category.third_party_material_risk),
    moral_rights_sensitive: toBoolean(category.moral_rights_sensitive),
    nda_recommended: toBoolean(category.nda_recommended),
    dpa_required_by_default: toBoolean(category.dpa_required_by_default),
    personal_data_processing_likely: toBoolean(category.personal_data_processing_likely),
    security_clause_required: toBoolean(category.security_clause_required),
    warranty_period_days: toFiniteNumber(category.warranty_period_days),
    bug_fix_period_days: toFiniteNumber(category.bug_fix_period_days),
    service_levels_required: toBoolean(category.service_levels_required),
    professional_standards_clause_required: toBoolean(
      category.professional_standards_clause_required
    ),
    regulated_activity_risk: toBoolean(category.regulated_activity_risk),
    export_control_risk: toBoolean(category.export_control_risk),
    default_acceptance_rule:
      typeof category.default_acceptance_rule === 'string'
        ? category.default_acceptance_rule
        : '',
    default_delivery_definition:
      typeof category.default_delivery_definition === 'string'
        ? category.default_delivery_definition
        : '',
    internal_legal_note:
      typeof category.internal_legal_note === 'string' ? category.internal_legal_note : '',
    is_active: toBoolean(category.is_active ?? true),
    sort_order: toFiniteNumber(category.sort_order) ?? 0,
    version: toFiniteNumber(category.version),
    created_at: typeof category.created_at === 'string' ? category.created_at : null,
    updated_at: typeof category.updated_at === 'string' ? category.updated_at : null,
    code: serviceCode,
    name: serviceName,
    group: serviceGroup,
    requires_ip_assignment: ipTransferExpected,
  };
};

export const extractAdminServiceCategory = (
  value: unknown
): AdminServiceCategory | null => {
  const response = asObject(value);
  const candidates = [
    response?.data,
    response?.service_category,
    response?.category,
    value,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeAdminServiceCategory(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return null;
};

export const normalizeAdminServiceCategoryListResponse = (
  value: unknown
): AdminServiceCategoryListResponse => {
  const response = asObject(value);
  const responseData = response?.data;
  const responseServiceCategories = response?.service_categories;
  const responseItems = response?.items;
  const sourceItems = Array.isArray(responseData)
    ? responseData
    : Array.isArray(responseServiceCategories)
      ? responseServiceCategories
      : Array.isArray(responseItems)
        ? responseItems
        : asArray(value);
  const data = sourceItems
    .map(normalizeAdminServiceCategory)
    .filter((item): item is AdminServiceCategory => item !== null);

  return {
    current_page: toFiniteNumber(response?.current_page) ?? 1,
    data,
    last_page: toFiniteNumber(response?.last_page) ?? 1,
    per_page: toFiniteNumber(response?.per_page) ?? data.length,
    total: toFiniteNumber(response?.total) ?? data.length,
  };
};

const normalizeProviderServiceDetails = (value: unknown): ProviderServiceDetails | null => {
  const service = asObject(value);
  if (!service) {
    return null;
  }

  const rawTags = Array.isArray(service.tags)
    ? service.tags
    : typeof service.tags === 'string'
      ? service.tags.split(',')
      : [];

  return {
    id: toFiniteNumber(service.id),
    name: typeof service.name === 'string' ? service.name : '',
    slug: typeof service.slug === 'string' ? service.slug : '',
    description: typeof service.description === 'string' ? service.description : '',
    programming_language:
      typeof service.programming_language === 'string' ? service.programming_language : '',
    tags: rawTags
      .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
      .filter(Boolean),
    isActive: toBoolean(service.isActive ?? service.is_active),
    category_id: toFiniteNumber(service.category_id),
    status: typeof service.status === 'string' ? service.status : '',
    isFeatured: toBoolean(service.isFeatured ?? service.is_featured),
    orderCount: toFiniteNumber(service.orderCount ?? service.order_count) ?? 0,
    rating: toFiniteNumber(service.rating),
    reviewCount: toFiniteNumber(service.reviewCount ?? service.review_count) ?? 0,
    viewCount: toFiniteNumber(service.viewCount ?? service.view_count) ?? 0,
    favoriteCount: toFiniteNumber(service.favoriteCount ?? service.favorite_count) ?? 0,
    price: toFiniteNumber(service.price),
    delivery_provider:
      typeof service.delivery_provider === 'string' ? service.delivery_provider : '',
    vector_synced_at:
      typeof service.vector_synced_at === 'string' ? service.vector_synced_at : null,
    created_at: typeof service.created_at === 'string' ? service.created_at : null,
    updated_at: typeof service.updated_at === 'string' ? service.updated_at : null,
    deleted_at: typeof service.deleted_at === 'string' ? service.deleted_at : null,
    category: normalizeProviderServiceCategory(service.category),
  };
};

export const normalizeProviderService = (value: unknown): ProviderServiceRecord => {
  const record = asObject(value) ?? {};

  return {
    id: toFiniteNumber(record.id),
    user_id: toFiniteNumber(record.user_id),
    service_id: toFiniteNumber(record.service_id),
    created_at: typeof record.created_at === 'string' ? record.created_at : null,
    updated_at: typeof record.updated_at === 'string' ? record.updated_at : null,
    level: typeof record.level === 'string' ? record.level : '',
    verified: toBoolean(record.verified),
    rating: toFiniteNumber(record.rating),
    reviewCount: toFiniteNumber(record.reviewCount ?? record.review_count) ?? 0,
    provider_project_count:
      toFiniteNumber(record.provider_project_count ?? record.providerProjectCount) ?? 0,
    service: normalizeProviderServiceDetails(record.service),
  };
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
  const proposedAmount = toFiniteNumber(
    milestone.proposed_amount ?? milestone.proposedAmount
  );
  const percentage = toFiniteNumber(milestone.percentage) ?? 0;
  const budgetStatusRaw =
    typeof milestone.budget_status === 'string'
      ? milestone.budget_status
      : typeof milestone.budgetStatus === 'string'
        ? milestone.budgetStatus
        : '';
  const budgetStatus = budgetStatusRaw.trim().toUpperCase() || 'PENDING';

  return {
    ...milestone,
    amount,
    proposed_amount: proposedAmount,
    percentage,
    budget_status: budgetStatus,
    milestone_change_requests: asArray(milestone.milestone_change_requests).map(
      normalizeMilestoneChangeRequest
    ),
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
  const lineBudgetStatusRaw =
    typeof line.budget_status === 'string'
      ? line.budget_status
      : typeof line.budgetStatus === 'string'
        ? line.budgetStatus
        : '';
  const lineMilestoneBudgetStatuses = milestones
    .map((milestone) =>
      String((milestone as Record<string, unknown>)?.budget_status ?? '')
        .trim()
        .toUpperCase()
    )
    .filter(Boolean);
  const derivedLineBudgetStatus = (() => {
    if (lineMilestoneBudgetStatuses.includes('PROPOSED')) return 'PROPOSED';
    if (lineMilestoneBudgetStatuses.includes('REJECTED')) return 'REJECTED';
    if (
      lineMilestoneBudgetStatuses.length > 0 &&
      lineMilestoneBudgetStatuses.every((status) => status === 'ACCEPTED')
    ) {
      return 'ACCEPTED';
    }
    return 'PENDING';
  })();

  return {
    ...line,
    price: price ?? 0,
    budget_allocation: budgetAllocationAmount,
    budget_percentage: budgetPercentage,
    budget_status: lineBudgetStatusRaw.trim().toUpperCase() || derivedLineBudgetStatus,
    milestone_change_requests: asArray(line.milestone_change_requests).map(
      normalizeMilestoneChangeRequest
    ),
    milestones,
    deliverables,
  };
};

export const extractProjectsCollection = (value: unknown): unknown[] => {
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

export const extractProjectEntity = (
  value: unknown
): Record<string, unknown> | null => {
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

export const normalizeProjectEntity = (value: unknown) => {
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
    milestone_change_requests: asArray(project.milestone_change_requests).map(
      normalizeMilestoneChangeRequest
    ),
    providers: asArray(project.providers),
    selected_providers: asArray(project.selected_providers),
    existing_services: asArray(project.existing_services),
    custom_services: asArray(project.custom_services),
    milestones: asArray(project.milestones),
  };
};

export const normalizePublicProjectEntity = (value: unknown) => {
  const normalized = asObject(normalizeProjectEntity(value)) ?? {};
  const normalizedBudget = normalizeBudgetPayload(normalized.budget);
  const technologies = asArray(normalized.technologies)
    .map((item) => String(item ?? '').trim())
    .filter(Boolean);
  const deadline =
    (typeof normalized.deadline === 'string' && normalized.deadline) ||
    (typeof normalized.project_duration === 'string' && normalized.project_duration) ||
    '1month';
  const budgetType =
    String(normalized.budget_type ?? 'fixed').toLowerCase() === 'hourly'
      ? 'hourly'
      : 'fixed';

  const clientRaw = asObject(normalized.client) as any;
  const client = clientRaw
    ? {
        name: String(clientRaw.name || ''),
        location: String(clientRaw.location || ''),
        rating: toFiniteNumber(clientRaw.rating) ?? 0,
        total_reviews: toFiniteNumber(clientRaw.total_reviews) ?? 0,
        ...(typeof clientRaw.avatar_url === 'string'
          ? { avatar_url: clientRaw.avatar_url }
          : {}),
      }
    : undefined;

  const milestones = Array.isArray(normalized.milestones)
    ? (normalized.milestones as any[])
    : undefined;

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
    budget_min:
      toFiniteNumber(normalized.budget_min) ?? normalizedBudget.amount ?? undefined,
    budget_max:
      toFiniteNumber(normalized.budget_max) ?? normalizedBudget.amount ?? undefined,
    budget_type: budgetType,
    deadline,
    offers_count: toFiniteNumber(normalized.offers_count) ?? 0,
    is_recommended: Boolean(normalized.is_recommended),
    created_at:
      typeof normalized.created_at === 'string'
        ? normalized.created_at
        : new Date().toISOString(),
    ...(typeof normalized.payment_plan === 'string'
      ? { payment_plan: normalized.payment_plan }
      : {}),
    ...(typeof normalized.milestone_count === 'number'
      ? { milestone_count: normalized.milestone_count }
      : {}),
    ...(milestones ? { milestones } : {}),
    ...(client ? { client } : {}),
  } as any;
};
