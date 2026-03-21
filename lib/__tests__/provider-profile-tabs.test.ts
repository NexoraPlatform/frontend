import { describe, expect, it } from 'vitest';
import {
  PROVIDER_PROFILE_TABS,
  buildProviderProfileSearchParams,
  getDefaultProviderProfileTab,
  resolveProviderProfileTab,
} from '../provider-profile-tabs';

describe('lib/provider-profile-tabs', () => {
  it('returns the provider profile tabs in a stable order', () => {
    expect(PROVIDER_PROFILE_TABS).toEqual([
      'basic',
      'availability',
      'languages',
      'experience',
      'education',
      'portfolio',
    ]);
  });

  it('uses basic as the default provider profile tab', () => {
    expect(getDefaultProviderProfileTab()).toBe('basic');
  });

  it('returns the section from the URL when it is valid', () => {
    expect(resolveProviderProfileTab('availability')).toBe('availability');
    expect(resolveProviderProfileTab(' portfolio ')).toBe('portfolio');
  });

  it('falls back to the default tab when the URL section is missing or invalid', () => {
    expect(resolveProviderProfileTab(null)).toBe('basic');
    expect(resolveProviderProfileTab(undefined)).toBe('basic');
    expect(resolveProviderProfileTab('')).toBe('basic');
    expect(resolveProviderProfileTab('billing')).toBe('basic');
  });

  it('keeps the section query for non-default tabs while preserving other params', () => {
    const nextParams = buildProviderProfileSearchParams(
      'section=basic&foo=bar',
      'availability'
    );

    expect(nextParams.get('section')).toBe('availability');
    expect(nextParams.get('foo')).toBe('bar');
  });

  it('removes the section query for the default tab while preserving other params', () => {
    const nextParams = buildProviderProfileSearchParams(
      'section=portfolio&foo=bar',
      'basic'
    );

    expect(nextParams.has('section')).toBe(false);
    expect(nextParams.get('foo')).toBe('bar');
  });
});
