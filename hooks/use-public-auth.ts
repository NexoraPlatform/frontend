"use client";

import { useCallback, useEffect, useState } from "react";

import { signOut } from "next-auth/react";
import useSWR from "swr";

import {
  BROWSER_SESSION_COOKIE_NAME,
  REMEMBER_ME_COOKIE_NAME,
  clearSessionPreferenceCookies,
} from "@/lib/auth/session-preferences";
import { normalizeAuthUser, type AuthUser } from "@/lib/auth/user";
import { apiClient } from "@/lib/api";
import { clearBrowserSessionAuthCache } from "@/lib/fetch-client";

const PUBLIC_AUTH_USER_KEY = "/api/auth/me";

const hasSessionPreferenceCookie = () => {
  if (typeof document === "undefined") {
    return false;
  }

  const cookieEntries = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return cookieEntries.some((entry) => {
    const [name, value] = entry.split("=");
    if (!value) {
      return false;
    }

    return (
      (name === REMEMBER_ME_COOKIE_NAME || name === BROWSER_SESSION_COOKIE_NAME) &&
      value === "1"
    );
  });
};

const fetchPublicAuthUser = async (): Promise<AuthUser | null> => {
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
      clearSessionPreferenceCookies();
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

  const shouldResolvePublicAuth = enabled && hasMounted && hasSessionPreferenceCookie();
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
