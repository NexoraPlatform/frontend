import type {
  AdminServiceCategoryContractType,
  AdminServiceCategorySortField,
} from '@/lib/api';

export const ADMIN_SERVICE_CATEGORY_CONTRACT_TYPE_OPTIONS = [
  'SERVICES',
  'WORK_FOR_RESULT',
  'MIXED',
] as const satisfies readonly AdminServiceCategoryContractType[];

export const ADMIN_SERVICE_CATEGORY_SORT_OPTIONS = [
  'service_code',
  'service_name',
  'service_group',
  'sort_order',
  'created_at',
  'updated_at',
] as const satisfies readonly AdminServiceCategorySortField[];

export const ADMIN_SERVICE_CATEGORY_BOOLEAN_FILTER_OPTIONS = [
  'all',
  'true',
  'false',
] as const;

export type AdminBooleanFilterValue =
  (typeof ADMIN_SERVICE_CATEGORY_BOOLEAN_FILTER_OPTIONS)[number];

export function parseAdminBooleanFilter(
  value: string | null | undefined
): boolean | undefined {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return undefined;
}

export function stringifyAdminBooleanFilter(
  value: boolean | undefined
): AdminBooleanFilterValue {
  if (value === true) {
    return 'true';
  }

  if (value === false) {
    return 'false';
  }

  return 'all';
}
