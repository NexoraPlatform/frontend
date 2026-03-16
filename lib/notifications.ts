import { sanitizeNavigationTarget } from '@/lib/navigation-security';

export type RawLaravelNotification = {
  id: string | number;
  type?: string;
  notificationType?: string;
  data?: any;
  title?: string;
  message?: string;
  projectId?: string | number | null;
  groupId?: string | number | null;
  payload?: Record<string, unknown> | null;
  link?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
  read_at?: string | null;
  readAt?: string | null;
};

export type NotificationPayload = {
  transactionId?: string | number;
  projectLineIds?: Array<string | number>;
  milestoneIds?: Array<string | number>;
  activeMilestoneId?: string | number | null;
  activeMilestoneIndex?: string | number | null;
  clientTransactionStatus?: string | null;
  providerTransactionStatus?: string | null;
  recipientRole?: string | null;
  projectId?: string | number | null;
  groupId?: string | number | null;
  redirectUrl?: string | null;
  [key: string]: unknown;
};

export type NotificationCategory = 'message' | 'project' | 'escrow' | 'system';

export type NotificationTone =
  | 'message'
  | 'info'
  | 'processing'
  | 'funded'
  | 'success'
  | 'warning'
  | 'system';

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  projectId: string | null;
  payload: NotificationPayload;
  readAt: string | null;
  createdAt: string;
  isRead: boolean;
  category: NotificationCategory;
  data: Record<string, unknown>;
  groupId: string | null;
  link: string | null;
  notificationType: string | null;
};

const ESCROW_USER_REFRESH_TYPES = new Set([
  'escrow.customer.customer_verified',
  'escrow.customer.party_verification_approved',
]);

