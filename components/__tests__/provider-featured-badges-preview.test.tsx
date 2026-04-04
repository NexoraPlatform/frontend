import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProviderFeaturedBadgesPreview } from '@/components/badges/provider-featured-badges-preview';

const usePublicUserFeaturedBadgesMock = vi.fn();

vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ fill: _fill, ...props }: any) => <img {...props} alt={props.alt} />,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const dictionary: Record<string, string> = {
      provider_badges_title: 'Featured badges',
      badges_loading: 'Loading badges...',
      badges_none: 'No featured badges yet',
    };

    return dictionary[key] ?? key;
  },
}));

vi.mock('@/components/ui/hover-card', () => ({
  HoverCard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  HoverCardTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  HoverCardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/hooks/use-api', () => ({
  usePublicUserFeaturedBadges: (...args: unknown[]) => usePublicUserFeaturedBadgesMock(...args),
}));

describe('ProviderFeaturedBadgesPreview', () => {
  beforeEach(() => {
    usePublicUserFeaturedBadgesMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders inline featured badges without waiting for a fetch', () => {
    usePublicUserFeaturedBadgesMock.mockReturnValue({
      data: null,
      loading: false,
      error: null,
    });

    render(
      <ProviderFeaturedBadgesPreview
        provider={{
          id: 1,
          firstName: 'Ada',
          lastName: 'Lovelace',
          featuredBadges: [
            {
              id: 7,
              badge: {
                id: 11,
                code: 'provider_identity_verified',
                name: 'Identity Verified',
                reward_config: {},
              },
            },
          ],
        }}
      />
    );

    expect(usePublicUserFeaturedBadgesMock).toHaveBeenCalledWith(1, false);
    expect(screen.getByText('Identity Verified')).toBeTruthy();
  });

  it('fetches featured badges when the preview is opened', async () => {
    usePublicUserFeaturedBadgesMock.mockImplementation((_providerId: unknown, enabled: boolean) => ({
      data: enabled
        ? [
            {
              id: 5,
              badge: {
                id: 21,
                code: 'provider_trusted',
                name: 'Trusted Provider',
                reward_config: {},
              },
            },
          ]
        : null,
      loading: false,
      error: null,
    }));

    render(
      <ProviderFeaturedBadgesPreview
        provider={{
          id: 77,
          firstName: 'Grace',
          lastName: 'Hopper',
        }}
      />
    );

    expect(screen.getByText('No featured badges yet')).toBeTruthy();

    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Grace Hopper' }));

    await waitFor(() => {
      expect(usePublicUserFeaturedBadgesMock).toHaveBeenLastCalledWith(77, true);
    });
    expect(screen.getByText('Trusted Provider')).toBeTruthy();
  });
});
