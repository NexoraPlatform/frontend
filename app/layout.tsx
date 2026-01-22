import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/contexts/auth-context"
import ActivityTracker from "@/components/ActivityTracker"
import { NotificationProvider } from "@/contexts/notification-context"
import { ChatProvider } from "@/contexts/chat-context"
import "./globals.css"
import Script from "next/script"
import { generateSEO, generateStructuredData } from "@/lib/seo"
import type React from "react"
import { GoogleTagManager } from '@next/third-parties/google'
import {Partytown} from "@qwik.dev/partytown/react";
import {TrustoraThemeStyles} from "@/components/trustora/theme-styles";
import {Header} from "@/components/header";
import {TrustoraHeroSection} from "@/components/trustora/hero-section";
import {TrustoraPillarsSection} from "@/components/trustora/pillars-section";
import {TrustoraMessagingSection} from "@/components/trustora/messaging-section";
import {TrustoraVisualLanguageSection} from "@/components/trustora/visual-language-section";
import {TrustoraFinalCtaSection} from "@/components/trustora/final-cta-section";
import {Footer} from "@/components/footer";
import OneSignalInit from "@/components/OneSignalInit";
import {NextIntlClientProvider} from 'next-intl';

const inter = Inter({
    subsets: ["latin"],
    display: "swap",
    preload: true,
    variable: "--font-inter",
    adjustFontFallback: true,
    fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Arial", "sans-serif"],
    weight: ["400", "500", "600", "700", "900"],
})

const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    display: "swap",
    preload: true,
    variable: "--font-jetbrains-mono",
    weight: ["500"],
})

// Separate viewport export for Next.js 15
export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: "cover",
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#3b82f6" },
        { media: "(prefers-color-scheme: dark)", color: "#1e40af" },
    ],
    colorScheme: "light dark",
}

const criticalCSS = `
/* Critical above-the-fold styles only */
:root {
    --font-inter: ${inter.style.fontFamily}, system-ui, sans-serif;
    --color-background: light-dark(#ffffff, #0f172a);
    --color-foreground: light-dark(#0f172a, #f8fafc);
    --font-jetbrains-mono: ${jetbrainsMono.style.fontFamily}, ui-monospace, SFMono-Regular, SFMono-Regular, Menlo,
        Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

html {
    line-height: 1.6;
    text-size-adjust: 100%;
    scroll-behavior: smooth;
}

body {
    font-family: var(--font-inter);
    background-color: var(--color-background);
    color: var(--color-foreground);
    margin: 0;
    padding: 0;
    font-synthesis: none;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

/* Essential layout classes for header and hero only */
.container { max-width: 1280px; margin: 0 auto; padding: 0 1rem; }
.flex { display: flex; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.text-center { text-align: center; }
.mx-auto { margin-inline: auto; }
.font-black { font-weight: 900; }
.text-6xl { font-size: 3.75rem; line-height: 1; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.mb-8 { margin-bottom: 2rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.py-8 { padding-top: 2rem; padding-bottom: 2rem; }

/* Glass effect for header */
.glass-effect {
    backdrop-filter: blur(20px);
    background-color: rgba(255, 255, 255, 0.95);
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.dark .glass-effect {
    background-color: rgba(17, 25, 40, 0.95);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* Skip link accessibility */
.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}

.focus\\:not-sr-only:focus {
    position: static;
    width: auto;
    height: auto;
    padding: 0.5rem 1rem;
    margin: 0;
    overflow: visible;
    clip: auto;
    white-space: normal;
}

/* Prefers reduced motion */
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
    }
}
`

