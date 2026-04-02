import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getProviderProfileByUrlMock,
  getProviderServicesMock,
  mapPublicProviderProfileMock,
} = vi.hoisted(() => ({
  getProviderProfileByUrlMock: vi.fn(),
  getProviderServicesMock: vi.fn(),
  mapPublicProviderProfileMock: vi.fn(),
}));

vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} alt={props.alt} />,
}));

vi.mock('@/components/header', () => ({
  Header: () => null,
}));

vi.mock('@/components/footer', () => ({
  Footer: () => null,
}));

vi.mock('@/components/trustora/theme-styles', () => ({
  TrustoraThemeStyles: () => null,
}));

vi.mock('@/hooks/use-api', () => ({
  useGetLanguages: () => ({
    data: [],
    loading: false,
  }),
  usePublicUserBadges: () => ({
    data: [],
    loading: false,
    error: null,
  }),
}));

vi.mock('@/contexts/auth-context', () => ({
  useOptionalAuth: () => undefined,
}));

vi.mock('@/hooks/use-public-auth', () => ({
  usePublicAuth: () => ({
    user: null,
  }),
}));

vi.mock('@/lib/api', () => ({
  apiClient: {
    getProviderProfileByUrl: (...args: any[]) => getProviderProfileByUrlMock(...args),
    getProviderServices: (...args: any[]) => getProviderServicesMock(...args),
  },
}));

vi.mock('@/lib/provider-public-profile', () => ({
  mapPublicProviderProfile: (...args: any[]) => mapPublicProviderProfileMock(...args),
}));

vi.mock('@/components/badges/badge-card', () => ({
  BadgeCard: () => null,
}));

vi.mock('@/components/reviews/public-user-reviews-panel', () => ({
  PublicUserReviewsPanel: () => null,
}));

describe('public provider profile page', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );

    getProviderProfileByUrlMock.mockReset();
    getProviderServicesMock.mockReset();
    mapPublicProviderProfileMock.mockReset();

    getProviderProfileByUrlMock.mockResolvedValue({
      id: 42,
      profile_url: 'ada-lovelace',
    });
    getProviderServicesMock.mockResolvedValue([]);
    mapPublicProviderProfileMock.mockReturnValue({
      id: 42,
      firstName: 'Ada',
      lastName: 'Lovelace',
      avatar: '',
      isVerified: true,
      location: 'Bucharest',
      memberSince: '2022-01-01T00:00:00.000Z',
      rating: 4.9,
      reviewCount: 12,
      featuredBadges: [],
      bio: 'Creates robust product strategy and delivery plans.',
      completedProjects: 28,
      responseTime: 2,
      availability: {
        status: 'AVAILABLE',
        hoursPerWeek: 20,
        timezone: 'Europe/Bucharest',
        nextAvailable: null,
        workingHours: {
          monday: { start: '09:00', end: '17:00' },
          tuesday: { start: '09:00', end: '17:00' },
          wednesday: { start: '09:00', end: '17:00' },
          thursday: { start: '09:00', end: '17:00' },
          friday: { start: '09:00', end: '17:00' },
          saturday: null,
          sunday: null,
        },
      },
      firstJob: '2018-01-01T00:00:00.000Z',
      company: 'Analytical Engines',
      website: 'https://example.com',
      lastActive: new Date().toISOString(),
      profileUrl: 'ada-lovelace',
      languages: [],
      certifications: [],
      education: [],
      portfolio: [],
      workHistory: [],
      email: 'ada@example.com',
      phone: '+40 700 000 000',
    });
  });

  it('renders the public profile without the removed CTA buttons', async () => {
    const ProviderProfile =
      (await import('../[locale]/(public)/provider/[id]/provider-profile')).default;

    render(<ProviderProfile id="ada-lovelace" />);

    await waitFor(() => expect(screen.getByText('Ada Lovelace')).toBeTruthy());

    expect(screen.getByText('Despre mine')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Contactează' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Adaugă la favorite' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Elimină din favorite' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Partajează' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Trimite Mesaj' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Programează Apel' })).toBeNull();
  });
});
