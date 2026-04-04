import type { ApiClientCore } from '../core';
import type {
  ActivityFeedResponse,
  ActivityPageResponse,
  DashboardStatsResponse,
  RecentActivityQuick,
} from '../types';

export const dashboardApiMethods = {
  async getDashboardStats(this: ApiClientCore) {
    return this.request<DashboardStatsResponse>('/dashboard/stats');
  },

  async getRecentActivities(this: ApiClientCore, page: number = 1) {
    return this.request<ActivityFeedResponse>(`/activities?page=${page}`);
  },

  async getActivities(this: ApiClientCore, page: number = 1) {
    return this.request<ActivityPageResponse>(`/activities?page=${page}`);
  },

  async getRecentActivitiesQuick(
    this: ApiClientCore,
    language?: 'ro' | 'en'
  ) {
    const params = new URLSearchParams();
    if (language) {
      params.set('language', language);
    }
    const query = params.toString();
    const endpoint = query ? `/activities/recent?${query}` : '/activities/recent';
    return this.request<RecentActivityQuick[]>(endpoint);
  },
};

export type DashboardApiMethods = typeof dashboardApiMethods;
