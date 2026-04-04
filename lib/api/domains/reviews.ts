import {
  buildProjectReviewMutationPayload,
  normalizeMyProjectReviewsResponse,
  normalizeProjectReview,
  normalizeProjectReviewFlag,
  normalizePublicUserReviewsResponse,
  normalizeReviewOpportunityCollection,
  type FlagProjectReviewPayload,
  type MyProjectReviewsResponse,
  type ProjectReviewFlagRecord,
  type ProjectReviewRecord,
  type PublicUserReviewsResponse,
  type ReviewOpportunityRecord,
  type SubmitProjectReviewPayload,
  type UpdateProjectReviewPayload,
} from '@/lib/reviews';

import type { ApiClientCore } from '../core';
import { asObject } from '../normalizers';

export const reviewApiMethods = {
  async getMyReviewOpportunities(
    this: ApiClientCore
  ): Promise<ReviewOpportunityRecord[]> {
    const response = await this.request<any>('/me/review-opportunities');
    return normalizeReviewOpportunityCollection(response);
  },

  async getMyReviews(
    this: ApiClientCore,
    params?: {
      scope?: 'all' | 'authored' | 'received';
      status?: string;
      per_page?: number;
      page?: number;
    }
  ): Promise<MyProjectReviewsResponse> {
    const searchParams = new URLSearchParams();

    if (params?.scope) {
      searchParams.set('scope', params.scope);
    }

    if (params?.status) {
      searchParams.set('status', params.status);
    }

    if (typeof params?.per_page === 'number' && Number.isFinite(params.per_page)) {
      searchParams.set('per_page', String(params.per_page));
    }

    if (typeof params?.page === 'number' && Number.isFinite(params.page)) {
      searchParams.set('page', String(params.page));
    }

    const qs = searchParams.toString();
    const response = await this.request<any>(`/me/reviews${qs ? `?${qs}` : ''}`);
    return normalizeMyProjectReviewsResponse(response);
  },

  async submitProjectReview(
    this: ApiClientCore,
    projectId: string | number,
    payload: SubmitProjectReviewPayload
  ): Promise<ProjectReviewRecord> {
    const response = await this.request<any>(`/projects/${projectId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(buildProjectReviewMutationPayload(payload)),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const review = normalizeProjectReview(asObject(response)?.data ?? response);
    if (!review) {
      throw new Error('Project review payload is missing the review entity.');
    }

    return review;
  },

  async updateProjectReview(
    this: ApiClientCore,
    reviewId: string | number,
    payload: UpdateProjectReviewPayload
  ): Promise<ProjectReviewRecord> {
    const response = await this.request<any>(`/project-reviews/${reviewId}`, {
      method: 'PATCH',
      body: JSON.stringify(buildProjectReviewMutationPayload(payload)),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const review = normalizeProjectReview(asObject(response)?.data ?? response);
    if (!review) {
      throw new Error('Project review payload is missing the updated review entity.');
    }

    return review;
  },

  async flagProjectReview(
    this: ApiClientCore,
    reviewId: string | number,
    payload: FlagProjectReviewPayload
  ): Promise<ProjectReviewFlagRecord> {
    const response = await this.request<any>(`/project-reviews/${reviewId}/flag`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const flag = normalizeProjectReviewFlag(asObject(response)?.data ?? response);
    if (!flag) {
      throw new Error('Project review flag payload is missing the created flag entity.');
    }

    return flag;
  },

  async getPublicUserReviews(
    this: ApiClientCore,
    userId: string | number,
    params?: {
      per_page?: number;
      page?: number;
    }
  ): Promise<PublicUserReviewsResponse> {
    const searchParams = new URLSearchParams();

    if (typeof params?.per_page === 'number' && Number.isFinite(params.per_page)) {
      searchParams.set('per_page', String(params.per_page));
    }

    if (typeof params?.page === 'number' && Number.isFinite(params.page)) {
      searchParams.set('page', String(params.page));
    }

    const qs = searchParams.toString();
    const response = await this.request<any>(`/users/${userId}/reviews${qs ? `?${qs}` : ''}`);
    return normalizePublicUserReviewsResponse(response);
  },
};

export type ReviewApiMethods = typeof reviewApiMethods;
