"use client";

import { usePathname } from 'next/navigation';
import PermissionMatrixTab from '../PermissionMatrixTab';
import { Locale } from '@/types/locale';

export default function PermissionsPage() {
  const pathname = usePathname();
  const locale = (pathname.split('/')[1] as Locale) || 'ro';
  return <PermissionMatrixTab locale={locale} />;
}
