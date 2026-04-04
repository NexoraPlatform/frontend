"use client";

import type { ReactNode } from "react";
import type { Session } from "next-auth";

import { DeferredRealtimeProviders } from "@/components/layout/deferred-realtime-providers";
import { AuthProvider } from "@/contexts/auth-context";
import type { AuthUser } from "@/lib/auth/user";

type RuntimeAuthProvidersProps = {
  children: ReactNode;
  initialSession?: Session | null;
  initialUser?: AuthUser | null;
};

export function RuntimeAuthProviders({
  children,
  initialSession = null,
  initialUser = null,
}: RuntimeAuthProvidersProps) {
  return (
    <AuthProvider initialSession={initialSession} initialUser={initialUser}>
      <DeferredRealtimeProviders>{children}</DeferredRealtimeProviders>
    </AuthProvider>
  );
}
