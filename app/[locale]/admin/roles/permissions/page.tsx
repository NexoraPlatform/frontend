"use client";

import { useLocale } from '@/hooks/use-locale';
import PermissionMatrixTab from '../PermissionMatrixTab';

export default function PermissionsPage() {
    const locale = useLocale();
  return <PermissionMatrixTab locale={locale} />;
}
