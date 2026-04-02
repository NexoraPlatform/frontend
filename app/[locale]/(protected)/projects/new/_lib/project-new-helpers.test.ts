import { describe, expect, it } from 'vitest';

import {
  deriveManualLineBudgetPercentage,
  syncManualMilestoneWithBudget,
} from './project-new-helpers';
import {
  normalizeAiBriefResponse,
  normalizeRecommendationResponse,
} from './project-new-normalizers';

describe('project new helpers', () => {
  it('derives manual line percentage and keeps amount/percentage sync stable', () => {
    expect(
      deriveManualLineBudgetPercentage(
        [
          {
            id: 'm1',
            title: 'Design',
            description: '',
            percentage: '',
            amount: '250',
            sync_source: 'amount',
          },
        ],
        1000
      )
    ).toBe('25');

    expect(
      syncManualMilestoneWithBudget(
        {
          id: 'm2',
          title: 'Implementation',
          description: '',
          percentage: '',
          amount: '250',
          sync_source: 'amount',
        },
        1000
      )
    ).toMatchObject({
      amount: '250',
      percentage: '25',
      sync_source: 'amount',
    });

    expect(
      syncManualMilestoneWithBudget(
        {
          id: 'm3',
          title: 'QA',
          description: '',
          percentage: '40',
          amount: '',
          sync_source: 'percentage',
        },
        1000
      )
    ).toMatchObject({
      percentage: '40',
      amount: '400',
      sync_source: 'percentage',
    });
  });

  it('normalizes recommendation payloads and keeps alternative services deduplicated', () => {
    const catalog = new Map([
      [
        '2',
        {
          name: 'User research',
          description: 'Fallback from catalog',
          delivery_provider: 'google_drive',
        },
      ],
    ]);

    const result = normalizeRecommendationResponse(
      {
        data: {
          bundle_name: 'Launch bundle',
          services: [
            {
              service_id: 1,
              name: 'UI Design',
              delivery_provider: 'figma',
              category_name: 'Design',
            },
          ],
          similar_services_by_category: [
            {
              category_id: 'design',
              category_name: 'Design',
              services: [
                {
                  service_id: 1,
                  name: 'UI Design Duplicate',
                  delivery_provider: 'manual_upload',
                },
                {
                  service_id: 2,
                  name: 'User research',
                },
              ],
            },
          ],
        },
      },
      catalog
    );

    expect(result.bundle_name).toBe('Launch bundle');
    expect(result.services).toHaveLength(2);
    expect(result.services[0]).toMatchObject({
      service_id: 1,
      service_name: 'UI Design',
      delivery_provider: 'figma',
    });
    expect(result.services[1]).toMatchObject({
      service_id: 2,
      service_name: 'User research',
      delivery_provider: 'google_drive',
      category_name: 'Design',
      is_alternative: true,
    });
  });

  it('normalizes AI brief responses and rebuilds project lines when the payload only has technologies and milestones', () => {
    const response = normalizeAiBriefResponse({
      status: 'FINAL',
      brief_result_id: 42,
      payload_truncated: true,
      payload_trimmed_sections: ['final_brief_full'],
      recommended_providers: {
        Frontend: [
          {
            id: 7,
            first_name: 'Ana',
            last_name: 'Pop',
            match_score: 91,
          },
        ],
      },
      other_providers_by_service: [
        {
          service_id: 5,
          service_name: 'Frontend',
          total: 1,
          providers: [
            {
              id: 8,
              name: 'Alt Provider',
            },
          ],
        },
      ],
      final_brief: {
        title: 'Client Portal',
        description: 'Portal implementation',
        budget: 1000,
        technologies: [
          {
            service_id: 5,
            name: 'Frontend',
            delivery_provider: 'github',
          },
        ],
        milestones: [
          {
            title: 'Build UI',
            amount: 1000,
            percentage: 100,
            duration_days: 15,
            service_id: 5,
            service_name: 'Frontend',
          },
        ],
      },
    });

    expect(response).not.toBeNull();
    expect(response).toMatchObject({
      status: 'FINAL',
      brief_result_id: 42,
      payload_truncated: true,
      payload_trimmed_sections: ['final_brief_full'],
      recommended_providers: {
        Frontend: [
          {
            id: 7,
            name: 'Ana Pop',
            matchScore: 91,
          },
        ],
      },
      other_providers_by_service: [
        {
          service_id: 5,
          service_name: 'Frontend',
          providers: {
            total: 1,
            data: [
              {
                id: 8,
                name: 'Alt Provider',
              },
            ],
          },
        },
      ],
    });

    expect(response?.final_brief?.project_lines).toEqual([
      {
        service_name: 'Frontend',
        delivery_provider: 'github',
        description: 'Portal implementation',
        budget_percentage: 100,
        milestones: [
          {
            title: 'Build UI',
            amount: 1000,
            percentage: 100,
            duration_days: 15,
          },
        ],
      },
    ]);
  });
});
