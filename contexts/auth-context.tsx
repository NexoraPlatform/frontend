"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { Session } from 'next-auth';
import { getSession, SessionProvider, signIn, signOut, useSession } from 'next-auth/react';
import { apiClient } from '@/lib/api';
import {
  clearBrowserSessionAuthCache,
  setBrowserSessionAuthCache,
} from '@/lib/fetch-client';
import {
  clearSessionPreferenceCookies,
  setSessionPreferenceCookies,
} from '@/lib/auth/session-preferences';
import { hasSessionAuthTokens } from '@/lib/auth/session';
import { normalizeAuthUser, type AuthUser } from '@/lib/auth/user';

interface AuthContextType {
  user: AuthUser | null;
  refreshUser: () => Promise<void>;
  loading: boolean;
  userLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<AuthUser>) => Promise<void>;
  setUserLanguage: (language: string) => Promise<AuthUser | null>;
}

type AuthProviderProps = {
  children: React.ReactNode;
  initialSession?: Session | null;
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

const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: 'The provided credentials are incorrect.',
  passport_client: 'Passport client configuration is invalid or incomplete.',
  passport_grant: 'Laravel Passport password grant is not enabled on the backend.',
  passport_profile: 'Login succeeded, but the user profile could not be loaded.',
  passport_token: 'Login succeeded, but no access token was returned by the backend.',
  passport_error: 'Authentication with Passport failed.',
};

const extractLoginErrorMessage = async (email: string, password: string, fallbackCode?: string) => {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const payload = await response.json().catch(() => null);
    const message =
      payload && typeof payload === 'object'
        ? payload.message || payload.error_description || payload.error
        : null;

    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  } catch (error) {
    console.warn('Failed to retrieve detailed login error:', error);
  }

  if (fallbackCode && LOGIN_ERROR_MESSAGES[fallbackCode]) {
    return LOGIN_ERROR_MESSAGES[fallbackCode];
  }

  return 'Login failed';
};

const getAuthUserSnapshotKey = (value: AuthUser | null) => {
  if (!value) {
    return 'guest';
  }

  return `${value.id ?? ''}:${value.email ?? ''}`;
};

