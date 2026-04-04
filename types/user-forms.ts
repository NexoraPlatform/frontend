// types/user-forms.ts
import * as v from 'valibot';
import type { ConnectedAccount } from '@/types/auth';

const emptyToUndefined = (value: string) =>
    value.trim() === '' ? undefined : value;

export type BaseUser = {
    id?: number;
    firstName: string;
    lastName: string;
    email: string;
    role: 'ADMIN' | 'PROVIDER' | 'CLIENT';
    phone: string;
    password?: string;
    is_superuser?: boolean;
    testVerified?: boolean;
    callVerified?: boolean;
    stripe_account_id?: string;
    rapyd_wallet_id?: string;
    rapyd_contact_id?: string;
    escrow_customer_id?: string | null;
    escrow_kyb_verified?: boolean | null;
    escrow_next_step?: string | null;
    location?: string;
    avatar?: string;
    confirm_password?: string;
    company_name?: string;
    tax_id?: string;
    trade_registry_number?: string;
    billing_address?: string;
    billing_city?: string;
    billing_state?: string;
    billing_postal_code?: string;
    legal_name?: string;
    commercial_name?: string;
    registration_number?: string;
    tax_identification_number?: string;
    vat_number?: string;
    is_vat_registered?: boolean;
    country_code?: string;
    default_currency?: string;
    registered_address_line_1?: string;
    registered_address_line_2?: string;
    registered_city?: string;
    registered_state?: string;
    registered_postal_code?: string;
    authorized_signatory_name?: string;
    authorized_signatory_title?: string;
    authorized_signatory_email?: string;
    user_permissions?: Record<
        string,
        { id: number; name: string; allowed: boolean }
    > | Array<any>; // lista din backend la load
    connected_accounts?: ConnectedAccount[];
};

export type AdminFormData = BaseUser & {
    role: 'ADMIN';
    // câmpuri specifice adminului, dacă ai
    adminNote?: string;
};

export type ProviderFormData = BaseUser & {
    role: 'PROVIDER';
    avatarUrl?: string;
    companyName?: string;
    companyVat?: string;
    serviceCategories?: string[];
};

export type ClientFormData = BaseUser & {
    role: 'CLIENT';
    birthday?: string;
    address?: string;
};

export type AnyFormData = AdminFormData | ProviderFormData | ClientFormData;

const optionalBillingStringSchema = v.optional(
    v.pipe(
        v.string(),
        v.transform(emptyToUndefined),
        v.union([v.string(), v.undefined()]),
    ),
);

const optionalBillingBooleanSchema = v.optional(v.boolean());

const billingDetailsEntries = {
    legal_name: optionalBillingStringSchema,
    commercial_name: optionalBillingStringSchema,
    registration_number: optionalBillingStringSchema,
    tax_identification_number: optionalBillingStringSchema,
    vat_number: optionalBillingStringSchema,
    is_vat_registered: optionalBillingBooleanSchema,
    country_code: optionalBillingStringSchema,
    default_currency: optionalBillingStringSchema,
    registered_address_line_1: optionalBillingStringSchema,
    registered_address_line_2: optionalBillingStringSchema,
    registered_city: optionalBillingStringSchema,
    registered_state: optionalBillingStringSchema,
    registered_postal_code: optionalBillingStringSchema,
    authorized_signatory_title: optionalBillingStringSchema,
};

const billingDetailsBaseSchema = v.object(billingDetailsEntries);

const hasCompanyLegalDetails = (data: Record<string, unknown>) =>
    Boolean(data.legal_name || data.commercial_name || data.tax_identification_number);

export const billingDetailsSchema = v.pipe(
    billingDetailsBaseSchema,
    v.forward(
        v.check(
            (data) => !hasCompanyLegalDetails(data) || Boolean(data.legal_name),
            'Legal name is required when company details are provided',
        ),
        ['legal_name'],
    ),
    v.forward(
        v.check(
            (data) => !hasCompanyLegalDetails(data) || Boolean(data.tax_identification_number),
            'Tax ID is required when company details are provided',
        ),
        ['tax_identification_number'],
    ),
    v.forward(
        v.check(
            (data) => !hasCompanyLegalDetails(data) || Boolean(data.country_code),
            'Country is required when company details are provided',
        ),
        ['country_code'],
    ),
    v.forward(
        v.check(
            (data) => !hasCompanyLegalDetails(data) || Boolean(data.registered_address_line_1),
            'Registered address is required when company details are provided',
        ),
        ['registered_address_line_1'],
    ),
);

