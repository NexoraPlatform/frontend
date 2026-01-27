"use client";

import { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Link } from '@/lib/navigation';
import { ArrowLeft, Plus } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@/types/locale';
import RolesListClient from './roles-list-client';

const PermissionMatrix = dynamic(() => import('./PermissionMatrixTab'), { ssr: false });

export default function RolesPage() {
  const [tab, setTab] = useState<'roles' | 'permissions'>('roles');
    const locale = useLocale() as Locale;
  const t = useTranslations();
  const rolesLabel = t('admin.roles.tabs.roles');
  const permissionsLabel = t('admin.roles.tabs.permissions');
  const loadingPermissions = t('admin.roles.permissions_tab_loading');
  const manageTitle = t('admin.roles.manage_title');
  const manageSubtitle = t('admin.roles.manage_subtitle');
  const addRole = t('admin.roles.add_role');
  const permissionTitle = t('admin.roles.permission_matrix.title');
  const permissionSubtitle = t('admin.roles.permission_matrix.subtitle');

  const headerTitle = tab === 'roles' ? manageTitle : permissionTitle;
  const headerSubtitle = tab === 'roles' ? manageSubtitle : permissionSubtitle;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      <div className="relative mb-10 overflow-hidden rounded-3xl border border-border/60 bg-card/70 p-6 shadow-[0_20px_80px_-60px_rgba(15,23,42,0.4)] backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/60 dark:shadow-[0_20px_80px_-40px_rgba(15,23,42,0.9)] sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_rgba(255,255,255,0)_60%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_rgba(15,23,42,0)_60%)]" />
        <div className="relative flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/admin">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 rounded-full border border-border/60 bg-white/80 text-slate-900 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-500/40 hover:bg-sky-500/10 hover:text-sky-700 dark:border-slate-800/70 dark:bg-slate-950/70 dark:text-slate-100 dark:hover:border-sky-500/50 dark:hover:bg-sky-500/10 dark:hover:text-sky-200"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Trustora Admin
              </span>
            </div>
            {tab === 'roles' && (
              <Link href="/admin/roles/new">
                <Button className="shadow-sm">
                  <Plus className="mr-2 h-4 w-4" />
                  {addRole}
                </Button>
              </Link>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">{headerTitle}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              {headerSubtitle}
            </p>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <TabsList className="rounded-full border border-border/60 bg-background/60 p-1 shadow-sm dark:border-slate-800/70 dark:bg-slate-950/60">
            <TabsTrigger value="roles" className="rounded-full px-4">
              {rolesLabel}
            </TabsTrigger>
            <TabsTrigger value="permissions" className="rounded-full px-4">
              {permissionsLabel}
            </TabsTrigger>
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
