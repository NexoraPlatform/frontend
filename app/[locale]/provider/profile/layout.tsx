import type { ReactNode } from "react";

import ScopedIntlProvider from "@/components/i18n/scoped-intl-provider";
import { AuthenticatedRuntimeProviders } from "@/components/layout/authenticated-runtime-providers";

type ProviderProfileLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function ProviderProfileLayout({
  children,
  params,
}: ProviderProfileLayoutProps) {
  const { locale } = await params;

  return (
    <ScopedIntlProvider locale={locale} extraNamespaces={["dashboard"]}>
      <AuthenticatedRuntimeProviders>{children}</AuthenticatedRuntimeProviders>
    </ScopedIntlProvider>
  );
}
