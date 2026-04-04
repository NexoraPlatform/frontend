import type { ApiClientCore } from '../core';

export const testsApiMethods = {
  async getTests(
    this: ApiClientCore,
    params?: {
      serviceId?: string;
      level?: string;
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

    return this.request<any>(`/admin/tests?${searchParams.toString()}`);
  },

  async getTest(this: ApiClientCore, id: string) {
    return this.request<any>(`/tests/${id}`);
  },

  async findByServiceAndLevel(
    this: ApiClientCore,
    serviceId: string,
    level: string,
    lang?: string
  ) {
    return this.request<any>(`/tests/service/${serviceId}/level/${level}`, {
      params: lang ? { lang } : undefined,
      skipDefaultParams: true,
    });
  },

  async findLevelUpgradeTest(
    this: ApiClientCore,
    serviceId: string,
    level: string,
    lang?: string
  ) {
    return this.request<any>(`/tests/service/${serviceId}/level-up/${level}`, {
      params: lang ? { lang } : undefined,
      skipDefaultParams: true,
    });
  },

  async getTestRequestStatus(this: ApiClientCore, requestId: string) {
    return this.request<any>(`/tests/requests/${requestId}`);
  },

  async createTest(this: ApiClientCore, testData: any) {
    return this.request<any>('/admin/tests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
  },

  async updateTest(this: ApiClientCore, id: string, testData: any) {
    return this.request<any>(`/tests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(testData),
    });
  },

  async deleteTest(this: ApiClientCore, id: string) {
    return this.request<any>(`/tests/${id}`, {
      method: 'DELETE',
    });
  },

  async updateCallStatus(
    this: ApiClientCore,
    callId: string,
    status: string,
    noteText: string | null
  ) {
    return this.request<any>(`/admin/calls/${callId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note: noteText }),
    });
  },

  async updateTestStatus(this: ApiClientCore, testId: string, status: string) {
    return this.request<any>(`/tests/${testId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async takeTest(this: ApiClientCore, testId: string, testData: any) {
    return this.request<any>(`/tests/${testId}/take`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });
  },

  async logExamViolation(
    this: ApiClientCore,
    payload: {
      testId: string | number;
      type: 'minor' | 'critical';
      reason: string;
    }
  ) {
    return this.request<any>('/exams/violation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        test_id: payload.testId,
        type: payload.type,
        reason: payload.reason,
      }),
    });
  },

  async getTestResults(
    this: ApiClientCore,
    params?: {
      userId?: string;
      testId?: string;
      passed?: boolean;
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

    return this.request<any>(`/tests/results/all?${searchParams.toString()}`);
  },

  async getMyTestResults(
    this: ApiClientCore,
    params?: {
      testId?: string;
      passed?: boolean;
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

    return this.request<any>(`/tests/results/my?${searchParams.toString()}`);
  },

  async getTestStatistics(this: ApiClientCore, testId: string) {
    return this.request<any>(`/admin/tests/${testId}/statistics`);
  },

  async getCertifications(this: ApiClientCore, userId?: string) {
    const endpoint = userId ? `/certifications/${userId}` : '/certifications';
    return this.request<any>(endpoint);
  },

  async createCertification(this: ApiClientCore, certificationData: any) {
    return this.request<any>('/certifications', {
      method: 'POST',
      body: JSON.stringify(certificationData),
    });
  },
};

export type TestsApiMethods = typeof testsApiMethods;
