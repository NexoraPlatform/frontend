import type { ReactNode } from "react";

import ScopedIntlProvider from "@/components/i18n/scoped-intl-provider";
import { AuthenticatedRuntimeProviders } from "@/components/layout/authenticated-runtime-providers";

type ProviderServicesLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function ProviderServicesLayout({
  children,
  params,
}: ProviderServicesLayoutProps) {
  const { locale } = await params;

  return (
    <ScopedIntlProvider locale={locale} extraNamespaces={["tests"]}>
      <AuthenticatedRuntimeProviders>{children}</AuthenticatedRuntimeProviders>
    </ScopedIntlProvider>
  );
}
