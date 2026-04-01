import type { Locale } from '@/types/locale';
import type { ProjectWithClient } from '@/lib/projects';
import {
  normalizeUserBadgeCollection,
  type UserBadgeRecord,
} from '@/lib/badges';

export const AI_SEARCH_NAMESPACES = [
  'services',
  'projects',
  'providers',
  'provider_profiles',
] as const;

export type AiSearchNamespace = (typeof AI_SEARCH_NAMESPACES)[number];

export const CORE_AI_SEARCH_NAMESPACES = [
  'services',
  'projects',
  'providers',
] as const;

export type CoreAiSearchNamespace = (typeof CORE_AI_SEARCH_NAMESPACES)[number];

export type LocalizedText = string | Record<string, string>;

export interface ServiceProviderResource {
  id: number | string;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  rating?: number | string | null;
}

export interface ServiceCategoryResource {
  id?: number | string;
  name?: LocalizedText;
}

export interface ServiceResource {
  id: number | string;
  name: LocalizedText;
  description?: LocalizedText | null;
  tags?: string[];
  skills?: LocalizedText[];
  category?: ServiceCategoryResource | string | null;
  providers?: ServiceProviderResource[];
  isFeatured?: boolean;
  score?: number;
  [key: string]: unknown;
}

export interface ProjectBudgetResource {
  amount: number;
  currency?: string;
  original_usd?: number;
}

export interface ProjectClientResource {
  name: string;
  avatar_url?: string;
  location?: string;
  rating?: number;
  total_reviews?: number;
}

export interface ProjectResource {
  id: number | string;
  title: string;
  description: string;
  category?: string;
  technologies?: string[];
  budget?: ProjectBudgetResource;
  budget_min?: number;
  budget_max?: number;
  budget_type?: 'fixed' | 'hourly' | 'FIXED' | 'HOURLY';
  payment_plan?: string;
  milestone_count?: number;
  milestones?: unknown[];
  deadline?: string;
  offers_count?: number;
  created_at?: string;
  is_recommended?: boolean;
  client?: ProjectClientResource;
  score?: number;
  [key: string]: unknown;
}

export interface ProviderServiceResource {
  name?: string;
  categoryIcon?: string;
}

export interface ProviderResource {
  id: number | string;
  firstName?: string;
  lastName?: string;
  avatar?: string | null;
  rating?: number | string | null;
  location?: string | null;
  bio?: string | null;
  profile_url?: string | null;
  services?: ProviderServiceResource[];
  featured_badges?: unknown[];
  featuredBadges?: UserBadgeRecord[];
  score?: number;
  [key: string]: unknown;
}

export interface AiServiceCardModel {
  id: number | string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  providerCount: number;
  providers: ServiceProviderResource[];
  isFeatured: boolean;
}

export interface ProviderCardModel {
  id: number | string;
  firstName: string;
  lastName: string;
  avatar?: string;
  rating: number | string;
  location: string;
  bio?: string;
  profile_url?: string;
  services: ProviderServiceResource[];
  featuredBadges: UserBadgeRecord[];
}

export type AiSearchResponseByNamespace = {
  services: ServiceResource[];
  projects: ProjectResource[];
  providers: ProviderResource[];
  provider_profiles: ProviderResource[];
};

export type AiSearchMatchResponse =
  | {
      namespace: 'services';
      data: ServiceResource[];
      total: number;
    }
  | {
      namespace: 'projects';
      data: ProjectResource[];
      total: number;
    }
  | {
      namespace: 'providers' | 'provider_profiles';
      data: ProviderResource[];
      total: number;
    };

const toObject = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
};

const unwrapMatchItem = (item: unknown): Record<string, unknown> | null => {
  const objectValue = toObject(item);
  if (!objectValue) {
    return null;
  }

  const nestedPayload =
    toObject(objectValue.resource) ||
    toObject(objectValue.payload) ||
    toObject(objectValue.metadata) ||
    toObject(objectValue.document) ||
    null;

  if (!nestedPayload) {
    return objectValue;
  }

  if (typeof objectValue.score === 'number' && nestedPayload.score === undefined) {
    return {
      ...nestedPayload,
      score: objectValue.score,
    };
  }

  return nestedPayload;
};

const extractPayloadList = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  const objectPayload = toObject(payload);
  if (!objectPayload) {
    return [];
  }

  const directList =
    objectPayload.data ??
    objectPayload.matches ??
    objectPayload.results ??
    objectPayload.items ??
    objectPayload.documents;

  if (Array.isArray(directList)) {
    return directList;
  }

  if (toObject(objectPayload.data)) {
    const nestedData = objectPayload.data as Record<string, unknown>;
    const nestedList =
      nestedData.items ?? nestedData.results ?? nestedData.matches ?? nestedData.data;
    if (Array.isArray(nestedList)) {
      return nestedList;
    }
  }

  return [];
};

const normalizeNamespace = (value: unknown): AiSearchNamespace | null => {
  if (typeof value !== 'string') {
    return null;
  }
  return isAiSearchNamespace(value) ? value : null;
};

export const DEFAULT_AI_SEARCH_NAMESPACE: AiSearchNamespace = 'services';

