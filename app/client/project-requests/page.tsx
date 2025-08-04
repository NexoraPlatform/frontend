"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    CheckCircle,
    XCircle,
    Clock,
    DollarSign,
    User,
    Calendar,
    Target,
    Loader2,
    AlertCircle,
    Star,
    MapPin,
    Code,
    Eye,
    MessageSquare
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ro } from 'date-fns/locale';

export default function ClientProjectRequestsPage() {
    const { user, loading } = useAuth();
    const [projects, setProjects] = useState<any[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [responding, setResponding] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/signin');
        }
        if (user && user.role !== 'CLIENT') {
            router.push('/dashboard');
        }
        if (user) {
            loadProjects();
        }
    }, [user, loading, router]);

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

    const handleBudgetResponse = async (
        projectId: string,
        providerId: string,
        response: 'APPROVED' | 'REJECTED'
    ) => {
        setResponding(`${projectId}-${providerId}`);
        try {
            await apiClient.respondToBudgetProposal(projectId, providerId, { response });
            await loadProjects();
            toast.success(response === 'APPROVED' ? 'Buget aprobat!' : 'Buget respins');
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
            case 'BUDGET_PROPOSED':
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
                                    {project.technologies && project.technologies.length > 0 && (
                                        <div className="mb-4">
                                            <div className="text-sm font-medium mb-2">Tehnologii:</div>
                                            <div className="flex flex-wrap gap-1">
                                                {project.technologies.map((tech: string) => (
                                                    <Badge key={tech} variant="outline" className="text-xs">
                                                        <Code className="w-3 h-3 mr-1" />
                                                        {tech}
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
                                                    {provider.status === 'BUDGET_PROPOSED' && (
                                                        <Alert className="mt-3 border-blue-200 bg-blue-50">
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
                                                                            onClick={() => handleBudgetResponse(project.id, provider.id, 'APPROVED')}
                                                                            disabled={responding === `${project.id}-${provider.id}`}
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
                                        <Button variant="outline" size="sm">
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
                        ))}
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}
