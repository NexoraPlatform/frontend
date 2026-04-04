"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useLocale } from "next-intl";

import { Toaster } from "@/components/ui/sonner";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const locale = useLocale();

  useEffect(() => {
    if (!locale) return;

    try {
      localStorage.setItem("NEXT_LOCALE", locale);
    } catch {}

    try {
      document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;
    } catch {}

    if (document.documentElement) {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  return (
    <>
      <div id="main-content" tabIndex={-1}>
        {children}
      </div>
      <Toaster position="top-right" expand={false} richColors closeButton />
    </>
  );
}
