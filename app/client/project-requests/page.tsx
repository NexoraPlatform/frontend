"use client";

import {useEffect, useRef, useState} from 'react';
import {useRouter} from 'next/navigation';
import {Header} from '@/components/header';
import {Footer} from '@/components/footer';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {Alert, AlertDescription} from '@/components/ui/alert';
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
    XCircle,
    Zap
} from 'lucide-react';
import {Dialog, DialogContent} from '@/components/ui/dialog';
import {useAuth} from '@/contexts/auth-context';
import {apiClient} from '@/lib/api';
import {toast} from 'sonner';
import {formatDistanceToNow} from 'date-fns';
import {ro} from 'date-fns/locale';
import {loadStripe} from "@stripe/stripe-js";
import {DialogTitle} from "@mui/material";

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
    const cardElementRef = useRef<any>(null);
    const stripeRef = useRef<any>(null);
    const elementsRef = useRef<any>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            // router.push('/auth/signin');
        }
        if (user && user.role !== 'CLIENT') {
            router.push('/dashboard');
        }
        if (user) {
            loadProjects();
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

    const handleProjectFinish = async (projectId: string) => {
        const response = await apiClient.finishProject(projectId);

        const stripe = await stripePromise;


    }

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
                return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />În așteptare</Badge>;
            case 'ACCEPTED':
                return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Acceptat</Badge>;
            case 'REJECTED':
                return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Respins</Badge>;
            case 'NEW_PROPOSE':
                return <Badge className="bg-blue-100 text-blue-800"><DollarSign className="w-3 h-3 mr-1" />Buget propus</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    if (loading || loadingProjects) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (!user || user.role !== 'CLIENT') {
        return null;
    }

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Cererile Mele de Proiecte</h1>
                    <p className="text-muted-foreground">
                        Urmărește răspunsurile prestatorilor la proiectele tale
                    </p>
                </div>

                {projects.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-12">
                            <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Nu ai cereri de proiecte</h3>
                            <p className="text-muted-foreground mb-6">
                                Creează primul tău proiect pentru a începe colaborarea cu prestatorii
                            </p>
                            <Button onClick={() => router.push('/projects/new')}>
                                <Target className="w-4 h-4 mr-2" />
                                Creează Proiect
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {projects.map((project) => (
                            <Card key={project.id} className="border-2">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-xl mb-2">{project.title}</CardTitle>
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
                                        <Badge className="bg-blue-100 text-blue-800">
                                            {project.service?.category?.name}
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <CardContent>
                                    {/* Technologies */}
                                    {(project.existing_services && project.existing_services.length > 0)
                                        || (project.custom_services && project.custom_services.length > 0) && (
                                            <div className="mb-4">
                                                <div className="text-sm font-medium mb-2">Tehnologii:</div>
                                                <div className="flex flex-wrap gap-1">
                                                    {project.existing_services.map((tech: any, index: number) => (
                                                        <Badge key={index} variant="outline" className="text-xs">
                                                            <Code className="w-3 h-3 mr-1" />
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
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            {getStatusBadge(provider.status)}
                                                            <div className="text-sm text-muted-foreground mt-1">
                                                                Alocat: {provider.allocatedBudget?.toLocaleString()} RON
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Budget Proposal */}
                                                    {provider.status === 'NEW_PROPOSE' && (
                                                        <Alert className={`mt-3 border-blue-200 bg-blue-50`}>
                                                            <DollarSign className="h-4 w-4" />
                                                            <AlertDescription>
                                                                <div className="flex items-center justify-between">
                                                                    <div>
                                                                        <div className="font-medium">Propunere de buget nou:</div>
                                                                        <div className="text-lg font-bold text-blue-600">
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
                                                                            disabled={responding === `${project.id}-${provider.id}` || provider.pivotClientResponse === 'ACCEPTED'}
                                                                            aria-label={`Aprobă propunerea de buget de ${provider.proposedBudget?.toLocaleString()} RON`}
                                                                        >
                                                                            <CheckCircle className="w-4 h-4 mr-1" />
                                                                            Aprobă
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="destructive"
                                                                            onClick={() => handleBudgetResponse(project.id, provider.id, 'REJECTED')}
                                                                            disabled={responding === `${project.id}-${provider.id}`}
                                                                            aria-label={`Respinge propunerea de buget de ${provider.proposedBudget?.toLocaleString()} RON`}
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
                                                            Răspuns primit {formatDistanceToNow(new Date(provider.respondedAt), {
                                                            addSuffix: true,
                                                            locale: ro
                                                        })}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Project Actions */}
                                    <div className="flex space-x-3 mt-6 pt-4 border-t">
                                        <Button
                                            onClick={() => getClientSecret(project.id)}
                                            className="flex-1 relative overflow-hidden bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 text-white font-bold py-6 px-8 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-[1.02] group border-0"
                                            size="lg"
                                            aria-label={`Securizează plata de ${project.budget?.toLocaleString()} RON în cont escrow pentru proiectul ${project.title}`}
                                        >
                                            {/* Animated background effect */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" aria-hidden="true" />

                                            <div className="relative flex items-center justify-center space-x-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30 group-hover:scale-110 transition-transform duration-300">
                                                        <Shield className="w-6 h-6 drop-shadow-sm" />
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="font-black text-lg tracking-wide drop-shadow-sm">
                                                            🔒 Securizează Plata
                                                        </div>
                                                        <div className="text-sm opacity-95 font-medium">
                                                            Protejează {project.budget?.toLocaleString()} RON în escrow
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="hidden sm:flex flex-col items-center text-xs opacity-90">
                                                    <div className="flex items-center space-x-1 mb-1">
                                                        <CheckCircle className="w-3 h-3" />
                                                        <span>100% Sigur</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <Zap className="w-3 h-3" />
                                                        <span>Instant</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Pulse effect */}
                                            <div className="absolute inset-0 rounded-2xl bg-white/5 animate-pulse" aria-hidden="true" />
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            <Eye className="w-4 h-4 mr-2" />
                                            Vezi Detalii
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            <MessageSquare className="w-4 h-4 mr-2" />
                                            Mesaje
                                        </Button>
                                    </div>
                                    <Dialog
                                        open={checkoutDialogOpen}
                                        onOpenChange={setCheckoutDialogOpen}
                                        aria-labelledby="payment-dialog-title"
                                        aria-describedby="payment-dialog-description"
                                    >
                                        <DialogContent className="max-w-lg mx-auto bg-white dark:bg-gray-900 rounded-3xl shadow-3xl border-0 p-0 overflow-hidden backdrop-blur-xl">
                                            {/* Premium Header with Gradient */}
                                            <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 p-8 text-white overflow-hidden">
                                                {/* Animated background pattern */}
                                                <div className="absolute inset-0 opacity-10" aria-hidden="true">
                                                    <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width=%2260%22%20height=%2260%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cdefs%3E%3Cpattern%20id=%22payment-grid%22%20width=%2260%22%20height=%2260%22%20patternUnits=%22userSpaceOnUse%22%3E%3Cpath%20d=%22M%2060%200L0%200%200%2060%22%20fill=%22none%22%20stroke=%22%23ffffff%22%20stroke-width=%221%22/%3E%3C/pattern%3E%3C/defs%3E%3Crect%20width=%22100%25%22%20height=%22100%25%22%20fill=%22url(%23payment-grid)%22/%3E%3C/svg%3E')] animate-pulse" />
                                                </div>

                                                <div className="flex items-center space-x-3 mb-4">
                                                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30 relative">
                                                        <Shield className="w-8 h-8 drop-shadow-sm" />
                                                        <div className="absolute inset-0 bg-white/10 rounded-2xl animate-pulse" aria-hidden="true" />
                                                    </div>
                                                    <div>
                                                        <DialogTitle id="payment-dialog-title" className="text-2xl font-black text-white drop-shadow-sm">
                                                            Securizează Plata
                                                        </DialogTitle>
                                                        <p id="payment-dialog-description" className="text-blue-100 text-base font-medium">
                                                            Protejează-ți investiția cu escrow
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="bg-white/15 rounded-2xl p-6 backdrop-blur-md border border-white/20 relative">
                                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl" aria-hidden="true" />
                                                    <div className="relative space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-blue-100">Proiect:</span>
                                                            <span className="font-bold text-white text-lg">{project.title}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-blue-100">Prestatori selectați:</span>
                                                            <span className="font-semibold text-white">{project.providers?.length || 0}</span>
                                                        </div>
                                                        <div className="border-t border-white/20 pt-3">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-blue-100 text-lg">Valoare totală:</span>
                                                                <span className="font-black text-white text-2xl drop-shadow-sm">
                                                                    {project.budget?.toLocaleString()} RON
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-8 space-y-8">
                                                {/* How Escrow Works */}
                                                <div className="text-center">
                                                    <h3 className="font-bold text-xl mb-6 text-gray-900 dark:text-gray-100">
                                                        🛡️ Cum funcționează Escrow?
                                                    </h3>
                                                    <div className="grid grid-cols-3 gap-6 text-sm">
                                                        <div className="text-center">
                                                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                                                                <span className="font-black text-white text-lg">1</span>
                                                            </div>
                                                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Blocare Securizată</h4>
                                                            <p className="text-muted-foreground text-xs">Banii sunt blocați în siguranță</p>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                                                                <span className="font-black text-white text-lg">2</span>
                                                            </div>
                                                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Execuție Proiect</h4>
                                                            <p className="text-muted-foreground text-xs">Prestatorii lucrează în siguranță</p>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                                                                <span className="font-black text-white text-lg">3</span>
                                                            </div>
                                                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Eliberare Automată</h4>
                                                            <p className="text-muted-foreground text-xs">Plata la finalizare</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Security Guarantee */}
                                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-2 border-green-200 dark:border-green-800 rounded-2xl p-6 relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 w-20 h-20 bg-green-200/30 rounded-full -translate-y-10 translate-x-10" aria-hidden="true" />
                                                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-emerald-200/30 rounded-full translate-y-8 -translate-x-8" aria-hidden="true" />
                                                    <div className="flex items-start space-x-3">
                                                        <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                                            <CheckCircle className="w-6 h-6 text-white" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="font-black text-green-900 dark:text-green-100 mb-2 text-lg">
                                                                🛡️ Protecție 100% Garantată
                                                            </div>
                                                            <p className="text-green-800 dark:text-green-200 font-medium">
                                                                Banii tăi sunt în siguranță până când proiectul este finalizat conform specificațiilor.
                                                                <strong>Garanție de rambursare 100%</strong> dacă nu ești mulțumit.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Payment Form */}
                                                <div className="space-y-6">
                                                    <label className="block text-base font-bold text-gray-900 dark:text-gray-100" htmlFor="card-element">
                                                        💳 Detalii Card de Plată
                                                    </label>
                                                    <div className="relative">
                                                        <div
                                                            id="card-element"
                                                            className="border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/20 transition-all duration-300 shadow-inner"
                                                            aria-label="Formular detalii card de plată"
                                                        />
                                                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none" aria-hidden="true" />
                                                    </div>

                                                    {/* Security badges */}
                                                    <div className="flex items-center justify-center space-x-6 py-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                                        <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                                                            <Shield className="w-4 h-4 text-green-600" />
                                                            <span className="font-semibold">256-bit SSL</span>
                                                        </div>
                                                        <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                                            <span className="font-semibold">PCI DSS</span>
                                                        </div>
                                                        <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
                                                            <Globe className="w-4 h-4 text-blue-600" />
                                                            <span className="font-semibold">Stripe Secure</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Error and Success Messages */}
                                                {errorMessage && (
                                                    <Alert variant="destructive" className="border-red-300 bg-red-50 dark:bg-red-950/20">
                                                        <AlertCircle className="h-5 w-5" />
                                                        <AlertDescription className="font-medium">{errorMessage}</AlertDescription>
                                                    </Alert>
                                                )}

                                                {success && (
                                                    <Alert className="border-green-300 bg-green-50 dark:bg-green-950/20">
                                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                                        <AlertDescription className="text-green-800 dark:text-green-200 font-medium">
                                                            ✅ Plata a fost autorizată cu succes! Prestatorii pot începe lucrul.
                                                        </AlertDescription>
                                                    </Alert>
                                                )}

                                                {/* Action Buttons */}
                                                <div className="flex space-x-4">
                                                    <Button
                                                        type="button"
                                                        onClick={() => handlePayment(project.id)}
                                                        disabled={loading}
                                                        className="flex-1 relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] group"
                                                        aria-label={`Securizează plata de ${project.budget?.toLocaleString()} RON`}
                                                    >
                                                        {/* Animated shine effect */}
                                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" aria-hidden="true" />

                                                        <div className="relative flex items-center justify-center space-x-3">
                                                            {loading ? (
                                                                <>
                                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                                    <span>Se procesează...</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Shield className="w-5 h-5" />
                                                                    <span>Securizează {project.budget?.toLocaleString()} RON</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => setCheckoutDialogOpen(false)}
                                                        className="px-8 py-4 border-2 border-gray-300 hover:border-gray-400 rounded-2xl font-semibold transition-all duration-200"
                                                        aria-label="Anulează procesul de plată"
                                                    >
                                                        Anulează
                                                    </Button>
                                                </div>

                                                {/* Trust Indicators */}
                                                <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                                                    <div className="text-center">
                                                        <p className="text-xs text-muted-foreground mb-3 font-medium">Securizat de:</p>
                                                        <div className="flex items-center justify-center space-x-8">
                                                            <div className="flex items-center space-x-2">
                                                                <Shield className="w-4 h-4 text-green-600" />
                                                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">SSL Securizat</span>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">PCI Compliant</span>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <Globe className="w-4 h-4 text-blue-600" />
                                                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Stripe Powered</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </CardContent>
                            </Card>


                        ))}
                    </div>
                )}
            </div>


            <Footer />
        </div>
    );
}
