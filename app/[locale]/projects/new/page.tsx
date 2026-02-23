"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Chrome,
  Figma,
  FolderOpen,
  Github,
  History,
  LayoutDashboard,
  Layers,
  Loader2,
  Lock,
  Moon,
  Plus,
  Settings,
  Sun,
  Sparkles,
  UploadCloud,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { NotificationBell } from '@/components/notification-bell';
import { TrustoraThemeStyles } from '@/components/trustora/theme-styles';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/auth-context';
import { useGetServicesGroupedByCategory } from '@/hooks/use-api';
import { buildOAuthRedirectUrl } from '@/lib/backend-url';
import { getEcho } from '@/lib/echo';
import { Link, usePathname, useRouter } from '@/lib/navigation';
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
import type { OAuthProvider } from '@/types/auth';
import type { DeliveryProvider } from '@/types/projects';

type WizardStep = 'intent' | 'recommendation' | 'briefing' | 'providers' | 'connections' | 'review';
type ProjectInputMode = 'ai' | 'manual';

type RecommendationResult = {
  bundle_name?: string;
  services: RecommendedServiceCandidate[];
};

type ServiceCatalogEntry = {
  name?: string;
  description?: string;
  delivery_provider?: DeliveryProvider;
  category_name?: string;
  category_id?: string | number;
  subcategory_name?: string;
};

type ApiServiceOption = {
  id: string;
  name: string;
  delivery_provider?: DeliveryProvider;
  category_name: string;
  category_id?: string | number;
  subcategory_name?: string;
};

type RecommendedCard = RecommendedServiceCandidate & {
  key: string;
};

type ManualMilestoneForm = {
  id: string;
  title: string;
  description: string;
  percentage: string;
  amount: string;
};

type ManualProjectLineForm = {
  id: string;
  service_id: string;
  service_name: string;
  delivery_provider: DeliveryProvider;
  description: string;
  budget_percentage: string;
  milestones: ManualMilestoneForm[];
};

type NormalizedBriefProjectLine =
  NonNullable<AiBriefResponse['final_brief']>['project_lines'][number];
type NormalizedBriefProjectLineMilestone = NormalizedBriefProjectLine['milestones'][number];

type NormalizedTechnologyLine = {
  service_name: string;
  service_id?: string | number;
  delivery_provider?: DeliveryProvider;
};

type NormalizedMilestoneWithService = AiMilestoneItem & {
  service_id?: string | number;
  service_name?: string;
  delivery_provider?: DeliveryProvider;
};

type ProjectNewOAuthSnapshot = {
  savedAt: number;
  step: WizardStep;
  projectInputMode: ProjectInputMode;
  intent: string;
  manualTitle: string;
  briefStatus: 'IDLE' | AiBriefResponse['status'];
  briefResult: NonNullable<AiBriefResponse['final_brief']> | null;
  briefModularDetails: AiBriefResponse['final_brief_modular'] | null;
  briefFullDetails: AiBriefResponse['final_brief_full'] | null;
  briefText: string;
  briefPayloadTruncated: boolean;
  briefPayloadTrimmedSections: string[];
  recommendedProviders?: AiBriefRecommendedProviders;
  otherProviders?: AiBriefOtherProvidersByService;
  selectedProviders: AiBriefProvider[];
  totalBudget: string;
  editableDuration: string;
  editablePaymentPlan: string;
};

const PROJECT_NEW_OAUTH_SNAPSHOT_KEY = 'trustora:projects-new-oauth-snapshot';
const PROJECT_NEW_OAUTH_SNAPSHOT_TTL_MS = 30 * 60 * 1000;
const PROJECT_NEW_WIZARD_STATE_KEY = 'trustora:projects-new-wizard-state';
const PROJECT_NEW_WIZARD_STATE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const WIZARD_STEP_VALUES: WizardStep[] = [
  'intent',
  'recommendation',
  'briefing',
  'providers',
  'connections',
  'review',
];

const isWizardStep = (value: unknown): value is WizardStep =>
  typeof value === 'string' && WIZARD_STEP_VALUES.includes(value as WizardStep);
const isProjectInputMode = (value: unknown): value is ProjectInputMode =>
  value === 'ai' || value === 'manual';

type ProjectNewPersistedWizardState = {
  savedAt: number;
  step: WizardStep;
  projectInputMode: ProjectInputMode;
  intent: string;
  manualTitle: string;
  manualServiceSearch: string;
  groupedServicesPage: number;
  manualServiceIds: string[];
  manualSelectedServicesMap: Record<string, ApiServiceOption>;
  manualSpecificRequirements: string;
  manualDuration: string;
  manualPaymentPlan: string;
  manualCurrency: string;
  manualProjectLines: ManualProjectLineForm[];
  recommendation: RecommendationResult | null;
  selectedServiceIndexes: number[];
  briefMessages: AiAssistantMessage[];
  briefStatus: 'IDLE' | AiBriefResponse['status'];
  briefQuestions: string[];
  briefAnswer: string;
  briefResult: NonNullable<AiBriefResponse['final_brief']> | null;
  briefModularDetails: AiBriefResponse['final_brief_modular'] | null;
  briefFullDetails: AiBriefResponse['final_brief_full'] | null;
  briefText: string;
  briefPayloadTruncated: boolean;
  briefPayloadTrimmedSections: string[];
  recommendedProviders?: AiBriefRecommendedProviders;
  otherProviders?: AiBriefOtherProvidersByService;
  selectedProviders: AiBriefProvider[];
  milestoneAssignments: Record<string, number>;
  milestoneAssignmentsInitialized: boolean;
  totalBudget: string;
  editableDuration: string;
  editablePaymentPlan: string;
};

type ReviewMilestoneEntry = {
  key: string;
  lineIndex: number;
  milestoneIndex: number;
  serviceName: string;
  serviceKey: string;
  milestone: NonNullable<AiBriefResponse['final_brief']>['project_lines'][number]['milestones'][number];
  initialAssignedProviderId: number | null;
};

const PAYMENT_PLAN_OPTIONS = [
  { value: 'FULL', labelKey: 'payment_plan_full' },
  { value: 'MILESTONE', labelKey: 'payment_plan_milestone' },
  { value: 'MONTHLY', labelKey: 'payment_plan_monthly' },
] as const;

const AI_WIZARD_STEPS: Array<{ id: WizardStep; labelKey: string }> = [
  { id: 'intent', labelKey: 'step_label_intent' },
  { id: 'recommendation', labelKey: 'step_label_recommendation' },
  { id: 'briefing', labelKey: 'step_label_briefing' },
  { id: 'providers', labelKey: 'step_label_providers' },
  { id: 'connections', labelKey: 'step_label_connections' },
  { id: 'review', labelKey: 'step_label_review' },
];

const MANUAL_WIZARD_STEPS: Array<{ id: WizardStep; labelKey: string }> = [
  { id: 'intent', labelKey: 'step_label_project_details' },
  { id: 'providers', labelKey: 'step_label_providers' },
  { id: 'connections', labelKey: 'step_label_connections' },
  { id: 'review', labelKey: 'step_label_review' },
];

type CreateProjectThemeVars = {
  '--bg-main': string;
  '--bg-card': string;
  '--text-main': string;
  '--text-muted': string;
  '--border-color': string;
  '--header-bg': string;
  '--input-bg': string;
  '--stat-bg': string;
};

const createProjectThemes: Record<'light' | 'dark', CreateProjectThemeVars> = {
  light: {
    '--bg-main': '#F5F7FA',
    '--bg-card': '#FFFFFF',
    '--text-main': '#0B1C2D',
    '--text-muted': '#64748B',
    '--border-color': 'rgba(226, 232, 240, 0.8)',
    '--header-bg': 'rgba(255, 255, 255, 0.8)',
    '--input-bg': '#F5F7FA',
    '--stat-bg': '#F5F7FA',
  },
  dark: {
    '--bg-main': '#06111A',
    '--bg-card': '#0D1F30',
    '--text-main': '#F8FAFC',
    '--text-muted': '#94A3B8',
    '--border-color': 'rgba(255, 255, 255, 0.08)',
    '--header-bg': 'rgba(13, 31, 48, 0.8)',
    '--input-bg': '#06111A',
    '--stat-bg': '#152A40',
  },
};

const GROUPED_SERVICES_DEFAULT_LIMIT = 2;

