"use client";

import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Chrome, Figma, Github, Loader2, Link2 } from 'lucide-react';
import { useRouter } from '@/lib/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { TrustoraThemeStyles } from '@/components/trustora/theme-styles';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ProviderConnectCard from '@/components/ProviderConnectCard';
import type { OAuthProvider } from '@/types/auth';
import { buildOAuthRedirectUrl, resolveBackendUrl } from '@/lib/backend-url';

const BACKEND_URL = resolveBackendUrl();

const OAUTH_PROVIDERS: Array<{
    key: OAuthProvider;
    title: string;
    description: string;
    icon: ReactNode;
}> = [
    {
        key: 'github',
        title: 'GitHub',
        description: 'Connect your GitHub account for repository-based delivery.',
        icon: <Github className="h-5 w-5" />,
    },
    {
        key: 'google',
        title: 'Google',
        description: 'Connect Google for Drive and Analytics delivery flows.',
        icon: <Chrome className="h-5 w-5" />,
    },
    {
        key: 'figma',
        title: 'Figma',
        description: 'Connect Figma to deliver design resources securely.',
        icon: <Figma className="h-5 w-5" />,
    },
];

export default function IntegrationsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading, userLoading, refreshUser } = useAuth();
    const callbackHandled = useRef(false);

    useEffect(() => {
        if (loading || userLoading) return;
        if (user) return;
        const callbackUrl = `${window.location.pathname}${window.location.search}`;
        router.replace(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }, [loading, router, user, userLoading]);

    useEffect(() => {
        if (callbackHandled.current) return;

        const status = searchParams.get('status');
        if (!status) return;
        callbackHandled.current = true;

        const provider = searchParams.get('provider');
        const message = searchParams.get('message');

        if (status === 'success') {
            toast.success(message || 'Connected successfully');
            void refreshUser();
        } else if (status === 'failed') {
            toast.error(message || `Failed to connect ${provider ?? 'provider'}`);
        }

        const url = new URL(window.location.href);
        url.searchParams.delete('provider');
        url.searchParams.delete('status');
        url.searchParams.delete('message');
        window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    }, [refreshUser, searchParams]);

    const connectedProviders = useMemo(() => {
        const connected = new Set<OAuthProvider>();
        const connectedAccounts = (Array.isArray(user?.connected_accounts)
            ? user?.connected_accounts
            : []) ?? [];

        connectedAccounts.forEach((account) => {
            if (account?.provider) {
                connected.add(account.provider);
            }
        });

        if (user?.github_token) {
            connected.add('github');
        }

        return connected;
    }, [user?.connected_accounts, user?.github_token]);

    const handleConnect = (provider: OAuthProvider) => {
        const redirectUrl = buildOAuthRedirectUrl(provider);
        if (!redirectUrl) {
            toast.error('NEXT_PUBLIC_BACKEND_URL is not configured');
            return;
        }
        window.location.href = redirectUrl;
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
                        <h1 className="text-3xl font-bold text-[#0B1C2D] dark:text-[#E6EDF3]">
                            Integrations
                        </h1>
                        <p className="mt-2 text-slate-600 dark:text-[#A3ADC2]">
                            Connect external providers to unlock delivery workflows.
                        </p>
                    </div>
                </section>

                <section className="bg-[#F5F7FA] px-6 py-12 dark:bg-[#0B1220]">
                    <div className="mx-auto max-w-6xl space-y-6">
                        {!BACKEND_URL ? (
                            <Alert variant="destructive">
                                <AlertDescription>
                                    NEXT_PUBLIC_BACKEND_URL (or NEXT_PUBLIC_API_URL fallback) is missing. OAuth redirect links cannot be generated.
                                </AlertDescription>
                            </Alert>
                        ) : null}

                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {OAUTH_PROVIDERS.map((provider) => (
                                <ProviderConnectCard
                                    key={provider.key}
                                    providerName={provider.title}
                                    icon={provider.icon}
                                    description={provider.description}
                                    isConnected={connectedProviders.has(provider.key)}
                                    onConnect={() => handleConnect(provider.key)}
                                />
                            ))}
                        </div>

                        <Alert>
                            <Link2 className="h-4 w-4" />
                            <AlertDescription>
                                After OAuth callback, this page will display a success or error notification.
                            </AlertDescription>
                        </Alert>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
