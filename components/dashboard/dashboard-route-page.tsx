import DashboardClient, { type DashboardSection } from '@/app/[locale]/dashboard/dashboard-client';
import { TrustoraThemeStyles } from '@/components/trustora/theme-styles';

type DashboardRoutePageProps = {
  section: DashboardSection;
};

export function DashboardRoutePage({ section }: DashboardRoutePageProps) {
  return (
    <>
      <TrustoraThemeStyles />
      <DashboardClient section={section} />
    </>
  );
}
