"use client";

import { useTranslations } from 'next-intl';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';
import { usePathname } from '@/lib/navigation';

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, userLoading } = useAuth();
  const t = useTranslations();
  const pathname = usePathname();
  const loadingText = t('admin.loading');
  const isAdminDashboardRoute = pathname === '/admin' || pathname.startsWith('/admin/');

  if (loading || userLoading) {
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

  if (isAdminDashboardRoute) {
    return <div className="min-h-screen bg-background text-foreground">{children}</div>;
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
