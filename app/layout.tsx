import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/auth-context';
import ActivityTracker from '@/components/ActivityTracker';


const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Nexora - Marketplace de Servicii IT',
  description: 'Platforma românească pentru servicii IT profesionale. Găsește experți în dezvoltare web, design, marketing digital și multe altele.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ro" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
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
        </AuthProvider>
      </body>
    </html>
  );
}
