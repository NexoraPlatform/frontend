import { describe, expect, it } from 'vitest';
import { GET } from '@/app/api/locations/route';

describe('app/api/locations route', () => {
  it('returns the countries dataset with cache headers', async () => {
    const response = await GET(new Request('http://localhost/api/locations?scope=countries'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('max-age=86400');
    expect(Array.isArray(payload.data)).toBe(true);
    expect(payload.data.some((country: { isoCode: string }) => country.isoCode === 'RO')).toBe(true);
  });

  it('validates required params for state queries', async () => {
    const response = await GET(new Request('http://localhost/api/locations?scope=states'));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ message: 'Country code is required' });
  });

  it('returns cities for a valid state query', async () => {
    const response = await GET(
      new Request('http://localhost/api/locations?scope=cities&country=RO&state=B')
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(payload.data)).toBe(true);
    expect(payload.data.some((city: { name: string }) => city.name === 'Bucharest')).toBe(true);
  });
});
