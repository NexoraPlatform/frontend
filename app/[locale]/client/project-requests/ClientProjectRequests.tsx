"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/lib/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { TrustoraThemeStyles } from '@/components/trustora/theme-styles';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    AlertCircle,
    Calendar,
    CheckCircle,
    Clock,
    Code,
    DollarSign,
    Eye,
    Globe,
    Loader2,
    MapPin,
    MessageSquare,
    Shield,
    Star,
    Target,
    User,
    XCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api';
import { getEcho } from '@/lib/echo';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { enUS, ro } from 'date-fns/locale';
import { loadStripe } from "@stripe/stripe-js";
import { MuiIcon } from "@/components/MuiIcons";
import { PriceDisplay } from '@/components/PriceDisplay';
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import RapydCheckoutButton from "@/components/RapydCheckoutButton";

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY) {
    throw new Error('Stripe public key is not defined in environment variables');
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);

type ClientProjectRequestsProps = {
    withLayout?: boolean;
};

interface ContractClauses {
    category: string;
    identifier: string;
    priority: number;
    selection: string;
    text: string;
    title: string;
}

interface ContractMeta {
    client_country: string;
    client_country_code: string;
    client_legal_system: string;
    freelancer_country: string;
    freelancer_country_code: string;
    freelancer_legal_system: string;
}

interface ContractResponse {
    clauses: ContractClauses[];
    meta: ContractMeta[];
}

