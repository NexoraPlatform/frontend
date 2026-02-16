"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Figma,
  FolderOpen,
  Github,
  Loader2,
  Sparkles,
  UploadCloud,
  Wrench,
} from 'lucide-react';
import { toast } from 'sonner';

import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { TrustoraThemeStyles } from '@/components/trustora/theme-styles';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/auth-context';
import { useGetServicesGroupedByCategory } from '@/hooks/use-api';
import { getEcho } from '@/lib/echo';
import { Link, useRouter } from '@/lib/navigation';
import { aiService, type AiRecommendServicesResponse, type RecommendedServiceCandidate } from '@/services/ai.service';
import { projectsService } from '@/services/projects';
import {
  type AiAssistantMessage,
  type AiBriefResponse,
  type AiMilestoneItem,
  type AiTeamStructureItem,
  type AiBriefRecommendedProviders,
  type AiBriefOtherProviders,
  type AiBriefOtherProvidersByService,
  type AiBriefProvider,
  type AiBriefFormDraft,
  AI_BRIEF_DRAFT_STORAGE_KEY,
} from '@/types/ai';
import type { Locale } from '@/types/locale';
import type { DeliveryProvider } from '@/types/projects';

type WizardStep = 'intent' | 'recommendation' | 'briefing' | 'providers' | 'review';

type RecommendationResult = {
  bundle_name?: string;
  services: RecommendedServiceCandidate[];
};

type ServiceCatalogEntry = {
  name?: string;
  description?: string;
  delivery_provider?: DeliveryProvider;
};

type RecommendedCard = RecommendedServiceCandidate & {
  key: string;
};

const PAYMENT_PLAN_OPTIONS = [
  { value: 'FULL', label: 'Full Payment' },
  { value: 'MILESTONE', label: 'Milestone' },
  { value: 'MONTHLY', label: 'Monthly' },
] as const;

const WIZARD_STEPS: Array<{ id: WizardStep; label: string }> = [
  { id: 'intent', label: 'Intenție' },
  { id: 'recommendation', label: 'Recomandare' },
  { id: 'briefing', label: 'Briefing' },
  { id: 'providers', label: 'Prestatori' },
  { id: 'review', label: 'Review & Create' },
];

const STEP_TRANSITIONS: Record<WizardStep, WizardStep[]> = {
  intent: ['recommendation'],
  recommendation: ['intent', 'briefing'],
  briefing: ['recommendation', 'providers'],
  providers: ['briefing', 'review'],
  review: ['providers'],
};

const AI_BRIEF_GENERATED_EVENT_NAMES = [
  '.AiBriefGenerated',
  'AiBriefGenerated',
  '.App\\Events\\AiBriefGenerated',
  'App\\Events\\AiBriefGenerated',
] as const;

const AI_BRIEF_FAILED_EVENT_NAMES = [
  '.AiBriefFailed',
  'AiBriefFailed',
  '.App\\Events\\AiBriefFailed',
  'App\\Events\\AiBriefFailed',
] as const;

const toObject = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
};

const toString = (value: unknown): string => {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const extractBriefResultId = (value: unknown): number | string | null => {
  const root = toObject(value);
  if (!root) {
    return null;
  }

  const source = toObject(root.result) ?? toObject(root.data) ?? root;
  const sourceResponsePayload = toObject(source.response_payload);
  const rootResponsePayload = toObject(root.response_payload);
  const sourceDebug = toObject(source.debug);
  const rootDebug = toObject(root.debug);
  const sourceDebugResponsePayload = toObject(sourceDebug?.response_payload);
  const rootDebugResponsePayload = toObject(rootDebug?.response_payload);
  const candidate =
    source.brief_result_id ??
    root.brief_result_id ??
    source.id ??
    root.id ??
    sourceResponsePayload?.brief_result_id ??
    rootResponsePayload?.brief_result_id ??
    sourceDebugResponsePayload?.brief_result_id ??
    rootDebugResponsePayload?.brief_result_id;

  if (typeof candidate === 'number' && Number.isFinite(candidate)) {
    return candidate;
  }

  if (typeof candidate === 'string' && candidate.trim()) {
    return candidate.trim();
  }

  return null;
};

const normalizeDeliveryProvider = (value: unknown): DeliveryProvider => {
  const normalized = toString(value).toLowerCase();

  if (normalized === 'github') return 'github';
  if (normalized === 'figma') return 'figma';
  if (normalized === 'google_drive') return 'google_drive';
  if (normalized === 'google_analytics') return 'google_analytics';

  return 'manual_upload';
};

const getProviderLabel = (provider: DeliveryProvider) => {
  if (provider === 'github') return 'GitHub';
  if (provider === 'figma') return 'Figma';
  if (provider === 'google_drive') return 'Google Drive';
  if (provider === 'google_analytics') return 'Google Analytics';
  return 'Manual Upload';
};

const getProviderIcon = (provider: DeliveryProvider) => {
  if (provider === 'github') return <Github className="h-4 w-4" />;
  if (provider === 'figma') return <Figma className="h-4 w-4" />;
  if (provider === 'google_drive') return <FolderOpen className="h-4 w-4" />;
  if (provider === 'google_analytics') return <BarChart3 className="h-4 w-4" />;
  if (provider === 'manual_upload') return <UploadCloud className="h-4 w-4" />;
  return <Wrench className="h-4 w-4" />;
};

const isAlternativeService = (service: RecommendedServiceCandidate | RecommendedCard) =>
  Boolean((service as { is_alternative?: unknown }).is_alternative);

const getServiceCategoryName = (service: RecommendedServiceCandidate | RecommendedCard) =>
  toString((service as { category_name?: unknown }).category_name);

const getServiceKey = (serviceName: unknown) => toString(serviceName).toLowerCase();

const getProviderId = (provider: AiBriefProvider): number | null =>
  toNumber((provider as { id?: unknown }).id);

const getProviderDisplayName = (provider: AiBriefProvider) =>
  toString((provider as { name?: unknown }).name) ||
  `${toString(provider.firstName)} ${toString(provider.lastName)}`.trim() ||
  (() => {
    const providerId = getProviderId(provider);
    return providerId !== null ? `Provider #${providerId}` : 'Provider';
  })();

const dedupeProviders = (providers: AiBriefProvider[]) => {
  const unique = new Map<string, AiBriefProvider>();
  providers.forEach((provider) => {
    const providerId = getProviderId(provider);
    const key = providerId !== null ? String(providerId) : getProviderDisplayName(provider);
    if (!unique.has(key)) {
      unique.set(key, provider);
    }
  });
  return Array.from(unique.values());
};

const parseDurationToMonths = (value: unknown): number | null => {
  const normalized = toString(value).toLowerCase().replace(/\s+/g, '');
  if (!normalized) {
    return null;
  }

  if (normalized.includes('plusyear') || normalized.includes('over1year')) {
    return 12;
  }

  const numericPattern = /(\d+(?:[.,]\d+)?)(day|days|week|weeks|month|months|year|years)/;
  const match = normalized.match(numericPattern);
  if (!match) {
    return null;
  }

  const amount = Number(match[1].replace(',', '.'));
  const unit = match[2];

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  if (unit.startsWith('day')) {
    return amount / 30;
  }

  if (unit.startsWith('week')) {
    return amount / 4;
  }

  if (unit.startsWith('year')) {
    return amount * 12;
  }

  return amount;
};

const normalizeRecommendationResponse = (
  payload: unknown,
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

const normalizeQuestions = (value: unknown): string[] => {
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

const toJsonDebugString = (value: unknown): string => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const normalizeBriefProjectLines = (
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
      const milestones = milestonesRaw
        .map((milestoneEntry) => {
          const milestone = toObject(milestoneEntry);
          if (!milestone) {
            return null;
          }

          const milestoneTitle = toString(milestone.title);
          if (!milestoneTitle) {
            return null;
          }

          const milestoneDescription = toString(milestone.description);
          const milestonePercentage = toNumber(milestone.percentage);

          return {
            title: milestoneTitle,
            ...(milestoneDescription ? { description: milestoneDescription } : {}),
            ...(milestonePercentage !== null ? { percentage: milestonePercentage } : {}),
            amount: toNumber(milestone.amount) ?? 0,
          };
        })
        .filter(
          (item): item is { title: string; description?: string; percentage?: number; amount: number } =>
            item !== null
        );

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

const normalizeStringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => toString(item)).filter(Boolean);
};

const normalizeFlexibleStringList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => toString(item)).filter(Boolean);
  }

  const single = toString(value);
  return single ? [single] : [];
};

const normalizeTeamStructure = (
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
      const estimatedCost = toNumber(member.estimated_cost);

      return {
        role,
        ...(toString(member.service) ? { service: toString(member.service) } : {}),
        ...(toString(member.level) ? { level: toString(member.level) } : {}),
        ...(count !== null ? { count } : {}),
        ...(estimatedCost !== null ? { estimated_cost: estimatedCost } : {}),
      };
    })
    .filter((item): item is AiTeamStructureItem => item !== null);
};

const normalizeMilestoneList = (
  value: unknown
): AiMilestoneItem[] => {
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

      return {
        title,
        ...(toString(milestone.description) ? { description: toString(milestone.description) } : {}),
        ...(percentage !== null ? { percentage } : {}),
        ...(amount !== null ? { amount } : {}),
      };
    })
    .filter((item): item is AiMilestoneItem => item !== null);
};

