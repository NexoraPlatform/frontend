import type { ReactNode } from "react";

import { AuthenticatedRuntimeProviders } from "@/components/layout/authenticated-runtime-providers";

type IntegrationsLayoutProps = {
  children: ReactNode;
};

export default function IntegrationsLayout({
  children,
}: IntegrationsLayoutProps) {
  return <AuthenticatedRuntimeProviders>{children}</AuthenticatedRuntimeProviders>;
}
