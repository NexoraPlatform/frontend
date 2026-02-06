"use client";

import type { ReactNode } from 'react';
import { useAuth as useAuthHook } from '@/hooks/useAuth';

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}

export const useAuth = useAuthHook;
