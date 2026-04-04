import { describe, expect, it } from 'vitest';

import { getServiceProviderCount, getServicesFromResponse } from '../server/public-listings';

describe('public services listings helpers', () => {
  it('normalizes services response with providers_count and no providers array', () => {
    const services = getServicesFromResponse({
      services: [
        {
          id: 10,
          name: 'Laravel Development',
          description: 'Build APIs',
          isFeatured: true,
          providers_count: 4,
          category: {
            id: 3,
            name: 'Backend',
          },
        },
      ],
      total: 1,
      page: 1,
      limit: 12,
      totalPages: 1,
    });

    expect(services).toHaveLength(1);
    expect(services[0]?.providers).toEqual([]);
    expect(services[0]?.providers_count).toBe(4);
    expect(getServiceProviderCount(services[0]!)).toBe(4);
  });

  it('falls back to providers array length when providers_count is missing', () => {
    const services = getServicesFromResponse([
      {
        id: 12,
        name: 'React Development',
        description: 'Frontend work',
        isFeatured: false,
        category: {
          id: 4,
          name: 'Frontend',
        },
        providers: [
          { id: 1, firstName: 'Ada', lastName: 'Lovelace', avatar: '', rating: '4.9' },
          { id: 2, firstName: 'Grace', lastName: 'Hopper', avatar: '', rating: '4.8' },
        ],
      },
    ]);

    expect(getServiceProviderCount(services[0]!)).toBe(2);
  });
});
