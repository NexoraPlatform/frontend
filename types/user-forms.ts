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

const billingDetailsEntries = {
    company_name: optionalBillingStringSchema,
    tax_id: optionalBillingStringSchema,
    trade_registry_number: optionalBillingStringSchema,
    billing_address: optionalBillingStringSchema,
    billing_city: optionalBillingStringSchema,
    billing_state: optionalBillingStringSchema,
    billing_postal_code: optionalBillingStringSchema,
};

const billingDetailsBaseSchema = v.object(billingDetailsEntries);

export const billingDetailsSchema = v.pipe(
    billingDetailsBaseSchema,
    v.forward(
        v.check(
            (data) => !data.company_name || Boolean(data.tax_id),
            'Tax ID is required when company name is provided',
        ),
        ['tax_id'],
    ),
    v.forward(
        v.check(
            (data) => !data.company_name || Boolean(data.billing_address),
            'Billing address is required when company name is provided',
        ),
        ['billing_address'],
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
            (data) => !data.company_name || Boolean(data.tax_id),
            'Tax ID is required when company name is provided',
        ),
        ['tax_id'],
    ),
    v.forward(
        v.check(
            (data) => !data.company_name || Boolean(data.billing_address),
            'Billing address is required when company name is provided',
        ),
        ['billing_address'],
    ),
);

export type UserFormValues = v.InferOutput<typeof userSchema>;

export type BillingDetailsFormValues = v.InferOutput<
    typeof billingDetailsSchema
>;
