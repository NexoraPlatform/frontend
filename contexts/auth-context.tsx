"use client";

import React, {createContext, useContext, useState, useEffect, useCallback} from 'react';
import { apiClient } from '@/lib/api';
import { AccessPermission } from "@/lib/access";
import {usePathname} from "next/navigation";

export type AccessRole = {
  id?: number | string;
  slug: string;
  permissions?: AccessPermission[];
};

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  location: string;
  language: string;
  bio: string;
  role: string;
  avatar?: string;
  testVerified: boolean;
  callVerified: boolean;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const pathname = usePathname(); // adaugă

  const fetchProfile = useCallback(async () => {
    try {
      const profile = await apiClient.getProfile();
      setUser(profile);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cookieToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1];

    const localToken = localStorage.getItem('auth_token');

    const token = localToken || cookieToken;
    const hasValidToken =
      Boolean(token && token.trim() !== '' && token !== 'null' && token !== 'undefined');

    // Sync from cookie to localStorage if missing
    if (cookieToken && !localToken) {
      localStorage.setItem('auth_token', cookieToken);
    }

    if (hasValidToken) {
      apiClient.setToken(token);

      // Always refresh the cookie to ensure it's valid
      document.cookie = `auth_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 days
      fetchProfile();
    } else {
      apiClient.removeToken();
      localStorage.removeItem('auth_token');
      setLoading(false);
    }
  }, [fetchProfile]);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login({ email, password });
      setUser(response.user);

      apiClient.setToken(response.access_token);
      localStorage.setItem('auth_token', response.access_token);
      document.cookie = `auth_token=${response.access_token}; path=/; max-age=${7 * 24 * 60 * 60}`;
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await apiClient.register(userData);
      setUser(response.user);

      apiClient.setToken(response.access_token);
      localStorage.setItem('auth_token', response.access_token);
      document.cookie = `auth_token=${response.access_token}; path=/; max-age=${7 * 24 * 60 * 60}`;
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  };

  const logout = () => {
    apiClient.removeToken();
    localStorage.removeItem('auth_token');
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    setUser(null);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
