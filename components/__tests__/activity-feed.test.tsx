import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ActivityFeed from '@/components/ActivityFeed';
import apiClient from '@/lib/api';

vi.mock('@/lib/navigation', () => ({
  Link: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}));

vi.mock('@/lib/api', () => ({
  default: {
    getRecentActivitiesQuick: vi.fn(),
  },
  apiClient: {
    getRecentActivitiesQuick: vi.fn(),
  },
}));

describe('ActivityFeed', () => {
  const mockedApi = apiClient as unknown as {
    getRecentActivitiesQuick: vi.Mock;
  };

  beforeEach(() => {
    mockedApi.getRecentActivitiesQuick.mockReset();
  });

  it('renders empty state when no activities exist', async () => {
    mockedApi.getRecentActivitiesQuick.mockResolvedValue([]);

    render(<ActivityFeed />);

    expect(await screen.findByText('No recent activity.')).toBeTruthy();
  });

  it('shows an error when API response is invalid', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockedApi.getRecentActivitiesQuick.mockResolvedValue({ data: [] } as any);

    render(<ActivityFeed />);

    expect(await screen.findByText('Failed to load activities')).toBeTruthy();
    consoleSpy.mockRestore();
  });

  it('shows View All button when there are at least 5 activities', async () => {
    mockedApi.getRecentActivitiesQuick.mockResolvedValue([
      { title: 'Project created', time_ago: '1h' },
      { title: 'Invoice paid', time_ago: '2h' },
      { title: 'New proposal', time_ago: '3h' },
      { title: 'Project updated', time_ago: '4h' },
      { title: 'Other activity', time_ago: '5h' },
    ]);

    render(<ActivityFeed />);

    expect(await screen.findByText('View All Activity')).toBeTruthy();
  });
});
