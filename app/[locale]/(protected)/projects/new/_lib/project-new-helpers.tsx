import {
  BarChart3,
  Chrome,
  Figma,
  FolderOpen,
  Github,
  UploadCloud,
  Wrench,
} from 'lucide-react';

import type { RecommendedServiceCandidate } from '@/services/ai.service';
import type { AiAssistantMessage, AiBriefProvider } from '@/types/ai';
import type { OAuthProvider } from '@/types/auth';
import type { DeliveryProvider } from '@/types/projects';

import type {
  ApiServiceOption,
  ManualMilestoneForm,
  ManualProjectLineForm,
  RecommendedCard,
} from './project-new-types';

export const toObject = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
};

export const toString = (value: unknown): string => {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
};

export const toLocalizedString = (value: unknown): string => {
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

export const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export const formatBudgetInputValue = (value: number): string => {
  if (!Number.isFinite(value)) {
    return '';
  }

  return String(Number(value.toFixed(2)));
};

export const getManualBudgetAmountFromPercentage = (
  percentage: unknown,
  totalBudgetValue: number
): number | null => {
  const normalizedPercentage = toNumber(percentage);
  if (
    normalizedPercentage === null ||
    normalizedPercentage < 0 ||
    !Number.isFinite(totalBudgetValue) ||
    totalBudgetValue <= 0
  ) {
    return null;
  }

  return Number(((totalBudgetValue * normalizedPercentage) / 100).toFixed(2));
};

export const getManualBudgetPercentageFromAmount = (
  amount: unknown,
  totalBudgetValue: number
): number | null => {
  const normalizedAmount = toNumber(amount);
  if (
    normalizedAmount === null ||
    normalizedAmount < 0 ||
    !Number.isFinite(totalBudgetValue) ||
    totalBudgetValue <= 0
  ) {
    return null;
  }

  return Number(((normalizedAmount / totalBudgetValue) * 100).toFixed(2));
};

export const sumManualMilestoneAmounts = (milestones: ManualMilestoneForm[]): number =>
  milestones.reduce((sum, milestone) => sum + Math.max(0, toNumber(milestone.amount) ?? 0), 0);

export const deriveManualLineBudgetPercentage = (
  milestones: ManualMilestoneForm[],
  totalBudgetValue: number
): string => {
  const totalAmount = Number(sumManualMilestoneAmounts(milestones).toFixed(2));
  const derivedFromAmount = getManualBudgetPercentageFromAmount(
    totalAmount,
    totalBudgetValue
  );

  if (derivedFromAmount !== null && derivedFromAmount > 0) {
    return formatBudgetInputValue(derivedFromAmount);
  }

  const totalExplicitPercentage = milestones.reduce(
    (sum, milestone) => sum + Math.max(0, toNumber(milestone.percentage) ?? 0),
    0
  );

  return totalExplicitPercentage > 0
    ? formatBudgetInputValue(totalExplicitPercentage)
    : '';
};

export const getManualLineBudgetAllocation = (
  milestones: ManualMilestoneForm[],
  totalBudgetValue: number
): number | null => {
  const totalAmount = Number(sumManualMilestoneAmounts(milestones).toFixed(2));
  if (totalAmount > 0) {
    return totalAmount;
  }

  const derivedPercentage = toNumber(
    deriveManualLineBudgetPercentage(milestones, totalBudgetValue)
  );
  if (derivedPercentage === null) {
    return null;
  }

  return getManualBudgetAmountFromPercentage(derivedPercentage, totalBudgetValue);
};

export const syncManualMilestoneWithBudget = (
  milestone: ManualMilestoneForm,
  totalBudgetValue: number
): ManualMilestoneForm => {
  if (milestone.sync_source === 'amount') {
    const amount = toNumber(milestone.amount);
    if (amount === null || amount < 0) {
      return milestone;
    }

    if (!Number.isFinite(totalBudgetValue) || totalBudgetValue <= 0) {
      return {
        ...milestone,
        percentage: '',
      };
    }

    return {
      ...milestone,
      percentage: formatBudgetInputValue((amount / totalBudgetValue) * 100),
    };
  }

  if (milestone.sync_source === 'percentage') {
    const percentage = toNumber(milestone.percentage);
    if (percentage === null || percentage < 0) {
      return milestone;
    }

    if (!Number.isFinite(totalBudgetValue) || totalBudgetValue <= 0) {
      return {
        ...milestone,
        amount: '',
      };
    }

    return {
      ...milestone,
      amount: formatBudgetInputValue((totalBudgetValue * percentage) / 100),
    };
  }

  return milestone;
};

export const extractBriefResultId = (value: unknown): number | string | null => {
  const root = toObject(value);
  if (!root) {
    return null;
  }

  const source =
    toObject(root.result) ??
    toObject(root.result_payload) ??
    toObject(root.data) ??
    root;
  const sourceResponsePayload = toObject(source.response_payload);
  const rootResponsePayload = toObject(root.response_payload);
  const sourceResultPayload = toObject(source.result_payload);
  const rootResultPayload = toObject(root.result_payload);
  const sourceDebug = toObject(source.debug);
  const rootDebug = toObject(root.debug);
  const sourceDebugPayload = toObject(source.debug_payload);
  const rootDebugPayload = toObject(root.debug_payload);
  const sourceDebugResponsePayload = toObject(sourceDebug?.response_payload);
  const rootDebugResponsePayload = toObject(rootDebug?.response_payload);
  const sourceDebugResultRaw = toObject(sourceDebugPayload?.result_raw);
  const rootDebugResultRaw = toObject(rootDebugPayload?.result_raw);
  const candidate =
    source.brief_result_id ??
    root.brief_result_id ??
    source.id ??
    root.id ??
    sourceResponsePayload?.brief_result_id ??
    rootResponsePayload?.brief_result_id ??
    sourceResultPayload?.brief_result_id ??
    rootResultPayload?.brief_result_id ??
    sourceDebugResponsePayload?.brief_result_id ??
    rootDebugResponsePayload?.brief_result_id ??
    sourceDebugResultRaw?.brief_result_id ??
    rootDebugResultRaw?.brief_result_id;

  if (typeof candidate === 'number' && Number.isFinite(candidate)) {
    return candidate;
  }

  if (typeof candidate === 'string' && candidate.trim()) {
    return candidate.trim();
  }

  return null;
};

export const normalizeDeliveryProvider = (value: unknown): DeliveryProvider => {
  const normalized = toString(value).toLowerCase();

  if (normalized === 'github') return 'github';
  if (normalized === 'figma') return 'figma';
  if (normalized === 'google_drive') return 'google_drive';
  if (normalized === 'google_analytics') return 'google_analytics';

  return 'manual_upload';
};

export const getProviderLabel = (provider: DeliveryProvider) => {
  if (provider === 'github') return 'GitHub';
  if (provider === 'figma') return 'Figma';
  if (provider === 'google_drive') return 'Google Drive';
  if (provider === 'google_analytics') return 'Google Analytics';
  return 'Manual upload';
};

export const getProviderIcon = (provider: DeliveryProvider) => {
  if (provider === 'github') return <Github className="h-4 w-4" />;
  if (provider === 'figma') return <Figma className="h-4 w-4" />;
  if (provider === 'google_drive') return <FolderOpen className="h-4 w-4" />;
  if (provider === 'google_analytics') return <BarChart3 className="h-4 w-4" />;
  if (provider === 'manual_upload') return <UploadCloud className="h-4 w-4" />;
  return <Wrench className="h-4 w-4" />;
};

export const mapDeliveryProviderToOAuth = (provider: DeliveryProvider): OAuthProvider | null => {
  if (provider === 'github') return 'github';
  if (provider === 'figma') return 'figma';
  if (provider === 'google_drive' || provider === 'google_analytics') return 'google';
  return null;
};

export const getOAuthProviderIcon = (provider: OAuthProvider) => {
  if (provider === 'github') return <Github className="h-4 w-4" />;
  if (provider === 'figma') return <Figma className="h-4 w-4" />;
  return <Chrome className="h-4 w-4" />;
};

export const isAlternativeService = (
  service: RecommendedServiceCandidate | RecommendedCard
) => Boolean((service as { is_alternative?: unknown }).is_alternative);

export const getServiceCategoryName = (
  service: RecommendedServiceCandidate | RecommendedCard
) => toString((service as { category_name?: unknown }).category_name);

export const getServiceKey = (serviceName: unknown) => toString(serviceName).toLowerCase();

export const getMilestoneAssignmentKey = (lineIndex: number, milestoneIndex: number) =>
  `line-${lineIndex}-milestone-${milestoneIndex}`;

export const getMilestoneAssignedProviderId = (milestone: unknown): number | null => {
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

export const getProviderId = (provider: AiBriefProvider): number | null =>
  toNumber((provider as { id?: unknown }).id);

export const getProviderDisplayName = (provider: AiBriefProvider) =>
  toString((provider as { name?: unknown }).name) ||
  `${toString(provider.firstName)} ${toString(provider.lastName)}`.trim() ||
  (() => {
    const providerId = getProviderId(provider);
    return providerId !== null ? `Provider #${providerId}` : 'Provider';
  })();

export const dedupeProviders = (providers: AiBriefProvider[]) => {
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

export const parseDurationToMonths = (value: unknown): number | null => {
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

export const normalizeStringList = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => toString(item)).filter(Boolean);
};

export const normalizeFlexibleStringList = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => toString(item)).filter(Boolean);
  }

  const single = toString(value);
  return single ? [single] : [];
};

export const toJsonDebugString = (value: unknown): string => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export const extractErrorMessage = (error: unknown, fallback: string): string => {
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

export const buildInitialConversation = (
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

export const buildBriefConversationSignature = (
  intent: string,
  selectedServices: RecommendedServiceCandidate[]
) =>
  JSON.stringify({
    intent: intent.trim(),
    services: selectedServices.map((service) => ({
      id:
        typeof service.service_id === 'string' || typeof service.service_id === 'number'
          ? String(service.service_id)
          : '',
      name: service.service_name,
      delivery_provider: service.delivery_provider,
    })),
  });

export const buildProjectTitle = (intent: string, aiTitle?: string): string => {
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

export const createManualMilestone = (id: string): ManualMilestoneForm => ({
  id,
  title: '',
  description: '',
  percentage: '',
  amount: '',
  sync_source: null,
});

export const createManualProjectLine = (
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
