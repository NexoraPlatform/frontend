import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/auth-context';
import ActivityTracker from '@/components/ActivityTracker';
import { NotificationProvider } from "@/contexts/notification-context";
import { ChatProvider } from "@/contexts/chat-context";
import './globals.css';
import Script from 'next/script';
import { generateSEO, generateStructuredData } from "@/lib/seo";
import React from "react";

// Optimized font loading for modern browsers
const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    preload: true,
    variable: '--font-inter',
    adjustFontFallback: true,
    fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segue UI', 'Roboto', 'Arial', 'sans-serif'],
});

// Separate viewport export for Next.js 15
export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: 'cover',
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#3b82f6' },
        { media: '(prefers-color-scheme: dark)', color: '#1e40af' },
    ],
    colorScheme: 'light dark',
};

// Minimal critical CSS using modern features
const criticalCSS = `
/* Modern CSS with native cascade layers and container queries */
@layer reset, base, utilities;

@layer reset {
  /* Modern CSS reset */
  *,::before,::after{
    box-sizing:border-box;
    margin:0;
    padding:0;
  }
}

@layer base {
  /* CSS Custom Properties with fallbacks */
  :root {
    --font-inter: ${inter.style.fontFamily}, system-ui, -apple-system, sans-serif;
    --color-background: light-dark(#ffffff, #0f172a);
    --color-foreground: light-dark(#0f172a, #f8fafc);
    --gradient-hero: light-dark(
      linear-gradient(135deg, #eff6ff 0%, #e0e7ff 50%, #f3e8ff 100%),
      linear-gradient(135deg, rgba(30, 58, 138, 0.2) 0%, rgba(67, 56, 202, 0.2) 50%, rgba(126, 34, 206, 0.2) 100%)
    );
  }

  html {
    line-height: 1.6;
    text-size-adjust: 100%;
    tab-size: 4;
    font-feature-settings: normal;
    font-variation-settings: normal;
    scroll-behavior: smooth;
  }

  body {
    font-family: var(--font-inter);
    background-color: var(--color-background);
    color: var(--color-foreground);
    font-synthesis: none;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow-x: hidden;
  }
}

@layer utilities {
  /* Container queries for responsive design */
  @container (width > 768px) {
    .container-lg {
      padding-inline: 2rem;
    }
  }

  /* Modern hero styles with native CSS nesting */
  .hero-container {
    min-block-size: 100vh;
    min-block-size: 100dvh; /* Dynamic viewport height */
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--gradient-hero);
    container-type: inline-size;
    
    & .hero-title {
      font-size: clamp(3rem, 8vw, 6rem);
      line-height: 1;
      font-weight: 900;
      text-align: center;
      margin-block-end: 2rem;
    }
    
    & .hero-description {
      font-size: clamp(1.25rem, 4vw, 1.875rem);
      line-height: 1.625;
      text-align: center;
      max-inline-size: 56rem;
      margin-inline: auto;
      margin-block-end: 3rem;
      font-weight: 500;
      color: light-dark(#64748b, #94a3b8);
    }
  }

  /* Modern loading states */
  @keyframes skeleton {
    from { background-position: -200px 0; }
    to { background-position: calc(200px + 100%) 0; }
  }

  .skeleton {
    background: linear-gradient(90deg, #f1f5f9 25%, rgba(241, 245, 249, 0.5) 50%, #f1f5f9 75%);
    background-size: 200px 100%;
    animation: skeleton 1.2s ease-in-out infinite;
    
    @media (prefers-reduced-motion) {
      animation: none;
      background: #f1f5f9;
    }
  }

  /* Logical properties for better i18n */
  .container {
    inline-size: 100%;
    max-inline-size: 1280px;
    margin-inline: auto;
    padding-inline: 1rem;
  }

  /* Modern utility classes */
  .flex { display: flex; }
  .items-center { align-items: center; }
  .justify-between { justify-content: space-between; }
  .text-center { text-align: center; }
  .mx-auto { margin-inline: auto; }
  
  /* Modern focus styles */
  .focus-ring {
    outline: 2px solid transparent;
    outline-offset: 2px;
    
    &:focus-visible {
      outline-color: #3b82f6;
      outline-offset: 4px;
    }
  }
}

/* Prefers-reduced-motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Modern font loading with font-display: swap */
@font-face {
  font-family: 'Inter Fallback';
  src: local('system-ui'), local('Arial'), local('Helvetica');
  font-display: swap;
  ascent-override: 90.20%;
  descent-override: 22.48%;
  line-gap-override: 0.00%;
  size-adjust: 107.40%;
}
`;

