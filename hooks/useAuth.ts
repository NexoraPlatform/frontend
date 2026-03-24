'use client';

import { useAuth as useContextAuth } from '@/contexts/auth-context';

type LoginPayload = {
  email: string;
  password: string;
  rememberMe?: boolean;
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

export function useAuth() {
  const { user, loading, login: contextLogin, register: contextRegister, refreshUser } = useContextAuth();

  const login = async (payload: LoginPayload) => {
    await contextLogin(payload.email, payload.password, payload.rememberMe);
    return null;
  };

  const register = async (payload: RegisterPayload) => {
    await contextRegister(payload);
    return null;
  };

  return {
    user,
    error: undefined,
    isLoading: loading,
    loading,
    login,
    register,
    refreshUser,
  };
}
