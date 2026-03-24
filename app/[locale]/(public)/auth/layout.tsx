import type { ReactNode } from "react";

import { RuntimeAuthProviders } from "@/components/layout/runtime-auth-providers";

type PublicAuthLayoutProps = {
  children: ReactNode;
};

export default function PublicAuthLayout({ children }: PublicAuthLayoutProps) {
  return <RuntimeAuthProviders>{children}</RuntimeAuthProviders>;
}
