"use client";

import { type ReactNode, useMemo, useState } from 'react';
import { Chrome, Figma, Github, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { ConnectedAccount, IntegrationProvider } from '@/types/integration';

type IntegrationCardProps = {
  provider: IntegrationProvider;
  isConnected: boolean;
  accountDetails: ConnectedAccount | null;
  connectHref: string;
  onDisconnect: () => void;
};

const providerLabel: Record<IntegrationProvider, string> = {
  github: 'GitHub',
  google: 'Google',
  figma: 'Figma',
};

const providerDescription: Record<IntegrationProvider, string> = {
  github: 'Connect your repository workflows and delivery links.',
  google: 'Connect Google to use Drive/Workspace based deliverables.',
  figma: 'Connect Figma to submit and manage design deliverables.',
};

const providerIcon: Record<IntegrationProvider, ReactNode> = {
  github: <Github className="h-5 w-5" />,
  google: <Chrome className="h-5 w-5" />,
  figma: <Figma className="h-5 w-5" />,
};

const formatDate = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString();
};

export default function IntegrationCard({
  provider,
  isConnected,
  accountDetails,
  connectHref,
  onDisconnect,
}: IntegrationCardProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const accountCreatedAt = useMemo(
    () => formatDate(accountDetails?.created_at),
    [accountDetails?.created_at]
  );
  const accountExpiresAt = useMemo(
    () => formatDate(accountDetails?.expires_at),
    [accountDetails?.expires_at]
  );
  const isExpired = useMemo(() => {
    if (!accountDetails?.expires_at) return false;
    const parsed = new Date(accountDetails.expires_at);
    return !Number.isNaN(parsed.getTime()) && parsed.getTime() < Date.now();
  }, [accountDetails?.expires_at]);

  const handleConnect = async () => {
    setIsConnecting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 120));
  };

  return (
    <Card className="glass-card border-slate-200 dark:border-[#1E2A3D]">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-[#1E2A3D]">
              {providerIcon[provider]}
            </span>
            <CardTitle className="text-lg">{providerLabel[provider]}</CardTitle>
          </div>
          <Badge
            variant="outline"
            className={
              isConnected
                ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/40 dark:text-green-200'
                : 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
            }
          >
            {isConnected ? 'Connected' : 'Not Connected'}
          </Badge>
        </div>
        <CardDescription>{providerDescription[provider]}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {isConnected ? (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm dark:border-[#1E2A3D] dark:bg-[#0F172A]">
            <div className="text-slate-700 dark:text-slate-200">
              Provider ID: <span className="font-medium">{accountDetails?.provider_id ?? '-'}</span>
            </div>
            <div className="text-slate-600 dark:text-slate-300">
              Connected: <span className="font-medium">{accountCreatedAt ?? '-'}</span>
            </div>
            {accountDetails?.expires_at ? (
              <div className={isExpired ? 'text-red-600 dark:text-red-300' : 'text-slate-600 dark:text-slate-300'}>
                Expires: <span className="font-medium">{accountExpiresAt ?? accountDetails.expires_at}</span>
                {isExpired ? ' (expired)' : ''}
              </div>
            ) : null}
          </div>
        ) : null}

        {isConnected ? (
          <Button variant="outline" onClick={onDisconnect}>
            Manage
          </Button>
        ) : !connectHref ? (
          <Button disabled>
            Connect {providerLabel[provider]}
          </Button>
        ) : (
          <Button asChild onClick={handleConnect} disabled={isConnecting}>
            <a href={connectHref}>
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirecting...
                </>
              ) : (
                `Connect ${providerLabel[provider]}`
              )}
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
