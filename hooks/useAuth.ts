'use client';

import useSWR from 'swr';
import axios from '@/lib/axios';

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: string;
  company_name?: string;
  tax_id?: string;
  trade_registry_number?: string;
  billing_address?: string;
  billing_city?: string;
  billing_state?: string;
  billing_postal_code?: string;
};

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export function useAuth() {
  const { data, error, isLoading, mutate } = useSWR('/api/auth/me', fetcher);
  const user = (data as any)?.user ?? data ?? null;

  const login = async (payload: LoginPayload) => {
    await axios.get('/sanctum/csrf-cookie');
    const response = await axios.post('/auth/login', payload);
    await mutate();
    return response.data;
  };

  const register = async (payload: RegisterPayload) => {
    await axios.get('/sanctum/csrf-cookie');
    const response = await axios.post('/auth/register', payload);
    await mutate();
    return response.data;
  };

  return {
    user,
    error,
    isLoading,
    loading: isLoading,
    login,
    register,
    refreshUser: mutate,
  };
}
