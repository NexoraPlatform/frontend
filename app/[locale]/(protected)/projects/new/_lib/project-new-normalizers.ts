import type {
  AiRecommendServicesResponse,
  RecommendedServiceCandidate,
} from '@/services/ai.service';
import type {
  AiAssistantMessage,
  AiBriefOtherProviders,
  AiBriefOtherProvidersByService,
  AiBriefProvider,
  AiBriefRecommendedProviders,
  AiBriefResponse,
  AiMilestoneItem,
  AiTeamStructureItem,
} from '@/types/ai';
import type { DeliveryProvider } from '@/types/projects';

import {
  extractBriefResultId,
  getMilestoneAssignedProviderId,
  getServiceCategoryName,
  normalizeDeliveryProvider,
  normalizeFlexibleStringList,
  normalizeStringList,
  toNumber,
  toObject,
  toString,
} from './project-new-helpers';
import type {
  NormalizedBriefProjectLine,
  NormalizedBriefProjectLineMilestone,
  NormalizedMilestoneWithService,
  NormalizedTechnologyLine,
  RecommendationResult,
  ServiceCatalogEntry,
} from './project-new-types';

export const normalizeRecommendationResponse = (
  payload: AiRecommendServicesResponse | unknown,
  serviceCatalogById?: Map<string, ServiceCatalogEntry>
): RecommendationResult => {
  const root = toObject(payload) ?? {};
  const source = toObject(root.data) ?? root;
  const bundle = toObject(source.bundle);
  const recommendationType = toString(source.type).toLowerCase();

  const bundleName =
    toString(source.bundle_name) ||
    toString(bundle?.name) ||
    toString(source.name) ||
    (recommendationType === 'bundle'
      ? 'Recommended bundle'
      : recommendationType === 'single'
        ? 'Recommended service'
        : '') ||
    undefined;

  const candidateLists: unknown[] = [
    source.services,
    bundle?.services,
    source.recommended_services,
    source.project_lines,
    source.items,
    root.services,
  ];

  let rawServices: unknown[] = [];
  for (const entry of candidateLists) {
    if (Array.isArray(entry) && entry.length > 0) {
      rawServices = entry;
      break;
    }
  }

  if (
    rawServices.length === 0 &&
    (toString(source.service_name) ||
      toString(source.name) ||
      typeof source.service_id === 'string' ||
      typeof source.service_id === 'number')
  ) {
    rawServices = [source];
  }

  const mapServiceEntries = (
    entries: unknown[],
    options?: {
      isAlternative?: boolean;
      fallbackCategoryId?: string | number;
      fallbackCategoryName?: string;
      fallbackReason?: string;
    }
  ): RecommendedServiceCandidate[] =>
    entries
      .map((entry) => {
        const item = toObject(entry);
        if (!item) {
          return null;
        }

        const nestedService = toObject(item.service);
        const serviceIdRaw = item.service_id ?? item.id ?? nestedService?.id;
        const serviceId =
          typeof serviceIdRaw === 'string' || typeof serviceIdRaw === 'number'
            ? serviceIdRaw
            : null;
        const catalogData =
          serviceId !== null ? serviceCatalogById?.get(String(serviceId)) : undefined;

        const serviceName =
          toString(item.service_name) ||
          toString(item.name) ||
          toString(item.title) ||
          toString(nestedService?.name) ||
          toString(catalogData?.name) ||
          (serviceId !== null ? `Service #${serviceId}` : '');

        if (!serviceName) {
          return null;
        }

        const categoryId = item.category_id ?? options?.fallbackCategoryId;
        const categoryName = toString(item.category_name) || toString(options?.fallbackCategoryName);
        const description =
          toString(item.description) ||
          toString(item.reason) ||
          toString(options?.fallbackReason) ||
          toString(catalogData?.description);

        return {
          ...(serviceId !== null ? { service_id: serviceId } : {}),
          service_name: serviceName,
          delivery_provider: normalizeDeliveryProvider(
            item.delivery_provider ??
            item.provider ??
            nestedService?.delivery_provider ??
            catalogData?.delivery_provider
          ),
          ...(description ? { description } : {}),
          ...((typeof categoryId === 'string' || typeof categoryId === 'number')
            ? { category_id: categoryId }
            : {}),
          ...(categoryName ? { category_name: categoryName } : {}),
          ...(options?.isAlternative ? { is_alternative: true } : {}),
        } satisfies RecommendedServiceCandidate;
      })
      .filter((entry): entry is RecommendedServiceCandidate => entry !== null);

  const recommendedServices = mapServiceEntries(rawServices);

  const similarServicesByCategoryRaw = Array.isArray(source.similar_services_by_category)
    ? source.similar_services_by_category
    : [];

  const alternativeServices = similarServicesByCategoryRaw.flatMap((categoryEntry) => {
    const category = toObject(categoryEntry);
    if (!category) {
      return [];
    }

    const categoryServices = Array.isArray(category.services) ? category.services : [];
    if (categoryServices.length === 0) {
      return [];
    }

    const fallbackCategoryName = toString(category.category_name);
    const fallbackReason = fallbackCategoryName
      ? `Alternative service in ${fallbackCategoryName}.`
      : 'Alternative service option.';

    return mapServiceEntries(categoryServices, {
      isAlternative: true,
      fallbackCategoryId:
        typeof category.category_id === 'string' || typeof category.category_id === 'number'
          ? category.category_id
          : undefined,
      fallbackCategoryName,
      fallbackReason,
    });
  });

  const uniqueServices = new Map<string, RecommendedServiceCandidate>();
  [...recommendedServices, ...alternativeServices].forEach((service) => {
    const serviceId = service.service_id;
    const categoryName = getServiceCategoryName(service).toLowerCase();
    const key =
      typeof serviceId === 'string' || typeof serviceId === 'number'
        ? `service-id:${String(serviceId)}::${categoryName}`
        : `${service.service_name.toLowerCase()}::${service.delivery_provider}::${categoryName}`;

    if (!uniqueServices.has(key)) {
      uniqueServices.set(key, service);
    }
  });

  const services = Array.from(uniqueServices.values());

  return {
    ...(bundleName ? { bundle_name: bundleName } : {}),
    services,
  };
};

