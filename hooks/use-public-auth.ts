"use client";

import { useCallback, useEffect, useState } from "react";

import { getSession, signOut } from "next-auth/react";
import useSWR from "swr";

import {
  clearSessionPreferenceCookies,
} from "@/lib/auth/session-preferences";
import { hasSessionAuthTokens } from "@/lib/auth/session";
import { normalizeAuthUser, type AuthUser } from "@/lib/auth/user";
import { apiClient } from "@/lib/api";
import { clearBrowserSessionAuthCache, setBrowserSessionAuthCache } from "@/lib/fetch-client";

const PUBLIC_AUTH_USER_KEY = "/api/auth/me";

const fetchPublicAuthUser = async (): Promise<AuthUser | null> => {
  const sessionSnapshot = await getSession().catch(() => null);

  if (sessionSnapshot) {
    setBrowserSessionAuthCache(sessionSnapshot);
  }

  if (!hasSessionAuthTokens(sessionSnapshot as any)) {
    clearBrowserSessionAuthCache();
    return null;
  }

  const response = await fetch(PUBLIC_AUTH_USER_KEY, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      clearBrowserSessionAuthCache();
      return null;
    }

    throw new Error("Failed to resolve public auth user");
  }

  const payload = await response.json().catch(() => null);
  return normalizeAuthUser(payload?.user ?? payload);
};

export function usePublicAuth(enabled = true) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const shouldResolvePublicAuth = enabled && hasMounted;
  const { data, isLoading, mutate } = useSWR<AuthUser | null>(
    shouldResolvePublicAuth ? PUBLIC_AUTH_USER_KEY : null,
    fetchPublicAuthUser,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30_000,
    }
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearBrowserSessionAuthCache();
      clearSessionPreferenceCookies();
      await signOut({ redirect: false });
      await mutate(null, false);
      const localeFromPath =
        typeof window !== "undefined"
          ? window.location.pathname.split("/")[1]?.toLowerCase()
          : null;
      const hasLocalePrefix = localeFromPath === "en" || localeFromPath === "ro";
      window.location.href = hasLocalePrefix ? `/${localeFromPath}/auth/signin` : "/auth/signin";
    }
  }, [mutate]);

  const refreshUser = useCallback(async () => {
    if (!shouldResolvePublicAuth) {
      await mutate(null, false);
      return;
    }

    await mutate();
  }, [mutate, shouldResolvePublicAuth]);

  const setUserLanguage = useCallback(
    async (language: string) => {
      if (!language) return null;

      try {
        const updatedUser = await apiClient.updateUserLanguage(language);
        const normalizedUser = normalizeAuthUser(updatedUser?.user ?? updatedUser);

        if (normalizedUser) {
          await mutate(normalizedUser, false);
          return normalizedUser;
        }

        await mutate();
        return null;
      } catch (error) {
        console.error("Failed to update user language:", error);
        return null;
      }
    },
    [mutate]
  );

  return {
    user: data ?? null,
    loading: shouldResolvePublicAuth && isLoading && data === undefined,
    userLoading: shouldResolvePublicAuth && isLoading && !data,
    logout,
    refreshUser,
    setUserLanguage,
  };
}
