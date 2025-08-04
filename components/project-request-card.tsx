"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Calendar,
    DollarSign,
    Clock,
    User,
    CheckCircle,
    XCircle,
    Edit,
    Send,
    AlertCircle,
    Target,
    Code,
    MapPin,
    Star, Users, Eye, MessageSquare
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ro } from 'date-fns/locale';
import {useAuth} from "@/contexts/auth-context";
import Link from 'next/link';

interface ProjectRequestCardProps {
    project: any;
    onResponse: (projectId: string, response: 'ACCEPTED' | 'REJECTED', proposedBudget?: number) => void;
}

export function ProjectRequestCard({ project, onResponse }: ProjectRequestCardProps) {
    const [showBudgetProposal, setShowBudgetProposal] = useState(false);
    const [proposedBudget, setProposedBudget] = useState(project.allocatedBudget || 0);
    const [responding, setResponding] = useState(false);
    const { user, loading } = useAuth();

    const handleAccept = async () => {
        setResponding(true);
        try {
            onResponse(project.id, 'ACCEPTED');
        } finally {
            setResponding(false);
        }
    };

    const handleReject = async () => {
        setResponding(true);
        try {
            await onResponse(project.id, 'REJECTED');
        } finally {
            setResponding(false);
        }
    };

    const handleProposeBudget = async () => {
        if (proposedBudget <= 0) return;

        setResponding(true);
        try {
            await onResponse(project.id, 'ACCEPTED', proposedBudget);
            setShowBudgetProposal(false);
        } finally {
            setResponding(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const isProvider = user?.role === 'PROVIDER';

        if (isProvider) {
            // Provider statuses
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
        } else {
            // Client statuses
            switch (status) {
                case 'PENDING_RESPONSES':
                    return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Așteaptă răspunsuri</Badge>;
                case 'IN_PROGRESS':
                    return <Badge className="bg-blue-100 text-blue-800"><Target className="w-3 h-3 mr-1" />În progres</Badge>;
                case 'COMPLETED':
                    return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Finalizat</Badge>;
                case 'CANCELLED':
                    return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Anulat</Badge>;
                default:
                    return <Badge variant="secondary">{status}</Badge>;
            }
        }
    };

    const getBudgetTypeBadge = (type: string) => {
        switch (type) {
            case 'FIXED':
                return <Badge variant="outline">Preț Fix</Badge>;
            case 'PER_HOUR':
                return <Badge variant="outline">Pe Oră</Badge>;
            case 'MILESTONE':
                return <Badge variant="outline">Per Milestone</Badge>;
            default:
                return <Badge variant="outline">{type}</Badge>;
        }
    };

    const formatDeadline = (value: string): string => {
        const map: Record<string, string> = {
            '1day': '1 zi',
            '1week': 'O săptămână',
            '2weeks': '2 săptămâni',
            '3weeks': '3 săptămâni',
            '1month': '1 lună',
            '3months': '3 luni',
            '6months': '6 luni',
            '1year': '1 an',
            '1plusyear': '1+ ani',
        };

        return map[value] || value;
    };

    const selectedProvider = project.selected_providers.find(
        (provider: any) => provider.id === user?.id
    );

    const isProvider = user?.role === 'PROVIDER';
    const isClient = user?.role === 'CLIENT';

    return (
        <Card className={`border-2 hover:shadow-lg transition-all duration-300 ${
            project.featured ? 'border-yellow-200 bg-yellow-50/30' : ''
        }`}>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-xl font-semibold">{project.title}</h3>
                            {project.featured && (
                                <Badge className="bg-yellow-100 text-yellow-800">
                                    ⭐ Urgent
                                </Badge>
                            )}
                            {getStatusBadge(project.status)}
                        </div>

                        <p className="text-muted-foreground mb-4 leading-relaxed line-clamp-2">
                            {project.description}
                        </p>

                        {/* Technologies */}
                        {project.technologies && project.technologies.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-4">
                                {project.technologies.slice(0, 5).map((tech: string) => (
                                    <Badge key={tech} variant="outline" className="text-xs">
                                        <Code className="w-3 h-3 mr-1" />
                                        {tech}
                                    </Badge>
                                ))}
                                {project.technologies.length > 5 && (
                                    <Badge variant="outline" className="text-xs">
                                        +{project.technologies.length - 5}
                                    </Badge>
                                )}
                            </div>
                        )}

                        <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                                <DollarSign className="w-4 h-4" />
                                <span className="font-semibold text-green-600 text-base">
                                    {isProvider
                                        ? `${project.allocatedBudget?.toLocaleString() || 0} RON`
                                        : `${project.budget?.toLocaleString() || 0} RON`
                                    }
                                </span>
                                {isProvider && project.totalBudget && (
                                    <span className="text-xs">
                                        (din {project.totalBudget.toLocaleString()} RON total)
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>
                                    {project.deadline
                                        ? `Deadline: ${new Date(project.deadline).toLocaleDateString('ro-RO')}`
                                        : 'Fără deadline fix'
                                    }
                                </span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>
                                    {formatDistanceToNow(new Date(project.created_at), {
                                        addSuffix: true,
                                        locale: ro
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Client Info for Providers */}
                    {isProvider && project.client && (
                        <div className="text-right space-y-2">
                            <div className="flex items-center space-x-3">
                                <Avatar className="w-10 h-10">
                                    <AvatarImage src={project.client.avatar} />
                                    <AvatarFallback>
                                        {project.client.firstName?.[0]}{project.client.lastName?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-medium text-sm">{project.client.firstName} {project.client.lastName}</div>
                                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                        <span>{project.client.rating || 0}</span>
                                        <span>•</span>
                                        <MapPin className="w-3 h-3" />
                                        <span>{project.client.location || 'România'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Provider Count for Clients */}
                    {isClient && (
                        <div className="text-right">
                            <div className="text-sm text-muted-foreground">
                                {project.selectedProviders?.length || 0} prestatori selectați
                            </div>
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent>
                {/* Budget Proposal Section for Providers */}
                {isProvider && showBudgetProposal && (
                    <Alert className="mb-4 border-blue-200 bg-blue-50">
                        <Edit className="h-4 w-4" />
                        <AlertDescription>
                            <div className="space-y-3">
                                <div>
                                    <Label htmlFor="proposedBudget" className="text-sm font-medium">
                                        Propune un buget nou:
                                    </Label>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <Input
                                            id="proposedBudget"
                                            type="number"
                                            value={proposedBudget}
                                            onChange={(e) => setProposedBudget(parseInt(e.target.value) || 0)}
                                            className="w-32"
                                            min="1"
                                        />
                                        <span className="text-sm">RON</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Buget alocat: {project.allocatedBudget?.toLocaleString()} RON
                                    </p>
                                </div>
                                <div className="flex space-x-2">
                                    <Button
                                        size="sm"
                                        onClick={handleProposeBudget}
                                        disabled={responding || proposedBudget <= 0}
                                    >
                                        <Send className="w-4 h-4 mr-1" />
                                        Trimite Propunerea
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setShowBudgetProposal(false)}
                                    >
                                        Anulează
                                    </Button>
                                </div>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Provider Actions */}
                {isProvider && project.status === 'PENDING' && (
                    <div className="flex space-x-3">
                        <Button
                            onClick={handleAccept}
                            disabled={responding}
                            className="flex-1"
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Acceptă Proiectul
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setShowBudgetProposal(true)}
                            disabled={responding}
                        >
                            <Edit className="w-4 h-4 mr-2" />
                            Propune Buget
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={responding}
                        >
                            <XCircle className="w-4 h-4 mr-2" />
                            Respinge
                        </Button>
                    </div>
                )}

                {/* Client Actions */}
                {isClient && (
                    <div className="flex space-x-3">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/projects/${project.id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                Vezi Detalii
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Mesaje
                        </Button>
                        {project.status === 'PENDING_RESPONSES' && (
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/client/project-requests`}>
                                    <Users className="w-4 h-4 mr-2" />
                                    Vezi Răspunsuri
                                </Link>
                            </Button>
                        )}
                    </div>
                )}

                {/* Status Messages */}
                {isProvider && project.status === 'BUDGET_PROPOSED' && (
                    <Alert className="mt-4 border-blue-200 bg-blue-50">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Ai propus un buget de {project.proposedBudget?.toLocaleString()} RON.
                            Aștepți răspunsul clientului.
                        </AlertDescription>
                    </Alert>
                )}

                {isProvider && project.status === 'ACCEPTED' && (
                    <Alert className="mt-4 border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                            Ai acceptat acest proiect! Clientul a fost notificat.
                        </AlertDescription>
                    </Alert>
                )}

                {isProvider && project.status === 'REJECTED' && (
                    <Alert className="mt-4 border-red-200 bg-red-50">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>
                            Ai respins acest proiect.
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}