export const normalizeQuestions = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (typeof entry === 'string') {
        return entry.trim();
      }
      if (entry && typeof entry === 'object' && 'question' in entry) {
        return toString((entry as { question?: unknown }).question);
      }
      return '';
    })
    .filter(Boolean);
};

export const normalizeAssistantMessages = (value: unknown): AiAssistantMessage[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      const source = toObject(entry);
      if (!source) {
        return null;
      }

      const role = toString(source.role);
      const content = toString(source.content);
      if (
        (role !== 'system' && role !== 'user' && role !== 'assistant') ||
        !content
      ) {
        return null;
      }

      return {
        role,
        content,
      } satisfies AiAssistantMessage;
    })
    .filter((message): message is AiAssistantMessage => message !== null);
};

export const normalizeBriefProjectLines = (
  rawLines: unknown[],
  fallbackDescription: string = ''
): NonNullable<AiBriefResponse['final_brief']>['project_lines'] => {
  return rawLines
    .map((entry) => {
      const line = toObject(entry);
      if (!line) {
        return null;
      }

      const serviceName =
        toString(line.service_name) ||
        toString(line.name) ||
        toString(line.service) ||
        toString(line.role);

      if (!serviceName) {
        return null;
      }

      const milestonesRaw = Array.isArray(line.milestones) ? line.milestones : [];
      const milestones: NonNullable<
        AiBriefResponse['final_brief']
      >['project_lines'][number]['milestones'] = [];

      milestonesRaw.forEach((milestoneEntry) => {
        const milestone = toObject(milestoneEntry);
        if (!milestone) {
          return;
        }

        const milestoneTitle = toString(milestone.title);
        if (!milestoneTitle) {
          return;
        }

        const milestoneDescription = toString(milestone.description);
        const milestonePercentage = toNumber(milestone.percentage);
        const milestoneDurationDays = toNumber(
          milestone.duration_days ?? milestone.durationDays
        );
        const assignedProviderId = getMilestoneAssignedProviderId(milestone);
        const assignedProvider = toObject(milestone.assigned_provider);
        const normalizedAssignedProvider =
          assignedProviderId !== null
            ? {
                ...(assignedProvider ?? {}),
                id: assignedProviderId,
              }
            : null;

        milestones.push({
          title: milestoneTitle,
          ...(milestoneDescription ? { description: milestoneDescription } : {}),
          ...(milestonePercentage !== null ? { percentage: milestonePercentage } : {}),
          amount: toNumber(milestone.amount) ?? 0,
          ...(milestoneDurationDays !== null
            ? { duration_days: Math.max(0, Math.trunc(milestoneDurationDays)) }
            : {}),
          ...(assignedProviderId !== null ? { assigned_provider_id: assignedProviderId } : {}),
          ...(normalizedAssignedProvider ? { assigned_provider: normalizedAssignedProvider } : {}),
        });
      });

      return {
        service_name: serviceName,
        delivery_provider: normalizeDeliveryProvider(line.delivery_provider),
        description: toString(line.description) || fallbackDescription,
        budget_percentage:
          toNumber(line.budget_percentage) ?? toNumber(line.percentage) ?? 0,
        milestones,
      };
    })
    .filter((line): line is NonNullable<AiBriefResponse['final_brief']>['project_lines'][number] => line !== null);
};

