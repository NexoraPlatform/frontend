import type { LucideIcon } from 'lucide-react';
import {
  Award,
  Briefcase,
  Building,
  CheckCircle2,
  Clock,
  Sparkles,
  Star,
  Target,
  Users,
  Verified,
  Zap,
} from 'lucide-react';

export type BadgeDefinitionRecord = {
  id: number | string | null;
  code: string;
  name: string;
  slug: string | null;
  description: string | null;
  short_description: string | null;
  audience: string | null;
  category: string | null;
  type: string | null;
  status: string | null;
  is_active: boolean;
  is_revocable: boolean;
  is_hidden: boolean;
  is_featured: boolean;
  show_on_profile: boolean;
  show_in_marketplace: boolean;
  priority: number | null;
  sort_order: number | null;
  icon: string | null;
  icon_type: string | null;
  color: string | null;
  background_color: string | null;
  border_color: string | null;
  display_config: Record<string, unknown>;
  reward_config: Record<string, unknown>;
};

export type BadgeTierRecord = {
  id: number | string | null;
  tier_code: string | null;
  tier_name: string | null;
};

export type UserBadgeRecord = {
  id: number | string | null;
  status: string | null;
  award_source: string | null;
  award_reason: string | null;
  awarded_at: string | null;
  effective_from: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  revocation_reason: string | null;
  badge: BadgeDefinitionRecord | null;
  tier: BadgeTierRecord | null;
  context?: {
    type: string | null;
    id: string | number | null;
  } | null;
  snapshot?: Record<string, unknown> | null;
};

export type BadgeProgressRecord = {
  id: number | string | null;
  status: string | null;
  current_value: number;
  target_value: number;
  progress_percent: number;
  completed_conditions_count: number;
  total_conditions_count: number;
  started_at: string | null;
  completed_at: string | null;
  last_evaluated_at: string | null;
  expires_at: string | null;
  condition_states: unknown[];
  next_steps: string[];
  badge: BadgeDefinitionRecord | null;
};

export type BadgeRewardLogRecord = {
  id: number | string | null;
  reward_type: string | null;
  status: string | null;
  reward_value_numeric: number | null;
  reward_value_text: string | null;
  applied_at: string | null;
  effective_from: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  payload: Record<string, unknown>;
  badge: BadgeDefinitionRecord | null;
};

export type BadgeCounts = {
  awarded: number;
  in_progress: number;
};

const asRecord = (value: unknown): Record<string, any> | null =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, any>)
    : null;

const asArray = <T = unknown>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];

const asString = (value: unknown): string => (typeof value === 'string' ? value : '');

const asNullableString = (value: unknown): string | null => {
  const normalized = asString(value).trim();
  return normalized.length > 0 ? normalized : null;
};

const asNumber = (value: unknown, fallback = 0): number => {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
};

const asNullableNumber = (value: unknown): number | null => {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : null;
};

const asId = (value: unknown): string | number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return value;
  }

  return null;
};

const normalizeGenericCollection = (payload: unknown, keys: string[] = []) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  const record = asRecord(payload);
  if (!record) {
    return [];
  }

  if (Array.isArray(record.data)) {
    return record.data;
  }

  for (const key of keys) {
    if (Array.isArray(record[key])) {
      return record[key];
    }
  }

  return [];
};

export const normalizeBadgeDefinition = (input: unknown): BadgeDefinitionRecord | null => {
  const record = asRecord(input);
  if (!record) {
    return null;
  }

  return {
    id: asId(record.id),
    code: asString(record.code),
    name: asString(record.name),
    slug: asNullableString(record.slug),
    description: asNullableString(record.description),
    short_description: asNullableString(record.short_description),
    audience: asNullableString(record.audience),
    category: asNullableString(record.category),
    type: asNullableString(record.type),
    status: asNullableString(record.status),
    is_active: Boolean(record.is_active),
    is_revocable: Boolean(record.is_revocable),
    is_hidden: Boolean(record.is_hidden),
    is_featured: Boolean(record.is_featured),
    show_on_profile: Boolean(record.show_on_profile),
    show_in_marketplace: Boolean(record.show_in_marketplace),
    priority: asNullableNumber(record.priority),
    sort_order: asNullableNumber(record.sort_order),
    icon: asNullableString(record.icon),
    icon_type: asNullableString(record.icon_type),
    color: asNullableString(record.color),
    background_color: asNullableString(record.background_color),
    border_color: asNullableString(record.border_color),
    display_config: asRecord(record.display_config) ?? {},
    reward_config: asRecord(record.reward_config) ?? {},
  };
};

