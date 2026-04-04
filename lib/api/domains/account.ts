import {
  normalizeBadgeDefinitionCollection,
  normalizeBadgeProgressCollection,
  normalizeBadgeRewardLogCollection,
  normalizeUserBadgeCollection,
  type BadgeDefinitionRecord,
  type BadgeProgressRecord,
  type BadgeRewardLogRecord,
  type UserBadgeRecord,
} from '@/lib/badges';

import type { ApiClientCore } from '../core';
import type { AuthApiResponse } from '../types';

export const accountApiMethods = {
  async login(this: ApiClientCore, credentials: { email: string; password: string }) {
    const response = await this.request<AuthApiResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    return response;
  },

  async me(this: ApiClientCore) {
    return this.request<any>('/auth/me', {
      method: 'GET',
    });
  },

  async getBadgeCatalog(this: ApiClientCore): Promise<BadgeDefinitionRecord[]> {
    const response = await this.request<any>('/badges/catalog');
    return normalizeBadgeDefinitionCollection(response);
  },

  async getMyBadges(this: ApiClientCore): Promise<UserBadgeRecord[]> {
    const response = await this.request<any>('/me/badges');
    return normalizeUserBadgeCollection(response);
  },

  async getMyBadgeProgress(this: ApiClientCore): Promise<BadgeProgressRecord[]> {
    const response = await this.request<any>('/me/badges/progress');
    return normalizeBadgeProgressCollection(response);
  },

  async getMyBadgeRewards(this: ApiClientCore): Promise<BadgeRewardLogRecord[]> {
    const response = await this.request<any>('/me/badges/rewards');
    return normalizeBadgeRewardLogCollection(response);
  },

  async register(
    this: ApiClientCore,
    userData: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
      role?: string;
      company_data?: {
        legal_name?: string;
        commercial_name?: string;
        country_code?: string;
        registration_number?: string;
        tax_identification_number?: string;
        vat_number?: string;
        is_vat_registered?: boolean;
        default_currency?: string;
        registered_address_line_1?: string;
        registered_address_line_2?: string;
        registered_city?: string;
        registered_state?: string;
        registered_postal_code?: string;
        authorized_signatory_name?: string;
        authorized_signatory_title?: string;
        authorized_signatory_email?: string;
      };
    }
  ) {
    const response = await this.request<AuthApiResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    return response;
  },

  async getProfile(this: ApiClientCore) {
    return this.request<any>('/auth/profile');
  },

  async getTestExamsDetails(this: ApiClientCore) {
    return this.request<any>('/auth/test-exams-details');
  },

  async getTestResult(this: ApiClientCore, id: string) {
    return this.request<any>(`/test/result/${id}`);
  },

  async createEarlyAccessApplication(
    this: ApiClientCore,
    payload: {
      user_type: 'client' | 'provider';
      email: string;
      language?: string;
      contact_name?: string;
      company_name?: string;
      hiring_needs?: string;
      typical_project_budget?: number;
      hire_frequency?: string;
      lost_money?: boolean;
      escrow_help?: boolean;
      full_name?: string;
      country?: string;
      primary_skill?: string;
      years_experience?: number;
      has_clients?: boolean;
      unpaid_work?: boolean;
      wants_escrow?: boolean;
      profile_note?: string;
    }
  ) {
    return this.request<{
      email_exists: boolean;
      application?: {
        id: number;
        user_type: 'client' | 'provider';
        full_name: string | null;
        contact_name: string | null;
        company_name: string | null;
        email: string;
        country: string | null;
        primary_skill: string | null;
        years_experience: number | null;
        has_clients: boolean | null;
        unpaid_work: boolean | null;
        wants_escrow: boolean | null;
        hiring_needs: string | null;
        typical_project_budget: number | null;
        hire_frequency: string | null;
        lost_money: boolean | null;
        escrow_help: boolean | null;
        score: number;
        created_at: string;
        updated_at: string;
      };
    }>('/early-access', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async verifyEarlyAccessApplication(
    this: ApiClientCore,
    payload: { code: string; language?: 'en' | 'ro' }
  ) {
    return this.request<{
      verified: boolean;
      expired?: boolean;
      message?: string;
      application?: {
        id: number;
        user_type: 'client' | 'provider';
        email: string;
        email_verification: boolean;
        email_verification_expired: boolean;
      };
    }>('/early-access/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async resendEarlyAccessVerification(
    this: ApiClientCore,
    payload: {
      application_id: string;
      language?: 'en' | 'ro';
    }
  ) {
    return this.request<{
      resent: boolean;
      verified?: boolean;
      message?: string;
      application?: {
        id: number;
        user_type: 'client' | 'provider';
        email: string;
        application_id: string;
        email_verification: boolean;
      };
    }>('/early-access/resend', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async subscribeToNewsletter(
    this: ApiClientCore,
    payload: {
      email: string;
      user_type: 'client' | 'provider';
      name?: string;
      company?: string;
      language?: 'ro' | 'en';
    }
  ) {
    return this.request<{
      success: boolean;
      data: {
        id: number;
        email: string;
        name: string | null;
        user_type: 'client' | 'provider';
        company: string | null;
        subscribed_at: string;
        unsubscribed_at: string | null;
        created_at: string;
        updated_at: string;
      };
    }>('/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async unsubscribeFromNewsletter(this: ApiClientCore, token: string) {
    return this.request<{ unsubscribed: boolean }>('/newsletter/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  async getNewsletterTemplates(this: ApiClientCore) {
    return this.request<{ templates: string[] }>('/newsletter/templates');
  },

  async getNewsletterTemplateContent(this: ApiClientCore, template: string) {
    return this.request<{ template: string; content: string }>(
      `/newsletter/templates/${template}`
    );
  },

  async sendNewsletter(
    this: ApiClientCore,
    payload: {
      template: string;
      subject: string;
      data?: Record<string, string>;
      user_type?: 'client' | 'provider';
      recipients?: string[];
      language?: 'ro' | 'en';
    }
  ) {
    return this.request<{ sent: number }>('/newsletter/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getNewsletterSubscribers(
    this: ApiClientCore,
    params?: { per_page?: number; only_active?: boolean }
  ) {
    const searchParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }
      if (typeof value === 'boolean') {
        searchParams.append(key, value ? 'true' : 'false');
      } else {
        searchParams.append(key, value.toString());
      }
    });

    const query = searchParams.toString();
    const endpoint = query ? `/newsletter?${query}` : '/newsletter';

    return this.request<{
      data: Array<{
        id: number;
        email: string;
        name: string | null;
        user_type: 'client' | 'provider';
        company: string | null;
        language: 'ro' | 'en';
        unsubscribe_token: string;
        subscribed_at: string;
        unsubscribed_at: string | null;
        created_at: string;
        updated_at: string;
      }>;
      pagination?: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
      };
    }>(endpoint);
  },

  async getEarlyAccessGrouped(
    this: ApiClientCore,
    params?: { page?: number; per_page?: number }
  ) {
    const searchParams = new URLSearchParams();

    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const query = searchParams.toString();
    const endpoint = query ? `/early-access/grouped?${query}` : '/early-access/grouped';

    return this.request<{
      providers: any[];
      clients: any[];
      pagination?: {
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
      };
    }>(endpoint);
  },

  async updateLastActive(this: ApiClientCore) {
    return this.request<any>('/users/active', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  async getCurrencies(this: ApiClientCore, search: string | null) {
    const searchParams = new URLSearchParams();

    if (search) {
      searchParams.set('search', search);
    }
    return this.request<any>(`/users/currencies?${searchParams.toString()}`);
  },

  async updateUserLanguage(this: ApiClientCore, language: string) {
    const params = new URLSearchParams();
    params.set('language', language);

    return this.request<any>(`/users/language?${params.toString()}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lang: language }),
      skipDefaultParams: true,
    });
  },
};

export type AccountApiMethods = typeof accountApiMethods;