export const normalizeTechnologyLines = (value: unknown): NormalizedTechnologyLine[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const lines = new Map<string, NormalizedTechnologyLine>();

  value.forEach((entry) => {
    if (typeof entry === 'string') {
      const name = toString(entry);
      if (!name) {
        return;
      }

      const key = `name:${name.toLowerCase()}`;
      if (!lines.has(key)) {
        lines.set(key, { service_name: name });
      }
      return;
    }

    const item = toObject(entry);
    if (!item) {
      return;
    }

    const serviceName =
      toString(item.name) ||
      toString(item.service_name) ||
      toString(item.technology) ||
      toString(item.title);

    if (!serviceName) {
      return;
    }

    const rawServiceId = item.service_id ?? item.id;
    const serviceId =
      typeof rawServiceId === 'string' || typeof rawServiceId === 'number'
        ? rawServiceId
        : undefined;
    const rawDeliveryProvider = item.delivery_provider ?? item.provider;
    const deliveryProvider =
      typeof rawDeliveryProvider === 'string' && rawDeliveryProvider.trim()
        ? normalizeDeliveryProvider(rawDeliveryProvider)
        : undefined;

    const key =
      serviceId !== undefined
        ? `id:${String(serviceId)}`
        : `name:${serviceName.toLowerCase()}`;
    const existing = lines.get(key);

    lines.set(key, {
      service_name: serviceName,
      ...(serviceId !== undefined ? { service_id: serviceId } : {}),
      ...(deliveryProvider ? { delivery_provider: deliveryProvider } : {}),
      ...(existing?.service_id !== undefined && serviceId === undefined
        ? { service_id: existing.service_id }
        : {}),
      ...(existing?.delivery_provider && !deliveryProvider
        ? { delivery_provider: existing.delivery_provider }
        : {}),
    });
  });

  return Array.from(lines.values());
};

export const normalizeTechnologyNames = (value: unknown): string[] => {
  return normalizeTechnologyLines(value).map((line) => line.service_name);
};

export const normalizeTeamStructure = (
  value: unknown
): AiTeamStructureItem[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      const member = toObject(entry);
      if (!member) {
        return null;
      }

      const role = toString(member.role);
      if (!role) {
        return null;
      }

      const count = toNumber(member.count);
      const percentage = toNumber(member.percentage);
      const estimatedCost = toNumber(member.estimated_cost);
      const rawServiceId = member.service_id ?? member.serviceId;
      const serviceId =
        typeof rawServiceId === 'string' || typeof rawServiceId === 'number'
          ? rawServiceId
          : undefined;
      const deliveryProviderRaw = member.delivery_provider ?? member.deliveryProvider;
      const deliveryProvider =
        typeof deliveryProviderRaw === 'string' && deliveryProviderRaw.trim()
          ? normalizeDeliveryProvider(deliveryProviderRaw)
          : undefined;
      const description = toString(member.description);

      return {
        role,
        ...(serviceId !== undefined ? { service_id: serviceId } : {}),
        ...(toString(member.service) ? { service: toString(member.service) } : {}),
        ...(deliveryProvider ? { delivery_provider: deliveryProvider } : {}),
        ...(description ? { description } : {}),
        ...(toString(member.level) ? { level: toString(member.level) } : {}),
        ...(count !== null ? { count } : {}),
        ...(percentage !== null ? { percentage } : {}),
        ...(estimatedCost !== null ? { estimated_cost: estimatedCost } : {}),
      };
    })
    .filter((item): item is AiTeamStructureItem => item !== null);
};

export const normalizeMilestoneListWithService = (
  value: unknown
): NormalizedMilestoneWithService[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      const milestone = toObject(entry);
      if (!milestone) {
        return null;
      }

      const title = toString(milestone.title);
      if (!title) {
        return null;
      }

      const percentage = toNumber(milestone.percentage);
      const amount = toNumber(milestone.amount);
      const durationDays = toNumber(milestone.duration_days ?? milestone.durationDays);
      const rawServiceId = milestone.service_id ?? milestone.serviceId;
      const serviceId =
        typeof rawServiceId === 'string' || typeof rawServiceId === 'number'
          ? rawServiceId
          : undefined;
      const serviceName =
        toString(milestone.service_name) ||
        toString(milestone.serviceName) ||
        toString(milestone.service);
      const rawDeliveryProvider = milestone.delivery_provider ?? milestone.provider;
      const deliveryProvider =
        typeof rawDeliveryProvider === 'string' && rawDeliveryProvider.trim()
          ? normalizeDeliveryProvider(rawDeliveryProvider)
          : undefined;

      return {
        title,
        ...(toString(milestone.description) ? { description: toString(milestone.description) } : {}),
        ...(percentage !== null ? { percentage } : {}),
        ...(amount !== null ? { amount } : {}),
        ...(durationDays !== null ? { duration_days: Math.max(0, Math.trunc(durationDays)) } : {}),
        ...(serviceId !== undefined ? { service_id: serviceId } : {}),
        ...(serviceName ? { service_name: serviceName } : {}),
        ...(deliveryProvider ? { delivery_provider: deliveryProvider } : {}),
      };
    })
    .filter((item): item is NormalizedMilestoneWithService => item !== null);
};

