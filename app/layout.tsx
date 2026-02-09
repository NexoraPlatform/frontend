import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { buildRootMetadata } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = buildRootMetadata();

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  maximumScale: 5,
  userScalable: true,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0B1C2D" },
    { media: "(prefers-color-scheme: dark)", color: "#070C14" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
