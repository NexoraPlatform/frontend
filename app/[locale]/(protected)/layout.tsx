import type { ReactNode } from "react";

import { cookies } from "next/headers";

import { auth } from "@/auth";
import { RuntimeAuthProviders } from "@/components/layout/runtime-auth-providers";
import { isBrowserSessionExpired } from "@/lib/auth/session-preferences";
import { normalizeAuthUser } from "@/lib/auth/user";

type ProtectedLayoutProps = {
  children: ReactNode;
};

export default async function ProtectedLayout({
  children,
}: ProtectedLayoutProps) {
  const session = await auth();
  const cookieStore = await cookies();
  const rememberMe = session?.rememberMe === true;
  const initialUser = isBrowserSessionExpired(rememberMe, cookieStore)
    ? null
    : normalizeAuthUser(session?.user ?? null);

  return <RuntimeAuthProviders initialUser={initialUser}>{children}</RuntimeAuthProviders>;
}
