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
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
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
    await signOut({ redirect: true, callbackUrl: '/auth/signin' });
    setUser(null);
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
    login,
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