function AuthProviderInner({ children, initialSession = null, initialUser = null }: AuthProviderProps) {
  const normalizedInitialUser = useMemo(() => normalizeAuthUser(initialUser), [initialUser]);
  const { data: session, status, update } = useSession();
  const initialSessionHasAuthTokens = useMemo(
    () => hasSessionAuthTokens(initialSession as any),
    [initialSession]
  );
  const initialSessionUser = useMemo(
    () => (initialSessionHasAuthTokens ? normalizeAuthUser((initialSession as any)?.user ?? null) : null),
    [initialSession, initialSessionHasAuthTokens]
  );
  const serverSnapshotUser = useMemo(
    () => initialSessionUser ?? normalizedInitialUser,
    [initialSessionUser, normalizedInitialUser]
  );
  const serverSnapshotKey = useMemo(
    () => getAuthUserSnapshotKey(serverSnapshotUser),
    [serverSnapshotUser]
  );
  const sessionHasAuthTokens = useMemo(() => hasSessionAuthTokens(session as any), [session]);
  const sessionUser = useMemo(
    () => (sessionHasAuthTokens ? normalizeAuthUser((session as any)?.user ?? null) : null),
    [session, sessionHasAuthTokens]
  );
  const [recoveredSessionUser, setRecoveredSessionUser] = useState<AuthUser | null>(null);
  const [isRecoveringSession, setIsRecoveringSession] = useState(
    () => status === 'unauthenticated' && !sessionUser && !initialSessionUser && !normalizedInitialUser
  );
  const recoveryAttemptedRef = useRef(false);
  const previousServerSnapshotKeyRef = useRef(serverSnapshotKey);
  const effectiveSessionUser = sessionUser ?? recoveredSessionUser;
  const [user, setUser] = useState<AuthUser | null>(
    effectiveSessionUser ?? initialSessionUser ?? normalizedInitialUser
  );

  useEffect(() => {
    if (status === 'loading') return;
    if (effectiveSessionUser) {
      setUser(effectiveSessionUser);
      return;
    }
    if (status === 'unauthenticated') {
      setUser(null);
      return;
    }
    setUser(null);
  }, [effectiveSessionUser, status]);

  useEffect(() => {
    if (!initialSession) return;
    setBrowserSessionAuthCache(initialSession);
  }, [initialSession]);

  useEffect(() => {
    if (serverSnapshotKey === previousServerSnapshotKeyRef.current) return;

    previousServerSnapshotKeyRef.current = serverSnapshotKey;
    recoveryAttemptedRef.current = false;
    setRecoveredSessionUser(serverSnapshotUser);

    if (serverSnapshotUser) {
      setUser(serverSnapshotUser);
      setIsRecoveringSession(false);
      return;
    }

    if (status === 'unauthenticated') {
      setUser(null);
    }
  }, [serverSnapshotKey, serverSnapshotUser, status]);

  useEffect(() => {
    if (status === 'authenticated' && sessionHasAuthTokens) {
      recoveryAttemptedRef.current = false;
      setRecoveredSessionUser(null);
      setIsRecoveringSession(false);
      setBrowserSessionAuthCache(session);
      return;
    }

    if (status === 'authenticated' && !sessionHasAuthTokens) {
      setRecoveredSessionUser(null);
      setUser(null);
      setIsRecoveringSession(false);
      clearBrowserSessionAuthCache();
    }
  }, [recoveredSessionUser, session, sessionHasAuthTokens, status]);

  useEffect(() => {
    if (status !== 'unauthenticated') return;
    if (effectiveSessionUser) {
      setIsRecoveringSession(false);
      return;
    }
    if (recoveryAttemptedRef.current) {
      setIsRecoveringSession(false);
      return;
    }

    recoveryAttemptedRef.current = true;
    let cancelled = false;
    setIsRecoveringSession(true);

    void getSession()
      .then(async (sessionSnapshot) => {
        if (cancelled) return;

        if (sessionSnapshot) {
          setBrowserSessionAuthCache(sessionSnapshot);
        }

        const sessionSnapshotHasAuthTokens = hasSessionAuthTokens(sessionSnapshot as any);
        let recoveredUser = sessionSnapshotHasAuthTokens
          ? normalizeAuthUser((sessionSnapshot as any)?.user ?? null)
          : null;
        let userProfileLookupFailed = false;
        if (sessionSnapshotHasAuthTokens && !recoveredUser) {
          recoveredUser = await fetchCurrentUser().catch((error) => {
            userProfileLookupFailed = true;
            console.warn('Failed to recover authenticated user from /api/auth/me:', error);
            return null;
          });
        }

        if (recoveredUser) {
          setRecoveredSessionUser(recoveredUser);
          setUser(recoveredUser);
          return;
        }

        setRecoveredSessionUser(null);
        if (!sessionSnapshot && !userProfileLookupFailed) {
          clearBrowserSessionAuthCache();
        }
      })
      .catch((error) => {
        if (cancelled) return;
        console.warn('Failed to recover authenticated session from Auth.js:', error);
        setRecoveredSessionUser(null);
      })
      .finally(() => {
        if (cancelled) return;
        setIsRecoveringSession(false);
      });

    return () => {
      cancelled = true;
    };
  }, [effectiveSessionUser, status]);

  const login = useCallback(
    async (email: string, password: string, rememberMe = false) => {
      setSessionPreferenceCookies(rememberMe);

      let authResult;
      try {
        authResult = await signIn('credentials', {
          email,
          password,
          remember: rememberMe ? 'true' : 'false',
          redirect: false,
        });
      } catch (error) {
        clearSessionPreferenceCookies();
        throw error;
      }

      if (!authResult || authResult.error) {
        clearSessionPreferenceCookies();
        const detailedMessage = await extractLoginErrorMessage(
          email,
          password,
          authResult?.code
        );
        throw new Error(detailedMessage);
      }

      const sessionAfterLogin = await getSession().catch(() => null);
      recoveryAttemptedRef.current = false;
      setRecoveredSessionUser(null);
      setBrowserSessionAuthCache(sessionAfterLogin);
      const loginUser = normalizeAuthUser((sessionAfterLogin as any)?.user ?? null);
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
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
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
    const sessionSnapshot = await getSession().catch(() => null);
    setBrowserSessionAuthCache(sessionSnapshot);

    if (!hasSessionAuthTokens(sessionSnapshot as any)) {
      setUser(null);
      setRecoveredSessionUser(null);
      clearBrowserSessionAuthCache();
      clearSessionPreferenceCookies();
      await signOut({ redirect: false });
      return;
    }

    let refreshedUser: AuthUser | null = null;
    try {
      refreshedUser = await fetchCurrentUser();
    } catch (error) {
      console.warn('Failed to refresh authenticated user:', error);
    }
    if (!refreshedUser) {
      refreshedUser = normalizeAuthUser((sessionSnapshot as any)?.user ?? null);
    }
    if (refreshedUser) {
      recoveryAttemptedRef.current = false;
      setRecoveredSessionUser(null);
      setUser(refreshedUser);
      await update({ user: refreshedUser } as any);
      return;
    }

    setUser(null);
    setRecoveredSessionUser(null);
    clearBrowserSessionAuthCache();
    clearSessionPreferenceCookies();
    await signOut({ redirect: false });
  }, [update]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setRecoveredSessionUser(null);
      clearBrowserSessionAuthCache();
      clearSessionPreferenceCookies();
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

  const loading = status === 'loading' || isRecoveringSession;
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

export function AuthProvider({
  children,
  initialSession = null,
  initialUser = null,
}: AuthProviderProps) {
  return (
    <SessionProvider
      refetchOnWindowFocus={false}
      refetchInterval={0}
      session={initialSession}
    >
      <AuthProviderInner initialSession={initialSession} initialUser={initialUser}>
        {children}
      </AuthProviderInner>
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

export function useOptionalAuth() {
  return useContext(AuthContext);
}
