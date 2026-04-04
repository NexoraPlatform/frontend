import { describe, expect, it } from 'vitest';
import { mapPublicProviderProfile } from '../provider-public-profile';

describe('mapPublicProviderProfile', () => {
  it('maps the backend public provider resource with camelCase collections and missing private fields', () => {
    const result = mapPublicProviderProfile(
      {
        id: 11,
        firstName: 'Ada',
        lastName: 'Lovelace',
        avatar: 'https://example.com/avatar.png',
        rating: 4.7,
        reviewCount: 8,
        testVerified: true,
        callVerified: true,
        profile_url: 'ada-lovelace',
        website: 'https://ada.dev',
        oldest_work_experience: '2021-01-01',
        next_available_job: '2026-04-01',
        featured_badges: [
          {
            id: 501,
            status: 'awarded',
            awarded_at: '2026-03-01 10:30:00',
            badge: {
              id: 91,
              code: 'provider_trusted',
              name: 'Trusted Provider',
              short_description: 'Trusted by the platform',
              category: 'trust',
              color: '#2563eb',
              background_color: '#dbeafe',
              border_color: '#93c5fd',
              reward_config: {},
            },
            tier: {
              id: 5,
              tier_code: 'gold',
              tier_name: 'Gold',
            },
          },
        ],
        profile: {
          bio: 'Backend engineer',
          location: 'Bucharest',
          answer_hour: '2',
          working_hours_per_week: '35',
          availability: 'AVAILABLE',
        },
        portfolios: [
          {
            project_title: 'Trustora',
            description: 'Marketplace',
            technologies_used: ['Laravel', 'React'],
            url: 'https://example.com/project',
          },
        ],
        workHistory: [
          {
            position: 'Senior Engineer',
            company: 'Trustora',
            city: 'Bucharest',
            country: 'RO',
            start_date: '2021-01-01',
            end_date: '',
            description: 'Led backend work',
            current_working: true,
          },
        ],
        educations: [
          {
            institution: 'UPB',
            attended_from: '2015-10-01',
            attended_to: '2019-06-30',
            degree: 'BSc',
            study_area: 'Computer Science',
          },
        ],
        languages: [
          { language: 'English', proficiency: 'Fluent' },
        ],
        services: [],
        testExamDetails: [],
      },
      'ada-lovelace',
      [{ name: 'English', flag: '🇬🇧' }]
    );

    expect(result.profileUrl).toBe('ada-lovelace');
    expect(result.company).toBe('');
    expect(result.rating).toBe(4.7);
    expect(result.reviewCount).toBe(8);
    expect(result.completedProjects).toBe(1);
    expect(result.languages).toEqual([{ name: 'English', level: 'Fluent', flag: '🇬🇧' }]);
    expect(result.education[0]).toMatchObject({
      degree: 'BSc',
      institution: 'UPB',
      period: '2015-10-01 - 2019-06-30',
      description: 'Computer Science',
    });
    expect(result.workHistory[0]).toMatchObject({
      position: 'Senior Engineer',
      company: 'Trustora',
      period: '2021-01-01 - Prezent',
      type: 'Curent',
    });
    expect(result.featuredBadges).toHaveLength(1);
    expect(result.featuredBadges[0]).toMatchObject({
      id: 501,
      badge: {
        code: 'provider_trusted',
        name: 'Trusted Provider',
      },
      tier: {
        tier_name: 'Gold',
      },
    });
    expect(result.availability.status).toBe('AVAILABLE');
    expect(result.availability.hoursPerWeek).toBe(35);
    expect(result.availability.timezone).toBeNull();
  });

  it('falls back to structured availability working hours when present', () => {
    const result = mapPublicProviderProfile(
      {
        id: 21,
        firstName: 'Grace',
        lastName: 'Hopper',
        profile: {
          bio: '',
          location: '',
          availability: {
            status: 'BUSY',
            hoursPerWeek: 20,
            timezone: 'Europe/Bucharest',
            responseTime: '1',
            workingHours: {
              monday: { start: '09:00', end: '17:00', enabled: true },
            },
          },
        },
      },
      'grace-hopper',
      []
    );

    expect(result.availability.status).toBe('BUSY');
    expect(result.availability.hoursPerWeek).toBe(20);
    expect(result.availability.timezone).toBe('Europe/Bucharest');
    expect(result.availability.workingHours.monday).toEqual({
      start: '09:00',
      end: '17:00',
      enabled: true,
    });
    expect(result.responseTime).toBe('1');
  });
});
