import DashboardClient from './dashboard-client';
import { generateSEO } from '@/lib/seo';
import { TrustoraThemeStyles } from '@/components/trustora/theme-styles';

type DashboardPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({ params }: DashboardPageProps) {
  const { locale } = await params;
  const isEnglish = locale?.toLowerCase().startsWith('en');

  return generateSEO({
    title: isEnglish ? 'Dashboard' : 'Panou de control',
    description: isEnglish
      ? 'Manage your account and services'
      : 'Administrează-ți contul și serviciile',
    url: '/dashboard',
  });
}

export default function DashboardPage() {
  return (
      <>
        <TrustoraThemeStyles />
        <DashboardClient />
      </>
  );
}
