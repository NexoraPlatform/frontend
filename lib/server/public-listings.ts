import type { ProjectWithClient } from '@/lib/projects';
import type { Locale } from '@/types/locale';
import type { UserBadgeRecord } from '@/lib/badges';

export type LocalizedText = string | Record<string, string>;

export interface ServiceCategory {
  id: number;
  name: LocalizedText;
}

export interface ServiceProvider {
  id: number;
  firstName: string;
  lastName: string;
  avatar: string;
  rating: string;
  featuredBadges?: UserBadgeRecord[];
  featured_badges?: unknown[];
}

export interface Service {
  id: number;
  name: LocalizedText;
  description: LocalizedText;
  tags?: string[];
  skills?: LocalizedText[];
  isFeatured: boolean;
  category: ServiceCategory;
  providers?: ServiceProvider[];
  providers_count?: number;
}

export interface ServicesResponse {
  services: Service[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type CategoryOption = {
  id: string | number;
  name: LocalizedText;
};

type GroupedServiceItem = {
  id?: number | string;
  name?: LocalizedText;
  category_id?: number | string;
  categoryId?: number | string;
  category?: ServiceCategory | string;
};

type BudgetPayload = {
  amount: number | null;
  currency: string;
  original_usd?: number | null;
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

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

export function getLocalizedText(
  value: LocalizedText | null | undefined,
  locale: Locale
) {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  return value[locale] ?? value.ro ?? value.en ?? Object.values(value)[0] ?? '';
}


function normalizeServiceEntity(value: unknown, fallbackIndex = 0): Service {
  const service = asObject(value) ?? {};
  const categoryValue = asObject(service.category);
  const categoryId =
    toFiniteNumber(service.category_id ?? service.categoryId ?? categoryValue?.id) ?? 0;
  const categoryName =
    (categoryValue?.name as LocalizedText | undefined) ??
    (typeof service.category === 'string' ? service.category : '');
  const providersCount = toFiniteNumber(service.providers_count ?? service.providersCount);
  const numericId = toFiniteNumber(service.id) ?? fallbackIndex;

  return {
    id: numericId,
    name: (service.name as LocalizedText | undefined) ?? '',
    description: (service.description as LocalizedText | undefined) ?? '',
    tags: asArray<string>(service.tags),
    skills: asArray<LocalizedText>(service.skills),
    isFeatured: Boolean(service.isFeatured ?? service.is_featured),
    category: {
      id: categoryId,
      name: categoryName,
    },
    providers: asArray<ServiceProvider>(service.providers),
    ...(providersCount !== null ? { providers_count: providersCount } : {}),
  };
}

function normalizeServicesByCategoryResponse(
  response: Record<string, unknown>
): Service[] {
  return Object.entries(response).flatMap(([category, services]) =>
    asArray<GroupedServiceItem>(services).map((service, index) => {
      const categoryValue = service.category;
      const categoryName =
        typeof categoryValue === 'string'
          ? categoryValue
          : categoryValue?.name ?? category;
      const categoryIdRaw = service.category_id ?? service.categoryId ?? category;
      const categoryId =
        typeof categoryIdRaw === 'number'
          ? categoryIdRaw
          : Number.isFinite(Number(categoryIdRaw))
            ? Number(categoryIdRaw)
            : 0;
      const fallbackCategory: ServiceCategory = {
        id: categoryId,
        name: categoryName ?? category,
      };

      const numericId =
        typeof service.id === 'number'
          ? service.id
          : Number.isFinite(Number(service.id))
            ? Number(service.id)
            : index;

      return normalizeServiceEntity({
        id: numericId,
        name: service.name ?? categoryName ?? category,
        description: '',
        isFeatured: false,
        providers: [],
        category:
          typeof categoryValue === 'string' || !categoryValue
            ? fallbackCategory
            : categoryValue,
        tags: [],
        skills: [],
      });
    })
  );
}

function isServicesResponse(
  response: ServicesResponse | Service[] | Record<string, unknown> | null | undefined
): response is ServicesResponse {
  if (!response || typeof response !== 'object') {
    return false;
  }

  if (!('services' in response)) {
    return false;
  }

  const services = (response as ServicesResponse).services;
  return (
    Array.isArray(services) &&
    services.every((service) => service && typeof service === 'object' && 'description' in service)
  );
}

export function getServicesFromResponse(
  response:
    | ServicesResponse
    | Service[]
    | Record<string, unknown>
    | null
    | undefined
): Service[] {
  if (!response) {
    return [];
  }

  if (Array.isArray(response)) {
    return response.map((service, index) => normalizeServiceEntity(service, index));
  }

  if (isServicesResponse(response)) {
    return asArray(response.services).map((service, index) => normalizeServiceEntity(service, index));
  }

  return normalizeServicesByCategoryResponse(response);
}


export function getServiceProviderCount(service: Service): number {
  const providersCount = toFiniteNumber(service.providers_count);

  if (providersCount !== null) {
    return providersCount;
  }

  return asArray(service.providers).length;
}

export function getServicesHasMore(
  response:
    | ServicesResponse
    | Service[]
    | Record<string, unknown>
    | null
    | undefined,
  pageSize: number
) {
  if (isServicesResponse(response)) {
    return response.page < response.totalPages;
  }

  return getServicesFromResponse(response).length >= pageSize;
}

export function dedupeServices(items: Service[]): Service[] {
  const seen = new Set<number>();

  return items.filter((service) => {
    if (seen.has(service.id)) {
      return false;
    }

    seen.add(service.id);
    return true;
  });
}

export function mergeUniqueServices(existing: Service[], incoming: Service[]): Service[] {
  if (existing.length === 0) {
    return dedupeServices(incoming);
  }

  const seen = new Set(existing.map((service) => service.id));
  const uniqueIncoming = incoming.filter((service) => {
    if (seen.has(service.id)) {
      return false;
    }

    seen.add(service.id);
    return true;
  });

  return [...existing, ...uniqueIncoming];
}

function normalizeBudgetPayload(value: unknown): BudgetPayload {
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
}

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

const normalizePublicProjectEntity = (value: unknown): ProjectWithClient => {
  const project = asObject(value) ?? {};
  const budget = normalizeBudgetPayload(project.budget);
  const technologies = asArray(project.technologies)
    .map((item) => String(item ?? '').trim())
    .filter(Boolean);
  const deadline =
    (typeof project.deadline === 'string' && project.deadline) ||
    (typeof project.project_duration === 'string' && project.project_duration) ||
    '1month';
  const budgetType =
    String(project.budget_type ?? 'fixed').toLowerCase() === 'hourly'
      ? 'hourly'
      : 'fixed';
  const clientRaw = asObject(project.client);
  const client = clientRaw
    ? {
        name: String(clientRaw.name || ''),
        location: String(clientRaw.location || ''),
        rating: toFiniteNumber(clientRaw.rating) ?? 0,
        total_reviews: toFiniteNumber(clientRaw.total_reviews) ?? 0,
        ...(typeof clientRaw.avatar_url === 'string' ? { avatar_url: clientRaw.avatar_url } : {}),
      }
    : undefined;

  return {
    id: String(project.id ?? ''),
    title:
      (typeof project.title === 'string' && project.title.trim()) ||
      'Untitled project',
    description:
      (typeof project.description === 'string' && project.description) || '',
    category:
      (typeof project.category === 'string' && project.category) || 'General',
    technologies,
    budget: {
      ...budget,
      amount: budget.amount ?? 0,
      original_usd: budget.original_usd ?? 0,
    },
    budget_min: toFiniteNumber(project.budget_min) ?? budget.amount ?? undefined,
    budget_max: toFiniteNumber(project.budget_max) ?? budget.amount ?? undefined,
    budget_type: budgetType,
    deadline,
    offers_count: toFiniteNumber(project.offers_count) ?? 0,
    is_recommended: Boolean(project.is_recommended),
    created_at:
      typeof project.created_at === 'string'
        ? project.created_at
        : new Date().toISOString(),
    ...(typeof project.payment_plan === 'string' ? { payment_plan: project.payment_plan } : {}),
    ...(typeof project.milestone_count === 'number'
      ? { milestone_count: project.milestone_count }
      : {}),
    ...(Array.isArray(project.milestones) ? { milestones: project.milestones as any } : {}),
    ...(client ? { client } : {}),
  };
};

export function normalizePublicProjectsResponse(value: unknown): ProjectWithClient[] {
  const projects = extractProjectsCollection(value);

  if (projects.length > 0) {
    return projects.map(normalizePublicProjectEntity);
  }

  if (Array.isArray(value)) {
    return value.map(normalizePublicProjectEntity);
  }

  return [];
}

function extractLabel(
  item: unknown,
  locale: Locale
): string {
  if (typeof item === 'string') {
    return item.trim();
  }

  if (typeof item === 'number' || typeof item === 'boolean') {
    return String(item);
  }

  const record = asObject(item);
  if (!record) {
    return '';
  }

  const directValue =
    record.name ?? record.title ?? record.label ?? record.value ?? record.slug ?? null;

  if (typeof directValue === 'string') {
    return directValue.trim();
  }

  if (directValue && typeof directValue === 'object') {
    return getLocalizedText(directValue as LocalizedText, locale).trim();
  }

  return '';
}

export function normalizeStringOptions(
  value: unknown,
  locale: Locale
): string[] {
  const items = asArray(value)
    .map((item) => extractLabel(item, locale))
    .filter(Boolean);

  return Array.from(new Set(items));
}
