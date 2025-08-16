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

// Optimized font loading for Next.js 15
const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    preload: true,
    variable: '--font-inter',
    adjustFontFallback: true,
    fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
    axes: ['opsz'],
    style: ['normal'],
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

// Inline critical CSS optimized for Next.js 15 and performance
const criticalCSS = `
/* Immediate render styles - prevents FOUC and CLS */
*,::before,::after{box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}
::before,::after{--tw-content:''}
html{line-height:1.6;-webkit-text-size-adjust:100%;tab-size:4;font-feature-settings:normal;font-variation-settings:normal}
body{
  font-family:${inter.style.fontFamily},system-ui,-apple-system,sans-serif;
  background-color:#ffffff;
  color:#0f172a;
  margin:0;
  padding:0;
  -webkit-font-smoothing:antialiased;
  -moz-osx-font-smoothing:grayscale;
  text-rendering:optimizeSpeed;
  overflow-x:hidden;
}

/* Dark mode immediate styles */
@media (prefers-color-scheme: dark) {
  body {
    background-color: #0f172a;
    color: #f8fafc;
  }
}

/* Critical layout styles to prevent CLS */
.hero-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eff6ff 0%, #e0e7ff 50%, #f3e8ff 100%);
  contain: layout style paint;
}

@media (prefers-color-scheme: dark) {
  .hero-container {
    background: linear-gradient(135deg, rgba(30, 58, 138, 0.2) 0%, rgba(67, 56, 202, 0.2) 50%, rgba(126, 34, 206, 0.2) 100%);
  }
}

/* Hero text with size containment to prevent layout shift */
.hero-title {
  font-size: clamp(3rem, 8vw, 6rem);
  line-height: 1;
  font-weight: 900;
  text-align: center;
  margin-bottom: 2rem;
  contain: layout style;
}

.hero-description {
  font-size: clamp(1.25rem, 4vw, 1.875rem);
  line-height: 1.625;
  text-align: center;
  max-width: 56rem;
  margin: 0 auto 3rem;
  font-weight: 500;
  color: #64748b;
  contain: layout style;
}

/* Header with layout containment */
.header-container {
  height: 5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e2e8f0;
  contain: layout style;
}

/* Loading states optimized */
.skeleton {
  background: linear-gradient(90deg, #f1f5f9 25%, rgba(241, 245, 249, 0.5) 50%, #f1f5f9 75%);
  background-size: 200px 100%;
  animation: skeleton 1.2s ease-in-out infinite;
}

@keyframes skeleton {
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
}

/* Critical utility classes */
.container{width:100%;max-width:1280px;margin-left:auto;margin-right:auto;padding-left:1rem;padding-right:1rem}
.flex{display:flex}
.items-center{align-items:center}
.justify-between{justify-content:space-between}
.text-center{text-align:center}
.mx-auto{margin-left:auto;margin-right:auto}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *,*::before,*::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  .skeleton { animation: none; background: #f1f5f9; }
}

/* Critical font loading optimization */
@font-face {
  font-family: 'Inter Fallback';
  src: local('Arial'), local('Helvetica'), local('system-ui');
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
            {/* Critical resource hints for Next.js 15 */}
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
            <link rel="dns-prefetch" href="//images.pexels.com" />
            <link rel="dns-prefetch" href="//api.nexora.ro" />

            {/* Optimized favicon with Next.js 15 format */}
            <link rel="icon" href="/logo.webp" sizes="32x32" type="image/webp" />
            <link rel="icon" href="/favicon.ico" sizes="32x32" type="image/x-icon" />
            <link rel="apple-touch-icon" href="/logo.webp" sizes="180x180" />
            <link rel="mask-icon" href="/logo.svg" color="#3b82f6" />

            {/* PWA manifest */}
            <link rel="manifest" href="/manifest.json" />

            {/* Format detection */}
            <meta name="format-detection" content="telephone=no" />
            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="default" />

            {/* Inline critical CSS to eliminate render-blocking */}
            <style dangerouslySetInnerHTML={{ __html: criticalCSS }} />

            {/* Preload critical assets for Next.js 15 */}
            <link
                rel="preload"
                href="/logo.webp"
                as="image"
                type="image/webp"
                fetchPriority="high"
            />

            {/* Non-critical CSS loaded asynchronously */}
            <noscript
                dangerouslySetInnerHTML={{
                    __html: '<link rel="stylesheet" href="/non-critical.css" />', // note the leading slash
                }}
            />

            {/* Performance optimization meta tags */}
            <meta httpEquiv="x-dns-prefetch-control" content="on" />
            <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        </head>

        <body className="font-sans antialiased">
        {/* Skip to main content for accessibility */}
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded">
            Skip to main content
        </a>

        {/* Structured data - loaded with optimal strategy for Next.js 15 */}
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

        <Script id="load-non-critical-css" strategy="lazyOnload">
            {`
            (function() {
              if (document.querySelector('link[href="/non-critical.css"]')) return;
              const link = document.createElement('link');
              link.rel = 'stylesheet';
              link.href = '/non-critical.css';
              link.media = 'print';
              link.onload = function() { 
                this.media = 'all'; 
              };
              document.head.appendChild(link);
            })();
          `}
        </Script>

        {/* Context Providers with optimized nesting for React 18+ */}
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
                        {/* Activity tracker loaded after critical path */}
                        <ActivityTracker />

                        {/* Main content */}
                        <main id="main-content">
                            {children}
                        </main>

                        {/* Toast notifications - loaded last */}
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

        {/* Load non-critical CSS after page load with Next.js 15 optimization */}
        <Script id="load-non-critical-css" strategy="lazyOnload">
            {`
            (function() {
              if (document.querySelector('link[href="/non-critical.css"]')) return;
              const link = document.createElement('link');
              link.rel = 'stylesheet';
              link.href = '/non-critical.css';
              link.media = 'print';
              link.onload = function() { 
                this.media = 'all'; 
              };
              document.head.appendChild(link);
            })();
          `}
        </Script>

        {/* Performance monitoring optimized for Next.js 15 */}
        {process.env.NODE_ENV === 'production' && (
            <Script strategy="lazyOnload" id="perf-monitor">
                {`
              if ('performance' in window && 'PerformanceObserver' in window) {
                try {
                  // Monitor LCP
                  new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                      console.log('LCP:', Math.round(entry.startTime), 'ms');
                    }
                  }).observe({entryTypes: ['largest-contentful-paint']});

                  // Monitor CLS
                  let clsValue = 0;
                  new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                      if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                        console.log('CLS:', Math.round(clsValue * 1000) / 1000);
                      }
                    }
                  }).observe({entryTypes: ['layout-shift']});

                  // Monitor FID/INP
                  new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                      console.log('FID:', Math.round(entry.processingStart - entry.startTime), 'ms');
                    }
                  }).observe({entryTypes: ['first-input']});
                } catch (e) {
                  console.warn('Performance monitoring failed:', e);
                }
              }
            `}
            </Script>
        )}
        </body>
        </html>
    );
}
