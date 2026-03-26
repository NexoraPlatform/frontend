export const BASE_DASHBOARD_TABS = [
  'overview',
  'projects',
  'services',
  'messages',
  'settings',
] as const;

const PROJECT_SCOPED_QUERY_PARAMS = ['projectId', 'activeMilestoneId'] as const;

export const getAvailableDashboardTabs = ({
  hasRoleInfo: _hasRoleInfo,
  isProvider: _isProvider,
}: {
  hasRoleInfo: boolean;
  isProvider: boolean;
}) => [...BASE_DASHBOARD_TABS];

export const getDefaultDashboardTab = (availableTabs: readonly string[]) =>
  availableTabs[0] ?? 'overview';

export const hasProjectScopedDashboardParams = (
  searchParams: URLSearchParams | string
) => {
  const params =
    typeof searchParams === 'string'
      ? new URLSearchParams(searchParams)
      : new URLSearchParams(searchParams.toString());

  return PROJECT_SCOPED_QUERY_PARAMS.some((param) => {
    const value = params.get(param);
    return typeof value === 'string' && value.length > 0;
  });
};

export const buildDashboardSearchParams = (
  searchParams: URLSearchParams | string,
  nextTab: string,
  defaultTab = 'overview'
) => {
  const params =
    typeof searchParams === 'string'
      ? new URLSearchParams(searchParams)
      : new URLSearchParams(searchParams.toString());

  if (nextTab !== 'projects') {
    PROJECT_SCOPED_QUERY_PARAMS.forEach((param) => {
      params.delete(param);
    });
  }

  if (nextTab === defaultTab) {
    params.delete('tab');
  } else {
    params.set('tab', nextTab);
  }

  return params;
};

export const resolveInitialDashboardTab = (
  tabParam: string | null | undefined,
  defaultTab = 'overview'
) => {
  if (typeof tabParam !== 'string') {
    return defaultTab;
  }

  const normalizedTab = tabParam.trim();
  return normalizedTab.length > 0 ? normalizedTab : defaultTab;
};

export const resolveDashboardTab = (
  tabParam: string | null | undefined,
  availableTabs: readonly string[],
  defaultTab = 'overview'
) => {
  const initialTab = resolveInitialDashboardTab(tabParam, defaultTab);
  return availableTabs.includes(initialTab) ? initialTab : defaultTab;
};
