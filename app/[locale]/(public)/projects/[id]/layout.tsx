import type { ReactNode } from "react";

import { AuthenticatedRuntimeProviders } from "@/components/layout/authenticated-runtime-providers";

type ProjectDetailLayoutProps = {
  children: ReactNode;
};

export default function ProjectDetailLayout({
  children,
}: ProjectDetailLayoutProps) {
  return <AuthenticatedRuntimeProviders>{children}</AuthenticatedRuntimeProviders>;
}
