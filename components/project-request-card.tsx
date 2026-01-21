"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Calendar,
    DollarSign,
    Clock,
    User,
    CheckCircle,
    XCircle,
    MapPin,
    Star,
    Eye,
    MessageSquare,
    Loader2,
    Banknote
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ro } from 'date-fns/locale';
import { useAuth } from "@/contexts/auth-context";
import apiClient from "@/lib/api";
import { MuiIcon } from "@/components/MuiIcons";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTrigger,
    DialogTitle,
    DialogDescription, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import { useRouter } from "@/lib/navigation";
import { toast } from "sonner";
import { loadStripe } from "@stripe/stripe-js";
import { useLocale } from "next-intl";
import { formatDeadline } from '@/lib/projects';
import { Input } from "@/components/ui/input";

interface ProjectRequestCardProps {
    project: any;
    onResponse: (projectId: string, response: 'ACCEPTED' | 'REJECTED' | 'NEW_PROPOSE', proposedBudget?: number) => void;
}

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY) {
    throw new Error('Stripe public key is not defined in environment variables');
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);

export function ProjectRequestCard({ project, onResponse }: ProjectRequestCardProps) {
    const { user, loading } = useAuth();
    const [responding, setResponding] = useState<string | null>(null);
    const router = useRouter();
    const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const cardElementRef = useRef<any>(null);
    const stripeRef = useRef<any>(null);
    const elementsRef = useRef<any>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [success, setSuccess] = useState(false);
    const locale = useLocale();
    const [proposeNewBudgetProviderId, setProposeNewBudgetProviderId] = useState<string | null>(null);
    const [newBudget, setNewBudget] = useState<number>(0);

    useEffect(() => {
        if (!loading && !user) {
            // router.push('/auth/signin');
        }
        if (user && user?.roles?.some((r: any) => r.slug?.toLowerCase() !== 'client')) {
            router.push('/dashboard');
        }
        if (user) {
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (checkoutDialogOpen) {
            async function initStripe() {
                const stripe = await stripePromise;
                if (!stripe) return console.error('Stripe nu s-a încărcat.');

                const elements = stripe.elements();
                const cardElement = elements.create('card');
                cardElement.mount('#card-element');

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
    }, [checkoutDialogOpen]);

    const handlePayment = async (project_id: any) => {
        setErrorMessage('');

        const stripe = stripeRef.current;
        const cardElement = cardElementRef.current;

        if (!stripe || !cardElement) {
            setErrorMessage('Stripe nu e gata.');
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

    const handleProjectFinish = async (projectId: string) => {
        const response = await apiClient.finishProject(projectId);

        const stripe = await stripePromise;
    }

    const handleMarkMilestoneAsComplete = async (projectId: number, milestone: number) => {
        const response = await apiClient.markMilestoneAsComplete(projectId, milestone);
    }

    const handleBudgetResponse = async (
        projectId: string,
        providerId: string,
        response: 'ACCEPTED' | 'REJECTED'
    ) => {
        setResponding(`${projectId}-${providerId}`);
        try {
            await apiClient.respondToBudgetProposal(projectId, providerId, { response });
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
                return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />În așteptare</Badge>;
            case 'ACCEPTED':
                return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Acceptat</Badge>;
            case 'REJECTED':
                return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Respins</Badge>;
            case 'NEW_PROPOSE':
                return <Badge className="bg-emerald-100 text-emerald-800"><DollarSign className="w-3 h-3 mr-1" />Buget propus</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const servicesMap = new Map(
        (project?.existing_services ?? []).map((s: any) => [s.id, s])
    );

    const providerMilestones =
        project.milestones
            ?.find((m: any) => Number(m.providerId) === Number(user.id))
            ?.milestones ?? [];

    return (
        <Card key={project.id} className="border-2">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-xl mb-2">
                            {project.title}
                            <span className="ms-2">{getStatusBadge(project.status)}</span>
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                            {project.description}
                        </CardDescription>

                        <div className="flex items-center space-x-4 mt-3 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                                <DollarSign className="w-4 h-4" />
                                <span>Buget total: {project.budget?.toLocaleString()} RON</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>
                                    {project.project_duration
                                        ? `Deadline: ${formatDeadline(project.project_duration, locale)}`
                                        : 'Fără deadline fix'
                                    }
                                </span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>
                                    Creat {formatDistanceToNow(new Date(project.created_at), {
                                        addSuffix: true,
                                        locale: ro
                                    })}
                                </span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <User className="w-4 h-4" />
                                <span>{project.providers?.length || 0} prestatori selectați</span>
                            </div>
                        </div>
                    </div>
                    {Array.from(servicesMap).map((category: any, index: number) => (
                        <Badge key={index} className="bg-emerald-100 text-emerald-800 inline-flex whitespace-nowrap me-1">
                            {category.name}
                        </Badge>
                    ))}

                </div>
            </CardHeader>

            <CardContent>
                {/* Technologies */}
                {(project?.existing_services?.length > 0
                    || project?.custom_services?.length > 0) && (
                        <div className="mb-4">
                            <div className="text-sm font-medium mb-2">Tehnologii Proiect:</div>
                            <div className="flex flex-wrap gap-1">
                                {project.existing_services.map((tech: any, index: number) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                        {tech.name}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                {/* Providers List */}
                <div>
                    <div className="text-sm font-medium mb-3">Răspunsuri Prestatori:</div>
                    <div className="space-y-3">
                        {project.providers?.map((provider: any) => (
                            <div key={provider.id} className="border rounded-lg p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-3">
                                        <Avatar className="w-10 h-10">
                                            <AvatarImage src={provider.avatar} />
                                            <AvatarFallback>
                                                {provider.firstName?.[0]}{provider.lastName?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium">
                                                {provider.firstName} {provider.lastName}
                                            </div>
                                            <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                                                <div className="flex items-center space-x-1">
                                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                    <span>{provider.rating || 0}</span>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <MapPin className="w-3 h-3" />
                                                    <span>{provider.location || 'România'}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                                                {provider.services?.length > 0 && provider.services.map((service: any, index: number) => (
                                                    <Badge key={index} variant="outline" className="text-xs">
                                                        <MuiIcon icon={service.categoryIcon} size={20} className="mr-1" />
                                                        {service.name}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {getStatusBadge(provider.status)}
                                        <div className="text-sm text-muted-foreground mt-1">
                                            Alocat: {provider.allocatedBudget?.toLocaleString()} RON
                                        </div>
                                    </div>
                                </div>
                                {(provider.provider_response === 'PENDING') && (
                                    <Dialog
                                        open={proposeNewBudgetProviderId === provider.id}
                                        onOpenChange={(isOpen) => setProposeNewBudgetProviderId(isOpen ? provider.id : null)}
                                    >
                                        <DialogTrigger asChild>
                                            <Button variant="outline">Propunere buget nou</Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl">
                                            <DialogHeader>
                                                <DialogTitle>Propunere buget nou</DialogTitle>
                                                <DialogDescription>
                                                    Propuneți o nouă sumă pentru acest proiect. Clientul va trebui să aprobe noua propunere.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="flex flex-col flex-wrap gap-1">
                                                <div>Buget original: {provider.allocatedBudget?.toLocaleString()} RON</div>
                                                <div>Introdu propunerea de buget:</div>
                                                <div>
                                                    <Input
                                                        type="number"
                                                        value={newBudget}
                                                        onChange={(e) => setNewBudget(Number(e.target.value))}
                                                    />
                                                </div>
                                            </div>

                                            <DialogFooter>
                                                <DialogClose asChild>
                                                    <Button variant="outline">Anulează</Button>
                                                </DialogClose>
                                                <Button
                                                    variant="default"
                                                    onClick={() => {
                                                        onResponse(project.id, 'NEW_PROPOSE', newBudget);
                                                        setProposeNewBudgetProviderId(null);
                                                    }}
                                                >
                                                    Salvează modificările
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                )}

                                {/* Budget Proposal */}
                                {(provider.provider_response === 'PENDING') && (
                                    <Alert className={`mt-3 border-emerald-200 dark:bg-emerald-500/20 bg-emerald-50/70`}>
                                        <DollarSign className="h-4 w-4" />
                                        <AlertDescription>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium">Propunere de buget nou:</div>
                                                    <div className="text-lg font-bold text-emerald-600">
                                                        {provider.proposedBudget?.toLocaleString()} RON
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        Buget original: {provider.allocatedBudget?.toLocaleString()} RON
                                                    </div>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleBudgetResponse(project.id, provider.id, 'ACCEPTED')}
                                                        disabled={responding === `${project.id}-${provider.id}` || provider.provider_response !== 'PENDING'}
                                                    >
                                                        <CheckCircle className="w-4 h-4 mr-1" />
                                                        Aprobă
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setProposeNewBudgetProviderId(provider.id)}
                                                        disabled={responding === `${project.id}-${provider.id}` || provider.provider_response !== 'PENDING'}
                                                    >
                                                        <Banknote className="w-4 h-4 mr-1" />
                                                        Propune buget nou
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleBudgetResponse(project.id, provider.id, 'REJECTED')}
                                                        disabled={responding === `${project.id}-${provider.id}`}
                                                    >
                                                        <XCircle className="w-4 h-4 mr-1" />
                                                        Respinge
                                                    </Button>
                                                </div>
                                            </div>
                                        </AlertDescription>
                                    </Alert>
                                )}

                                {/* Response Time */}
                                {provider.respondedAt && (
                                    <div className="mt-2 text-xs text-muted-foreground">
                                        Răspuns primit cu {formatDistanceToNow(new Date(provider.respondedAt), {
                                            addSuffix: true,
                                            locale: ro
                                        })}
                                    </div>
                                )}
                                {providerMilestones.length > 0 && (
                                    <div className="mt-4 border-t pt-3">
                                        <div className="text-sm font-medium mb-2">
                                            Milestone-uri proiect
                                        </div>

                                        <div className="space-y-2">
                                            {providerMilestones.map((milestone: any, index: number) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between rounded-md border p-2 text-sm"
                                                >
                                                    <div className="flex items-center justify-between gap-6">
                                                        <span>{milestone.title}</span>
                                                        <span>/</span>
                                                        <span className="font-medium">
                                                        Buget alocat: {milestone.amount.toLocaleString()} RON
                                                    </span>
                                                    </div>

                                                    <span>
                                                        <Button
                                                            size="sm"
                                                            variant="default"
                                                            onClick={() => handleMarkMilestoneAsComplete(project.id, milestone.id)}
                                                            disabled={milestone.status !== 'PENDING'}
                                                            >

                                                            {milestone.status === 'PENDING' ? 'Marcheaza milestone ca finalizat' : milestone.status === 'PAID' ? 'Platit' : milestone.status === 'REJECTED' ? 'Refuzat' : 'In asteptare'}
                                                        </Button>
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Project Actions */}
                <div className="flex space-x-3 mt-6 pt-4 border-t">

                    <Button variant="outline" size="sm" onClick={() => router.push(`/projects/${project.slug}`)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Vezi Detalii
                    </Button>
                    <Button variant="outline" size="sm">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Mesaje
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
