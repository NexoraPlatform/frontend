"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ro } from 'date-fns/locale';
import { loadStripe } from "@stripe/stripe-js";
import { MuiIcon } from "@/components/MuiIcons";

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY) {
    throw new Error('Stripe public key is not defined in environment variables');
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);

export default function ClientProjectRequestsPage() {
    const { user, loading } = useAuth();
    const [projects, setProjects] = useState<any[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [responding, setResponding] = useState<string | null>(null);
    const router = useRouter();
    const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [selectedProject, setSelectedProject] = useState<any | null>(null);
    const cardElementRef = useRef<any>(null);
    const stripeRef = useRef<any>(null);
    const elementsRef = useRef<any>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            // router.push('/auth/signin');
        }

        if (user && !user?.roles?.some((r: any) => r.slug?.toLowerCase() === 'client')) {
            router.push('/dashboard');
        }
        if (user) {
            loadProjects();
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (checkoutDialogOpen && selectedProject?.id) {
            async function initStripe() {
                const stripe = await stripePromise;
                if (!stripe) return console.error('Stripe nu s-a încărcat.');

                const elements = stripe.elements();
                const cardElement = elements.create('card');
                cardElement.mount(`#card-element-${selectedProject.id}`);

                // Salvezi pentru confirmare ulterioară
                stripeRef.current = stripe;
                elementsRef.current = elements;
                cardElementRef.current = cardElement;
            }

            initStripe();
        }

        return () => {
            // Demontezi elementul când se închide
            cardElementRef.current?.unmount?.();
            cardElementRef.current = null;
        };
    }, [checkoutDialogOpen, selectedProject?.id]);

    const handlePayment = async (project_id: any) => {
        setErrorMessage('');

        const stripe = stripeRef.current;
        const cardElement = cardElementRef.current;

        if (!stripe || !cardElement) {
            setErrorMessage('Stripe nu e gata.');
            return;
        }

        if (!clientSecret) {
            setErrorMessage('Sesiunea de plată nu este pregătită încă.');
            return;
        }

        const result = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: cardElement,
                billing_details: {
                    name: `${user?.firstName} ${user?.lastName}`,
                    email: user?.email,
                },
            },
        });

        await apiClient.setPaymentIntent(project_id, result.paymentIntent.id);

        if (result.error) {
            setErrorMessage(result.error.message || 'Eroare la plată');
        } else if (result.paymentIntent.status === 'requires_capture' || result.paymentIntent.status === 'succeeded') {
            setSuccess(true);
            // Poți închide dialogul, face redirect, etc.
        }

    };

    const loadProjects = async () => {
        try {
            const response = await apiClient.getClientProjectRequests();
            setProjects(response.projects || []);
        } catch (error) {
            console.error('Failed to load projects:', error);
        } finally {
            setLoadingProjects(false);
        }
    };

    const getClientSecret = async (project_id: string) => {
        // router.push(response.url);
        try {
            const response = await apiClient.getPaymentSession(project_id);
            if (response.clientSecret) {
                setClientSecret(response.clientSecret);
                setCheckoutDialogOpen(true);
            } else {
                throw new Error('Client secret not found in response');
            }

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

    const handleBudgetResponse = async (
        projectId: string,
        providerId: string,
        response: 'ACCEPTED' | 'REJECTED'
    ) => {
        setResponding(`${projectId}-${providerId}`);
        try {
            await apiClient.respondToBudgetProposal(projectId, providerId, { response });
            await loadProjects();
            toast.success(response === 'ACCEPTED' ? 'Buget aprobat!' : 'Buget respins');
        } catch (error: any) {
            toast.error('Eroare: ' + error.message);
        } finally {
            setResponding(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return (
                    <Badge className="bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/30">
                        <Clock className="w-3 h-3 mr-1" />
                        În așteptare
                    </Badge>
                );
            case 'ACCEPTED':
                return (
                    <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:border-emerald-500/30">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Acceptat
                    </Badge>
                );
            case 'REJECTED':
                return (
                    <Badge className="bg-red-100 text-red-800 border border-red-200 dark:bg-red-500/10 dark:text-red-200 dark:border-red-500/30">
                        <XCircle className="w-3 h-3 mr-1" />
                        Respins
                    </Badge>
                );
            case 'NEW_PROPOSE':
                return (
                    <Badge className="bg-sky-100 text-sky-800 border border-sky-200 dark:bg-sky-500/10 dark:text-sky-200 dark:border-sky-500/30">
                        <DollarSign className="w-3 h-3 mr-1" />
                        Buget propus
                    </Badge>
                );
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    if (loading || loadingProjects) {
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
                            <span className="text-[#1BC47D]">●</span> Hub client Trustora
                        </Badge>
                        <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-[#0B1C2D] dark:text-[#E6EDF3]">
                            Cererile Mele de Proiecte
                        </h1>
                        <p className="text-lg text-slate-500 dark:text-[#A3ADC2]">
                            Urmărește răspunsurile prestatorilor și securizează plățile prin escrow pentru
                            colaborări sigure.
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
                                    Nu ai cereri de proiecte
                                </h3>
                                <p className="text-slate-500 dark:text-[#A3ADC2] mb-6">
                                    Creează primul tău proiect pentru a începe colaborarea cu prestatorii.
                                </p>
                                <Button onClick={() => router.push('/projects/new')} className="btn-primary">
                                    <Target className="w-4 h-4 mr-2" />
                                    Creează Proiect
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
                                                        <span>Buget total: {project.budget?.toLocaleString()} RON</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4 text-[#1BC47D]" />
                                                        <span>
                                                            Creat {formatDistanceToNow(new Date(project.created_at), {
                                                                addSuffix: true,
                                                                locale: ro
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <User className="w-4 h-4 text-[#1BC47D]" />
                                                        <span>{project.providers?.length || 0} prestatori selectați</span>
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
                                                        Tehnologii Proiect
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
                                                Răspunsuri Prestatori
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
                                                                            <span>{provider.location || 'România'}</span>
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
                                                                    Alocat: {provider.allocatedBudget?.toLocaleString()} RON
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
                                                                                Propunere de buget nou
                                                                            </div>
                                                                            <div className="text-lg font-bold text-[#1BC47D]">
                                                                                {provider.proposedBudget?.toLocaleString()} RON
                                                                            </div>
                                                                            <div className="text-sm text-slate-500 dark:text-[#A3ADC2]">
                                                                                Buget original: {provider.allocatedBudget?.toLocaleString()} RON
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
                                                                                Aprobă
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                onClick={() => handleBudgetResponse(project.id, provider.id, 'REJECTED')}
                                                                                disabled={responding === `${project.id}-${provider.id}`}
                                                                                className="border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-[#1E2A3D] dark:text-[#E6EDF3] dark:hover:bg-[#111B2D]"
                                                                            >
                                                                                <XCircle className="w-4 h-4 mr-1" />
                                                                                Respinge
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                </AlertDescription>
                                                            </Alert>
                                                        )}

                                                        {provider.respondedAt && (
                                                            <div className="mt-3 text-xs text-slate-400 dark:text-[#A3ADC2]">
                                                                Răspuns primit {formatDistanceToNow(new Date(provider.respondedAt), {
                                                                    addSuffix: true,
                                                                    locale: ro
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
                                                        Buget alocat: {milestone.amount.toLocaleString()} RON
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
                                                Securizează Plata
                                            </Button>)}
                                            <div className="flex flex-col gap-2 sm:flex-row">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-[#1E2A3D] dark:text-[#E6EDF3] dark:hover:bg-[#111B2D]"
                                                >
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    Vezi Detalii
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-[#1E2A3D] dark:text-[#E6EDF3] dark:hover:bg-[#111B2D]"
                                                >
                                                    <MessageSquare className="w-4 h-4 mr-2" />
                                                    Mesaje
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
                <DialogContent className="max-w-md mx-auto bg-white dark:bg-[#0B1220] rounded-2xl shadow-2xl border-0 p-0 overflow-hidden">
                    <div className="bg-[#0B1C2D] p-6 text-white">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                                <Shield className="w-6 h-6 text-[#1BC47D]" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold text-white">
                                    Securizează Plata
                                </DialogTitle>
                                <DialogDescription className="text-sm text-blue-100">
                                    Protejează-ți investiția cu escrow
                                </DialogDescription>
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-blue-100">Proiect:</span>
                                <span className="font-semibold">{selectedProject?.title}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm mt-2">
                                <span className="text-blue-100">Valoare proiect:</span>
                                <span className="font-bold text-lg">{Number(selectedProject?.budget)?.toLocaleString()} RON</span>
                            </div>
                            <div className="flex items-center justify-between text-sm mt-2">
                                <span className="text-blue-100">Comision platforma (12%):</span>
                                <span className="font-bold text-lg">{Number(selectedProject?.budget * 12 / 100)?.toLocaleString()} RON</span>
                            </div>
                            <div className="flex items-center justify-between text-sm mt-2">
                                <span className="text-blue-100">Valoare totală:</span>
                                <span className="font-bold text-lg">{(Number(selectedProject?.budget) + (Number(selectedProject?.budget) * (12 / 100)))?.toLocaleString()} RON</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="text-center">
                            <h3 className="font-semibold text-lg mb-2 text-[#0B1C2D] dark:text-[#E6EDF3]">
                                Cum funcționează Escrow?
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                                <div className="text-center">
                                    <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2 dark:bg-[rgba(27,196,125,0.12)]">
                                        <span className="font-bold text-[#1BC47D]">1</span>
                                    </div>
                                    <p className="text-slate-500 dark:text-[#A3ADC2]">Banii sunt blocați securizat</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2 dark:bg-[rgba(27,196,125,0.12)]">
                                        <span className="font-bold text-[#1BC47D]">2</span>
                                    </div>
                                    <p className="text-slate-500 dark:text-[#A3ADC2]">Prestatorii lucrează la proiect</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2 dark:bg-[rgba(27,196,125,0.12)]">
                                        <span className="font-bold text-[#1BC47D]">3</span>
                                    </div>
                                    <p className="text-slate-500 dark:text-[#A3ADC2]">Banii sunt eliberați la finalizare</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-emerald-50 dark:bg-[rgba(27,196,125,0.1)] border border-emerald-100 dark:border-[#1E2A3D] rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                                <CheckCircle className="w-5 h-5 text-[#1BC47D] mt-0.5" />
                                <div className="text-sm">
                                    <div className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3] mb-1">
                                        Protecție 100% Garantată
                                    </div>
                                    <p className="text-slate-500 dark:text-[#A3ADC2]">
                                        Banii tăi sunt în siguranță până când proiectul este finalizat conform specificațiilor.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-slate-600 dark:text-[#A3ADC2]">
                                Detalii Card de Plată
                            </label>
                            <div
                                id={selectedProject?.id ? `card-element-${selectedProject.id}` : 'card-element'}
                                className="border-2 border-slate-200 dark:border-[#1E2A3D] dark:!text-white rounded-lg p-4 bg-white dark:bg-[#0B1220] focus-within:border-[#1BC47D] focus-within:ring-2 focus-within:ring-emerald-200 transition-all"
                            />
                        </div>

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
                                    Plata a fost autorizată cu succes! Prestatorii pot începe lucrul.
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Button
                                type="button"
                                onClick={() => handlePayment(selectedProject?.id)}
                                disabled={loading || !clientSecret || !selectedProject}
                                className="flex-1 btn-primary py-3"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Se procesează...
                                    </>
                                ) : (
                                    <>
                                        <Shield className="w-4 h-4 mr-2" />
                                        Securizează {(Number(selectedProject?.budget) + (Number(selectedProject?.budget) * 12 / 100))?.toLocaleString()} RON
                                    </>
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCheckoutDialogOpen(false)}
                                className="px-6 border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-[#1E2A3D] dark:text-[#E6EDF3] dark:hover:bg-[#111B2D]"
                            >
                                Anulează
                            </Button>
                        </div>

                        <div className="text-xs text-center text-slate-500 dark:text-[#A3ADC2] pt-4 border-t border-slate-100 dark:border-[#1E2A3D]">
                            <div className="flex items-center justify-center space-x-4">
                                <div className="flex items-center space-x-1">
                                    <Shield className="w-3 h-3" />
                                    <span>SSL Securizat</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <CheckCircle className="w-3 h-3" />
                                    <span>PCI Compliant</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <Globe className="w-3 h-3" />
                                    <span>Stripe Powered</span>
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
