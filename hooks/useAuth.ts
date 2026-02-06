"use client";

import { useCallback, useEffect, useRef } from 'react';
import useSWR from 'swr';
import axios, { ensureCsrfCookie } from '@/lib/axios'; // Folosim DOAR instanța configurată
import { apiClient } from '@/lib/api';
import { useAuthStore, type Company, type User } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';

type UseAuthOptions = {
  middleware?: string;
};

// --- HELPERE NORMALIZARE (Păstrate din codul tău) ---
const normalizeUser = (input: any): User | null => {
  if (!input) return null;

  const rest = { ...input };
  const fieldsToDelete = [
    'company', 'company_id', 'company_name', 'tax_id', 'trade_registry_number',
    'billing_address', 'billing_city', 'billing_state', 'billing_postal_code',
    'id_type', 'id_number', 'company_country', 'company_county', 'company_city',
    'company_zip', 'company_address', 'company_bank_iban', 'company_bank_bic',
    'company_bank_name', 'bank_currency'
  ];
  fieldsToDelete.forEach(field => delete rest[field]);

  const rawCompany = input.company;
  const companyFromObject = typeof rawCompany === 'object' && rawCompany !== null ? (rawCompany as Company) : null;
  const companyName = input.company_name ?? (typeof rawCompany === 'string' ? rawCompany : undefined) ?? companyFromObject?.name ?? null;

  const hasCompanyFields = companyFromObject ||
      [input.company_id, companyName].some(val => val !== undefined && val !== null && val !== '');

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

const resolveUserPayload = (payload: any): User | null => {
  if (!payload) return null;
  const candidate = payload.user ?? payload.data ?? payload;
  return normalizeUser(candidate);
};

// --- LOGICA DE AUTH ---

// Facem fetch fără token manual, Axios trimite cookie-ul automat
const fetchUser = async () => {
  const res = await axios.get('/auth/me');
  return res.data;
};

const requireCsrf = async () => {
  await ensureCsrfCookie();
};

export const useAuth = (_options: UseAuthOptions = {}) => {
  const router = useRouter();
  const { user, setUser, clear } = useAuthStore();

  // 1. SWR pentru User Data
  const {
    data: swrUser,
    error,
    mutate,
    isValidating,
  } = useSWR('/auth/me', fetchUser, {
    revalidateOnFocus: false,
    shouldRetryOnError: false, // Nu reîncerca la infinit dacă e 401
  });

  // 2. Sync cu Store-ul
  useEffect(() => {
    if (swrUser) {
      const normalized = resolveUserPayload(swrUser);
      if (normalized) {
        setUser(normalized);
      }
    }
  }, [swrUser, setUser]);

  // 3. Gestionare Erori (401/419)
  useEffect(() => {
    if (error instanceof AxiosError) {
      if (error.response?.status === 401 || error.response?.status === 419) {
        clear();
        // Nu mai e nevoie de apiClient.removeToken() daca mergem pe cookies
      }
    }
  }, [error, clear]);

  // --- ACTIONS ---

  const login = async (emailOrArgs: any, password?: string) => {
    try {
      const payload =
        typeof emailOrArgs === 'string'
          ? { email: emailOrArgs, password }
          : emailOrArgs ?? {};
      if (!payload?.email || !payload?.password) {
        throw new Error('Email and password are required');
      }
      await requireCsrf();
      const response = await axios.post('/auth/login', payload);

      const normalized = resolveUserPayload(response.data);
      if (normalized) setUser(normalized);

      await mutate(); // Revalidează userul
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      await requireCsrf();
      const response = await axios.post('/auth/register', userData);

      const normalized = resolveUserPayload(response.data);
      if (normalized) setUser(normalized);

      // Dacă backend-ul nu face auto-login după register, apelăm login manual
      // Dar de obicei Sanctum face login automat.
      await mutate();
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await axios.post('/auth/logout');
    } catch (error) {
      console.error('Logout error', error);
    } finally {
      clear();
      mutate(null, false);
      router.push('/auth/signin');
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...userData } as User;
    setUser(updated);
    // Aici ar trebui să faci și request-ul la API pentru update
    // await axios.patch('/users/profile', userData);
    await mutate();
  };

  // Refresh user manual
  const refreshUser = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const setUserLanguage = useCallback(
      async (language: string) => {
        if (!language) return null;
        try {
          const response = await axios.patch('/users/language', { lang: language });
          // Asumăm că endpoint-ul returnează userul actualizat sau succes
          await mutate(); // Reîmprospătăm userul complet
          return response.data;
        } catch (error) {
          console.error('Failed to update user language:', error);
          return null;
        }
      },
      [mutate]
  );

  const loading = (!user && !error && isValidating);

  return {
    user,
    loading,
    userLoading: loading, // Alias pentru compatibilitate
    login,
    register,
    logout,
    updateUser,
    refreshUser,
    setUserLanguage,
  };
};
