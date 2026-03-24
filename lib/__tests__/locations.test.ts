import { describe, expect, it } from 'vitest';
import { resolveStateIsoFromOptions, toFlagEmoji } from '@/lib/location-utils';
import {
  getAllCountries,
  getCitiesOfState,
  getCountryByCode,
  getStateByCodeAndCountry,
  getStatesOfCountry,
} from '@/lib/locations';

describe('lib/locations', () => {
  it('returns normalized country data with emoji flags', () => {
    const romania = getCountryByCode('ro');

    expect(romania).toMatchObject({
      isoCode: 'RO',
      name: 'Romania',
      flag: '🇷🇴',
    });
  });

  it('returns a sorted country list', () => {
    const countries = getAllCountries();

    expect(countries.length).toBeGreaterThan(200);
    expect(countries[0].name.localeCompare(countries[1].name)).toBeLessThanOrEqual(0);
  });

  it('returns states and cities for a selected region', () => {
    const romaniaStates = getStatesOfCountry('RO');
    const bucharest = getStateByCodeAndCountry('B', 'RO');
    const bucharestCities = getCitiesOfState('RO', 'B');

    expect(romaniaStates.length).toBeGreaterThan(0);
    expect(bucharest).toMatchObject({ isoCode: 'B', countryCode: 'RO' });
    expect(bucharestCities.some((city) => city.name === 'Bucharest')).toBe(true);
  });
});

describe('lib/location-utils', () => {
  it('resolves state ISO codes from a known state name', () => {
    const states = getStatesOfCountry('RO');

    expect(resolveStateIsoFromOptions(states, 'Bucharest')).toBe('B');
  });

  it('creates emoji flags from ISO country codes', () => {
    expect(toFlagEmoji('ro')).toBe('🇷🇴');
    expect(toFlagEmoji('')).toBe('');
  });
});

