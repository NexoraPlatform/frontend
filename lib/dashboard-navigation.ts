import { BASE_DASHBOARD_TABS } from './dashboard-tabs';

type DashboardNavigationTab = (typeof BASE_DASHBOARD_TABS)[number] | 'finance';

const DASHBOARD_SECTION_PATHS: Record<DashboardNavigationTab, string> = {
  overview: '/dashboard',
  projects: '/dashboard/projects',
  services: '/dashboard/services',
  messages: '/dashboard/messages',
  settings: '/dashboard/settings',
  finance: '/dashboard/finance',
};

export const getDashboardHomeHref = () => '/dashboard';

export const getDashboardTabHref = (tab: DashboardNavigationTab) =>
  DASHBOARD_SECTION_PATHS[tab];

export const getPrimaryDashboardTabHref = (isProvider: boolean) =>
  getDashboardTabHref(isProvider ? 'finance' : 'projects');

export const getSecondaryDashboardTabHref = (isProvider: boolean) =>
  getDashboardTabHref(isProvider ? 'projects' : 'services');

export const getProviderProfileHref = () => '/provider/profile';

export const getNewProjectHref = () => '/projects/new';
