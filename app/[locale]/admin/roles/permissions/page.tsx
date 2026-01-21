"use client";

import { useLocale } from 'next-intl';
import PermissionMatrixTab from '../PermissionMatrixTab';
import { Locale } from '@/types/locale';

export default function PermissionsPage() {
  const locale = useLocale() as Locale;
  return <PermissionMatrixTab locale={locale} />;
}
