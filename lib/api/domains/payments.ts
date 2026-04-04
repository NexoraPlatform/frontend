import type { ApiClientCore } from '../core';

export const paymentApiMethods = {
  async createEscrowCustomer(this: ApiClientCore, language?: string) {
    const params = new URLSearchParams();
    if (language) params.set('language', language);
    const qs = params.toString();
    return this.request<{ success?: boolean; message?: string; error?: string }>(
      `/escrow/create-customer${qs ? `?${qs}` : ''}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  },

  async rapydOnboarding(this: ApiClientCore, language?: string) {
    const params = new URLSearchParams();
    if (language) params.set('language', language);
    const qs = params.toString();
    return this.request<any>(`/rapyd/onboard${qs ? `?${qs}` : ''}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  async rapydCheckoutSession(
    this: ApiClientCore,
    projectId: string | number,
    currency: string,
    countryCode: string,
    milestoneId?: string | number,
    language?: string
  ) {
    const params = new URLSearchParams();
    if (language) params.set('language', language);
    const qs = params.toString();
    const milestoneSegment =
      milestoneId !== undefined && milestoneId !== null ? `/${milestoneId}` : '';
    return this.request<any>(
      `/rapyd/checkout/${projectId}${milestoneSegment}${qs ? `?${qs}` : ''}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currency, country: countryCode }),
      }
    );
  },

  async rapydReleasePayment(
    this: ApiClientCore,
    projectId: string | number,
    milestoneId?: string | number,
    language?: string
  ) {
    const params = new URLSearchParams();
    if (language) params.set('language', language);
    const qs = params.toString();
    const requestBody = {
      project_id: projectId,
      ...(milestoneId !== undefined && milestoneId !== null
        ? { milestone_id: String(milestoneId) }
        : {}),
    };

    try {
      return await this.request<any>(`/rapyd/release${qs ? `?${qs}` : ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
    } catch {
      return this.request<any>(`/rapyd/escrow/release${qs ? `?${qs}` : ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
    }
  },

  async rapydGetWalletBalance(this: ApiClientCore, language?: string) {
    const qs = language ? `?language=${encodeURIComponent(language)}` : '';
    return this.request<any>(`/rapyd/balance${qs}`);
  },

  async rapydCreatePayoutBank(
    this: ApiClientCore,
    amount: number | string,
    currency?: string | null,
    language?: string
  ) {
    const params = new URLSearchParams();
    if (language) params.set('language', language);
    const qs = params.toString();
    return this.request<any>(`/rapyd/payout/bank${qs ? `?${qs}` : ''}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        ...(currency ? { currency } : {}),
      }),
    });
  },
};

export type PaymentApiMethods = typeof paymentApiMethods;
