import type { ApiClientCore } from '../core';
import type {
  AuditLogFilters,
  AuditLogResponse,
  RoleLite,
} from '../types';

export const adminApiMethods = {
  async getUsers(this: ApiClientCore, params?: any) {
    const searchParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v) => searchParams.append(key, v.toString()));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    return this.request<any>(`/admin/users?${searchParams.toString()}`);
  },

  async setSuperadmin(this: ApiClientCore, userId: number | string) {
    return this.request<any>(`/admin/access/users/${userId}/make-super`, {
      method: 'POST',
    });
  },

  async removeSuperadmin(this: ApiClientCore, userId: number | string) {
    return this.request<any>(`/admin/access/users/${userId}/remove-super`, {
      method: 'POST',
    });
  },

  async createRole(this: ApiClientCore, data: any) {
    return this.request<any>('/admin/access/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getPermissions(this: ApiClientCore) {
    return this.request<any>('/admin/access/permissions');
  },

  async allowUserPermission(
    this: ApiClientCore,
    userId: number,
    permissionSlug: string
  ) {
    return this.request<any>(`/admin/access/${userId}/allow-permission`, {
      method: 'POST',
      body: JSON.stringify({ permission: permissionSlug }),
    });
  },

  async denyUserPermission(
    this: ApiClientCore,
    userId: number,
    permissionSlug: string
  ) {
    return this.request<any>(`/admin/access/${userId}/deny-permission`, {
      method: 'POST',
      body: JSON.stringify({ permission: permissionSlug }),
    });
  },

  async removeUserPermission(this: ApiClientCore, userId: number, slug: string) {
    return this.request<any>(`/admin/access/${userId}/permissions`, {
      method: 'DELETE',
      body: JSON.stringify({ permission: slug }),
    });
  },

  async getRole(this: ApiClientCore, roleId: number) {
    return this.request<any>(`/admin/access/${roleId}`);
  },

  async updateRole(this: ApiClientCore, roleId: number, data: any) {
    return this.request<any>(`/admin/access/${roleId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async updateRoleSortOrder(
    this: ApiClientCore,
    roleId: number,
    sortOrder: number
  ) {
    return this.request<any>(`/admin/access/${roleId}/sort-order`, {
      method: 'PATCH',
      body: JSON.stringify({ sortOrder }),
    });
  },

  async createUser(this: ApiClientCore, userData: any) {
    return this.request<any>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async getUserById(this: ApiClientCore, userId: number) {
    return this.request<any>(`/admin/users/${userId}`);
  },

  async updateUser(this: ApiClientCore, userId: number, userData: any) {
    return this.request<any>(`/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  },

  async deleteUser(this: ApiClientCore, userId: string) {
    return this.request<any>(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  },

  async updateUserStatus(this: ApiClientCore, userId: string, status: string) {
    return this.request<any>(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async getAdminStats(this: ApiClientCore) {
    return this.request<any>('/admin/stats');
  },

  async globalSearch(this: ApiClientCore, query: string, filters?: any) {
    const searchParams = new URLSearchParams();
    searchParams.append('q', query);

    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v) => searchParams.append(key, v.toString()));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    return this.request<any>(`/search?${searchParams.toString()}`);
  },

  async getTrendingSearches(this: ApiClientCore) {
    return this.request<any>('/search/trending');
  },

  async getCalls(
    this: ApiClientCore,
    params?: {
      serviceId?: string;
      user_id?: string;
      passed: number;
      date_time: string;
      test_result_id: string;
      status?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const searchParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request<any>(`/admin/calls?${searchParams.toString()}`);
  },

  async getRoles(
    this: ApiClientCore,
    params: {
      search?: string;
      page?: number;
      pageSize?: number;
    }
  ) {
    const sp = new URLSearchParams();
    if (params.search) sp.set('search', params.search);
    if (params.page) sp.set('page', String(params.page));
    if (params.pageSize) sp.set('page_size', String(params.pageSize));
    const qs = sp.toString();
    return this.request<any>(`/admin/access/${qs ? `?${qs}` : ''}`, {
      method: 'GET',
    });
  },

  async getRolesLite(this: ApiClientCore) {
    const data = await this.request<any>('/admin/access?page_size=1000', {
      method: 'GET',
    });
    const results = Array.isArray(data)
      ? data
      : Array.isArray(data?.results)
        ? data.results
        : [];
    return results.map((r: any) => ({ id: r.id, name: r.name, slug: r.slug })) as RoleLite[];
  },

  async getRolePermissionSlugs(this: ApiClientCore, slug: string) {
    return this.request<any>(`/admin/access/slug/${slug}/permissions`);
  },

  async updateRolePermissionsBySlug(
    this: ApiClientCore,
    roleId: number,
    permissionSlugs: string[]
  ) {
    return this.request<{ ok: boolean }>(`/admin/access/${roleId}/sync-permission`, {
      method: 'PUT',
      body: JSON.stringify({ permission_slugs: permissionSlugs }),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  },

  async updateRolePermissions(this: ApiClientCore, roleId: number, data: any) {
    return this.request<any>(`/admin/access/${roleId}/permissions`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteRole(this: ApiClientCore, roleId: number) {
    return this.request<any>(`/roles/${roleId}`, {
      method: 'DELETE',
    });
  },

  async fetchAuditLogs(this: ApiClientCore, filters: AuditLogFilters) {
    const searchParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    const query = searchParams.toString();
    const endpoint = query ? `/admin/audit-logs?${query}` : '/admin/audit-logs';

    return this.request<AuditLogResponse>(endpoint);
  },
};

export type AdminApiMethods = typeof adminApiMethods;