export const metadata: Metadata = generateSEO({
    title: 'Nexora - Marketplace de Servicii IT Premium',
    description: 'Conectează-te cu cei mai buni experți IT din România. Dezvoltare web, aplicații mobile, design UI/UX, marketing digital. Plăți securizate, experți verificați.',
    keywords: [
        'nexora', 'servicii IT România', 'dezvoltare web', 'aplicații mobile',
        'design UI/UX', 'marketing digital', 'freelanceri IT', 'dezvoltatori România',
        'programare React', 'WordPress', 'SEO', 'e-commerce', 'startup tech'
    ],
    url: '/',
});

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    const organizationStructuredData = generateStructuredData({
        type: 'Organization',
    });

    const websiteStructuredData = generateStructuredData({
        type: 'WebSite',
    });

    return (
        <html lang="ro" suppressHydrationWarning className={inter.variable}>
        <head>
            {/* Critical resource hints */}
            <link rel="dns-prefetch" href="//images.pexels.com" />
            <link rel="dns-prefetch" href="//api.nexora.ro" />

            {/* Modern favicon with format selection */}
            <link rel="icon" href="/logo.webp" sizes="32x32" type="image/webp" />
            {/*<link rel="icon" href="/favicon.ico" sizes="32x32" type="image/x-icon" />*/}
            <link rel="apple-touch-icon" href="/logo.webp" sizes="180x180" />
            <link rel="mask-icon" href="/logo.webp" color="#3b82f6" />

            {/* PWA manifest */}
            <link rel="manifest" href="/manifest.json" />

            {/* Format detection and mobile optimizations */}
            <meta name="format-detection" content="telephone=no" />
            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="default" />

            {/* Inline critical CSS with modern features */}
            <style dangerouslySetInnerHTML={{ __html: criticalCSS }} />

            {/* Preload critical assets */}
            <link
                rel="preload"
                href="/logo-60.webp"
                as="image"
                type="image/webp"
                fetchPriority="high"
            />
            <link
                rel="preload"
                href="/logo-white-60.webp"
                as="image"
                type="image/webp"
                fetchPriority="high"
            />
            <link
                rel="preload"
                href="/logo-120.webp"
                as="image"
                type="image/webp"
                fetchPriority="high"
            />
            <link
                rel="preload"
                href="/logo-120.avif"
                as="image"
                type="image/avif"
                fetchPriority="high"
            />

            {/* Performance optimization meta tags */}
            <meta httpEquiv="x-dns-prefetch-control" content="on" />
            <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />

            {/* Modern browser hints */}
            <meta name="color-scheme" content="light dark" />
            <meta name="supported-color-schemes" content="light dark" />

            {/* Defer loading of non-critical CSS */}
            <Script id="load-dynamically-non-critical-css" strategy="lazyOnload">
                {`
                    // Dynamically load non-critical CSS after page is interactive
                    document.addEventListener('DOMContentLoaded', function() {
                        const link = document.createElement('link');
                        link.rel = 'stylesheet';
                        link.href = '/non-critical.css';
                        link.media = 'print'; // Initially load as print media
                        document.head.appendChild(link);
                        
                        // Switch to screen media after load for better performance
                        link.onload = function() {
                            link.media = 'all';
                        };
                    });
                `}
            </Script>
        </head>

        <body className={`font-sans antialiased ${inter.className}`}>
        <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded focus-ring"
        >
            Skip to main content
        </a>

        <Script
            id="org-jsonld"
            type="application/ld+json"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify(organizationStructuredData),
            }}
        />
        <Script
            id="website-jsonld"
            type="application/ld+json"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify(websiteStructuredData),
            }}
        />

        {/* Context Providers with optimized nesting */}
        <AuthProvider>
            <NotificationProvider>
                <ChatProvider>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                        storageKey="nexora-theme"
                    >
                        <ActivityTracker />

                        {/* Main content */}
                        <main id="main-content">
                            {children}
                        </main>

                        {/* Toast notifications */}
                        <Toaster
                            position="top-right"
                            expand={false}
                            richColors
                            closeButton
                        />
                    </ThemeProvider>
                </ChatProvider>
            </NotificationProvider>
        </AuthProvider>

        {/* Modern performance monitoring */}
        {process.env.NODE_ENV === 'production' && (
            <Script strategy="lazyOnload" id="perf-monitor">
                {`
                        // Modern performance monitoring with native APIs
                        if ('PerformanceObserver' in window) {
                            try {
                                // Monitor Core Web Vitals
                                const observer = new PerformanceObserver((list) => {
                                    for (const entry of list.getEntries()) {
                                        const { name, startTime, value } = entry;
                                        
                                        // Use modern console methods
                                        switch (name) {
                                            case 'LCP':
                                                console.info('🎯 LCP:', Math.round(startTime), 'ms');
                                                break;
                                            case 'FID':
                                                console.info('⚡ FID:', Math.round(value), 'ms');
                                                break;
                                            case 'CLS':
                                                if (!entry.hadRecentInput) {
                                                    console.info('📐 CLS:', Math.round(value * 1000) / 1000);
                                                }
                                                break;
                                        }
                                    }
                                });

                                // Observe all relevant entry types
                                observer.observe({
                                    entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift']
                                });

                                // Modern navigation API monitoring
                                if ('navigation' in performance) {
                                    console.info('🚀 Navigation Type:', performance.navigation.type);
                                }
                                
                            } catch (error) {
                                console.warn('Performance monitoring failed:', error);
                            }
                        }
                    `}
            </Script>
        )}
        </body>
        </html>
    );
}
