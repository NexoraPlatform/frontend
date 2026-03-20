import type { ReactNode } from "react";

import { AuthenticatedRuntimeProviders } from "@/components/layout/authenticated-runtime-providers";

type ProviderProfileLayoutProps = {
  children: ReactNode;
};

export default function ProviderProfileLayout({
  children,
}: ProviderProfileLayoutProps) {
  return <AuthenticatedRuntimeProviders>{children}</AuthenticatedRuntimeProviders>;
}
