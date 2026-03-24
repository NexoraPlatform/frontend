import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Manrope, Space_Grotesk } from "next/font/google";
import { getLocale } from "next-intl/server";
import { buildRootMetadata, resolveLocale } from "@/lib/seo";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-space-grotesk",
});

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-manrope",
});

async function getDocumentLocale() {
  try {
    return resolveLocale(await getLocale());
  } catch {
    return resolveLocale();
  }
}

export async function generateMetadata(): Promise<Metadata> {
  return buildRootMetadata(await getDocumentLocale());
}

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

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getDocumentLocale();

  return (
    <html lang={locale} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} ${manrope.variable}`}>{children}</body>
    </html>
  );
}
