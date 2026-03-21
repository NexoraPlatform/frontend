import { BASE_DASHBOARD_TABS } from './dashboard-tabs';

type DashboardNavigationTab = (typeof BASE_DASHBOARD_TABS)[number] | 'finance';

export const getDashboardHomeHref = () => '/dashboard';

export const getDashboardTabHref = (tab: DashboardNavigationTab) =>
  `/dashboard?tab=${tab}`;

export const getPrimaryDashboardTabHref = (isProvider: boolean) =>
  getDashboardTabHref(isProvider ? 'finance' : 'projects');

export const getSecondaryDashboardTabHref = (isProvider: boolean) =>
  getDashboardTabHref(isProvider ? 'projects' : 'services');

export const getProviderProfileHref = () => '/provider/profile';

export const getNewProjectHref = () => '/projects/new';