const PROJECT_NOTIFICATION_PREFIXES = ['project.', 'budget.', 'milestone.'];

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toText(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function firstText(...values: unknown[]): string | undefined {
  for (const value of values) {
    const normalized = toText(value);
    if (normalized) {
      return normalized;
    }
  }

  return undefined;
}

function humanize(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const cleaned = value
    .replace(/[_\.]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) {
    return undefined;
  }

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function normalizeId(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
}

function pickPayloadValue(
  payload: Record<string, unknown>,
  source: Record<string, unknown>,
  keys: string[]
) {
  for (const key of keys) {
    const payloadValue = payload[key];
    if (payloadValue !== null && payloadValue !== undefined && payloadValue !== '') {
      return payloadValue;
    }

    const sourceValue = source[key];
    if (sourceValue !== null && sourceValue !== undefined && sourceValue !== '') {
      return sourceValue;
    }
  }

  return undefined;
}

function isBusinessNotificationType(value: unknown): value is string {
  const text = toText(value);
  if (!text) {
    return false;
  }

  return !text.includes('\\');
}

function normalizeNotificationType(
  raw: RawLaravelNotification,
  rawData: Record<string, unknown>
) {
  const directType = isBusinessNotificationType(raw.type) ? raw.type : undefined;

  return (
    firstText(
      raw.notificationType,
      directType,
      rawData.notificationType,
      rawData.type
    ) ?? 'system.notification'
  );
}

function buildPayload(
  raw: RawLaravelNotification,
  rawData: Record<string, unknown>
): NotificationPayload {
  const payload = isObject(raw.payload)
    ? { ...raw.payload }
    : isObject(rawData.payload)
      ? { ...rawData.payload }
      : {};

  const projectId = pickPayloadValue(payload, rawData, ['projectId', 'project_id']);
  if (payload.projectId == null && projectId !== undefined) {
    payload.projectId = projectId as string | number;
  }

  const groupId = pickPayloadValue(payload, rawData, ['groupId', 'group_id']);
  if (payload.groupId == null && groupId !== undefined) {
    payload.groupId = groupId as string | number;
  }

  const activeMilestoneId = pickPayloadValue(payload, rawData, [
    'activeMilestoneId',
    'active_milestone_id',
    'milestoneId',
    'milestone_id',
  ]);
  if (payload.activeMilestoneId == null && activeMilestoneId !== undefined) {
    payload.activeMilestoneId = activeMilestoneId as string | number;
  }

  const activeMilestoneIndex = pickPayloadValue(payload, rawData, [
    'activeMilestoneIndex',
    'active_milestone_index',
  ]);
  if (payload.activeMilestoneIndex == null && activeMilestoneIndex !== undefined) {
    payload.activeMilestoneIndex = activeMilestoneIndex as string | number;
  }

  const transactionId = pickPayloadValue(payload, rawData, ['transactionId', 'transaction_id']);
  if (payload.transactionId == null && transactionId !== undefined) {
    payload.transactionId = transactionId as string | number;
  }

  const recipientRole = pickPayloadValue(payload, rawData, ['recipientRole', 'recipient_role']);
  if (payload.recipientRole == null && recipientRole !== undefined) {
    payload.recipientRole = String(recipientRole);
  }

  const redirectUrl = pickPayloadValue(payload, rawData, ['redirectUrl', 'redirect_url']);
  if (payload.redirectUrl == null && redirectUrl !== undefined) {
    payload.redirectUrl = String(redirectUrl);
  }

  const clientTransactionStatus = pickPayloadValue(payload, rawData, [
    'clientTransactionStatus',
    'client_transaction_status',
  ]);
  if (payload.clientTransactionStatus == null && clientTransactionStatus !== undefined) {
    payload.clientTransactionStatus = String(clientTransactionStatus);
  }

  const providerTransactionStatus = pickPayloadValue(payload, rawData, [
    'providerTransactionStatus',
    'provider_transaction_status',
  ]);
  if (payload.providerTransactionStatus == null && providerTransactionStatus !== undefined) {
    payload.providerTransactionStatus = String(providerTransactionStatus);
  }

  const projectLineIds = pickPayloadValue(payload, rawData, ['projectLineIds', 'project_line_ids']);
  if (payload.projectLineIds == null && Array.isArray(projectLineIds)) {
    payload.projectLineIds = projectLineIds as Array<string | number>;
  }

  const milestoneIds = pickPayloadValue(payload, rawData, ['milestoneIds', 'milestone_ids']);
  if (payload.milestoneIds == null && Array.isArray(milestoneIds)) {
    payload.milestoneIds = milestoneIds as Array<string | number>;
  }

  return payload as NotificationPayload;
}

function deriveNotificationCategory(
  type: string,
  raw: RawLaravelNotification,
  payload: NotificationPayload,
  rawData: Record<string, unknown>
): NotificationCategory {
  const normalizedType = type.toLowerCase();

  if (normalizedType.startsWith('chat.') || payload.groupId != null || rawData.groupId != null) {
    return 'message';
  }

  if (normalizedType.startsWith('escrow.') || normalizedType.startsWith('rapyd.')) {
    return 'escrow';
  }

  if (PROJECT_NOTIFICATION_PREFIXES.some((prefix) => normalizedType.startsWith(prefix))) {
    return 'project';
  }

  const rawClass = String(raw.type ?? '').toLowerCase();
  if (rawClass.includes('chat') && (rawClass.includes('message') || rawClass.includes('group'))) {
    return 'message';
  }
  if (rawClass.includes('project') || rawClass.includes('budget') || rawClass.includes('milestone')) {
    return 'project';
  }
  if (rawClass.includes('rapyd') || rawClass.includes('escrow')) {
    return 'escrow';
  }

  return 'system';
}

export function normalizeNotification(raw: RawLaravelNotification): AppNotification {
  const rawData = isObject(raw.data) ? raw.data : {};
  const payload = buildPayload(raw, rawData);
  const type = normalizeNotificationType(raw, rawData);
  const title =
    firstText(raw.title, rawData.title) ??
    humanize(type) ??
    'Notification';
  const message = firstText(raw.message, rawData.message) ?? '';
  const projectId =
    normalizeId(raw.projectId) ??
    normalizeId(rawData.projectId) ??
    normalizeId(payload.projectId) ??
    null;
  const groupId =
    normalizeId(raw.groupId) ??
    normalizeId(rawData.groupId) ??
    normalizeId(payload.groupId) ??
    null;
  const readAt = firstText(raw.read_at, raw.readAt) ?? null;
  const createdAt =
    firstText(raw.created_at, raw.createdAt, rawData.created_at, rawData.createdAt) ??
    new Date().toISOString();
  const link =
    firstText(raw.link, rawData.link, payload.redirectUrl) ??
    null;
  const category = deriveNotificationCategory(type, raw, payload, rawData);

  return {
    id: normalizeId(raw.id) ?? '',
    type,
    title,
    message,
    projectId,
    payload,
    readAt,
    createdAt,
    isRead: readAt !== null,
    category,
    data: rawData,
    groupId,
    link,
    notificationType: type,
  };
}

export function getNotificationRecipientRole(notification: Pick<AppNotification, 'payload'>) {
  return toText(notification.payload?.recipientRole)?.toLowerCase() ?? null;
}

export function getNotificationMilestoneId(
  notification: Pick<AppNotification, 'payload' | 'data'>
) {
  return (
    normalizeId(notification.payload?.activeMilestoneId) ??
    normalizeId(notification.payload?.milestoneId) ??
    normalizeId(notification.payload?.milestone_id) ??
    normalizeId(notification.data?.activeMilestoneId) ??
    normalizeId(notification.data?.milestoneId) ??
    normalizeId(notification.data?.milestone_id) ??
    null
  );
}

export function resolveNotificationLink(
  notification: Pick<AppNotification, 'category' | 'projectId' | 'payload' | 'groupId' | 'link' | 'data'>
): string {
  const safeLink = sanitizeNavigationTarget(notification.link ?? notification.payload?.redirectUrl ?? null);
  if (safeLink) {
    return safeLink;
  }

  if (notification.category === 'message') {
    const groupId =
      notification.groupId ??
      normalizeId(notification.payload?.groupId) ??
      normalizeId(notification.data?.groupId);
    if (groupId) {
      return `/dashboard?tab=messages&groupId=${encodeURIComponent(groupId)}`;
    }

    return '/dashboard?tab=messages';
  }

  const projectId =
    notification.projectId ??
    normalizeId(notification.payload?.projectId) ??
    normalizeId(notification.data?.projectId);
  const activeMilestoneId = getNotificationMilestoneId(notification);
  if (projectId) {
    const params = new URLSearchParams();
    params.set('tab', 'projects');
    params.set('projectId', projectId);
    if (activeMilestoneId) {
      params.set('activeMilestoneId', activeMilestoneId);
    }
    return `/dashboard?${params.toString()}`;
  }

  if (notification.category === 'escrow') {
    return '/dashboard?tab=finance';
  }

  if (notification.category === 'project') {
    return '/dashboard?tab=projects';
  }

  return '/dashboard';
}

export function shouldRefreshUserForNotification(type: string) {
  return ESCROW_USER_REFRESH_TYPES.has(type.toLowerCase());
}

export function getNotificationTone(notification: Pick<AppNotification, 'type' | 'category' | 'payload'>): NotificationTone {
  const type = notification.type.toLowerCase();

  if (notification.category === 'message') {
    return 'message';
  }

  if (
    type === 'escrow.customer.customer_verified' ||
    type === 'escrow.customer.party_verification_approved' ||
    type === 'escrow.transaction.accept' ||
    type === 'escrow.transaction.payment_disbursed' ||
    type === 'escrow.transaction.completed'
  ) {
    return 'success';
  }

  if (type === 'escrow.transaction.payment_approved') {
    return 'funded';
  }

  if (
    type === 'escrow.transaction.payment_sent' ||
    type === 'escrow.transaction.payment_received' ||
    type === 'escrow.transaction.ship' ||
    type === 'escrow.transaction.disburse'
  ) {
    return 'processing';
  }

  if (
    type === 'escrow.transaction.reject' ||
    type === 'escrow.transaction.cancel'
  ) {
    return 'warning';
  }

  if (notification.category === 'project' || notification.category === 'escrow') {
    return 'info';
  }

  return 'system';
}

export function getNotificationBadgeTranslationKey(
  notification: Pick<AppNotification, 'type' | 'category' | 'payload'>
) {
  const type = notification.type.toLowerCase();

  switch (type) {
    case 'escrow.customer.customer_verified':
      return 'common.notifications.labels.customer_verified';
    case 'escrow.customer.party_verification_approved':
      return 'common.notifications.labels.party_verification_approved';
    case 'escrow.transaction.agree':
      return 'common.notifications.labels.payment_pending';
    case 'escrow.transaction.payment_sent':
    case 'escrow.transaction.payment_received':
    case 'escrow.transaction.disburse':
      return 'common.notifications.labels.processing';
    case 'escrow.transaction.payment_approved':
      return 'common.notifications.labels.funded';
    case 'escrow.transaction.ship':
      return getNotificationRecipientRole(notification) === 'client'
        ? 'common.notifications.labels.review_needed'
        : 'common.notifications.labels.waiting_review';
    case 'escrow.transaction.reject':
      return 'common.notifications.labels.rejected';
    case 'escrow.transaction.accept':
      return 'common.notifications.labels.accepted';
    case 'escrow.transaction.payment_disbursed':
      return 'common.notifications.labels.payment_disbursed';
    case 'escrow.transaction.cancel':
      return 'common.notifications.labels.cancelled';
    case 'escrow.transaction.completed':
      return 'common.notifications.labels.completed';
    default:
      if (notification.category === 'message') {
        return 'common.notifications.labels.message';
      }
      if (notification.category === 'project') {
        return 'common.notifications.labels.project';
      }
      if (notification.category === 'escrow') {
        return 'common.notifications.labels.escrow';
      }
      return 'common.notifications.labels.notification';
  }
}

export function getNotificationActionTranslationKey(
  notification: Pick<AppNotification, 'type' | 'category' | 'payload' | 'projectId' | 'data'>
) {
  const type = notification.type.toLowerCase();
  const recipientRole = getNotificationRecipientRole(notification);
  const hasProjectContext = Boolean(
    notification.projectId ??
      normalizeId(notification.payload?.projectId) ??
      normalizeId(notification.data?.projectId)
  );

  if (type === 'escrow.transaction.agree' && recipientRole === 'client' && hasProjectContext) {
    return 'common.notifications.actions.continue_payment';
  }

  if (type === 'escrow.transaction.ship') {
    return recipientRole === 'client'
      ? 'common.notifications.actions.review_milestone'
      : 'common.notifications.actions.waiting_review';
  }

  if (type === 'escrow.transaction.reject' && recipientRole === 'provider' && hasProjectContext) {
    return 'common.notifications.actions.revise_delivery';
  }

  if (type === 'escrow.transaction.payment_disbursed' || type === 'escrow.transaction.completed') {
    return 'common.notifications.actions.payout_completed';
  }

  if (notification.category === 'message' || hasProjectContext || notification.category === 'escrow') {
    return 'common.notifications.actions.view';
  }

  return null;
}
