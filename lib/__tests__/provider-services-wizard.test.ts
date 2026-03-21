import { describe, expect, it } from 'vitest';
import {
  PROVIDER_SERVICES_LEVELS_STORAGE_PREFIX,
  PROVIDER_SERVICES_SELECT_STORAGE_KEY,
  PROVIDER_SERVICES_TESTS_STORAGE_PREFIX,
  buildProviderServicesSelectParamsAfterReset,
  getProviderServicesLevelsHref,
  getProviderServicesSelectHref,
  getProviderServicesTestsHref,
  getProviderServicesWizardStorageKeysToClear,
  shouldResetProviderServicesWizard,
} from '../provider-services-wizard';

describe('lib/provider-services-wizard', () => {
  it('returns the canonical wizard entry hrefs', () => {
    expect(getProviderServicesSelectHref()).toBe('/provider/services/select');
    expect(getProviderServicesSelectHref({ reset: true })).toBe(
      '/provider/services/select?reset=1'
    );
    expect(getProviderServicesLevelsHref('7')).toBe(
      '/provider/services/levels?services=7'
    );
    expect(getProviderServicesTestsHref('%5B%7B%22id%22%3A1%7D%5D')).toBe(
      '/provider/services/tests?data=%5B%7B%22id%22%3A1%7D%5D'
    );
  });

  it('detects when a fresh wizard reset was requested', () => {
    expect(shouldResetProviderServicesWizard('reset=1')).toBe(true);
    expect(shouldResetProviderServicesWizard('foo=bar')).toBe(false);
  });

  it('removes only the reset flag from the select page query params', () => {
    const nextParams = buildProviderServicesSelectParamsAfterReset(
      'reset=1&foo=bar'
    );

    expect(nextParams.has('reset')).toBe(false);
    expect(nextParams.get('foo')).toBe('bar');
  });

  it('returns only the wizard-related storage keys that should be cleared', () => {
    expect(
      getProviderServicesWizardStorageKeysToClear([
        PROVIDER_SERVICES_SELECT_STORAGE_KEY,
        `${PROVIDER_SERVICES_LEVELS_STORAGE_PREFIX}7`,
        `${PROVIDER_SERVICES_TESTS_STORAGE_PREFIX}abc`,
        'unrelated-key',
      ])
    ).toEqual([
      PROVIDER_SERVICES_SELECT_STORAGE_KEY,
      `${PROVIDER_SERVICES_LEVELS_STORAGE_PREFIX}7`,
      `${PROVIDER_SERVICES_TESTS_STORAGE_PREFIX}abc`,
    ]);
  });
});