export const normalizeBadgeTier = (input: unknown): BadgeTierRecord | null => {
  const record = asRecord(input);
  if (!record) {
    return null;
  }

  return {
    id: asId(record.id),
    tier_code: asNullableString(record.tier_code),
    tier_name: asNullableString(record.tier_name),
  };
};

export const normalizeUserBadge = (input: unknown): UserBadgeRecord | null => {
  const record = asRecord(input);
  if (!record) {
    return null;
  }

  const context = asRecord(record.context);

  return {
    id: asId(record.id),
    status: asNullableString(record.status),
    award_source: asNullableString(record.award_source),
    award_reason: asNullableString(record.award_reason),
    awarded_at: asNullableString(record.awarded_at),
    effective_from: asNullableString(record.effective_from),
    expires_at: asNullableString(record.expires_at),
    revoked_at: asNullableString(record.revoked_at),
    revocation_reason: asNullableString(record.revocation_reason),
    badge: normalizeBadgeDefinition(record.badge),
    tier: normalizeBadgeTier(record.tier),
    context: context
      ? {
          type: asNullableString(context.type),
          id: asId(context.id),
        }
      : null,
    snapshot: asRecord(record.snapshot),
  };
};

export const normalizeBadgeProgress = (input: unknown): BadgeProgressRecord | null => {
  const record = asRecord(input);
  if (!record) {
    return null;
  }

  return {
    id: asId(record.id),
    status: asNullableString(record.status),
    current_value: asNumber(record.current_value),
    target_value: asNumber(record.target_value),
    progress_percent: asNumber(record.progress_percent),
    completed_conditions_count: asNumber(record.completed_conditions_count),
    total_conditions_count: asNumber(record.total_conditions_count),
    started_at: asNullableString(record.started_at),
    completed_at: asNullableString(record.completed_at),
    last_evaluated_at: asNullableString(record.last_evaluated_at),
    expires_at: asNullableString(record.expires_at),
    condition_states: asArray(record.condition_states),
    next_steps: asArray(record.next_steps)
      .map((step) => asString(step).trim())
      .filter(Boolean),
    badge: normalizeBadgeDefinition(record.badge),
  };
};

export const normalizeBadgeRewardLog = (input: unknown): BadgeRewardLogRecord | null => {
  const record = asRecord(input);
  if (!record) {
    return null;
  }

  return {
    id: asId(record.id),
    reward_type: asNullableString(record.reward_type),
    status: asNullableString(record.status),
    reward_value_numeric: asNullableNumber(record.reward_value_numeric),
    reward_value_text: asNullableString(record.reward_value_text),
    applied_at: asNullableString(record.applied_at),
    effective_from: asNullableString(record.effective_from),
    expires_at: asNullableString(record.expires_at),
    revoked_at: asNullableString(record.revoked_at),
    payload: asRecord(record.payload) ?? {},
    badge: normalizeBadgeDefinition(record.badge),
  };
};

export const normalizeBadgeCounts = (input: unknown): BadgeCounts => {
  const record = asRecord(input);

  return {
    awarded: asNumber(record?.awarded),
    in_progress: asNumber(record?.in_progress),
  };
};

export const normalizeBadgeDefinitionCollection = (input: unknown): BadgeDefinitionRecord[] =>
  normalizeGenericCollection(input)
    .map((item: unknown) => normalizeBadgeDefinition(item))
    .filter((item: BadgeDefinitionRecord | null): item is BadgeDefinitionRecord => Boolean(item));

export const normalizeUserBadgeCollection = (input: unknown): UserBadgeRecord[] =>
  normalizeGenericCollection(input, ['badges'])
    .map((item: unknown) => normalizeUserBadge(item))
    .filter((item: UserBadgeRecord | null): item is UserBadgeRecord => Boolean(item));

