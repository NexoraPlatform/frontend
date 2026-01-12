"use client";

import {useEffect, useRef, useState} from 'react';
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
    AlertCircle,
    MapPin,
    Star,
    Eye,
    MessageSquare,
    Shield,
    Loader2,
    Globe
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ro } from 'date-fns/locale';
import {useAuth} from "@/contexts/auth-context";
import apiClient from "@/lib/api";
import {MuiIcon} from "@/components/MuiIcons";
import {Dialog, DialogContent} from "@/components/ui/dialog";
import {DialogTitle} from "@mui/material";
import {usePathname, useRouter} from "next/navigation";
import {toast} from "sonner";
import {loadStripe} from "@stripe/stripe-js";
import {Locale} from "@/types/locale";
import { formatDeadline } from '@/lib/projects';

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
    const pathname = usePathname();
    const locale = (pathname.split('/')[1] as Locale) || 'ro';

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

    return (
        <Card key={project.id} className="border-2">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-xl mb-2">
                            {project.title[locale]}
                            <span className="ms-2">{getStatusBadge(project.status)}</span>
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                            {project.description[locale]}
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

                                {/* Budget Proposal */}
                                {provider.status === 'NEW_PROPOSE' && (
                                    <Alert className={`mt-3 border-emerald-200 bg-emerald-50/70`}>
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
                                                        disabled={responding === `${project.id}-${provider.id}` || provider.pivotClientResponse === 'ACCEPTED'}
                                                    >
                                                        <CheckCircle className="w-4 h-4 mr-1" />
                                                        Aprobă
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
                            </div>
                        ))}
                    </div>
                </div>

                {/* Project Actions */}
                <div className="flex space-x-3 mt-6 pt-4 border-t">
                    <div className="flex-1">
                        <Button
                            onClick={() => getClientSecret(project.id)}
                            className="w-full bg-gradient-to-r from-[#1BC47D] via-[#21D19F] to-[#0B1C2D] hover:from-[#17b672] hover:via-[#1bbd8c] hover:to-[#0a1726] text-[#071A12] font-bold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 relative overflow-hidden group"
                            size="lg"
                        >
                            {/* Animated background */}
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                            <div className="relative flex items-center justify-center space-x-3">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-lg leading-tight">Securizează Plata</div>
                                    <div className="text-sm opacity-90 leading-tight">Protejează-ți investiția cu Escrow</div>
                                </div>
                            </div>

                            {/* Pulse effect */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400/20 to-emerald-200/20 animate-pulse" />
                        </Button>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => router.push(`/projects/${project.slug}`)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Vezi Detalii
                    </Button>
                    <Button variant="outline" size="sm">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Mesaje
                    </Button>
                </div>
                <Dialog open={checkoutDialogOpen} onOpenChange={setCheckoutDialogOpen}>
                    <DialogContent className="max-w-md mx-auto bg-white dark:bg-[#0B1220] rounded-2xl shadow-2xl border-0 p-0 overflow-hidden">
                        <div className="bg-gradient-to-r from-[#1BC47D] via-[#21D19F] to-[#0B1C2D] p-6 text-[#071A12]">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-bold text-[#071A12]">
                                        Securizează Plata
                                    </DialogTitle>
                                    <p className="text-emerald-900/70 text-sm">
                                        Protejează-ți investiția cu escrow
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-emerald-900/70">Proiect:</span>
                                    <span className="font-semibold">{project.title[locale]}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm mt-2">
                                    <span className="text-emerald-900/70">Valoare totală:</span>
                                    <span className="font-bold text-lg">{project.budget?.toLocaleString()} RON</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="text-center">
                                <h3 className="font-semibold text-lg mb-2">Cum funcționează Escrow?</h3>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div className="text-center">
                                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <span className="font-bold text-emerald-700">1</span>
                                        </div>
                                        <p className="text-muted-foreground">Banii sunt blocați securizat</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <span className="font-bold text-emerald-700">2</span>
                                        </div>
                                        <p className="text-muted-foreground">Prestatorii lucrează la proiect</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                            <span className="font-bold text-emerald-700">3</span>
                                        </div>
                                        <p className="text-muted-foreground">Banii sunt eliberați la finalizare</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-emerald-50/70 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-lg p-4">
                                <div className="flex items-start space-x-3">
                                    <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
                                    <div className="text-sm">
                                        <div className="font-semibold text-emerald-900 dark:text-emerald-100 mb-1">
                                            Protecție 100% Garantată
                                        </div>
                                        <p className="text-emerald-700 dark:text-emerald-200">
                                            Banii tăi sunt în siguranță până când proiectul este finalizat conform specificațiilor.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Detalii Card de Plată
                                </label>
                                <div
                                    id="card-element"
                                    className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all"
                                />
                            </div>

                            {errorMessage && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{errorMessage}</AlertDescription>
                                </Alert>
                            )}

                            {success && (
                                <Alert className="border-emerald-200 bg-emerald-50/70">
                                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                                    <AlertDescription className="text-emerald-800">
                                        Plata a fost autorizată cu succes! Prestatorii pot începe lucrul.
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="flex space-x-3">
                                <Button
                                    type="button"
                                    onClick={() => handlePayment(project.id)}
                                    disabled={loading}
                                    className="flex-1 bg-gradient-to-r from-[#1BC47D] to-[#21D19F] hover:from-[#17b672] hover:to-[#1bbd8c] text-[#071A12] font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Se procesează...
                                        </>
                                    ) : (
                                        <>
                                            <Shield className="w-4 h-4 mr-2" />
                                            Securizează {project.budget?.toLocaleString()} RON
                                        </>
                                    )}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setCheckoutDialogOpen(false)}
                                    className="px-6"
                                >
                                    Anulează
                                </Button>
                            </div>

                            <div className="text-xs text-center text-muted-foreground pt-4 border-t">
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

                        <div id="card-element" className="border p-2 rounded-md" />

                        {errorMessage && <div className="text-red-500 text-sm">{errorMessage}</div>}
                        {success && <div className="text-green-500 text-sm">Plata a fost autorizată!</div>}

                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
