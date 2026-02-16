"use client";

import { useMemo } from 'react';
import {
  AlertCircle,
  BarChart3,
  Figma,
  FolderOpen,
  Github,
  Loader2,
  UploadCloud,
  Wrench,
} from 'lucide-react';
import DeliverableSubmissionForm from '@/components/projects/DeliverableSubmissionForm';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/auth-context';
import { buildOAuthRedirectUrl } from '@/lib/backend-url';
import { Link, useRouter } from '@/lib/navigation';
import type { OAuthProvider } from '@/types/auth';
import type { DeliveryProvider, Project, ProjectLine, ProjectLineStatus } from '@/types';

interface ProviderServiceProps {
  project: Project;
}

const DELIVERY_PROVIDER_LABELS: Record<DeliveryProvider, string> = {
  github: 'GitHub',
  figma: 'Figma',
  google_drive: 'Google Drive',
  google_analytics: 'Google Analytics',
  manual_upload: 'Manual Upload',
};

const getProviderLabel = (provider: DeliveryProvider) =>
  DELIVERY_PROVIDER_LABELS[provider] ?? provider;

const getProviderIcon = (provider: DeliveryProvider) => {
  if (provider === 'github') return <Github className="h-4 w-4" />;
  if (provider === 'figma') return <Figma className="h-4 w-4" />;
  if (provider === 'google_drive') return <FolderOpen className="h-4 w-4" />;
  if (provider === 'google_analytics') return <BarChart3 className="h-4 w-4" />;
  if (provider === 'manual_upload') return <UploadCloud className="h-4 w-4" />;
  return <Wrench className="h-4 w-4" />;
};

const mapDeliveryProviderToOAuth = (provider: DeliveryProvider): OAuthProvider | null => {
  if (provider === 'figma') return 'figma';
  if (provider === 'github') return 'github';
  if (provider === 'google_drive' || provider === 'google_analytics') return 'google';
  return null;
};

const normalizeLineStatus = (status: unknown): ProjectLineStatus => {
  const normalized = String(status ?? 'pending').toLowerCase();

  if (normalized === 'pending') return 'pending';
  if (normalized === 'active') return 'active';
  if (normalized === 'review' || normalized === 'in_review') return 'review';
  if (normalized === 'completed') return 'completed';
  if (normalized === 'blocked') return 'blocked';
  if (normalized === 'cancelled') return 'cancelled';

  return 'pending';
};

const getLineStatusLabel = (status: ProjectLineStatus) => {
  if (status === 'active') return 'Active';
  if (status === 'completed') return 'Completed';
  if (status === 'review' || status === 'in_review') return 'In Review';
  if (status === 'blocked') return 'Blocked';
  if (status === 'cancelled') return 'Cancelled';
  return 'Pending';
};

const getLineStatusBadgeClass = (status: ProjectLineStatus) => {
  if (status === 'active') return 'bg-blue-50 text-blue-700 border-blue-200';
  if (status === 'completed') return 'bg-green-50 text-green-700 border-green-200';
  if (status === 'review' || status === 'in_review') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (status === 'blocked') return 'bg-red-50 text-red-700 border-red-200';
  if (status === 'cancelled') return 'bg-slate-200 text-slate-700 border-slate-300';
  return 'bg-slate-100 text-slate-700 border-slate-200';
};

const normalizeDeliveryProvider = (value: unknown): DeliveryProvider => {
  const normalized = String(value ?? '').toLowerCase();

  if (normalized === 'github') return 'github';
  if (normalized === 'figma') return 'figma';
  if (normalized === 'google_drive') return 'google_drive';
  if (normalized === 'google_analytics') return 'google_analytics';

  return 'manual_upload';
};

const normalizeProjectLines = (project: Project): ProjectLine[] => {
  const rawLines = Array.isArray(project?.project_lines) ? project.project_lines : [];

  return rawLines
    .map((line, index) => {
      const serviceName =
        String(line?.service_name ?? line?.title ?? line?.name ?? `Project line ${index + 1}`).trim() ||
        `Project line ${index + 1}`;
      const rawBudgetAllocation = Number(line?.budget_allocation ?? 0);
      const linePrice = Number(line?.price ?? 0);
      const budgetPercentage = Number(
        line?.budget_percentage ??
          (rawBudgetAllocation > 0 && rawBudgetAllocation <= 100 ? rawBudgetAllocation : 0)
      );
      const budgetAmount =
        linePrice > 0
          ? linePrice
          : rawBudgetAllocation > 100
            ? rawBudgetAllocation
            : 0;

      return {
        ...line,
        id: line?.id ?? `line-${index + 1}`,
        service_name: serviceName,
        title: serviceName,
        delivery_provider: normalizeDeliveryProvider(line?.delivery_provider ?? line?.delivery_type),
        status: normalizeLineStatus(line?.status),
        price: linePrice > 0 ? linePrice : undefined,
        budget_allocation: budgetAmount,
        budget_percentage: budgetPercentage > 0 ? budgetPercentage : undefined,
        milestones: Array.isArray(line?.milestones) ? line.milestones : [],
        deliverables: Array.isArray(line?.deliverables) ? line.deliverables : [],
      } as ProjectLine;
    })
    .filter((line) => Boolean(line.service_name));
};

