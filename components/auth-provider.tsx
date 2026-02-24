"use client";

import { AuthProvider as ContextAuthProvider } from '@/contexts/auth-context';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <ContextAuthProvider>{children}</ContextAuthProvider>;
}
