import React from "react";
import { useTranslations } from 'next-intl';

export default function ProviderCard({
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
  const t = useTranslations();
    const title = t('admin.users.detail_card.provider_title');
    const idLabel = t('admin.users.detail_card.id');
    const nameLabel = t('admin.users.detail_card.name');
    const emailLabel = t('admin.users.detail_card.email');
    const roleLabel = t('admin.users.detail_card.role');
    const phoneLabel = t('admin.users.detail_card.phone');

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
