import type { AccessRole } from '@/lib/access';
import {
  normalizeBadgeCounts,
  normalizeUserBadgeCollection,
  type BadgeCounts,
  type UserBadgeRecord,
} from '@/lib/badges';
import type { ConnectedAccount } from '@/types/auth';

export interface AuthCompany {
  id?: number | string;
  name?: string | null;
  legal_profile?: AuthCompanyLegalProfile | null;
  legal_name?: string | null;
  commercial_name?: string | null;
  country_code?: string | null;
  registration_number?: string | null;
  tax_identification_number?: string | null;
  vat_number?: string | null;
  is_vat_registered?: boolean | null;
  default_currency?: string | null;
  registered_address_line_1?: string | null;
  registered_address_line_2?: string | null;
  registered_city?: string | null;
  registered_state?: string | null;
  registered_postal_code?: string | null;
  authorized_signatory_name?: string | null;
  authorized_signatory_title?: string | null;
  authorized_signatory_email?: string | null;
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

export interface AuthCompanyLegalProfile {
  legal_name?: string | null;
  commercial_name?: string | null;
  country_code?: string | null;
  registration_number?: string | null;
  tax_identification_number?: string | null;
  vat_number?: string | null;
  is_vat_registered?: boolean | null;
  default_currency?: string | null;
  registered_address_line_1?: string | null;
  registered_address_line_2?: string | null;
  registered_city?: string | null;
  registered_state?: string | null;
  registered_postal_code?: string | null;
  authorized_signatory_name?: string | null;
  authorized_signatory_title?: string | null;
  authorized_signatory_email?: string | null;
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
  badge_counts?: BadgeCounts;
  featured_badges?: UserBadgeRecord[];
  user_permissions?: Record<string, any> | any[];
  oldest_work_experience?: string | null;
  next_available_job?: string | null;
  [key: string]: any;
}

const OMITTED_AUTH_USER_FIELDS = [
  'company',
  'company_id',
  'company_name',
  'legal_name',
  'commercial_name',
  'country_code',
  'registration_number',
  'tax_identification_number',
  'vat_number',
  'is_vat_registered',
  'default_currency',
  'registered_address_line_1',
  'registered_address_line_2',
  'registered_city',
  'registered_state',
  'registered_postal_code',
  'authorized_signatory_name',
  'authorized_signatory_title',
  'authorized_signatory_email',
  'legal_profile',
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

const hasMeaningfulValue = (value: unknown) =>
  value !== undefined && value !== null && (!(typeof value === 'string') || value.trim() !== '');

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
  const legalProfileFromObject =
    companyFromObject && typeof companyFromObject.legal_profile === 'object' && companyFromObject.legal_profile !== null
      ? (companyFromObject.legal_profile as AuthCompanyLegalProfile)
      : null;

  const companyName =
    input.company_name ??
    input.commercial_name ??
    input.legal_name ??
    (typeof rawCompany === 'string' ? rawCompany : undefined) ??
    companyFromObject?.commercial_name ??
    legalProfileFromObject?.commercial_name ??
    legalProfileFromObject?.legal_name ??
    companyFromObject?.name ??
    null;

  const legalProfile: AuthCompanyLegalProfile = {
    legal_name:
      input.legal_name ??
      legalProfileFromObject?.legal_name ??
      companyFromObject?.legal_name ??
      input.company_name ??
      companyName,
    commercial_name:
      input.commercial_name ??
      legalProfileFromObject?.commercial_name ??
      companyFromObject?.commercial_name ??
      companyName,
    country_code:
      input.country_code ??
      legalProfileFromObject?.country_code ??
      companyFromObject?.country_code ??
      input.company_country ??
      null,
    registration_number:
      input.registration_number ??
      legalProfileFromObject?.registration_number ??
      companyFromObject?.registration_number ??
      input.trade_registry_number ??
      null,
    tax_identification_number:
      input.tax_identification_number ??
      legalProfileFromObject?.tax_identification_number ??
      companyFromObject?.tax_identification_number ??
      input.tax_id ??
      null,
    vat_number:
      input.vat_number ??
      legalProfileFromObject?.vat_number ??
      companyFromObject?.vat_number ??
      null,
    is_vat_registered:
      input.is_vat_registered ??
      legalProfileFromObject?.is_vat_registered ??
      companyFromObject?.is_vat_registered ??
      null,
    default_currency:
      input.default_currency ??
      legalProfileFromObject?.default_currency ??
      companyFromObject?.default_currency ??
      input.bank_currency ??
      null,
    registered_address_line_1:
      input.registered_address_line_1 ??
      legalProfileFromObject?.registered_address_line_1 ??
      companyFromObject?.registered_address_line_1 ??
      input.company_address ??
      input.billing_address ??
      null,
    registered_address_line_2:
      input.registered_address_line_2 ??
      legalProfileFromObject?.registered_address_line_2 ??
      companyFromObject?.registered_address_line_2 ??
      null,
    registered_city:
      input.registered_city ??
      legalProfileFromObject?.registered_city ??
      companyFromObject?.registered_city ??
      input.company_city ??
      input.billing_city ??
      null,
    registered_state:
      input.registered_state ??
      legalProfileFromObject?.registered_state ??
      companyFromObject?.registered_state ??
      input.company_county ??
      input.billing_state ??
      null,
    registered_postal_code:
      input.registered_postal_code ??
      legalProfileFromObject?.registered_postal_code ??
      companyFromObject?.registered_postal_code ??
      input.company_zip ??
      input.billing_postal_code ??
      null,
    authorized_signatory_name:
      input.authorized_signatory_name ??
      legalProfileFromObject?.authorized_signatory_name ??
      companyFromObject?.authorized_signatory_name ??
      null,
    authorized_signatory_title:
      input.authorized_signatory_title ??
      legalProfileFromObject?.authorized_signatory_title ??
      companyFromObject?.authorized_signatory_title ??
      null,
    authorized_signatory_email:
      input.authorized_signatory_email ??
      legalProfileFromObject?.authorized_signatory_email ??
      companyFromObject?.authorized_signatory_email ??
      null,
  };

  const hasLegalProfileFields = Object.values(legalProfile).some(hasMeaningfulValue);

  const hasCompanyFields =
    companyFromObject ||
    hasLegalProfileFields ||
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
    ].some(hasMeaningfulValue);