const userBaseSchema = v.object({
    firstName: v.pipe(v.string(), v.minLength(1, 'First name is required')),
    lastName: v.pipe(v.string(), v.minLength(1, 'Last name is required')),
    email: v.pipe(v.string(), v.email('Valid email is required')),
    role: v.picklist(['ADMIN', 'PROVIDER', 'CLIENT']),
    phone: v.pipe(v.string(), v.minLength(1, 'Phone number is required')),
    password: v.optional(v.string()),
    confirm_password: v.optional(v.string()),
    ...billingDetailsEntries,
});

export const userSchema = v.pipe(
    userBaseSchema,
    v.forward(
        v.check(
            (data) => !hasCompanyLegalDetails(data) || Boolean(data.legal_name),
            'Legal name is required when company details are provided',
        ),
        ['legal_name'],
    ),
    v.forward(
        v.check(
            (data) => !hasCompanyLegalDetails(data) || Boolean(data.tax_identification_number),
            'Tax ID is required when company details are provided',
        ),
        ['tax_identification_number'],
    ),
    v.forward(
        v.check(
            (data) => !hasCompanyLegalDetails(data) || Boolean(data.country_code),
            'Country is required when company details are provided',
        ),
        ['country_code'],
    ),
    v.forward(
        v.check(
            (data) => !hasCompanyLegalDetails(data) || Boolean(data.registered_address_line_1),
            'Registered address is required when company details are provided',
        ),
        ['registered_address_line_1'],
    ),
);

export type UserFormValues = v.InferOutput<typeof userSchema>;

export type BillingDetailsFormValues = v.InferOutput<
    typeof billingDetailsSchema
>;

export const createEmptyBillingDetailsValues = (): BillingDetailsFormValues => ({
    legal_name: '',
    commercial_name: '',
    registration_number: '',
    tax_identification_number: '',
    vat_number: '',
    is_vat_registered: false,
    country_code: '',
    default_currency: '',
    registered_address_line_1: '',
    registered_address_line_2: '',
    registered_city: '',
    registered_state: '',
    registered_postal_code: '',
    authorized_signatory_title: '',
});

const coerceString = (value: unknown): string => {
    if (typeof value !== 'string') {
        return '';
    }

    return value;
};

const coerceBoolean = (value: unknown): boolean => {
    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'number') {
        return value === 1;
    }

    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return normalized === '1' || normalized === 'true' || normalized === 'yes';
    }

    return false;
};

type CompanyFormSource = Record<string, unknown> | null | undefined;

const resolveSourceValue = (source: CompanyFormSource, ...keys: string[]) => {
    if (!source) return undefined;

    for (const key of keys) {
        const value = source[key];
        if (value !== undefined && value !== null && value !== '') {
            return value;
        }
    }

    return undefined;
};

export const mapCompanySourceToBillingDetailsValues = (
    source: CompanyFormSource
): BillingDetailsFormValues => {
    const companyObject =
        source && typeof source.company === 'object' && source.company !== null
            ? (source.company as Record<string, unknown>)
            : null;
    const legalProfile =
        companyObject && typeof companyObject.legal_profile === 'object' && companyObject.legal_profile !== null
            ? (companyObject.legal_profile as Record<string, unknown>)
            : source && typeof source.legal_profile === 'object' && source.legal_profile !== null
              ? (source.legal_profile as Record<string, unknown>)
              : null;

    return {
        legal_name: coerceString(
            resolveSourceValue(
                legalProfile,
                'legal_name'
            ) ?? resolveSourceValue(source, 'legal_name', 'company_name') ?? resolveSourceValue(companyObject, 'legal_name', 'name')
        ),
        commercial_name: coerceString(
            resolveSourceValue(
                legalProfile,
                'commercial_name'
            ) ?? resolveSourceValue(source, 'commercial_name') ?? resolveSourceValue(companyObject, 'commercial_name')
        ),
        registration_number: coerceString(
            resolveSourceValue(
                legalProfile,
                'registration_number'
            ) ?? resolveSourceValue(source, 'registration_number', 'trade_registry_number')
        ),
        tax_identification_number: coerceString(
            resolveSourceValue(
                legalProfile,
                'tax_identification_number'
            ) ?? resolveSourceValue(source, 'tax_identification_number', 'tax_id')
        ),
        vat_number: coerceString(
            resolveSourceValue(
                legalProfile,
                'vat_number'
            ) ?? resolveSourceValue(source, 'vat_number')
        ),
        is_vat_registered: coerceBoolean(
            resolveSourceValue(
                legalProfile,
                'is_vat_registered'
            ) ?? resolveSourceValue(source, 'is_vat_registered')
        ),
        country_code: coerceString(
            resolveSourceValue(
                legalProfile,
                'country_code'
            ) ?? resolveSourceValue(source, 'country_code', 'company_country')
        ),
        default_currency: coerceString(
            resolveSourceValue(
                legalProfile,
                'default_currency'
            ) ?? resolveSourceValue(source, 'default_currency', 'bank_currency')
        ),
        registered_address_line_1: coerceString(
            resolveSourceValue(
                legalProfile,
                'registered_address_line_1'
            ) ?? resolveSourceValue(source, 'registered_address_line_1', 'billing_address', 'company_address')
        ),
        registered_address_line_2: coerceString(
            resolveSourceValue(
                legalProfile,
                'registered_address_line_2'
            ) ?? resolveSourceValue(source, 'registered_address_line_2')
        ),
        registered_city: coerceString(
            resolveSourceValue(
                legalProfile,
                'registered_city'
            ) ?? resolveSourceValue(source, 'registered_city', 'billing_city', 'company_city')
        ),
        registered_state: coerceString(
            resolveSourceValue(
                legalProfile,
                'registered_state'
            ) ?? resolveSourceValue(source, 'registered_state', 'billing_state', 'company_county')
        ),
        registered_postal_code: coerceString(
            resolveSourceValue(
                legalProfile,
                'registered_postal_code'
            ) ?? resolveSourceValue(source, 'registered_postal_code', 'billing_postal_code', 'company_zip')
        ),
        authorized_signatory_title: coerceString(
            resolveSourceValue(
                legalProfile,
                'authorized_signatory_title'
            ) ?? resolveSourceValue(source, 'authorized_signatory_title')
        ),
    };
};

