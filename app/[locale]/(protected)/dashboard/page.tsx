import { generateSEO } from '@/lib/seo';
import { redirect } from 'next/navigation';

import { DashboardRoutePage } from '@/components/dashboard/dashboard-route-page';
import { getDashboardTabHref } from '@/lib/dashboard-navigation';

type DashboardPageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: DashboardPageProps) {
  const { locale } = await params;
  const isEnglish = locale?.toLowerCase().startsWith('en');

  return generateSEO({
    title: isEnglish ? 'Dashboard' : 'Panou de control',
    description: isEnglish
      ? 'Manage your account and services'
      : 'Administrează-ți contul și serviciile',
    locale,
    url: '/dashboard',
  });
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const resolvedSearchParams = await searchParams;
  const rawTab = Array.isArray(resolvedSearchParams.tab)
    ? resolvedSearchParams.tab[0]
    : resolvedSearchParams.tab;

  if (rawTab) {
    const normalizedTab = rawTab.trim().toLowerCase();
    const allowedTabs = new Set(['overview', 'projects', 'services', 'messages', 'finance', 'settings']);

    if (allowedTabs.has(normalizedTab) && normalizedTab !== 'overview') {
      const nextSearchParams = new URLSearchParams();

      for (const [key, value] of Object.entries(resolvedSearchParams)) {
        if (key === 'tab' || value == null) continue;

        if (Array.isArray(value)) {
          for (const item of value) {
            nextSearchParams.append(key, item);
          }
        } else {
          nextSearchParams.set(key, value);
        }
      }

      const nextHref = getDashboardTabHref(
        normalizedTab as 'projects' | 'services' | 'messages' | 'finance' | 'settings'
      );
      const query = nextSearchParams.toString();
      redirect(query ? `${nextHref}?${query}` : nextHref);
    }
  }

  return <DashboardRoutePage section="overview" />;
}
