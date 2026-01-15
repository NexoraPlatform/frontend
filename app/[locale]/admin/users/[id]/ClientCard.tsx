import React from "react";
import { useLocale } from '@/hooks/use-locale';
import { useAsyncTranslation } from '@/hooks/use-async-translation';

export default function ClientCard({
                                       formData,
                                       setFormDataAction,
                                       permissions,
                                       submitAction,      // <- submit comes from parent
                                       loading = false,   // <- UI state from parent
                                       error = '',
                                   }: {
    formData: any;
    setFormDataAction: React.Dispatch<React.SetStateAction<any>>;
    permissions: any[];
    submitAction: (e: React.FormEvent) => Promise<void>;
    loading?: boolean;
    error?: string;
}) {
    const locale = useLocale();
    const title = useAsyncTranslation(locale, 'admin.users.detail_card.client_title');
    const idLabel = useAsyncTranslation(locale, 'admin.users.detail_card.id');
    const nameLabel = useAsyncTranslation(locale, 'admin.users.detail_card.name');
    const emailLabel = useAsyncTranslation(locale, 'admin.users.detail_card.email');
    const roleLabel = useAsyncTranslation(locale, 'admin.users.detail_card.role');
    const phoneLabel = useAsyncTranslation(locale, 'admin.users.detail_card.phone');

    return (
        <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">{title}</h2>
            <p><strong>{idLabel}</strong> {formData.id}</p>
            <p><strong>{nameLabel}</strong> {formData.firstName} {formData.lastName}</p>
            <p><strong>{emailLabel}</strong> {formData.email}</p>
            <p><strong>{roleLabel}</strong> {formData.role}</p>
            <p><strong>{phoneLabel}</strong> {formData.phone}</p>
        </div>
    );
}
