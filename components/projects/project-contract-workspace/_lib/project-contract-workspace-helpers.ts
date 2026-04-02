import {
  getPermissionSlugs,
  getRoleSlugs,
  isSuperUser,
  type AccessUser,
} from '@/lib/access';
import { extractFileNameFromContentDisposition } from '@/lib/contracts';

export const readCachedContractId = (projectId: string) => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(`project-contract:${projectId}`);
    return raw && raw.trim() ? raw : null;
  } catch {
    return null;
  }
};

export const writeCachedContractId = (projectId: string, contractId: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(`project-contract:${projectId}`, contractId);
  } catch {
    // Ignore client storage failures.
  }
};

export const clearCachedContractId = (projectId: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.removeItem(`project-contract:${projectId}`);
  } catch {
    // Ignore client storage failures.
  }
};

export const resolveErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message.trim() ? error.message : fallback;

export const normalizeId = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized ? normalized : null;
};

export const formatFileSize = (value: number | null, locale: string) => {
  if (!value || value <= 0) {
    return null;
  }

  return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'ro-RO', {
    maximumFractionDigits: 1,
    style: 'unit',
    unit: value >= 1024 * 1024 ? 'megabyte' : 'kilobyte',
    unitDisplay: 'narrow',
  }).format(value >= 1024 * 1024 ? value / (1024 * 1024) : value / 1024);
};

export const formatDateTime = (value: string | null, locale: string) => {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return null;
  }

  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'ro-RO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(timestamp);
};

export const getStatusTone = (status: string) => {
  const normalized = status.trim().toLowerCase();

  if (normalized === 'signed' || normalized === 'ready_for_signature') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (
    normalized === 'awaiting_client_signature' ||
    normalized === 'awaiting_provider_signature'
  ) {
    return 'border-blue-200 bg-blue-50 text-blue-700';
  }

  if (normalized === 'pending_review' || normalized === 'sent_for_signature') {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }

  if (normalized === 'blocked' || normalized === 'cancelled') {
    return 'border-red-200 bg-red-50 text-red-700';
  }

  return 'border-slate-200 bg-slate-100 text-slate-700';
};

export const humanizeCode = (value: string | null | undefined) =>
  String(value ?? '')
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());

export const canGenerateContractsForProject = (
  user: AccessUser | null,
  projectClientId: string | null
) => {
  if (!user) {
    return false;
  }

  if (isSuperUser(user)) {
    return true;
  }

  const roleSlugs = getRoleSlugs(user);
  if (roleSlugs.some((role) => ['admin', 'support', 'legal'].includes(role))) {
    return true;
  }

  const permissions = new Set(getPermissionSlugs(user));
  if (
    permissions.has('contracts.generate') ||
    permissions.has('legal.contracts.generate')
  ) {
    return true;
  }

  return projectClientId !== null && String(user.id) === projectClientId;
};

const PRIVILEGED_CONTRACT_ROLES = new Set(['admin', 'support', 'legal']);

export const isPrivilegedContractActor = (user: AccessUser | null) => {
  if (!user) {
    return false;
  }

  if (isSuperUser(user)) {
    return true;
  }

  return getRoleSlugs(user).some((role) => PRIVILEGED_CONTRACT_ROLES.has(role));
};

export const getProcessTone = (value: string | null | undefined) => {
  const normalized = String(value ?? '').trim().toLowerCase();

  if (
    normalized.includes('approved') ||
    normalized.includes('accepted') ||
    normalized.includes('ready') ||
    normalized.includes('signed') ||
    normalized.includes('validated')
  ) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (
    normalized.includes('rejected') ||
    normalized.includes('failed') ||
    normalized.includes('blocked') ||
    normalized.includes('cancelled') ||
    normalized.includes('declined')
  ) {
    return 'border-red-200 bg-red-50 text-red-700';
  }

  if (
    normalized.includes('awaiting') ||
    normalized.includes('pending') ||
    normalized.includes('open') ||
    normalized.includes('review') ||
    normalized.includes('requested') ||
    normalized.includes('received') ||
    normalized.includes('sent')
  ) {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }

  return 'border-slate-200 bg-slate-100 text-slate-700';
};

export const normalizeTextLines = (value: string) =>
  value
    .split('\n')
    .map((entry) => entry.trim())
    .filter(Boolean);

export const downloadResponseBlob = async (
  response: Response,
  fallbackFileName: string
) => {
  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const fileName =
    extractFileNameFromContentDisposition(
      response.headers.get('content-disposition')
    ) ?? fallbackFileName;

  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(objectUrl);
};
