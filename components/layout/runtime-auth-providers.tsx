"use client";

import type { ReactNode } from "react";

import { DeferredRealtimeProviders } from "@/components/layout/deferred-realtime-providers";
import { AuthProvider } from "@/contexts/auth-context";
import type { AuthUser } from "@/lib/auth/user";

type RuntimeAuthProvidersProps = {
  children: ReactNode;
  initialUser?: AuthUser | null;
};

export function RuntimeAuthProviders({
  children,
  initialUser = null,
}: RuntimeAuthProvidersProps) {
  return (
    <AuthProvider initialUser={initialUser}>
      <DeferredRealtimeProviders>{children}</DeferredRealtimeProviders>
    </AuthProvider>
  );
}
