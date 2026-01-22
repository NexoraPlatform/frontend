"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { SessionProvider, useSession, signIn, signOut } from "next-auth/react";
import { apiClient } from '@/lib/api';
import { AccessRole } from "@/lib/access";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  location?: string;
  language?: string;
  bio?: string;
  role?: string;
  avatar?: string;
  testVerified?: boolean;
  callVerified?: boolean;
  stripe_account_id?: string;
  roles?: AccessRole[];
  permissions?: string[];
  is_superuser?: boolean;
  github_token?: string;
  github_nickname?: string;
}

interface AuthContextType {
  user: User | null;
  me: () => void;
  loading: boolean;
  userLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthProviderInner({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession();
  const [user, setUser] = useState<User | null>(null);

  const loading = status === "loading";
  const userLoading = loading || (status === "authenticated" && !user);

  useEffect(() => {
    if (session?.accessToken) {
      apiClient.setToken(session.accessToken);
    } else {
      apiClient.removeToken();
    }

    if (session?.user) {
      // @ts-ignore
      setUser(session.user);
    } else {
      setUser(null);
    }
  }, [session]);

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

  const me = async () => {
    const user = await apiClient.me();
    setUser(user);
  };

  const register = async (userData: any) => {
    // NextAuth doesn't natively handle registration, we usually call API then login
    try {
      await apiClient.register(userData);
      // auto login after register
      await login(userData.email, userData.password);
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      // 1. Ștergem token-ul de autentificare pentru API (Laravel)
      // Verifică în 'lib/api.ts' sau unde salvezi tokenul dacă cheia e 'auth_token' sau alta
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data'); // Dacă salvezi și userul aici

        // 2. (Opțional) Ștergere cookie-uri custom
        // Dacă ai setat manual cookie-uri folosind js-cookie sau document.cookie
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
              .replace(/^ +/, "")
              .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
      }

      // 3. Resetăm starea React
      setUser(null);

      // 4. Deconectare NextAuth
      // Aceasta șterge automat cookie-ul 'next-auth.session-token'
      await signOut({ redirect: true, callbackUrl: '/auth/signin' });

    } catch (error) {
      console.error("Logout error:", error);
      // Fallback în caz de eroare
      window.location.href = '/auth/signin';
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    // Optimistic update
    if (user) {
      setUser({ ...user, ...userData });
      // In NextAuth we might need to trigger session update if important fields changed
      await update(userData);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    userLoading,
    login,
    me,
    register,
    logout,
    updateUser,
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