export const buildProjectLinesFromTechnologiesAndMilestones = (
  technologies: NormalizedTechnologyLine[],
  milestones: NormalizedMilestoneWithService[],
  fallbackDescription: string = ''
): NormalizedBriefProjectLine[] => {
  type WorkingLine = {
    service_name: string;
    delivery_provider: DeliveryProvider;
    description: string;
    milestones: NormalizedBriefProjectLineMilestone[];
    totalAmount: number;
    totalExplicitPercentage: number;
    hasExplicitPercentage: boolean;
  };

  const lines = new Map<string, WorkingLine>();
  const order: string[] = [];
  const keyByServiceId = new Map<string, string>();
  const keyByServiceName = new Map<string, string>();

  const upsertLine = (
    key: string,
    serviceName: string,
    deliveryProvider: DeliveryProvider = 'manual_upload'
  ) => {
    if (!lines.has(key)) {
      lines.set(key, {
        service_name: serviceName,
        delivery_provider: deliveryProvider,
        description: fallbackDescription,
        milestones: [],
        totalAmount: 0,
        totalExplicitPercentage: 0,
        hasExplicitPercentage: false,
      });
      order.push(key);
      return;
    }

    const current = lines.get(key);
    if (current && current.delivery_provider === 'manual_upload' && deliveryProvider !== 'manual_upload') {
      current.delivery_provider = deliveryProvider;
    }
  };

  technologies.forEach((technology) => {
    const serviceName = toString(technology.service_name);
    if (!serviceName) {
      return;
    }

    const serviceId =
      typeof technology.service_id === 'string' || typeof technology.service_id === 'number'
        ? String(technology.service_id)
        : null;
    const key = serviceId ? `id:${serviceId}` : `name:${serviceName.toLowerCase()}`;
    const deliveryProvider = technology.delivery_provider ?? 'manual_upload';

    upsertLine(key, serviceName, deliveryProvider);
    if (serviceId) {
      keyByServiceId.set(serviceId, key);
    }

    if (!keyByServiceName.has(serviceName.toLowerCase())) {
      keyByServiceName.set(serviceName.toLowerCase(), key);
    }
  });

  let hasFallbackLine = false;
  const fallbackKey = 'name:general-shared';

  milestones.forEach((milestone) => {
    const title = toString(milestone.title);
    if (!title) {
      return;
    }

    const amount = toNumber(milestone.amount) ?? 0;
    const percentage = toNumber(milestone.percentage);
    const durationDays = toNumber(milestone.duration_days);
    const serviceName = toString(milestone.service_name);
    const serviceId =
      typeof milestone.service_id === 'string' || typeof milestone.service_id === 'number'
        ? String(milestone.service_id)
        : null;
    const milestoneProvider =
      milestone.delivery_provider ?? 'manual_upload';

    let lineKey: string | null = null;

    if (serviceId && keyByServiceId.has(serviceId)) {
      lineKey = keyByServiceId.get(serviceId) ?? null;
    }

    if (!lineKey && serviceName) {
      lineKey = keyByServiceName.get(serviceName.toLowerCase()) ?? null;
    }

    if (!lineKey && serviceName) {
      const generatedKey = serviceId ? `id:${serviceId}` : `name:${serviceName.toLowerCase()}`;
      lineKey = generatedKey;
      upsertLine(generatedKey, serviceName, milestoneProvider);
      if (serviceId) {
        keyByServiceId.set(serviceId, generatedKey);
      }
      if (!keyByServiceName.has(serviceName.toLowerCase())) {
        keyByServiceName.set(serviceName.toLowerCase(), generatedKey);
      }
    }

    if (!lineKey) {
      lineKey = fallbackKey;
      if (!hasFallbackLine) {
        hasFallbackLine = true;
        upsertLine(fallbackKey, 'General / Shared', milestoneProvider);
      }
    }

    const line = lines.get(lineKey);
    if (!line) {
      return;
    }

    const normalizedMilestone: NormalizedBriefProjectLineMilestone = {
      title,
      ...(toString(milestone.description)
        ? { description: toString(milestone.description) }
        : {}),
      ...(percentage !== null ? { percentage } : {}),
      ...(durationDays !== null ? { duration_days: Math.max(0, Math.trunc(durationDays)) } : {}),
      amount,
    };

    line.milestones.push(normalizedMilestone);
    line.totalAmount += amount;
    if (percentage !== null) {
      line.totalExplicitPercentage += percentage;
      line.hasExplicitPercentage = true;
    }
  });

  const overallAmount = Array.from(lines.values()).reduce(
    (sum, line) => sum + line.totalAmount,
    0
  );

  return order
    .map((key) => {
      const line = lines.get(key);
      if (!line) {
        return null;
      }

      const budgetPercentage = line.hasExplicitPercentage
        ? Number(line.totalExplicitPercentage.toFixed(2))
        : overallAmount > 0
          ? Number(((line.totalAmount / overallAmount) * 100).toFixed(2))
          : 0;

      return {
        service_name: line.service_name,
        delivery_provider: line.delivery_provider,
        description: line.description,
        budget_percentage: budgetPercentage,
        milestones: line.milestones,
      } satisfies NormalizedBriefProjectLine;
    })
    .filter((line): line is NormalizedBriefProjectLine => line !== null);
};