export const normalizeBadgeProgressCollection = (input: unknown): BadgeProgressRecord[] =>
  normalizeGenericCollection(input, ['progress'])
    .map((item: unknown) => normalizeBadgeProgress(item))
    .filter((item: BadgeProgressRecord | null): item is BadgeProgressRecord => Boolean(item));

export const normalizeBadgeRewardLogCollection = (input: unknown): BadgeRewardLogRecord[] =>
  normalizeGenericCollection(input, ['rewards'])
    .map((item: unknown) => normalizeBadgeRewardLog(item))
    .filter((item: BadgeRewardLogRecord | null): item is BadgeRewardLogRecord => Boolean(item));

export const humanizeBadgeToken = (value: string | null | undefined) => {
  const normalized = asString(value).trim();
  if (!normalized) {
    return '';
  }

  return normalized
    .split(/[_-\s]+/)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1).toLowerCase())
    .join(' ');
};

export const resolveBadgePalette = (badge?: BadgeDefinitionRecord | null) => ({
  color: badge?.color || '#0F766E',
  backgroundColor: badge?.background_color || 'rgba(15, 118, 110, 0.12)',
  borderColor: badge?.border_color || 'rgba(15, 118, 110, 0.28)',
});

export const resolveBadgeIcon = (badge?: BadgeDefinitionRecord | null): LucideIcon => {
  const iconKey = asString(badge?.icon).toLowerCase();
  const category = asString(badge?.category).toLowerCase();
  const code = asString(badge?.code).toLowerCase();

  if (iconKey.includes('star') || code.includes('gold') || code.includes('silver')) {
    return Star;
  }

  if (iconKey.includes('sparkle') || code.includes('trusted')) {
    return Sparkles;
  }

  if (iconKey.includes('shield') || code.includes('verified') || code.includes('identity')) {
    return Verified;
  }

  if (iconKey.includes('clock') || code.includes('fast') || code.includes('time')) {
    return Clock;
  }

  if (code.includes('milestone') || category === 'performance') {
    return Target;
  }

  if (code.includes('client') || category === 'relationship') {
    return Users;
  }

  if (code.includes('company') || category === 'business') {
    return Building;
  }

  if (code.includes('contract') || code.includes('project')) {
    return Briefcase;
  }

  if (iconKey.includes('zap') || code.includes('responder')) {
    return Zap;
  }

  if (category === 'trust' || category === 'identity') {
    return CheckCircle2;
  }

  return Award;
};

export const resolveBadgeRewardSummary = (
  source?: Record<string, unknown> | BadgeRewardLogRecord | null
) => {
  if (!source) {
    return null;
  }

  if ('reward_value_text' in source && typeof source.reward_value_text === 'string' && source.reward_value_text.trim()) {
    return source.reward_value_text.trim();
  }

  if ('reward_value_numeric' in source && source.reward_value_numeric !== null && source.reward_value_numeric !== undefined) {
    const numericValue = Number(source.reward_value_numeric);
    if (Number.isFinite(numericValue)) {
      const unit =
        typeof source.payload === 'object' && source.payload !== null && !Array.isArray(source.payload)
          ? asNullableString((source.payload as Record<string, unknown>).unit)
          : null;

      return unit ? `${numericValue} ${unit}` : `${numericValue}`;
    }
  }

  const record = 'payload' in source
    ? asRecord(source.payload)
    : asRecord(source);

  if (!record) {
    return null;
  }

  if (typeof record.label === 'string' && record.label.trim()) {
    return record.label.trim();
  }

  const rawValue = record.value ?? record.amount;
  if ((typeof rawValue === 'string' && rawValue.trim()) || typeof rawValue === 'number') {
    const unit = asNullableString(record.unit);
    return unit ? `${rawValue} ${unit}` : String(rawValue);
  }

  const rewardType =
    ('reward_type' in source ? asNullableString(source.reward_type) : null) ??
    asNullableString(record.type);

  return rewardType ? humanizeBadgeToken(rewardType) : null;
};
