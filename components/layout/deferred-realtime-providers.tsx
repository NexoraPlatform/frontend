"use client";

import type { ReactNode } from "react";

import { ChatProvider } from "@/contexts/chat-context";
import { NotificationProvider } from "@/contexts/notification-context";

type DeferredRealtimeProvidersProps = {
  children: ReactNode;
};

export function DeferredRealtimeProviders({
  children,
}: DeferredRealtimeProvidersProps) {
  return (
    <NotificationProvider lazy>
      <ChatProvider lazy>{children}</ChatProvider>
    </NotificationProvider>
  );
}
