"use client";

import { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { usePathname } from 'next/navigation';
import RolesListClient from './roles-list-client';
import { Locale } from '@/types/locale';
import { useAsyncTranslation } from '@/hooks/use-async-translation';

const PermissionMatrix = dynamic(() => import('./PermissionMatrixTab'), { ssr: false });

export default function RolesPage() {
  const [tab, setTab] = useState<'roles' | 'permissions'>('roles');
  const pathname = usePathname();
  const locale = (pathname.split('/')[1] as Locale) || 'ro';
  const rolesLabel = useAsyncTranslation(locale, 'admin.roles.tabs.roles');
  const permissionsLabel = useAsyncTranslation(locale, 'admin.roles.tabs.permissions');
  const loadingPermissions = useAsyncTranslation(locale, 'admin.roles.permissions_tab_loading');

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <div className="mb-6 flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="roles">{rolesLabel}</TabsTrigger>
            <TabsTrigger value="permissions">{permissionsLabel}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="roles">
          <RolesListClient locale={locale} />
        </TabsContent>

        <TabsContent value="permissions">
          {tab === 'permissions' ? (
            <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">{loadingPermissions}</div>}>
              <PermissionMatrix locale={locale} />
            </Suspense>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
