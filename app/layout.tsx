import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/auth-context';
import ActivityTracker from '@/components/ActivityTracker';
import {NotificationProvider} from "@/contexts/notification-context";


const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: {
        default: 'Nexora - Marketplace de Servicii IT | Platforma #1 din România',
        template: '%s | Nexora - Marketplace IT România'
    },
    description: 'Platforma românească pentru servicii IT profesionale. Găsește experți verificați în dezvoltare web, design UI/UX, marketing digital, aplicații mobile și multe altele. Peste 500 de experți, 2000+ proiecte finalizate cu garanție.',
    keywords: 'servicii IT, dezvoltare web, design, marketing digital, freelanceri România, aplicații mobile, SEO, WordPress, React, prestatori IT',
    authors: [{ name: 'Nexora Team' }],
    creator: 'Nexora',
    publisher: 'Nexora',
    robots: 'index, follow',
    category: 'technology',
    classification: 'Business',
    referrer: 'origin-when-cross-origin',
    openGraph: {
        type: 'website',
        locale: 'ro_RO',
        url: 'https://nexora.ro',
        siteName: 'Nexora',
        title: 'Nexora - Marketplace de Servicii IT | Platforma #1 din România',
        description: 'Conectează-te cu cei mai buni experți IT din România. Dezvoltare web, design, marketing digital și multe altele. Peste 500 experți verificați.',
        images: [
            {
                url: '/og-image.jpg',
                width: 1200,
                height: 630,
                alt: 'Nexora - Marketplace de Servicii IT',
                type: 'image/jpeg',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        site: '@nexora_ro',
        creator: '@nexora_ro',
        title: 'Nexora - Marketplace de Servicii IT',
        description: 'Conectează-te cu cei mai buni experți IT din România. Peste 500 experți verificați.',
        images: ['/og-image.jpg'],
    },
    verification: {
        google: 'your-google-verification-code',
        yandex: 'your-yandex-verification-code',
        yahoo: 'your-yahoo-verification-code',
        other: {
            'msvalidate.01': 'your-bing-verification-code',
        },
    },
    alternates: {
        canonical: 'https://nexora.ro',
        languages: {
            'ro-RO': 'https://nexora.ro',
            'en-US': 'https://nexora.ro/en',
        },
    },
    metadataBase: new URL('https://nexora.ro'),
    applicationName: 'Nexora',
    generator: 'Next.js',
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ro" suppressHydrationWarning dir="ltr">
        <head>
            {/* Preconnect to external domains */}
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link rel="dns-prefetch" href="//images.pexels.com" />
            <link rel="dns-prefetch" href="//api.nexora.ro" />

            {/* PWA */}
            <link rel="manifest" href="/manifest.json" />
            <link rel="icon" href="/logo.png" />
            <link rel="apple-touch-icon" href="/logo.png" />
            <link rel="apple-touch-icon" sizes="180x180" href="/logo.png" />
            <link rel="icon" type="image/png" sizes="32x32" href="/logo.png" />
            <link rel="icon" type="image/png" sizes="16x16" href="/logo.png" />

            {/* Theme and viewport */}
            <meta name="theme-color" content="#3b82f6" />
            <meta name="theme-color" media="(prefers-color-scheme: light)" content="#3b82f6" />
            <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#1e40af" />
            <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
            <meta name="format-detection" content="telephone=no" />

            {/* Security */}
            <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
            <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
            <meta name="referrer" content="origin-when-cross-origin" />

            {/* Performance */}
            <link rel="preload" href="/logo.png" as="image" type="image/png" />
            <meta name="color-scheme" content="light dark" />
        </head>
        <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        {/* Skip to main content for accessibility */}
        <a
            href="#main-content"
            className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50 focus:z-50"
        >
            Sari la conținutul principal
        </a>

        <AuthProvider>
            <NotificationProvider>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <ActivityTracker />
                    <div id="main-content" tabIndex={-1}>
                        {children}
                    </div>
                    <div id="portal-root" />
                    <Toaster />
                </ThemeProvider>
            </NotificationProvider>
        </AuthProvider>
        </body>
        </html>
    );
}
