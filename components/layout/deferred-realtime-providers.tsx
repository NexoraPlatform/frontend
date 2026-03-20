"use client";

import type { ReactNode } from "react";

import { useAuth } from "@/contexts/auth-context";
import { ChatProvider } from "@/contexts/chat-context";
import { NotificationProvider } from "@/contexts/notification-context";

type DeferredRealtimeProvidersProps = {
  children: ReactNode;
};

export function DeferredRealtimeProviders({
  children,
}: DeferredRealtimeProvidersProps) {
  const { user } = useAuth();

  if (!user) {
    return <>{children}</>;
  }

  return (
    <NotificationProvider lazy>
      <ChatProvider lazy>{children}</ChatProvider>
    </NotificationProvider>
  );
}