export const normalizeProviderCandidate = (value: unknown): AiBriefProvider | null => {
  const provider = toObject(value);
  if (!provider) {
    return null;
  }

  const id = toNumber(provider.id);
  if (id === null) {
    return null;
  }

  const firstName = toString(provider.firstName) || toString(provider.first_name);
  const lastName = toString(provider.lastName) || toString(provider.last_name);
  const name = toString(provider.name) || [firstName, lastName].filter(Boolean).join(' ');
  const rating = toNumber(provider.rating);
  const reviewCount = toNumber(provider.reviewCount ?? provider.review_count);
  const matchScore = toNumber(provider.matchScore ?? provider.match_score);
  const pineconeScore = toNumber(provider.pineconeScore ?? provider.pinecone_score);
  const matchReasons = normalizeFlexibleStringList(provider.matchReasons ?? provider.match_reasons);

  return {
    ...provider,
    id,
    ...(firstName ? { firstName } : {}),
    ...(lastName ? { lastName } : {}),
    ...(name ? { name } : {}),
    ...(toString(provider.avatar) ? { avatar: toString(provider.avatar) } : {}),
    ...(rating !== null ? { rating } : {}),
    ...(reviewCount !== null ? { reviewCount } : {}),
    ...(matchScore !== null ? { matchScore } : {}),
    ...(pineconeScore !== null ? { pineconeScore } : {}),
    ...(matchReasons.length > 0 ? { matchReasons } : {}),
  };
};

export const normalizeRecommendedProviders = (value: unknown): AiBriefRecommendedProviders | undefined => {
  if (Array.isArray(value)) {
    const normalizedEntries = value
      .map((entry) => {
        const group = toObject(entry);
        if (!group) {
          return null;
        }

        const serviceName =
          toString(group.service_name) ||
          toString(group.name);
        if (!serviceName) {
          return null;
        }

        const providers = Array.isArray(group.providers) ? group.providers : [];
        const providerList = providers
          .map((provider) => normalizeProviderCandidate(provider))
          .filter((provider): provider is AiBriefProvider => provider !== null);

        return [serviceName, providerList] as const;
      })
      .filter((entry): entry is readonly [string, AiBriefProvider[]] => entry !== null);

    if (normalizedEntries.length === 0) {
      return undefined;
    }

    return Object.fromEntries(normalizedEntries);
  }

  const source = toObject(value);
  if (!source) {
    return undefined;
  }

  const normalizedEntries = Object.entries(source)
    .map(([serviceName, providers]) => {
      const normalizedService = toString(serviceName);
      const providerList = Array.isArray(providers)
        ? providers
            .map((provider) => normalizeProviderCandidate(provider))
            .filter((provider): provider is AiBriefProvider => provider !== null)
        : [];

      if (!normalizedService) {
        return null;
      }

      return [normalizedService, providerList] as const;
    })
    .filter((entry): entry is readonly [string, AiBriefProvider[]] => entry !== null);

  if (normalizedEntries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(normalizedEntries);
};

export const normalizeOtherProvidersPage = (value: unknown): AiBriefOtherProviders => {
  if (Array.isArray(value)) {
    const providers = value
      .map((provider) => normalizeProviderCandidate(provider))
      .filter((provider): provider is AiBriefProvider => provider !== null);
    const total = providers.length;

    return {
      data: providers,
      total,
      current_page: 1,
      per_page: total,
      last_page: 1,
      from: total > 0 ? 1 : null,
      to: total > 0 ? total : null,
      next_page_url: null,
      prev_page_url: null,
    };
  }

  const source = toObject(value) ?? {};
  const providers = Array.isArray(source.data)
    ? source.data
        .map((provider) => normalizeProviderCandidate(provider))
        .filter((provider): provider is AiBriefProvider => provider !== null)
    : [];

  return {
    ...source,
    data: providers,
    ...(toNumber(source.current_page) !== null ? { current_page: toNumber(source.current_page) as number } : {}),
    ...(toNumber(source.per_page) !== null ? { per_page: toNumber(source.per_page) as number } : {}),
    ...(toNumber(source.total) !== null ? { total: toNumber(source.total) as number } : {}),
    ...(toNumber(source.last_page) !== null ? { last_page: toNumber(source.last_page) as number } : {}),
    ...(toNumber(source.from) !== null ? { from: toNumber(source.from) as number } : {}),
    ...(source.from === null ? { from: null } : {}),
    ...(toNumber(source.to) !== null ? { to: toNumber(source.to) as number } : {}),
    ...(source.to === null ? { to: null } : {}),
    ...(toString(source.next_page_url) ? { next_page_url: toString(source.next_page_url) } : {}),
    ...(source.next_page === null || source.next_page_url === null ? { next_page_url: null } : {}),
    ...(toString(source.prev_page_url) ? { prev_page_url: toString(source.prev_page_url) } : {}),
    ...(source.prev_page === null || source.prev_page_url === null ? { prev_page_url: null } : {}),
  };
};

export const normalizeOtherProvidersByService = (
  value: unknown
): AiBriefOtherProvidersByService | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const normalized = value
    .map((entry) => {
      const serviceGroup = toObject(entry);
      if (!serviceGroup) {
        return null;
      }

      const serviceName = toString(serviceGroup.service_name);
      if (!serviceName) {
        return null;
      }

      const serviceId = serviceGroup.service_id;
      const providersPage = normalizeOtherProvidersPage(serviceGroup.providers);
      const groupTotal = toNumber(serviceGroup.total);

      return {
        ...(typeof serviceId === 'string' || typeof serviceId === 'number'
          ? { service_id: serviceId }
          : {}),
        service_name: serviceName,
        providers:
          groupTotal !== null
            ? {
                ...providersPage,
                total: groupTotal,
              }
            : providersPage,
      };
    })
    .filter(
      (entry): entry is NonNullable<AiBriefOtherProvidersByService[number]> => entry !== null
    );

  return normalized.length > 0 ? normalized : undefined;
};

