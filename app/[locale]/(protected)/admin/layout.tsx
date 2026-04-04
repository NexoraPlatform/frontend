import type { ReactNode } from "react";

import ScopedIntlProvider from "@/components/i18n/scoped-intl-provider";
import { AuthenticatedRuntimeProviders } from "@/components/layout/authenticated-runtime-providers";

import AdminLayoutClient from "./admin-layout-client";

type AdminLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AdminLayout({
  children,
  params,
}: AdminLayoutProps) {
  const { locale } = await params;

  return (
    <ScopedIntlProvider locale={locale} extraNamespaces={["admin"]}>
      <AuthenticatedRuntimeProviders>
        <AdminLayoutClient>{children}</AdminLayoutClient>
      </AuthenticatedRuntimeProviders>
    </ScopedIntlProvider>
  );
}
