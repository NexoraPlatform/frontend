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
    title: 'Nexora - Marketplace de Servicii IT | Platforma #1 din România',
    description: 'Platforma românească pentru servicii IT profesionale. Găsește experți verificați în dezvoltare web, design UI/UX, marketing digital, aplicații mobile și multe altele. Peste 500 de experți, 2000+ proiecte finalizate.',
    keywords: 'servicii IT, dezvoltare web, design, marketing digital, freelanceri România, aplicații mobile, SEO, WordPress, React, prestatori IT',
    authors: [{ name: 'Nexora Team' }],
    creator: 'Nexora',
    publisher: 'Nexora',
    robots: 'index, follow',
    openGraph: {
        type: 'website',
        locale: 'ro_RO',
        url: 'https://nexora.ro',
        siteName: 'Nexora',
        title: 'Nexora - Marketplace de Servicii IT | Platforma #1 din România',
        description: 'Conectează-te cu cei mai buni experți IT din România. Dezvoltare web, design, marketing digital și multe altele.',
        images: [
            {
                url: '/og-image.jpg',
                width: 1200,
                height: 630,
                alt: 'Nexora - Marketplace de Servicii IT',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Nexora - Marketplace de Servicii IT',
        description: 'Conectează-te cu cei mai buni experți IT din România',
        images: ['/og-image.jpg'],
    },
    verification: {
        google: 'your-google-verification-code',
    },
    alternates: {
        canonical: 'https://nexora.ro',
    },
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ro" suppressHydrationWarning>
        <head>
            <link rel="manifest" href="/manifest.json" />
            <link rel="icon" href="/logo.png" />
            <link rel="apple-touch-icon" href="/logo.png" />
            <meta name="theme-color" content="#3b82f6" />
            <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
            <meta name="format-detection" content="telephone=no" />
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link rel="dns-prefetch" href="//images.pexels.com" />
        </head>
        <body className={`${inter.className} antialiased`}>
        <AuthProvider>
            <NotificationProvider>
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
            </NotificationProvider>
        </AuthProvider>
        </body>
        </html>
    );
}