  const company = hasCompanyFields
    ? {
        id: input.company_id ?? companyFromObject?.id ?? null,
        name: companyName,
        legal_profile: hasLegalProfileFields ? legalProfile : null,
        legal_name: legalProfile.legal_name ?? null,
        commercial_name: legalProfile.commercial_name ?? null,
        country_code: legalProfile.country_code ?? null,
        registration_number: legalProfile.registration_number ?? null,
        tax_identification_number: legalProfile.tax_identification_number ?? null,
        vat_number: legalProfile.vat_number ?? null,
        is_vat_registered:
          typeof legalProfile.is_vat_registered === 'boolean' ? legalProfile.is_vat_registered : null,
        default_currency: legalProfile.default_currency ?? null,
        registered_address_line_1: legalProfile.registered_address_line_1 ?? null,
        registered_address_line_2: legalProfile.registered_address_line_2 ?? null,
        registered_city: legalProfile.registered_city ?? null,
        registered_state: legalProfile.registered_state ?? null,
        registered_postal_code: legalProfile.registered_postal_code ?? null,
        authorized_signatory_name: legalProfile.authorized_signatory_name ?? null,
        authorized_signatory_title: legalProfile.authorized_signatory_title ?? null,
        authorized_signatory_email: legalProfile.authorized_signatory_email ?? null,
        id_type: input.id_type ?? companyFromObject?.id_type ?? null,
        id_number:
          input.id_number ??
          companyFromObject?.id_number ??
          legalProfile.tax_identification_number ??
          null,
        company_country:
          input.company_country ?? companyFromObject?.company_country ?? legalProfile.country_code ?? null,
        company_county:
          input.company_county ?? companyFromObject?.company_county ?? legalProfile.registered_state ?? null,
        company_city:
          input.company_city ?? companyFromObject?.company_city ?? legalProfile.registered_city ?? null,
        company_zip:
          input.company_zip ??
          companyFromObject?.company_zip ??
          legalProfile.registered_postal_code ??
          null,
        company_address:
          input.company_address ??
          companyFromObject?.company_address ??
          legalProfile.registered_address_line_1 ??
          null,
        company_bank_iban: input.company_bank_iban ?? companyFromObject?.company_bank_iban ?? null,
        company_bank_bic: input.company_bank_bic ?? companyFromObject?.company_bank_bic ?? null,
        company_bank_name: input.company_bank_name ?? companyFromObject?.company_bank_name ?? null,
        bank_currency:
          input.bank_currency ?? companyFromObject?.bank_currency ?? legalProfile.default_currency ?? null,
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
    badge_counts: normalizeBadgeCounts(input.badge_counts),
    featured_badges: normalizeUserBadgeCollection(input.featured_badges),
  } as AuthUser;
};
