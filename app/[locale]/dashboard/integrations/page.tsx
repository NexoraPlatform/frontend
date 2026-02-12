"use client";

import { useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, PlugZap } from 'lucide-react';
import { toast } from 'sonner';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import IntegrationCard from '@/components/integrations/IntegrationCard';
import { TrustoraThemeStyles } from '@/components/trustora/theme-styles';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/auth-context';
import { buildOAuthRedirectUrl, resolveBackendUrl } from '@/lib/backend-url';
import { useRouter } from '@/lib/navigation';
import type { ConnectedAccount, IntegrationProvider } from '@/types/integration';

const AVAILABLE_PROVIDERS: IntegrationProvider[] = ['github', 'google', 'figma'];

const providerLabel: Record<IntegrationProvider, string> = {
  github: 'GitHub',
  google: 'Google',
  figma: 'Figma',
};

export default function DashboardIntegrationsPage() {
  const { user, loading, userLoading, refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const feedbackHandled = useRef(false);
  const backendUrl = useMemo(resolveBackendUrl, []);

  useEffect(() => {
    if (loading || userLoading) return;
    if (user) return;

    const callbackUrl = `${window.location.pathname}${window.location.search}`;
    router.replace(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }, [loading, router, user, userLoading]);

  useEffect(() => {
    if (feedbackHandled.current) return;
    const status = searchParams.get('status');
    if (!status) return;

    feedbackHandled.current = true;
    const provider = searchParams.get('provider') as IntegrationProvider | null;
    const message = searchParams.get('message');

    if (status === 'success') {
      const providerText = provider ? providerLabel[provider] : 'provider';
      toast.success(message || `Connected via ${providerText}!`);
      void refreshUser();
    } else if (status === 'failed') {
      toast.error(message || 'Connection failed');
    }

    const url = new URL(window.location.href);
    url.searchParams.delete('status');
    url.searchParams.delete('provider');
    url.searchParams.delete('message');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }, [refreshUser, searchParams]);

  const connectedByProvider = useMemo(() => {
    const index = new Map<IntegrationProvider, ConnectedAccount>();
    const accounts = (Array.isArray(user?.connected_accounts) ? user?.connected_accounts : []) ?? [];

    accounts.forEach((account) => {
      if (account?.provider && AVAILABLE_PROVIDERS.includes(account.provider)) {
        index.set(account.provider, account);
      }
    });

    return index;
  }, [user?.connected_accounts]);

  const handleDisconnect = (provider: IntegrationProvider) => {
    toast.info(`Disconnect for ${providerLabel[provider]} will be available soon.`);
  };

  if (loading || userLoading) {
    return (
      <div className="min-h-screen bg-white text-[#0F172A] dark:bg-[#070C14] dark:text-[#E6EDF3]">
        <TrustoraThemeStyles />
        <Header />
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white text-[#0F172A] dark:bg-[#070C14] dark:text-[#E6EDF3]">
        <TrustoraThemeStyles />
        <Header />
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#0F172A] dark:bg-[#070C14] dark:text-[#E6EDF3]">
      <TrustoraThemeStyles />
      <Header />

      <main className="pt-24">
        <section className="hero-gradient px-6 pb-10">
          <div className="mx-auto max-w-6xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-[#1E2A3D] dark:bg-[#0F172A] dark:text-slate-200">
              <PlugZap className="h-3.5 w-3.5 text-emerald-500" />
              Integrations
            </div>
            <h1 className="mt-4 text-3xl font-bold text-[#0B1C2D] dark:text-[#E6EDF3]">
              Connect your external accounts
            </h1>
            <p className="mt-2 max-w-2xl text-slate-600 dark:text-[#A3ADC2]">
              Connect Figma, Google and GitHub to unlock provider-specific delivery flows in Nexora.
            </p>
          </div>
        </section>

        <section className="bg-[#F5F7FA] px-6 py-12 dark:bg-[#0B1220]">
          <div className="mx-auto max-w-6xl space-y-6">
            {!backendUrl ? (
              <Alert variant="destructive">
                <AlertDescription>
                  Missing backend URL. Configure <code>NEXT_PUBLIC_BACKEND_URL</code> (or <code>NEXT_PUBLIC_API_URL</code>) to enable OAuth connect links.
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {AVAILABLE_PROVIDERS.map((provider) => {
                const accountDetails = connectedByProvider.get(provider) ?? null;
                return (
                  <IntegrationCard
                    key={provider}
                    provider={provider}
                    isConnected={Boolean(accountDetails)}
                    accountDetails={accountDetails}
                    connectHref={buildOAuthRedirectUrl(provider)}
                    onDisconnect={() => handleDisconnect(provider)}
                  />
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
