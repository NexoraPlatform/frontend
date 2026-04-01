import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import ProviderCard from '@/app/[locale]/(public)/projects/provider-card';

const pushMock = vi.fn();
const usePublicUserFeaturedBadgesMock = vi.fn();

vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} alt={props.alt} />,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    if (key === 'projects.provider_card.avatar_alt') {
      return `Provider image ${values?.firstName} ${values?.lastName}`;
    }

    if (key === 'projects.provider_card.more_badges') {
      return `+${values?.count} badges`;
    }

    const dictionary: Record<string, string> = {
      'projects.provider_card.location_fallback': 'Romania',
      'projects.provider_card.badges_label': 'Verified badge',
      'projects.provider_card.badges_loading': 'Loading badges...',
    };

    return dictionary[key] ?? key;
  },
}));

vi.mock('@/lib/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock('@/hooks/use-api', () => ({
  usePublicUserFeaturedBadges: (...args: unknown[]) => usePublicUserFeaturedBadgesMock(...args),
}));

describe('ProviderCard badges', () => {
  beforeEach(() => {
    pushMock.mockReset();
    usePublicUserFeaturedBadgesMock.mockReset();
  });

  it('renders featured badges from the public endpoint fallback and navigates to the profile', () => {
    usePublicUserFeaturedBadgesMock.mockReturnValue({
      data: [
        {
          id: 1,
          badge: {
            id: 101,
            code: 'provider_trusted',
            name: 'Trusted Provider',
            reward_config: {},
          },
        },
        {
          id: 2,
          badge: {
            id: 102,
            code: 'provider_fast_responder',
            name: 'Fast Responder',
            reward_config: {},
          },
        },
        {
          id: 3,
          badge: {
            id: 103,
            code: 'provider_milestone_expert',
            name: 'Milestone Expert',
            reward_config: {},
          },
        },
      ],
      loading: false,
      error: null,
    });

    render(
      <ProviderCard
        provider={{
          id: 77,
          firstName: 'Ada',
          lastName: 'Lovelace',
          profile_url: 'ada-lovelace',
          location: 'Bucharest',
          services: [],
        }}
      />
    );

    expect(usePublicUserFeaturedBadgesMock).toHaveBeenCalledWith(77, true);
    expect(screen.getByText('Trusted Provider')).toBeTruthy();
    expect(screen.getByText('Fast Responder')).toBeTruthy();
    expect(screen.getByText('+1 badges')).toBeTruthy();

    fireEvent.click(screen.getByText('Ada Lovelace'));
    expect(pushMock).toHaveBeenCalledWith('/provider/ada-lovelace');
  });

  it('prefers featured badges already present in the provider payload', () => {
    usePublicUserFeaturedBadgesMock.mockReturnValue({
      data: [],
      loading: false,
      error: null,
    });

    render(
      <ProviderCard
        provider={{
          id: 88,
          firstName: 'Grace',
          lastName: 'Hopper',
          location: 'London',
          services: [],
          featuredBadges: [
            {
              id: 51,
              badge: {
                id: 141,
                code: 'provider_identity_verified',
                name: 'Identity Verified',
                reward_config: {},
              },
            },
          ],
        }}
      />
    );

    expect(usePublicUserFeaturedBadgesMock).toHaveBeenCalledWith(88, false);
    expect(screen.getByText('Identity Verified')).toBeTruthy();
  });
});
