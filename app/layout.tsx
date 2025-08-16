import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/auth-context';
import ActivityTracker from '@/components/ActivityTracker';
import {NotificationProvider} from "@/contexts/notification-context";
import {ChatProvider} from "@/contexts/chat-context";
import './globals.css';
import Script from 'next/script';
import {generateSEO, generateStructuredData} from "@/lib/seo";

// Optimized font loading
const inter = Inter({
    subsets: ['latin-ext'],
    display: 'swap',
    adjustFontFallback: true,
    fallback: ['system-ui','Segoe UI','Roboto','Arial'],
    variable: '--font-inter',
});

const criticalCSS = `
:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 247, 38%, 46%;
  --primary-foreground: 210 40% 98%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --border: 214.3 31.8% 91.4%;
  --nexora-blue: 221 83% 53%;
  --nexora-blue-dark: 221 83% 43%;
  --radius: 0.75rem;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 221 83% 53%;
    --muted-foreground: 215 20.2% 65.1%;
    --border: 217.2 32.6% 17.5%;
  }
}

/* Essential Base Styles */
* {
  box-sizing: border-box;
  border: 0 solid hsl(var(--border));
}

body {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  font-feature-settings: "rlig" 1, "calt" 1;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Typography - Critical for hero section */
.font-black { font-weight: 900; }
.text-6xl { font-size: 3.75rem; line-height: 1; }
.text-8xl { font-size: 6rem; line-height: 1; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }
.text-base { font-size: 1rem; line-height: 1.5rem; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.leading-none { line-height: 1; }

/* Layout - Essential for header and hero */
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
}
.flex { display: flex; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.space-x-2 > * + * { margin-left: 0.5rem; }
.space-x-4 > * + * { margin-left: 1rem; }
.min-h-screen { min-height: 100vh; }
.relative { position: relative; }
.absolute { position: absolute; }
.fixed { position: fixed; }
.sticky { position: sticky; }
.top-0 { top: 0; }
.inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
.z-10 { z-index: 10; }
.z-50 { z-index: 50; }

/* Spacing - Critical margins/padding */
.p-4 { padding: 1rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.py-8 { padding-top: 2rem; padding-bottom: 2rem; }
.mb-8 { margin-bottom: 2rem; }
.mb-12 { margin-bottom: 3rem; }
.mt-2 { margin-top: 0.5rem; }

/* Colors - Essential for hero and header */
.text-primary { color: hsl(var(--primary)); }
.text-muted-foreground { color: hsl(var(--muted-foreground)); }
.text-white { color: #ffffff; }
.text-blue-600 { color: #2563eb; }
.bg-white { background-color: #ffffff; }
.bg-background { background-color: hsl(var(--background)); }

/* Essential Gradients - Simplified */
.nexora-gradient {
  background: linear-gradient(135deg, hsl(var(--nexora-blue)), hsl(var(--nexora-blue-dark)));
}

.bg-gradient-to-r {
  background-image: linear-gradient(to right, var(--tw-gradient-stops));
}

.bg-gradient-to-br {
  background-image: linear-gradient(to bottom right, var(--tw-gradient-stops));
}

.from-blue-600 { --tw-gradient-from: #2563eb; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgb(37 99 235 / 0)); }
.to-purple-600 { --tw-gradient-to: #9333ea; }

/* Text gradients - Hero critical */
.bg-clip-text { background-clip: text; -webkit-background-clip: text; }
.text-transparent { color: transparent; }

/* Essential Button Styles */
.btn-base {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: calc(var(--radius) - 2px);
  font-weight: 500;
  transition-property: color, background-color, border-color;
  transition-duration: 0.2s;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  outline: 2px solid transparent;
  outline-offset: 2px;
}

.btn-lg {
  height: 3rem;
  padding: 0 2rem;
  font-size: 1.125rem;
}

/* Essential Border/Shadow */
.border { border-width: 1px; }
.border-b { border-bottom-width: 1px; }
.rounded-xl { border-radius: 0.75rem; }
.shadow-lg { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); }

/* Glass Effect - Header critical */
.glass-effect {
  backdrop-filter: blur(20px) saturate(180%);
  background-color: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.dark .glass-effect {
  background-color: rgba(17, 25, 40, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Essential Animations - Simplified */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fadeIn {
  animation: fadeIn 0.6s ease-out;
}

/* Essential hover states */
.transition-colors {
  transition-property: color, background-color, border-color;
  transition-duration: 0.15s;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.hover\\:text-primary:hover { color: hsl(var(--primary)); }
.hover\\:scale-105:hover { transform: scale(1.05); }

/* Critical responsive classes */
@media (min-width: 768px) {
  .md\\:flex { display: flex; }
  .md\\:hidden { display: none; }
  .md\\:text-6xl { font-size: 3.75rem; line-height: 1; }
}

@media (min-width: 1024px) {
  .lg\\:flex { display: flex; }
  .lg\\:hidden { display: none; }
  .lg\\:text-8xl { font-size: 6rem; line-height: 1; }
}

/* Accessibility - Critical */
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

.focus\\:ring-2:focus {
  box-shadow: 0 0 0 2px hsl(var(--nexora-blue));
}

/* Prefers reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* ==============================================
   NON-CRITICAL CSS - LOAD AFTER ABOVE FOLD
   ============================================== */

/* Load these styles after critical path */
.lazy-load-styles {
  /* Move complex animations, decorative elements, and below-fold styles here */
}

/* Reduced Animation Complexity */
.simple-hover {
  transition: opacity 0.2s ease;
}

.simple-hover:hover {
  opacity: 0.8;
}

/* Remove complex keyframes and replace with simple transitions */
.card-simple-hover {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card-simple-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: hsl(var(--nexora-blue));
  color: white;
  padding: 8px 16px;
  text-decoration: none;
  border-radius: 4px;
  z-index: 1000;
  transition: top 0.3s;
  font-weight: 600;
}

.skip-link:focus {
  top: 6px;
}
`;