export default function ProviderService({ project }: ProviderServiceProps) {
  const { user, loading, userLoading } = useAuth();
  const router = useRouter();

  const roleSlugs = useMemo(() => {
    const fromRoleSlugs = Array.isArray(user?.role_slugs)
      ? (user?.role_slugs ?? []).map((role) => String(role).toLowerCase())
      : [];

    const fromRoles = Array.isArray(user?.roles)
      ? (user?.roles ?? [])
          .map((role: unknown) => {
            if (typeof role === 'string') {
              return role.toLowerCase();
            }
            if (role && typeof role === 'object') {
              const roleObject = role as { slug?: unknown; name?: unknown };
              return String(roleObject.slug ?? roleObject.name ?? '').toLowerCase();
            }
            return '';
          })
          .filter(Boolean)
      : [];

    const fromRole = user?.role ? [String(user.role).toLowerCase()] : [];

    return Array.from(new Set([...fromRoleSlugs, ...fromRoles, ...fromRole]));
  }, [user?.role, user?.role_slugs, user?.roles]);

  const isProviderRole = roleSlugs.includes('provider');

  const projectLines = useMemo(() => normalizeProjectLines(project), [project]);

  const connectedProviders = useMemo(() => {
    const connected = new Set<OAuthProvider>();

    const userConnectedAccounts = user?.connected_accounts;
    const connectedAccounts = (Array.isArray(userConnectedAccounts)
      ? userConnectedAccounts
      : []) as Array<{ provider?: OAuthProvider }>;

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

  if (loading || userLoading) {
    return (
      <Card className="glass-card shadow-sm">
        <CardContent className="flex items-center gap-3 p-6">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Loading delivery module...</span>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between gap-3">
          <span>You need to be signed in to submit a deliverable.</span>
          <Button asChild size="sm">
            <Link href="/auth/signin">Sign in</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!isProviderRole || projectLines.length === 0) {
    return null;
  }

  return (
    <Card className="glass-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Deliverables by project line</CardTitle>
        <CardDescription>
          Submit each deliverable in its dedicated project line tab.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={String(projectLines[0].id)} className="w-full">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
            {projectLines.map((line) => {
              const provider = normalizeDeliveryProvider(line.delivery_provider);

              return (
                <TabsTrigger
                  value={String(line.id)}
                  key={line.id}
                  className="border border-slate-200 data-[state=active]:border-slate-300"
                >
                  <span className="mr-2">{getProviderIcon(provider)}</span>
                  {line.service_name}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {projectLines.map((line) => {
            const provider = normalizeDeliveryProvider(line.delivery_provider);
            const requiredOAuthProvider = mapDeliveryProviderToOAuth(provider);
            const hasRequiredConnection =
              !requiredOAuthProvider || connectedProviders.has(requiredOAuthProvider);
            const connectHref = requiredOAuthProvider
              ? buildOAuthRedirectUrl(requiredOAuthProvider)
              : '';
            const status = normalizeLineStatus(line.status);

            return (
              <TabsContent value={String(line.id)} key={line.id} className="mt-4">
                <div className="rounded-lg border border-slate-200 bg-white/70 p-4 dark:border-[#1E2A3D] dark:bg-[#0F172A]/70">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                        {line.service_name}
                      </h3>
                      {line.description ? (
                        <p className="text-sm text-slate-600 dark:text-[#A3ADC2]">{line.description}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={getLineStatusBadgeClass(status)}>
                        {getLineStatusLabel(status)}
                      </Badge>
                      <Badge variant="outline">{getProviderLabel(provider)}</Badge>
                      {Number(line.budget_allocation) > 0 ? (
                        <Badge variant="outline">
                          ${Number(line.budget_allocation).toLocaleString()}
                        </Badge>
                      ) : null}
                      {Number(line.budget_percentage) > 0 ? (
                        <Badge variant="outline">
                          {Number(line.budget_percentage).toLocaleString()}%
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  {requiredOAuthProvider && !hasRequiredConnection ? (
                    <Card className="border-dashed border-slate-300 dark:border-[#1E2A3D]">
                      <CardHeader>
                        <CardTitle className="text-base">Connect {getProviderLabel(provider)}</CardTitle>
                        <CardDescription>
                          This project line requires a connected {getProviderLabel(provider)} account.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          onClick={() => {
                            if (connectHref) {
                              window.location.href = connectHref;
                              return;
                            }
                            router.push('/dashboard/integrations');
                          }}
                        >
                          Connect {getProviderLabel(provider)}
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <DeliverableSubmissionForm project={project} line={line} />
                  )}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}
