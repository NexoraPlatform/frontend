"use client";

import { useLocale } from 'next-intl';
import type { Locale } from '@/types/locale';
import PermissionMatrixTab from '../PermissionMatrixTab';

export default function PermissionsPage() {
    const locale = useLocale() as Locale;
    return <PermissionMatrixTab locale={locale} />;
}
