import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DashboardBadgesPanel } from '@/components/badges/dashboard-badges-panel';

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string, values?: Record<string, unknown>) => {
    if (key === 'dashboard.badges.all_unlocked') {
      return `${values?.count} badges unlocked`;
    }

    const dictionary: Record<string, string> = {
      'dashboard.badges.title': 'Badges',
      'dashboard.badges.headline': 'Your reputation is taking shape',
      'dashboard.badges.description': 'Badge description',
      'dashboard.badges.awarded': 'Awarded',
      'dashboard.badges.in_progress': 'In progress',
      'dashboard.badges.featured': 'Featured badges',
      'dashboard.badges.latest': 'Recently unlocked',
      'dashboard.badges.loading': 'Loading badges...',
      'dashboard.badges.error': 'We could not load badges.',
      'dashboard.badges.empty_title': 'Your badges will appear here',
      'dashboard.badges.empty_description': 'Badge empty state',
      'dashboard.badges.progress_title': 'Active progress',
      'dashboard.badges.progress_headline': 'Track the next badges',
      'dashboard.badges.progress_description': 'Progress description',
      'dashboard.badges.progress_empty': 'There are no badges in progress right now.',
      'dashboard.badges.criteria_complete': 'criteria completed',
      'dashboard.badges.next_step': 'Next step',
      'dashboard.badges.rewards_title': 'Active perks',
      'dashboard.badges.untitled_badge': 'Untitled badge',
    };

    return dictionary[key] ?? key;
  },
}));

describe('DashboardBadgesPanel', () => {
  it('renders featured badges, counts, progress, and rewards', () => {
    render(
      <DashboardBadgesPanel
        badgeCounts={{ awarded: 4, in_progress: 2 }}
        featuredBadges={[
          {
            id: 1,
            status: 'awarded',
            award_source: 'system',
            award_reason: null,
            awarded_at: '2026-03-01 10:30:00',
            effective_from: null,
            expires_at: null,
            revoked_at: null,
            revocation_reason: null,
            badge: {
              id: 101,
              code: 'provider_trusted',
              name: 'Trusted Provider',
              slug: 'trusted-provider',
              description: 'Recognized for trust signals',
              short_description: 'Recognized for trust signals',
              audience: 'provider',
              category: 'trust',
              type: 'achievement',
              status: 'active',
              is_active: true,
              is_revocable: false,
              is_hidden: false,
              is_featured: true,
              show_on_profile: true,
              show_in_marketplace: true,
              priority: 10,
              sort_order: 10,
              icon: 'shield-check',
              icon_type: 'heroicon',
              color: '#2563eb',
              background_color: '#dbeafe',
              border_color: '#93c5fd',
              display_config: {},
              reward_config: {},
            },
            tier: {
              id: 5,
              tier_code: 'gold',
              tier_name: 'Gold',
            },
          },
        ]}
        awardedBadges={[
          {
            id: 1,
            status: 'awarded',
            award_source: 'system',
            award_reason: null,
            awarded_at: '2026-03-01 10:30:00',
            effective_from: null,
            expires_at: null,
            revoked_at: null,
            revocation_reason: null,
            badge: {
              id: 101,
              code: 'provider_trusted',
              name: 'Trusted Provider',
              slug: 'trusted-provider',
              description: 'Recognized for trust signals',
              short_description: 'Recognized for trust signals',
              audience: 'provider',
              category: 'trust',
              type: 'achievement',
              status: 'active',
              is_active: true,
              is_revocable: false,
              is_hidden: false,
              is_featured: true,
              show_on_profile: true,
              show_in_marketplace: true,
              priority: 10,
              sort_order: 10,
              icon: 'shield-check',
              icon_type: 'heroicon',
              color: '#2563eb',
              background_color: '#dbeafe',
              border_color: '#93c5fd',
              display_config: {},
              reward_config: {},
            },
            tier: {
              id: 5,
              tier_code: 'gold',
              tier_name: 'Gold',
            },
          },
        ]}
        badgeProgress={[
          {
            id: 2,
            status: 'in_progress',
            current_value: 2,
            target_value: 3,
            progress_percent: 66.7,
            completed_conditions_count: 2,
            total_conditions_count: 3,
            started_at: null,
            completed_at: null,
            last_evaluated_at: null,
            expires_at: null,
            condition_states: [],
            next_steps: ['Complete one more funded project'],
            badge: {
              id: 102,
              code: 'client_reliable_payer',
              name: 'Reliable Payer',
              slug: 'reliable-payer',
              description: 'Pays on time',
              short_description: 'Pays on time',
              audience: 'client',
              category: 'trust',
              type: 'achievement',
              status: 'active',
              is_active: true,
              is_revocable: false,
              is_hidden: false,
              is_featured: false,
              show_on_profile: true,
              show_in_marketplace: false,
              priority: 10,
              sort_order: 10,
              icon: 'star',
              icon_type: 'heroicon',
              color: '#0f766e',
              background_color: '#ccfbf1',
              border_color: '#99f6e4',
              display_config: {},
              reward_config: {},
            },
          },
        ]}
        badgeRewards={[
          {
            id: 88,
            reward_type: 'priority_support',
            status: 'active',
            reward_value_numeric: null,
            reward_value_text: 'Priority support',
            applied_at: null,
            effective_from: null,
            expires_at: null,
            revoked_at: null,
            payload: {},
            badge: {
              id: 101,
              code: 'provider_trusted',
              name: 'Trusted Provider',
              slug: 'trusted-provider',
              description: 'Recognized for trust signals',
              short_description: 'Recognized for trust signals',
              audience: 'provider',
              category: 'trust',
              type: 'achievement',
              status: 'active',
              is_active: true,
              is_revocable: false,
              is_hidden: false,
              is_featured: true,
              show_on_profile: true,
              show_in_marketplace: true,
              priority: 10,
              sort_order: 10,
              icon: 'shield-check',
              icon_type: 'heroicon',
              color: '#2563eb',
              background_color: '#dbeafe',
              border_color: '#93c5fd',
              display_config: {},
              reward_config: {},
            },
          },
        ]}
        loading={false}
        error={null}
      />
    );

    expect(screen.getAllByText('Trusted Provider').length).toBeGreaterThan(0);
    expect(screen.getByText('Reliable Payer')).toBeTruthy();
    expect(screen.getByText('Complete one more funded project')).toBeTruthy();
    expect(screen.getByText('Awarded')).toBeTruthy();
    expect(screen.getByText('In progress')).toBeTruthy();
  });

  it('renders the empty state when no badge data is available', () => {
    render(
      <DashboardBadgesPanel
        badgeCounts={{ awarded: 0, in_progress: 0 }}
        featuredBadges={[]}
        awardedBadges={[]}
        badgeProgress={[]}
        badgeRewards={[]}
        loading={false}
        error={null}
      />
    );

    expect(screen.getByText('Your badges will appear here')).toBeTruthy();
    expect(screen.getByText('There are no badges in progress right now.')).toBeTruthy();
  });
});
