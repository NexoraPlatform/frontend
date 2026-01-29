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
    Eye, Globe,
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
import {EmbeddedCheckout, EmbeddedCheckoutProvider} from "@stripe/react-stripe-js";

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY) {
    throw new Error('Stripe public key is not defined in environment variables');
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);

export default function ClientProjectRequestsPage() {
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
    const cardElementRef = useRef<any>(null);
    const stripeRef = useRef<any>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [success, setSuccess] = useState(false);

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
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        const echo = getEcho(token);
        if (!echo) return;
        const channel = echo.private(`App.Models.User.${user.id}`);
        const handler = (notification: { type?: string }) => {
            if (notification?.type !== 'project.status.updated') return;
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

        if (!user?.roles?.some((r: any) => r.slug?.toLowerCase() === 'client')) {
            router.push('/dashboard');
            return;
        }

        loadProjects();
    }, [user, userLoading, router, loadProjects]);

    const getClientSecret = async (project_id: string) => {
        // router.push(response.url);
        try {
            const response = await apiClient.getPaymentSession(project_id);
            setClientSecret(response.clientSecret);
            setCheckoutDialogOpen(true);
        } catch (err) {
            console.error('Checkout error:', err);
        }
    }

    const openCheckout = async (project: any) => {
        setSelectedProject(project);
        setSuccess(false);
        setErrorMessage('');
        setClientSecret(null);
        await getClientSecret(project.id);
    };

    const handleBudgetResponse = useCallback(async (
        projectId: string,
        providerId: string,
        response: 'ACCEPTED' | 'REJECTED'
    ) => {
        setResponding(`${projectId}-${providerId}`);
        try {
            await apiClient.respondToBudgetProposal(projectId, providerId, { response });
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
    }, [loadProjects, t]);

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

    if (loading || userLoading || loadingProjects) {
        return (
            <div className="min-h-screen bg-white dark:bg-[#070C14] flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#1BC47D]" />
            </div>
        );
    }

    if (!user || user?.roles?.some((r: any) => r.slug?.toLowerCase() !== 'client')) {
        return null;
    }

    return (
        <div className="min-h-screen bg-white dark:bg-[#070C14]">
            <Header />
            <TrustoraThemeStyles />

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
                            {projects.map((project) => (

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
                                                                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-[#A3ADC2]">
                                                                            <div className="flex items-center gap-1">
                                                                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                                                <span>{provider.rating || 0}</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-1">
                                                                                <MapPin className="w-3 h-3 text-[#1BC47D]" />
                                                                                <span>{provider.location || t('client.project_requests.providers.location_fallback')}</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-[#A3ADC2] mt-2">
                                                                            {provider.services?.length > 0 && provider.services.map((service: any, index: number) => (
                                                                                <Badge
                                                                                    key={index}
                                                                                    variant="outline"
                                                                                    className="text-xs border-slate-200 dark:border-[#1E2A3D]"
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
                                                                {providerMilestones.map((milestone: any, index: number) => (
                                                                    <div
                                                                        key={index}
                                                                        className={`flex items-center justify-between rounded-md border p-2 text-sm 
                                                                    ${milestone.status === 'PENDING' && "bg-yellow-300"}
                                                                    ${milestone.status === 'FINISHED' && "bg-green-300"}
                                                                    ${milestone.status === 'PAID' && "bg-green-500"}
                                                                    ${milestone.status === 'REJECTED' && "bg-red-700"}
                                                                     `}
                                                                    >
                                                                        <div className="flex items-center justify-between gap-6">
                                                                            <span>{milestone.title}</span>
                                                                            <span>/</span>
                                                                            <span className="font-medium">
                                                                                {t('client.project_requests.providers.milestone_budget')}{' '}
                                                                                <PriceDisplay value={milestone.amount} />
                                                                            </span>
                                                                        </div>

                                                                        <span>{milestone.status}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between pt-4 border-t border-slate-100 dark:border-[#1E2A3D]">
                                            {project.paymentStatus !== 'ESCROW' && (<Button
                                                onClick={() => openCheckout(project)}
                                                className="btn-primary w-full lg:w-auto px-6 py-6 text-base font-semibold"
                                                size="lg"
                                            >
                                                <Shield className="w-5 h-5 mr-2" />
                                                {t('client.project_requests.actions.secure_payment')}
                                            </Button>)}
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
                            ))}
                        </div>
                    )}
                </div>
            </section>

            <Dialog open={checkoutDialogOpen} onOpenChange={setCheckoutDialogOpen}>
                <DialogContent className="max-w-md mx-auto bg-white dark:bg-[#0B1220] rounded-2xl shadow-2xl border-0 p-0 overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="bg-[#0B1C2D] p-6 text-white">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                                <Shield className="w-6 h-6 text-[#1BC47D]" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold text-white">
                                    {t('client.project_requests.checkout.title')}
                                </DialogTitle>
                                <DialogDescription className="text-sm text-blue-100">
                                    {t('client.project_requests.checkout.description')}
                                </DialogDescription>
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-blue-100">{t('client.project_requests.checkout.project_label')}</span>
                                <span className="font-semibold">{selectedProject?.title}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm mt-2">
                                <span className="text-blue-100">{t('client.project_requests.checkout.project_value')}</span>
                                <span className="font-bold text-lg">
                                    {selectedProject?.budget.amount != null ? (
                                        <PriceDisplay value={Number(selectedProject?.budget.amount)} />
                                    ) : (
                                        '-'
                                    )}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm mt-2">
                                <span className="text-blue-100">{t('client.project_requests.checkout.platform_fee')}</span>
                                <span className="font-bold text-lg">
                                    {selectedProject?.budget.amount != null ? (
                                        <PriceDisplay value={Number(selectedProject?.budget.amount) * 0.12} />
                                    ) : (
                                        '-'
                                    )}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm mt-2">
                                <span className="text-blue-100">{t('client.project_requests.checkout.total_value')}</span>
                                <span className="font-bold text-lg">
                                    {selectedProject?.budget != null ? (
                                        <PriceDisplay value={Number(selectedProject?.budget.amount) * 1.12} />
                                    ) : (
                                        '-'
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-6 overflow-y-auto flex-1">
                        <div className="text-center">
                            <h3 className="font-semibold text-lg mb-2 text-[#0B1C2D] dark:text-[#E6EDF3]">
                                {t('client.project_requests.checkout.how_it_works.title')}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                                <div className="text-center">
                                    <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2 dark:bg-[rgba(27,196,125,0.12)]">
                                        <span className="font-bold text-[#1BC47D]">1</span>
                                    </div>
                                    <p className="text-slate-500 dark:text-[#A3ADC2]">{t('client.project_requests.checkout.how_it_works.step_1')}</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2 dark:bg-[rgba(27,196,125,0.12)]">
                                        <span className="font-bold text-[#1BC47D]">2</span>
                                    </div>
                                    <p className="text-slate-500 dark:text-[#A3ADC2]">{t('client.project_requests.checkout.how_it_works.step_2')}</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2 dark:bg-[rgba(27,196,125,0.12)]">
                                        <span className="font-bold text-[#1BC47D]">3</span>
                                    </div>
                                    <p className="text-slate-500 dark:text-[#A3ADC2]">{t('client.project_requests.checkout.how_it_works.step_3')}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-emerald-50 dark:bg-[rgba(27,196,125,0.1)] border border-emerald-100 dark:border-[#1E2A3D] rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                                <CheckCircle className="w-5 h-5 text-[#1BC47D] mt-0.5" />
                                <div className="text-sm">
                                    <div className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3] mb-1">
                                        {t('client.project_requests.checkout.guarantee.title')}
                                    </div>
                                    <p className="text-slate-500 dark:text-[#A3ADC2]">
                                        {t('client.project_requests.checkout.guarantee.description')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {clientSecret && (
                            <div className="min-h-[400px]"> {/* Oferim o înălțime minimă pentru a evita layout shift */}
                                <EmbeddedCheckoutProvider
                                    stripe={stripePromise}
                                    options={{ clientSecret, onComplete: handleCheckoutComplete }}
                                >
                                    <EmbeddedCheckout className="w-full" />
                                </EmbeddedCheckoutProvider>
                            </div>
                        )}

                        {errorMessage && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{errorMessage}</AlertDescription>
                            </Alert>
                        )}

                        {success && (
                            <Alert className="border-emerald-200 bg-emerald-50">
                                <CheckCircle className="h-4 w-4 text-[#1BC47D]" />
                                <AlertDescription className="text-emerald-800">
                                    {t('client.project_requests.checkout.success')}
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCheckoutDialogOpen(false)}
                                className="px-6 border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-[#1E2A3D] dark:text-[#E6EDF3] dark:hover:bg-[#111B2D]"
                            >
                                {t('client.project_requests.checkout.cancel')}
                            </Button>
                        </div>

                        <div className="text-xs text-center text-slate-500 dark:text-[#A3ADC2] pt-4 border-t border-slate-100 dark:border-[#1E2A3D]">
                            <div className="flex items-center justify-center space-x-4">
                                <div className="flex items-center space-x-1">
                                    <Shield className="w-3 h-3" />
                                    <span>{t('client.project_requests.checkout.footer.ssl')}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <CheckCircle className="w-3 h-3" />
                                    <span>{t('client.project_requests.checkout.footer.pci')}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <Globe className="w-3 h-3" />
                                    <span>{t('client.project_requests.checkout.footer.stripe')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Footer />
        </div>
    );
}