export const metadata: Metadata = generateSEO({
    title: 'Marketplace de Servicii IT',
    description: 'Conectează-te cu cei mai buni experți IT din România.',
    keywords: ['nexora', 'web development', 'modern applications', 'next generation', 'platform', 'servicii IT', 'dezvoltare web', 'design', 'marketing digital', 'freelanceri România', 'aplicații mobile', 'SEO', 'WordPress', 'React', 'prestatori IT'],
    url: '/',
})

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    const organizationStructuredData = generateStructuredData({
        type: 'Organization',
    })

    const websiteStructuredData = generateStructuredData({
        type: 'WebSite',
    })

    return (
        <html lang="ro" suppressHydrationWarning className={inter.variable}>
        <head>
            {/* Critical resource hints */}
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
            <link rel="dns-prefetch" href="//images.pexels.com" />

            {/* Optimized icon loading */}
            <link rel="icon" href="/logo.webp" sizes="32x32" />
            <link rel="apple-touch-icon" href="/logo.webp" sizes="180x180" />

            {/* PWA */}
            <link rel="manifest" href="/manifest.json" />
            <meta name="theme-color" content="#3b82f6" />

            {/* Viewport and performance */}
            <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
            <meta name="format-detection" content="telephone=no" />
            <meta name="color-scheme" content="light dark" />
            <style dangerouslySetInnerHTML={{ __html: criticalCSS }} />

            <noscript
                dangerouslySetInnerHTML={{
                    __html: '<link rel="stylesheet" href="/non-critical.css" />', // note the leading slash
                }}
            />

            {/* Performance hint */}
            <meta httpEquiv="x-dns-prefetch-control" content="on"/>
        </head>
        <body className="font-sans antialiased">
        {/* Optimized script loading */}
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
        <Script id="load-non-critical-css" strategy="afterInteractive">
            {`(function(){
  var l=document.createElement('link');
  l.rel='stylesheet'; l.href='/non-critical.css';
  if(!document.querySelector('link[rel~="stylesheet"][href="'+l.href+'"]')){
    document.head.appendChild(l);
  }
})();`}
        </Script>
        <AuthProvider>
            <NotificationProvider>
                <ChatProvider>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <ActivityTracker />
                        {children}
                        <Toaster />
                    </ThemeProvider>
                </ChatProvider>
            </NotificationProvider>
        </AuthProvider>
        </body>
        </html>
    );
}
