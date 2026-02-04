"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { SessionProvider, useSession, signIn, signOut } from "next-auth/react";
import { apiClient } from '@/lib/api';
import { AccessRole } from "@/lib/access";

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
  stripe_account_id?: string;
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

  const permissions = input.permissions ?? input.permission_slugs;

  return {
    ...rest,
    id: input.id ? String(input.id) : input.id,
    company,
    permissions,
  } as User;
};

function AuthProviderInner({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession();
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('user_data');
      if (!stored) return null;
      return normalizeUser(JSON.parse(stored));
    } catch (error) {
      console.warn('Failed to parse stored user:', error);
      return null;
    }
  });

  const loading = status === "loading";
  const userLoading = loading || (status === "authenticated" && !user);

  useEffect(() => {
    if (session?.accessToken) {
      apiClient.setToken(session.accessToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', session.accessToken);
      }
    } else if (status === 'unauthenticated') {
      apiClient.removeToken();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
    }

    if (session?.user) {
      setUser((prev) => {
        // @ts-ignore
        const next = normalizeUser(session.user as User);
        if (!prev) return next;
        // Check IDs to replace user entirely if different
        if (prev.id && next?.id && String(prev.id) !== String(next.id)) {
          return next;
        }
        // Merge if same user
        return next ? { ...prev, ...next } : prev;
      });
    } else if (status === 'unauthenticated') {
      setUser(null);
    }
  }, [session, status]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (user) {
      localStorage.setItem('user_data', JSON.stringify(user));
    } else {
      localStorage.removeItem('user_data');
    }
  }, [user]);

  const login = async (email: string, password: string) => {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      throw new Error(result.error);
    }
  };

  const isRefreshing = useRef(false);
  const updateRef = useRef(update);

  useEffect(() => {
    updateRef.current = update;
  }, [update]);

  const refreshUser = useCallback(async () => {
    if (isRefreshing.current) return;
    isRefreshing.current = true;

    try {
      const freshUser = await apiClient.me();

      // FIX: Verificăm explicit dacă normalizeUser returnează null
      // în loc să folosim ?? {}, ceea ce cauza eroarea de tip
      const normalizedUser = normalizeUser(freshUser);

      if (!normalizedUser) {
        console.warn("Received invalid user data during refresh");
        return;
      }

      setUser(normalizedUser);

      const sameNullable = (left?: string | number | null, right?: string | number | null) =>
          (left ?? null) === (right ?? null);

      const sameCompany = (left?: Company | null, right?: Company | null) => {
        if (!left && !right) return true;
        if (!left || !right) return false;
        return (
            sameNullable(left.id ?? null, right.id ?? null) &&
            sameNullable(left.name ?? null, right.name ?? null) &&
            sameNullable(left.id_type ?? null, right.id_type ?? null) &&
            sameNullable(left.id_number ?? null, right.id_number ?? null) &&
            sameNullable(left.company_country ?? null, right.company_country ?? null) &&
            sameNullable(left.company_county ?? null, right.company_county ?? null) &&
            sameNullable(left.company_city ?? null, right.company_city ?? null) &&
            sameNullable(left.company_zip ?? null, right.company_zip ?? null) &&
            sameNullable(left.company_address ?? null, right.company_address ?? null) &&
            sameNullable(left.company_bank_iban ?? null, right.company_bank_iban ?? null) &&
            sameNullable(left.company_bank_bic ?? null, right.company_bank_bic ?? null) &&
            sameNullable(left.company_bank_name ?? null, right.company_bank_name ?? null) &&
            sameNullable(left.bank_currency ?? null, right.bank_currency ?? null) &&
            sameNullable(left.created_at ?? null, right.created_at ?? null) &&
            sameNullable(left.updated_at ?? null, right.updated_at ?? null)
        );
      };

      const companyChanged = !sameCompany(normalizedUser.company ?? null, session?.user?.company ?? null);

      const hasChanged =
          normalizedUser.firstName !== session?.user?.firstName ||
          normalizedUser.lastName !== session?.user?.lastName ||
          normalizedUser.role !== session?.user?.role ||
          normalizedUser.avatar !== session?.user?.avatar ||
          normalizedUser.email !== session?.user?.email ||
          normalizedUser.language !== session?.user?.language ||
          companyChanged;

      if (hasChanged) {
        await updateRef.current(normalizedUser);
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
    } finally {
      isRefreshing.current = false;
    }
  }, [
    session?.user?.firstName,
    session?.user?.lastName,
    session?.user?.role,
    session?.user?.avatar,
    session?.user?.email,
    session?.user?.language,
    session?.user?.company,
  ]);

  const lastRefreshedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      lastRefreshedUserIdRef.current = null;
      return;
    }
    if (status !== "authenticated") return;
    const sessionUserId = session?.user?.id ? String(session.user.id) : null;
    if (!sessionUserId) return;
    if (lastRefreshedUserIdRef.current === sessionUserId) return;
    lastRefreshedUserIdRef.current = sessionUserId;
    refreshUser().catch(() => { });
  }, [status, session?.user?.id, refreshUser]);

  const register = async (userData: any) => {
    try {
      await apiClient.register(userData);
      await login(userData.email, userData.password);
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
              .replace(/^ +/, "")
              .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
      }

      setUser(null);
      await signOut({ redirect: true, callbackUrl: '/auth/signin' });

    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = '/auth/signin';
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
      await update(userData);
    }
  };

  const setUserLanguage = useCallback(
    async (language: string) => {
      if (!language) return null;
      try {
        const updatedUser = await apiClient.updateUserLanguage(language);
        const normalizedUser = normalizeUser(updatedUser);

        if (!normalizedUser) {
          console.warn('Received invalid user data after language update');
          return null;
        }

        setUser(normalizedUser);
        await updateRef.current(normalizedUser);
        return normalizedUser;
      } catch (error) {
        console.error('Failed to update user language:', error);
        return null;
      }
    },
    [],
  );

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

  return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
      <SessionProvider>
        <AuthProviderInner>{children}</AuthProviderInner>
      </SessionProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
