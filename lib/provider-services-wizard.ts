export const PROVIDER_SERVICES_SELECT_STORAGE_KEY = 'provider-services-select';
export const PROVIDER_SERVICES_LEVELS_STORAGE_PREFIX = 'provider-services-levels:';
export const PROVIDER_SERVICES_TESTS_STORAGE_PREFIX = 'provider-services-tests:';

export const getProviderServicesSelectHref = ({
  reset = false,
}: {
  reset?: boolean;
} = {}) => (reset ? '/provider/services/select?reset=1' : '/provider/services/select');

export const getProviderServicesLevelsHref = (servicesParam: string) =>
  `/provider/services/levels?services=${servicesParam}`;

export const getProviderServicesTestsHref = (testDataParam: string) =>
  `/provider/services/tests?data=${testDataParam}`;

export const shouldResetProviderServicesWizard = (
  searchParams: URLSearchParams | string
) => {
  const params =
    typeof searchParams === 'string'
      ? new URLSearchParams(searchParams)
      : new URLSearchParams(searchParams.toString());

  return params.get('reset') === '1';
};

export const buildProviderServicesSelectParamsAfterReset = (
  searchParams: URLSearchParams | string
) => {
  const params =
    typeof searchParams === 'string'
      ? new URLSearchParams(searchParams)
      : new URLSearchParams(searchParams.toString());

  params.delete('reset');
  return params;
};

export const getProviderServicesWizardStorageKeysToClear = (
  storageKeys: string[]
) => {
  const keysToClear = new Set<string>();

  storageKeys.forEach((key) => {
    if (
      key === PROVIDER_SERVICES_SELECT_STORAGE_KEY ||
      key.startsWith(PROVIDER_SERVICES_LEVELS_STORAGE_PREFIX) ||
      key.startsWith(PROVIDER_SERVICES_TESTS_STORAGE_PREFIX)
    ) {
      keysToClear.add(key);
    }
  });

  return [...keysToClear];
};
