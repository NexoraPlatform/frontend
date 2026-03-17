"use client";

import React, { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { CurrencySwitcher } from '@/components/CurrencySwitcher';
import { NotificationBell } from '@/components/notification-bell';
import { ChatButton } from '@/components/chat/chat-button';
import { useAuth } from '@/contexts/auth-context';
import {
  CheckCircle2,
  FileText,
  History,
  Layers,
  LayoutDashboard,
  Lock,
  MessageSquare,
  Moon,
  Plus,
  Settings,
  Sun,
  Users,
  Wallet,
} from 'lucide-react';

type ProviderDashboardShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  activeMenu?: 'overview' | 'projects' | 'services' | 'messages' | 'settings' | 'finance' | 'edit-profile';
};

type DashboardThemeVars = {
  '--bg-main': string;
  '--bg-card': string;
  '--text-main': string;
  '--text-muted': string;
  '--border-color': string;
  '--header-bg': string;
  '--input-bg': string;
  '--stat-bg': string;
};

const dashboardThemes: Record<'light' | 'dark', DashboardThemeVars> = {
  light: {
    '--bg-main': '#F5F7FA',
    '--bg-card': '#FFFFFF',
    '--text-main': '#0B1C2D',
    '--text-muted': '#64748B',
    '--border-color': 'rgba(226, 232, 240, 0.8)',
    '--header-bg': 'rgba(255, 255, 255, 0.8)',
    '--input-bg': '#F5F7FA',
    '--stat-bg': '#F5F7FA',
  },
  dark: {
    '--bg-main': '#06111A',
    '--bg-card': '#0D1F30',
    '--text-main': '#F8FAFC',
    '--text-muted': '#94A3B8',
    '--border-color': 'rgba(255, 255, 255, 0.08)',
    '--header-bg': 'rgba(13, 31, 48, 0.8)',
    '--input-bg': '#06111A',
    '--stat-bg': '#152A40',
  },
};

