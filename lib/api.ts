const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://Trustorabe.dacars.ro/api';

export type RoleLite = {
  id: number;
  name: string;
  slug: string;
};

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;

    // Get token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }



  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  removeToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  private getSelectedLanguageFromPathname(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const pathnameLocale = window.location.pathname.split('/')[1];
    if (pathnameLocale === 'ro' || pathnameLocale === 'en') {
      return pathnameLocale;
    }

    const storedLocale = localStorage.getItem('NEXT_LOCALE');
    if (storedLocale) {
      return storedLocale;
    }

    const cookieLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('NEXT_LOCALE='))
      ?.split('=')[1];

    return cookieLocale ?? null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = new URL(`${this.baseURL}${endpoint}`);
    const selectedLanguage = this.getSelectedLanguageFromPathname();

    if (selectedLanguage && !url.searchParams.has('language')) {
      url.searchParams.set('language', selectedLanguage);
    }

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    };

    try {
      const response = await fetch(url.toString(), config);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return {} as T;
      }
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(credentials: { email: string; password: string }) {
    const response = await this.request<{
      access_token: string;
      user: any;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    this.setToken(response.access_token);
    return response;
  }

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: string;
  }) {
    const response = await this.request<{
      access_token: string;
      user: any;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    this.setToken(response.access_token);
    return response;
  }

  async getProfile() {
    return this.request<any>('/auth/profile');
  }

  async getTestExamsDetails() {
    return this.request<any>('/auth/test-exams-details');
  }

  async getTestResult(id: string) {
    return this.request<any>(`/test/result/${id}`);
  }

  async createEarlyAccessApplication(payload: {
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
  }) {
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
  }

  async verifyEarlyAccessApplication(payload: { code: string; language?: 'en' | 'ro' }) {
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
  }

  async resendEarlyAccessVerification(payload: {
    application_id: string;
    language?: 'en' | 'ro';
  }) {
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
  }

  async subscribeToNewsletter(payload: {
    email: string;
    user_type: 'client' | 'provider';
    name?: string;
    company?: string;
    language?: 'ro' | 'en';
  }) {
    return this.request<{
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
  }

  async unsubscribeFromNewsletter(token: string) {
    return this.request<{ unsubscribed: boolean }>('/newsletter/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  // Early access endpoints
  async getEarlyAccessGrouped(params?: { page?: number; per_page?: number }) {
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
  }

  // Services endpoints
  async getServices(params?: {
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
  }) {
    const searchParams = new URLSearchParams();
    const selectedLanguage =
        params?.language ?? this.getSelectedLanguageFromPathname();

    if (selectedLanguage) {
      searchParams.set('language', selectedLanguage);
    }

    const { language, ...restParams } = params || {};
    Object.entries(restParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v.toString()));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    const query = searchParams.toString();
    const endpoint = query ? `/services?${query}` : '/services';

    return this.request<any>(endpoint);
  }

  // Servicii disponibile pentru prestatori să se înscrie
  async getAvailableServicesForProvider(categoryId?: string) {
    const params = categoryId ? `?categoryId=${categoryId}` : '';
    return this.request<any>(`/services/available-for-providers${params}`);
  }

  async getAllServices() {
    return this.request<any>('/admin/services');
  }

  async getService(id: string) {
    return this.request<any>(`/services/${id}`);
  }

  async createService(serviceData: any) {
    return this.request<any>('/admin/services', {
      method: 'POST',
      body: JSON.stringify(serviceData),
    });
  }

  async updateService(id: string, serviceData: any) {
    return this.request<any>(`/admin/services/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(serviceData),
    });
  }

  async getServicesByCategoryId(categoryId: string) {
    return this.request<any>(`/services/category/${categoryId}`);
  }

  async getServicesGroupedByCategory() {
    return this.request<any>('/services/categories/grouped');
  }

  async deleteService(id: string) {
    return this.request<any>(`/admin/services/${id}`, {
      method: 'DELETE',
    });
  }

  async updateServiceStatus(serviceId: string, status: string) {
    return this.request<any>(`/admin/services/${serviceId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Service Provider endpoints
  async addServiceProvider(serviceId: string, providerData: any) {
    return this.request<any>(`/services/${serviceId}/providers`, {
      method: 'POST',
      body: JSON.stringify(providerData),
    });
  }

  async updateServiceProvider(serviceId: string, providerId: string, providerData: any) {
    return this.request<any>(`/services/${serviceId}/providers/${providerId}`, {
      method: 'PATCH',
      body: JSON.stringify(providerData),
    });
  }

  async removeServiceProvider(serviceId: string, providerId: string) {
    return this.request<any>(`/services/${serviceId}/providers/${providerId}`, {
      method: 'DELETE',
    });
  }

  // Categories endpoints
  async getCategories() {
    return this.request<any>('/categories');
  }

  async getMainCategories() {
    return this.request<any>('/categories/main');
  }

  async getAllCategories() {
    return this.request<any>('/admin/categories');
  }

  async getCategoryById(categoryId: any) {
    return this.request<any>('/admin/categories/' + categoryId, {
      method: 'GET',
    });
  }

  async getCategorySlugById(categoryId: any) {
    return this.request<any>(`/admin/categories/${categoryId}/slug`, {
      method: 'GET',
    });
  }

  async createCategory(categoryData: any) {
    return this.request<any>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }

  async updateCategory(id: string, categoryData: any) {
    return this.request<any>(`/admin/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(categoryData),
    });
  }

  async deleteCategory(id: string) {
    return this.request<any>(`/admin/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Users endpoints
  async getUsers(params?: any) {
    const searchParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v.toString()));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    return this.request<any>(`/admin/users?${searchParams.toString()}`);
  }

  async setSuperadmin(userId: number | string) {
    return this.request<any>(`/admin/access/users/${userId}/make-super`, {
      method: 'POST',
    })
  }

  async removeSuperadmin(userId: number | string) {
    return this.request<any>(`/admin/access/users/${userId}/remove-super`, {
      method: 'POST',
    })
  }

  async createRole(data: any) {
    return this.request<any>(`/admin/access/`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getPermissions() {
    return this.request<any>(`/admin/access/permissions`);
  }

  async allowUserPermission(userId: number, permissionSlug: string) {
    return this.request<any>(`/admin/access/${userId}/allow-permission`, {
      method: 'POST',
      body: JSON.stringify({permission: permissionSlug}),
    });
  }

  async denyUserPermission(userId: number, permissionSlug: string) {
    return this.request<any>(`/admin/access/${userId}/deny-permission`, {
      method: 'POST',
      body: JSON.stringify({permission: permissionSlug}),
    });
  }

    async removeUserPermission(userId: number, slug: string) {
        return this.request<any>(`/admin/access/${userId}/permissions`, {
            method: 'DELETE',
            body: JSON.stringify({permission: slug}),
        });

    }

  async getRole(roleId: number) {
    return this.request<any>(`/admin/access/${roleId}`);
  }

  async updateRole(roleId: number, data: any){
    return this.request<any>(`/admin/access/${roleId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updateRoleSortOrder(roleId: number, sortOrder: number) {
    return this.request<any>(`/admin/access/${roleId}/sort-order`, {
      method: 'PATCH',
      body: JSON.stringify({ sortOrder }),
    });
  }

  async createUser(userData: any) {
    return this.request<any>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getUserById(userId: number) {
    return this.request<any>(`/admin/users/${userId}`)
  }

  async updateUser(userId: number, userData: any){
    return this.request<any>(`/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ userData }),

    });
  }

  async deleteUser(userId: string) {
    return this.request<any>(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async getProviders(params?: any) {
    const searchParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v.toString()));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    return this.request<any>(`/users/providers?${searchParams.toString()}`);
  }

  async updateUserStatus(userId: string, status: string) {
    return this.request<any>(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Orders endpoints
  async getOrders(params?: any) {
    const searchParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request<any>(`/admin/orders?${searchParams.toString()}`);
  }

  async createOrder(orderData: any) {
    return this.request<any>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async updateOrder(id: string, orderData: any) {
    return this.request<any>(`/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(orderData),
    });
  }

  // Reviews endpoints
  async getReviews(params?: any) {
    const searchParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request<any>(`/reviews?${searchParams.toString()}`);
  }

  async createReview(reviewData: any) {
    return this.request<any>('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  }

  // Admin endpoints
  async getAdminStats() {
    return this.request<any>('/admin/stats');
  }

  // Search endpoints
  async globalSearch(query: string, filters?: any) {
    const searchParams = new URLSearchParams();
    searchParams.append('q', query);

    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v.toString()));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    return this.request<any>(`/search?${searchParams.toString()}`);
  }

  async getSearchSuggestions(query: string) {
    return this.request<any>(`/search/suggestions?q=${encodeURIComponent(query)}`);
  }

  async getTrendingSearches() {
    return this.request<any>('/search/trending');
  }

  async getCalls(params?: {
    serviceId?: string;
    user_id?: string;
    passed: number;
    date_time: string;
    test_result_id: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request<any>(`/admin/calls?${searchParams.toString()}`);
  }

  // Tests endpoints
  async getTests(params?: {
    serviceId?: string;
    level?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request<any>(`/admin/tests?${searchParams.toString()}`);
  }

  async getAvailableTests() {
    return this.request<any>('/tests/available');
  }

  async getTest(id: string) {
    return this.request<any>(`/tests/${id}`);
  }

  async findByServiceAndLevel(serviceId: string, level: string) {
    return this.request<any>(`/tests/service/${serviceId}/level/${level}`);
  }

  async createTest(testData: any) {
    return this.request<any>('/admin/tests', {
      method: 'POST',
      headers: {
      'Content-Type': 'application/json',
    ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
    },
      body: JSON.stringify(testData),
    });
  }

  async updateTest(id: string, testData: any) {
    return this.request<any>(`/tests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(testData),
    });
  }

  async deleteTest(id: string) {
    return this.request<any>(`/tests/${id}`, {
      method: 'DELETE',
    });
  }

  async updateCallStatus(callId: string, status: string, noteText: string | null) {
    return this.request<any>(`/admin/calls/${callId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note: noteText }),
    });
  }

  async updateTestStatus(testId: string, status: string) {
    return this.request<any>(`/tests/${testId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async takeTest(testId: string, testData: any) {
    return this.request<any>(`/tests/${testId}/take`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
      body: JSON.stringify(testData),
    });
  }

  async getTestResults(params?: {
    userId?: string;
    testId?: string;
    passed?: boolean;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request<any>(`/tests/results/all?${searchParams.toString()}`);
  }

  async getMyTestResults(params?: {
    testId?: string;
    passed?: boolean;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request<any>(`/tests/results/my?${searchParams.toString()}`);
  }

  async getTestStatistics(testId: string) {
    return this.request<any>(`/admin/tests/${testId}/statistics`);
  }

  // API pentru certificări
  async getCertifications(userId?: string) {
    const endpoint = userId ? `/certifications/${userId}` : '/certifications';
    return this.request<any>(endpoint);
  }

  async createCertification(certificationData: any) {
    return this.request<any>('/certifications', {
      method: 'POST',
      body: JSON.stringify(certificationData),
    });
  }

  // Provider Profile endpoints
  async getProviderProfileById(providerId: string) {
    return this.request<any>(`/users/providers/${providerId}`);
  }

  async getProviderProfile() {
    return this.request<any>(`/users/providers/profile`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
    });
  }

  async updateProviderProfile(profileData: any) {
    return this.request<any>('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
    });
  }

  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('avatar', file);

    return this.request<any>('/users/avatar', {
      method: 'POST',
      body: formData,
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
    });
  }

  async getProviderServices(providerId: string) {
    return this.request<any>(`/users/providers/${providerId}/services`);
  }

  async getProviderReviews(providerId: string, params?: {
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request<any>(`/reviews?revieweeId=${providerId}&${searchParams.toString()}`);
  }

  async getProviderPortfolio(providerId: string) {
    return this.request<any>(`/users/providers/${providerId}/portfolio`);
  }

  async getLanguages() {
    return this.request<any>('/languages');
  }

  async getProviderProfileByUrl(url: string) {
    return this.request<any>(`/provider/${url}`);
  }

  // Projects endpoints
  async getProjects(params?: {
    clientId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const searchParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    return this.request<any>(`/projects?${searchParams.toString()}`);
  }

  async getProjectBySlug(slug: string) {
    return this.request<any>(`/projects/slug/${slug}`);
  }

  async getPublicProjects(params?: {
    page?: number;
    search?: string;
    category?: string;
    technologies?: string[];
    budget_min?: number;
    budget_max?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      if (params.page !== undefined && params.page !== null) {
        searchParams.append('page', params.page.toString());
      }
      if (params.search) {
        searchParams.append('search', params.search);
      }
      if (params.category) {
        searchParams.append('category', params.category);
      }
      if (params.technologies && params.technologies.length > 0) {
        params.technologies.forEach((tech) => searchParams.append('technologies', tech));
      }
      if (params.budget_min !== undefined && params.budget_min !== null) {
        searchParams.append('budget_min', params.budget_min.toString());
      }
      if (params.budget_max !== undefined && params.budget_max !== null) {
        searchParams.append('budget_max', params.budget_max.toString());
      }
    }

    const query = searchParams.toString();
    return this.request<any>(`/projects${query ? `?${query}` : ''}`);
  }

  async getProviderProjectRequests() {
    return this.request<any>('/projects/requests', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
    });
  }

  async respondToProjectRequest(projectId: string, response: {
    response: 'ACCEPTED' | 'REJECTED' | 'NEW_PROPOSE';
    proposedBudget?: number;
  }) {
    return this.request<any>(`/projects/${projectId}/respond`, {
      method: 'POST',
      body: JSON.stringify(response),
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
    });
  }

  async getClientProjectRequests() {
    return this.request<any>('/projects/my-requests', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
    });
  }

  async respondToBudgetProposal(projectId: string, providerId: string, response: {
    response: 'ACCEPTED' | 'REJECTED';
  }) {
    return this.request<any>(`/projects/${projectId}/providers/${providerId}/budget-response`, {
      method: 'POST',
      body: JSON.stringify(response),
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
    });
  }

  async createProject(projectData: any) {
    return this.request<any>('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  async getProject(id: string) {
    return this.request<any>(`/projects/${id}`);
  }

  async updateProject(id: string, projectData: any) {
    return this.request<any>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(projectData),
    });
  }

  async deleteProject(id: string) {
    return this.request<any>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  async getClientProjects(clientId: string, limit?: number) {
    return this.request<any>(`/projects/client/${clientId}/${limit}`);
  }

  async getSuggestedProviders(
      services: { service: string; level: string }[]
  ) {

    return this.request<any>(`/providers/suggestions`, {
      method: 'POST',
      body: JSON.stringify({ services }),
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
    });
  }

  async getTechnologies() {
    return this.request<any>('/technologies');
  }

  async getTechnologiesByCategory(categoryId: string) {
    return this.request<any>(`/services/category/${categoryId}`);
  }

  async generateProjectInformation(projectData: any) {
    return this.request<any>('/projects/generate-information-by-ai', {
      method: 'POST',
      body: JSON.stringify(projectData),
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
    });
  }

  async updateLastActive() {
    return this.request<any>('/users/active', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        }
    });
  }

  async handleStripeOnboarding(email: string) {
    return this.request<any>('/stripe/onboard-link', {
      method: 'POST',
      body: JSON.stringify({email: email}),
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      }
    });
  }

  async getStripeAccountStatus() {
    return this.request<any>('/stripe/account-status', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      }
    });
  }

  // Notifications endpoints
  async getNotifications(params?: {
    unreadOnly?: boolean;
    type?: string;
    page?: number;
    limit?: number;
    cursor?: string; // <-- NOU, pt. cursor-based pagination
  }) {
    const sp = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        sp.append(key, String(value));
      }
    });
    return this.request<any>(`/notifications?${sp.toString()}`);
  }

  async markNotificationAsRead(notificationId: string) {
    return this.request<any>(`/notifications/${notificationId}/read`, {
      method: 'PATCH'
    });
  }

  async subscribeToNotifications(subscription: PushSubscription, navigator: Navigator) {
    return this.request<any>('/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        userAgent: navigator.userAgent
      })
    });
  }

  async unsubscribeFromNotifications() {
    return this.request<any>('/notifications/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      }
    });
  }

  async markAllNotificationsAsRead() {
    return this.request<any>('/notifications/read-all', {
      method: 'PATCH'
    });
  }

  async deleteNotification(notificationId: string) {
    return this.request<any>(`/notifications/${notificationId}`, {
      method: 'DELETE'
    });
  }

  async sendNotification(data: {
    userIds: string[];
    title: string;
    message: string;
    type: string;
    data?: any;
    webPushOnly?: boolean;
  }) {
    return this.request<any>('/notifications/send', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getPaymentLink(project_id: string) {
    return this.request<any>(`/stripe/payment/${project_id}`);
  }

  async getPaymentSession(project_id: string) {
    return this.request<any>(`/stripe/session/payment/${project_id}`);
  }

  async setPaymentIntent(project_id: string, pi: string) {
    return this.request<any>(`/stripe/payment-intent/${project_id}`, {
      method: 'POST',
      body: JSON.stringify({ payment_intent: pi }),
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
    });
  }

  async finishProject(project_id: string) {
    return this.request<any>(`/stripe/capture/payment/${project_id}`);
  }

  // Chat endpoints
  async getChatGroups() {
    return this.request<any>('/chat/groups');
  }

  async createChatGroup(groupData: {
    name: string;
    type: 'PROJECT' | 'PROVIDER_ONLY' | 'DIRECT';
    projectId?: string;
    participantIds: string[];
  }) {
    return this.request<any>('/chat/groups', {
      method: 'POST',
      body: JSON.stringify(groupData),
    });
  }

  async getChatMessages(groupId: string, page = 1, limit = 50) {
    return this.request<any>(`/chat/groups/${groupId}/messages?page=${page}&limit=${limit}`);
  }

  async sendChatMessage(groupId: string, content: string, attachments?: any[]) {
    return this.request<any>(`/chat/groups/${groupId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, attachments }),
    });
  }

  async editChatMessage(messageId: string, content: string) {
    return this.request<any>(`/chat/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
  }

  async deleteChatMessage(messageId: string) {
    return this.request<any>(`/chat/messages/${messageId}`, {
      method: 'DELETE',
    });
  }

  async markChatMessagesAsRead(groupId: string, messageId?: string) {
    return this.request<any>(`/chat/groups/${groupId}/read`, {
      method: 'POST',
      body: JSON.stringify({ messageId }),
    });
  }

  async joinChatGroup(groupId: string) {
    return this.request<any>(`/chat/groups/${groupId}/join`, {
      method: 'POST',
    });
  }

  async leaveChatGroup(groupId: string) {
    return this.request<any>(`/chat/groups/${groupId}/leave`, {
      method: 'POST',
    });
  }

  async getProviderUserNameByProfileUrl(profileUrl: string) {
    return this.request<any>(`/users/providers/${profileUrl}/name`);
  }

  async getProjectNameByProjectUrl(projectUrl: string) {
    return this.request<any>(`/project/${projectUrl}/name`);
  }

  async getRoles(params: {
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const sp = new URLSearchParams();
    if (params.search) sp.set('search', params.search);
    if (params.page) sp.set('page', String(params.page));
    if (params.pageSize) sp.set('page_size', String(params.pageSize)); // DRF-style
    const qs = sp.toString();
    return this.request<any>(`/admin/access/${qs ? `?${qs}` : ''}`, {
      method: 'GET',
    });
  }

  async getRolesLite() {
    const data = await this.request<any>('/admin/access?page_size=1000', { method: 'GET' });
    const results = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
    return results.map((r: any) => ({ id: r.id, name: r.name, slug: r.slug })) as RoleLite[];
  }

  async getRolePermissionSlugs(slug: string) {
    return this.request<any>(`/admin/access/slug/${slug}/permissions`)
  }

  async updateRolePermissionsBySlug(roleId: number, permissionSlugs: string[]) {
    return this.request<{ ok: boolean }>(`/admin/access/${roleId}/sync-permission`, {
      method: 'PUT',
      body: JSON.stringify({ permission_slugs: permissionSlugs }),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
    });
  }

  async updateRolePermissions(roleId: number, data: any) {
    return this.request<any>(`/admin/access/${roleId}/permissions`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteRole(roleId: number) {
    return this.request<any>(`/roles/${roleId}`, {
      method: 'DELETE',
    });
  }

}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