const trimToUndefined = (value: string | undefined) => {
    if (typeof value !== 'string') {
        return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
};

export type CompanyLegalProfilePayload = {
    legal_name?: string;
    commercial_name?: string;
    country_code?: string;
    registration_number?: string;
    tax_identification_number?: string;
    vat_number?: string;
    is_vat_registered?: boolean;
    default_currency?: string;
    registered_address_line_1?: string;
    registered_address_line_2?: string;
    registered_city?: string;
    registered_state?: string;
    registered_postal_code?: string;
    authorized_signatory_name?: string;
    authorized_signatory_title?: string;
    authorized_signatory_email?: string;
};

type CompanyLegalProfileBuildOptions = {
    fallbackCommercialName?: string;
    fallbackLegalName?: string;
    authorizedSignatoryName?: string;
    authorizedSignatoryEmail?: string;
    defaultCurrency?: string;
};

export const buildCompanyLegalProfilePayload = (
    values: BillingDetailsFormValues,
    options: CompanyLegalProfileBuildOptions = {}
): CompanyLegalProfilePayload => {
    const payload: CompanyLegalProfilePayload = {
        legal_name: trimToUndefined(values.legal_name) ?? trimToUndefined(options.fallbackLegalName),
        commercial_name:
            trimToUndefined(values.commercial_name) ?? trimToUndefined(options.fallbackCommercialName),
        country_code: trimToUndefined(values.country_code),
        registration_number: trimToUndefined(values.registration_number),
        tax_identification_number: trimToUndefined(values.tax_identification_number),
        vat_number: trimToUndefined(values.vat_number),
        is_vat_registered: Boolean(values.is_vat_registered),
        default_currency:
            trimToUndefined(values.default_currency) ?? trimToUndefined(options.defaultCurrency),
        registered_address_line_1: trimToUndefined(values.registered_address_line_1),
        registered_address_line_2: trimToUndefined(values.registered_address_line_2),
        registered_city: trimToUndefined(values.registered_city),
        registered_state: trimToUndefined(values.registered_state),
        registered_postal_code: trimToUndefined(values.registered_postal_code),
        authorized_signatory_name: trimToUndefined(options.authorizedSignatoryName),
        authorized_signatory_title: trimToUndefined(values.authorized_signatory_title),
        authorized_signatory_email: trimToUndefined(options.authorizedSignatoryEmail),
    };

    if (
        !payload.legal_name &&
        !payload.commercial_name &&
        !payload.tax_identification_number &&
        !payload.registration_number &&
        !payload.registered_address_line_1
    ) {
        return {};
    }

    if (!payload.legal_name && payload.commercial_name) {
        payload.legal_name = payload.commercial_name;
    }

    if (!payload.commercial_name && payload.legal_name) {
        payload.commercial_name = payload.legal_name;
    }

    return payload;
};

export const buildLegacyCompanyPayloadAliases = (payload: CompanyLegalProfilePayload) => ({
    company_name: payload.legal_name ?? payload.commercial_name,
    tax_id: payload.tax_identification_number,
    trade_registry_number: payload.registration_number,
    billing_address: payload.registered_address_line_1,
    billing_city: payload.registered_city,
    billing_state: payload.registered_state,
    billing_postal_code: payload.registered_postal_code,
    company_country: payload.country_code,
    company_county: payload.registered_state,
    company_city: payload.registered_city,
    company_zip: payload.registered_postal_code,
    company_address: payload.registered_address_line_1,
    bank_currency: payload.default_currency,
});
