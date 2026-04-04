import { describe, expect, it } from 'vitest';

import { mapProviderResource } from '@/types/ai-search';

describe('mapProviderResource', () => {
  it('keeps featured badges when they are available in the provider payload', () => {
    const result = mapProviderResource({
      id: 15,
      firstName: 'Ada',
      lastName: 'Lovelace',
      featured_badges: [
        {
          id: 501,
          badge: {
            id: 91,
            code: 'provider_trusted',
            name: 'Trusted Provider',
            reward_config: {},
          },
        },
      ],
    });

    expect(result.featuredBadges).toHaveLength(1);
    expect(result.featuredBadges[0]?.badge?.code).toBe('provider_trusted');
  });
});
