import type { Metadata } from 'next';
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

// Optimized font loading with display swap for better CLS
const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    preload: true,
    variable: '--font-inter',
    adjustFontFallback: true,
    fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Arial', 'sans-serif'],
});

// Inline critical CSS for above-the-fold content
const criticalCSS = `
/* Immediate render styles - prevents FOUC */
html { line-height: 1.6; -webkit-text-size-adjust: 100%; }
body { 
  font-family: ${inter.style.fontFamily}, system-ui, -apple-system, sans-serif;
  background-color: #ffffff;
  color: #0f172a;
  margin: 0;
  padding: 0;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  body {
    background-color: #0f172a;
    color: #f8fafc;
  }
}

/* Hero section immediate styles to prevent layout shift */
.hero-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eff6ff, #e0e7ff, #f3e8ff);
}

@media (prefers-color-scheme: dark) {
  .hero-container {
    background: linear-gradient(135deg, rgba(30, 58, 138, 0.2), rgba(67, 56, 202, 0.2), rgba(126, 34, 206, 0.2));
  }
}

/* Prevent layout shift for hero text */
.hero-title {
  font-size: 3.75rem;
  line-height: 1;
  font-weight: 900;
  text-align: center;
  margin-bottom: 2rem;
}

@media (min-width: 1024px) {
  .hero-title { font-size: 6rem; }
}

.hero-description {
  font-size: 1.5rem;
  line-height: 1.625;
  text-align: center;
  max-width: 56rem;
  margin: 0 auto 3rem;
  font-weight: 500;
  color: #64748b;
}

@media (min-width: 1024px) {
  .hero-description { font-size: 1.875rem; }
}

/* Loading state for images */
img { 
  max-width: 100%; 
  height: auto; 
  display: block; 
}

/* Header immediate styles */
.header-container {
  height: 5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e2e8f0;
}

/* Skeleton animation for loading states */
@keyframes skeleton {
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
}

.skeleton {
  background: linear-gradient(90deg, #f1f5f9 25%, rgba(241, 245, 249, 0.5) 50%, #f1f5f9 75%);
  background-size: 200px 100%;
  animation: skeleton 1.2s ease-in-out infinite;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  .skeleton { animation: none; background: #f1f5f9; }
}
`;

export const metadata: Metadata = generateSEO({
    title: 'Nexora - Marketplace de Servicii IT',
    description: 'Conectează-te cu cei mai buni experți IT din România. Dezvoltare web, aplicații mobile, design, marketing digital.',
    keywords: ['nexora', 'servicii IT', 'dezvoltare web', 'design', 'marketing digital', 'freelanceri România', 'aplicații mobile', 'SEO', 'WordPress', 'React'],
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
            {/* Critical resource hints - preload most important assets */}
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
            <link rel="dns-prefetch" href="//images.pexels.com" />

            {/* Optimized favicon */}
            <link rel="icon" href="/logo.webp" sizes="32x32" type="image/webp" />
            <link rel="apple-touch-icon" href="/logo.webp" sizes="180x180" />

            {/* PWA manifest */}
            <link rel="manifest" href="/manifest.json" />
            <meta name="theme-color" content="#3b82f6" />

            {/* Viewport and performance */}
            <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
            <meta name="format-detection" content="telephone=no" />
            <meta name="color-scheme" content="light dark" />

            {/* Inline critical CSS to eliminate render-blocking */}
            <style dangerouslySetInnerHTML={{ __html: criticalCSS }} />

            {/* Preload critical assets */}
            <link
                rel="preload"
                href="/logo.webp"
                as="image"
                type="image/webp"
                fetchPriority="high"
            />

            {/* Non-critical CSS loaded asynchronously */}
            <link
                rel="preload"
                href="/non-critical.css"
                as="style"
            />
            <noscript
                dangerouslySetInnerHTML={{
                    __html: '<link rel="stylesheet" href="/non-critical.css" />', // note the leading slash
                }}
            />

            {/* Performance optimization meta tags */}
            <meta httpEquiv="x-dns-prefetch-control" content="on" />
        </head>

        <body className="font-sans antialiased">
        {/* Structured data - loaded with high priority but non-blocking */}
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

        {/* Load non-critical CSS after page load */}
        <Script id="load-non-critical-css" strategy="lazyOnload">
            {`
            const loadCSS = (href) => {
              if (document.querySelector('link[href="' + href + '"]')) return;
              const link = document.createElement('link');
              link.rel = 'stylesheet';
              link.href = href;
              link.media = 'print';
              link.onload = () => { link.media = 'all'; };
              document.head.appendChild(link);
            };
            loadCSS('/non-critical.css');
          `}
        </Script>



        {/* Context Providers with optimized nesting */}
        <AuthProvider>
            <NotificationProvider>
                <ChatProvider>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        {/* Activity tracker loaded after critical path */}
                        <ActivityTracker />

                        {/* Main content */}
                        {children}

                        {/* Toast notifications - loaded last */}
                        <Toaster />
                    </ThemeProvider>
                </ChatProvider>
            </NotificationProvider>
        </AuthProvider>

        {/* Performance monitoring script - loaded last */}
        <Script strategy="lazyOnload" id="perf-monitor">
            {`
            if ('performance' in window && 'observer' in window.PerformanceObserver.prototype) {
              // Monitor LCP
              new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                  if (entry.entryType === 'largest-contentful-paint') {
                    console.log('LCP:', entry.startTime);
                  }
                }
              }).observe({entryTypes: ['largest-contentful-paint']});

              // Monitor CLS
              new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                  if (!entry.hadRecentInput) {
                    console.log('CLS:', entry.value);
                  }
                }
              }).observe({entryTypes: ['layout-shift']});
            }
          `}
        </Script>
        </body>
        </html>
    );
}
