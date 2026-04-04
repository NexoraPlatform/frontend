import type { ReactNode } from "react";

import ScopedIntlProvider from "@/components/i18n/scoped-intl-provider";
import { AuthenticatedRuntimeProviders } from "@/components/layout/authenticated-runtime-providers";

type ExamLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function ExamLayout({
  children,
  params,
}: ExamLayoutProps) {
  const { locale } = await params;

  return (
    <ScopedIntlProvider locale={locale} extraNamespaces={["tests"]}>
      <AuthenticatedRuntimeProviders>{children}</AuthenticatedRuntimeProviders>
    </ScopedIntlProvider>
  );
}
