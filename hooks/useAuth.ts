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
  company_data?: {
    legal_name?: string;
    commercial_name?: string;
    country_code?: string;
    registration_number?: string;
    tax_identification_number?: string;
    vat_number?: string;
    is_vat_registered?: boolean;
    default_currency?: string;
    registered_address_line_1?: string;
    registered_address_line_2?: string;
    registered_city?: string;
    registered_state?: string;
    registered_postal_code?: string;
    authorized_signatory_name?: string;
    authorized_signatory_title?: string;
    authorized_signatory_email?: string;
  };
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
