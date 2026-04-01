import { describe, expect, it } from 'vitest';

import { normalizeAuthUser } from '@/lib/auth/user';

describe('normalizeAuthUser badge data', () => {
  it('normalizes badge counts and featured badges from auth payloads', () => {
    const result = normalizeAuthUser({
      id: 77,
      email: 'ada@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      badge_counts: {
        awarded: 3,
        in_progress: 1,
      },
      featured_badges: [
        {
          id: 501,
          status: 'awarded',
          badge: {
            id: 91,
            code: 'provider_trusted',
            name: 'Trusted Provider',
            reward_config: {},
          },
        },
      ],
    });

    expect(result?.badge_counts).toEqual({
      awarded: 3,
      in_progress: 1,
    });
    expect(result?.featured_badges?.[0]).toMatchObject({
      id: 501,
      badge: {
        code: 'provider_trusted',
        name: 'Trusted Provider',
      },
    });
  });
});