const normalizeProviderCandidate = (value: unknown): AiBriefProvider | null => {
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

const normalizeRecommendedProviders = (value: unknown): AiBriefRecommendedProviders | undefined => {
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

const normalizeOtherProvidersPage = (value: unknown): AiBriefOtherProviders => {
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

const normalizeOtherProvidersByService = (
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

      return {
        ...(typeof serviceId === 'string' || typeof serviceId === 'number'
          ? { service_id: serviceId }
          : {}),
        service_name: serviceName,
        providers: providersPage,
      };
    })
    .filter(
      (entry): entry is NonNullable<AiBriefOtherProvidersByService[number]> => entry !== null
    );

  return normalized.length > 0 ? normalized : undefined;
};

const normalizeAiBriefResponse = (payload: unknown): AiBriefResponse | null => {
  const root = toObject(payload);
  if (!root) {
    return null;
  }

  const source = toObject(root.result) ?? toObject(root.data) ?? root;

  const statusRaw = toString(source.status ?? root.status).toUpperCase();
  const status: AiBriefResponse['status'] =
    statusRaw === 'FINAL' ? 'FINAL' : statusRaw === 'PROCESSING' ? 'PROCESSING' : 'CLARIFY';

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

    const modularProjectLinesRaw = modularBriefSource?.project_lines;
    const standardProjectLinesRaw = standardBriefSource?.project_lines;
    const modularProjectLines = Array.isArray(modularProjectLinesRaw)
      ? normalizeBriefProjectLines(modularProjectLinesRaw, fallbackDescription)
      : [];
    const standardProjectLines = Array.isArray(standardProjectLinesRaw)
      ? normalizeBriefProjectLines(standardProjectLinesRaw, fallbackDescription)
      : [];
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
    const standardTechnologies = normalizeStringList(standardBriefSource?.technologies);
    const standardTeamStructure = normalizeTeamStructure(standardBriefSource?.team_structure);
    const standardMilestones = normalizeMilestoneList(standardBriefSource?.milestones);
    const modularSpecificRequirements = normalizeStringList(modularBriefSource?.specific_requirements);
    const modularTechnologies = normalizeStringList(modularBriefSource?.technologies);
    const modularTeamStructure = normalizeTeamStructure(modularBriefSource?.team_structure);
    const modularMilestones = normalizeMilestoneList(modularBriefSource?.milestones);
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
        project_lines: modularProjectLines.length > 0 ? modularProjectLines : project_lines,
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
    final_brief_full = {
      ...(fullBriefSource as AiBriefResponse['final_brief_full']),
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
    questions.length > 0 ||
    Boolean(recommendedProviders) ||
    Boolean(legacyOtherProviders) ||
    Boolean(otherProvidersByService) ||
    payloadTruncated ||
    payloadTrimmedSections.length > 0 ||
    Boolean(statusRaw);
  return hasUsefulPayload ? normalized : null;
};

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  const payload = toObject(error);
  if (payload) {
    const message = toString(payload.message) || toString(payload.error);
    if (message) {
      return message;
    }
  }

  return fallback;
};

const buildInitialConversation = (
  intent: string,
  selectedServices: RecommendedServiceCandidate[]
): AiAssistantMessage[] => {
  const serviceLines = selectedServices
    .map(
      (service, index) =>
        `${index + 1}. ${service.service_name} (${getProviderLabel(service.delivery_provider)})`
    )
    .join('\n');

  const content = [
    `Client intent: ${intent}`,
    serviceLines ? `Recommended services:\n${serviceLines}` : '',
    'Generate a modular project brief grouped by project lines with milestone amounts and budget percentages.',
  ]
    .filter(Boolean)
    .join('\n\n');

  return [{ role: 'user', content }];
};

const buildProjectTitle = (intent: string, aiTitle?: string): string => {
  const normalizedAiTitle = toString(aiTitle);
  if (normalizedAiTitle) {
    return normalizedAiTitle;
  }

  const normalizedIntent = toString(intent);
  if (!normalizedIntent) {
    return 'Modular Project';
  }

  if (normalizedIntent.length <= 80) {
    return normalizedIntent;
  }

  return `${normalizedIntent.slice(0, 77)}...`;
};

export default function NewProjectPage() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const { user, loading, userLoading } = useAuth();
  const { data: groupedServices } = useGetServicesGroupedByCategory();

  const [step, setStep] = useState<WizardStep>('intent');
  const [intent, setIntent] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedDraft = window.sessionStorage.getItem(AI_BRIEF_DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft) as AiBriefFormDraft;
        // Optionally populate state from draft if needed immediately,
        // or clear it if it's meant to be a one-time handoff.
        // For now, we just ensure we can read it if we want to pre-fill specific fields.
        // However, the prompt implies we should "handle" it.
        // Let's assume we might want to set the brief result if it exists.

        if (draft.recommended_providers) {
          setRecommendedProviders(draft.recommended_providers);
        }
        if (draft.other_providers_by_service && Array.isArray(draft.other_providers_by_service)) {
          setOtherProviders(draft.other_providers_by_service);
        } else if (draft.other_providers && Array.isArray(draft.other_providers as unknown)) {
          setOtherProviders(draft.other_providers as unknown as AiBriefOtherProvidersByService);
        }
        if (draft.selected_providers) {
          setSelectedProviders(draft.selected_providers);
        }

        // We might also want to set other brief fields if they are empty
        if (draft.title) {
          // Logic to set title if this page had a title state, but it seems creatingProject payload uses it directly.
          // Since this page manages the wizard state, we might need to map the draft to the wizard state
          // OR just hold onto the draft data to use in payload creation.
        }

        // Clear storage after reading so it doesn't persist inappropriately
        window.sessionStorage.removeItem(AI_BRIEF_DRAFT_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Failed to parse saved brief draft:', error);
    }
  }, []);

  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);
  const [selectedServiceIndexes, setSelectedServiceIndexes] = useState<number[]>([]);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);

  const [briefMessages, setBriefMessages] = useState<AiAssistantMessage[]>([]);
  const [briefStatus, setBriefStatus] = useState<'IDLE' | AiBriefResponse['status']>('IDLE');
  const [briefQuestions, setBriefQuestions] = useState<string[]>([]);
  const [briefAnswer, setBriefAnswer] = useState('');
  const [briefResult, setBriefResult] =
    useState<NonNullable<AiBriefResponse['final_brief']> | null>(null);
  const [briefSubscriptionError, setBriefSubscriptionError] = useState<string | null>(null);
  const [briefModularDetails, setBriefModularDetails] =
    useState<AiBriefResponse['final_brief_modular'] | null>(null);
  const [briefFullDetails, setBriefFullDetails] =
    useState<AiBriefResponse['final_brief_full'] | null>(null);
  const [briefText, setBriefText] = useState('');
  const [briefDebugResponseJson, setBriefDebugResponseJson] = useState('');
  const [briefPayloadTruncated, setBriefPayloadTruncated] = useState(false);
  const [briefPayloadTrimmedSections, setBriefPayloadTrimmedSections] = useState<string[]>([]);

  const [recommendedProviders, setRecommendedProviders] =
    useState<AiBriefRecommendedProviders | undefined>(undefined);
  const [otherProviders, setOtherProviders] =
    useState<AiBriefOtherProvidersByService | undefined>(undefined);
  const [selectedProviders, setSelectedProviders] = useState<AiBriefProvider[]>([]);

  const [totalBudget, setTotalBudget] = useState('');
  const [editableDuration, setEditableDuration] = useState('');
  const [editablePaymentPlan, setEditablePaymentPlan] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);

  const briefRequestSentRef = useRef(false);
  const briefSubscriptionRef = useRef<{
    channelName: string;
    channel: {
      listen: (event: string, callback: (payload: unknown) => void) => void;
      stopListening: (event: string) => void;
    };
    echo: ReturnType<typeof getEcho>;
  } | null>(null);

  const transitionTo = useCallback((nextStep: WizardStep) => {
    setStep((currentStep) => {
      if (STEP_TRANSITIONS[currentStep].includes(nextStep)) {
        return nextStep;
      }
      return currentStep;
    });
  }, []);

  const serviceCatalogById = useMemo(() => {
    const map = new Map<string, ServiceCatalogEntry>();

    const addService = (candidate: unknown) => {
      const service = toObject(candidate);
      if (!service) {
        return;
      }

      const serviceId = service.id;
      if (typeof serviceId !== 'string' && typeof serviceId !== 'number') {
        return;
      }

      const existing = map.get(String(serviceId)) ?? {};
      const rawProvider = service.delivery_provider ?? service.provider;
      const hasRawProvider = typeof rawProvider === 'string' && rawProvider.trim().length > 0;
      map.set(String(serviceId), {
        name: toString(service.name) || existing.name,
        description: toString(service.description) || existing.description,
        delivery_provider: hasRawProvider
          ? normalizeDeliveryProvider(rawProvider)
          : existing.delivery_provider,
      });
    };

    const walk = (node: unknown) => {
      if (Array.isArray(node)) {
        node.forEach((entry) => walk(entry));
        return;
      }

      const objectNode = toObject(node);
      if (!objectNode) {
        return;
      }

      if ('id' in objectNode && 'name' in objectNode) {
        addService(objectNode);
      }

      Object.values(objectNode).forEach((value) => walk(value));
    };

    walk(groupedServices);

    return map;
  }, [groupedServices]);

  const recommendationCards = useMemo<RecommendedCard[]>(() => {
    if (!recommendation) {
      return [];
    }

    return recommendation.services.map((service, index) => {
      const serviceId = service.service_id;
      const catalogData =
        typeof serviceId === 'string' || typeof serviceId === 'number'
          ? serviceCatalogById.get(String(serviceId))
          : undefined;

      return {
        ...service,
        description: service.description || catalogData?.description,
        key: `${service.service_name}-${service.delivery_provider}-${index}`,
      };
    });
  }, [recommendation, serviceCatalogById]);

  const recommendationDisplayCards = useMemo(
    () => recommendationCards.map((service, index) => ({ ...service, index })),
    [recommendationCards]
  );

  const recommendedCards = useMemo(
    () => recommendationDisplayCards.filter((service) => !isAlternativeService(service)),
    [recommendationDisplayCards]
  );

  const alternativeCards = useMemo(
    () => recommendationDisplayCards.filter((service) => isAlternativeService(service)),
    [recommendationDisplayCards]
  );

  const selectedServices = useMemo(() => {
    if (!recommendation) {
      return [];
    }

    const indexes = new Set(selectedServiceIndexes);
    return recommendation.services.filter((_service, index) => indexes.has(index));
  }, [recommendation, selectedServiceIndexes]);

  const stepIndex = useMemo(
    () => WIZARD_STEPS.findIndex((wizardStep) => wizardStep.id === step),
    [step]
  );

  const budgetValue = useMemo(() => {
    const parsed = Number(totalBudget);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [totalBudget]);

  const reviewLines = useMemo(() => {
    if (!briefResult) {
      return [];
    }

    return briefResult.project_lines.map((line) => {
      const percentage = Number(line.budget_percentage || 0);
      const budgetAllocation =
        budgetValue > 0 && percentage > 0
          ? Number(((budgetValue * percentage) / 100).toFixed(2))
          : 0;

      return {
        ...line,
        budget_allocation: budgetAllocation,
      };
    });
  }, [briefResult, budgetValue]);

  const briefingDisplay = useMemo(() => {
    const duration =
      briefResult?.recommended_duration ||
      briefResult?.project_duration ||
      briefResult?.duration ||
      briefModularDetails?.recommended_duration ||
      briefModularDetails?.project_duration ||
      briefModularDetails?.duration ||
      briefFullDetails?.recommended_duration ||
      briefFullDetails?.project_duration ||
      briefFullDetails?.duration ||
      '';

    const paymentPlan =
      briefResult?.payment_plan ||
      briefModularDetails?.payment_plan ||
      briefFullDetails?.payment_plan ||
      '';

    const currency =
      briefResult?.currency ||
      briefModularDetails?.currency ||
      briefFullDetails?.currency ||
      '';

    const description =
      briefResult?.description ||
      briefModularDetails?.description ||
      briefFullDetails?.description ||
      '';

    const overview =
      briefModularDetails?.overview ||
      briefFullDetails?.overview ||
      '';

    const clientGoal =
      briefModularDetails?.client_goal ||
      briefFullDetails?.client_goal ||
      '';

    const targetAudience =
      briefModularDetails?.target_audience ||
      briefFullDetails?.target_audience ||
      '';

    const specificRequirements =
      (briefResult?.specific_requirements && briefResult.specific_requirements.length > 0
        ? briefResult.specific_requirements
        : briefModularDetails?.specific_requirements &&
            briefModularDetails.specific_requirements.length > 0
          ? briefModularDetails.specific_requirements
          : briefFullDetails?.specific_requirements) ?? [];

    const technologies =
      (briefResult?.technologies && briefResult.technologies.length > 0
        ? briefResult.technologies
        : briefModularDetails?.technologies && briefModularDetails.technologies.length > 0
          ? briefModularDetails.technologies
          : briefFullDetails?.technologies) ?? [];

    const teamStructure =
      (briefResult?.team_structure && briefResult.team_structure.length > 0
        ? briefResult.team_structure
        : briefModularDetails?.team_structure && briefModularDetails.team_structure.length > 0
          ? briefModularDetails.team_structure
          : briefFullDetails?.team_structure) ?? [];

    const milestones =
      (briefResult?.milestones && briefResult.milestones.length > 0
        ? briefResult.milestones
        : briefModularDetails?.milestones && briefModularDetails.milestones.length > 0
          ? briefModularDetails.milestones
          : briefFullDetails?.milestones) ?? [];

    return {
      title: briefResult?.title || briefModularDetails?.title || briefFullDetails?.title || '',
      description,
      overview,
      clientGoal,
      targetAudience,
      budget: briefResult?.budget ?? briefModularDetails?.budget ?? briefFullDetails?.budget,
      budgetMin: briefResult?.budget_min ?? briefModularDetails?.budget_min ?? briefFullDetails?.budget_min,
      budgetMax: briefResult?.budget_max ?? briefModularDetails?.budget_max ?? briefFullDetails?.budget_max,
      duration,
      paymentPlan,
      currency,
      technologies,
      specificRequirements,
      teamStructure,
      milestones,
    };
  }, [briefResult, briefModularDetails, briefFullDetails]);

  useEffect(() => {
    const nextDuration = toString(briefingDisplay.duration);
    if (nextDuration) {
      setEditableDuration(nextDuration);
    }
  }, [briefingDisplay.duration]);

  useEffect(() => {
    const nextPaymentPlan = toString(briefingDisplay.paymentPlan).toUpperCase();
    if (nextPaymentPlan) {
      setEditablePaymentPlan(nextPaymentPlan);
    }
  }, [briefingDisplay.paymentPlan]);

  const effectiveDuration = useMemo(
    () => toString(editableDuration) || toString(briefingDisplay.duration),
    [editableDuration, briefingDisplay.duration]
  );

  const effectiveDurationMonths = useMemo(
    () => parseDurationToMonths(effectiveDuration),
    [effectiveDuration]
  );

  const requiresMilestonesByDuration = useMemo(
    () => (effectiveDurationMonths !== null ? effectiveDurationMonths > 3 : false),
    [effectiveDurationMonths]
  );

  const canEditPaymentPlanByDuration = useMemo(
    () => !requiresMilestonesByDuration,
    [requiresMilestonesByDuration]
  );

  const effectivePaymentPlan = useMemo(() => {
    const normalizedInput = toString(editablePaymentPlan).toUpperCase();
    const normalizedBrief = toString(briefingDisplay.paymentPlan).toUpperCase();

    if (canEditPaymentPlanByDuration) {
      return normalizedInput || normalizedBrief;
    }

    return normalizedBrief || normalizedInput || 'MILESTONE';
  }, [editablePaymentPlan, briefingDisplay.paymentPlan, canEditPaymentPlanByDuration]);

  const linesMissingMilestones = useMemo(
    () =>
      reviewLines
        .filter((line) => !Array.isArray(line.milestones) || line.milestones.length === 0)
        .map((line) => line.service_name),
    [reviewLines]
  );

  const briefingProjectLines = useMemo(() => {
    if (briefModularDetails?.project_lines && briefModularDetails.project_lines.length > 0) {
      return briefModularDetails.project_lines;
    }

    if (briefResult?.project_lines && briefResult.project_lines.length > 0) {
      return briefResult.project_lines;
    }

    if (briefFullDetails?.project_lines && briefFullDetails.project_lines.length > 0) {
      return briefFullDetails.project_lines;
    }

    return [];
  }, [briefModularDetails, briefResult, briefFullDetails]);

  const fullBusinessAnalysis = useMemo(() => {
    return briefFullDetails?.business_analysis ?? briefResult?.business_analysis;
  }, [briefFullDetails, briefResult]);

  const fullTargetUsers = useMemo(
    () => normalizeFlexibleStringList(fullBusinessAnalysis?.target_users),
    [fullBusinessAnalysis]
  );

  const fullFeatureBusinessValue = useMemo(
    () => normalizeFlexibleStringList(fullBusinessAnalysis?.feature_business_value),
    [fullBusinessAnalysis]
  );

  const fullTechnicalRisks = useMemo(
    () => normalizeFlexibleStringList(briefFullDetails?.technical_risks ?? briefResult?.technical_risks),
    [briefFullDetails, briefResult]
  );

  const fullTechStackItems = useMemo(() => {
    const recommendedStack = briefFullDetails?.tech_stack?.recommended_stack;
    return Array.isArray(recommendedStack) ? recommendedStack : [];
  }, [briefFullDetails]);

  const fullComplexityEstimationEntries = useMemo(
    () => Object.entries(briefFullDetails?.complexity_estimation ?? briefResult?.complexity_estimation ?? {}),
    [briefFullDetails, briefResult]
  );

  const fullComplexityEntries = useMemo(
    () => Object.entries(briefFullDetails?.complexity ?? {}),
    [briefFullDetails]
  );

  const fullTeamRecommendationEntries = useMemo(
    () => Object.entries(briefFullDetails?.team_recommendation ?? {}),
    [briefFullDetails]
  );

  const recommendedProviderEntries = useMemo(
    () => Object.entries(recommendedProviders ?? {}),
    [recommendedProviders]
  );

  const otherProvidersByServiceEntries = useMemo(
    () => (Array.isArray(otherProviders) ? otherProviders : []),
    [otherProviders]
  );

  const providerSelectionGroups = useMemo(() => {
    const order: string[] = [];
    const groups = new Map<
      string,
      {
        service_name: string;
        service_id?: string | number;
        recommended: AiBriefProvider[];
        others: AiBriefProvider[];
      }
    >();

    const ensureGroup = (serviceName: unknown, serviceId?: unknown) => {
      const normalizedServiceName = toString(serviceName);
      if (!normalizedServiceName) {
        return null;
      }

      const serviceKey = getServiceKey(normalizedServiceName);
      if (!serviceKey) {
        return null;
      }

      if (!groups.has(serviceKey)) {
        order.push(serviceKey);
        groups.set(serviceKey, {
          service_name: normalizedServiceName,
          ...(typeof serviceId === 'string' || typeof serviceId === 'number'
            ? { service_id: serviceId }
            : {}),
          recommended: [],
          others: [],
        });
      }

      return groups.get(serviceKey) ?? null;
    };

    briefingProjectLines.forEach((line) => {
      ensureGroup(line.service_name);
    });

    recommendedProviderEntries.forEach(([serviceName, providers]) => {
      const group = ensureGroup(serviceName);
      if (!group || !Array.isArray(providers)) {
        return;
      }
      group.recommended = dedupeProviders([...group.recommended, ...providers]);
    });

    otherProvidersByServiceEntries.forEach((entry) => {
      const group = ensureGroup(entry.service_name, entry.service_id);
      if (!group) {
        return;
      }

      const providers = Array.isArray(entry.providers?.data)
        ? entry.providers.data
        : [];

      group.others = dedupeProviders([...group.others, ...providers]);
    });

    return order
      .map((serviceKey) => {
        const group = groups.get(serviceKey);
        if (!group) {
          return null;
        }

        const recommendedIds = new Set(
          group.recommended
            .map((provider) => getProviderId(provider))
            .filter((providerId): providerId is number => providerId !== null)
        );

        const filteredOthers = group.others.filter((provider) => {
          const providerId = getProviderId(provider);
          if (providerId === null) {
            return true;
          }
          return !recommendedIds.has(providerId);
        });

        return {
          ...group,
          others: filteredOthers,
        };
      })
      .filter(
        (
          group
        ): group is {
          service_name: string;
          service_id?: string | number;
          recommended: AiBriefProvider[];
          others: AiBriefProvider[];
        } => group !== null
      );
  }, [briefingProjectLines, recommendedProviderEntries, otherProvidersByServiceEntries]);

  const isProviderSelected = useCallback(
    (serviceName: string, provider: AiBriefProvider) => {
      const providerId = getProviderId(provider);
      if (providerId === null) {
        return false;
      }

      const serviceKey = getServiceKey(serviceName);

      return selectedProviders.some((entry) => {
        const entryId = getProviderId(entry);
        if (entryId === null || entryId !== providerId) {
          return false;
        }

        const entryServiceKey = getServiceKey((entry as { service_name?: unknown }).service_name);
        return entryServiceKey === serviceKey || !entryServiceKey;
      });
    },
    [selectedProviders]
  );

  const selectedProvidersCountByService = useMemo(() => {
    const counts = new Map<string, number>();
    selectedProviders.forEach((provider) => {
      const serviceKey = getServiceKey((provider as { service_name?: unknown }).service_name);
      if (!serviceKey) {
        return;
      }
      counts.set(serviceKey, (counts.get(serviceKey) ?? 0) + 1);
    });
    return counts;
  }, [selectedProviders]);

  const handleToggleProvider = useCallback((serviceName: string, provider: AiBriefProvider) => {
    const providerId = getProviderId(provider);
    if (providerId === null) {
      return;
    }

    const serviceKey = getServiceKey(serviceName);

    setSelectedProviders((current) => {
      const exists = current.some((entry) => {
        const entryId = getProviderId(entry);
        if (entryId === null || entryId !== providerId) {
          return false;
        }

        const entryServiceKey = getServiceKey((entry as { service_name?: unknown }).service_name);
        return entryServiceKey === serviceKey || !entryServiceKey;
      });

      if (exists) {
        return current.filter((entry) => {
          const entryId = getProviderId(entry);
          if (entryId === null || entryId !== providerId) {
            return true;
          }

          const entryServiceKey = getServiceKey((entry as { service_name?: unknown }).service_name);
          return entryServiceKey !== serviceKey && entryServiceKey !== '';
        });
      }

      return [
        ...current,
        {
          ...provider,
          service_name: serviceName,
        },
      ];
    });
  }, []);

  const cleanupBriefSubscription = useCallback(() => {
    const activeSubscription = briefSubscriptionRef.current;
    if (!activeSubscription) {
      return;
    }

    AI_BRIEF_GENERATED_EVENT_NAMES.forEach((eventName) => {
      activeSubscription.channel.stopListening(eventName);
    });

    AI_BRIEF_FAILED_EVENT_NAMES.forEach((eventName) => {
      activeSubscription.channel.stopListening(eventName);
    });

    activeSubscription.echo?.leave(activeSubscription.channelName);

    const privateChannelName = `private-${activeSubscription.channelName}`;
    const echoWithLeaveChannel = activeSubscription.echo as
      | (ReturnType<typeof getEcho> & { leaveChannel?: (channelName: string) => void })
      | null;

    if (echoWithLeaveChannel && typeof echoWithLeaveChannel.leaveChannel === 'function') {
      echoWithLeaveChannel.leaveChannel(privateChannelName);
    }

    briefSubscriptionRef.current = null;
  }, []);

  const applyBriefResponse = useCallback((response: AiBriefResponse) => {
    setBriefStatus(response.status);
    setBriefPayloadTruncated(Boolean(response.payload_truncated));
    setBriefPayloadTrimmedSections(response.payload_trimmed_sections ?? []);

    if (response.status === 'CLARIFY') {
      setBriefQuestions(response.questions ?? []);
      return;
    }

    if (response.status === 'FINAL') {
      const finalBrief = response.final_brief ?? response.final_brief_modular ?? null;
      if (finalBrief) {
        setBriefResult(finalBrief);
      }

      setBriefModularDetails(response.final_brief_modular ?? null);
      setBriefFullDetails(response.final_brief_full ?? null);
      setBriefText(response.final_brief_text ?? '');
      setBriefQuestions([]);

      if (response.recommended_providers) {
        setRecommendedProviders(response.recommended_providers);
        const autoSelectedProviders = Object.entries(response.recommended_providers)
          .flatMap(([serviceName, providers]) =>
            Array.isArray(providers)
              ? providers.slice(0, 1).map((provider) => ({
                ...provider,
                service_name: serviceName,
              }))
              : []
          )
          .filter(
            (provider): provider is AiBriefProvider & { service_name: string } =>
              Boolean(provider && provider.id)
          );
        if (autoSelectedProviders.length > 0) {
          const unique = new Map<string, AiBriefProvider>();
          autoSelectedProviders.forEach((provider) => {
            const providerId = getProviderId(provider);
            const serviceName = getServiceKey(
              (provider as { service_name?: unknown }).service_name
            );
            if (providerId !== null) {
              unique.set(`${serviceName}::${providerId}`, provider);
            }
          });
          setSelectedProviders(Array.from(unique.values()));
        }
      } else {
        setRecommendedProviders(undefined);
        setSelectedProviders([]);
      }
      if (response.other_providers_by_service) {
        setOtherProviders(response.other_providers_by_service);
      } else if (response.other_providers && Array.isArray(response.other_providers as unknown)) {
        setOtherProviders(response.other_providers as unknown as AiBriefOtherProvidersByService);
      } else {
        setOtherProviders(undefined);
      }

      const autoBudget =
        toNumber(finalBrief?.budget) ??
        toNumber(response.final_brief_full?.budget);

      if (autoBudget !== null) {
        setTotalBudget((currentValue) =>
          currentValue.trim() ? currentValue : String(autoBudget)
        );
      }
      return;
    }

    if (response.status === 'PROCESSING') {
      setBriefQuestions([]);
    }
  }, []);

  const loadBriefResultById = useCallback(
    async (briefResultId: number | string) => {
      const response = await aiService.getBriefBuilderResult(briefResultId);
      setBriefDebugResponseJson(toJsonDebugString(response));

      const normalizedResponse = normalizeAiBriefResponse(response);
      if (normalizedResponse) {
        applyBriefResponse(normalizedResponse);
      }
    },
    [applyBriefResponse]
  );

  useEffect(
    () => () => {
      cleanupBriefSubscription();
    },
    [cleanupBriefSubscription]
  );

  useEffect(() => {
    if (step !== 'briefing') {
      cleanupBriefSubscription();
      return;
    }

    const userId = toString(user?.id);
    if (!userId) {
      return;
    }

    const echo = getEcho();
    if (!echo) {
      setBriefSubscriptionError('Canalul de realtime nu este disponibil momentan.');
      return;
    }

    setBriefSubscriptionError(null);

    const channelName = `user.${userId}.briefs`;
    const channel = echo.private(channelName);

    const handleGenerated = (payload: unknown) => {
      setBriefDebugResponseJson(toJsonDebugString(payload));
      const response = normalizeAiBriefResponse(payload);
      if (!response) {
        const briefResultId = extractBriefResultId(payload);
        if (briefResultId !== null) {
          setBriefStatus('PROCESSING');
          void loadBriefResultById(briefResultId).catch((error) => {
            setBriefStatus('CLARIFY');
            toast.error(
              extractErrorMessage(
                error,
                'Nu am putut încărca rezultatul final al brief-ului.'
              )
            );
          });
        }
        return;
      }

      applyBriefResponse(response);

      if (response.status === 'PROCESSING') {
        const briefResultId = response.brief_result_id ?? extractBriefResultId(payload);
        if (briefResultId !== null) {
          void loadBriefResultById(briefResultId).catch((error) => {
            setBriefStatus('CLARIFY');
            toast.error(
              extractErrorMessage(
                error,
                'Nu am putut încărca rezultatul final al brief-ului.'
              )
            );
          });
        }
      }
    };

    const handleFailed = (payload: unknown) => {
      const source = toObject(payload);
      const message =
        toString(source?.errorMessage) ||
        toString(source?.error_message) ||
        toString(source?.message) ||
        toString(source?.error) ||
        'Generarea brief-ului a eșuat.';

      setBriefStatus('CLARIFY');
      toast.error(message);
    };

    AI_BRIEF_GENERATED_EVENT_NAMES.forEach((eventName) => {
      channel.listen(eventName, handleGenerated);
    });

    AI_BRIEF_FAILED_EVENT_NAMES.forEach((eventName) => {
      channel.listen(eventName, handleFailed);
    });

    briefSubscriptionRef.current = {
      channelName,
      channel,
      echo,
    };

    return () => {
      cleanupBriefSubscription();
    };
  }, [step, user?.id, applyBriefResponse, cleanupBriefSubscription, loadBriefResultById]);

  const requestBriefBuilder = useCallback(
    async (messages: AiAssistantMessage[]) => {
      if (messages.length === 0) {
        return;
      }

      setBriefStatus('PROCESSING');
      try {
        const response = await aiService.buildBrief({
          locale,
          messages,
        });
        setBriefDebugResponseJson(toJsonDebugString(response));

        const normalizedResponse = normalizeAiBriefResponse(response);
        if (normalizedResponse) {
          applyBriefResponse(normalizedResponse);

          if (normalizedResponse.status === 'PROCESSING') {
            const briefResultId =
              normalizedResponse.brief_result_id ?? extractBriefResultId(response);
            if (briefResultId !== null) {
              try {
                await loadBriefResultById(briefResultId);
              } catch {
                // Keep waiting for realtime event fallback.
              }
            }
          }

          return;
        }

        const briefResultId = extractBriefResultId(response);
        if (briefResultId !== null) {
          try {
            await loadBriefResultById(briefResultId);
          } catch {
            // Keep waiting for realtime event fallback.
          }
        }
      } catch (error) {
        setBriefStatus('CLARIFY');
        toast.error(extractErrorMessage(error, 'Nu am putut genera brief-ul.'));
      }
    },
    [applyBriefResponse, loadBriefResultById, locale]
  );

  useEffect(() => {
    if (step !== 'briefing') {
      return;
    }

    if (briefRequestSentRef.current) {
      return;
    }

    if (briefMessages.length === 0) {
      return;
    }

    briefRequestSentRef.current = true;
    void requestBriefBuilder(briefMessages);
  }, [briefMessages, requestBriefBuilder, step]);

  const handleRequestRecommendation = async () => {
    const normalizedIntent = intent.trim();
    if (!normalizedIntent) {
      toast.error('Completează intenția proiectului înainte să continui.');
      return;
    }

    setLoadingRecommendation(true);
    try {
      const response = await aiService.recommendServices({
        brief: normalizedIntent,
      });

      const normalized = normalizeRecommendationResponse(
        response as AiRecommendServicesResponse,
        serviceCatalogById
      );

      if (normalized.services.length === 0) {
        toast.error('AI-ul nu a returnat servicii. Încearcă să adaugi mai mult context.');
        return;
      }

      setRecommendation(normalized);
      const preferredSelection = normalized.services
        .map((service, index) => (isAlternativeService(service) ? -1 : index))
        .filter((index) => index >= 0);
      setSelectedServiceIndexes(
        preferredSelection.length > 0
          ? preferredSelection
          : normalized.services.map((_service, index) => index)
      );
      setBriefMessages([]);
      setBriefResult(null);
      setBriefModularDetails(null);
      setBriefFullDetails(null);
      setBriefText('');
      setBriefStatus('IDLE');
      setBriefQuestions([]);
      setBriefAnswer('');
      setBriefDebugResponseJson('');
      setBriefPayloadTruncated(false);
      setBriefPayloadTrimmedSections([]);
      setRecommendedProviders(undefined);
      setOtherProviders(undefined);
      setSelectedProviders([]);
      setTotalBudget('');
      setEditableDuration('');
      setEditablePaymentPlan('');
      briefRequestSentRef.current = false;
      transitionTo('recommendation');
      toast.success('Recomandarea AI a fost generată.');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Nu am putut genera recomandarea de servicii.'));
    } finally {
      setLoadingRecommendation(false);
    }
  };

  const handleToggleService = (index: number) => {
    setSelectedServiceIndexes((current) => {
      if (current.includes(index)) {
        return current.filter((entry) => entry !== index);
      }
      return [...current, index].sort((a, b) => a - b);
    });
  };

  const handleConfirmRecommendation = () => {
    if (selectedServices.length === 0) {
      toast.error('Selectează cel puțin o linie de proiect.');
      return;
    }

    const initialMessages = buildInitialConversation(intent.trim(), selectedServices);
    setBriefMessages(initialMessages);
    setBriefQuestions([]);
    setBriefResult(null);
    setBriefModularDetails(null);
    setBriefFullDetails(null);
    setBriefText('');
    setBriefStatus('IDLE');
    setBriefAnswer('');
    setBriefPayloadTruncated(false);
    setBriefPayloadTrimmedSections([]);
    setRecommendedProviders(undefined);
    setOtherProviders(undefined);
    setSelectedProviders([]);
    setEditableDuration('');
    setEditablePaymentPlan('');
    briefRequestSentRef.current = false;
    transitionTo('briefing');
  };

  const handleSendClarification = async () => {
    const normalizedAnswer = briefAnswer.trim();
    if (!normalizedAnswer) {
      toast.error('Scrie răspunsul pentru clarificare.');
      return;
    }

    const nextMessages = [...briefMessages, { role: 'user', content: normalizedAnswer } satisfies AiAssistantMessage];
    setBriefMessages(nextMessages);
    setBriefAnswer('');
    await requestBriefBuilder(nextMessages);
  };

  const createProjectPayload = useMemo(() => {
    if (!briefResult) {
      return null;
    }

    const serviceIndex = new Map(
      selectedServices.map((service) => [
        `${service.service_name.toLowerCase()}::${service.delivery_provider}`,
        service.service_id,
      ])
    );

    const projectLines = reviewLines.map((line, index) => {
      const serviceKey = `${line.service_name.toLowerCase()}::${line.delivery_provider}`;
      const serviceId = serviceIndex.get(serviceKey);

      return {
        id: `line-${index + 1}`,
        ...(typeof serviceId === 'string' || typeof serviceId === 'number'
          ? { service_id: serviceId }
          : {}),
        service_name: line.service_name,
        delivery_provider: line.delivery_provider,
        status: 'pending',
        price: line.budget_allocation,
        budget_allocation: Number(line.budget_percentage || 0),
        milestones: line.milestones,
        description: line.description,
        budget_percentage: line.budget_percentage,
      };
    });

    return {
      ...(typeof user?.id === 'string' || typeof user?.id === 'number'
        ? { clientId: user.id }
        : {}),
      title: buildProjectTitle(intent, briefResult.title),
      description: intent.trim(),
      budget: budgetValue,
      ...(briefingDisplay.currency ? { currency: briefingDisplay.currency } : {}),
      ...(effectivePaymentPlan ? { paymentPlan: effectivePaymentPlan } : {}),
      ...(effectiveDuration ? { duration: effectiveDuration } : {}),
      brief: {
        title: briefResult.title,
        project_lines: briefResult.project_lines,
        ...(effectiveDuration
          ? {
            duration: effectiveDuration,
            recommended_duration: effectiveDuration,
            project_duration: effectiveDuration,
          }
          : {}),
        ...(effectivePaymentPlan ? { payment_plan: effectivePaymentPlan } : {}),
        selected_providers: selectedProviders,
      },
      project_lines: projectLines,
    };
  }, [
    briefResult,
    selectedServices,
    reviewLines,
    intent,
    budgetValue,
    user?.id,
    briefingDisplay.currency,
    selectedProviders,
    effectivePaymentPlan,
    effectiveDuration,
  ]);

  const createProjectPayloadDebugJson = useMemo(
    () => (createProjectPayload ? toJsonDebugString(createProjectPayload) : ''),
    [createProjectPayload]
  );

  const handleCreateProject = async () => {
    if (!briefResult || !createProjectPayload) {
      toast.error('Brief-ul final nu este disponibil.');
      return;
    }

    if (!Number.isFinite(budgetValue) || budgetValue <= 0) {
      toast.error('Introdu un buget total valid pentru distribuția pe linii.');
      return;
    }

    if (!effectiveDuration) {
      toast.error('Completează durata proiectului înainte de creare.');
      return;
    }

    if (!effectivePaymentPlan) {
      toast.error('Selectează planul de plată înainte de creare.');
      return;
    }

    if (requiresMilestonesByDuration && linesMissingMilestones.length > 0) {
      toast.error(
        `Pentru durate mai mari de 3 luni, fiecare linie trebuie să aibă milestones. Lipsesc pentru: ${linesMissingMilestones.join(', ')}.`
      );
      return;
    }

    setCreatingProject(true);

    try {
      const response = await projectsService.createProject(createProjectPayload, {
        language: locale,
      });

      const createdProject = projectsService.extractCreatedProject(response);
      const data = toObject(response);
      const nestedData = toObject(data?.data);
      const nestedProject = toObject(data?.project);

      const projectIdentifier =
        toString(createdProject?.slug) ||
        toString(createdProject?.id) ||
        toString(data?.project_url) ||
        toString(data?.slug) ||
        toString(data?.id) ||
        toString(nestedData?.project_url) ||
        toString(nestedData?.slug) ||
        toString(nestedData?.id) ||
        toString(nestedProject?.project_url) ||
        toString(nestedProject?.slug) ||
        toString(nestedProject?.id);

      toast.success('Proiectul modular a fost creat cu succes.');

      if (projectIdentifier) {
        router.push(`/projects/${projectIdentifier}`);
        return;
      }

      router.push('/projects');
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Nu am putut crea proiectul.'));
    } finally {
      setCreatingProject(false);
    }
  };

  if (loading || userLoading) {
    return (
      <div className="min-h-screen bg-white text-[#0F172A] dark:bg-[#070C14] dark:text-[#E6EDF3]">
        <TrustoraThemeStyles />
        <Header />
        <main className="container mx-auto flex min-h-[70vh] items-center justify-center px-4 pt-24">
          <Card className="w-full max-w-lg">
            <CardContent className="flex items-center gap-3 p-6">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm text-muted-foreground">Se încarcă wizard-ul de creare proiect...</span>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white text-[#0F172A] dark:bg-[#070C14] dark:text-[#E6EDF3]">
        <TrustoraThemeStyles />
        <Header />
        <main className="container mx-auto px-4 pt-24">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between gap-3">
              <span>Trebuie să fii autentificat pentru a crea un proiect modular.</span>
              <Button asChild size="sm">
                <Link href="/auth/signin">Sign in</Link>
              </Button>
            </AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#0F172A] dark:bg-[#070C14] dark:text-[#E6EDF3]">
      <TrustoraThemeStyles />
      <Header />

      <main className="container mx-auto px-4 pb-12 pt-24">
        <div className="mx-auto max-w-6xl space-y-6">
          <Card className="border-slate-200 shadow-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Sparkles className="h-5 w-5 text-emerald-500" />
                Nexora Project Lines Wizard
              </CardTitle>
              <CardDescription>
                Creează proiecte modulare cu recomandare AI, briefing pe linii și livrare multi-track.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-5">
                {WIZARD_STEPS.map((wizardStep, index) => {
                  const active = step === wizardStep.id;
                  const done = stepIndex > index;

                  return (
                    <div
                      key={wizardStep.id}
                      className={`rounded-lg border px-3 py-2 text-sm transition ${active
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200'
                        : done
                          ? 'border-slate-300 bg-slate-100 text-slate-700 dark:border-[#2A3A52] dark:bg-[#0F172A] dark:text-[#A3ADC2]'
                          : 'border-slate-200 bg-white text-slate-500 dark:border-[#1E2A3D] dark:bg-[#0B1220] dark:text-[#6B778D]'
                        }`}
                    >
                      <div className="text-[11px] font-medium uppercase tracking-wide">Pas {index + 1}</div>
                      <div className="font-semibold">{wizardStep.label}</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {step === 'intent' ? (
            <Card className="border-slate-200 shadow-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]">
              <CardHeader>
                <CardTitle>Pasul 1: Intenție</CardTitle>
                <CardDescription>
                  Descrie ce vrei să construiești, iar AI-ul recomandă pachetul optim de servicii.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="intent">Ce dorești să construiești?</Label>
                  <Textarea
                    id="intent"
                    rows={7}
                    value={intent}
                    onChange={(event) => setIntent(event.target.value)}
                    placeholder="Ex: Vreau să lansez o platformă SaaS pentru managementul clinicilor, cu dashboard analytics și onboarding pentru utilizatori."
                    className="resize-none"
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleRequestRecommendation} disabled={loadingRecommendation}>
                    {loadingRecommendation ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generăm recomandarea...
                      </>
                    ) : (
                      <>
                        Continuă la recomandare
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {step === 'recommendation' ? (
            <Card className="border-slate-200 shadow-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]">
              <CardHeader>
                <CardTitle>Pasul 2: Recomandare servicii</CardTitle>
                <CardDescription>
                  Confirmă liniile recomandate pentru proiectul modular.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recommendation?.bundle_name ? (
                  <Badge variant="outline" className="border-emerald-200 text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-300">
                    Bundle recomandat: {recommendation.bundle_name}
                  </Badge>
                ) : null}

                {recommendedCards.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                      Servicii recomandate
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      {recommendedCards.map((service) => {
                        const checked = selectedServiceIndexes.includes(service.index);
                        const categoryName = getServiceCategoryName(service);

                        return (
                          <Card
                            key={service.key}
                            className={`cursor-pointer border transition ${checked
                              ? 'border-emerald-500 bg-emerald-50/70 dark:border-emerald-500/50 dark:bg-emerald-500/10'
                              : 'border-slate-200 dark:border-[#1E2A3D]'
                              }`}
                            onClick={() => handleToggleService(service.index)}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-2">
                                  <CardTitle className="text-base">{service.service_name}</CardTitle>
                                  <CardDescription className="flex items-center gap-1">
                                    {getProviderIcon(service.delivery_provider)}
                                    {getProviderLabel(service.delivery_provider)}
                                  </CardDescription>
                                  {categoryName ? (
                                    <Badge variant="outline" className="w-fit text-[10px] uppercase">
                                      {categoryName}
                                    </Badge>
                                  ) : null}
                                </div>
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={() => handleToggleService(service.index)}
                                  aria-label={`Select ${service.service_name}`}
                                />
                              </div>
                            </CardHeader>
                            {service.description ? (
                              <CardContent>
                                <p className="text-sm text-slate-600 dark:text-[#A3ADC2]">{service.description}</p>
                              </CardContent>
                            ) : null}
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {alternativeCards.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                        Servicii alternative (similar services)
                      </div>
                      <Badge variant="secondary">Opțional</Badge>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-[#A3ADC2]">
                      Clientul poate selecta un serviciu alternativ din aceeași categorie.
                    </p>
                    <div className="grid gap-3 md:grid-cols-2">
                      {alternativeCards.map((service) => {
                        const checked = selectedServiceIndexes.includes(service.index);
                        const categoryName = getServiceCategoryName(service);

                        return (
                          <Card
                            key={service.key}
                            className={`cursor-pointer border transition ${checked
                              ? 'border-blue-500 bg-blue-50/70 dark:border-blue-500/50 dark:bg-blue-500/10'
                              : 'border-slate-200 dark:border-[#1E2A3D]'
                              }`}
                            onClick={() => handleToggleService(service.index)}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-2">
                                  <CardTitle className="text-base">{service.service_name}</CardTitle>
                                  <CardDescription className="flex items-center gap-1">
                                    {getProviderIcon(service.delivery_provider)}
                                    {getProviderLabel(service.delivery_provider)}
                                  </CardDescription>
                                  <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline" className="text-[10px] uppercase">
                                      Alternativă
                                    </Badge>
                                    {categoryName ? (
                                      <Badge variant="outline" className="text-[10px] uppercase">
                                        {categoryName}
                                      </Badge>
                                    ) : null}
                                  </div>
                                </div>
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={() => handleToggleService(service.index)}
                                  aria-label={`Select ${service.service_name}`}
                                />
                              </div>
                            </CardHeader>
                            {service.description ? (
                              <CardContent>
                                <p className="text-sm text-slate-600 dark:text-[#A3ADC2]">{service.description}</p>
                              </CardContent>
                            ) : null}
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="flex items-center justify-between pt-2">
                  <Button variant="outline" onClick={() => transitionTo('intent')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Înapoi la intenție
                  </Button>
                  <Button onClick={handleConfirmRecommendation}>
                    Confirmă și continuă
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {step === 'briefing' ? (
            <Card className="border-slate-200 shadow-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]">
              <CardHeader>
                <CardTitle>Pasul 3: Modular Briefing</CardTitle>
                <CardDescription>
                  Brief-ul este construit pe canalul Echo <code>user.{String(user.id)}.briefs</code> și afișat pe linii de proiect.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      briefStatus === 'FINAL'
                        ? 'border-emerald-300 text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-300'
                        : briefStatus === 'PROCESSING'
                          ? 'border-blue-300 text-blue-700 dark:border-blue-500/30 dark:text-blue-300'
                          : 'border-amber-300 text-amber-700 dark:border-amber-500/30 dark:text-amber-300'
                    }
                  >
                    Status: {briefStatus}
                  </Badge>

                  {briefStatus === 'PROCESSING' ? (
                    <span className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-[#8FA0B8]">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generăm structura modulară...
                    </span>
                  ) : null}
                </div>

                {briefPayloadTruncated ? (
                  <Alert className="border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="space-y-2">
                      <p>
                        Payload-ul websocket a fost compactat pentru limita de broadcast (10KB).
                      </p>
                      {briefPayloadTrimmedSections.length > 0 ? (
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide">
                            Secțiuni trimise compactat
                          </div>
                          <ul className="mt-1 space-y-1 text-xs">
                            {briefPayloadTrimmedSections.map((section, index) => (
                              <li key={`${section}-${index}`}>• {section}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </AlertDescription>
                  </Alert>
                ) : null}

                {briefSubscriptionError ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{briefSubscriptionError}</AlertDescription>
                  </Alert>
                ) : null}

                {briefQuestions.length > 0 ? (
                  <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
                    <h4 className="font-semibold text-amber-800 dark:text-amber-200">Clarificări necesare</h4>
                    <ul className="space-y-1 text-sm text-amber-700 dark:text-amber-100">
                      {briefQuestions.map((question, index) => (
                        <li key={`${question}-${index}`}>• {question}</li>
                      ))}
                    </ul>
                    <div className="space-y-2">
                      <Label htmlFor="clarification">Răspunsul tău</Label>
                      <Textarea
                        id="clarification"
                        rows={4}
                        value={briefAnswer}
                        onChange={(event) => setBriefAnswer(event.target.value)}
                        placeholder="Completează detaliile necesare pentru AI..."
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={() => void handleSendClarification()}>
                        Trimite clarificare
                      </Button>
                    </div>
                  </div>
                ) : null}

                {briefResult ? (
                  <div className="space-y-4 rounded-lg border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                    <div>
                      <h3 className="text-lg font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                        {briefingDisplay.title || briefResult.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-[#A3ADC2]">
                        Preview structurat cu datele din <code>final_brief</code>, <code>final_brief_full</code> și <code>final_brief_modular</code>.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-md border border-slate-200 bg-white/80 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                          Buget
                        </div>
                        <div className="mt-1 text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                          {typeof briefingDisplay.budget === 'number'
                            ? `$${briefingDisplay.budget.toLocaleString()}`
                            : '—'}
                        </div>
                      </div>
                      <div className="rounded-md border border-slate-200 bg-white/80 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                          Durată
                        </div>
                        <div className="mt-1 text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                          {briefingDisplay.duration || '—'}
                        </div>
                      </div>
                      <div className="rounded-md border border-slate-200 bg-white/80 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                          Payment Plan
                        </div>
                        <div className="mt-1 text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                          {briefingDisplay.paymentPlan || '—'}
                        </div>
                      </div>
                      <div className="rounded-md border border-slate-200 bg-white/80 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                          Currency
                        </div>
                        <div className="mt-1 text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                          {briefingDisplay.currency || 'USD'}
                        </div>
                      </div>
                    </div>

                    {/*{briefingDisplay.description ? (*/}
                    {/*  <div className="rounded-md border border-slate-200 bg-white/80 p-3 text-sm text-slate-700 dark:border-[#1E2A3D] dark:bg-[#0B1220] dark:text-[#C9D4E7]">*/}
                    {/*    {briefingDisplay.description}*/}
                    {/*  </div>*/}
                    {/*) : null}*/}

                    {briefingDisplay.overview || briefingDisplay.clientGoal || briefingDisplay.targetAudience ? (
                      <div className="rounded-md border border-slate-200 bg-white/80 p-3 text-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                        {briefingDisplay.overview ? (
                          <p className="text-slate-700 dark:text-[#C9D4E7]">
                            <span className="font-semibold">Overview:</span> {briefingDisplay.overview}
                          </p>
                        ) : null}
                        {briefingDisplay.clientGoal ? (
                          <p className="mt-1 text-slate-700 dark:text-[#C9D4E7]">
                            <span className="font-semibold">Client goal:</span> {briefingDisplay.clientGoal}
                          </p>
                        ) : null}
                        {briefingDisplay.targetAudience ? (
                          <p className="mt-1 text-slate-700 dark:text-[#C9D4E7]">
                            <span className="font-semibold">Target audience:</span> {briefingDisplay.targetAudience}
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    {briefingDisplay.technologies.length > 0 ? (
                      <div className="rounded-md border border-slate-200 bg-white/80 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                          Technologies
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {briefingDisplay.technologies.map((item, index) => (
                            <Badge key={`${item}-${index}`} variant="outline">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {briefingDisplay.specificRequirements.length > 0 ? (
                      <div className="rounded-md border border-slate-200 bg-white/80 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                          Specific requirements
                        </div>
                        <ul className="space-y-1 text-sm text-slate-700 dark:text-[#C9D4E7]">
                          {briefingDisplay.specificRequirements.map((item, index) => (
                            <li key={`${item}-${index}`}>• {item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {briefingDisplay.teamStructure.length > 0 ? (
                      <div className="rounded-md border border-slate-200 bg-white/80 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                          Team structure
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {briefingDisplay.teamStructure.map((member, index) => (
                            <div key={`${member.role}-${index}`} className="rounded-md border border-slate-200 bg-white p-2 text-sm dark:border-[#1E2A3D] dark:bg-[#0F172A]">
                              <div className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                                {member.role}
                              </div>
                              <div className="text-xs text-slate-600 dark:text-[#A3ADC2]">
                                {member.service || 'General'} • {member.level || 'N/A'} • x{member.count ?? 1}
                              </div>
                              {typeof member.estimated_cost === 'number' ? (
                                <div className="mt-1 text-xs text-slate-600 dark:text-[#A3ADC2]">
                                  Cost est.: ${member.estimated_cost.toLocaleString()}
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {briefingDisplay.milestones.length > 0 ? (
                      <div className="rounded-md border border-slate-200 bg-white/80 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                          Milestones
                        </div>
                        <div className="space-y-2">
                          {briefingDisplay.milestones.map((milestone, index) => (
                            <div key={`${milestone.title}-${index}`} className="rounded-md border border-slate-200 bg-white p-2 text-sm dark:border-[#1E2A3D] dark:bg-[#0F172A]">
                              <div className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                                {milestone.title}
                              </div>
                              {milestone.description ? (
                                <p className="mt-1 text-xs text-slate-600 dark:text-[#A3ADC2]">
                                  {milestone.description}
                                </p>
                              ) : null}
                              <div className="mt-1 text-xs text-slate-600 dark:text-[#A3ADC2]">
                                {typeof milestone.percentage === 'number' ? `${milestone.percentage}%` : '—'}
                                {' • '}
                                {typeof milestone.amount === 'number' ? `$${milestone.amount.toLocaleString()}` : '—'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {fullBusinessAnalysis ? (
                      <div className="rounded-md border border-slate-200 bg-white/80 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                          final_brief_full: Business analysis
                        </div>
                        {toString(fullBusinessAnalysis.problem_statement) ? (
                          <p className="text-sm text-slate-700 dark:text-[#C9D4E7]">
                            <span className="font-semibold">Problem:</span> {toString(fullBusinessAnalysis.problem_statement)}
                          </p>
                        ) : null}
                        {toString(fullBusinessAnalysis.value_proposition) ? (
                          <p className="mt-1 text-sm text-slate-700 dark:text-[#C9D4E7]">
                            <span className="font-semibold">Value proposition:</span> {toString(fullBusinessAnalysis.value_proposition)}
                          </p>
                        ) : null}
                        {fullTargetUsers.length > 0 ? (
                          <div className="mt-2">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                              Target users
                            </div>
                            <ul className="mt-1 space-y-1 text-sm text-slate-700 dark:text-[#C9D4E7]">
                              {fullTargetUsers.map((item, index) => (
                                <li key={`${item}-${index}`}>• {item}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                        {fullFeatureBusinessValue.length > 0 ? (
                          <div className="mt-2">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                              Feature business value
                            </div>
                            <ul className="mt-1 space-y-1 text-sm text-slate-700 dark:text-[#C9D4E7]">
                              {fullFeatureBusinessValue.map((item, index) => (
                                <li key={`${item}-${index}`}>• {item}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {(fullTechStackItems.length > 0 || toString(briefFullDetails?.tech_stack?.architecture_notes)) ? (
                      <div className="rounded-md border border-slate-200 bg-white/80 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                          final_brief_full: Tech stack
                        </div>
                        {fullTechStackItems.length > 0 ? (
                          <div className="space-y-2">
                            {fullTechStackItems.map((item, index) => (
                              <div key={`${item.technology}-${index}`} className="rounded-md border border-slate-200 bg-white p-2 text-sm dark:border-[#1E2A3D] dark:bg-[#0F172A]">
                                <div className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                                  {item.technology}
                                </div>
                                {item.purpose ? (
                                  <div className="text-xs text-slate-600 dark:text-[#A3ADC2]">
                                    Purpose: {item.purpose}
                                  </div>
                                ) : null}
                                {item.justification ? (
                                  <div className="text-xs text-slate-600 dark:text-[#A3ADC2]">
                                    Why: {item.justification}
                                  </div>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ) : null}
                        {toString(briefFullDetails?.tech_stack?.architecture_notes) ? (
                          <p className="mt-2 text-sm text-slate-700 dark:text-[#C9D4E7]">
                            <span className="font-semibold">Architecture notes:</span>{' '}
                            {toString(briefFullDetails?.tech_stack?.architecture_notes)}
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    {fullTechnicalRisks.length > 0 ? (
                      <div className="rounded-md border border-slate-200 bg-white/80 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                          final_brief_full: Technical risks
                        </div>
                        <ul className="space-y-1 text-sm text-slate-700 dark:text-[#C9D4E7]">
                          {fullTechnicalRisks.map((item, index) => (
                            <li key={`${item}-${index}`}>• {item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {(fullComplexityEstimationEntries.length > 0 || fullComplexityEntries.length > 0) ? (
                      <div className="rounded-md border border-slate-200 bg-white/80 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                          final_brief_full: Complexity
                        </div>
                        {fullComplexityEstimationEntries.length > 0 ? (
                          <div className="mb-2">
                            <div className="text-xs text-slate-500 dark:text-[#8FA0B8]">Complexity estimation</div>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {fullComplexityEstimationEntries.map(([key, value]) => (
                                <Badge key={key} variant="outline">
                                  {key}: {String(value)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {fullComplexityEntries.length > 0 ? (
                          <div>
                            <div className="text-xs text-slate-500 dark:text-[#8FA0B8]">Complexity by domain</div>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {fullComplexityEntries.map(([key, value]) => (
                                <Badge key={key} variant="outline">
                                  {key}: {String(value)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {fullTeamRecommendationEntries.length > 0 ? (
                      <div className="rounded-md border border-slate-200 bg-white/80 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                          final_brief_full: Team recommendation
                        </div>
                        <div className="space-y-2">
                          {fullTeamRecommendationEntries.map(([phase, members]) => (
                            <div key={phase} className="rounded-md border border-slate-200 bg-white p-2 text-sm dark:border-[#1E2A3D] dark:bg-[#0F172A]">
                              <div className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                                {phase}
                              </div>
                              <ul className="mt-1 space-y-1 text-xs text-slate-600 dark:text-[#A3ADC2]">
                                {(Array.isArray(members) ? members : []).map((member, index) => (
                                  <li key={`${member.role}-${index}`}>
                                    • {member.role} x{member.count ?? 1} ({member.seniority ?? 'N/A'})
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                        Linii modulare de proiect
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        {briefingProjectLines.map((line, index) => (
                          <Card key={`${line.service_name}-${index}`} className="border-emerald-200/80 dark:border-emerald-500/20">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">{line.service_name}</CardTitle>
                              <CardDescription className="flex items-center gap-2">
                                {getProviderIcon(line.delivery_provider)}
                                {getProviderLabel(line.delivery_provider)}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                              <p className="text-slate-600 dark:text-[#A3ADC2]">{line.description || 'Fără descriere.'}</p>
                              <div className="rounded-md border border-slate-200 bg-white/80 p-2 text-xs dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                                <span className="font-semibold">Buget (%): </span>
                                {line.budget_percentage}
                              </div>
                              <div>
                                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                                  Milestones
                                </div>
                                <ul className="space-y-1 text-xs text-slate-600 dark:text-[#A3ADC2]">
                                  {line.milestones.map((milestone, milestoneIndex) => (
                                    <li key={`${milestone.title}-${milestoneIndex}`}>
                                      • {milestone.title} - ${milestone.amount.toLocaleString()}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {briefText ? (
                      <div className="space-y-2 rounded-lg border border-slate-200 bg-white/80 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                          Final brief text
                        </div>
                        <pre className="max-h-56 overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100">
{briefText}
                        </pre>
                      </div>
                    ) : null}

                    {briefDebugResponseJson ? (
                      <div className="space-y-2 rounded-lg border border-slate-200 bg-white/80 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                          Debug Response JSON
                        </div>
                        <pre className="max-h-64 overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100">
{briefDebugResponseJson}
                        </pre>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="flex items-center justify-between pt-2">
                  <Button variant="outline" onClick={() => transitionTo('recommendation')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Înapoi la recomandare
                  </Button>

                  <Button onClick={() => transitionTo('providers')} disabled={!briefResult || briefStatus !== 'FINAL'}>
                    Continuă la prestatori
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {step === 'providers' ? (
            <Card className="border-slate-200 shadow-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]">
              <CardHeader>
                <CardTitle>Pasul 4: Selectare prestatori</CardTitle>
                <CardDescription>
                  Pentru fiecare serviciu selectează prestatorii recomandați sau alege alternative din lista suplimentară.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {providerSelectionGroups.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Nu există încă recomandări de prestatori. Poți continua la review fără selecții.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {providerSelectionGroups.map((group, groupIndex) => {
                      const serviceKey = getServiceKey(group.service_name);
                      const selectedCount = selectedProvidersCountByService.get(serviceKey) ?? 0;

                      return (
                        <div
                          key={`provider-group-${group.service_name}-${group.service_id ?? groupIndex}`}
                          className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/60 p-4 dark:border-[#1E2A3D] dark:bg-[#0F172A]"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-base font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                              {group.service_name}
                            </div>
                            <Badge variant="outline">
                              Selectați: {selectedCount}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                              Prestatori recomandați
                            </div>
                            {group.recommended.length > 0 ? (
                              <div className="grid gap-3 md:grid-cols-2">
                                {group.recommended.map((provider) => {
                                  const checked = isProviderSelected(group.service_name, provider);
                                  const providerId = getProviderId(provider);
                                  return (
                                    <Card
                                      key={`recommended-${group.service_name}-${providerId ?? getProviderDisplayName(provider)}`}
                                      className={`cursor-pointer border transition ${checked
                                        ? 'border-emerald-500 bg-emerald-50/70 dark:border-emerald-500/50 dark:bg-emerald-500/10'
                                        : 'border-slate-200 dark:border-[#1E2A3D]'
                                        }`}
                                      onClick={() => handleToggleProvider(group.service_name, provider)}
                                    >
                                      <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="space-y-1">
                                            <CardTitle className="text-base">
                                              {getProviderDisplayName(provider)}
                                            </CardTitle>
                                            <CardDescription>
                                              Match score:{' '}
                                              {typeof provider.matchScore === 'number'
                                                ? `${provider.matchScore}%`
                                                : 'N/A'}
                                            </CardDescription>
                                            <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-[#A3ADC2]">
                                              <span>
                                                Rating:{' '}
                                                {typeof provider.rating === 'number'
                                                  ? provider.rating.toFixed(2)
                                                  : 'N/A'}
                                              </span>
                                              <span>
                                                Reviews:{' '}
                                                {typeof provider.reviewCount === 'number'
                                                  ? provider.reviewCount
                                                  : 'N/A'}
                                              </span>
                                            </div>
                                          </div>
                                          <Checkbox
                                            checked={checked}
                                            onCheckedChange={() =>
                                              handleToggleProvider(group.service_name, provider)
                                            }
                                            aria-label={`Select ${getProviderDisplayName(provider)}`}
                                          />
                                        </div>
                                      </CardHeader>
                                      {Array.isArray(provider.matchReasons) &&
                                      provider.matchReasons.length > 0 ? (
                                        <CardContent>
                                          <ul className="space-y-1 text-xs text-slate-600 dark:text-[#A3ADC2]">
                                            {provider.matchReasons.slice(0, 3).map((reason, reasonIndex) => (
                                              <li key={`recommended-reason-${providerId ?? reasonIndex}-${reasonIndex}`}>
                                                • {reason}
                                              </li>
                                            ))}
                                          </ul>
                                        </CardContent>
                                      ) : null}
                                    </Card>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-500 dark:text-[#8FA0B8]">
                                Nu există prestatori recomandați pentru acest serviciu.
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                                Alți prestatori (others)
                              </div>
                              <Badge variant="secondary">Opțional</Badge>
                            </div>
                            {group.others.length > 0 ? (
                              <div className="grid gap-3 md:grid-cols-2">
                                {group.others.map((provider) => {
                                  const checked = isProviderSelected(group.service_name, provider);
                                  const providerId = getProviderId(provider);
                                  return (
                                    <Card
                                      key={`other-${group.service_name}-${providerId ?? getProviderDisplayName(provider)}`}
                                      className={`cursor-pointer border transition ${checked
                                        ? 'border-blue-500 bg-blue-50/70 dark:border-blue-500/50 dark:bg-blue-500/10'
                                        : 'border-slate-200 dark:border-[#1E2A3D]'
                                        }`}
                                      onClick={() => handleToggleProvider(group.service_name, provider)}
                                    >
                                      <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="space-y-1">
                                            <CardTitle className="text-base">
                                              {getProviderDisplayName(provider)}
                                            </CardTitle>
                                            <CardDescription>
                                              Match score:{' '}
                                              {typeof provider.matchScore === 'number'
                                                ? `${provider.matchScore}%`
                                                : 'N/A'}
                                            </CardDescription>
                                            <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-[#A3ADC2]">
                                              <span>
                                                Rating:{' '}
                                                {typeof provider.rating === 'number'
                                                  ? provider.rating.toFixed(2)
                                                  : 'N/A'}
                                              </span>
                                              <span>
                                                Reviews:{' '}
                                                {typeof provider.reviewCount === 'number'
                                                  ? provider.reviewCount
                                                  : 'N/A'}
                                              </span>
                                            </div>
                                          </div>
                                          <Checkbox
                                            checked={checked}
                                            onCheckedChange={() =>
                                              handleToggleProvider(group.service_name, provider)
                                            }
                                            aria-label={`Select ${getProviderDisplayName(provider)}`}
                                          />
                                        </div>
                                      </CardHeader>
                                      {Array.isArray(provider.matchReasons) &&
                                      provider.matchReasons.length > 0 ? (
                                        <CardContent>
                                          <ul className="space-y-1 text-xs text-slate-600 dark:text-[#A3ADC2]">
                                            {provider.matchReasons.slice(0, 3).map((reason, reasonIndex) => (
                                              <li key={`other-reason-${providerId ?? reasonIndex}-${reasonIndex}`}>
                                                • {reason}
                                              </li>
                                            ))}
                                          </ul>
                                        </CardContent>
                                      ) : null}
                                    </Card>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-500 dark:text-[#8FA0B8]">
                                Nu există alți prestatori disponibili pentru acest serviciu.
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="rounded-md border border-slate-200 bg-white/80 p-3 text-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                  <span className="font-semibold">Total prestatori selectați:</span>{' '}
                  {selectedProviders.length}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button variant="outline" onClick={() => transitionTo('briefing')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Înapoi la briefing
                  </Button>

                  <Button onClick={() => transitionTo('review')} disabled={!briefResult || briefStatus !== 'FINAL'}>
                    Continuă la review
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {step === 'review' ? (
            <Card className="border-slate-200 shadow-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]">
              <CardHeader>
                <CardTitle>Pasul 5: Review & Create</CardTitle>
                <CardDescription>
                  Verifică distribuția bugetului pe fiecare linie, apoi creează proiectul modular.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {briefPayloadTruncated ? (
                  <Alert className="border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="space-y-2">
                      <p>
                        Datele pentru review provin dintr-un payload compactat (broadcast limit 10KB).
                      </p>
                      {briefPayloadTrimmedSections.length > 0 ? (
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide">
                            Secțiuni compactate
                          </div>
                          <ul className="mt-1 space-y-1 text-xs">
                            {briefPayloadTrimmedSections.map((section, index) => (
                              <li key={`review-trimmed-${section}-${index}`}>• {section}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </AlertDescription>
                  </Alert>
                ) : null}

                {briefResult ? (
                  <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/80 p-4 dark:border-[#1E2A3D] dark:bg-[#0F172A]">
                    <h4 className="text-base font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                      Sinteză finală pentru creare
                    </h4>
                    {briefingDisplay.description ? (
                      <p className="text-sm text-slate-700 dark:text-[#C9D4E7]">
                        {briefingDisplay.description}
                      </p>
                    ) : null}
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-md border border-slate-200 bg-white/90 p-3 text-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                        <div className="text-xs text-slate-500 dark:text-[#8FA0B8]">Buget AI</div>
                        <div className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                          {typeof briefingDisplay.budget === 'number'
                            ? `$${briefingDisplay.budget.toLocaleString()}`
                            : '—'}
                        </div>
                      </div>
                      <div className="rounded-md border border-slate-200 bg-white/90 p-3 text-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                        <div className="text-xs text-slate-500 dark:text-[#8FA0B8]">Durată</div>
                        <div className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                          {effectiveDuration || '—'}
                        </div>
                      </div>
                      <div className="rounded-md border border-slate-200 bg-white/90 p-3 text-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                        <div className="text-xs text-slate-500 dark:text-[#8FA0B8]">Payment Plan</div>
                        <div className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                          {effectivePaymentPlan || '—'}
                        </div>
                      </div>
                      <div className="rounded-md border border-slate-200 bg-white/90 p-3 text-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                        <div className="text-xs text-slate-500 dark:text-[#8FA0B8]">Currency</div>
                        <div className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                          {briefingDisplay.currency || 'USD'}
                        </div>
                      </div>
                    </div>
                    {(typeof briefingDisplay.budgetMin === 'number' || typeof briefingDisplay.budgetMax === 'number') ? (
                      <div className="text-xs text-slate-600 dark:text-[#A3ADC2]">
                        Range: {typeof briefingDisplay.budgetMin === 'number' ? `$${briefingDisplay.budgetMin.toLocaleString()}` : '—'}
                        {' - '}
                        {typeof briefingDisplay.budgetMax === 'number' ? `$${briefingDisplay.budgetMax.toLocaleString()}` : '—'}
                      </div>
                    ) : null}

                    <div className="rounded-md border border-slate-200 bg-white/90 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                        Configurare finală contract
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="project-duration">Durată proiect</Label>
                          <Input
                            id="project-duration"
                            value={editableDuration}
                            onChange={(event) => setEditableDuration(event.target.value)}
                            placeholder="Ex: 2months / 1month / 6months"
                          />
                          <p className="text-xs text-slate-500 dark:text-[#8FA0B8]">
                            Durata este evaluată pentru regula milestones obligatorii peste 3 luni.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="payment-plan">Plan de plată</Label>
                          <Select
                            value={effectivePaymentPlan || undefined}
                            onValueChange={(value) => setEditablePaymentPlan(value)}
                            disabled={!canEditPaymentPlanByDuration}
                          >
                            <SelectTrigger id="payment-plan">
                              <SelectValue placeholder="Selectează planul de plată" />
                            </SelectTrigger>
                            <SelectContent>
                              {PAYMENT_PLAN_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-slate-500 dark:text-[#8FA0B8]">
                            {canEditPaymentPlanByDuration
                              ? 'Pentru durate de până la 3 luni, planul de plată poate fi modificat.'
                              : 'Pentru durate mai mari de 3 luni, planul de plată nu poate fi modificat în acest pas.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {requiresMilestonesByDuration && linesMissingMilestones.length > 0 ? (
                      <Alert className="border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Pentru durate mai mari de 3 luni, milestones sunt obligatorii pe fiecare linie.
                          Lipsesc pentru: {linesMissingMilestones.join(', ')}.
                        </AlertDescription>
                      </Alert>
                    ) : null}

                    {briefingDisplay.overview || briefingDisplay.clientGoal || briefingDisplay.targetAudience ? (
                      <div className="rounded-md border border-slate-200 bg-white/90 p-3 text-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                        <div className="mb-1 text-xs text-slate-500 dark:text-[#8FA0B8]">
                          final_brief_modular
                        </div>
                        {briefingDisplay.overview ? (
                          <p className="text-slate-700 dark:text-[#C9D4E7]">
                            <span className="font-semibold">Overview:</span> {briefingDisplay.overview}
                          </p>
                        ) : null}
                        {briefingDisplay.clientGoal ? (
                          <p className="mt-1 text-slate-700 dark:text-[#C9D4E7]">
                            <span className="font-semibold">Client goal:</span> {briefingDisplay.clientGoal}
                          </p>
                        ) : null}
                        {briefingDisplay.targetAudience ? (
                          <p className="mt-1 text-slate-700 dark:text-[#C9D4E7]">
                            <span className="font-semibold">Target audience:</span> {briefingDisplay.targetAudience}
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    {briefingDisplay.technologies.length > 0 ? (
                      <div className="rounded-md border border-slate-200 bg-white/90 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                        <div className="mb-1 text-xs text-slate-500 dark:text-[#8FA0B8]">
                          Technologies
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {briefingDisplay.technologies.map((item, index) => (
                            <Badge key={`${item}-review-tech-${index}`} variant="outline">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {briefingDisplay.specificRequirements.length > 0 ? (
                      <div className="rounded-md border border-slate-200 bg-white/90 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                        <div className="mb-1 text-xs text-slate-500 dark:text-[#8FA0B8]">
                          Cerințe specifice
                        </div>
                        <ul className="space-y-1 text-sm text-slate-700 dark:text-[#C9D4E7]">
                          {briefingDisplay.specificRequirements.map((item, index) => (
                            <li key={`${item}-review-${index}`}>• {item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {briefingDisplay.milestones.length > 0 ? (
                      <div className="rounded-md border border-slate-200 bg-white/90 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                        <div className="mb-1 text-xs text-slate-500 dark:text-[#8FA0B8]">
                          Milestones plan
                        </div>
                        <div className="space-y-1 text-sm text-slate-700 dark:text-[#C9D4E7]">
                          {briefingDisplay.milestones.map((milestone, index) => (
                            <div key={`${milestone.title}-review-${index}`}>
                              {index + 1}. {milestone.title}
                              {' - '}
                              {typeof milestone.amount === 'number'
                                ? `$${milestone.amount.toLocaleString()}`
                                : 'N/A'}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {briefingProjectLines.length > 0 ? (
                      <div className="rounded-md border border-slate-200 bg-white/90 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                        <div className="mb-1 text-xs text-slate-500 dark:text-[#8FA0B8]">
                          final_brief / final_brief_modular: Project lines
                        </div>
                        <div className="space-y-2">
                          {briefingProjectLines.map((line, index) => (
                            <div
                              key={`${line.service_name}-review-line-${index}`}
                              className="flex flex-wrap items-center justify-between rounded-md border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-[#1E2A3D] dark:bg-[#0F172A]"
                            >
                              <div className="flex items-center gap-2">
                                {getProviderIcon(line.delivery_provider)}
                                <span className="font-medium">{line.service_name}</span>
                              </div>
                              <div className="text-xs text-slate-600 dark:text-[#A3ADC2]">
                                {line.budget_percentage}% ({line.milestones.length} milestones)
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {(toString(fullBusinessAnalysis?.problem_statement) || fullTechnicalRisks.length > 0) ? (
                      <div className="rounded-md border border-slate-200 bg-white/90 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                        <div className="mb-1 text-xs text-slate-500 dark:text-[#8FA0B8]">
                          final_brief_full
                        </div>
                        {toString(fullBusinessAnalysis?.problem_statement) ? (
                          <p className="text-sm text-slate-700 dark:text-[#C9D4E7]">
                            <span className="font-semibold">Problem statement:</span>{' '}
                            {toString(fullBusinessAnalysis?.problem_statement)}
                          </p>
                        ) : null}
                        {fullTechnicalRisks.length > 0 ? (
                          <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-[#C9D4E7]">
                            {fullTechnicalRisks.map((risk, index) => (
                              <li key={`${risk}-review-risk-${index}`}>• {risk}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="total-budget">Buget total proiect (USD)</Label>
                  <Input
                    id="total-budget"
                    type="number"
                    min="0"
                    value={totalBudget}
                    onChange={(event) => setTotalBudget(event.target.value)}
                    placeholder="Ex: 25000"
                  />
                </div>

                <div className="space-y-2 rounded-lg border border-slate-200 p-3 dark:border-[#1E2A3D]">
                  <div className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">Distribuție buget pe linii</div>
                  <div className="space-y-2">
                    {reviewLines.map((line, index) => (
                      <div
                        key={`${line.service_name}-${index}`}
                        className="flex flex-wrap items-center justify-between rounded-md border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-[#1E2A3D] dark:bg-[#0F172A]"
                      >
                        <div className="flex items-center gap-2">
                          {getProviderIcon(line.delivery_provider)}
                          <span className="font-medium">{line.service_name}</span>
                        </div>
                        <div className="text-xs text-slate-600 dark:text-[#A3ADC2]">
                          {line.budget_percentage}% - ${line.budget_allocation.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {createProjectPayloadDebugJson ? (
                  <div className="space-y-2 rounded-lg border border-slate-200 bg-white/80 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                      Debug Create Payload JSON (request body)
                    </div>
                    <pre className="max-h-64 overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100">
{createProjectPayloadDebugJson}
                    </pre>
                  </div>
                ) : null}

                <div className="flex items-center justify-between pt-2">
                  <Button variant="outline" onClick={() => transitionTo('providers')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Înapoi la prestatori
                  </Button>

                  <Button
                    onClick={() => void handleCreateProject()}
                    disabled={
                      creatingProject ||
                      !briefResult ||
                      !effectiveDuration ||
                      !effectivePaymentPlan ||
                      (requiresMilestonesByDuration && linesMissingMilestones.length > 0)
                    }
                  >
                    {creatingProject ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creăm proiectul...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Create Project
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  );
}
