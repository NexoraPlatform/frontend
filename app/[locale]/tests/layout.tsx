import type { ReactNode } from "react";

import ScopedIntlProvider from "@/components/i18n/scoped-intl-provider";
import { AuthenticatedRuntimeProviders } from "@/components/layout/authenticated-runtime-providers";

type TestsLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function TestsLayout({
  children,
  params,
}: TestsLayoutProps) {
  const { locale } = await params;

  return (
    <ScopedIntlProvider locale={locale} extraNamespaces={["tests"]}>
      <AuthenticatedRuntimeProviders>{children}</AuthenticatedRuntimeProviders>
    </ScopedIntlProvider>
  );
}
