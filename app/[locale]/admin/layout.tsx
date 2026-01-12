"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';
import { useAsyncTranslation } from '@/hooks/use-async-translation';
import { Locale } from '@/types/locale';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const locale = (pathname.split('/')[1] as Locale) || 'ro';
  const loadingText = useAsyncTranslation(locale, 'admin.loading');
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/signin?callbackUrl=' + encodeURIComponent('/admin'));
        return;
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>{loadingText}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="bg-gradient-to-b from-background via-background to-muted/40 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
        <Header />
        <main className="relative">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_rgba(255,255,255,0)_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_rgba(15,23,42,0)_55%)]" />
          <div className="relative">{children}</div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
