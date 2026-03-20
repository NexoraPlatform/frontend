"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { SessionProvider, signIn, signOut, useSession } from 'next-auth/react';
import { apiClient } from '@/lib/api';
import { onApiUnauthorized } from '@/lib/fetch-client';
import { getXsrfToken } from '@/lib/csrf';
import { normalizeAuthUser, type AuthUser } from '@/lib/auth/user';

interface AuthContextType {
  user: AuthUser | null;
  refreshUser: () => Promise<void>;
  loading: boolean;
  userLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<AuthUser>) => Promise<void>;
  setUserLanguage: (language: string) => Promise<AuthUser | null>;
}

type AuthProviderProps = {
  children: React.ReactNode;
  initialUser?: AuthUser | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const fetchCurrentUser = async () => {
  const response = await fetch('/api/auth/me', {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      return null;
    }

    const error = new Error('Failed to fetch authenticated user') as Error & {
      response?: { status: number };
    };
    error.response = { status: response.status };
    throw error;
  }

  const payload = await response.json().catch(() => null);
  return normalizeAuthUser(payload?.user ?? payload);
};

const normalizeLoginPayloadUser = (payload: any) => {
  if (!payload?.user) {
    return null;
  }

  return normalizeAuthUser({
    ...payload.user,
    ...(Array.isArray(payload.roles) ? { roles: payload.roles } : {}),
    ...(Array.isArray(payload.permissions) ? { permissions: payload.permissions } : {}),
  });
};

function AuthProviderInner({ children, initialUser = null }: AuthProviderProps) {
  const normalizedInitialUser = useMemo(() => normalizeAuthUser(initialUser), [initialUser]);
  const { data: session, status, update } = useSession();
  const sessionUser = useMemo(() => normalizeAuthUser((session as any)?.user ?? null), [session]);
  const [user, setUser] = useState<AuthUser | null>(sessionUser ?? normalizedInitialUser);

  useEffect(() => {
    if (status === 'loading') return;
    if (sessionUser) {
      setUser(sessionUser);
      return;
    }
    if (status === 'unauthenticated') {
      setUser(normalizedInitialUser ?? null);
      return;
    }
    setUser(null);
  }, [normalizedInitialUser, sessionUser, status]);

  const login = useCallback(
    async (email: string, password: string) => {
      await fetch('/api/sanctum/csrf-cookie', { method: 'GET', credentials: 'include' });
      const xsrfToken = getXsrfToken();
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
        },
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

      const authResult = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (!authResult || authResult.error) {
        throw new Error(authResult?.error || 'Login failed');
      }

      const loginUser = normalizeLoginPayloadUser(payload);
      let refreshedUser: AuthUser | null = null;
      try {
        refreshedUser = await fetchCurrentUser();
      } catch (error) {
        console.warn('Failed to fetch user profile after login:', error);
      }
      if (refreshedUser) {
        setUser(refreshedUser);
        await update({ user: refreshedUser } as any);
      } else if (loginUser) {
        setUser(loginUser);
        await update({ user: loginUser } as any);
      } else {
        await update();
      }
    },
    [update]
  );

  const register = useCallback(
    async (userData: any) => {
      try {
        await fetch('/api/sanctum/csrf-cookie', { method: 'GET', credentials: 'include' });
        const xsrfToken = getXsrfToken();
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
          },
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
    },
    [login]
  );

  const refreshUser = useCallback(async () => {
    let refreshedUser: AuthUser | null = null;
    try {
      refreshedUser = await fetchCurrentUser();
    } catch (error) {
      console.warn('Failed to refresh authenticated user:', error);
    }
    if (refreshedUser) {
      setUser(refreshedUser);
      await update({ user: refreshedUser } as any);
      return;
    }

    setUser(null);
    await signOut({ redirect: false });
  }, [update]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/sanctum/csrf-cookie', { method: 'GET', credentials: 'include' });
      const xsrfToken = getXsrfToken();
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : undefined,
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      await signOut({ redirect: false });
      const localeFromPath =
        typeof window !== 'undefined'
          ? window.location.pathname.split('/')[1]?.toLowerCase()
          : null;
      const hasLocalePrefix = localeFromPath === 'en' || localeFromPath === 'ro';
      window.location.href = hasLocalePrefix ? `/${localeFromPath}/auth/signin` : '/auth/signin';
    }
  }, []);

  const updateUser = useCallback(
    async (userData: Partial<AuthUser>) => {
      if (!user) return;
      const next = normalizeAuthUser({ ...user, ...userData });
      setUser(next);
      await update({ user: next } as any);
    },
    [update, user]
  );

  const setUserLanguage = useCallback(
    async (language: string) => {
      if (!language) return null;
      try {
        await fetch('/api/sanctum/csrf-cookie', { method: 'GET', credentials: 'include' });
        const updatedUser = await apiClient.updateUserLanguage(language);
        const normalizedUser = normalizeAuthUser(updatedUser?.user ?? updatedUser);

        if (!normalizedUser) {
          await refreshUser();
          return null;
        }

        setUser(normalizedUser);
        await update({ user: normalizedUser } as any);
        return normalizedUser;
      } catch (error) {
        console.error('Failed to update user language:', error);
        return null;
      }
    },
    [refreshUser, update]
  );

  useEffect(() => {
    const unsubscribe = onApiUnauthorized(() => {
      setUser(null);
      void signOut({ redirect: false });
    });

    return unsubscribe;
  }, []);

  const loading = status === 'loading';
  const userLoading = loading && !user;

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

export function AuthProvider({ children, initialUser = null }: AuthProviderProps) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      <AuthProviderInner initialUser={initialUser}>{children}</AuthProviderInner>
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