export default function ClientProjectRequests({ withLayout = true }: ClientProjectRequestsProps) {
    const { user, loading, userLoading } = useAuth();
    const locale = useLocale();
    const t = useTranslations();
    const dateLocale = locale?.toLowerCase().startsWith('en') ? enUS : ro;
    const [projects, setProjects] = useState<any[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [responding, setResponding] = useState<string | null>(null);
    const router = useRouter();
    const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [selectedProject, setSelectedProject] = useState<any | null>(null);
    const [selectedMilestone, setSelectedMilestone] = useState<any | null>(null);
    const [selectedProviderId, setSelectedProviderId] = useState<number | string | null>(null);
    const cardElementRef = useRef<any>(null);
    const stripeRef = useRef<any>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [success, setSuccess] = useState(false);
    const [releasingId, setReleasingId] = useState<string | null>(null);
    const [contractResponse, setContractResponse] = useState<ContractResponse | null>(null);
    const [openContractDialog, setOpenContractDialog] = useState(false);
    const roleSlugs = [
        ...(user?.role_slugs ?? []),
        ...((user?.roles ?? []).map((role: any) => role?.slug).filter(Boolean)),
    ]
        .map((slug) => String(slug).toLowerCase())
        .filter(Boolean);
    const isClientRole = roleSlugs.includes('client') || user?.role?.toLowerCase() === 'client';
    const hasRoleInfo = roleSlugs.length > 0 || Boolean(user?.role);
    const getMilestoneId = useCallback((milestone: any) => {
        return milestone?.id ?? milestone?.milestone_id ?? milestone?.milestoneId ?? null;
    }, []);

    const projectBudgetAmount = selectedProject?.budget?.amount != null
        ? Number(selectedProject.budget.amount)
        : null;
    const selectedMilestoneAmount = selectedMilestone?.amount != null
        ? Number(selectedMilestone.amount)
        : null;
    const selectedMilestoneId = getMilestoneId(selectedMilestone);
    const isMilestonePayment = selectedMilestone != null;
    const platformFeeBase = projectBudgetAmount != null
        ? Math.min(projectBudgetAmount * 0.10, 150)
        : null;
    const isFirstMilestone = (() => {
        if (!isMilestonePayment || !selectedProject || !selectedMilestoneId || !selectedProviderId) return false;
        const providerMilestones = selectedProject.milestones
            ?.find((milestoneGroup: any) => String(milestoneGroup.providerId) === String(selectedProviderId))
            ?.milestones ?? [];
        const index = providerMilestones.findIndex(
            (milestone: any) => String(getMilestoneId(milestone)) === String(selectedMilestoneId)
        );
        return index === 0;
    })();
    const displayedValueAmount = isMilestonePayment ? selectedMilestoneAmount : projectBudgetAmount;
    const displayedFeeAmount = isMilestonePayment
        ? (isFirstMilestone ? platformFeeBase : 0)
        : platformFeeBase;
    const displayedTotalAmount = displayedValueAmount != null && displayedFeeAmount != null
        ? displayedValueAmount + displayedFeeAmount
        : null;

    const loadProjects = useCallback(async () => {
        try {
            const response = await apiClient.getClientProjectRequests();

            setProjects(response.projects || []);
        } catch (error) {
            console.error('Failed to load projects:', error);
        } finally {
            setLoadingProjects(false);
        }
    }, []);

    useEffect(() => {
        if (!user?.id) return;
        const echo = getEcho();
        if (!echo) return;
        const channel = echo.private(`App.Models.User.${user.id}`);
        const handler = (notification: {
            type?: string;
            data?: { type?: string; projectId?: string | number; payload?: { projectId?: string | number } };
            projectId?: string | number;
            payload?: { projectId?: string | number };
        }) => {
            const declaredType = String(
                notification?.data?.type ??
                notification?.type ??
                ''
            );
            const projectId =
                notification?.data?.projectId ??
                notification?.projectId ??
                notification?.data?.payload?.projectId ??
                notification?.payload?.projectId;
            const isProjectEvent =
                declaredType.startsWith('project.') ||
                declaredType.startsWith('budget.');
            const isRapydProjectEvent =
                declaredType.startsWith('rapyd.') && Boolean(projectId);

            if (!isProjectEvent && !isRapydProjectEvent) return;
            loadProjects();
        };
        channel.notification(handler);

        return () => {
            channel.stopListening('.Illuminate\\Notifications\\Events\\BroadcastNotificationCreated');
        };
    }, [user?.id, loadProjects]);

    const handleCheckoutComplete = useCallback(async () => {
        setSuccess(true);
        await loadProjects();
    }, [loadProjects]);

    useEffect(() => {
        if (userLoading) return;

        if (!user) {
            // router.push('/auth/signin');
            return;
        }

        if (hasRoleInfo && !isClientRole) {
            if (withLayout) {
                router.push('/dashboard');
            }
            return;
        }

        loadProjects();
    }, [user, userLoading, router, loadProjects, hasRoleInfo, isClientRole, withLayout]);

    const getClientSecret = async (project_id: string, providerId: number | string | null, milestoneId: number | string | null) => {
        // router.push(response.url);
        try {
            const response = await apiClient.getPaymentSession(project_id, milestoneId, providerId);
            setClientSecret(response.clientSecret);
            setCheckoutDialogOpen(true);
        } catch (err) {
            console.error('Checkout error:', err);
        }
    };

    const openCheckout = async (project: any, providerId: number | string | null, milestone: any | null) => {
        setSelectedProject(project);
        setSelectedMilestone(milestone);
        setSelectedProviderId(providerId);
        setSuccess(false);
        setErrorMessage('');
        setClientSecret(null);
        await getClientSecret(project.id, providerId, getMilestoneId(milestone));
    };

    const handleBudgetResponse = useCallback(async (
        projectId: string,
        providerId: string,
        response: 'ACCEPTED' | 'REJECTED'
    ) => {
        setResponding(`${projectId}-${providerId}`);
        try {
            await apiClient.respondToBudgetProposal(projectId, providerId, { response }, locale);
            await loadProjects();
            toast.success(
                response === 'ACCEPTED'
                    ? t('client.project_requests.budget.approved')
                    : t('client.project_requests.budget.rejected')
            );
        } catch (error: any) {
            toast.error(t('client.project_requests.errors.generic', { message: error.message }));
        } finally {
            setResponding(null);
        }
    }, [loadProjects, locale, t]);

    const generateContract = async (projectId: string, clientId: string, providerId: string) => {
        const response = await apiClient.generateProjectContract(projectId, clientId, providerId);
        setContractResponse(response);
        setOpenContractDialog(true);
        console.log(response);
    };

    const handleReleaseFunds = useCallback(async (projectId: string, milestoneId?: string) => {
        const releaseKey = milestoneId ? `milestone-${milestoneId}` : `project-${projectId}`;
        setReleasingId(releaseKey);
        try {
            const response = await apiClient.rapydReleasePayment(projectId, milestoneId, locale);
            toast.success(response?.message ?? t('client.project_requests.release.success'));
            await loadProjects();
        } catch (error: any) {
            const serverMessage = error.response?.data?.error || error.message || "A apărut o eroare necunoscută.";

            toast.error(t('client.project_requests.release.error', { message: serverMessage }));
        } finally {
            setReleasingId(null);
        }
    }, [loadProjects, locale, t]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return (
                    <Badge className="bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/30">
                        <Clock className="w-3 h-3 mr-1" />
                        {t('client.project_requests.status.pending')}
                    </Badge>
                );
            case 'ACCEPTED':
                return (
                    <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:border-emerald-500/30">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {t('client.project_requests.status.accepted')}
                    </Badge>
                );
            case 'REJECTED':
                return (
                    <Badge className="bg-red-100 text-red-800 border border-red-200 dark:bg-red-500/10 dark:text-red-200 dark:border-red-500/30">
                        <XCircle className="w-3 h-3 mr-1" />
                        {t('client.project_requests.status.rejected')}
                    </Badge>
                );
            case 'NEW_PROPOSE':
                return (
                    <Badge className="bg-sky-100 text-sky-800 border border-sky-200 dark:bg-sky-500/10 dark:text-sky-200 dark:border-sky-500/30">
                        <DollarSign className="w-3 h-3 mr-1" />
                        {t('client.project_requests.status.budget_proposed')}
                    </Badge>
                );
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const getMilestoneStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return (
                    <Badge className="bg-yellow-100 text-yellow-800">
                        <Clock className="w-3 h-3 mr-1" />
                        {t('client.project_requests.milestones.pending')}
                    </Badge>
                );
            case 'FINISHED':
                return (
                    <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {t('client.project_requests.milestones.finished')}
                    </Badge>
                );
            case 'PAID':
                return (
                    <Badge className="bg-green-400 text-green-900">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {t('client.project_requests.milestones.paid')}
                    </Badge>
                );
            case 'REJECTED':
                return (
                    <Badge className="bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        {t('client.project_requests.milestones.rejected')}
                    </Badge>
                );
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const getMilestonePaymentStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return (
                    <Badge className="bg-yellow-100 text-yellow-800">
                        <Clock className="w-3 h-3 mr-1" />
                        {t('client.project_requests.milestones.payment_status.pending')}
                    </Badge>
                );
            case 'ESCROW':
                return (
                    <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {t('client.project_requests.milestones.payment_status.escrow')}
                    </Badge>
                );
            case 'PAID':
                return (
                    <Badge className="bg-green-400 text-green-900">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {t('client.project_requests.milestones.payment_status.paid')}
                    </Badge>
                );
            case 'REJECTED':
                return (
                    <Badge className="bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3 mr-1" />
                        {t('client.project_requests.milestones.payment_status.rejected')}
                    </Badge>
                );
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const loadingClassName = withLayout
        ? "min-h-screen bg-white dark:bg-[#070C14] flex flex-col items-center justify-center"
        : "py-16 flex flex-col items-center justify-center";

    if (loading || userLoading || loadingProjects) {
        return (
            <div className={loadingClassName}>
                <Loader2 className="w-8 h-8 animate-spin text-[#1BC47D]" />
            </div>
        );
    }

    if (!user || (hasRoleInfo && !isClientRole)) {
        return null;
    }

    const containerClassName = withLayout
        ? "min-h-screen bg-white dark:bg-[#070C14]"
        : "bg-transparent";

    return (
        <div className={containerClassName}>
            {withLayout ? <Header /> : null}
            {withLayout ? <TrustoraThemeStyles /> : null}

            <section className="hero-gradient">
                <div className="container mx-auto px-4 py-12 lg:py-16">
                    <div className="max-w-3xl">
                        <Badge className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[#0B1C2D] text-xs font-bold dark:bg-[#111B2D] dark:border-[#1E2A3D] dark:text-[#E6EDF3]">
                            <span className="text-[#1BC47D]">●</span> {t('client.project_requests.hero.badge')}
                        </Badge>
                        <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-[#0B1C2D] dark:text-[#E6EDF3]">
                            {t('client.project_requests.hero.title')}
                        </h1>
                        <p className="text-lg text-slate-500 dark:text-[#A3ADC2]">
                            {t('client.project_requests.hero.description')}
                        </p>
                    </div>
                </div>
            </section>

            <section className="bg-[#F5F7FA] dark:bg-[#0B1220]">
                <div className="container mx-auto px-4 pb-16 pt-10">
                    {projects.length === 0 ? (
                        <Card className="glass-card border-transparent shadow-sm">
                            <CardContent className="text-center py-12">
                                <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-[rgba(27,196,125,0.12)] flex items-center justify-center mx-auto mb-4">
                                    <Target className="w-8 h-8 text-[#1BC47D]" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2 text-[#0B1C2D] dark:text-[#E6EDF3]">
                                    {t('client.project_requests.empty.title')}
                                </h3>
                                <p className="text-slate-500 dark:text-[#A3ADC2] mb-6">
                                    {t('client.project_requests.empty.description')}
                                </p>
                                <Button onClick={() => router.push('/projects/new')} className="btn-primary">
                                    <Target className="w-4 h-4 mr-2" />
                                    {t('client.project_requests.empty.cta')}
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-6">
                            {projects.map((project) => {
                                const hasAnyMilestones = (project.milestones ?? []).some(
                                    (milestoneGroup: any) => (milestoneGroup.milestones ?? []).length > 0
                                );
                                const canReleaseFull = !hasAnyMilestones && project.status === 'FINISHED';

                                return (
                                <Card key={project.id} className="glass-card border-transparent shadow-sm">
                                    <CardHeader className="space-y-4">
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                            <div>
                                                <CardTitle className="text-2xl text-[#0B1C2D] dark:text-[#E6EDF3]">
                                                    {project.title}
                                                </CardTitle>
                                                <CardDescription className="mt-2 text-slate-500 dark:text-[#A3ADC2] line-clamp-2">
                                                    {project.description}
                                                </CardDescription>
                                                <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-slate-500 dark:text-[#A3ADC2]">
                                                    <div className="flex items-center gap-1">
                                                        <DollarSign className="w-4 h-4 text-[#1BC47D]" />
                                                        <span>
                                                            {t('client.project_requests.project.total_budget')}{' '}
                                                            {project.budget.amount != null ? (
                                                                <PriceDisplay value={project.budget.amount} />
                                                            ) : (
                                                                '-'
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4 text-[#1BC47D]" />
                                                        <span>
                                                            {t('client.project_requests.project.created')} {formatDistanceToNow(new Date(project.created_at), {
                                                                addSuffix: true,
                                                                locale: dateLocale
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <User className="w-4 h-4 text-[#1BC47D]" />
                                                        <span>{t('client.project_requests.project.selected_providers', { count: project.providers?.length || 0 })}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {Array.from(
                                                    new Map(
                                                        project.existing_services.map((s: any) => [s.category.id, s.category])
                                                    ).values()
                                                ).map((category: any) => (
                                                    <Badge
                                                        key={category.id}
                                                        className="bg-emerald-50 text-[#0B1C2D] border border-emerald-100 dark:bg-[rgba(27,196,125,0.12)] dark:text-[#E6EDF3] dark:border-[#1E2A3D]"
                                                    >
                                                        {category.name}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-6">
                                        {(project?.existing_services?.length > 0
                                            || project?.custom_services?.length > 0) && (
                                                <div className="rounded-xl border border-slate-100 bg-white/80 px-4 py-3 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                                                    <div className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3] mb-2">
                                                        {t('client.project_requests.project.technologies')}
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {project.existing_services.map((tech: any, index: number) => (
                                                            <Badge
                                                                key={index}
                                                                variant="outline"
                                                                className="text-xs border-slate-200 text-slate-600 dark:border-[#1E2A3D] dark:text-[#A3ADC2]"
                                                            >
                                                                <Code className="w-3 h-3 mr-1 text-[#1BC47D]" />
                                                                {tech.name}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                        <div>
                                            <div className="text-sm font-semibold text-[#0B1C2D] dark:text-[#E6EDF3] mb-3">
                                                {t('client.project_requests.providers.title')}
                                            </div>
                                            <div className="space-y-3">
                                                {project.providers?.map((provider: any) => {
                                                    const providerMilestones =
                                                        project.milestones
                                                            ?.find((m: any) => m.providerId === provider.id)
                                                            ?.milestones || [];
                                                    return (
                                                        <div
                                                            key={provider.id}
                                                            className="border border-slate-100 rounded-xl p-4 bg-white/70 dark:border-[#1E2A3D] dark:bg-[#0B1220]"
                                                        >
                                                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                                <div className="flex items-start gap-3">
                                                                    <Avatar className="w-11 h-11">
                                                                        <AvatarImage src={provider.avatar} />
                                                                        <AvatarFallback>
                                                                            {provider.firstName?.[0]}{provider.lastName?.[0]}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div>
                                                                        <div className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                                                                            {provider.firstName} {provider.lastName}
                                                                        </div>
                                                                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                                                                            <div className="flex items-center gap-1">
                                                                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                                                <span>{provider.rating || 0}</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-1">
                                                                                <MapPin className="w-3 h-3 text-[#1BC47D]" />
                                                                                <span>{provider.location || t('client.project_requests.providers.location_fallback')}</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 mt-2">
                                                                            {provider.services?.length > 0 && provider.services.map((service: any, index: number) => (
                                                                                <Badge
                                                                                    key={index}
                                                                                    variant="outline"
                                                                                    className="text-xs border-slate-200 "
                                                                                >
                                                                                    <MuiIcon icon={service.categoryIcon} size={20} className="mr-1" />
                                                                                    {service.name}
                                                                                </Badge>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-left lg:text-right">
                                                                    {getStatusBadge(provider.status)}
                                                                    <div className="text-sm text-slate-500 dark:text-[#A3ADC2] mt-2">
                                                                        {t('client.project_requests.providers.allocated')}{' '}
                                                                        {provider.allocatedBudget != null ? (
                                                                            <PriceDisplay value={provider.allocatedBudget} />
                                                                        ) : (
                                                                            '-'
                                                                        )}
                                                                    </div>
                                                                    {project.status === 'ACCEPTED' && (
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() => generateContract(project.id, project.client_id, provider.id)}
                                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                                                        >
                                                                            Contract
                                                                        </Button>
                                                                    )}
                                                                    <div>

                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {provider.status === 'NEW_PROPOSE' && (
                                                                <Alert className="mt-4 border-emerald-200 bg-emerald-50 dark:border-[#1E2A3D] dark:bg-[rgba(27,196,125,0.1)]">
                                                                    <DollarSign className="h-4 w-4 text-[#1BC47D]" />
                                                                    <AlertDescription>
                                                                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                                                            <div>
                                                                                <div className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                                                                                    {t('client.project_requests.budget.new_proposal')}
                                                                                </div>
                                                                                <div className="text-lg font-bold text-[#1BC47D]">
                                                                                    {provider.proposedBudget != null ? (
                                                                                        <PriceDisplay value={provider.proposedBudget} />
                                                                                    ) : (
                                                                                        '-'
                                                                                    )}
                                                                                </div>
                                                                                <div className="text-sm text-slate-500 dark:text-[#A3ADC2]">
                                                                                    {t('client.project_requests.budget.original')}{' '}
                                                                                    {provider.allocatedBudget != null ? (
                                                                                        <PriceDisplay value={provider.allocatedBudget} />
                                                                                    ) : (
                                                                                        '-'
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex flex-wrap gap-2">
                                                                                <Button
                                                                                    size="sm"
                                                                                    onClick={() => handleBudgetResponse(project.id, provider.id, 'ACCEPTED')}
                                                                                    disabled={responding === `${project.id}-${provider.id}` || provider.pivotClientResponse === 'ACCEPTED'}
                                                                                    className="btn-primary"
                                                                                >
                                                                                    <CheckCircle className="w-4 h-4 mr-1" />
                                                                                    {t('client.project_requests.budget.approve')}
                                                                                </Button>
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    onClick={() => handleBudgetResponse(project.id, provider.id, 'REJECTED')}
                                                                                    disabled={responding === `${project.id}-${provider.id}`}
                                                                                    className="border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-[#1E2A3D] dark:text-[#E6EDF3] dark:hover:bg-[#111B2D]"
                                                                                >
                                                                                    <XCircle className="w-4 h-4 mr-1" />
                                                                                    {t('client.project_requests.budget.reject')}
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    </AlertDescription>
                                                                </Alert>
                                                            )}

                                                            {provider.respondedAt && (
                                                                <div className="mt-3 text-xs text-slate-400 dark:text-[#A3ADC2]">
                                                                    {t('client.project_requests.providers.response_received')} {formatDistanceToNow(new Date(provider.respondedAt), {
                                                                        addSuffix: true,
                                                                        locale: dateLocale
                                                                    })}
                                                                </div>
                                                            )}

                                                            <div className="space-y-2 mt-2">
                                                                {providerMilestones.map((milestone: any, index: number) => {
                                                                    const milestoneId = getMilestoneId(milestone);

                                                                    // 1. Logica pentru Release (existentă)
                                                                    const canReleaseMilestone = milestone.status === 'FINISHED' && milestoneId;

                                                                    // 2. Logica pentru Secure Payment (NOUĂ)
                                                                    // Verificăm dacă milestone-ul anterior este plătit (sau dacă e primul din listă)
                                                                    const isPreviousPaid = index === 0 || providerMilestones[index - 1]?.status === 'PAID';

                                                                    // Afișăm butonul doar dacă e rândul acestui milestone și nu a fost plătit încă
                                                                    const showSecurePaymentBtn = milestone.payment_status === 'PENDING' && isPreviousPaid;

                                                                    return (
                                                                        <div
                                                                            key={milestoneId ?? index}
                                                                            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-md border p-4 text-sm transition-colors
    ${milestone.status === 'PENDING' ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-800" : ""}
    ${milestone.status === 'FINISHED' ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800" : ""}
    ${milestone.status === 'PAID' ? "bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800" : ""}
    ${milestone.status === 'REJECTED' ? "bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800" : ""}
`}
                                                                        >
                                                                            {/* Partea Stângă: Detalii Milestone */}
                                                                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4 dark:text-slate-200">
        <span className="font-semibold text-slate-700 dark:text-slate-300">
            {index + 1}. {milestone.title}
        </span>
                                                                                <span className="hidden sm:inline text-slate-300 dark:text-slate-600">|</span>
                                                                                <span className="font-medium text-slate-600 dark:text-slate-400">
            {t('client.project_requests.providers.milestone_budget')}{' '}
                                                                                    <PriceDisplay value={milestone.amount} />
        </span>
                                                                            </div>

                                                                            {/* Partea Dreaptă: Status + Butoane */}
                                                                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                                                                <div className="flex gap-2">
                                                                                    {getMilestoneStatusBadge(milestone.status)}
                                                                                    {getMilestonePaymentStatusBadge(milestone.payment_status)}
                                                                                </div>

                                                                                <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                                                                    {/* BUTON RELEASE FUNDS */}
                                                                                    {canReleaseMilestone && (
                                                                                        <Button
                                                                                            size="sm"
                                                                                            onClick={() => handleReleaseFunds(project.id, String(milestoneId))}
                                                                                            disabled={releasingId === `milestone-${milestoneId}`}
                                                                                            className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                                                                        >
                                                                                            {releasingId === `milestone-${milestoneId}` ? (
                                                                                                <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> ...</>
                                                                                            ) : (
                                                                                                <><CheckCircle className="w-3.5 h-3.5 mr-2" /> {t('client.project_requests.release.button')}</>
                                                                                            )}
                                                                                        </Button>
                                                                                    )}

                                                                                    {/* BUTON SECURE FUNDS (Rapyd) */}
                                                                                    {showSecurePaymentBtn && (
                                                                                        <div className="flex-1 sm:flex-none">
                                                                                            <RapydCheckoutButton
                                                                                                project={project}
                                                                                                milestone={milestone}
                                                                                                countryCode="RO"
                                                                                                onSuccess={() => window.location.reload()}
                                                                                            />
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between pt-4 border-t border-slate-100 dark:border-[#1E2A3D]">
                                            {/*{!project?.milestones && project.paymentStatus !== 'ESCROW' && (<Button*/}
                                            {/*    onClick={() => openCheckout(project, null, null)}*/}
                                            {/*    className="btn-primary w-full lg:w-auto px-6 py-6 text-base font-semibold"*/}
                                            {/*    size="lg"*/}
                                            {/*>*/}
                                            {/*    <Shield className="w-5 h-5 mr-2" />*/}
                                            {/*    {t('client.project_requests.actions.secure_payment')}*/}
                                            {/*</Button>)}*/}
                                            {project.paymentStatus === 'ESCROW' && canReleaseFull && (
                                                <Button
                                                    onClick={() => handleReleaseFunds(project.id)}
                                                    className="btn-primary w-full lg:w-auto px-6 py-6 text-base font-semibold"
                                                    size="lg"
                                                    disabled={releasingId === `project-${project.id}`}
                                                >
                                                    {releasingId === `project-${project.id}` ? (
                                                        <>
                                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                            {t('client.project_requests.release.processing')}
                                                        </>
                                                    ) : (
                                                        t('client.project_requests.release.button')
                                                    )}
                                                </Button>
                                            )}
                                            <div className="flex flex-col gap-2 sm:flex-row">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-[#1E2A3D] dark:text-[#E6EDF3] dark:hover:bg-[#111B2D]"
                                                >
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    {t('client.project_requests.actions.view_details')}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-[#1E2A3D] dark:text-[#E6EDF3] dark:hover:bg-[#111B2D]"
                                                >
                                                    <MessageSquare className="w-4 h-4 mr-2" />
                                                    {t('client.project_requests.actions.messages')}
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/*<Dialog open={checkoutDialogOpen} onOpenChange={setCheckoutDialogOpen}>*/}
            {/*    <DialogContent className="max-w-md mx-auto bg-white dark:bg-[#0B1220] rounded-2xl shadow-2xl border-0 p-0 overflow-hidden flex flex-col max-h-[90vh]">*/}
            {/*        <div className="bg-[#0B1C2D] p-6 text-white">*/}
            {/*            <div className="flex items-center space-x-3 mb-4">*/}
            {/*                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">*/}
            {/*                    <Shield className="w-6 h-6 text-[#1BC47D]" />*/}
            {/*                </div>*/}
            {/*                <div>*/}
            {/*                    <DialogTitle className="text-xl font-bold text-white">*/}
            {/*                        {t('client.project_requests.checkout.title')}*/}
            {/*                    </DialogTitle>*/}
            {/*                    <DialogDescription className="text-sm text-blue-100">*/}
            {/*                        {t('client.project_requests.checkout.description')}*/}
            {/*                    </DialogDescription>*/}
            {/*                </div>*/}
            {/*            </div>*/}

            {/*            <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm">*/}
            {/*                <div className="flex items-center justify-between text-sm">*/}
            {/*                    <span className="text-blue-100">{t('client.project_requests.checkout.project_label')}</span>*/}
            {/*                    <span className="font-semibold">{selectedProject?.title}</span>*/}
            {/*                </div>*/}
            {/*                <div className="flex items-center justify-between text-sm mt-2">*/}
            {/*                    <span className="text-blue-100">{t('client.project_requests.checkout.project_value')}</span>*/}
            {/*                    <span className="font-bold text-lg">*/}
            {/*                        {displayedValueAmount != null ? (*/}
            {/*                            <PriceDisplay value={displayedValueAmount} />*/}
            {/*                        ) : (*/}
            {/*                            '-'*/}
            {/*                        )}*/}
            {/*                    </span>*/}
            {/*                </div>*/}
            {/*                <div className="flex items-center justify-between text-sm mt-2">*/}
            {/*                    <span className="text-blue-100">{t('client.project_requests.checkout.platform_fee')}</span>*/}
            {/*                    <span className="font-bold text-lg">*/}
            {/*                        {displayedFeeAmount != null ? (*/}
            {/*                            <PriceDisplay value={displayedFeeAmount} />*/}
            {/*                        ) : (*/}
            {/*                            '-'*/}
            {/*                        )}*/}
            {/*                    </span>*/}
            {/*                </div>*/}
            {/*                <div className="flex items-center justify-between text-sm mt-2">*/}
            {/*                    <span className="text-blue-100">{t('client.project_requests.checkout.total_value')}</span>*/}
            {/*                    <span className="font-bold text-lg">*/}
            {/*                        {displayedTotalAmount != null ? (*/}
            {/*                            <PriceDisplay value={displayedTotalAmount} />*/}
            {/*                        ) : (*/}
            {/*                            '-'*/}
            {/*                        )}*/}
            {/*                    </span>*/}
            {/*                </div>*/}
            {/*            </div>*/}
            {/*        </div>*/}

            {/*        <div className="p-6 space-y-6 overflow-y-auto flex-1">*/}
            {/*            <div className="text-center">*/}
            {/*                <h3 className="font-semibold text-lg mb-2 text-[#0B1C2D] dark:text-[#E6EDF3]">*/}
            {/*                    {t('client.project_requests.checkout.how_it_works.title')}*/}
            {/*                </h3>*/}
            {/*                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">*/}
            {/*                    <div className="text-center">*/}
            {/*                        <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2 dark:bg-[rgba(27,196,125,0.12)]">*/}
            {/*                            <span className="font-bold text-[#1BC47D]">1</span>*/}
            {/*                        </div>*/}
            {/*                        <p className="text-slate-500 dark:text-[#A3ADC2]">{t('client.project_requests.checkout.how_it_works.step_1')}</p>*/}
            {/*                    </div>*/}
            {/*                    <div className="text-center">*/}
            {/*                        <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2 dark:bg-[rgba(27,196,125,0.12)]">*/}
            {/*                            <span className="font-bold text-[#1BC47D]">2</span>*/}
            {/*                        </div>*/}
            {/*                        <p className="text-slate-500 dark:text-[#A3ADC2]">{t('client.project_requests.checkout.how_it_works.step_2')}</p>*/}
            {/*                    </div>*/}
            {/*                    <div className="text-center">*/}
            {/*                        <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2 dark:bg-[rgba(27,196,125,0.12)]">*/}
            {/*                            <span className="font-bold text-[#1BC47D]">3</span>*/}
            {/*                        </div>*/}
            {/*                        <p className="text-slate-500 dark:text-[#A3ADC2]">{t('client.project_requests.checkout.how_it_works.step_3')}</p>*/}
            {/*                    </div>*/}
            {/*                </div>*/}
            {/*            </div>*/}

            {/*            <div className="bg-emerald-50 dark:bg-[rgba(27,196,125,0.1)] border border-emerald-100 dark:border-[#1E2A3D] rounded-lg p-4">*/}
            {/*                <div className="flex items-start space-x-3">*/}
            {/*                    <CheckCircle className="w-5 h-5 text-[#1BC47D] mt-0.5" />*/}
            {/*                    <div className="text-sm">*/}
            {/*                        <div className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3] mb-1">*/}
            {/*                            {t('client.project_requests.checkout.guarantee.title')}*/}
            {/*                        </div>*/}
            {/*                        <p className="text-slate-500 dark:text-[#A3ADC2]">*/}
            {/*                            {t('client.project_requests.checkout.guarantee.description')}*/}
            {/*                        </p>*/}
            {/*                    </div>*/}
            {/*                </div>*/}
            {/*            </div>*/}

            {/*            {clientSecret && (*/}
            {/*                <div className="min-h-[400px]"> /!* Oferim o înălțime minimă pentru a evita layout shift *!/*/}
            {/*                    <EmbeddedCheckoutProvider*/}
            {/*                        stripe={stripePromise}*/}
            {/*                        options={{ clientSecret, onComplete: handleCheckoutComplete }}*/}
            {/*                    >*/}
            {/*                        <EmbeddedCheckout className="w-full" />*/}
            {/*                    </EmbeddedCheckoutProvider>*/}
            {/*                </div>*/}
            {/*            )}*/}

            {/*             {errorMessage && (*/}
            {/*                <Alert variant="destructive">*/}
            {/*                    <AlertCircle className="h-4 w-4" />*/}
            {/*                    <AlertDescription>{errorMessage}</AlertDescription>*/}
            {/*                </Alert>*/}
            {/*            )}*/}

            {/*            {success && (*/}
            {/*                <Alert className="border-emerald-200 bg-emerald-50">*/}
            {/*                    <CheckCircle className="h-4 w-4 text-[#1BC47D]" />*/}
            {/*                    <AlertDescription className="text-emerald-800">*/}
            {/*                        {t('client.project_requests.checkout.success')}*/}
            {/*                    </AlertDescription>*/}
            {/*                </Alert>*/}
            {/*            )}*/}

            {/*            <div className="flex flex-col gap-3 sm:flex-row">*/}
            {/*                <Button*/}
            {/*                    type="button"*/}
            {/*                    variant="outline"*/}
            {/*                    onClick={() => setCheckoutDialogOpen(false)}*/}
            {/*                    className="px-6 border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-[#1E2A3D] dark:text-[#E6EDF3] dark:hover:bg-[#111B2D]"*/}
            {/*                >*/}
            {/*                    {t('client.project_requests.checkout.cancel')}*/}
            {/*                </Button>*/}
            {/*            </div>*/}

            {/*            <div className="text-xs text-center text-slate-500 dark:text-[#A3ADC2] pt-4 border-t border-slate-100 dark:border-[#1E2A3D]">*/}
            {/*                <div className="flex items-center justify-center space-x-4">*/}
            {/*                    <div className="flex items-center space-x-1">*/}
            {/*                        <Shield className="w-3 h-3" />*/}
            {/*                        <span>{t('client.project_requests.checkout.footer.ssl')}</span>*/}
            {/*                    </div>*/}
            {/*                    <div className="flex items-center space-x-1">*/}
            {/*                        <CheckCircle className="w-3 h-3" />*/}
            {/*                        <span>{t('client.project_requests.checkout.footer.pci')}</span>*/}
            {/*                    </div>*/}
            {/*                    <div className="flex items-center space-x-1">*/}
            {/*                        <Globe className="w-3 h-3" />*/}
            {/*                        <span>{t('client.project_requests.checkout.footer.stripe')}</span>*/}
            {/*                    </div>*/}
            {/*                </div>*/}
            {/*            </div>*/}
            {/*        </div>*/}
            {/*    </DialogContent>*/}
            {/*</Dialog>*/}

            <Dialog open={openContractDialog} onOpenChange={setOpenContractDialog}>
                <DialogContent className="max-w-3xl mx-auto bg-white dark:bg-[#0B1220] rounded-2xl shadow-2xl border-0 p-0 overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="bg-[#0B1C2D] p-6 text-white">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                                <Shield className="w-6 h-6 text-[#1BC47D]" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold text-white">
                                    Contract
                                </DialogTitle>
                                <DialogDescription className="text-sm text-blue-100">
                                    Contractul pentru proiect x
                                </DialogDescription>
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm">
                            <div className="flex items-center flex-col justify-between text-sm mt-2 max-h-[70vh] overflow-y-auto">
                                {contractResponse?.clauses?.map((clause: any, idx: any) => (
                                    <div key={idx} className="mb-6">
                                        <h3 className="font-bold text-gray-700 text-sm mb-1">{clause.title}</h3>
                                        <p className="text-gray-800 leading-relaxed bg-gray-50 p-3 rounded border-l-4 border-blue-400">
                                            {clause.text}
                                        </p>
              {/*                          <span className="text-xs text-green-600 font-mono">*/}
              {/*  [Engine Logic: {clause.logic_source}]*/}
              {/*</span>*/}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {withLayout ? <Footer /> : null}
        </div>
    );
}
