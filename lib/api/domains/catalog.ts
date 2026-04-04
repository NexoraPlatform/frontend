import type { ApiClientCore } from '../core';
import { extractAdminServiceCategory, normalizeAdminServiceCategoryListResponse } from '../normalizers';
import type {
  AdminServiceCategoryContractType,
  AdminServiceCategoryPayload,
  AdminServiceCategorySortField,
  LegalClauseContent,
} from '../types';

export const catalogApiMethods = {
  async getServices(
    this: ApiClientCore,
    params?: {
      search?: string;
      categoryId?: string;
      minPrice?: number;
      maxPrice?: number;
      minRating?: number;
      skills?: string[];
      location?: string;
      sortBy?: string;
      page?: number;
      limit?: number;
      language?: string;
    }
  ) {
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

    const query = searchParams.toString();
    const endpoint = query ? `/services?${query}` : '/services';

    return this.request<any>(endpoint);
  },

  async getPopularServices(this: ApiClientCore) {
    return this.request<any>('/services/popular');
  },

  async getAvailableServicesForProvider(this: ApiClientCore, categoryId?: string) {
    const params = categoryId ? `?categoryId=${categoryId}` : '';
    return this.request<any>(`/services/available-for-providers${params}`);
  },

  async getAllServices(this: ApiClientCore) {
    return this.request<any>('/admin/services');
  },

  async getService(this: ApiClientCore, id: string) {
    return this.request<any>(`/services/${id}`);
  },

  async getDeliveryProviders(this: ApiClientCore) {
    return this.request<any>('/general/delivery-providers');
  },

  async createService(this: ApiClientCore, serviceData: any) {
    return this.request<any>('/admin/services', {
      method: 'POST',
      body: JSON.stringify(serviceData),
    });
  },

  async updateService(this: ApiClientCore, id: string, serviceData: any) {
    return this.request<any>(`/admin/services/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(serviceData),
    });
  },

  async getServicesByCategoryId(this: ApiClientCore, categoryId: string) {
    return this.request<any>(`/services/category/${categoryId}`);
  },

  async getServicesGroupedByCategory(
    this: ApiClientCore,
    params?: { page?: number; limit?: number; search?: string }
  ) {
    const searchParams = new URLSearchParams();
    if (params) {
      if (typeof params.page === 'number' && Number.isFinite(params.page) && params.page > 0) {
        searchParams.set('page', String(params.page));
      }
      if (typeof params.limit === 'number' && Number.isFinite(params.limit) && params.limit > 0) {
        searchParams.set('limit', String(params.limit));
      }
      if (typeof params.search === 'string' && params.search.trim().length > 0) {
        searchParams.set('search', params.search.trim());
      }
    }

    const query = searchParams.toString();
    const endpoint = query
      ? `/services/categories/grouped?${query}`
      : '/services/categories/grouped';

    return this.request<any>(endpoint);
  },

  async deleteService(this: ApiClientCore, id: string) {
    return this.request<any>(`/admin/services/${id}`, {
      method: 'DELETE',
    });
  },

  async updateServiceStatus(this: ApiClientCore, serviceId: string, status: string) {
    return this.request<any>(`/admin/services/${serviceId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async addServiceProvider(this: ApiClientCore, serviceId: string, providerData: any) {
    return this.request<any>(`/services/${serviceId}/providers`, {
      method: 'POST',
      body: JSON.stringify(providerData),
    });
  },

  async updateServiceProvider(
    this: ApiClientCore,
    serviceId: string,
    providerId: string,
    providerData: any
  ) {
    return this.request<any>(`/services/${serviceId}/providers/${providerId}`, {
      method: 'PATCH',
      body: JSON.stringify(providerData),
    });
  },

  async removeServiceProvider(
    this: ApiClientCore,
    serviceId: string,
    providerId: string
  ) {
    return this.request<any>(`/services/${serviceId}/providers/${providerId}`, {
      method: 'DELETE',
    });
  },

  async getCategories(this: ApiClientCore) {
    return this.request<any>('/categories');
  },

  async getMainCategories(this: ApiClientCore) {
    return this.request<any>('/categories/main');
  },

  async getAllCategories(this: ApiClientCore) {
    return this.request<any>('/admin/categories');
  },

  async getCategoryById(this: ApiClientCore, categoryId: any) {
    return this.request<any>(`/admin/categories/${categoryId}`, {
      method: 'GET',
    });
  },

  async getCategorySlugById(this: ApiClientCore, categoryId: any) {
    return this.request<any>(`/admin/categories/${categoryId}/slug`, {
      method: 'GET',
    });
  },

  async createCategory(this: ApiClientCore, categoryData: any) {
    return this.request<any>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  },

  async updateCategory(this: ApiClientCore, id: string, categoryData: any) {
    return this.request<any>(`/admin/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(categoryData),
    });
  },

  async deleteCategory(this: ApiClientCore, id: string) {
    return this.request<any>(`/admin/categories/${id}`, {
      method: 'DELETE',
    });
  },

  async getAdminLegalServiceCategories(
    this: ApiClientCore,
    params?: {
      search?: string;
      service_group?: string;
      default_contract_type?: AdminServiceCategoryContractType;
      ip_transfer_expected?: boolean;
      dpa_required_by_default?: boolean;
      personal_data_processing_likely?: boolean;
      service_levels_required?: boolean;
      regulated_activity_risk?: boolean;
      export_control_risk?: boolean;
      is_active?: boolean;
      sort_by?: AdminServiceCategorySortField;
      page?: number;
    }
  ) {
    const searchParams = new URLSearchParams();

    if (params) {
      if (params.search) searchParams.append('search', params.search);
      if (params.service_group) searchParams.append('service_group', params.service_group);
      if (params.default_contract_type) {
        searchParams.append('default_contract_type', params.default_contract_type);
      }
      if (params.ip_transfer_expected !== undefined) {
        searchParams.append('ip_transfer_expected', String(params.ip_transfer_expected));
      }
      if (params.dpa_required_by_default !== undefined) {
        searchParams.append(
          'dpa_required_by_default',
          String(params.dpa_required_by_default)
        );
      }
      if (params.personal_data_processing_likely !== undefined) {
        searchParams.append(
          'personal_data_processing_likely',
          String(params.personal_data_processing_likely)
        );
      }
      if (params.service_levels_required !== undefined) {
        searchParams.append(
          'service_levels_required',
          String(params.service_levels_required)
        );
      }
      if (params.regulated_activity_risk !== undefined) {
        searchParams.append(
          'regulated_activity_risk',
          String(params.regulated_activity_risk)
        );
      }
      if (params.export_control_risk !== undefined) {
        searchParams.append('export_control_risk', String(params.export_control_risk));
      }
      if (params.is_active !== undefined) {
        searchParams.append('is_active', String(params.is_active));
      }
      if (params.sort_by) searchParams.append('sort_by', params.sort_by);
      if (params.page) searchParams.append('page', String(params.page));
    }

    const qs = searchParams.toString();
    const response = await this.request<any>(
      `/admin/legal/service-categories${qs ? `?${qs}` : ''}`
    );
    return normalizeAdminServiceCategoryListResponse(response);
  },

  async getAdminLegalServiceCategory(
    this: ApiClientCore,
    categoryId: string | number
  ) {
    const response = await this.request<any>(`/admin/legal/service-categories/${categoryId}`);
    return extractAdminServiceCategory(response);
  },

  async createAdminLegalServiceCategory(
    this: ApiClientCore,
    payload: AdminServiceCategoryPayload
  ) {
    const response = await this.request<any>('/admin/legal/service-categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return extractAdminServiceCategory(response) ?? response;
  },

  async updateAdminLegalServiceCategory(
    this: ApiClientCore,
    categoryId: string | number,
    payload: Partial<AdminServiceCategoryPayload>
  ) {
    const response = await this.request<any>(`/admin/legal/service-categories/${categoryId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    return extractAdminServiceCategory(response) ?? response;
  },

  async deleteAdminLegalServiceCategory(
    this: ApiClientCore,
    categoryId: string | number
  ) {
    return this.request<any>(`/admin/legal/service-categories/${categoryId}`, {
      method: 'DELETE',
    });
  },

  async getAdminLegalClauses(
    this: ApiClientCore,
    params?: {
      search?: string;
      category?: string;
      identifier?: string;
      sort_by?: 'identifier' | 'category' | 'created_at' | 'updated_at';
      sort_dir?: 'asc' | 'desc';
      per_page?: number;
      page?: number;
      lang?: string;
    }
  ) {
    const searchParams = new URLSearchParams();
    if (params) {
      if (params.search) searchParams.append('search', params.search);
      if (params.category) searchParams.append('category', params.category);
      if (params.identifier) searchParams.append('identifier', params.identifier);
      if (params.sort_by) searchParams.append('sort_by', params.sort_by);
      if (params.sort_dir) searchParams.append('sort_dir', params.sort_dir);
      if (params.per_page) searchParams.append('per_page', params.per_page.toString());
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.lang) searchParams.append('lang', params.lang);
    }
    const qs = searchParams.toString();
    return this.request<any>(`/admin/legal/clauses${qs ? `?${qs}` : ''}`);
  },

  async getAdminLegalClause(
    this: ApiClientCore,
    clauseId: string | number,
    language?: string
  ) {
    return this.request<any>(`/admin/legal/clauses/${clauseId}?lang=${language ?? 'ro'}`);
  },

  async getAdminLegalClauseCategory(this: ApiClientCore) {
    return this.request<any>('/admin/legal/clauses/category');
  },

  async createAdminLegalClause(
    this: ApiClientCore,
    payload: {
      identifier: string;
      category: string;
      content: LegalClauseContent;
    }
  ) {
    return this.request<any>('/admin/legal/clauses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateAdminLegalClause(
    this: ApiClientCore,
    clauseId: string | number,
    payload: {
      identifier?: string;
      category?: string;
      content?: LegalClauseContent;
    }
  ) {
    return this.request<any>(`/admin/legal/clauses/${clauseId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteAdminLegalClause(this: ApiClientCore, clauseId: string | number) {
    return this.request<any>(`/admin/legal/clauses/${clauseId}`, {
      method: 'DELETE',
    });
  },

  async getLanguages(this: ApiClientCore) {
    return this.request<any>('/languages');
  },

  async getTechnologiesByCategory(this: ApiClientCore, categoryId: string) {
    return this.request<any>(`/services/category/${categoryId}`);
  },
};

export type CatalogApiMethods = typeof catalogApiMethods;
