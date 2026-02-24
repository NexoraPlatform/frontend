'use server';

import { serverRequest } from '@/lib/server/api';

export async function getCurrentUserAction(language?: string) {
  return serverRequest<any>('/auth/me', { method: 'GET', language });
}

export async function updateUserLanguageAction(language: string) {
  if (!language) {
    throw new Error('Language is required');
  }
  return serverRequest<any>('/users/language', {
    method: 'PATCH',
    body: { lang: language },
    language,
  });
}

export async function getProviderProfileAction(language?: string) {
  return serverRequest<any>('/users/providers/profile', { method: 'GET', language });
}

export async function updateProviderProfileAction(profileData: any, language?: string) {
  return serverRequest<any>('/users/profile', {
    method: 'PATCH',
    body: profileData,
    language,
  });
}

export async function rapydGetWalletBalanceAction(language?: string) {
  return serverRequest<any>('/rapyd/balance', { method: 'GET', language });
}

export async function rapydOnboardingAction(language?: string) {
  return serverRequest<any>('/rapyd/onboard', { method: 'POST', language });
}

export async function rapydCheckoutSessionAction(params: {
  projectId: string | number;
  currency: string;
  countryCode: string;
  milestoneId?: string | number | null;
  language?: string;
}) {
  const { projectId, currency, countryCode, milestoneId, language } = params;
  return serverRequest<any>(
    `/rapyd/checkout/${projectId}${milestoneId ? `/${milestoneId}` : ''}`,
    {
      method: 'POST',
      body: { currency, country: countryCode },
      language,
    }
  );
}

export async function rapydReleasePaymentAction(params: {
  projectId: string | number;
  milestoneId?: string | number | null;
  language?: string;
}) {
  const { projectId, milestoneId, language } = params;
  const payload = {
    project_id: projectId,
    ...(milestoneId !== undefined && milestoneId !== null ? { milestone_id: String(milestoneId) } : {}),
  };

  try {
    return await serverRequest<any>('/rapyd/release', {
      method: 'POST',
      body: payload,
      language,
    });
  } catch {
    return serverRequest<any>('/rapyd/escrow/release', {
      method: 'POST',
      body: payload,
      language,
    });
  }
}

export async function rapydCreatePayoutBankAction(params: {
  amount: number | string;
  currency?: string | null;
  language?: string;
}) {
  const { amount, currency, language } = params;
  return serverRequest<any>('/rapyd/payout/bank', {
    method: 'POST',
    body: {
      amount,
      ...(currency ? { currency } : {}),
    },
    language,
  });
}