const STEP_TRANSITIONS: Record<WizardStep, WizardStep[]> = {
  intent: ['recommendation', 'providers', 'connections', 'review'],
  recommendation: ['intent', 'briefing'],
  briefing: ['recommendation', 'providers'],
  providers: ['intent', 'briefing', 'connections'],
  connections: ['providers', 'review'],
  review: ['connections', 'providers', 'intent'],
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

const toLocalizedString = (value: unknown): string => {
  if (typeof value === 'string') {
    return value.trim();
  }

  const objectValue = toObject(value);
  if (!objectValue) {
    return '';
  }

  const direct =
    toString(objectValue.ro) ||
    toString(objectValue.en) ||
    toString(objectValue.name);
  if (direct) {
    return direct;
  }

  for (const candidate of Object.values(objectValue)) {
    const normalized = toString(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return '';
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
  return 'Manual upload';
};

const getProviderIcon = (provider: DeliveryProvider) => {
  if (provider === 'github') return <Github className="h-4 w-4" />;
  if (provider === 'figma') return <Figma className="h-4 w-4" />;
  if (provider === 'google_drive') return <FolderOpen className="h-4 w-4" />;
  if (provider === 'google_analytics') return <BarChart3 className="h-4 w-4" />;
  if (provider === 'manual_upload') return <UploadCloud className="h-4 w-4" />;
  return <Wrench className="h-4 w-4" />;
};

const mapDeliveryProviderToOAuth = (provider: DeliveryProvider): OAuthProvider | null => {
  if (provider === 'github') return 'github';
  if (provider === 'figma') return 'figma';
  if (provider === 'google_drive' || provider === 'google_analytics') return 'google';
  return null;
};

const getOAuthProviderIcon = (provider: OAuthProvider) => {
  if (provider === 'github') return <Github className="h-4 w-4" />;
  if (provider === 'figma') return <Figma className="h-4 w-4" />;
  return <Chrome className="h-4 w-4" />;
};

const isAlternativeService = (service: RecommendedServiceCandidate | RecommendedCard) =>
  Boolean((service as { is_alternative?: unknown }).is_alternative);

const getServiceCategoryName = (service: RecommendedServiceCandidate | RecommendedCard) =>
  toString((service as { category_name?: unknown }).category_name);

const getServiceKey = (serviceName: unknown) => toString(serviceName).toLowerCase();

const getMilestoneAssignmentKey = (lineIndex: number, milestoneIndex: number) =>
  `line-${lineIndex}-milestone-${milestoneIndex}`;

const getMilestoneAssignedProviderId = (milestone: unknown): number | null => {
  const source = toObject(milestone);
  if (!source) {
    return null;
  }

  return (
    toNumber(source.assigned_provider_id) ??
    toNumber(source.provider_id) ??
    toNumber(source.providerId)
  );
};

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
          const assignedProviderId = getMilestoneAssignedProviderId(milestone);
          const assignedProvider = toObject(milestone.assigned_provider);

          return {
            title: milestoneTitle,
            ...(milestoneDescription ? { description: milestoneDescription } : {}),
            ...(milestonePercentage !== null ? { percentage: milestonePercentage } : {}),
            amount: toNumber(milestone.amount) ?? 0,
            ...(assignedProviderId !== null ? { assigned_provider_id: assignedProviderId } : {}),
            ...(assignedProvider ? { assigned_provider: assignedProvider } : {}),
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

const normalizeTechnologyLines = (value: unknown): NormalizedTechnologyLine[] => {
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

const normalizeTechnologyNames = (value: unknown): string[] => {
  return normalizeTechnologyLines(value).map((line) => line.service_name);
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

const normalizeMilestoneListWithService = (
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
        ...(serviceId !== undefined ? { service_id: serviceId } : {}),
        ...(serviceName ? { service_name: serviceName } : {}),
        ...(deliveryProvider ? { delivery_provider: deliveryProvider } : {}),
      };
    })
    .filter((item): item is NormalizedMilestoneWithService => item !== null);
};

const buildProjectLinesFromTechnologiesAndMilestones = (
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

const normalizeOtherProvidersPage = (value: unknown): AiBriefOtherProviders => {
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

const createManualMilestone = (id: string): ManualMilestoneForm => ({
  id,
  title: '',
  description: '',
  percentage: '',
  amount: '',
});

const createManualProjectLine = (
  id: string,
  service?: Pick<ApiServiceOption, 'id' | 'name' | 'delivery_provider'>
): ManualProjectLineForm => ({
  id,
  service_id: service?.id ?? '',
  service_name: service?.name ?? '',
  delivery_provider: service?.delivery_provider ?? 'manual_upload',
  description: '',
  budget_percentage: '',
  milestones: [],
});

export default function NewProjectPage() {
  const locale = useLocale() as Locale;
  const t = useTranslations('projects.new.modular');
  const tDashboard = useTranslations('dashboard');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading, userLoading, refreshUser } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const roleSlugs = useMemo(() => {
    const rolesList = Array.isArray(user?.roles) ? (user?.roles ?? []) : [];
    const fromRoles = rolesList.map((role: any) => role?.slug).filter(Boolean);
    const fromRoleSlugs = Array.isArray(user?.role_slugs) ? (user?.role_slugs ?? []) : [];
    const fromSingleRole = user?.role ? [user.role] : [];
    return Array.from(
      new Set(
        [...fromRoles, ...fromRoleSlugs, ...fromSingleRole]
          .filter(Boolean)
          .map((slug) => String(slug).toLowerCase())
      )
    );
  }, [user?.roles, user?.role_slugs, user?.role]);
  const isClient = roleSlugs.includes('client');
  const isProvider = roleSlugs.includes('provider');
  const servicesTitle = isProvider ? tDashboard('services.title.provider') : tDashboard('services.title.client');
  const currentTheme = isDarkMode ? createProjectThemes.dark : createProjectThemes.light;
  const wizardCardClass = 'rounded-2xl border shadow-sm transition-colors duration-300';
  const wizardCardStyle: CSSProperties = {
    backgroundColor: 'var(--bg-card)',
    borderColor: 'var(--border-color)',
  };
  const dashboardSidebarItemClass = (tab: string) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors w-full text-left ${
      (tab === 'overview' && pathname.includes('/dashboard') && !searchParams.get('tab')) ||
      (pathname.includes('/dashboard') && searchParams.get('tab') === tab) ||
      (tab === 'new-project' && pathname.includes('/projects/new'))
        ? 'bg-[#1BC47D]/10 text-[#1BC47D] border border-[#1BC47D]/20'
        : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`;
  const userInitials = `${(user?.firstName?.[0] ?? '')}${(user?.lastName?.[0] ?? '')}`.toUpperCase() || 'AC';
  const userDisplayName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || user?.email || 'User';
  const userAvatarSrc = (user as any)?.avatar ?? (user as any)?.profile_photo_url ?? (user as any)?.avatar_url ?? undefined;

  useEffect(() => {
    document.title = 'Trustora | Create Project';
    const existing = document.querySelector('link[data-dashboard-fonts="true"]');
    if (!existing) {
      const link = document.createElement('link');
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap';
      link.rel = 'stylesheet';
      link.setAttribute('data-dashboard-fonts', 'true');
      document.head.appendChild(link);
    }
  }, []);

  const [manualServiceSearch, setManualServiceSearch] = useState('');
  const [debouncedManualServiceSearch, setDebouncedManualServiceSearch] = useState('');
  const [groupedServicesPage, setGroupedServicesPage] = useState(1);
  const groupedServicesQueryParams = useMemo(() => {
    const search = toString(debouncedManualServiceSearch);
    return {
      page: groupedServicesPage,
      limit: GROUPED_SERVICES_DEFAULT_LIMIT,
      ...(search ? { search } : {}),
    };
  }, [debouncedManualServiceSearch, groupedServicesPage]);
  const { data: groupedServicesResponse, loading: groupedServicesLoading } =
    useGetServicesGroupedByCategory(groupedServicesQueryParams);
  const getLocalizedProviderLabel = useCallback(
    (provider: DeliveryProvider) => {
      if (provider === 'github') return t('provider_github');
      if (provider === 'figma') return t('provider_figma');
      if (provider === 'google_drive') return t('provider_google_drive');
      if (provider === 'google_analytics') return t('provider_google_analytics');
      return t('provider_manual_upload');
    },
    [t]
  );
  const getLocalizedOAuthProviderLabel = useCallback(
    (provider: OAuthProvider) => {
      if (provider === 'github') return t('provider_github');
      if (provider === 'figma') return t('provider_figma');
      return t('provider_google');
    },
    [t]
  );

  const [step, setStep] = useState<WizardStep>('intent');
  const [projectInputMode, setProjectInputMode] = useState<ProjectInputMode>('ai');
  const [intent, setIntent] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualServiceIds, setManualServiceIds] = useState<string[]>([]);
  const [manualSelectedServicesMap, setManualSelectedServicesMap] = useState<
    Record<string, ApiServiceOption>
  >({});
  const [manualSpecificRequirements, setManualSpecificRequirements] = useState('');
  const [manualDuration, setManualDuration] = useState('');
  const [manualPaymentPlan, setManualPaymentPlan] = useState('MILESTONE');
  const [manualCurrency, setManualCurrency] = useState('USD');
  const [manualProjectLines, setManualProjectLines] = useState<ManualProjectLineForm[]>([]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedManualServiceSearch(manualServiceSearch);
      setGroupedServicesPage(1);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [manualServiceSearch]);

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
  const [loadingManualProviders, setLoadingManualProviders] = useState(false);

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
  const [milestoneAssignments, setMilestoneAssignments] = useState<Record<string, number>>({});
  const [milestoneAssignmentsInitialized, setMilestoneAssignmentsInitialized] = useState(false);

  const [totalBudget, setTotalBudget] = useState('');
  const [editableDuration, setEditableDuration] = useState('');
  const [editablePaymentPlan, setEditablePaymentPlan] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);
  const [startOverDialogOpen, setStartOverDialogOpen] = useState(false);

  const briefRequestSentRef = useRef(false);
  const manualLineCounterRef = useRef(1);
  const manualMilestoneCounterRef = useRef(1);
  const milestoneAssignmentSignatureRef = useRef('');
  const oauthCallbackHandledRef = useRef(false);
  const wizardStateHydratedRef = useRef(false);
  const briefSubscriptionRef = useRef<{
    channelName: string;
    channel: {
      listen: (event: string, callback: (payload: unknown) => void) => void;
      stopListening: (event: string) => void;
    };
    echo: ReturnType<typeof getEcho>;
  } | null>(null);

  useEffect(() => {
    if (loading || userLoading) return;
    if (user) return;

    const callbackUrl = `${window.location.pathname}${window.location.search}`;
    router.replace(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }, [loading, userLoading, user, router]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const hasDraft = Boolean(window.sessionStorage.getItem(AI_BRIEF_DRAFT_STORAGE_KEY));
      if (hasDraft) {
        return;
      }

      const rawState = window.sessionStorage.getItem(PROJECT_NEW_WIZARD_STATE_KEY);
      if (!rawState) {
        return;
      }

      const parsed = JSON.parse(rawState) as Partial<ProjectNewPersistedWizardState>;
      if (!parsed || typeof parsed !== 'object') {
        return;
      }

      const savedAt = toNumber((parsed as { savedAt?: unknown }).savedAt);
      if (savedAt !== null && Date.now() - savedAt > PROJECT_NEW_WIZARD_STATE_TTL_MS) {
        window.sessionStorage.removeItem(PROJECT_NEW_WIZARD_STATE_KEY);
        return;
      }

      if (isWizardStep((parsed as { step?: unknown }).step)) {
        setStep((parsed as { step: WizardStep }).step);
      }

      if (isProjectInputMode((parsed as { projectInputMode?: unknown }).projectInputMode)) {
        setProjectInputMode((parsed as { projectInputMode: ProjectInputMode }).projectInputMode);
      }

      if (typeof parsed.intent === 'string') {
        setIntent(parsed.intent);
      }

      if (typeof parsed.manualTitle === 'string') {
        setManualTitle(parsed.manualTitle);
      }

      if (typeof parsed.manualServiceSearch === 'string') {
        setManualServiceSearch(parsed.manualServiceSearch);
      }

      const groupedPage = toNumber(parsed.groupedServicesPage);
      if (groupedPage !== null && groupedPage > 0) {
        setGroupedServicesPage(Math.trunc(groupedPage));
      }

      if (Array.isArray(parsed.manualServiceIds)) {
        setManualServiceIds(parsed.manualServiceIds.map((entry) => toString(entry)).filter(Boolean));
      }

      if (
        parsed.manualSelectedServicesMap &&
        typeof parsed.manualSelectedServicesMap === 'object' &&
        !Array.isArray(parsed.manualSelectedServicesMap)
      ) {
        const nextMap: Record<string, ApiServiceOption> = {};
        Object.entries(parsed.manualSelectedServicesMap).forEach(([key, rawValue]) => {
          const service = toObject(rawValue);
          if (!service) {
            return;
          }

          const id = toString(service.id) || toString(key);
          const name = toString(service.name);
          if (!id || !name) {
            return;
          }

          const categoryName = toString(service.category_name) || 'Altele';
          const subcategoryName = toString(service.subcategory_name);
          const categoryId = service.category_id;
          const rawProvider = toString(service.delivery_provider);
          const deliveryProvider =
            rawProvider === 'github' ||
            rawProvider === 'figma' ||
            rawProvider === 'google_drive' ||
            rawProvider === 'google_analytics' ||
            rawProvider === 'manual_upload'
              ? (rawProvider as DeliveryProvider)
              : undefined;

          nextMap[id] = {
            id,
            name,
            category_name: categoryName,
            ...(subcategoryName ? { subcategory_name: subcategoryName } : {}),
            ...(typeof categoryId === 'string' || typeof categoryId === 'number'
              ? { category_id: categoryId }
              : {}),
            ...(deliveryProvider ? { delivery_provider: deliveryProvider } : {}),
          };
        });

        setManualSelectedServicesMap(nextMap);
      }

      if (typeof parsed.manualSpecificRequirements === 'string') {
        setManualSpecificRequirements(parsed.manualSpecificRequirements);
      }

      if (typeof parsed.manualDuration === 'string') {
        setManualDuration(parsed.manualDuration);
      }

      if (typeof parsed.manualPaymentPlan === 'string') {
        setManualPaymentPlan(parsed.manualPaymentPlan);
      }

      if (typeof parsed.manualCurrency === 'string') {
        setManualCurrency(parsed.manualCurrency);
      }

      if (Array.isArray(parsed.manualProjectLines)) {
        const restoredManualLines = parsed.manualProjectLines
          .map((line) => {
            const lineObject = toObject(line);
            if (!lineObject) {
              return null;
            }

            const lineId = toString(lineObject.id);
            const serviceId = toString(lineObject.service_id);
            const serviceName = toString(lineObject.service_name);
            const description = toString(lineObject.description);
            const budgetPercentage = toString(lineObject.budget_percentage);
            const rawProvider = toString(lineObject.delivery_provider);
            const deliveryProvider =
              rawProvider === 'github' ||
              rawProvider === 'figma' ||
              rawProvider === 'google_drive' ||
              rawProvider === 'google_analytics' ||
              rawProvider === 'manual_upload'
                ? (rawProvider as DeliveryProvider)
                : 'manual_upload';

            const milestonesRaw = Array.isArray(lineObject.milestones) ? lineObject.milestones : [];
            const milestones = milestonesRaw
              .map((milestone) => {
                const milestoneObject = toObject(milestone);
                if (!milestoneObject) {
                  return null;
                }

                const milestoneId = toString(milestoneObject.id);
                if (!milestoneId) {
                  return null;
                }

                return {
                  id: milestoneId,
                  title: toString(milestoneObject.title),
                  description: toString(milestoneObject.description),
                  percentage: toString(milestoneObject.percentage),
                  amount: toString(milestoneObject.amount),
                };
              })
              .filter((milestone): milestone is ManualMilestoneForm => milestone !== null);

            if (!lineId) {
              return null;
            }

            return {
              id: lineId,
              service_id: serviceId,
              service_name: serviceName,
              delivery_provider: deliveryProvider,
              description,
              budget_percentage: budgetPercentage,
              milestones,
            };
          })
          .filter((line): line is ManualProjectLineForm => line !== null);

        setManualProjectLines(restoredManualLines);
      }

      if (
        parsed.recommendation &&
        typeof parsed.recommendation === 'object' &&
        Array.isArray((parsed.recommendation as { services?: unknown }).services)
      ) {
        setRecommendation(parsed.recommendation as RecommendationResult);
      }

      if (Array.isArray(parsed.selectedServiceIndexes)) {
        setSelectedServiceIndexes(
          parsed.selectedServiceIndexes
            .map((index) => toNumber(index))
            .filter((index): index is number => index !== null && index >= 0)
            .map((index) => Math.trunc(index))
        );
      }

      if (Array.isArray(parsed.briefMessages)) {
        const restoredMessages = parsed.briefMessages
          .map((message) => {
            const source = toObject(message);
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
        setBriefMessages(restoredMessages);
      }

      const briefStatusCandidate = (parsed as { briefStatus?: unknown }).briefStatus;
      if (
        briefStatusCandidate === 'IDLE' ||
        briefStatusCandidate === 'PROCESSING' ||
        briefStatusCandidate === 'CLARIFY' ||
        briefStatusCandidate === 'FINAL'
      ) {
        setBriefStatus(briefStatusCandidate);
      }

      if (Array.isArray(parsed.briefQuestions)) {
        setBriefQuestions(parsed.briefQuestions.map((entry) => toString(entry)).filter(Boolean));
      }

      if (typeof parsed.briefAnswer === 'string') {
        setBriefAnswer(parsed.briefAnswer);
      }

      if (parsed.briefResult && typeof parsed.briefResult === 'object') {
        setBriefResult(parsed.briefResult as NonNullable<AiBriefResponse['final_brief']>);
      }

      if (
        parsed.briefModularDetails === null ||
        (parsed.briefModularDetails && typeof parsed.briefModularDetails === 'object')
      ) {
        setBriefModularDetails(parsed.briefModularDetails ?? null);
      }

      if (
        parsed.briefFullDetails === null ||
        (parsed.briefFullDetails && typeof parsed.briefFullDetails === 'object')
      ) {
        setBriefFullDetails(parsed.briefFullDetails ?? null);
      }

      if (typeof parsed.briefText === 'string') {
        setBriefText(parsed.briefText);
      }

      if (typeof parsed.briefPayloadTruncated === 'boolean') {
        setBriefPayloadTruncated(parsed.briefPayloadTruncated);
      }

      if (Array.isArray(parsed.briefPayloadTrimmedSections)) {
        setBriefPayloadTrimmedSections(
          parsed.briefPayloadTrimmedSections.map((entry) => toString(entry)).filter(Boolean)
        );
      }

      if (
        parsed.recommendedProviders &&
        typeof parsed.recommendedProviders === 'object' &&
        !Array.isArray(parsed.recommendedProviders)
      ) {
        setRecommendedProviders(parsed.recommendedProviders as AiBriefRecommendedProviders);
      }

      if (Array.isArray(parsed.otherProviders)) {
        setOtherProviders(parsed.otherProviders as AiBriefOtherProvidersByService);
      }

      if (Array.isArray(parsed.selectedProviders)) {
        setSelectedProviders(parsed.selectedProviders as AiBriefProvider[]);
      }

      if (
        parsed.milestoneAssignments &&
        typeof parsed.milestoneAssignments === 'object' &&
        !Array.isArray(parsed.milestoneAssignments)
      ) {
        const assignments: Record<string, number> = {};
        Object.entries(parsed.milestoneAssignments).forEach(([key, value]) => {
          const parsedProviderId = toNumber(value);
          if (parsedProviderId === null) {
            return;
          }
          assignments[key] = Math.trunc(parsedProviderId);
        });
        setMilestoneAssignments(assignments);
      }

      if (typeof parsed.milestoneAssignmentsInitialized === 'boolean') {
        setMilestoneAssignmentsInitialized(parsed.milestoneAssignmentsInitialized);
      }

      if (typeof parsed.totalBudget === 'string') {
        setTotalBudget(parsed.totalBudget);
      }

      if (typeof parsed.editableDuration === 'string') {
        setEditableDuration(parsed.editableDuration);
      }

      if (typeof parsed.editablePaymentPlan === 'string') {
        setEditablePaymentPlan(parsed.editablePaymentPlan);
      }
    } catch (error) {
      console.error('Failed to restore persisted project wizard state:', error);
    } finally {
      wizardStateHydratedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const rawSnapshot = window.sessionStorage.getItem(PROJECT_NEW_OAUTH_SNAPSHOT_KEY);
      if (!rawSnapshot) {
        return;
      }

      const parsed = JSON.parse(rawSnapshot) as Partial<ProjectNewOAuthSnapshot>;
      if (!parsed || typeof parsed !== 'object') {
        return;
      }

      const savedAt = toNumber((parsed as { savedAt?: unknown }).savedAt);
      if (savedAt !== null && Date.now() - savedAt > PROJECT_NEW_OAUTH_SNAPSHOT_TTL_MS) {
        return;
      }

      if (isWizardStep((parsed as { step?: unknown }).step)) {
        setStep((parsed as { step: WizardStep }).step);
      }

      if (
        (parsed as { projectInputMode?: unknown }).projectInputMode === 'ai' ||
        (parsed as { projectInputMode?: unknown }).projectInputMode === 'manual'
      ) {
        setProjectInputMode((parsed as { projectInputMode: ProjectInputMode }).projectInputMode);
      }

      if (typeof parsed.intent === 'string') {
        setIntent(parsed.intent);
      }

      if (typeof parsed.manualTitle === 'string') {
        setManualTitle(parsed.manualTitle);
      }

      const briefStatusCandidate = (parsed as { briefStatus?: unknown }).briefStatus;
      if (
        briefStatusCandidate === 'IDLE' ||
        briefStatusCandidate === 'PROCESSING' ||
        briefStatusCandidate === 'CLARIFY' ||
        briefStatusCandidate === 'FINAL'
      ) {
        setBriefStatus(briefStatusCandidate);
      }

      if (parsed.briefResult && typeof parsed.briefResult === 'object') {
        setBriefResult(parsed.briefResult as NonNullable<AiBriefResponse['final_brief']>);
      }

      if (
        parsed.briefModularDetails === null ||
        (parsed.briefModularDetails && typeof parsed.briefModularDetails === 'object')
      ) {
        setBriefModularDetails(parsed.briefModularDetails ?? null);
      }

      if (
        parsed.briefFullDetails === null ||
        (parsed.briefFullDetails && typeof parsed.briefFullDetails === 'object')
      ) {
        setBriefFullDetails(parsed.briefFullDetails ?? null);
      }

      if (typeof parsed.briefText === 'string') {
        setBriefText(parsed.briefText);
      }

      if (typeof parsed.briefPayloadTruncated === 'boolean') {
        setBriefPayloadTruncated(parsed.briefPayloadTruncated);
      }

      if (Array.isArray(parsed.briefPayloadTrimmedSections)) {
        setBriefPayloadTrimmedSections(
          parsed.briefPayloadTrimmedSections
            .map((entry) => toString(entry))
            .filter(Boolean)
        );
      }

      if (
        parsed.recommendedProviders &&
        typeof parsed.recommendedProviders === 'object' &&
        !Array.isArray(parsed.recommendedProviders)
      ) {
        setRecommendedProviders(parsed.recommendedProviders as AiBriefRecommendedProviders);
      }

      if (Array.isArray(parsed.otherProviders)) {
        setOtherProviders(parsed.otherProviders as AiBriefOtherProvidersByService);
      }

      if (Array.isArray(parsed.selectedProviders)) {
        setSelectedProviders(parsed.selectedProviders as AiBriefProvider[]);
      }

      if (typeof parsed.totalBudget === 'string') {
        setTotalBudget(parsed.totalBudget);
      }

      if (typeof parsed.editableDuration === 'string') {
        setEditableDuration(parsed.editableDuration);
      }

      if (typeof parsed.editablePaymentPlan === 'string') {
        setEditablePaymentPlan(parsed.editablePaymentPlan);
      }
    } catch (error) {
      console.error('Failed to restore OAuth wizard snapshot:', error);
    } finally {
      window.sessionStorage.removeItem(PROJECT_NEW_OAUTH_SNAPSHOT_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!wizardStateHydratedRef.current) return;

    const snapshot: ProjectNewPersistedWizardState = {
      savedAt: Date.now(),
      step,
      projectInputMode,
      intent,
      manualTitle,
      manualServiceSearch,
      groupedServicesPage,
      manualServiceIds,
      manualSelectedServicesMap,
      manualSpecificRequirements,
      manualDuration,
      manualPaymentPlan,
      manualCurrency,
      manualProjectLines,
      recommendation,
      selectedServiceIndexes,
      briefMessages,
      briefStatus,
      briefQuestions,
      briefAnswer,
      briefResult,
      briefModularDetails,
      briefFullDetails,
      briefText,
      briefPayloadTruncated,
      briefPayloadTrimmedSections,
      ...(recommendedProviders ? { recommendedProviders } : {}),
      ...(otherProviders ? { otherProviders } : {}),
      selectedProviders,
      milestoneAssignments,
      milestoneAssignmentsInitialized,
      totalBudget,
      editableDuration,
      editablePaymentPlan,
    };

    try {
      window.sessionStorage.setItem(
        PROJECT_NEW_WIZARD_STATE_KEY,
        JSON.stringify(snapshot)
      );
    } catch (error) {
      console.error('Failed to persist project wizard state:', error);
    }
  }, [
    step,
    projectInputMode,
    intent,
    manualTitle,
    manualServiceSearch,
    groupedServicesPage,
    manualServiceIds,
    manualSelectedServicesMap,
    manualSpecificRequirements,
    manualDuration,
    manualPaymentPlan,
    manualCurrency,
    manualProjectLines,
    recommendation,
    selectedServiceIndexes,
    briefMessages,
    briefStatus,
    briefQuestions,
    briefAnswer,
    briefResult,
    briefModularDetails,
    briefFullDetails,
    briefText,
    briefPayloadTruncated,
    briefPayloadTrimmedSections,
    recommendedProviders,
    otherProviders,
    selectedProviders,
    milestoneAssignments,
    milestoneAssignmentsInitialized,
    totalBudget,
    editableDuration,
    editablePaymentPlan,
  ]);

  const groupedServicesData = useMemo(() => {
    const root = toObject(groupedServicesResponse);
    const nestedData = toObject(root?.data);
    if (nestedData) {
      return nestedData;
    }

    return root ?? {};
  }, [groupedServicesResponse]);

  const groupedServicesPagination = useMemo(() => {
    const root = toObject(groupedServicesResponse);
    const pagination = toObject(root?.pagination);
    if (!pagination) {
      return null;
    }

    const parsedPage = toNumber(pagination.page);
    const parsedLimit = toNumber(pagination.limit);
    const parsedTotal = toNumber(pagination.total);
    const parsedTotalPages = toNumber(pagination.total_pages);

    const page =
      parsedPage !== null && parsedPage > 0 ? Math.trunc(parsedPage) : groupedServicesPage;
    const limit =
      parsedLimit !== null && parsedLimit > 0
        ? Math.trunc(parsedLimit)
        : GROUPED_SERVICES_DEFAULT_LIMIT;
    const total = parsedTotal !== null && parsedTotal >= 0 ? Math.trunc(parsedTotal) : 0;
    const totalPages =
      parsedTotalPages !== null && parsedTotalPages > 0
        ? Math.trunc(parsedTotalPages)
        : Math.max(1, Math.ceil(total / Math.max(limit, 1)));
    const hasMore =
      typeof pagination.has_more === 'boolean' ? pagination.has_more : page < totalPages;

    return {
      page,
      limit,
      total,
      total_pages: totalPages,
      has_more: hasMore,
    };
  }, [groupedServicesResponse, groupedServicesPage]);

  useEffect(() => {
    if (!groupedServicesPagination) {
      return;
    }

    if (groupedServicesPage > groupedServicesPagination.total_pages) {
      setGroupedServicesPage(Math.max(1, groupedServicesPagination.total_pages));
    }
  }, [groupedServicesPage, groupedServicesPagination]);

  const serviceCatalogById = useMemo(() => {
    const map = new Map<string, ServiceCatalogEntry>();

    const addService = (
      candidate: unknown,
      fallbackCategoryName?: string,
      fallbackCategoryId?: string | number,
      fallbackSubcategoryName?: string
    ) => {
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
      const categoryObject = toObject(service.category);
      const categoryName =
        toLocalizedString(service.category_name) ||
        (typeof service.category === 'string' ? toString(service.category) : '') ||
        toLocalizedString(categoryObject?.name) ||
        toLocalizedString(service.parent_category) ||
        toString(fallbackCategoryName);
      const categoryIdCandidate =
        service.category_id ??
        service.categoryId ??
        categoryObject?.id ??
        fallbackCategoryId;
      const subcategoryName =
        toLocalizedString(service.subcategory_name) ||
        toLocalizedString(service.subcategory) ||
        toString(fallbackSubcategoryName);

      map.set(String(serviceId), {
        name: toString(service.name) || existing.name,
        description: toString(service.description) || existing.description,
        delivery_provider: hasRawProvider
          ? normalizeDeliveryProvider(rawProvider)
          : existing.delivery_provider,
        category_name: categoryName || existing.category_name,
        ...(typeof categoryIdCandidate === 'string' || typeof categoryIdCandidate === 'number'
          ? { category_id: categoryIdCandidate }
          : existing.category_id !== undefined
            ? { category_id: existing.category_id }
            : {}),
        ...(subcategoryName
          ? { subcategory_name: subcategoryName }
          : existing.subcategory_name
            ? { subcategory_name: existing.subcategory_name }
            : {}),
      });
    };

    const source = toObject(groupedServicesData);
    if (!source) {
      return map;
    }

    Object.entries(source).forEach(([categoryKey, categoryValue]) => {
      const categoryObject = toObject(categoryValue);
      const categoryName =
        toLocalizedString(categoryObject?.category_name) ||
        toLocalizedString(categoryObject?.name) ||
        toString(categoryKey);
      const categoryId = categoryObject?.id;

      const normalizedCategoryId =
        typeof categoryId === 'string' || typeof categoryId === 'number'
          ? categoryId
          : undefined;

      if (Array.isArray(categoryValue)) {
        categoryValue.forEach((service) => {
          addService(service, categoryName, normalizedCategoryId);
        });
        return;
      }

      if (!categoryObject) {
        return;
      }

      let foundNestedServiceArray = false;
      Object.entries(categoryObject).forEach(([key, value]) => {
        if (!Array.isArray(value)) {
          return;
        }

        const serviceItems = value.filter((item) => {
          const serviceObject = toObject(item);
          return Boolean(serviceObject && ('id' in serviceObject || 'name' in serviceObject || 'slug' in serviceObject));
        });

        if (serviceItems.length === 0) {
          return;
        }

        foundNestedServiceArray = true;
        const normalizedSubcategoryKey = toString(key);
        const subcategoryName =
          normalizedSubcategoryKey &&
          normalizedSubcategoryKey.toLowerCase() !== 'services' &&
          normalizedSubcategoryKey.toLowerCase() !== 'data'
            ? normalizedSubcategoryKey
            : undefined;

        serviceItems.forEach((service) => {
          addService(service, categoryName, normalizedCategoryId, subcategoryName);
        });
      });

      if (!foundNestedServiceArray) {
        const servicesFromNode = categoryObject.services;
        const servicesFromData = categoryObject.data;
        const fallbackServices: unknown[] = Array.isArray(servicesFromNode)
          ? servicesFromNode
          : Array.isArray(servicesFromData)
            ? servicesFromData
            : [];

        fallbackServices.forEach((service) => {
          addService(service, categoryName, normalizedCategoryId);
        });
      }
    });

    return map;
  }, [groupedServicesData]);

  const availableApiServices = useMemo<ApiServiceOption[]>(
    () =>
      Array.from(serviceCatalogById.entries())
        .map(([id, service]) => ({
          id,
          name: toString(service.name),
          delivery_provider: service.delivery_provider,
          category_name: toString(service.category_name) || 'Altele',
          category_id: service.category_id,
          subcategory_name: toString(service.subcategory_name),
        }))
        .filter((service) => Boolean(service.name)),
    [serviceCatalogById]
  );

  const groupedAvailableApiServices = useMemo(() => {
    const groups = new Map<string, Map<string, ApiServiceOption[]>>();

    availableApiServices.forEach((service) => {
      const categoryName = toString(service.category_name) || 'Altele';
      const subcategoryName = toString(service.subcategory_name);
      const categoryGroup = groups.get(categoryName) ?? new Map<string, ApiServiceOption[]>();
      const subcategoryKey = subcategoryName || '__default__';
      const current = categoryGroup.get(subcategoryKey) ?? [];
      current.push(service);
      categoryGroup.set(subcategoryKey, current);
      groups.set(categoryName, categoryGroup);
    });

    return Array.from(groups.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([category_name, subcategories]) => ({
        category_name,
        subcategories: Array.from(subcategories.entries())
          .sort((a, b) => {
            const aDefault = a[0] === '__default__';
            const bDefault = b[0] === '__default__';
            if (aDefault && !bDefault) return -1;
            if (!aDefault && bDefault) return 1;
            return a[0].localeCompare(b[0]);
          })
          .map(([subcategoryKey, services]) => ({
            subcategory_name: subcategoryKey === '__default__' ? '' : subcategoryKey,
            services: [...services].sort((a, b) => a.name.localeCompare(b.name)),
          })),
      }));
  }, [availableApiServices]);

  const selectedManualServices = useMemo(
    () =>
      manualServiceIds
        .map(
          (serviceId) =>
            manualSelectedServicesMap[serviceId] ??
            availableApiServices.find((service) => service.id === serviceId)
        )
        .filter((service): service is NonNullable<typeof service> => service !== undefined),
    [manualServiceIds, manualSelectedServicesMap, availableApiServices]
  );

  useEffect(() => {
    if (manualServiceIds.length === 0 || availableApiServices.length === 0) {
      return;
    }

    setManualSelectedServicesMap((current) => {
      let changed = false;
      const next = { ...current };

      manualServiceIds.forEach((serviceId) => {
        const currentPageService = availableApiServices.find((service) => service.id === serviceId);
        if (!currentPageService) {
          return;
        }

        const existing = next[serviceId];
        if (
          existing &&
          existing.name === currentPageService.name &&
          existing.delivery_provider === currentPageService.delivery_provider &&
          existing.category_name === currentPageService.category_name &&
          existing.subcategory_name === currentPageService.subcategory_name
        ) {
          return;
        }

        next[serviceId] = currentPageService;
        changed = true;
      });

      return changed ? next : current;
    });
  }, [manualServiceIds, availableApiServices]);

  const selectedManualServicesById = useMemo(() => {
    const map = new Map<string, (typeof selectedManualServices)[number]>();
    selectedManualServices.forEach((service) => {
      map.set(service.id, service);
    });
    return map;
  }, [selectedManualServices]);

  const transitionTo = useCallback((nextStep: WizardStep) => {
    setStep((currentStep) => {
      if (STEP_TRANSITIONS[currentStep].includes(nextStep)) {
        return nextStep;
      }
      return currentStep;
    });
  }, []);

  const handleSelectProjectInputMode = useCallback((mode: ProjectInputMode) => {
    setProjectInputMode(mode);
    setStep('intent');
    setBriefQuestions([]);
    setBriefAnswer('');
    setBriefSubscriptionError(null);
  }, []);

  const handleStartNewProject = useCallback(() => {
    setStartOverDialogOpen(true);
  }, []);

  const handleConfirmStartNewProject = useCallback(() => {
    if (typeof window === 'undefined') return;

    window.sessionStorage.removeItem(AI_BRIEF_DRAFT_STORAGE_KEY);
    window.sessionStorage.removeItem(PROJECT_NEW_WIZARD_STATE_KEY);
    window.sessionStorage.removeItem(PROJECT_NEW_OAUTH_SNAPSHOT_KEY);
    window.location.assign(window.location.pathname);
  }, []);

  const handleToggleManualService = useCallback((serviceId: string, selected: boolean) => {
    setManualServiceIds((current) => {
      if (!selected) {
        return current.filter((entry) => entry !== serviceId);
      }

      if (current.includes(serviceId)) {
        return current;
      }

      return [...current, serviceId];
    });
    setManualSelectedServicesMap((current) => {
      if (!selected) {
        if (!(serviceId in current)) {
          return current;
        }
        const next = { ...current };
        delete next[serviceId];
        return next;
      }

      const service = availableApiServices.find((entry) => entry.id === serviceId);
      if (!service) {
        return current;
      }

      const existing = current[serviceId];
      if (
        existing &&
        existing.name === service.name &&
        existing.delivery_provider === service.delivery_provider &&
        existing.category_name === service.category_name &&
        existing.subcategory_name === service.subcategory_name
      ) {
        return current;
      }

      return {
        ...current,
        [serviceId]: service,
      };
    });
  }, [availableApiServices]);

  useEffect(() => {
    setManualProjectLines((current) => {
      const existingByServiceId = new Map(
        current
          .filter((line) => Boolean(toString(line.service_id)))
          .map((line) => [toString(line.service_id), line] as const)
      );

      const nextLines = selectedManualServices.map((service) => {
        const existing = existingByServiceId.get(service.id);
        const providerFromApi: DeliveryProvider = service.delivery_provider ?? 'manual_upload';

        if (existing) {
          return {
            ...existing,
            service_id: service.id,
            service_name: service.name,
            delivery_provider: providerFromApi,
          };
        }

        const nextId = `manual-line-${manualLineCounterRef.current}`;
        manualLineCounterRef.current += 1;
        return createManualProjectLine(nextId, service);
      });

      const unchanged =
        current.length === nextLines.length &&
        current.every((line, index) => {
          const next = nextLines[index];
          return (
            line.id === next.id &&
            line.service_id === next.service_id &&
            line.service_name === next.service_name &&
            line.delivery_provider === next.delivery_provider &&
            line.description === next.description &&
            line.budget_percentage === next.budget_percentage &&
            line.milestones === next.milestones
          );
        });

      return unchanged ? current : nextLines;
    });
  }, [selectedManualServices]);

  const handleManualLineFieldChange = useCallback(
    (
      lineId: string,
      field: 'description' | 'budget_percentage',
      value: string
    ) => {
      setManualProjectLines((current) =>
        current.map((line) => (line.id === lineId ? { ...line, [field]: value } : line))
      );
    },
    []
  );

  const handleAddManualMilestone = useCallback((lineId: string) => {
    const nextId = `manual-milestone-${manualMilestoneCounterRef.current}`;
    manualMilestoneCounterRef.current += 1;
    setManualProjectLines((current) =>
      current.map((line) =>
        line.id === lineId
          ? { ...line, milestones: [...line.milestones, createManualMilestone(nextId)] }
          : line
      )
    );
  }, []);

  const handleRemoveManualMilestone = useCallback((lineId: string, milestoneId: string) => {
    setManualProjectLines((current) =>
      current.map((line) => {
        if (line.id !== lineId) {
          return line;
        }

        return {
          ...line,
          milestones: line.milestones.filter((milestone) => milestone.id !== milestoneId),
        };
      })
    );
  }, []);

  const handleManualMilestoneFieldChange = useCallback(
    (
      lineId: string,
      milestoneId: string,
      field: keyof Omit<ManualMilestoneForm, 'id'>,
      value: string
    ) => {
      setManualProjectLines((current) =>
        current.map((line) => {
          if (line.id !== lineId) {
            return line;
          }

          return {
            ...line,
            milestones: line.milestones.map((milestone) =>
              milestone.id === milestoneId ? { ...milestone, [field]: value } : milestone
            ),
          };
        })
      );
    },
    []
  );

  const handleContinueManualToReview = useCallback(async () => {
    const normalizedIntent = intent.trim();
    const normalizedTitle = toString(manualTitle) || buildProjectTitle(normalizedIntent);

    if (!normalizedTitle) {
      toast.error(t('please_fill_in_the_project_title'));
      return;
    }

    if (selectedManualServices.length === 0) {
      toast.error(
        t('select_at_least_one_technology_service_from_the_api_list')
      );
      return;
    }

    const normalizedLines = manualProjectLines
      .map((line) => {
        const serviceId = toString(line.service_id);
        const selectedService = selectedManualServicesById.get(serviceId);
        const budgetPercentage = toNumber(line.budget_percentage) ?? 0;
        if (!serviceId || !selectedService || budgetPercentage <= 0) {
          return null;
        }
        const deliveryProvider: DeliveryProvider =
          selectedService.delivery_provider ?? 'manual_upload';

        const milestones = line.milestones
          .map((milestone) => {
            const milestoneTitle = toString(milestone.title);
            const amount = toNumber(milestone.amount);
            if (!milestoneTitle || amount === null || amount <= 0) {
              return null;
            }

            return {
              title: milestoneTitle,
              ...(toString(milestone.description)
                ? { description: toString(milestone.description) }
                : {}),
              ...(toNumber(milestone.percentage) !== null
                ? { percentage: toNumber(milestone.percentage) as number }
                : {}),
              amount,
            };
          })
          .filter(
            (
              milestone
            ): milestone is NonNullable<
              NonNullable<AiBriefResponse['final_brief']>['project_lines'][number]
            >['milestones'][number] => milestone !== null
          );

        return {
          service_name: selectedService.name,
          delivery_provider: deliveryProvider,
          description: toString(line.description),
          budget_percentage: budgetPercentage,
          milestones,
        };
      })
      .filter(
        (
          line
        ): line is NonNullable<AiBriefResponse['final_brief']>['project_lines'][number] =>
          line !== null
      );

    if (normalizedLines.length === 0) {
      toast.error(
        t('complete_at_least_one_valid_project_line_auto_selected_service_budget_percentage')
      );
      return;
    }

    const totalPercentage = normalizedLines.reduce(
      (sum, line) => sum + Number(line.budget_percentage || 0),
      0
    );

    if (totalPercentage > 100) {
      toast.error(t('total_line_percentage_cannot_exceed_100'));
      return;
    }

    const technologies = selectedManualServices.map((service) => service.name);
    const specificRequirements = manualSpecificRequirements
      .split('\n')
      .map((entry) => toString(entry))
      .filter(Boolean);
    const duration = toString(manualDuration);
    const paymentPlan = toString(manualPaymentPlan).toUpperCase();
    const currency = toString(manualCurrency).toUpperCase() || 'USD';
    const inferredBudget = normalizedLines.reduce(
      (sum, line) =>
        sum +
        line.milestones.reduce(
          (milestoneSum, milestone) => milestoneSum + Number(milestone.amount || 0),
          0
        ),
      0
    );

    const manualBrief: NonNullable<AiBriefResponse['final_brief']> = {
      title: normalizedTitle,
      project_lines: normalizedLines,
      ...(normalizedIntent ? { description: normalizedIntent } : {}),
      ...(technologies.length > 0 ? { technologies } : {}),
      ...(specificRequirements.length > 0 ? { specific_requirements: specificRequirements } : {}),
      ...(duration ? { duration } : {}),
      ...(duration ? { recommended_duration: duration } : {}),
      ...(duration ? { project_duration: duration } : {}),
      ...(paymentPlan ? { payment_plan: paymentPlan } : {}),
      ...(currency ? { currency } : {}),
    };

    setBriefResult(manualBrief);
    setBriefModularDetails(manualBrief);
    setBriefFullDetails(null);
    setBriefStatus('FINAL');
    setBriefMessages([]);
    setBriefQuestions([]);
    setBriefAnswer('');
    setBriefText('');
    setBriefDebugResponseJson('');
    setBriefPayloadTruncated(false);
    setBriefPayloadTrimmedSections([]);
    setRecommendation(null);
    setSelectedServiceIndexes([]);
    setRecommendedProviders(undefined);
    setOtherProviders(undefined);
    setSelectedProviders([]);
    setBriefSubscriptionError(null);
    if (!totalBudget.trim() && inferredBudget > 0) {
      setTotalBudget(String(Math.round(inferredBudget)));
    }
    if (duration) {
      setEditableDuration(duration);
    }
    if (paymentPlan) {
      setEditablePaymentPlan(paymentPlan);
    }
    setLoadingManualProviders(true);
    try {
      const servicesPayload = selectedManualServices.map((service) => ({
        id: service.id,
        name: service.name,
      }));

      const recommendProvidersResponse = await aiService.recommendProviders({
        project_title: normalizedTitle,
        description:
          normalizedIntent || toString(manualBrief.description) || normalizedTitle,
        services: servicesPayload,
        specific_requirements: specificRequirements,
        top_per_service: 2,
        candidate_limit: 50,
      });

      const responseRoot = toObject(recommendProvidersResponse) ?? {};
      const responseSource = toObject(responseRoot.result) ?? responseRoot;
      const normalizedRecommendedProviders = normalizeRecommendedProviders(
        responseSource.recommended_providers ?? responseRoot.recommended_providers
      );
      const normalizedOtherProviders = normalizeOtherProvidersByService(
        responseSource.other_providers_by_service ?? responseRoot.other_providers_by_service
      );

      setRecommendedProviders(normalizedRecommendedProviders);
      setOtherProviders(normalizedOtherProviders);

      if (normalizedRecommendedProviders) {
        const autoSelectedProviders = Object.entries(normalizedRecommendedProviders)
          .flatMap(([serviceName, providers]) =>
            Array.isArray(providers)
              ? providers.map((provider) => ({
                  ...provider,
                  service_name: serviceName,
                }))
              : []
          )
          .filter(
            (provider): provider is AiBriefProvider & { service_name: string } =>
              Boolean(provider && provider.id)
          );

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
      } else {
        setSelectedProviders([]);
      }
    } catch (error) {
      setRecommendedProviders(undefined);
      setOtherProviders(undefined);
      setSelectedProviders([]);
      toast.error(
        extractErrorMessage(
          error,
          t('could_not_generate_provider_recommendations_for_manual_data')
        )
      );
    } finally {
      setLoadingManualProviders(false);
      transitionTo('providers');
    }
  }, [
    intent,
    manualTitle,
    selectedManualServices,
    manualProjectLines,
    manualSpecificRequirements,
    manualDuration,
    manualPaymentPlan,
    manualCurrency,
    totalBudget,
    transitionTo,
    selectedManualServicesById,
    t,
  ]);

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

  const wizardSteps = useMemo(
    () => (projectInputMode === 'manual' ? MANUAL_WIZARD_STEPS : AI_WIZARD_STEPS),
    [projectInputMode]
  );

  const stepIndex = useMemo(
    () => wizardSteps.findIndex((wizardStep) => wizardStep.id === step),
    [step, wizardSteps]
  );
  const currentStepNumber = stepIndex >= 0 ? stepIndex + 1 : null;

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

  const reviewMilestoneEntries = useMemo<ReviewMilestoneEntry[]>(() => {
    const entries: ReviewMilestoneEntry[] = [];

    reviewLines.forEach((line, lineIndex) => {
      const serviceName = toString(line.service_name);
      const serviceKey = getServiceKey(serviceName);
      const milestones = Array.isArray(line.milestones) ? line.milestones : [];

      milestones.forEach((milestone, milestoneIndex) => {
        entries.push({
          key: getMilestoneAssignmentKey(lineIndex, milestoneIndex),
          lineIndex,
          milestoneIndex,
          serviceName,
          serviceKey,
          milestone,
          initialAssignedProviderId: getMilestoneAssignedProviderId(milestone),
        });
      });
    });

    return entries;
  }, [reviewLines]);

  const reviewMilestonesByService = useMemo(() => {
    const grouped = new Map<string, ReviewMilestoneEntry[]>();

    reviewMilestoneEntries.forEach((entry) => {
      const existing = grouped.get(entry.serviceKey) ?? [];
      existing.push(entry);
      grouped.set(entry.serviceKey, existing);
    });

    return grouped;
  }, [reviewMilestoneEntries]);

  const milestoneAssignmentSignature = useMemo(
    () =>
      reviewMilestoneEntries
        .map(
          (entry) =>
            `${entry.key}:${entry.serviceKey}:${toString(entry.milestone.title)}:${toNumber(entry.milestone.amount) ?? 0}`
        )
        .join('|'),
    [reviewMilestoneEntries]
  );

  const selectedProviderIdsByService = useMemo(() => {
    const grouped = new Map<string, number[]>();

    selectedProviders.forEach((provider) => {
      const providerId = getProviderId(provider);
      if (providerId === null) {
        return;
      }

      const serviceKey = getServiceKey((provider as { service_name?: unknown }).service_name);
      if (!serviceKey) {
        return;
      }

      const existing = grouped.get(serviceKey) ?? [];
      if (!existing.includes(providerId)) {
        existing.push(providerId);
        grouped.set(serviceKey, existing);
      }
    });

    return grouped;
  }, [selectedProviders]);

  const selectedProviderIdSet = useMemo(
    () =>
      new Set(
        selectedProviders
          .map((provider) => getProviderId(provider))
          .filter((providerId): providerId is number => providerId !== null)
      ),
    [selectedProviders]
  );

  useEffect(() => {
    if (milestoneAssignmentSignatureRef.current === milestoneAssignmentSignature) {
      return;
    }

    milestoneAssignmentSignatureRef.current = milestoneAssignmentSignature;
    setMilestoneAssignments({});
    setMilestoneAssignmentsInitialized(false);
  }, [milestoneAssignmentSignature]);

  useEffect(() => {
    if (reviewMilestoneEntries.length === 0) {
      if (Object.keys(milestoneAssignments).length > 0) {
        setMilestoneAssignments({});
      }
      if (milestoneAssignmentsInitialized) {
        setMilestoneAssignmentsInitialized(false);
      }
      return;
    }

    const entryByKey = new Map(reviewMilestoneEntries.map((entry) => [entry.key, entry] as const));

    setMilestoneAssignments((current) => {
      let changed = false;
      const next: Record<string, number> = {};

      Object.entries(current).forEach(([milestoneKey, providerId]) => {
        const entry = entryByKey.get(milestoneKey);
        if (!entry) {
          changed = true;
          return;
        }

        const allowedProviderIds = selectedProviderIdsByService.get(entry.serviceKey) ?? [];
        if (!allowedProviderIds.includes(providerId)) {
          changed = true;
          return;
        }

        next[milestoneKey] = providerId;
      });

      if (!changed && Object.keys(current).length === Object.keys(next).length) {
        return current;
      }

      return next;
    });
  }, [reviewMilestoneEntries, selectedProviderIdsByService, milestoneAssignments, milestoneAssignmentsInitialized]);

  useEffect(() => {
    if (milestoneAssignmentsInitialized) {
      return;
    }

    if (reviewMilestoneEntries.length === 0) {
      return;
    }

    if (selectedProviders.length === 0) {
      return;
    }

    setMilestoneAssignments((current) => {
      const next: Record<string, number> = { ...current };
      let changed = false;

      reviewMilestoneEntries.forEach((entry) => {
        if (next[entry.key] !== undefined) {
          return;
        }

        if (entry.initialAssignedProviderId !== null) {
          const selectedIds = selectedProviderIdsByService.get(entry.serviceKey) ?? [];
          if (selectedIds.includes(entry.initialAssignedProviderId)) {
            next[entry.key] = entry.initialAssignedProviderId;
            changed = true;
          }
        }
      });

      const groupedEntries = new Map<string, ReviewMilestoneEntry[]>();
      reviewMilestoneEntries.forEach((entry) => {
        const existing = groupedEntries.get(entry.serviceKey) ?? [];
        existing.push(entry);
        groupedEntries.set(entry.serviceKey, existing);
      });

      groupedEntries.forEach((entries, serviceKey) => {
        const providerIds = selectedProviderIdsByService.get(serviceKey) ?? [];
        if (providerIds.length === 0) {
          return;
        }

        const assignmentCountByProvider = new Map<number, number>(
          providerIds.map((providerId) => [providerId, 0] as const)
        );

        entries.forEach((entry) => {
          const assignedProviderId = next[entry.key];
          if (assignedProviderId !== undefined) {
            assignmentCountByProvider.set(
              assignedProviderId,
              (assignmentCountByProvider.get(assignedProviderId) ?? 0) + 1
            );
          }
        });

        entries
          .filter((entry) => next[entry.key] === undefined)
          .forEach((entry) => {
            const targetProviderId = providerIds.reduce((best, currentProviderId) => {
              const bestCount = assignmentCountByProvider.get(best) ?? 0;
              const currentCount = assignmentCountByProvider.get(currentProviderId) ?? 0;
              return currentCount < bestCount ? currentProviderId : best;
            }, providerIds[0]);

            next[entry.key] = targetProviderId;
            assignmentCountByProvider.set(
              targetProviderId,
              (assignmentCountByProvider.get(targetProviderId) ?? 0) + 1
            );
            changed = true;
          });
      });

      return changed ? next : current;
    });

    setMilestoneAssignmentsInitialized(true);
  }, [
    milestoneAssignmentsInitialized,
    reviewMilestoneEntries,
    selectedProviders.length,
    selectedProviderIdsByService,
  ]);

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

  const connectedOAuthProviders = useMemo(() => {
    const connected = new Set<OAuthProvider>();
    const connectedAccounts = Array.isArray(user?.connected_accounts)
      ? (user?.connected_accounts ?? [])
      : [];

    connectedAccounts.forEach((account) => {
      if (account?.provider === 'github' || account?.provider === 'google' || account?.provider === 'figma') {
        connected.add(account.provider);
      }
    });

    if (user?.github_token) {
      connected.add('github');
    }

    return connected;
  }, [user?.connected_accounts, user?.github_token]);

  const requiredOAuthProviders = useMemo(() => {
    const required: OAuthProvider[] = [];

    briefingProjectLines.forEach((line) => {
      const oauthProvider = mapDeliveryProviderToOAuth(line.delivery_provider);
      if (!oauthProvider) {
        return;
      }

      if (!required.includes(oauthProvider)) {
        required.push(oauthProvider);
      }
    });

    return required;
  }, [briefingProjectLines]);

  const requiredOAuthProvidersByService = useMemo(() => {
    const grouped = new Map<OAuthProvider, string[]>();

    briefingProjectLines.forEach((line) => {
      const oauthProvider = mapDeliveryProviderToOAuth(line.delivery_provider);
      if (!oauthProvider) {
        return;
      }

      const currentServices = grouped.get(oauthProvider) ?? [];
      if (!currentServices.includes(line.service_name)) {
        currentServices.push(line.service_name);
      }
      grouped.set(oauthProvider, currentServices);
    });

    return grouped;
  }, [briefingProjectLines]);

  const missingOAuthProviders = useMemo(
    () => requiredOAuthProviders.filter((provider) => !connectedOAuthProviders.has(provider)),
    [requiredOAuthProviders, connectedOAuthProviders]
  );

  const canContinueFromConnections = useMemo(
    () => Boolean(briefResult && briefStatus === 'FINAL') && missingOAuthProviders.length === 0,
    [briefResult, briefStatus, missingOAuthProviders.length]
  );

  useEffect(() => {
    if (oauthCallbackHandledRef.current) return;

    const status = searchParams.get('status');
    if (!status) return;

    oauthCallbackHandledRef.current = true;

    const provider = searchParams.get('provider');
    const message = searchParams.get('message');

    if (status === 'success') {
      toast.success(message || t('provider_connected_successfully'));
      setStep('connections');
      void refreshUser().catch(() => {
        // Ignore transient refresh errors after OAuth callback.
      });
    } else if (status === 'failed') {
      const normalizedProvider = provider ? provider.trim() : '';
      toast.error(
        message ||
          (normalizedProvider
            ? t('provider_connection_failed_with_name', { provider: normalizedProvider })
            : t('provider_connection_failed'))
      );
      setStep('connections');
    }

    const url = new URL(window.location.href);
    url.searchParams.delete('provider');
    url.searchParams.delete('status');
    url.searchParams.delete('message');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }, [refreshUser, searchParams, t]);

  const handleConnectOAuthProvider = (provider: OAuthProvider) => {
    const redirectUrl = buildOAuthRedirectUrl(provider);
    if (!redirectUrl) {
      toast.error(t('oauth_backend_url_missing'));
      return;
    }

    if (typeof window !== 'undefined') {
      const snapshot: ProjectNewOAuthSnapshot = {
        savedAt: Date.now(),
        step,
        projectInputMode,
        intent,
        manualTitle,
        briefStatus,
        briefResult,
        briefModularDetails,
        briefFullDetails,
        briefText,
        briefPayloadTruncated,
        briefPayloadTrimmedSections,
        ...(recommendedProviders ? { recommendedProviders } : {}),
        ...(otherProviders ? { otherProviders } : {}),
        selectedProviders,
        totalBudget,
        editableDuration,
        editablePaymentPlan,
      };

      try {
        window.sessionStorage.setItem(
          PROJECT_NEW_OAUTH_SNAPSHOT_KEY,
          JSON.stringify(snapshot)
        );
      } catch (error) {
        console.error('Failed to persist OAuth wizard snapshot:', error);
      }
    }

    window.location.assign(redirectUrl);
  };

  useEffect(() => {
    if (step !== 'connections') {
      return;
    }

    void refreshUser().catch(() => {
      // Keep the wizard usable even if auth refresh fails transiently.
    });
  }, [step, refreshUser]);

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

  const handleAssignMilestoneToProvider = useCallback(
    (serviceName: string, milestoneKey: string, provider: AiBriefProvider) => {
      const providerId = getProviderId(provider);
      if (providerId === null) {
        return;
      }

      const serviceKey = getServiceKey(serviceName);
      const selectedForService = selectedProviderIdsByService.get(serviceKey) ?? [];
      if (!selectedForService.includes(providerId)) {
        return;
      }

      setMilestoneAssignments((current) => {
        if (current[milestoneKey] === providerId) {
          return current;
        }

        return {
          ...current,
          [milestoneKey]: providerId,
        };
      });
    },
    [selectedProviderIdsByService]
  );

  const handleRemoveMilestoneAssignment = useCallback((milestoneKey: string) => {
    setMilestoneAssignments((current) => {
      if (!(milestoneKey in current)) {
        return current;
      }

      const next = { ...current };
      delete next[milestoneKey];
      return next;
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
              ? providers.map((provider) => ({
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
      setBriefSubscriptionError(
        t('realtime_channel_is_not_available_at_the_moment')
      );
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
                t('could_not_load_the_final_brief_result')
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
                t('could_not_load_the_final_brief_result')
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
        t('brief_generation_failed');

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
  }, [step, user?.id, applyBriefResponse, cleanupBriefSubscription, loadBriefResultById, t]);

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
        toast.error(
          extractErrorMessage(
            error,
            t('could_not_generate_the_brief')
          )
        );
      }
    },
    [applyBriefResponse, loadBriefResultById, locale, t]
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
      toast.error(
        t('please_complete_the_project_intent_before_continuing')
      );
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
        toast.error(
          t('ai_did_not_return_services_try_adding_more_context')
        );
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
      toast.success(t('ai_recommendation_has_been_generated'));
    } catch (error) {
      toast.error(
        extractErrorMessage(
          error,
          t('could_not_generate_service_recommendation')
        )
      );
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
      toast.error(
        t('select_at_least_one_project_line')
      );
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
      toast.error(t('write_an_answer_for_clarification'));
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

    const serviceIndex = new Map<string, number | string>();
    selectedServices.forEach((service) => {
      if (typeof service.service_id === 'string' || typeof service.service_id === 'number') {
        serviceIndex.set(
          `${service.service_name.toLowerCase()}::${service.delivery_provider}`,
          service.service_id
        );
      }
    });

    const serviceIdByName = new Map<string, number | string>();
    availableApiServices.forEach((service) => {
      const numericId = toNumber(service.id);
      serviceIdByName.set(
        service.name.toLowerCase(),
        numericId !== null ? numericId : service.id
      );
    });

    const projectLines = reviewLines.map((line, index) => {
      const serviceKey = `${line.service_name.toLowerCase()}::${line.delivery_provider}`;
      const serviceId =
        serviceIndex.get(serviceKey) ?? serviceIdByName.get(line.service_name.toLowerCase());
      const milestones = (Array.isArray(line.milestones) ? line.milestones : []).map(
        (milestone, milestoneIndex) => {
          const milestoneKey = getMilestoneAssignmentKey(index, milestoneIndex);
          const assignedProviderId = milestoneAssignments[milestoneKey];
          const normalizedAssignedProviderId =
            typeof assignedProviderId === 'number' && selectedProviderIdSet.has(assignedProviderId)
              ? assignedProviderId
              : null;

          return {
            ...milestone,
            assigned_provider_id: normalizedAssignedProviderId,
          };
        }
      );

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
        milestones,
        description: line.description,
        budget_percentage: line.budget_percentage,
      };
    });

    const briefProjectLines = projectLines.map((line) => ({
      ...(typeof line.service_id === 'string' || typeof line.service_id === 'number'
        ? { service_id: line.service_id }
        : {}),
      service_name: line.service_name,
      delivery_provider: line.delivery_provider,
      description: toString(line.description),
      budget_percentage: Number(line.budget_percentage || 0),
      milestones: line.milestones,
    }));

    return {
      ...(typeof user?.id === 'string' || typeof user?.id === 'number'
        ? { clientId: user.id }
      : {}),
      title: buildProjectTitle(intent, briefResult.title),
      description: toString(briefResult.description) || intent.trim(),
      budget: budgetValue,
      ...(briefingDisplay.currency ? { currency: briefingDisplay.currency } : {}),
      ...(effectivePaymentPlan ? { paymentPlan: effectivePaymentPlan } : {}),
      ...(effectiveDuration ? { duration: effectiveDuration } : {}),
      brief: {
        title: briefResult.title,
        project_lines: briefProjectLines,
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
    availableApiServices,
    reviewLines,
    milestoneAssignments,
    selectedProviderIdSet,
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
      toast.error(t('final_brief_is_not_available'));
      return;
    }

    if (!Number.isFinite(budgetValue) || budgetValue <= 0) {
      toast.error(
        t('enter_a_valid_total_budget_for_line_distribution')
      );
      return;
    }

    if (!effectiveDuration) {
      toast.error(t('complete_project_duration_before_creation'));
      return;
    }

    if (!effectivePaymentPlan) {
      toast.error(t('select_payment_plan_before_creation'));
      return;
    }

    if (requiresMilestonesByDuration && linesMissingMilestones.length > 0) {
      toast.error(
        t('for_durations_over_3_months_each_line_must_include_milestones_missing_for', {
          lines: linesMissingMilestones.join(', '),
        })
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

      toast.success(t('modular_project_created_successfully'));

      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(PROJECT_NEW_WIZARD_STATE_KEY);
        window.sessionStorage.removeItem(PROJECT_NEW_OAUTH_SNAPSHOT_KEY);
      }

      if (projectIdentifier) {
        router.push(`/projects/${projectIdentifier}`);
        return;
      }

      router.push('/projects');
    } catch (error) {
      toast.error(
        extractErrorMessage(
          error,
          t('could_not_create_project')
        )
      );
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
              <span className="text-sm text-muted-foreground">
                {t('loading_project_creation_wizard')}
              </span>
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
              <span>
                {t('you_need_to_be_authenticated_to_create_a_modular_project')}
              </span>
              <Button asChild size="sm">
                <Link href="/auth/signin">{t('sign_in')}</Link>
              </Button>
            </AlertDescription>
          </Alert>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div
      className="flex h-screen w-full overflow-hidden font-sans transition-colors duration-300"
      style={
        {
          ...(currentTheme as CSSProperties),
          backgroundColor: 'var(--bg-main)',
          color: 'var(--text-main)',
        } as CSSProperties
      }
    >
      <TrustoraThemeStyles />
      <style jsx global>{`
        .trustora-wizard input,
        .trustora-wizard textarea,
        .trustora-wizard button[role='combobox'] {
          background-color: var(--input-bg);
          border-color: var(--border-color);
          color: var(--text-main);
        }
        .trustora-wizard input::placeholder,
        .trustora-wizard textarea::placeholder {
          color: var(--text-muted);
          opacity: 0.9;
        }
      `}</style>

      <aside className="w-64 bg-[#0B1C2D] border-r border-[#152B42] flex flex-col justify-between hidden md:flex shrink-0 z-20">
        <div>
          <div className="h-20 flex items-center px-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <img src="/trustora-logo2.png" alt="Trustora Logo" className="w-8 h-8 object-contain rounded border border-white/10" />
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight text-white leading-none">TRUSTORA</span>
                <span className="text-[8px] uppercase font-bold tracking-[0.2em] text-[#1BC47D] mt-0.5">{tDashboard('hero.badge')}</span>
              </div>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3 mt-4">{tDashboard('quick_actions.title')}</p>

            <button type="button" onClick={() => router.push('/dashboard')} className={dashboardSidebarItemClass('overview')}>
              <LayoutDashboard size={18} />
              {tDashboard('tabs.overview')}
            </button>
            {isClient && !isProvider ? (
              <button type="button" onClick={() => router.push('/projects/new')} className={dashboardSidebarItemClass('new-project')}>
                <Plus size={18} />
                {tDashboard('projects.new_project')}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => router.push(`/dashboard?tab=${isProvider ? 'finance' : 'projects'}`)}
              className={dashboardSidebarItemClass(isProvider ? 'finance' : 'projects')}
            >
              <Lock size={18} />
              {isProvider ? tDashboard('tabs.finance') : tDashboard('tabs.projects')}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/dashboard?tab=${isProvider ? 'projects' : 'services'}`)}
              className={dashboardSidebarItemClass(isProvider ? 'projects' : 'services')}
            >
              <Layers size={18} />
              {isProvider ? tDashboard('tabs.projects') : tDashboard('tabs.services')}
            </button>
            <button type="button" onClick={() => router.push('/dashboard?tab=messages')} className={dashboardSidebarItemClass('messages')}>
              <History size={18} />
              {tDashboard('tabs.messages')}
            </button>
            {isProvider ? (
              <>
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3 mt-8">
                  {servicesTitle}
                </p>
                <button type="button" onClick={() => router.push('/dashboard?tab=services')} className={dashboardSidebarItemClass('services')}>
                  <Users size={18} />
                  {tDashboard('tabs.services')}
                </button>
              </>
            ) : null}
          </nav>
        </div>

        <div className="p-4 border-t border-white/5">
          <button type="button" onClick={() => router.push('/dashboard?tab=settings')} className={`${dashboardSidebarItemClass('settings')} mb-2`}>
            <Settings size={18} />
            {tDashboard('tabs.settings')}
          </button>
          <div className="flex items-center gap-3 px-3 py-2 mt-2 bg-[#152B42] rounded-xl border border-white/5">
            <div className="relative">
              <Avatar className="w-8 h-8 border border-white/10">
                <AvatarImage src={userAvatarSrc} alt={userDisplayName} />
                <AvatarFallback className="bg-gradient-to-tr from-[#1BC47D] to-[#0B1C2D] text-white text-xs font-bold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#1BC47D] rounded-full border-2 border-[#152B42]" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{userDisplayName}</p>
              <p className="text-[10px] text-[#1BC47D] uppercase font-bold flex items-center gap-1">
                <CheckCircle2 size={10} /> {isProvider ? tDashboard('hero.role.provider') : tDashboard('hero.role.client')}
              </p>
            </div>
          </div>
        </div>
      </aside>
      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative transition-colors duration-300">
        <header
          className="h-20 backdrop-blur-md border-b flex items-center justify-between px-4 md:px-6 z-10 shrink-0 transition-colors duration-300"
          style={{ backgroundColor: 'var(--header-bg)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-main)' }}>{t('start_new_project')}</h1>
            <span className="px-2.5 py-1 bg-[#1BC47D]/10 text-[#1BC47D] text-[10px] uppercase font-bold tracking-wider rounded border border-[#1BC47D]/20">
              {t('review_create')}
            </span>
          </div>

          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => setIsDarkMode((prev) => !prev)}
              className="relative transition-colors hover:text-[var(--text-main)]"
              style={{ color: 'var(--text-muted)' }}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <NotificationBell />
          </div>
        </header>

        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="px-4 md:px-6 pt-8 pb-12 border-b z-10 shrink-0" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-8">
                <div className="space-y-1">
                  <h2 className="flex items-center gap-2 text-2xl font-bold" style={{ color: 'var(--text-main)' }}>
                    <Sparkles className="h-5 w-5 text-[#1BC47D]" />
                    {t('nexora_project_lines_wizard')}
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {t('create_modular_projects_with_ai_recommendations_line_by_line_briefing_and_multi')}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleStartNewProject}
                  className="border-[#1BC47D]/30 text-[#1BC47D] hover:bg-[#1BC47D]/10 hover:text-[#1BC47D]"
                >
                  {t('start_new_project')}
                </Button>
              </div>

              <div className="relative flex justify-between items-start w-full">
                <div className="absolute top-4 left-[16px] right-[16px] h-1 -translate-y-1/2 rounded-full overflow-hidden bg-slate-200/70">
                  <div
                    className="h-full bg-[#1BC47D] transition-all duration-500"
                    style={{
                      width:
                        wizardSteps.length > 1 && stepIndex >= 0
                          ? `${(stepIndex / (wizardSteps.length - 1)) * 100}%`
                          : '0%',
                    }}
                  />
                </div>

                {wizardSteps.map((wizardStep, index) => {
                  const active = step === wizardStep.id;
                  const done = stepIndex > index;
                  return (
                    <div key={`progress-${wizardStep.id}`} className={`relative z-10 flex flex-col items-center transition-opacity duration-300 ${index <= stepIndex ? 'opacity-100' : 'opacity-50'}`}>
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                          done
                            ? 'border-[#1BC47D] text-white'
                            : active
                              ? 'border-[#1BC47D] text-[#1BC47D]'
                              : 'border-slate-300 text-slate-400'
                        }`}
                        style={{ backgroundColor: done ? '#1BC47D' : 'var(--bg-card)' }}
                      >
                        {done ? <CheckCircle2 size={14} /> : index + 1}
                      </div>
                      <div className="mt-2 w-24 text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider hidden md:block" style={{ color: index <= stepIndex ? 'var(--text-main)' : 'var(--text-muted)' }}>
                          {t(wizardStep.labelKey)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 relative pb-24">
            <div className="max-w-7xl mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${step}-${projectInputMode}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                  className="trustora-wizard space-y-6"
                >

          {step === 'intent' ? (
            <Card className={wizardCardClass} style={wizardCardStyle}>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>
                  {t('step_1_intent')}
                </CardTitle>
                <CardDescription className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {t('choose_your_workflow_ai_assisted_or_fully_manual')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    {t('input_mode')}
                  </Label>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => handleSelectProjectInputMode('ai')}
                      className={`rounded-2xl border-2 p-5 text-left transition-all duration-300 ${
                        projectInputMode === 'ai'
                          ? 'border-[#1BC47D] shadow-sm'
                          : 'hover:border-[#1BC47D]/50'
                      }`}
                      style={{
                        borderColor: projectInputMode === 'ai' ? '#1BC47D' : 'var(--border-color)',
                        backgroundColor: projectInputMode === 'ai' ? 'var(--accent-light)' : 'var(--bg-card)',
                      }}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1BC47D]/20 text-[#1BC47D]">
                          <Sparkles size={18} />
                        </div>
                        {projectInputMode === 'ai' ? <CheckCircle2 size={18} className="text-[#1BC47D]" /> : null}
                      </div>
                      <p className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>{t('ai_assistance')}</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectProjectInputMode('manual')}
                      className={`rounded-2xl border-2 p-5 text-left transition-all duration-300 ${
                        projectInputMode === 'manual'
                          ? 'border-[#0B1C2D] shadow-sm'
                          : 'hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                      style={{
                        borderColor: projectInputMode === 'manual'
                          ? (isDarkMode ? '#FFFFFF' : '#0B1C2D')
                          : 'var(--border-color)',
                        backgroundColor: projectInputMode === 'manual'
                          ? (isDarkMode ? 'rgba(255,255,255,0.05)' : 'var(--stat-bg)')
                          : 'var(--bg-card)',
                      }}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--stat-bg)', color: 'var(--text-main)' }}>
                          <Wrench size={18} />
                        </div>
                        {projectInputMode === 'manual' ? (
                          <CheckCircle2 size={18} style={{ color: isDarkMode ? '#FFFFFF' : '#0B1C2D' }} />
                        ) : null}
                      </div>
                      <p className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>{t('manual_input')}</p>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="intent" className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    {t('what_do_you_want_to_build')}
                  </Label>
                  <Textarea
                    id="intent"
                    rows={7}
                    value={intent}
                    onChange={(event) => setIntent(event.target.value)}
                    placeholder={t('ex_i_want_to_launch_a_saas_platform_for_clinic_management_with')}
                    className="resize-none rounded-xl border shadow-inner"
                    style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                  />
                </div>

                {projectInputMode === 'manual' ? (
                  <div
                    className="space-y-4 rounded-2xl border p-5"
                    style={{ backgroundColor: 'var(--stat-bg)', borderColor: 'var(--border-color)' }}
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="manual-title">{t('project_title')}</Label>
                        <Input
                          id="manual-title"
                          value={manualTitle}
                          onChange={(event) => setManualTitle(event.target.value)}
                          placeholder={t('ex_multi_location_rent_a_car_management_platform')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="manual-duration">{t('estimated_duration')}</Label>
                        <Input
                          id="manual-duration"
                          value={manualDuration}
                          onChange={(event) => setManualDuration(event.target.value)}
                          placeholder={t('ex_10_12_weeks')}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="manual-payment-plan">{t('payment_plan')}</Label>
                        <Select value={manualPaymentPlan} onValueChange={(value) => setManualPaymentPlan(value)}>
                          <SelectTrigger id="manual-payment-plan">
                            <SelectValue placeholder={t('select_payment_plan')} />
                          </SelectTrigger>
                          <SelectContent>
                            {PAYMENT_PLAN_OPTIONS.map((option) => (
                              <SelectItem key={`manual-${option.value}`} value={option.value}>
                                {t(option.labelKey)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="manual-currency">{t('currency')}</Label>
                        <Input
                          id="manual-currency"
                          value={manualCurrency}
                          onChange={(event) => setManualCurrency(event.target.value)}
                          placeholder="USD"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>{t('technologies_services_api_only')}</Label>
                        <Input
                          value={manualServiceSearch}
                          onChange={(event) => setManualServiceSearch(event.target.value)}
                          placeholder={t('search_by_category_or_service')}
                        />
                        <div className="max-h-64 overflow-auto rounded-md border border-slate-200 p-3 dark:border-[#1E2A3D]">
                          {groupedServicesLoading ? (
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-[#8FA0B8]">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              {t('loading_services')}
                            </div>
                          ) : groupedAvailableApiServices.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3">
                              {groupedAvailableApiServices.map((group) => (
                                <div
                                  key={`manual-service-category-${group.category_name}`}
                                  className="space-y-2 rounded-md border border-slate-200 bg-slate-50/60 p-2 dark:border-[#1E2A3D] dark:bg-[#0F172A]"
                                >
                                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                                    {group.category_name}
                                  </div>
                                  {group.subcategories.map((subcategory) => (
                                    <div
                                      key={`manual-service-subcategory-${group.category_name}-${subcategory.subcategory_name || 'default'}`}
                                      className="space-y-1"
                                    >
                                      {subcategory.subcategory_name ? (
                                        <div className="text-[11px] font-medium text-slate-500 dark:text-[#8FA0B8]">
                                          {subcategory.subcategory_name}
                                        </div>
                                      ) : null}
                                      {subcategory.services.map((service) => {
                                        const checked = manualServiceIds.includes(service.id);
                                        return (
                                          <label
                                            key={`manual-service-${service.id}`}
                                            className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white/80 px-3 py-2 text-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]"
                                          >
                                            <span>{service.name}</span>
                                            <Checkbox
                                              checked={checked}
                                              onCheckedChange={(value) =>
                                                handleToggleManualService(service.id, Boolean(value))
                                              }
                                              aria-label={t('select_item_aria', {
                                                name: service.name,
                                              })}
                                            />
                                          </label>
                                        );
                                      })}
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 dark:text-[#8FA0B8]">
                              {toString(manualServiceSearch)
                                ? t('no_results_for_the_current_search')
                                : t('no_services_available_in_the_api_catalog')}
                            </p>
                          )}
                        </div>
                        {groupedServicesPagination ? (
                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-[#8FA0B8]">
                            <span>
                              {t('categories_page_of_total', {
                                page: groupedServicesPagination.page,
                                total: groupedServicesPagination.total_pages,
                              })}
                            </span>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setGroupedServicesPage((prev) => Math.max(1, prev - 1))}
                                disabled={groupedServicesLoading || groupedServicesPagination.page <= 1}
                              >
                                {t('pagination_previous_button')}
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setGroupedServicesPage((prev) => prev + 1)}
                                disabled={groupedServicesLoading || !groupedServicesPagination.has_more}
                              >
                                {t('pagination_next_button')}
                              </Button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="manual-requirements">
                          {t('specific_requirements_one_per_line')}
                        </Label>
                        <Textarea
                          id="manual-requirements"
                          rows={4}
                          value={manualSpecificRequirements}
                          onChange={(event) => setManualSpecificRequirements(event.target.value)}
                          placeholder={t('ex_nrole_based_rbac_ngdpr_compliance_nbooking_calendar')}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                          {t('project_lines_manual')}
                        </h4>
                      </div>
                      {manualProjectLines.length === 0 ? (
                        <p className="text-xs text-slate-500 dark:text-[#8FA0B8]">
                          {t('select_at_least_one_service_from_the_list_above_first')}
                        </p>
                      ) : null}

                      <div className="grid gap-3 md:grid-cols-2">
                        {manualProjectLines.map((line, lineIndex) => (
                          <div
                            key={line.id}
                            className="space-y-3 rounded-md border border-slate-200 bg-white/80 p-3 dark:border-[#1E2A3D] dark:bg-[#0F172A]"
                          >
                            <div className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                              {t('line')} {lineIndex + 1}
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label>{t('service_name_auto_selected')}</Label>
                                <Input value={line.service_name} disabled />
                              </div>
                              <div className="space-y-2">
                                <Label>{t('delivery_provider_from_api_required')}</Label>
                                <Input value={getLocalizedProviderLabel(line.delivery_provider)} disabled />
                              </div>
                              <div className="space-y-2">
                                <Label>{t('budget_per_line')}</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={line.budget_percentage}
                                  onChange={(event) =>
                                    handleManualLineFieldChange(line.id, 'budget_percentage', event.target.value)
                                  }
                                  placeholder={t('ex_30')}
                                />
                              </div>
                              <div className="space-y-2 sm:col-span-2">
                                <Label>{t('line_description')}</Label>
                                <Textarea
                                  rows={3}
                                  value={line.description}
                                  onChange={(event) =>
                                    handleManualLineFieldChange(line.id, 'description', event.target.value)
                                  }
                                  placeholder={t('short_scope_for_this_line')}
                                />
                              </div>
                            </div>

                            <div className="space-y-2 rounded-md border border-slate-200 p-3 dark:border-[#1E2A3D]">
                              <div className="flex items-center justify-between">
                                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                                  {t('milestones')}
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleAddManualMilestone(line.id)}
                                >
                                  {t('add_milestone')}
                                </Button>
                              </div>

                              {line.milestones.length > 0 ? (
                                <div className="space-y-2">
                                  {line.milestones.map((milestone) => (
                                    <div
                                      key={milestone.id}
                                      className="grid gap-2 rounded-md border border-slate-200 bg-white/80 p-2 dark:border-[#1E2A3D] dark:bg-[#0B1220]"
                                    >
                                      <div className="grid gap-2 sm:grid-cols-3">
                                        <Input
                                          value={milestone.title}
                                          onChange={(event) =>
                                            handleManualMilestoneFieldChange(
                                              line.id,
                                              milestone.id,
                                              'title',
                                              event.target.value
                                            )
                                          }
                                          placeholder={t('milestone_title')}
                                        />
                                        <Input
                                          type="number"
                                          min="0"
                                          value={milestone.amount}
                                          onChange={(event) =>
                                            handleManualMilestoneFieldChange(
                                              line.id,
                                              milestone.id,
                                              'amount',
                                              event.target.value
                                            )
                                          }
                                          placeholder={t('amount')}
                                        />
                                        <Input
                                          type="number"
                                          min="0"
                                          max="100"
                                          value={milestone.percentage}
                                          onChange={(event) =>
                                            handleManualMilestoneFieldChange(
                                              line.id,
                                              milestone.id,
                                              'percentage',
                                              event.target.value
                                            )
                                          }
                                          placeholder="%"
                                        />
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Input
                                          value={milestone.description}
                                          onChange={(event) =>
                                            handleManualMilestoneFieldChange(
                                              line.id,
                                              milestone.id,
                                              'description',
                                              event.target.value
                                            )
                                          }
                                          placeholder={t('milestone_description_optional')}
                                        />
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            handleRemoveManualMilestone(line.id, milestone.id)
                                          }
                                        >
                                          {t('delete')}
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-slate-500 dark:text-[#8FA0B8]">
                                  {t('there_are_no_milestones_on_this_line')}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="flex justify-end">
                  {projectInputMode === 'ai' ? (
                    <Button
                      onClick={handleRequestRecommendation}
                      disabled={loadingRecommendation}
                      className="bg-[#1BC47D] text-white hover:bg-[#18A96B]"
                    >
                      {loadingRecommendation ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('generating_recommendation')}
                        </>
                      ) : (
                        <>
                          {t('continue_to_recommendation')}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => void handleContinueManualToReview()}
                      disabled={loadingManualProviders}
                      className="bg-[#1BC47D] text-white hover:bg-[#18A96B]"
                    >
                      {loadingManualProviders ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('generating_providers')}
                        </>
                      ) : (
                        <>
                          {t('continue_to_providers')}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {step === 'recommendation' && projectInputMode === 'ai' ? (
            <Card className={wizardCardClass} style={wizardCardStyle}>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>
                  {t('step_2_service_recommendation')}
                </CardTitle>
                <CardDescription className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {t('confirm_the_recommended_lines_for_your_modular_project')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {recommendation?.bundle_name ? (
                  <Badge variant="outline" className="border-emerald-200 text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-300">
                    {t('recommended_bundle')}: {recommendation.bundle_name}
                  </Badge>
                ) : null}

                {recommendedCards.length > 0 ? (
                  <div className="space-y-3">
                    <div className="text-sm font-bold uppercase tracking-wider text-[#1BC47D]">
                      {t('recommended_services')}
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      {recommendedCards.map((service) => {
                        const checked = selectedServiceIndexes.includes(service.index);
                        const categoryName = getServiceCategoryName(service);

                        return (
                          <Card
                            key={service.key}
                            className={`cursor-pointer border-2 transition ${
                              checked
                                ? 'border-[#1BC47D] shadow-sm'
                                : 'hover:border-[#1BC47D]/50'
                            }`}
                            style={{
                              borderColor: checked ? '#1BC47D' : 'var(--border-color)',
                              backgroundColor: checked ? 'var(--accent-light)' : 'var(--bg-card)',
                            }}
                            onClick={() => handleToggleService(service.index)}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-2">
                                  <CardTitle className="text-base" style={{ color: 'var(--text-main)' }}>{service.service_name}</CardTitle>
                                  <CardDescription className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                                    {getProviderIcon(service.delivery_provider)}
                                    {getLocalizedProviderLabel(service.delivery_provider)}
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
                                  aria-label={t('select_item_aria', { name: service.service_name })}
                                />
                              </div>
                            </CardHeader>
                            {service.description ? (
                              <CardContent>
                                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{service.description}</p>
                              </CardContent>
                            ) : null}
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {alternativeCards.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                        {t('alternative_services')}
                      </div>
                      <Badge variant="secondary">{t('optional')}</Badge>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {t('you_can_select_an_alternative_service_from_the_same_category')}
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                      {alternativeCards.map((service) => {
                        const checked = selectedServiceIndexes.includes(service.index);
                        const categoryName = getServiceCategoryName(service);

                        return (
                          <Card
                            key={service.key}
                            className={`cursor-pointer border-2 transition ${
                              checked
                                ? 'shadow-sm'
                                : 'hover:border-[#1BC47D]/50'
                            }`}
                            style={{
                              borderColor: checked ? (isDarkMode ? '#FFFFFF' : '#0B1C2D') : 'var(--border-color)',
                              backgroundColor: checked ? 'var(--stat-bg)' : 'var(--bg-card)',
                            }}
                            onClick={() => handleToggleService(service.index)}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-2">
                                  <CardTitle className="text-base" style={{ color: 'var(--text-main)' }}>{service.service_name}</CardTitle>
                                  <CardDescription className="flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                                    {getProviderIcon(service.delivery_provider)}
                                    {getLocalizedProviderLabel(service.delivery_provider)}
                                  </CardDescription>
                                  <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline" className="text-[10px] uppercase">
                                      {t('alternative')}
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
                                  aria-label={t('select_item_aria', { name: service.service_name })}
                                />
                              </div>
                            </CardHeader>
                            {service.description ? (
                              <CardContent>
                                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{service.description}</p>
                              </CardContent>
                            ) : null}
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="outline"
                    onClick={() => transitionTo('intent')}
                    className="border transition-colors"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--stat-bg)', color: 'var(--text-main)' }}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('back_to_intent')}
                  </Button>
                  <Button onClick={handleConfirmRecommendation} className="bg-[#1BC47D] text-white hover:bg-[#18A96B]">
                    {t('confirm_and_continue')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {step === 'briefing' && projectInputMode === 'ai' ? (
            <Card className={wizardCardClass} style={wizardCardStyle}>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>
                  {t('step_3_modular_briefing')}
                </CardTitle>
                <CardDescription className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {t('the_brief_is_built_on_the_echo_channel')}{' '}
                  <code>user.{String(user.id)}.briefs</code>{' '}
                  {t('and_displayed_by_project_lines')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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
                    {t('status')}: {briefStatus}
                  </Badge>

                  {briefStatus === 'PROCESSING' ? (
                    <span className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-[#8FA0B8]">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('generating_modular_structure')}
                    </span>
                  ) : null}
                </div>

                {briefPayloadTruncated ? (
                  <Alert className="border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="space-y-2">
                      <p>
                        {t('the_websocket_payload_was_compacted_because_of_the_broadcast_size_limit_10kb')}
                      </p>
                      {briefPayloadTrimmedSections.length > 0 ? (
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide">
                            {t('sections_sent_in_compact_mode')}
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
                    <h4 className="font-semibold text-amber-800 dark:text-amber-200">
                      {t('clarifications_required')}
                    </h4>
                    <ul className="space-y-1 text-sm text-amber-700 dark:text-amber-100">
                      {briefQuestions.map((question, index) => (
                        <li key={`${question}-${index}`}>• {question}</li>
                      ))}
                    </ul>
                    <div className="space-y-2">
                      <Label htmlFor="clarification">{t('your_answer')}</Label>
                      <Textarea
                        id="clarification"
                        rows={4}
                        value={briefAnswer}
                        onChange={(event) => setBriefAnswer(event.target.value)}
                        placeholder={t('provide_the_details_needed_by_ai')}
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={() => void handleSendClarification()} className="bg-[#1BC47D] text-white hover:bg-[#18A96B]">
                        {t('send_clarification')}
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
                        {t('structured_preview_using_data_from')}{' '}
                        <code>final_brief</code>, <code>final_brief_full</code>{' '}
                        {t('and')} <code>final_brief_modular</code>.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-md border border-slate-200 bg-white/80 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                          {t('budget')}
                        </div>
                        <div className="mt-1 text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                          {typeof briefingDisplay.budget === 'number'
                            ? `$${briefingDisplay.budget.toLocaleString()}`
                            : '—'}
                        </div>
                      </div>
                      <div className="rounded-md border border-slate-200 bg-white/80 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                          {t('duration')}
                        </div>
                        <div className="mt-1 text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                          {briefingDisplay.duration || '—'}
                        </div>
                      </div>
                      <div className="rounded-md border border-slate-200 bg-white/80 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                          {t('payment_plan')}
                        </div>
                        <div className="mt-1 text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                          {briefingDisplay.paymentPlan || '—'}
                        </div>
                      </div>
                      <div className="rounded-md border border-slate-200 bg-white/80 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                          {t('currency')}
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
                            <span className="font-semibold">{t('overview')}:</span>{' '}
                            {briefingDisplay.overview}
                          </p>
                        ) : null}
                        {briefingDisplay.clientGoal ? (
                          <p className="mt-1 text-slate-700 dark:text-[#C9D4E7]">
                            <span className="font-semibold">{t('client_goal')}:</span>{' '}
                            {briefingDisplay.clientGoal}
                          </p>
                        ) : null}
                        {briefingDisplay.targetAudience ? (
                          <p className="mt-1 text-slate-700 dark:text-[#C9D4E7]">
                            <span className="font-semibold">{t('target_audience')}:</span>{' '}
                            {briefingDisplay.targetAudience}
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    {briefingDisplay.technologies.length > 0 ? (
                      <div className="rounded-md border border-slate-200 bg-white/80 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                          {t('technologies')}
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
                          {t('specific_requirements')}
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
                          {t('team_structure')}
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {briefingDisplay.teamStructure.map((member, index) => (
                            <div key={`${member.role}-${index}`} className="rounded-md border border-slate-200 bg-white p-2 text-sm dark:border-[#1E2A3D] dark:bg-[#0F172A]">
                              <div className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                                {member.role}
                              </div>
                              <div className="text-xs text-slate-600 dark:text-[#A3ADC2]">
                                {member.service || t('general')} •{' '}
                                {member.level || t('n_a')} • x{member.count ?? 1}
                              </div>
                              {typeof member.estimated_cost === 'number' ? (
                                <div className="mt-1 text-xs text-slate-600 dark:text-[#A3ADC2]">
                                  {t('estimated_cost')}: $
                                  {member.estimated_cost.toLocaleString()}
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
                          {t('milestones')}
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
                          {t('final_brief_full_business_analysis')}
                        </div>
                        {toString(fullBusinessAnalysis.problem_statement) ? (
                          <p className="text-sm text-slate-700 dark:text-[#C9D4E7]">
                            <span className="font-semibold">{t('problem')}:</span>{' '}
                            {toString(fullBusinessAnalysis.problem_statement)}
                          </p>
                        ) : null}
                        {toString(fullBusinessAnalysis.value_proposition) ? (
                          <p className="mt-1 text-sm text-slate-700 dark:text-[#C9D4E7]">
                            <span className="font-semibold">
                              {t('value_proposition')}:
                            </span>{' '}
                            {toString(fullBusinessAnalysis.value_proposition)}
                          </p>
                        ) : null}
                        {fullTargetUsers.length > 0 ? (
                          <div className="mt-2">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                              {t('target_users')}
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
                              {t('feature_business_value')}
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
                          {t('final_brief_full_tech_stack')}
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
                                    {t('purpose')}: {item.purpose}
                                  </div>
                                ) : null}
                                {item.justification ? (
                                  <div className="text-xs text-slate-600 dark:text-[#A3ADC2]">
                                    {t('why')}: {item.justification}
                                  </div>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ) : null}
                        {toString(briefFullDetails?.tech_stack?.architecture_notes) ? (
                          <p className="mt-2 text-sm text-slate-700 dark:text-[#C9D4E7]">
                            <span className="font-semibold">
                              {t('architecture_notes')}:
                            </span>{' '}
                            {toString(briefFullDetails?.tech_stack?.architecture_notes)}
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    {fullTechnicalRisks.length > 0 ? (
                      <div className="rounded-md border border-slate-200 bg-white/80 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                          {t('final_brief_full_technical_risks')}
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
                          {t('final_brief_full_complexity')}
                        </div>
                        {fullComplexityEstimationEntries.length > 0 ? (
                          <div className="mb-2">
                            <div className="text-xs text-slate-500 dark:text-[#8FA0B8]">
                              {t('complexity_estimation')}
                            </div>
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
                            <div className="text-xs text-slate-500 dark:text-[#8FA0B8]">
                              {t('complexity_by_domain')}
                            </div>
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
                          {t('final_brief_full_team_recommendation')}
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
                                    • {member.role} x{member.count ?? 1} ({member.seniority ?? t('n_a')})
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
                        {t('modular_project_lines')}
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        {briefingProjectLines.map((line, index) => (
                          <Card key={`${line.service_name}-${index}`} className="border-emerald-200/80 dark:border-emerald-500/20">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">{line.service_name}</CardTitle>
                              <CardDescription className="flex items-center gap-2">
                                {getProviderIcon(line.delivery_provider)}
                                {getLocalizedProviderLabel(line.delivery_provider)}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                              <p className="text-slate-600 dark:text-[#A3ADC2]">
                                {line.description || t('no_description')}
                              </p>
                              <div className="rounded-md border border-slate-200 bg-white/80 p-2 text-xs dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                                <span className="font-semibold">
                                  {t('budget_2')}:{' '}
                                </span>
                                {line.budget_percentage}
                              </div>
                              <div>
                                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                                  {t('milestones')}
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
                          {t('final_brief_text')}
                        </div>
                        <pre className="max-h-56 overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100">
{briefText}
                        </pre>
                      </div>
                    ) : null}

                    {briefDebugResponseJson ? (
                      <div className="space-y-2 rounded-lg border border-slate-200 bg-white/80 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                          {t('debug_response_json')}
                        </div>
                        <pre className="max-h-64 overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100">
{briefDebugResponseJson}
                        </pre>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="outline"
                    onClick={() => transitionTo('recommendation')}
                    className="border transition-colors"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--stat-bg)', color: 'var(--text-main)' }}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('back_to_recommendation')}
                  </Button>

                  <Button
                    onClick={() => transitionTo('providers')}
                    disabled={!briefResult || briefStatus !== 'FINAL'}
                    className="bg-[#1BC47D] text-white hover:bg-[#18A96B]"
                  >
                    {t('continue_to_providers')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {step === 'providers' ? (
            <Card className={wizardCardClass} style={wizardCardStyle}>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>
                  {t('step_2')} {currentStepNumber ?? 4}:{' '}
                  {t('provider_selection')}
                </CardTitle>
                <CardDescription className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {t('for_each_service_select_recommended_providers_or_choose_alternatives_from_the_extended')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {providerSelectionGroups.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {t('there_are_no_provider_recommendations_yet_you_can_continue_to_connections_without')}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {providerSelectionGroups.map((group, groupIndex) => {
                      const serviceKey = getServiceKey(group.service_name);
                      const selectedCount = selectedProvidersCountByService.get(serviceKey) ?? 0;
                      const serviceMilestones = reviewMilestonesByService.get(serviceKey) ?? [];
                      const unassignedMilestones = serviceMilestones.filter(
                        (entry) => milestoneAssignments[entry.key] === undefined
                      );

                      const renderProviderCard = (
                        provider: AiBriefProvider,
                        tone: 'recommended' | 'other'
                      ) => {
                        const providerId = getProviderId(provider);
                        const checked = isProviderSelected(group.service_name, provider);
                        const assignedMilestones =
                          providerId === null
                            ? []
                            : serviceMilestones.filter(
                                (entry) => milestoneAssignments[entry.key] === providerId
                              );
                        const activeClass =
                          tone === 'recommended'
                            ? 'border-emerald-500 bg-emerald-50/70 dark:border-emerald-500/50 dark:bg-emerald-500/10'
                            : 'border-blue-500 bg-blue-50/70 dark:border-blue-500/50 dark:bg-blue-500/10';

                        return (
                          <Card
                            key={`${tone}-${group.service_name}-${providerId ?? getProviderDisplayName(provider)}`}
                            className={`cursor-pointer border transition ${
                              checked ? activeClass : 'border-slate-200 dark:border-[#1E2A3D]'
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
                                    {t('match_score')}:{' '}
                                    {typeof provider.matchScore === 'number'
                                      ? `${provider.matchScore}%`
                                      : t('n_a')}
                                  </CardDescription>
                                  <div className="flex flex-wrap gap-2 text-xs text-slate-600 dark:text-[#A3ADC2]">
                                    <span>
                                      {t('rating')}:{' '}
                                      {typeof provider.rating === 'number'
                                        ? provider.rating.toFixed(2)
                                        : t('n_a')}
                                    </span>
                                    <span>
                                      {t('reviews')}:{' '}
                                      {typeof provider.reviewCount === 'number'
                                        ? provider.reviewCount
                                        : t('n_a')}
                                    </span>
                                  </div>
                                </div>
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={() =>
                                    handleToggleProvider(group.service_name, provider)
                                  }
                                  aria-label={t('select_item_aria', {
                                    name: getProviderDisplayName(provider),
                                  })}
                                />
                              </div>
                            </CardHeader>

                            <CardContent className="space-y-3">
                              {Array.isArray(provider.matchReasons) &&
                              provider.matchReasons.length > 0 ? (
                                <ul className="space-y-1 text-xs text-slate-600 dark:text-[#A3ADC2]">
                                  {provider.matchReasons.slice(0, 3).map((reason, reasonIndex) => (
                                    <li key={`${tone}-reason-${providerId ?? reasonIndex}-${reasonIndex}`}>
                                      • {reason}
                                    </li>
                                  ))}
                                </ul>
                              ) : null}

                              {checked ? (
                                <div className="space-y-3 rounded-md border border-slate-200/80 bg-white/70 p-2 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                                  <div className="space-y-1">
                                    <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                                      {t('milestones_available_for_assignment')}
                                    </div>
                                    {unassignedMilestones.length > 0 ? (
                                      <div className="space-y-1">
                                        {unassignedMilestones.map((entry) => (
                                          <div
                                            key={`available-${entry.key}-${providerId ?? 'unknown'}`}
                                            className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs dark:border-[#1E2A3D] dark:bg-[#0F172A]"
                                          >
                                            <span className="truncate text-slate-700 dark:text-[#C9D4E7]">
                                              {entry.milestone.title}
                                            </span>
                                            <Button
                                              size="icon"
                                              variant="ghost"
                                              className="h-6 w-6"
                                              onClick={(event) => {
                                                event.preventDefault();
                                                event.stopPropagation();
                                                handleAssignMilestoneToProvider(
                                                  group.service_name,
                                                  entry.key,
                                                  provider
                                                );
                                              }}
                                              aria-label={t('assign_milestone_to_provider_aria', {
                                                milestone: entry.milestone.title,
                                                provider: getProviderDisplayName(provider),
                                              })}
                                            >
                                              <Plus className="h-3.5 w-3.5" />
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-slate-500 dark:text-[#8FA0B8]">
                                        {t('no_unassigned_milestones_for_this_service')}
                                      </p>
                                    )}
                                  </div>

                                  <div className="space-y-1">
                                    <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                                      {t('assigned_milestones')}
                                    </div>
                                    {assignedMilestones.length > 0 ? (
                                      <div className="space-y-1">
                                        {assignedMilestones.map((entry) => (
                                          <div
                                            key={`assigned-${entry.key}-${providerId ?? 'unknown'}`}
                                            className="flex items-center justify-between gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs dark:border-emerald-500/40 dark:bg-emerald-500/10"
                                          >
                                            <span className="truncate text-emerald-800 dark:text-emerald-100">
                                              {entry.milestone.title}
                                            </span>
                                            <Button
                                              size="icon"
                                              variant="ghost"
                                              className="h-6 w-6 text-emerald-700 hover:text-emerald-900 dark:text-emerald-200 dark:hover:text-emerald-100"
                                              onClick={(event) => {
                                                event.preventDefault();
                                                event.stopPropagation();
                                                handleRemoveMilestoneAssignment(entry.key);
                                              }}
                                              aria-label={t('remove_milestone_assignment_aria', {
                                                milestone: entry.milestone.title,
                                                provider: getProviderDisplayName(provider),
                                              })}
                                            >
                                              <X className="h-3.5 w-3.5" />
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-slate-500 dark:text-[#8FA0B8]">
                                        {t('no_milestones_assigned_to_this_provider')}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ) : null}
                            </CardContent>
                          </Card>
                        );
                      };

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
                              {t('selected')}: {selectedCount}
                            </Badge>
                          </div>

                          <div className="space-y-2">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                              {t('recommended_providers')}
                            </div>
                            {group.recommended.length > 0 ? (
                              <div className="grid gap-3 md:grid-cols-2">
                                {group.recommended.map((provider) =>
                                  renderProviderCard(provider, 'recommended')
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-500 dark:text-[#8FA0B8]">
                                {t('no_recommended_providers_for_this_service')}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                                {t('other_providers')}
                              </div>
                              <Badge variant="secondary">{t('optional')}</Badge>
                            </div>
                            {group.others.length > 0 ? (
                              <div className="grid gap-3 md:grid-cols-2">
                                {group.others.map((provider) =>
                                  renderProviderCard(provider, 'other')
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-500 dark:text-[#8FA0B8]">
                                {t('no_other_providers_available_for_this_service')}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="rounded-md border border-slate-200 bg-white/80 p-3 text-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                  <span className="font-semibold">
                    {t('total_selected_providers')}:
                  </span>{' '}
                  {selectedProviders.length}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      transitionTo(projectInputMode === 'manual' ? 'intent' : 'briefing')
                    }
                    className="border transition-colors"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--stat-bg)', color: 'var(--text-main)' }}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {projectInputMode === 'manual'
                      ? t('back_to_project_details')
                      : t('back_to_briefing')}
                  </Button>

                  <Button
                    onClick={() => transitionTo('connections')}
                    disabled={!briefResult || briefStatus !== 'FINAL'}
                    className="bg-[#1BC47D] text-white hover:bg-[#18A96B]"
                  >
                    {t('continue_to_connections')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {step === 'connections' ? (
            <Card className={wizardCardClass} style={wizardCardStyle}>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>
                  {t('step_2')} {currentStepNumber ?? 5}: {t('provider_connections')}
                </CardTitle>
                <CardDescription className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {t('connect_required_delivery_providers_for_selected_services')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {requiredOAuthProviders.length === 0 ? (
                  <Alert className="border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-100">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      {t('no_delivery_provider_connections_required')}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {requiredOAuthProviders.map((provider) => {
                      const isConnected = connectedOAuthProviders.has(provider);
                      const requiredServices = requiredOAuthProvidersByService.get(provider) ?? [];

                      return (
                        <Card
                          key={`oauth-provider-${provider}`}
                          className={`border transition ${
                            isConnected
                              ? 'border-emerald-300 bg-emerald-50/70 dark:border-emerald-500/40 dark:bg-emerald-500/10'
                              : 'border-slate-200 dark:border-[#1E2A3D]'
                          }`}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                {getOAuthProviderIcon(provider)}
                                <CardTitle className="text-base">
                                  {getLocalizedOAuthProviderLabel(provider)}
                                </CardTitle>
                              </div>
                              <Badge variant={isConnected ? 'default' : 'secondary'}>
                                {isConnected ? t('connected') : t('not_connected')}
                              </Badge>
                            </div>
                            {requiredServices.length > 0 ? (
                              <CardDescription>
                                {t('required_for_services')}: {requiredServices.join(', ')}
                              </CardDescription>
                            ) : null}
                          </CardHeader>
                          <CardContent>
                            <Button
                              type="button"
                              variant={isConnected ? 'outline' : 'default'}
                              className="w-full"
                              disabled={isConnected}
                              onClick={() => handleConnectOAuthProvider(provider)}
                            >
                              {isConnected ? t('connected') : t('connect_provider')}
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {requiredOAuthProviders.length > 0 ? (
                  missingOAuthProviders.length > 0 ? (
                    <Alert className="border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {t('connect_required_providers_before_review')}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-100">
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>
                        {t('all_required_delivery_providers_are_connected')}
                      </AlertDescription>
                    </Alert>
                  )
                ) : null}

                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="outline"
                    onClick={() => transitionTo('providers')}
                    className="border transition-colors"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--stat-bg)', color: 'var(--text-main)' }}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('back_to_providers')}
                  </Button>

                  <Button
                    onClick={() => transitionTo('review')}
                    disabled={!canContinueFromConnections}
                    className="bg-[#1BC47D] text-white hover:bg-[#18A96B]"
                  >
                    {t('continue_to_review')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {step === 'review' ? (
            <Card className={wizardCardClass} style={wizardCardStyle}>
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>
                  {t('step_2')} {currentStepNumber ?? 6}: {t('review_create')}
                </CardTitle>
                <CardDescription className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {t('review_budget_distribution_for_each_line_then_create_the_modular_project')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {briefPayloadTruncated ? (
                  <Alert className="border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="space-y-2">
                      <p>
                        {t('review_data_comes_from_a_compacted_payload_broadcast_limit_10kb')}
                      </p>
                      {briefPayloadTrimmedSections.length > 0 ? (
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide">
                            {t('compacted_sections')}
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
                      {t('final_summary_for_creation')}
                    </h4>
                    {briefingDisplay.description ? (
                      <p className="text-sm text-slate-700 dark:text-[#C9D4E7]">
                        {briefingDisplay.description}
                      </p>
                    ) : null}
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-md border border-slate-200 bg-white/90 p-3 text-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                        <div className="text-xs text-slate-500 dark:text-[#8FA0B8]">
                          {t('ai_budget')}
                        </div>
                        <div className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                          {typeof briefingDisplay.budget === 'number'
                            ? `$${briefingDisplay.budget.toLocaleString()}`
                            : '—'}
                        </div>
                      </div>
                      <div className="rounded-md border border-slate-200 bg-white/90 p-3 text-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                        <div className="text-xs text-slate-500 dark:text-[#8FA0B8]">
                          {t('duration')}
                        </div>
                        <div className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                          {effectiveDuration || '—'}
                        </div>
                      </div>
                      <div className="rounded-md border border-slate-200 bg-white/90 p-3 text-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                        <div className="text-xs text-slate-500 dark:text-[#8FA0B8]">
                          {t('payment_plan')}
                        </div>
                        <div className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                          {effectivePaymentPlan || '—'}
                        </div>
                      </div>
                      <div className="rounded-md border border-slate-200 bg-white/90 p-3 text-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                        <div className="text-xs text-slate-500 dark:text-[#8FA0B8]">
                          {t('currency')}
                        </div>
                        <div className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                          {briefingDisplay.currency || 'USD'}
                        </div>
                      </div>
                    </div>
                    {(typeof briefingDisplay.budgetMin === 'number' || typeof briefingDisplay.budgetMax === 'number') ? (
                      <div className="text-xs text-slate-600 dark:text-[#A3ADC2]">
                        {t('range')}:{' '}
                        {typeof briefingDisplay.budgetMin === 'number'
                          ? `$${briefingDisplay.budgetMin.toLocaleString()}`
                          : '—'}
                        {' - '}
                        {typeof briefingDisplay.budgetMax === 'number' ? `$${briefingDisplay.budgetMax.toLocaleString()}` : '—'}
                      </div>
                    ) : null}

                    <div className="rounded-md border border-slate-200 bg-white/90 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-[#8FA0B8]">
                        {t('final_contract_configuration')}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="project-duration">{t('project_duration')}</Label>
                          <Input
                            id="project-duration"
                            value={editableDuration}
                            onChange={(event) => setEditableDuration(event.target.value)}
                            placeholder={t('ex_2months_1month_6months')}
                          />
                          <p className="text-xs text-slate-500 dark:text-[#8FA0B8]">
                            {t('duration_is_validated_against_the_mandatory_milestones_rule_for_projects_over_3')}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="payment-plan">{t('payment_plan')}</Label>
                          <Select
                            value={effectivePaymentPlan || undefined}
                            onValueChange={(value) => setEditablePaymentPlan(value)}
                            disabled={!canEditPaymentPlanByDuration}
                          >
                            <SelectTrigger id="payment-plan">
                              <SelectValue placeholder={t('select_payment_plan')} />
                            </SelectTrigger>
                            <SelectContent>
                              {PAYMENT_PLAN_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {t(option.labelKey)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-slate-500 dark:text-[#8FA0B8]">
                            {canEditPaymentPlanByDuration
                              ? t('for_durations_up_to_3_months_the_payment_plan_can_be_changed')
                              : t('for_durations_over_3_months_the_payment_plan_cannot_be_changed_at')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {requiresMilestonesByDuration && linesMissingMilestones.length > 0 ? (
                      <Alert className="border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {t('for_durations_over_3_months_milestones_are_mandatory_on_each_line')}{' '}
                          {t('missing_for')}: {linesMissingMilestones.join(', ')}.
                        </AlertDescription>
                      </Alert>
                    ) : null}

                    {briefingDisplay.overview || briefingDisplay.clientGoal || briefingDisplay.targetAudience ? (
                      <div className="rounded-md border border-slate-200 bg-white/90 p-3 text-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                        <div className="mb-1 text-xs text-slate-500 dark:text-[#8FA0B8]">
                          {t('final_brief_modular')}
                        </div>
                        {briefingDisplay.overview ? (
                          <p className="text-slate-700 dark:text-[#C9D4E7]">
                            <span className="font-semibold">{t('overview')}:</span>{' '}
                            {briefingDisplay.overview}
                          </p>
                        ) : null}
                        {briefingDisplay.clientGoal ? (
                          <p className="mt-1 text-slate-700 dark:text-[#C9D4E7]">
                            <span className="font-semibold">{t('client_goal')}:</span>{' '}
                            {briefingDisplay.clientGoal}
                          </p>
                        ) : null}
                        {briefingDisplay.targetAudience ? (
                          <p className="mt-1 text-slate-700 dark:text-[#C9D4E7]">
                            <span className="font-semibold">{t('target_audience')}:</span>{' '}
                            {briefingDisplay.targetAudience}
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    {briefingDisplay.technologies.length > 0 ? (
                      <div className="rounded-md border border-slate-200 bg-white/90 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                        <div className="mb-1 text-xs text-slate-500 dark:text-[#8FA0B8]">
                          {t('technologies')}
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
                          {t('specific_requirements')}
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
                          {t('milestones_plan')}
                        </div>
                        <div className="space-y-1 text-sm text-slate-700 dark:text-[#C9D4E7]">
                          {briefingDisplay.milestones.map((milestone, index) => (
                            <div key={`${milestone.title}-review-${index}`}>
                              {index + 1}. {milestone.title}
                              {' - '}
                              {typeof milestone.amount === 'number'
                                ? `$${milestone.amount.toLocaleString()}`
                                : t('n_a')}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {briefingProjectLines.length > 0 ? (
                      <div className="rounded-md border border-slate-200 bg-white/90 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                        <div className="mb-1 text-xs text-slate-500 dark:text-[#8FA0B8]">
                          {t('final_brief_final_brief_modular_project_lines')}
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
                                {line.budget_percentage}% ({line.milestones.length}{' '}
                                {t('milestones_2')})
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {(toString(fullBusinessAnalysis?.problem_statement) || fullTechnicalRisks.length > 0) ? (
                      <div className="rounded-md border border-slate-200 bg-white/90 p-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                        <div className="mb-1 text-xs text-slate-500 dark:text-[#8FA0B8]">
                          {t('final_brief_full')}
                        </div>
                        {toString(fullBusinessAnalysis?.problem_statement) ? (
                          <p className="text-sm text-slate-700 dark:text-[#C9D4E7]">
                            <span className="font-semibold">
                              {t('problem_statement')}:
                            </span>{' '}
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
                  <Label htmlFor="total-budget">
                    {t('total_project_budget_usd')}
                  </Label>
                  <Input
                    id="total-budget"
                    type="number"
                    min="0"
                    value={totalBudget}
                    onChange={(event) => setTotalBudget(event.target.value)}
                    placeholder={t('ex_25000')}
                  />
                </div>

                <div className="space-y-2 rounded-lg border border-slate-200 p-3 dark:border-[#1E2A3D]">
                  <div className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                    {t('budget_distribution_by_lines')}
                  </div>
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
                      {t('debug_create_payload_json_request_body')}
                    </div>
                    <pre className="max-h-64 overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-100">
{createProjectPayloadDebugJson}
                    </pre>
                  </div>
                ) : null}

                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="outline"
                    onClick={() => transitionTo('connections')}
                    className="border transition-colors"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--stat-bg)', color: 'var(--text-main)' }}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('back_to_connections')}
                  </Button>

                  <Button
                    onClick={() => void handleCreateProject()}
                    disabled={
                      creatingProject ||
                      !briefResult ||
                      !effectiveDuration ||
                      !effectivePaymentPlan
                      // || (requiresMilestonesByDuration && linesMissingMilestones.length > 0)
                    }
                    className="bg-[#1BC47D] text-white hover:bg-[#18A96B]"
                  >
                    {creatingProject ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('creating_project')}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        {t('create_project')}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      <AlertDialog open={startOverDialogOpen} onOpenChange={setStartOverDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('start_new_project')}</AlertDialogTitle>
            <AlertDialogDescription>{t('start_new_project_confirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('start_new_project_cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmStartNewProject}>
              {t('start_new_project_confirm_action')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
