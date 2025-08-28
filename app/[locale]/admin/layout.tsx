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
    <div className="min-h-screen bg-background">
      <Header />
      {children}
      <Footer />
    </div>
  );
}
