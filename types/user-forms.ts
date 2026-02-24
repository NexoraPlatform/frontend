// types/user-forms.ts
import { z } from 'zod';
import type { ConnectedAccount } from '@/types/auth';

const emptyToUndefined = (value: unknown) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value;

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

const billingDetailsBaseSchema = z.object({
    company_name: z.preprocess(emptyToUndefined, z.string().optional()),
    tax_id: z.preprocess(emptyToUndefined, z.string().optional()),
    trade_registry_number: z.preprocess(emptyToUndefined, z.string().optional()),
    billing_address: z.preprocess(emptyToUndefined, z.string().optional()),
    billing_city: z.preprocess(emptyToUndefined, z.string().optional()),
    billing_state: z.preprocess(emptyToUndefined, z.string().optional()),
    billing_postal_code: z.preprocess(emptyToUndefined, z.string().optional()),
});

const billingDetailsRefinement = (data: {
    company_name?: string;
    tax_id?: string;
    billing_address?: string;
}, ctx: z.RefinementCtx) => {
    if (data.company_name) {
        if (!data.tax_id) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['tax_id'],
                message: 'Tax ID is required when company name is provided',
            });
        }
        if (!data.billing_address) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['billing_address'],
                message: 'Billing address is required when company name is provided',
            });
        }
    }
};

export const billingDetailsSchema = billingDetailsBaseSchema.superRefine(
    billingDetailsRefinement,
);

export const userSchema = z
    .object({
        firstName: z.string().min(1, 'First name is required'),
        lastName: z.string().min(1, 'Last name is required'),
        email: z.string().email('Valid email is required'),
        role: z.enum(['ADMIN', 'PROVIDER', 'CLIENT']),
        phone: z.string().min(1, 'Phone number is required'),
        password: z.string().optional(),
        confirm_password: z.string().optional(),
    })
    .merge(billingDetailsBaseSchema)
    .superRefine(billingDetailsRefinement);

export type UserFormValues = z.infer<typeof userSchema>;

export type BillingDetailsFormValues = z.infer<typeof billingDetailsSchema>;
