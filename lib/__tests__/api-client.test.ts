import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient } from '../api';

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('lib/api ApiClient', () => {
  const baseUrl = 'https://api.example.com';

  beforeEach(() => {
    localStorage.clear();
    document.cookie = '';
    window.history.pushState({}, '', '/ro/test');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('wraps fetch requests via ApiClient', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ data: [] }));
    vi.stubGlobal('fetch', fetchMock as any);

    const client = new ApiClient(baseUrl);
    await client.getPopularServices();

    expect(fetchMock.mock.calls.length).toBeGreaterThan(0);
    const matchingCall = fetchMock.mock.calls.find((call) =>
      String((call as unknown as [RequestInfo | URL, RequestInit?])[0]).includes('/api/services/popular')
    ) as unknown as [RequestInfo | URL, RequestInit?] | undefined;
    expect(matchingCall).toBeTruthy();
  });

  it('throws error message from non-ok response JSON', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ message: 'Invalid payload' }, 422));
    vi.stubGlobal('fetch', fetchMock as any);

    const client = new ApiClient(baseUrl);

    await expect(client.getPopularServices()).rejects.toThrow('Invalid payload');
  });

  it('normalizes badge endpoints for the authenticated dashboard', async () => {
    const fetchMock = vi
      .fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.includes('/api/me/badges/progress')) {
          return jsonResponse([
            {
              id: 8,
              status: 'in_progress',
              progress_percent: 66.6,
              completed_conditions_count: 2,
              total_conditions_count: 3,
              next_steps: ['Complete one more funded project'],
              badge: {
                id: 20,
                code: 'client_reliable_payer',
                name: 'Reliable Payer',
                reward_config: {},
              },
            },
          ]);
        }

        if (url.includes('/api/me/badges/rewards')) {
          return jsonResponse([
            {
              id: 11,
              reward_type: 'priority_support',
              status: 'active',
              reward_value_text: 'Priority support',
              badge: {
                id: 20,
                code: 'client_reliable_payer',
                name: 'Reliable Payer',
                reward_config: {},
              },
            },
          ]);
        }

        return jsonResponse([
          {
            id: 5,
            status: 'awarded',
            awarded_at: '2026-03-01 10:30:00',
            badge: {
              id: 20,
              code: 'client_reliable_payer',
              name: 'Reliable Payer',
              reward_config: {},
            },
          },
        ]);
      });
    vi.stubGlobal('fetch', fetchMock as any);

    const client = new ApiClient(baseUrl);
    const [myBadges, progress, rewards] = await Promise.all([
      client.getMyBadges(),
      client.getMyBadgeProgress(),
      client.getMyBadgeRewards(),
    ]);

    expect(myBadges[0]?.badge?.code).toBe('client_reliable_payer');
    expect(progress[0]?.progress_percent).toBeCloseTo(66.6);
    expect(rewards[0]?.reward_value_text).toBe('Priority support');
  });

  it('calls the public user badges endpoint', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse([
        {
          id: 14,
          status: 'awarded',
          badge: {
            id: 44,
            code: 'provider_trusted',
            name: 'Trusted Provider',
            reward_config: {},
          },
        },
      ])
    );
    vi.stubGlobal('fetch', fetchMock as any);

    const client = new ApiClient(baseUrl);
    const response = await client.getPublicUserBadges('77');

    expect(response[0]?.badge?.name).toBe('Trusted Provider');
    const publicBadgesCall = fetchMock.mock.calls.find((call) =>
      String((call as unknown as [RequestInfo | URL, RequestInit?])[0]).includes('/api/users/77/badges')
    ) as unknown as [RequestInfo | URL, RequestInit?] | undefined;
    expect(publicBadgesCall).toBeTruthy();
  });

  it('normalizes review opportunities and review listing endpoints', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('/api/me/review-opportunities')) {
        return jsonResponse({
          data: [
            {
              project_id: 12,
              project_title: 'Platform migration',
              project_status: 'COMPLETED',
              contract_id: 77,
              reviewer_role: 'CLIENT',
              reviewee: {
                id: 5,
                first_name: 'Ada',
                last_name: 'Lovelace',
                avatar: null,
                profile_url: 'ada-lovelace',
              },
              service_names: ['Backend Engineering'],
              eligible_milestone_ids: [31, 32],
            },
          ],
        });
      }

      if (url.includes('/api/me/reviews')) {
        return jsonResponse({
          data: [
            {
              id: 100,
              project_id: 12,
              reviewer_user_id: 4,
              reviewee_user_id: 5,
              reviewer_role: 'CLIENT',
              reviewee_role: 'PROVIDER',
              status: 'PUBLISHED',
              rating_overall: 5,
              headline: 'Great delivery',
              body: 'Everything went smoothly.',
              published_at: '2026-03-01T10:00:00Z',
            },
          ],
          meta: {
            current_page: 1,
            last_page: 1,
            per_page: 10,
            total: 1,
          },
        });
      }

      return jsonResponse({
        success: true,
        summary: {
          user_id: 77,
          average_rating: 4.9,
          review_count: 3,
        },
        data: [
          {
            id: 44,
            project_id: 12,
            reviewer_user_id: 4,
            reviewee_user_id: 77,
            reviewer_role: 'CLIENT',
            reviewee_role: 'PROVIDER',
            status: 'PUBLISHED',
            rating_overall: 5,
            body: 'Excellent result.',
          },
        ],
        meta: {
          current_page: 2,
          last_page: 4,
          per_page: 5,
          total: 17,
        },
      });
    });
    vi.stubGlobal('fetch', fetchMock as any);

    const client = new ApiClient(baseUrl);
    const [opportunities, myReviews, publicReviews] = await Promise.all([
      client.getMyReviewOpportunities(),
      client.getMyReviews({ scope: 'authored', per_page: 10 }),
      client.getPublicUserReviews('77', { page: 2, per_page: 5 }),
    ]);

    expect(opportunities[0]?.eligible_milestone_ids).toEqual(['31', '32']);
    expect(myReviews.data[0]?.headline).toBe('Great delivery');
    expect(publicReviews.summary.average_rating).toBe(4.9);
    expect(publicReviews.meta.current_page).toBe(2);
  });

  it('submits, updates and flags project reviews through the expected endpoints', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('/api/project-reviews/88/flag')) {
        return jsonResponse({
          success: true,
          data: {
            id: 9,
            project_review_id: 88,
            reason_code: 'spam_or_fake',
            notes: 'Looks copied.',
            status: 'OPEN',
          },
        });
      }

      if (url.includes('/api/project-reviews/88')) {
        return jsonResponse({
          success: true,
          data: {
            id: 88,
            project_id: 11,
            reviewer_user_id: 1,
            reviewee_user_id: 2,
            reviewer_role: 'CLIENT',
            reviewee_role: 'PROVIDER',
            status: 'SUBMITTED',
            rating_overall: 4,
            headline: 'Updated title',
            body: 'Updated body',
          },
        });
      }

      return jsonResponse({
        success: true,
        data: {
          id: 88,
          project_id: 11,
          reviewer_user_id: 1,
          reviewee_user_id: 2,
          reviewer_role: 'CLIENT',
          reviewee_role: 'PROVIDER',
          status: 'SUBMITTED',
          rating_overall: 5,
          headline: 'Initial title',
          body: 'Initial body',
        },
      });
    });
    vi.stubGlobal('fetch', fetchMock as any);

    const client = new ApiClient(baseUrl);
    const createdReview = await client.submitProjectReview('11', {
      reviewee_user_id: 2,
      project_line_milestone_id: null,
      rating_overall: 5,
      headline: '  Initial title  ',
      body: '  Initial body  ',
      score_payload: {
        communication: 5,
        would_work_again: true,
      },
    });
    const updatedReview = await client.updateProjectReview('88', {
      headline: '  Updated title ',
      body: ' Updated body ',
    });
    const createdFlag = await client.flagProjectReview('88', {
      reason_code: 'spam_or_fake',
      notes: 'Looks copied.',
    });

    expect(createdReview.headline).toBe('Initial title');
    expect(updatedReview.body).toBe('Updated body');
    expect(createdFlag.reason_code).toBe('spam_or_fake');

    const submitCall = fetchMock.mock.calls.find((call) =>
      String((call as unknown as [RequestInfo | URL, RequestInit?])[0]).includes('/api/projects/11/reviews')
    ) as unknown as [RequestInfo | URL, RequestInit?] | undefined;
    expect(submitCall).toBeTruthy();
    expect(submitCall?.[1]?.method).toBe('POST');
    expect(JSON.parse(String(submitCall?.[1]?.body))).toEqual({
      reviewee_user_id: '2',
      project_line_milestone_id: null,
      rating_overall: 5,
      headline: 'Initial title',
      body: 'Initial body',
      score_payload: {
        communication: 5,
        would_work_again: true,
      },
    });

    const updateCall = fetchMock.mock.calls.find((call) =>
      String((call as unknown as [RequestInfo | URL, RequestInit?])[0]).includes('/api/project-reviews/88')
        && !(String((call as unknown as [RequestInfo | URL, RequestInit?])[0]).includes('/flag'))
    ) as unknown as [RequestInfo | URL, RequestInit?] | undefined;
    expect(updateCall?.[1]?.method).toBe('PATCH');

    const flagCall = fetchMock.mock.calls.find((call) =>
      String((call as unknown as [RequestInfo | URL, RequestInit?])[0]).includes('/api/project-reviews/88/flag')
    ) as unknown as [RequestInfo | URL, RequestInit?] | undefined;
    expect(flagCall?.[1]?.method).toBe('POST');
  });

  it('normalizes chat groups envelope with pagination metadata', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        groups: [{ id: 'g1', name: 'General' }],
        pagination: {
          current_page: 1,
          per_page: 20,
          total: 42,
          last_page: 3,
          has_more_pages: true,
        },
      })
    );
    vi.stubGlobal('fetch', fetchMock as any);

    const client = new ApiClient(baseUrl);
    const response = await client.getChatGroups();

    expect(response.groups).toEqual([{ id: 'g1', name: 'General' }]);
    expect(response.pagination).toEqual({
      current_page: 1,
      per_page: 20,
      total: 42,
      last_page: 3,
      has_more_pages: true,
    });
  });

  it('normalizes chat messages envelope with pagination metadata', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        messages: [{ id: 'm1', content: 'hello' }],
        total: 42,
        hasMore: true,
        pagination: {
          current_page: 1,
          per_page: 20,
          last_page: 4,
        },
      })
    );
    vi.stubGlobal('fetch', fetchMock as any);

    const client = new ApiClient(baseUrl);
    const response = await client.getChatMessages('group-1', 1, 20);

    expect(response.messages).toEqual([{ id: 'm1', content: 'hello' }]);
    expect(response.total).toBe(42);
    expect(response.hasMore).toBe(true);
    expect(response.pagination).toEqual({
      current_page: 1,
      per_page: 20,
      last_page: 4,
    });
  });

  it('accepts object response for project name by slug endpoint', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ name: 'Project Name' }));
    vi.stubGlobal('fetch', fetchMock as any);

    const client = new ApiClient(baseUrl);
    const response = await client.getProjectNameByProjectUrl('project-slug');

    expect(response).toBe('Project Name');
  });

  it('sends admin user updates as top-level fields with a singular role', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ message: 'ok' }));
    vi.stubGlobal('fetch', fetchMock as any);

    const client = new ApiClient(baseUrl);
    await client.updateUser(7, {
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      role: 'ADMIN',
      password: 'password123',
      password_confirmation: 'password123',
    });

    const updateCall = fetchMock.mock.calls.find((call) =>
      String((call as unknown as [RequestInfo | URL, RequestInit?])[0]).includes('/api/admin/users/7')
    ) as unknown as [RequestInfo | URL, RequestInit?] | undefined;
    expect(updateCall).toBeTruthy();
    expect(updateCall![1]?.method).toBe('PATCH');
    expect(JSON.parse(String(updateCall![1]?.body))).toEqual({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      role: 'ADMIN',
      password: 'password123',
      password_confirmation: 'password123',
    });
  });

  it('uses the exam violations endpoint for exam guard reports', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ action: 'warning' }));
    vi.stubGlobal('fetch', fetchMock as any);

    const client = new ApiClient(baseUrl);
    await client.logExamViolation({ testId: 1, type: 'minor', reason: 'tab_switch' });

    const violationCall = fetchMock.mock.calls.find((call) =>
      String((call as unknown as [RequestInfo | URL, RequestInit?])[0]).includes('/api/exams/violation')
    ) as unknown as [RequestInfo | URL, RequestInit?] | undefined;
    expect(violationCall).toBeTruthy();
    expect(String(violationCall![0])).toContain('/api/exams/violation');
    expect(violationCall![1]?.method).toBe('POST');
  });
});
