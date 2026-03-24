import { City, Country, State } from 'country-state-city';
import { sortByName, toFlagEmoji } from '@/lib/location-utils';
import type { LocationCity, LocationCountry, LocationState } from '@/types/locations';

const countryCache = new Map<string, LocationCountry | null>();
const stateCache = new Map<string, LocationState[]>();
const cityCache = new Map<string, LocationCity[]>();

let allCountriesCache: LocationCountry[] | null = null;

const mapCountry = (country: {
  isoCode: string;
  name: string;
  flag?: string;
}): LocationCountry => ({
  isoCode: country.isoCode,
  name: country.name,
  flag: country.flag || toFlagEmoji(country.isoCode),
});

const mapState = (state: {
  isoCode: string;
  name: string;
  countryCode: string;
}): LocationState => ({
  isoCode: state.isoCode,
  name: state.name,
  countryCode: state.countryCode,
});

const mapCity = (city: {
  name: string;
  countryCode: string;
  stateCode: string;
}): LocationCity => ({
  name: city.name,
  countryCode: city.countryCode,
  stateCode: city.stateCode,
});

export const getAllCountries = () => {
  if (allCountriesCache) {
    return allCountriesCache;
  }

  allCountriesCache = Country.getAllCountries().map(mapCountry).sort(sortByName);
  allCountriesCache.forEach((country) => {
    countryCache.set(country.isoCode, country);
  });

  return allCountriesCache;
};

export const getCountryByCode = (countryCode?: string | null) => {
  const normalizedCountryCode = String(countryCode ?? '')
    .trim()
    .toUpperCase();

  if (!normalizedCountryCode) {
    return null;
  }

  if (countryCache.has(normalizedCountryCode)) {
    return countryCache.get(normalizedCountryCode) ?? null;
  }

  const country = Country.getCountryByCode(normalizedCountryCode);
  const mappedCountry = country ? mapCountry(country) : null;
  countryCache.set(normalizedCountryCode, mappedCountry);

  return mappedCountry;
};

export const getStatesOfCountry = (countryCode?: string | null) => {
  const normalizedCountryCode = String(countryCode ?? '')
    .trim()
    .toUpperCase();

  if (!normalizedCountryCode) {
    return [];
  }

  if (stateCache.has(normalizedCountryCode)) {
    return stateCache.get(normalizedCountryCode) ?? [];
  }

  const mappedStates = State.getStatesOfCountry(normalizedCountryCode)
    .map(mapState)
    .sort(sortByName);

  stateCache.set(normalizedCountryCode, mappedStates);
  return mappedStates;
};

export const getStateByCodeAndCountry = (stateCode?: string | null, countryCode?: string | null) => {
  const normalizedStateCode = String(stateCode ?? '')
    .trim()
    .toUpperCase();

  if (!normalizedStateCode) {
    return null;
  }

  return (
    getStatesOfCountry(countryCode).find((state) => state.isoCode === normalizedStateCode) ?? null
  );
};

export const getCitiesOfState = (countryCode?: string | null, stateCode?: string | null) => {
  const normalizedCountryCode = String(countryCode ?? '')
    .trim()
    .toUpperCase();
  const normalizedStateCode = String(stateCode ?? '')
    .trim()
    .toUpperCase();

  if (!normalizedCountryCode || !normalizedStateCode) {
    return [];
  }

  const cacheKey = `${normalizedCountryCode}:${normalizedStateCode}`;
  if (cityCache.has(cacheKey)) {
    return cityCache.get(cacheKey) ?? [];
  }

  const mappedCities = City.getCitiesOfState(normalizedCountryCode, normalizedStateCode)
    .map(mapCity)
    .sort(sortByName);

  cityCache.set(cacheKey, mappedCities);
  return mappedCities;
};
