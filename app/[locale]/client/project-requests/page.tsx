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
    XCircle
} from 'lucide-react';
import {Dialog, DialogContent} from '@/components/ui/dialog';
import {useAuth} from '@/contexts/auth-context';
import {apiClient} from '@/lib/api';
import {toast} from 'sonner';
import {formatDistanceToNow} from 'date-fns';
import {ro} from 'date-fns/locale';
import {loadStripe} from "@stripe/stripe-js";
import {DialogTitle} from "@mui/material";
import {MuiIcon} from "@/components/MuiIcons";

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
        if (user && user?.roles?.some((r: any) => r.slug?.toLowerCase() === 'client')) {
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

    if (!user || user?.roles?.some((r: any) => r.slug?.toLowerCase() === 'client')) {
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
                                        {Array.from(
                                            new Map(
                                                project.existing_services.map((s:any) => [s.category.id, s.category])
                                            ).values()
                                        ).map((category: any) => (
                                            <Badge key={category.id} className="bg-blue-100 text-blue-800 inline-flex whitespace-nowrap me-1">
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
                                        <div className="flex-1">
                                            <Button
                                                onClick={() => getClientSecret(project.id)}
                                                className="w-full bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 text-white font-bold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 relative overflow-hidden group"
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
                                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-400/20 to-teal-400/20 animate-pulse" />
                                            </Button>
                                        </div>
                                        <Button variant="outline" size="sm">
                                            <Eye className="w-4 h-4 mr-2" />
                                            Vezi Detalii
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            <MessageSquare className="w-4 h-4 mr-2" />
                                            Mesaje
                                        </Button>
                                    </div>
                                    <Dialog open={checkoutDialogOpen} onOpenChange={setCheckoutDialogOpen}>
                                        <DialogContent className="max-w-md mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border-0 p-0 overflow-hidden">
                                            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-6 text-white">
                                                <div className="flex items-center space-x-3 mb-4">
                                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                                        <Shield className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <DialogTitle className="text-xl font-bold text-white">
                                                            Securizează Plata
                                                        </DialogTitle>
                                                        <p className="text-blue-100 text-sm">
                                                            Protejează-ți investiția cu escrow
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-blue-100">Proiect:</span>
                                                        <span className="font-semibold">{project.title}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm mt-2">
                                                        <span className="text-blue-100">Valoare totală:</span>
                                                        <span className="font-bold text-lg">{project.budget?.toLocaleString()} RON</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-6 space-y-6">
                                                <div className="text-center">
                                                    <h3 className="font-semibold text-lg mb-2">Cum funcționează Escrow?</h3>
                                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                                        <div className="text-center">
                                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                                                <span className="font-bold text-blue-600">1</span>
                                                            </div>
                                                            <p className="text-muted-foreground">Banii sunt blocați securizat</p>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                                                <span className="font-bold text-purple-600">2</span>
                                                            </div>
                                                            <p className="text-muted-foreground">Prestatorii lucrează la proiect</p>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                                                <span className="font-bold text-green-600">3</span>
                                                            </div>
                                                            <p className="text-muted-foreground">Banii sunt eliberați la finalizare</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                                    <div className="flex items-start space-x-3">
                                                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                                                        <div className="text-sm">
                                                            <div className="font-semibold text-green-900 dark:text-green-100 mb-1">
                                                                Protecție 100% Garantată
                                                            </div>
                                                            <p className="text-green-700 dark:text-green-300">
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
                                                        className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all"
                                                    />
                                                </div>

                                                {errorMessage && (
                                                    <Alert variant="destructive">
                                                        <AlertCircle className="h-4 w-4" />
                                                        <AlertDescription>{errorMessage}</AlertDescription>
                                                    </Alert>
                                                )}

                                                {success && (
                                                    <Alert className="border-green-200 bg-green-50">
                                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                                        <AlertDescription className="text-green-800">
                                                            Plata a fost autorizată cu succes! Prestatorii pot începe lucrul.
                                                        </AlertDescription>
                                                    </Alert>
                                                )}

                                                <div className="flex space-x-3">
                                                    <Button
                                                        type="button"
                                                        onClick={() => handlePayment(project.id)}
                                                        disabled={loading}
                                                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
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


                        ))}
                    </div>
                )}
            </div>


            <Footer />
        </div>
    );
}
