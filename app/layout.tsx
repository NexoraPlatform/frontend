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

// Root Layout serves as a fallback pass-through.
// The actual HTML/Body structure is handled in:
// 1. app/[locale]/layout.tsx (for app routes)
// 2. app/not-found.tsx (for 404s)
// This prevents dynamic logic (like getServerUser) from crashing static error pages.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
