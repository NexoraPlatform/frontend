import type { AccessRole } from '@/lib/access';
import type { ConnectedAccount } from '@/types/auth';

export interface AuthCompany {
  id?: number | string;
  name?: string | null;
  id_type?: string | null;
  id_number?: string | null;
  company_country?: string | null;
  company_county?: string | null;
  company_city?: string | null;
  company_zip?: string | null;
  company_address?: string | null;
  company_bank_iban?: string | null;
  company_bank_bic?: string | null;
  company_bank_name?: string | null;
  bank_currency?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  email_verified_at?: string | null;
  avatar?: string | null;
  phone?: string | null;
  company?: AuthCompany | null;
  country_code?: string | null;
  website?: string | null;
  location?: string;
  language?: string;
  bio?: string;
  role?: string | null;
  role_slugs?: string[];
  permission_slugs?: string[];
  permissions?: string[];
  rating?: string | number;
  reviewCount?: number;
  status?: string;
  last_login_at?: string | null;
  last_active_at?: string | null;
  timezone?: string | null;
  created_at?: string;
  updated_at?: string;
  testVerified?: boolean;
  callVerified?: boolean;
  rapyd_wallet_id?: string;
  rapyd_contact_id?: string;
  escrow_customer_id?: string | null;
  escrow_kyb_verified?: boolean | null;
  escrow_next_step?: string | null;
  is_online?: boolean;
  last_seen?: string | null;
  roles?: AccessRole[];
  profile_url?: string;
  is_superuser?: boolean;
  github_connected?: boolean;
  github_nickname?: string;
  connected_accounts?: ConnectedAccount[];
  user_permissions?: Record<string, any> | any[];
  oldest_work_experience?: string | null;
  next_available_job?: string | null;
  [key: string]: any;
}

const OMITTED_AUTH_USER_FIELDS = [
  'company',
  'company_id',
  'company_name',
  'tax_id',
  'trade_registry_number',
  'billing_address',
  'billing_city',
  'billing_state',
  'billing_postal_code',
  'id_type',
  'id_number',
  'company_country',
  'company_county',
  'company_city',
  'company_zip',
  'company_address',
  'company_bank_iban',
  'company_bank_bic',
  'company_bank_name',
  'bank_currency',
  'first_name',
  'last_name',
  'name',
  'github_token',
  'github_refresh_token',
] as const;

const resolveGithubConnected = (input: any) =>
  Boolean(input?.github_connected) ||
  Boolean(input?.github_token) ||
  (Array.isArray(input?.connected_accounts)
    ? input.connected_accounts.some((account: any) => account?.provider === 'github')
    : false);

export const sanitizeAuthResponsePayload = (payload: any) => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload;
  }

  if ('user' in payload) {
    return {
      ...payload,
      user: normalizeAuthUser(payload.user),
    };
  }

  const looksLikeUserPayload =
    'id' in payload ||
    'email' in payload ||
    'connected_accounts' in payload ||
    'role' in payload ||
    'role_slugs' in payload;

  if (!looksLikeUserPayload) {
    return payload;
  }

  return normalizeAuthUser(payload);
};

export const normalizeAuthUser = (input: any): AuthUser | null => {
  if (!input) return null;

  const rest = { ...input };
  OMITTED_AUTH_USER_FIELDS.forEach((field) => {
    delete rest[field];
  });

  const rawCompany = input.company;
  const companyFromObject =
    typeof rawCompany === 'object' && rawCompany !== null
      ? (rawCompany as AuthCompany)
      : null;

  const companyName =
    input.company_name ??
    (typeof rawCompany === 'string' ? rawCompany : undefined) ??
    companyFromObject?.name ??
    null;

  const hasCompanyFields =
    companyFromObject ||
    [
      input.company_id,
      input.id_type,
      input.id_number,
      input.company_country,
      input.company_county,
      input.company_city,
      input.company_zip,
      input.company_address,
      input.company_bank_iban,
      input.company_bank_bic,
      input.company_bank_name,
      input.bank_currency,
      companyName,
    ].some((value) => value !== undefined && value !== null && value !== '');

  const company = hasCompanyFields
    ? {
        id: input.company_id ?? companyFromObject?.id ?? null,
        name: companyName,
        id_type: input.id_type ?? companyFromObject?.id_type ?? null,
        id_number: input.id_number ?? companyFromObject?.id_number ?? null,
        company_country: input.company_country ?? companyFromObject?.company_country ?? null,
        company_county: input.company_county ?? companyFromObject?.company_county ?? null,
        company_city: input.company_city ?? companyFromObject?.company_city ?? null,
        company_zip: input.company_zip ?? companyFromObject?.company_zip ?? null,
        company_address: input.company_address ?? companyFromObject?.company_address ?? null,
        company_bank_iban: input.company_bank_iban ?? companyFromObject?.company_bank_iban ?? null,
        company_bank_bic: input.company_bank_bic ?? companyFromObject?.company_bank_bic ?? null,
        company_bank_name: input.company_bank_name ?? companyFromObject?.company_bank_name ?? null,
        bank_currency: input.bank_currency ?? companyFromObject?.bank_currency ?? null,
        created_at: companyFromObject?.created_at ?? null,
        updated_at: companyFromObject?.updated_at ?? null,
      }
    : null;

  const fullName = typeof input.name === 'string' ? input.name.trim() : '';
  const [inferredFirstName = '', ...restNameParts] = fullName ? fullName.split(/\s+/) : [];
  const inferredLastName = restNameParts.join(' ');
  const firstName = input.firstName ?? input.first_name ?? inferredFirstName ?? '';
  const lastName = input.lastName ?? input.last_name ?? inferredLastName ?? '';
  const email = input.email ?? '';
  const id = input.id ?? input.user_id;
  const roleSlugsFromRoles = Array.isArray(input.roles)
    ? input.roles
        .map((role: any) =>
          typeof role === 'string'
            ? role
            : role?.slug ?? role?.name ?? null
        )
        .filter(Boolean)
        .map((role: string) => role.toLowerCase())
    : [];
  const roleSlugsFromPayload = Array.isArray(input.role_slugs)
    ? input.role_slugs
        .filter(Boolean)
        .map((role: string) => String(role).toLowerCase())
    : [];
  const roleSlugs = Array.from(new Set([...roleSlugsFromPayload, ...roleSlugsFromRoles]));
  const permissions = input.permissions ?? input.permission_slugs;
  const githubConnected = resolveGithubConnected(input);

  return {
    ...rest,
    id: id !== undefined && id !== null ? String(id) : '',
    email,
    firstName,
    lastName,
    avatar: input.avatar ?? input.profile_photo_url ?? null,
    role: input.role ?? input.role_slug ?? null,
    role_slugs: roleSlugs,
    company,
    permissions,
    github_connected: githubConnected,
  } as AuthUser;
};
