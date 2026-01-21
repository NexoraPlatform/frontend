"use client";

import { useLocale } from 'next-intl';
import PermissionMatrixTab from '../PermissionMatrixTab';

export default function PermissionsPage() {
    const locale = useLocale();
  return <PermissionMatrixTab locale={locale} />;
}