export const metadata: Metadata = generateSEO({
    title: "Trustora - Marketplace de Servicii IT Premium",
    description:
        "Conectează-te cu cei mai buni experți IT din România. Dezvoltare web, aplicații mobile, design UI/UX, marketing digital. Plăți securizate, experți verificați.",
    keywords: [
        "Trustora",
        "servicii IT România",
        "dezvoltare web",
        "aplicații mobile",
        "design UI/UX",
        "marketing digital",
        "freelanceri IT",
        "dezvoltatori România",
        "programare React",
        "WordPress",
        "SEO",
        "e-commerce",
        "startup tech",
    ],
    url: "/",
})

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Trustora',
        url: process.env.NEXT_PUBLIC_APP_URL,
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: `${process.env.NEXT_PUBLIC_APP_URL}/search?q={search_term_string}`
            },
            'query-input': 'required name=search_term_string'
        },
        publisher: {
            '@type': 'Organization',
            name: 'Trustora',
            logo: {
                '@type': 'ImageObject',
                url: `${process.env.NEXT_PUBLIC_APP_URL}/trustora-logo2.svg`
            }
        }
    };

    const structuredData = generateStructuredData({
        type: 'Organization',
        name: 'Trustora',
        url: process.env.NEXT_PUBLIC_SITE_URL || 'https://trustora.ro',
        logo: `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`,
        sameAs: [
            "https://www.facebook.com/trustora",
            "https://www.linkedin.com/company/trustora-platform"
        ],
        contactPoint: {
            "@type": "ContactPoint",
            "telephone": "+40700000000",
            "contactType": "customer service",
            "areaServed": "RO"
        }
    });

    return (
        <html lang="ro" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable}`}>
        <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID as string} />
        <head>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
            <link rel="preconnect" href="https://images.pexels.com" crossOrigin="" />
            <link rel="dns-prefetch" href="//api.Trustora.ro" />
            <link rel="dns-prefetch" href="//vercel.app" />

            <link rel="icon" href="/trustora-logo2.webp" sizes="32x32" type="image/webp" />
            <link rel="apple-touch-icon" href="/trustora-logo2.webp" sizes="180x180" />
            <link rel="mask-icon" href="/trustora-logo2.webp" color="#3b82f6" />

            {/* PWA manifest */}
            <link rel="manifest" href="/manifest.json" />

            <meta name="format-detection" content="telephone=no" />
            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="default" />

            <style dangerouslySetInnerHTML={{ __html: criticalCSS }} />

            {/*<link rel="preload" href="/logo-60.webp" as="image" type="image/webp" fetchPriority="high" />*/}
            {/*<link rel="preload" href="/logo-120.webp" as="image" type="image/webp" fetchPriority="high" />*/}

            <meta httpEquiv="x-dns-prefetch-control" content="on" />
            <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
            <meta name="color-scheme" content="light dark" />

            <Script id="load-non-critical-css" strategy="afterInteractive">
                {`
                    // Load non-critical CSS after page is interactive
                    const loadCSS = (href) => {
                        const link = document.createElement('link');
                        link.rel = 'stylesheet';
                        link.href = href;
                        link.media = 'print';
                        document.head.appendChild(link);
                        link.onload = () => { link.media = 'all'; };
                    };
                    
                    // Defer loading of component styles
                    requestIdleCallback(() => {
                        loadCSS('/non-critical.css');
                    });
                `}
            </Script>
        </head>

        <body className={`font-sans antialiased ${inter.className}`}>
        <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
        >
            Skip to main content
        </a>

        <Script
            id="structured-data"
            type="application/ld+json"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify([jsonLd, structuredData]),
            }}
        />
        <NextIntlClientProvider>
        <AuthProvider>
            <OneSignalInit />
            <NotificationProvider>
                <ChatProvider>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                        storageKey="Trustora-theme"
                    >
                        <ActivityTracker />

                        {/* Main content */}
                        <main id="main-content">{children}</main>

                        <Toaster position="top-right" expand={false} richColors closeButton />
                    </ThemeProvider>
                </ChatProvider>
            </NotificationProvider>
        </AuthProvider>
        </NextIntlClientProvider>
        </body>
        </html>
    )
}
