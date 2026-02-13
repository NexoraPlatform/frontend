"use client";

import { useMemo } from 'react';
import {
    AlertCircle,
    BarChart3,
    FolderOpen,
    Figma,
    Github,
    Loader2,
    UploadCloud,
    Wrench,
} from 'lucide-react';
import DeliverableSubmissionForm from '@/components/projects/DeliverableSubmissionForm';
import ProviderConnectCard from '@/components/ProviderConnectCard';
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

const DELIVERY_PROVIDER_LABELS: Record<string, string> = {
    github: 'GitHub',
    figma: 'Figma',
    google_drive: 'Google Drive',
    google_analytics: 'Google Analytics',
    manual_upload: 'Manual Upload',
    manual: 'Manual Upload',
};

const getProviderLabel = (provider: string) =>
    DELIVERY_PROVIDER_LABELS[provider] ?? provider ?? 'Delivery';

const getProviderIcon = (provider: string) => {
    switch (provider) {
        case 'github':
            return <Github className="h-4 w-4" />;
        case 'figma':
            return <Figma className="h-4 w-4" />;
        case 'google_drive':
            return <FolderOpen className="h-4 w-4" />;
        case 'google_analytics':
            return <BarChart3 className="h-4 w-4" />;
        case 'manual_upload':
        case 'manual':
            return <UploadCloud className="h-4 w-4" />;
        default:
            return <Wrench className="h-4 w-4" />;
    }
};

const mapDeliveryProviderToOAuth = (provider: string): OAuthProvider | null => {
    if (provider === 'figma') return 'figma';
    if (provider === 'github') return 'github';
    if (provider === 'google_drive' || provider === 'google_analytics') return 'google';
    return null;
};

const normalizeLineStatus = (status: unknown): ProjectLineStatus => {
    const normalized = String(status ?? 'pending').toLowerCase();
    if (normalized === 'pending' || normalized === 'active' || normalized === 'completed' || normalized === 'review') {
        return normalized;
    }
    return 'pending';
};

const getLineStatusLabel = (status: ProjectLineStatus) => {
    if (status === 'active') return 'Active';
    if (status === 'completed') return 'Completed';
    if (status === 'review') return 'In Review';
    return 'Pending';
};

const getLineStatusBadgeClass = (status: ProjectLineStatus) => {
    if (status === 'active') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (status === 'completed') return 'bg-green-50 text-green-700 border-green-200';
    if (status === 'review') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
};

const resolveLegacyDeliveryProvider = (project: Project): DeliveryProvider => {
    const fromService =
        typeof project?.service === 'object' && project?.service !== null
            ? String(project.service.delivery_provider ?? '')
            : '';
    const fromProject = String(project?.delivery_provider ?? '');
    const fallback = String(project?.delivery_type ?? '');
    return (fromService || fromProject || fallback || '').toLowerCase();
};

const normalizeProjectLines = (project: Project): ProjectLine[] => {
    const rawLines = Array.isArray(project?.project_lines) ? project.project_lines : [];

    if (rawLines.length > 0) {
        return rawLines
            .map((line, index) => {
                const lineId = line?.id ?? `line-${index + 1}`;
                const lineTitle =
                    String(
                        line?.title ??
                            line?.service_name ??
                            line?.name ??
                            `Project line ${index + 1}`
                    ).trim() || `Project line ${index + 1}`;
                const lineProvider = String(
                    line?.delivery_provider ?? line?.delivery_type ?? 'manual_upload'
                ).toLowerCase();

                return {
                    ...line,
                    id: lineId,
                    title: lineTitle,
                    status: normalizeLineStatus(line?.status),
                    delivery_provider: lineProvider,
                    budget_allocation: Number(line?.budget_allocation ?? 0),
                } as ProjectLine;
            })
            .filter((line) => Boolean(String(line.delivery_provider || '').trim()));
    }

    const legacyProvider = resolveLegacyDeliveryProvider(project);
    if (!legacyProvider) return [];

    return [
        {
            id: `legacy-${project.id}`,
            title: String(project?.service?.name ?? 'General Delivery'),
            description: typeof project?.description === 'string' ? project.description : undefined,
            status: 'active',
            delivery_provider: legacyProvider,
            budget_allocation: Number(project?.budget ?? 0),
        },
    ];
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
                  .map((role: any) => String(role?.slug ?? role?.name ?? role ?? '').toLowerCase())
                  .filter(Boolean)
            : [];
        const fromRole = user?.role ? [String(user.role).toLowerCase()] : [];
        return Array.from(new Set([...fromRoleSlugs, ...fromRoles, ...fromRole]));
    }, [user?.role, user?.role_slugs, user?.roles]);
    const isProviderRole = roleSlugs.includes('provider');

    const projectLines = useMemo(() => normalizeProjectLines(project), [project]);
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
                    Submit each deliverable on its dedicated project line.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue={String(projectLines[0].id)} className="w-full">
                    <TabsList className="h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
                        {projectLines.map((line) => {
                            const provider = String(line.delivery_provider ?? '').toLowerCase();
                            return (
                                <TabsTrigger
                                    value={String(line.id)}
                                    key={line.id}
                                    className="border border-slate-200 data-[state=active]:border-slate-300"
                                >
                                    <span className="mr-2">{getProviderIcon(provider)}</span>
                                    {line.title}
                                </TabsTrigger>
                            );
                        })}
                    </TabsList>

                    {projectLines.map((line) => {
                        const provider = String(line.delivery_provider ?? '').toLowerCase();
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
                                                Delivery for {line.title}
                                            </h3>
                                            {line.description ? (
                                                <p className="text-sm text-slate-600 dark:text-[#A3ADC2]">
                                                    {line.description}
                                                </p>
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
                                        </div>
                                    </div>

                                    {requiredOAuthProvider && !hasRequiredConnection ? (
                                        <ProviderConnectCard
                                            providerName={getProviderLabel(provider)}
                                            icon={getProviderIcon(provider)}
                                            isConnected={false}
                                            description={`Connect ${getProviderLabel(provider)} to submit this project line.`}
                                            onConnect={() => {
                                                if (connectHref) {
                                                    window.location.href = connectHref;
                                                    return;
                                                }
                                                router.push('/dashboard/integrations');
                                            }}
                                        />
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
