import type { ReactNode } from "react";

type PublicLayoutProps = {
  children: ReactNode;
};

export const dynamic = "force-static";

export default function PublicLayout({ children }: PublicLayoutProps) {
  return children;
}
