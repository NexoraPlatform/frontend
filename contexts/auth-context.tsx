"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { apiClient } from '@/lib/api';
import { onApiUnauthorized } from '@/lib/fetch-client';
import { ensureCsrfCookie } from '@/lib/csrf';
import { AccessRole } from '@/lib/access';
import { useAuthStore } from '@/lib/stores/use-auth-store';
import type { ConnectedAccount } from '@/types/auth';

interface Company {
  id?: number | string;
  name?: string | null;
  id_type?: string | null;
  id_number?: string | null;
  company_country?: string | null;
  company_county?: string | null;
  company_city?: string | null;
  company_zip?: string | null;
  company_address?: string | null;
  company_bank_iban?: string | null;
  company_bank_bic?: string | null;
  company_bank_name?: string | null;
  bank_currency?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  email_verified_at?: string | null;
  avatar?: string | null;
  phone?: string | null;
  company?: Company | null;
  country_code?: string | null;
  website?: string | null;
  location?: string;
  language?: string;
  bio?: string;
  role?: string | null;
  role_slugs?: string[];
  permission_slugs?: string[];
  permissions?: string[];
  rating?: string | number;
  reviewCount?: number;
  status?: string;
  last_login_at?: string | null;
  last_active_at?: string | null;
  timezone?: string | null;
  created_at?: string;
  updated_at?: string;
  testVerified?: boolean;
  callVerified?: boolean;

  rapyd_wallet_id?: string;
  rapyd_contact_id?: string;
  is_online?: boolean;
  last_seen?: string | null;
  onesignal_player_id?: string | null;
  roles?: AccessRole[];
  profile_url?: string;
  is_superuser?: boolean;
  github_token?: string;
  github_refresh_token?: string | null;
  github_nickname?: string;
  connected_accounts?: ConnectedAccount[];
  user_permissions?: Record<string, any> | any[];
  oldest_work_experience?: string | null;
  next_available_job?: string | null;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  refreshUser: () => Promise<void>;
  loading: boolean;
  userLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  setUserLanguage: (language: string) => Promise<User | null>;
}

