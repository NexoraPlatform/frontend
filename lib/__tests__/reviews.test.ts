import { describe, expect, it } from 'vitest';

import {
  buildProjectReviewMutationPayload,
  isProjectReviewOpportunityProjectFinished,
  normalizeProjectReviewCollection,
  normalizePublicUserReviewsResponse,
  normalizeReviewOpportunityCollection,
} from '@/lib/reviews';

describe('lib/reviews', () => {
  it('normalizes review opportunities from a resource envelope', () => {
    const result = normalizeReviewOpportunityCollection({
      data: [
        {
          project_id: 12,
          project_title: 'Platform migration',
          project_status: 'COMPLETED',
          contract_id: 77,
          reviewer_role: 'client',
          reviewee: {
            id: 5,
            first_name: 'Ada',
            last_name: 'Lovelace',
            avatar: 'https://cdn.test/avatar.png',
            profile_url: 'ada-lovelace',
          },
          service_names: ['Backend Engineering'],
          eligible_milestone_ids: [31, '32'],
        },
      ],
    });

    expect(result).toEqual([
      {
        project_id: '12',
        project_title: 'Platform migration',
        project_status: 'COMPLETED',
        contract_id: '77',
        reviewer_role: 'CLIENT',
        reviewee: {
          id: '5',
          first_name: 'Ada',
          last_name: 'Lovelace',
          full_name: 'Ada Lovelace',
          avatar: 'https://cdn.test/avatar.png',
          profile_url: 'ada-lovelace',
        },
        service_names: ['Backend Engineering'],
        eligible_milestone_ids: ['31', '32'],
      },
    ]);
  });

  it('normalizes public review responses and nested review relations', () => {
    const response = normalizePublicUserReviewsResponse({
      success: true,
      summary: {
        user_id: 91,
        average_rating: '4.8',
        review_count: 6,
      },
      data: [
        {
          id: 100,
          project_id: 12,
          project_line_milestone_id: 31,
          reviewer_user_id: 4,
          reviewee_user_id: 91,
          reviewer_role: 'CLIENT',
          reviewee_role: 'PROVIDER',
          status: 'PUBLISHED',
          rating_overall: '5',
          headline: 'Great delivery',
          body: 'Everything went smoothly and the scope was clear.',
          score_payload: {
            communication: 5,
            quality: '4',
            would_work_again: true,
          },
          published_at: '2026-03-01T10:00:00Z',
          project: {
            id: 12,
            title: 'Platform migration',
            status: 'COMPLETED',
            contract_id: 77,
          },
          milestone: {
            id: 31,
            title: 'Release v1',
            status: 'COMPLETED',
            service: {
              id: 9,
              name: 'Backend Engineering',
            },
          },
          reviewer: {
            id: 4,
            first_name: 'Grace',
            last_name: 'Hopper',
            avatar: null,
            profile_url: 'grace-hopper',
          },
          reviewee: {
            id: 91,
            first_name: 'Ada',
            last_name: 'Lovelace',
            avatar: null,
            profile_url: 'ada-lovelace',
          },
        },
      ],
      meta: {
        current_page: 1,
        last_page: 2,
        per_page: 10,
        total: 11,
      },
    });

    expect(response.summary.average_rating).toBe(4.8);
    expect(response.data[0]?.milestone?.service?.name).toBe('Backend Engineering');
    expect(response.data[0]?.reviewer?.full_name).toBe('Grace Hopper');
    expect(response.meta.last_page).toBe(2);
  });

  it('builds trimmed mutation payloads without undefined values', () => {
    const payload = buildProjectReviewMutationPayload({
      reviewee_user_id: 44,
      project_line_milestone_id: '',
      rating_overall: 5,
      headline: '  Strong collaboration  ',
      body: '  Helpful and responsive.  ',
      private_feedback: '  Keep the async updates. ',
      score_payload: {
        communication: '5',
        quality: 0,
        would_work_again: 'true',
      },
    });

    expect(payload).toEqual({
      reviewee_user_id: '44',
      project_line_milestone_id: null,
      rating_overall: 5,
      headline: 'Strong collaboration',
      body: 'Helpful and responsive.',
      private_feedback: 'Keep the async updates.',
      score_payload: {
        communication: 5,
        would_work_again: true,
      },
    });
  });

  it('normalizes authenticated review collections from a paginated envelope', () => {
    const result = normalizeProjectReviewCollection({
      data: [
        {
          id: 7,
          project_id: 10,
          reviewer_user_id: 1,
          reviewee_user_id: 2,
          reviewer_role: 'PROVIDER',
          reviewee_role: 'CLIENT',
          status: 'SUBMITTED',
          rating_overall: 4,
          body: 'Waiting for counterpart.',
        },
      ],
    });

    expect(result[0]?.status).toBe('SUBMITTED');
    expect(result[0]?.rating_overall).toBe(4);
  });

  it('allows review opportunities only for final project statuses', () => {
    expect(
      isProjectReviewOpportunityProjectFinished({
        project_status: 'COMPLETED',
      })
    ).toBe(true);
    expect(
      isProjectReviewOpportunityProjectFinished({
        project_status: 'FINISHED',
      })
    ).toBe(true);
    expect(
      isProjectReviewOpportunityProjectFinished({
        project_status: 'DELIVERED',
      })
    ).toBe(true);
    expect(
      isProjectReviewOpportunityProjectFinished({
        project_status: 'IN_PROGRESS',
      })
    ).toBe(false);
    expect(
      isProjectReviewOpportunityProjectFinished({
        project_status: null,
      })
    ).toBe(false);
  });
});