export function isAiSearchNamespace(value: string): value is AiSearchNamespace {
  return AI_SEARCH_NAMESPACES.includes(value as AiSearchNamespace);
}

export function resolveAiSearchNamespace(value: string | null | undefined): AiSearchNamespace {
  if (!value) {
    return DEFAULT_AI_SEARCH_NAMESPACE;
  }
  return isAiSearchNamespace(value) ? value : DEFAULT_AI_SEARCH_NAMESPACE;
}

export function normalizeAiSearchMatchResponse(
  payload: unknown,
  requestedNamespace: AiSearchNamespace
): AiSearchMatchResponse {
  const objectPayload = toObject(payload);
  const namespaceFromPayload = normalizeNamespace(objectPayload?.namespace);
  const namespace = namespaceFromPayload ?? requestedNamespace;
  const rawItems = extractPayloadList(payload);
  const items = rawItems
    .map((item) => unwrapMatchItem(item))
    .filter((item): item is Record<string, unknown> => Boolean(item));

  const totalFromPayload =
    typeof objectPayload?.total === 'number'
      ? objectPayload.total
      : typeof objectPayload?.count === 'number'
        ? objectPayload.count
        : items.length;

  if (namespace === 'services') {
    return {
      namespace,
      data: items as ServiceResource[],
      total: totalFromPayload,
    };
  }

  if (namespace === 'projects') {
    return {
      namespace,
      data: items as ProjectResource[],
      total: totalFromPayload,
    };
  }

  return {
    namespace,
    data: items as ProviderResource[],
    total: totalFromPayload,
  };
}

export function getLocalizedText(
  value: LocalizedText | null | undefined,
  locale: Locale
): string {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  return value[locale] ?? value.en ?? value.ro ?? Object.values(value)[0] ?? '';
}

export function mapProjectResource(resource: ProjectResource): ProjectWithClient {
  const createdAt = resource.created_at ?? new Date().toISOString();
  const rawBudgetType = (resource.budget_type ?? 'fixed').toLowerCase();
  const budgetType = rawBudgetType === 'hourly' ? 'hourly' : 'fixed';

  return {
    id: String(resource.id),
    title: resource.title,
    description: resource.description,
    category: resource.category ?? 'General',
    technologies: Array.isArray(resource.technologies) ? resource.technologies : [],
    budget: resource.budget
      ? {
          amount: resource.budget.amount,
          currency: resource.budget.currency ?? 'USD',
          original_usd: resource.budget.original_usd ?? resource.budget.amount,
        }
      : undefined,
    budget_min: resource.budget_min,
    budget_max: resource.budget_max,
    budget_type: budgetType,
    payment_plan:
      typeof resource.payment_plan === 'string' ? resource.payment_plan : undefined,
    milestone_count:
      typeof resource.milestone_count === 'number' ? resource.milestone_count : undefined,
    milestones: Array.isArray(resource.milestones)
      ? (resource.milestones as ProjectWithClient['milestones'])
      : undefined,
    deadline: resource.deadline ?? '1month',
    offers_count: typeof resource.offers_count === 'number' ? resource.offers_count : 0,
    created_at: createdAt,
    is_recommended: Boolean(resource.is_recommended),
    client: resource.client
      ? {
          name: resource.client.name,
          avatar_url: resource.client.avatar_url,
          location: resource.client.location ?? '',
          rating: typeof resource.client.rating === 'number' ? resource.client.rating : 0,
          total_reviews:
            typeof resource.client.total_reviews === 'number'
              ? resource.client.total_reviews
              : 0,
        }
      : undefined,
  };
}

export function mapProviderResource(resource: ProviderResource): ProviderCardModel {
  return {
    id: resource.id,
    firstName: resource.firstName ?? '',
    lastName: resource.lastName ?? '',
    avatar: resource.avatar ?? undefined,
    rating: resource.rating ?? 0,
    location: resource.location ?? '',
    bio: resource.bio ?? undefined,
    profile_url: resource.profile_url ?? undefined,
    services: Array.isArray(resource.services)
      ? resource.services.map((service) => ({
          name: service?.name,
          categoryIcon: service?.categoryIcon,
        }))
      : [],
    featuredBadges: normalizeUserBadgeCollection(
      resource.featuredBadges ?? resource.featured_badges
    ),
  };
}

export function mapServiceResource(
  resource: ServiceResource,
  locale: Locale
): AiServiceCardModel {
  const categoryName =
    typeof resource.category === 'string'
      ? resource.category
      : getLocalizedText(resource.category?.name, locale);

  const tags = [
    ...(Array.isArray(resource.tags) ? resource.tags : []),
    ...(Array.isArray(resource.skills)
      ? resource.skills
          .map((skill) => getLocalizedText(skill, locale))
          .filter(Boolean)
      : []),
  ];

  return {
    id: resource.id,
    name: getLocalizedText(resource.name, locale),
    description: getLocalizedText(resource.description, locale),
    category: categoryName || 'General',
    tags: Array.from(new Set(tags)).slice(0, 5),
    providerCount: Array.isArray(resource.providers) ? resource.providers.length : 0,
    providers: Array.isArray(resource.providers) ? resource.providers : [],
    isFeatured: Boolean(resource.isFeatured),
  };
}