type AuthProviderProps = {
  children: React.ReactNode;
  initialUser?: User | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeUser = (input: any): User | null => {
  if (!input) return null;

  const rest = { ...input };
  delete rest.company;
  delete rest.company_id;
  delete rest.company_name;
  delete rest.tax_id;
  delete rest.trade_registry_number;
  delete rest.billing_address;
  delete rest.billing_city;
  delete rest.billing_state;
  delete rest.billing_postal_code;
  delete rest.id_type;
  delete rest.id_number;
  delete rest.company_country;
  delete rest.company_county;
  delete rest.company_city;
  delete rest.company_zip;
  delete rest.company_address;
  delete rest.company_bank_iban;
  delete rest.company_bank_bic;
  delete rest.company_bank_name;
  delete rest.bank_currency;
  delete rest.first_name;
  delete rest.last_name;
  delete rest.name;

  const rawCompany = input.company;
  const companyFromObject =
    typeof rawCompany === 'object' && rawCompany !== null
      ? (rawCompany as Company)
      : null;

  const companyName =
    input.company_name ??
    (typeof rawCompany === 'string' ? rawCompany : undefined) ??
    companyFromObject?.name ??
    null;

  const hasCompanyFields =
    companyFromObject ||
    [
      input.company_id,
      input.id_type,
      input.id_number,
      input.company_country,
      input.company_county,
      input.company_city,
      input.company_zip,
      input.company_address,
      input.company_bank_iban,
      input.company_bank_bic,
      input.company_bank_name,
      input.bank_currency,
      companyName,
    ].some((value) => value !== undefined && value !== null && value !== '');

  const company = hasCompanyFields
    ? {
      id: input.company_id ?? companyFromObject?.id ?? null,
      name: companyName,
      id_type: input.id_type ?? companyFromObject?.id_type ?? null,
      id_number: input.id_number ?? companyFromObject?.id_number ?? null,
      company_country: input.company_country ?? companyFromObject?.company_country ?? null,
      company_county: input.company_county ?? companyFromObject?.company_county ?? null,
      company_city: input.company_city ?? companyFromObject?.company_city ?? null,
      company_zip: input.company_zip ?? companyFromObject?.company_zip ?? null,
      company_address: input.company_address ?? companyFromObject?.company_address ?? null,
      company_bank_iban: input.company_bank_iban ?? companyFromObject?.company_bank_iban ?? null,
      company_bank_bic: input.company_bank_bic ?? companyFromObject?.company_bank_bic ?? null,
      company_bank_name: input.company_bank_name ?? companyFromObject?.company_bank_name ?? null,
      bank_currency: input.bank_currency ?? companyFromObject?.bank_currency ?? null,
      created_at: companyFromObject?.created_at ?? null,
      updated_at: companyFromObject?.updated_at ?? null,
    }
    : null;

  const fullName = typeof input.name === 'string' ? input.name.trim() : '';
  const [inferredFirstName = '', ...restNameParts] = fullName ? fullName.split(/\s+/) : [];
  const inferredLastName = restNameParts.join(' ');
  const firstName = input.firstName ?? input.first_name ?? inferredFirstName ?? '';
  const lastName = input.lastName ?? input.last_name ?? inferredLastName ?? '';
  const email = input.email ?? '';
  const id = input.id ?? input.user_id;
  const roleSlugsFromRoles = Array.isArray(input.roles)
    ? input.roles
      .map((role: any) =>
        typeof role === 'string'
          ? role
          : role?.slug ?? role?.name ?? null
      )
      .filter(Boolean)
      .map((role: string) => role.toLowerCase())
    : [];
  const roleSlugsFromPayload = Array.isArray(input.role_slugs)
    ? input.role_slugs
      .filter(Boolean)
      .map((role: string) => String(role).toLowerCase())
    : [];
  const roleSlugs = Array.from(new Set([...roleSlugsFromPayload, ...roleSlugsFromRoles]));
  const permissions = input.permissions ?? input.permission_slugs;

  return {
    ...rest,
    id: id !== undefined && id !== null ? String(id) : '',
    email,
    firstName,
    lastName,
    avatar: input.avatar ?? input.profile_photo_url ?? null,
    role: input.role ?? input.role_slug ?? null,
    role_slugs: roleSlugs,
    company,
    permissions,
  } as User;
};

const fetcher = async () => {
  const response = await fetch('/api/auth/me', {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const error = new Error('Failed to fetch authenticated user') as Error & {
      response?: { status: number };
    };
    error.response = { status: response.status };
    throw error;
  }

  const payload = await response.json().catch(() => null);
  return normalizeUser(payload?.user ?? payload);
};

export function AuthProvider({ children, initialUser = null }: AuthProviderProps) {
  const [initialUserSnapshot] = useState<User | null>(() => normalizeUser(initialUser));
  const user = useAuthStore((state) => state.user as User | null);
  const setUser = useAuthStore((state) => state.setUser as (next: User | null) => void);
  const [shouldFetchUser, setShouldFetchUser] = useState(true);
  const { mutate: mutateCache } = useSWRConfig();

  useEffect(() => {
    setUser(initialUserSnapshot);
  }, [initialUserSnapshot, setUser]);

  const swrKey = shouldFetchUser ? '/api/auth/me' : null;

  const { data, isLoading, mutate } = useSWR<User | null>(swrKey, fetcher, {
    fallbackData: initialUserSnapshot ?? undefined,
    revalidateOnMount: true,
    revalidateIfStale: true,
    revalidateOnFocus: false,
    shouldRetryOnError: false,
    onSuccess: (next) => {
      setUser(next ?? null);
      if (next) {
        return;
      }
      setShouldFetchUser(false);
    },
    onError: (error: any) => {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        setUser(null);
        setShouldFetchUser(false);
      }
    },
  });

  useEffect(() => {
    if (data === undefined) return;
    setUser(data ?? null);
  }, [data]);

  // Initialize CSRF cookie on app startup
  useEffect(() => {
    ensureCsrfCookie().catch((error) => {
      console.warn('Failed to initialize CSRF cookie:', error);
    });
  }, []);

  // Centralized sign-out trigger for transport-level 401 responses.
  useEffect(() => {
    const unsubscribe = onApiUnauthorized(() => {
      void mutateCache('/api/auth/me', null, false);
      setShouldFetchUser(false);
      setUser(null);
      void mutate(null, false);
    });

    return unsubscribe;
  }, [mutate, mutateCache]);

  const login = async (email: string, password: string) => {
    await fetch('/api/sanctum/csrf-cookie', { method: 'GET', credentials: 'include' });
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    let payload: any = null;
    try {
      payload = await response.clone().json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      let message = 'Login failed';
      try {
        message = payload?.message || payload?.error || message;
      } catch {
        // ignore
      }
      throw new Error(message);
    }

    const normalizedLoginUser = normalizeUser(payload?.user ?? null);

    setShouldFetchUser(true);

    if (normalizedLoginUser) {
      setUser(normalizedLoginUser);
      await mutateCache('/api/auth/me', normalizedLoginUser, false);
    }

    // Do not block navigation after login while user refresh is in flight.
    void (async () => {
      try {
        const refreshedUser = await fetcher();
        const resolvedUser = refreshedUser ?? normalizedLoginUser ?? null;
        await mutateCache('/api/auth/me', resolvedUser, false);
        setUser(resolvedUser);
        await mutate(resolvedUser, false);
      } catch (error) {
        if (!normalizedLoginUser) {
          console.error('Failed to load user after login:', error);
        }
      }
    })();
  };

  const register = async (userData: any) => {
    try {
      await fetch('/api/sanctum/csrf-cookie', { method: 'GET', credentials: 'include' });
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        let message = 'Registration failed';
        try {
          const data = await response.json();
          message = data?.message || data?.error || message;
        } catch {
          // ignore
        }
        throw new Error(message);
      }
      await login(userData.email, userData.password);
    } catch (error: any) {
      throw new Error(error?.message || 'Registration failed');
    }
  };

  const refreshUser = useCallback(async () => {
    if (!shouldFetchUser) return;
    await mutate();
  }, [mutate, shouldFetchUser]);

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await mutateCache('/api/auth/me', null, false);
      setShouldFetchUser(false);
      setUser(null);
      await mutate(null, false);
      const localeFromPath =
        typeof window !== 'undefined'
          ? window.location.pathname.split('/')[1]?.toLowerCase()
          : null;
      const hasLocalePrefix = localeFromPath === 'en' || localeFromPath === 'ro';
      window.location.href = hasLocalePrefix
        ? `/${localeFromPath}/auth/signin`
        : '/auth/signin';
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!user) return;
    const next = { ...user, ...userData } as User;
    setUser(next);
    await mutate(next, false);
  };

  const setUserLanguage = useCallback(
    async (language: string) => {
      if (!language) return null;
      try {
        const updatedUser = await apiClient.updateUserLanguage(language);
        const normalizedUser = normalizeUser(updatedUser?.user ?? updatedUser);

        if (!normalizedUser) {
          console.warn('Received invalid user data after language update');
          const refreshed = await mutate();
          const normalizedRefreshed = normalizeUser(refreshed);
          if (normalizedRefreshed) {
            setUser(normalizedRefreshed);
            return normalizedRefreshed;
          }
          return null;
        }

        setUser(normalizedUser);
        await mutate(normalizedUser, false);
        return normalizedUser;
      } catch (error) {
        console.error('Failed to update user language:', error);
        return null;
      }
    },
    [mutate],
  );

  const isHydratingUser = shouldFetchUser && (isLoading || data === undefined);
  const loading = isHydratingUser;
  const userLoading = isHydratingUser && !user;

  const value: AuthContextType = {
    user,
    loading,
    userLoading,
    login,
    refreshUser,
    register,
    logout,
    updateUser,
    setUserLanguage,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
