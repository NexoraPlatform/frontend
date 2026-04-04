import { normalizeUserBadgeCollection } from '@/lib/badges';

import type { ApiClientCore } from '../core';
import { normalizeProviderService } from '../normalizers';

export const providerApiMethods = {
  async getProviderProfileById(this: ApiClientCore, providerId: string) {
    return this.request<any>(`/users/providers/${providerId}`);
  },

  async getProviderProfile(this: ApiClientCore) {
    return this.request<any>('/users/providers/profile', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  async updateProviderProfile(this: ApiClientCore, profileData: any) {
    return this.request<any>('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  },

  async updateUserCompanyDetails(this: ApiClientCore, userCompanyDetails: any) {
    return this.request<any>('/users/update/company', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userCompanyDetails),
    });
  },

  async getCompanyManagers(
    this: ApiClientCore,
    companyId: string | number | undefined
  ) {
    const searchParams = new URLSearchParams();
    if (companyId) {
      searchParams.append('company_id', companyId.toString());
    }
    return this.request<any>(`/users/company/editors?${searchParams.toString()}`);
  },

  async searchUserForCompany(this: ApiClientCore, search: string) {
    const searchParams = new URLSearchParams();
    if (search) {
      searchParams.append('search', search);
    }

    return this.request<any>(`/users/company/search/users?${searchParams.toString()}`);
  },

  async getCompanyMembers(
    this: ApiClientCore,
    companyId: string | number | undefined
  ) {
    const searchParams = new URLSearchParams();
    if (companyId) {
      searchParams.append('company_id', companyId.toString());
    }

    return this.request<any>(`/users/company/members?${searchParams.toString()}`);
  },

  async updateCompanyEditorsOrOwnership(
    this: ApiClientCore,
    companyId: string | number | undefined,
    members: string[] | null | undefined,
    owner: string | null | undefined
  ) {
    const payload: Record<string, unknown> = {
      company_id: companyId,
    };

    if (members !== null && members !== undefined) {
      payload.editor_emails = members;
    }

    if (owner) {
      payload.transfer_owner_email = owner;
    }

    return this.request<any>('/users/company/access', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  },

  async uploadAvatar(this: ApiClientCore, file: File) {
    const formData = new FormData();
    formData.append('avatar', file);

    return this.request<any>('/users/avatar', {
      method: 'POST',
      body: formData,
      headers: {},
    });
  },

  async getProviderServices(this: ApiClientCore, providerId: string) {
    const response = await this.request<any>(`/users/providers/${providerId}/services`);
    const services = Array.isArray(response)
      ? response
      : Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.services)
          ? response.services
          : [];

    return services.map(normalizeProviderService);
  },

  async getProviderProfileByUrl(this: ApiClientCore, url: string) {
    return this.request<any>(`/provider/${url}`);
  },

  async getPublicUserBadges(this: ApiClientCore, userId: string | number) {
    const response = await this.request<any>(`/users/${userId}/badges`);
    return normalizeUserBadgeCollection(response);
  },

  async getPublicUserFeaturedBadges(this: ApiClientCore, userId: string | number) {
    const response = await this.request<any>(`/users/${userId}/featured-badges`);
    return normalizeUserBadgeCollection(response);
  },

  async getProviderUserNameByProfileUrl(this: ApiClientCore, profileUrl: string) {
    return this.request<any>(`/users/providers/${profileUrl}/name`);
  },
};

export type ProviderApiMethods = typeof providerApiMethods;