export const normalizeAiBriefResponse = (payload: unknown): AiBriefResponse | null => {
  const root = toObject(payload);
  if (!root) {
    return null;
  }

  const source =
    toObject(root.result) ??
    toObject(root.result_payload) ??
    toObject(root.data) ??
    root;

  const statusRaw = toString(source.status ?? root.status).toUpperCase();
  const status: AiBriefResponse['status'] =
    statusRaw === 'FINAL'
      ? 'FINAL'
      : statusRaw === 'PROCESSING'
        ? 'PROCESSING'
        : statusRaw === 'FAILED'
          ? 'FAILED'
          : statusRaw === 'FAILED_BROADCAST'
            ? 'FAILED_BROADCAST'
            : 'CLARIFY';
  const normalizedError =
    toString(source.error ?? root.error) ||
    toString(source.error_message ?? root.error_message) ||
    toString(source.message ?? root.message) ||
    null;

  const messages = normalizeAssistantMessages(source.messages ?? root.messages);
  const questions = normalizeQuestions(source.questions ?? root.questions);
  const finalBriefText =
    toString(source.final_brief_text) || toString(root.final_brief_text);
  const modularBriefSource =
    toObject(source.final_brief_modular) ?? toObject(root.final_brief_modular);
  const standardBriefSource =
    toObject(source.final_brief) ??
    toObject(root.final_brief) ??
    (status === 'FINAL' ? toObject(source) : null);
  const finalBriefSource = modularBriefSource ?? standardBriefSource;

  let final_brief: AiBriefResponse['final_brief'];
  let final_brief_modular: AiBriefResponse['final_brief_modular'];
  let final_brief_full: AiBriefResponse['final_brief_full'];

  if (finalBriefSource) {
    const title =
      toString(modularBriefSource?.title) ||
      toString(standardBriefSource?.title) ||
      toString(finalBriefSource.title) ||
      'AI Generated Brief';
    const fallbackDescription =
      toString(modularBriefSource?.description) ||
      toString(standardBriefSource?.description) ||
      '';

    const standardTechnologiesDetailed = normalizeTechnologyLines(standardBriefSource?.technologies);
    const modularTechnologiesDetailed = normalizeTechnologyLines(modularBriefSource?.technologies);
    const standardMilestonesDetailed = normalizeMilestoneListWithService(standardBriefSource?.milestones);
    const modularMilestonesDetailed = normalizeMilestoneListWithService(modularBriefSource?.milestones);

    const modularProjectLinesRaw = modularBriefSource?.project_lines;
    const standardProjectLinesRaw = standardBriefSource?.project_lines;
    const modularProjectLines = Array.isArray(modularProjectLinesRaw)
      ? normalizeBriefProjectLines(modularProjectLinesRaw, fallbackDescription)
      : [];
    const standardProjectLines = Array.isArray(standardProjectLinesRaw)
      ? normalizeBriefProjectLines(standardProjectLinesRaw, fallbackDescription)
      : [];
    const generatedStandardProjectLines = buildProjectLinesFromTechnologiesAndMilestones(
      standardTechnologiesDetailed,
      standardMilestonesDetailed,
      fallbackDescription
    );
    const generatedModularProjectLines = buildProjectLinesFromTechnologiesAndMilestones(
      modularTechnologiesDetailed,
      modularMilestonesDetailed,
      fallbackDescription
    );
    let project_lines = modularProjectLines.length > 0
      ? modularProjectLines
      : standardProjectLines.length > 0
        ? standardProjectLines
        : [];

    if (project_lines.length === 0) {
      const rawProjectLines = Array.isArray(finalBriefSource.project_lines)
        ? finalBriefSource.project_lines
        : [];
      project_lines = normalizeBriefProjectLines(rawProjectLines, fallbackDescription);
    }

    if (project_lines.length === 0 && generatedStandardProjectLines.length > 0) {
      project_lines = generatedStandardProjectLines;
    }

    if (project_lines.length === 0 && generatedModularProjectLines.length > 0) {
      project_lines = generatedModularProjectLines;
    }

    const teamStructure = standardBriefSource?.team_structure;
    if (project_lines.length === 0 && Array.isArray(teamStructure)) {
      const fallbackTeamLines: Array<
        NonNullable<AiBriefResponse['final_brief']>['project_lines'][number] | null
      > = teamStructure.map((teamMember) => {
        const member = toObject(teamMember);
        if (!member) {
          return null;
        }

        const serviceName = toString(member.service) || toString(member.role);
        if (!serviceName) {
          return null;
        }

        return {
          service_name: serviceName,
          delivery_provider: 'manual_upload' as const,
          description: toString(member.role) || fallbackDescription,
          budget_percentage: 0,
          milestones: [],
        };
      });

      project_lines = fallbackTeamLines.filter(
        (line): line is NonNullable<AiBriefResponse['final_brief']>['project_lines'][number] =>
          line !== null
      );
    }

    const standardSpecificRequirements = normalizeStringList(standardBriefSource?.specific_requirements);
    const standardTechnologies = standardTechnologiesDetailed.map((technology) => technology.service_name);
    const standardTeamStructure = normalizeTeamStructure(standardBriefSource?.team_structure);
    const standardMilestones: AiMilestoneItem[] = standardMilestonesDetailed.map(
      ({
        service_id: _serviceId,
        service_name: _serviceName,
        delivery_provider: _deliveryProvider,
        ...milestone
      }) => milestone
    );
    const modularSpecificRequirements = normalizeStringList(modularBriefSource?.specific_requirements);
    const modularTechnologies = modularTechnologiesDetailed.map((technology) => technology.service_name);
    const modularTeamStructure = normalizeTeamStructure(modularBriefSource?.team_structure);
    const modularMilestones: AiMilestoneItem[] = modularMilestonesDetailed.map(
      ({
        service_id: _serviceId,
        service_name: _serviceName,
        delivery_provider: _deliveryProvider,
        ...milestone
      }) => milestone
    );
    const standardTechnicalRisks = normalizeFlexibleStringList(standardBriefSource?.technical_risks);
    const standardComplexityEstimation = Object.fromEntries(
      Object.entries(toObject(standardBriefSource?.complexity_estimation) ?? {})
        .map(([key, value]) => [key, toNumber(value)])
        .filter((entry): entry is [string, number] => entry[1] !== null)
    );

    if (project_lines.length > 0) {
      final_brief = {
        title: toString(standardBriefSource?.title) || title,
        project_lines,
        ...(toString(standardBriefSource?.description)
          ? { description: toString(standardBriefSource?.description) }
          : {}),
        ...(standardTechnologies.length > 0 ? { technologies: standardTechnologies } : {}),
        ...(toNumber(standardBriefSource?.budget) !== null
          ? { budget: toNumber(standardBriefSource?.budget) as number }
          : {}),
        ...(toNumber(standardBriefSource?.budget_min) !== null
          ? { budget_min: toNumber(standardBriefSource?.budget_min) as number }
          : {}),
        ...(toNumber(standardBriefSource?.budget_max) !== null
          ? { budget_max: toNumber(standardBriefSource?.budget_max) as number }
          : {}),
        ...(standardSpecificRequirements.length > 0
          ? { specific_requirements: standardSpecificRequirements }
          : {}),
        ...(toObject(standardBriefSource?.business_analysis)
          ? {
              business_analysis:
                standardBriefSource?.business_analysis as NonNullable<
                  AiBriefResponse['final_brief']
                >['business_analysis'],
            }
          : {}),
        ...(standardTechnicalRisks.length > 0
          ? { technical_risks: standardTechnicalRisks }
          : {}),
        ...(Object.keys(standardComplexityEstimation).length > 0
          ? { complexity_estimation: standardComplexityEstimation }
          : {}),
        ...(standardTeamStructure.length > 0 ? { team_structure: standardTeamStructure } : {}),
        ...(standardMilestones.length > 0 ? { milestones: standardMilestones } : {}),
        ...(toString(standardBriefSource?.duration)
          ? { duration: toString(standardBriefSource?.duration) }
          : {}),
        ...(toString(standardBriefSource?.recommended_duration)
          ? { recommended_duration: toString(standardBriefSource?.recommended_duration) }
          : {}),
        ...(toString(standardBriefSource?.project_duration)
          ? { project_duration: toString(standardBriefSource?.project_duration) }
          : {}),
        ...(toString(standardBriefSource?.payment_plan)
          ? { payment_plan: toString(standardBriefSource?.payment_plan) }
          : {}),
        ...(toString(standardBriefSource?.currency)
          ? { currency: toString(standardBriefSource?.currency) }
          : {}),
      };

      final_brief_modular = {
        title,
        project_lines:
          modularProjectLines.length > 0
            ? modularProjectLines
            : generatedModularProjectLines.length > 0
              ? generatedModularProjectLines
              : project_lines,
        ...(toString(modularBriefSource?.description)
          ? { description: toString(modularBriefSource?.description) }
          : {}),
        ...(toString(modularBriefSource?.overview)
          ? { overview: toString(modularBriefSource?.overview) }
          : {}),
        ...(toString(modularBriefSource?.client_goal)
          ? { client_goal: toString(modularBriefSource?.client_goal) }
          : {}),
        ...(toString(modularBriefSource?.target_audience)
          ? { target_audience: toString(modularBriefSource?.target_audience) }
          : {}),
        ...(modularTechnologies.length > 0 ? { technologies: modularTechnologies } : {}),
        ...(toNumber(modularBriefSource?.budget) !== null
          ? { budget: toNumber(modularBriefSource?.budget) as number }
          : {}),
        ...(toNumber(modularBriefSource?.budget_min) !== null
          ? { budget_min: toNumber(modularBriefSource?.budget_min) as number }
          : {}),
        ...(toNumber(modularBriefSource?.budget_max) !== null
          ? { budget_max: toNumber(modularBriefSource?.budget_max) as number }
          : {}),
        ...(modularSpecificRequirements.length > 0
          ? { specific_requirements: modularSpecificRequirements }
          : {}),
        ...(modularTeamStructure.length > 0 ? { team_structure: modularTeamStructure } : {}),
        ...(modularMilestones.length > 0 ? { milestones: modularMilestones } : {}),
        ...(toString(modularBriefSource?.duration)
          ? { duration: toString(modularBriefSource?.duration) }
          : {}),
        ...(toString(modularBriefSource?.recommended_duration)
          ? { recommended_duration: toString(modularBriefSource?.recommended_duration) }
          : {}),
        ...(toString(modularBriefSource?.project_duration)
          ? { project_duration: toString(modularBriefSource?.project_duration) }
          : {}),
        ...(toString(modularBriefSource?.payment_plan)
          ? { payment_plan: toString(modularBriefSource?.payment_plan) }
          : {}),
        ...(toString(modularBriefSource?.currency)
          ? { currency: toString(modularBriefSource?.currency) }
          : {}),
      };
    }
  }

  const fullBriefSource =
    toObject(source.final_brief_full) ?? toObject(root.final_brief_full);
  if (fullBriefSource) {
    const fullProjectLinesRaw = Array.isArray(fullBriefSource.project_lines)
      ? fullBriefSource.project_lines
      : [];
    const fullProjectLines = normalizeBriefProjectLines(
      fullProjectLinesRaw,
      toString(fullBriefSource.description)
    );
    const fullTechnologies = normalizeTechnologyNames(fullBriefSource.technologies);
    final_brief_full = {
      ...(fullBriefSource as AiBriefResponse['final_brief_full']),
      ...(fullTechnologies.length > 0 ? { technologies: fullTechnologies } : {}),
      ...(fullProjectLines.length > 0 ? { project_lines: fullProjectLines } : {}),
    };
  }

  const recommendedProviders = normalizeRecommendedProviders(
    source.recommended_providers ?? root.recommended_providers
  );
  const otherProvidersByService = normalizeOtherProvidersByService(
    source.other_providers_by_service ?? root.other_providers_by_service
  );
  const legacyOtherProviders = toObject(source.other_providers ?? root.other_providers)
    ? normalizeOtherProvidersPage(source.other_providers ?? root.other_providers)
    : undefined;
  const payloadTruncated = Boolean(source.payload_truncated ?? root.payload_truncated);
  const payloadTrimmedSections = normalizeStringList(
    source.payload_trimmed_sections ?? root.payload_trimmed_sections
  );
  const briefResultId = extractBriefResultId(payload);

  const normalized: AiBriefResponse = {
    status,
    ...(briefResultId !== null ? { brief_result_id: briefResultId } : {}),
    ...(toString(source.channel ?? root.channel)
      ? { channel: toString(source.channel ?? root.channel) }
      : {}),
    ...(normalizedError ? { error: normalizedError } : {}),
    ...(messages.length > 0 ? { messages } : {}),
    ...(questions.length > 0 ? { questions } : {}),
    ...(final_brief ? { final_brief } : {}),
    ...(final_brief_modular ? { final_brief_modular } : {}),
    ...(final_brief_full ? { final_brief_full } : {}),
    ...(finalBriefText ? { final_brief_text: finalBriefText } : {}),
    ...(recommendedProviders ? { recommended_providers: recommendedProviders } : {}),
    ...(legacyOtherProviders ? { other_providers: legacyOtherProviders } : {}),
    ...(otherProvidersByService ? { other_providers_by_service: otherProvidersByService } : {}),
    ...(payloadTruncated ? { payload_truncated: true } : {}),
    ...(payloadTrimmedSections.length > 0 ? { payload_trimmed_sections: payloadTrimmedSections } : {}),
  };

  const hasUsefulPayload =
    Boolean(final_brief) ||
    Boolean(final_brief_modular) ||
    Boolean(final_brief_full) ||
    Boolean(finalBriefText) ||
    Boolean(normalizedError) ||
    messages.length > 0 ||
    questions.length > 0 ||
    Boolean(recommendedProviders) ||
    Boolean(legacyOtherProviders) ||
    Boolean(otherProvidersByService) ||
    payloadTruncated ||
    payloadTrimmedSections.length > 0 ||
    Boolean(statusRaw);
  return hasUsefulPayload ? normalized : null;
};
