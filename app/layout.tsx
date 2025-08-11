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

const inter = Inter({
    subsets: ['latin-ext'],
    display: 'swap',
    adjustFontFallback: true,
    fallback: ['system-ui','Segoe UI','Roboto','Arial'],
    variable: '--font-inter',
});

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
            <link rel="manifest" href="/manifest.json" />
            <link rel="icon" href="/logo.webp" />
            <link rel="apple-touch-icon" href="/logo.webp" />
            <meta name="theme-color" content="#3b82f6" />
            <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
            <meta name="format-detection" content="telephone=no" />
            <link rel="dns-prefetch" href="//images.pexels.com" />
            <meta name="color-scheme" content="light dark" />
        </head>
        <body className={`font-sans antialiased`}>
        <Script id="org-jsonld" type="application/ld+json" strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(organizationStructuredData),
                }}
        />
        <Script id="website-jsonld" type="application/ld+json" strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(websiteStructuredData),
                }}
        />
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
