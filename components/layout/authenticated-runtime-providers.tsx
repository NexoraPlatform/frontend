"use client";

import type { ReactNode } from "react";

import ActivityTracker from "@/components/ActivityTracker";

type AuthenticatedRuntimeProvidersProps = {
  children: ReactNode;
};

export function AuthenticatedRuntimeProviders({
  children,
}: AuthenticatedRuntimeProvidersProps) {
  return (
    <>
      <ActivityTracker />
      {children}
    </>
  );
}
