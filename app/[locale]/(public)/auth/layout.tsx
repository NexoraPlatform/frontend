import type { ReactNode } from "react";

type PublicAuthLayoutProps = {
  children: ReactNode;
};

export default function PublicAuthLayout({ children }: PublicAuthLayoutProps) {
  return children;
}
