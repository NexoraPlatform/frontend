import { NextResponse } from 'next/server';
import {
  getAllCountries,
  getCitiesOfState,
  getCountryByCode,
  getStatesOfCountry,
} from '@/lib/locations';

const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
};

const json = (payload: unknown, status = 200) =>
  NextResponse.json(payload, {
    status,
    headers: CACHE_HEADERS,
  });

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get('scope') ?? 'countries';

  if (scope === 'countries') {
    return json({ data: getAllCountries() });
  }

  if (scope === 'country') {
    const countryCode = searchParams.get('country');
    if (!countryCode) {
      return json({ message: 'Country code is required' }, 400);
    }

    const country = getCountryByCode(countryCode);
    if (!country) {
      return json({ message: 'Country not found' }, 404);
    }

    return json({ data: country });
  }

  if (scope === 'states') {
    const countryCode = searchParams.get('country');
    if (!countryCode) {
      return json({ message: 'Country code is required' }, 400);
    }

    return json({ data: getStatesOfCountry(countryCode) });
  }

  if (scope === 'cities') {
    const countryCode = searchParams.get('country');
    const stateCode = searchParams.get('state');

    if (!countryCode || !stateCode) {
      return json({ message: 'Country code and state code are required' }, 400);
    }

    return json({ data: getCitiesOfState(countryCode, stateCode) });
  }

  return json({ message: 'Unsupported locations scope' }, 400);
}
