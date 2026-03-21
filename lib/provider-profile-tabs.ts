export const PROVIDER_PROFILE_TABS = [
  'basic',
  'availability',
  'languages',
  'experience',
  'education',
  'portfolio',
] as const;

export type ProviderProfileTab = (typeof PROVIDER_PROFILE_TABS)[number];

export const getDefaultProviderProfileTab = (): ProviderProfileTab => 'basic';

export const resolveProviderProfileTab = (
  sectionParam: string | null | undefined,
  defaultTab: ProviderProfileTab = getDefaultProviderProfileTab()
): ProviderProfileTab => {
  if (typeof sectionParam !== 'string') {
    return defaultTab;
  }

  const normalizedSection = sectionParam.trim();
  if (!normalizedSection) {
    return defaultTab;
  }

  return PROVIDER_PROFILE_TABS.includes(normalizedSection as ProviderProfileTab)
    ? (normalizedSection as ProviderProfileTab)
    : defaultTab;
};

export const buildProviderProfileSearchParams = (
  searchParams: URLSearchParams | string,
  nextTab: ProviderProfileTab,
  defaultTab: ProviderProfileTab = getDefaultProviderProfileTab()
) => {
  const params =
    typeof searchParams === 'string'
      ? new URLSearchParams(searchParams)
      : new URLSearchParams(searchParams.toString());

  if (nextTab === defaultTab) {
    params.delete('section');
  } else {
    params.set('section', nextTab);
  }

  return params;
};
