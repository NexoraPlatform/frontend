import type { ReactNode } from "react";

import ScopedIntlProvider from "@/components/i18n/scoped-intl-provider";
import { AuthenticatedRuntimeProviders } from "@/components/layout/authenticated-runtime-providers";

type ClientLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function ClientLayout({
  children,
  params,
}: ClientLayoutProps) {
  const { locale } = await params;

  return (
    <ScopedIntlProvider locale={locale} extraNamespaces={["client"]}>
      <AuthenticatedRuntimeProviders>{children}</AuthenticatedRuntimeProviders>
    </ScopedIntlProvider>
  );
}
