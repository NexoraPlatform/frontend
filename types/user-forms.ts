// types/user-forms.ts
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
    location?: string;
    avatar?: string;
    confirm_password?: string;
    user_permissions?: Record<
        string,
        { id: number; name: string; allowed: boolean }
    > | Array<any>; // lista din backend la load
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
