import { BASE_DASHBOARD_TABS } from './dashboard-tabs';

type DashboardNavigationTab = (typeof BASE_DASHBOARD_TABS)[number];

const DASHBOARD_SECTION_PATHS: Record<DashboardNavigationTab, string> = {
  overview: '/dashboard',
  projects: '/dashboard/projects',
  services: '/dashboard/services',
  messages: '/dashboard/messages',
  settings: '/dashboard/settings',
};

export const getDashboardHomeHref = () => '/dashboard';

export const getDashboardTabHref = (tab: DashboardNavigationTab) =>
  DASHBOARD_SECTION_PATHS[tab];

export const getPrimaryDashboardTabHref = (_isProvider: boolean) =>
  getDashboardTabHref('projects');

export const getSecondaryDashboardTabHref = (_isProvider: boolean) =>
  getDashboardTabHref('services');

export const getProviderProfileHref = () => '/provider/profile';

export const getNewProjectHref = () => '/projects/new';