export function ProviderDashboardShell({
  title,
  description,
  children,
  activeMenu = 'services',
}: ProviderDashboardShellProps) {
  const { user } = useAuth();
  const t = useTranslations();
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const roleSlugs = useMemo(() => {
    const rolesList = (Array.isArray(user?.roles) ? user?.roles : []) as any[];
    const fromRoles = rolesList.map((role: any) => role?.slug).filter(Boolean);
    const fromRoleSlugs = (Array.isArray(user?.role_slugs) ? user?.role_slugs : []) as any[];
    const fromSingleRole = user?.role ? [user.role] : [];

    return Array.from(
      new Set(
        [...fromRoles, ...fromRoleSlugs, ...fromSingleRole]
          .filter(Boolean)
          .map((slug) => String(slug).toLowerCase())
      )
    );
  }, [user?.role, user?.role_slugs, user?.roles]);

  const isProvider = roleSlugs.includes('provider') || true;
  const isClient = roleSlugs.includes('client');
  const currentTheme = isDarkMode ? dashboardThemes.dark : dashboardThemes.light;
  const userInitials =
    `${(user?.firstName?.[0] ?? '')}${(user?.lastName?.[0] ?? '')}`.toUpperCase() || 'AC';
  const userDisplayName =
    `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || user?.email || 'Trustora';
  const userAvatarSrc = user?.avatar ?? user?.profile_photo_url ?? user?.avatar_url ?? undefined;
  const servicesTitle = isProvider
    ? t('dashboard.services.title.provider')
    : t('dashboard.services.title.client');

  const sidebarItemClass = (item: string) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors w-full text-left ${
      activeMenu === item
        ? 'bg-[#1BC47D]/10 text-[#1BC47D] border border-[#1BC47D]/20'
        : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`;

  return (
    <div
      className="flex h-screen w-full overflow-hidden font-sans transition-colors duration-300"
      style={{ ...currentTheme, backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}
    >
      <aside className="z-20 hidden w-64 shrink-0 flex-col justify-between border-r border-[#152B42] bg-[#0B1C2D] md:flex">
        <div>
          <div className="flex h-20 items-center border-b border-white/5 px-6">
            <div className="flex items-center gap-3">
              <img src="/trustora-logo2.png" alt="Trustora Logo" className="h-8 w-8 object-contain" />
              <div className="flex flex-col">
                <span className="leading-none text-lg font-bold tracking-tight text-white">TRUSTORA</span>
                <span className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.2em] text-[#1BC47D]">
                  {t('dashboard.hero.badge')}
                </span>
              </div>
            </div>
          </div>

          <nav className="space-y-1 p-4">
            <p className="mb-3 mt-4 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {t('dashboard.quick_actions.title')}
            </p>

            <button type="button" onClick={() => router.push('/dashboard?tab=overview')} className={sidebarItemClass('overview')}>
              <LayoutDashboard size={18} />
              {t('dashboard.tabs.overview')}
            </button>
            {isClient && !isProvider ? (
              <button
                type="button"
                onClick={() => router.push('/projects/new')}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                <Plus size={18} />
                {t('dashboard.projects.new_project')}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => router.push(`/dashboard?tab=${isProvider ? 'finance' : 'projects'}`)}
              className={sidebarItemClass(isProvider ? 'finance' : 'projects')}
            >
              <Lock size={18} />
              {isProvider ? t('dashboard.tabs.finance') : t('dashboard.tabs.projects')}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/dashboard?tab=${isProvider ? 'projects' : 'services'}`)}
              className={sidebarItemClass(isProvider ? 'projects' : 'services')}
            >
              <Layers size={18} />
              {isProvider ? t('dashboard.tabs.projects') : t('dashboard.tabs.services')}
            </button>
            <button type="button" onClick={() => router.push('/dashboard?tab=messages')} className={sidebarItemClass('messages')}>
              <History size={18} />
              {t('dashboard.tabs.messages')}
            </button>
            {isProvider ? (
              <button
                type="button"
                onClick={() => router.push('/provider/profile')}
                className={sidebarItemClass('edit-profile')}
              >
                <FileText size={18} />
                {t('navigation.edit_profile')}
              </button>
            ) : null}

            {isProvider ? (
              <>
                <p className="mb-3 mt-8 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {servicesTitle}
                </p>
                <button type="button" onClick={() => router.push('/dashboard?tab=services')} className={sidebarItemClass('services')}>
                  <Users size={18} />
                  {t('dashboard.tabs.services')}
                </button>
              </>
            ) : null}
          </nav>
        </div>

        <div className="border-t border-white/5 p-4">
          <button
            type="button"
            onClick={() => router.push('/dashboard?tab=settings')}
            className={`${sidebarItemClass('settings')} mb-2`}
          >
            <Settings size={18} />
            {t('dashboard.tabs.settings')}
          </button>
          <div className="mt-2 flex items-center gap-3 rounded-xl border border-white/5 bg-[#152B42] px-3 py-2">
            <div className="relative">
              <Avatar className="h-8 w-8 border border-white/10">
                <AvatarImage src={userAvatarSrc} alt={userDisplayName} />
                <AvatarFallback className="bg-gradient-to-tr from-[#1BC47D] to-[#0B1C2D] text-xs font-bold text-white">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#152B42] bg-[#1BC47D]" />
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-sm font-bold text-white">{userDisplayName}</p>
              <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-[#1BC47D]">
                <CheckCircle2 size={10} />
                {isProvider ? t('dashboard.hero.role.provider') : t('dashboard.hero.role.client')}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <main className="relative flex h-full flex-1 flex-col overflow-hidden transition-colors duration-300">
        <header
          className="z-10 shrink-0 border-b px-4 py-4 backdrop-blur-md md:px-8"
          style={{ backgroundColor: 'var(--header-bg)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
              <p className="mt-1 text-sm md:text-base" style={{ color: 'var(--text-muted)' }}>
                {description}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <div className="hidden items-center gap-2 sm:flex">
                <div
                  className="rounded-lg border"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--input-bg)' }}
                >
                  <LocaleSwitcher className="h-9 rounded-lg px-2" />
                </div>
                <div
                  className="rounded-lg border"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--input-bg)' }}
                >
                  <CurrencySwitcher className="h-9 rounded-lg px-2 text-sm font-semibold" />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDarkMode((prev) => !prev)}
                className="relative transition-colors hover:text-[var(--text-main)]"
                style={{ color: 'var(--text-muted)' }}
                title="Toggle Light/Dark Mode"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <div className="relative">
                <NotificationBell />
              </div>
              <div className="relative">
                <ChatButton />
              </div>

              <div
                className="hidden h-6 w-px transition-colors duration-300 md:block"
                style={{ backgroundColor: 'var(--border-color)' }}
              />

              <Button
                type="button"
                onClick={() => router.push(`/dashboard?tab=${isProvider ? 'finance' : 'projects'}`)}
                className="flex items-center gap-2 rounded-lg bg-[#1BC47D] px-5 py-2 text-sm font-semibold text-white shadow-md shadow-[#1BC47D]/20 transition-all hover:bg-[#18A96B]"
              >
                {isProvider ? <Wallet size={16} /> : <MessageSquare size={16} />}
                {isProvider ? t('dashboard.tabs.finance') : t('dashboard.tabs.projects')}
              </Button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div
            className="pointer-events-none absolute inset-0 z-0 opacity-[0.02]"
            style={{
              backgroundImage: 'radial-gradient(var(--text-main) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />

          <div className="relative z-10 mx-auto max-w-6xl">
            <div
              className="mb-6 rounded-xl border p-3 md:hidden"
              style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Navigare rapidă
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => router.push('/dashboard?tab=overview')}>
                  Dashboard
                </Button>
                <Button size="sm" variant="outline" onClick={() => router.push('/dashboard?tab=projects')}>
                  Proiecte
                </Button>
                <Button size="sm" variant="outline" onClick={() => router.push('/dashboard?tab=services')}>
                  Servicii
                </Button>
              </div>
            </div>

            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
