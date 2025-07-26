"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Plus,
    X,
    Search,
    Star,
    MapPin,
    Clock,
    DollarSign,
    CheckCircle,
    AlertCircle,
    Loader2,
    FileText,
    Code,
    Zap,
    Target,
    Users,
    Award,
    MessageSquare,
    Heart,
    Eye,
    ArrowRight,
    Calendar,
    Briefcase
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useCategories } from '@/hooks/use-api';
import { apiClient } from '@/lib/api';

interface Technology {
    id: string;
    name: string;
    category: string;
}

interface SuggestedProvider {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    rating: number;
    reviewCount: number;
    completedProjects: number;
    responseTime: string;
    location: string;
    isVerified: boolean;
    skills: string[];
    basePrice: number;
    pricingType: string;
    deliveryTime: number;
    matchScore: number;
    matchReasons: string[];
    availability: string;
    lastActive: string;
}

export default function NewProjectPage() {
    const { user, loading } = useAuth();
    const [activeTab, setActiveTab] = useState('details');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        requirements: '',
        serviceId: '',
        technologies: [] as string[],
        budget: '',
        budgetType: 'FIXED', // FIXED, HOURLY, MILESTONE
        deadline: '',
        priority: 'MEDIUM', // LOW, MEDIUM, HIGH, URGENT
        attachments: [] as File[],
        additionalInfo: ''
    });

    const [availableTechnologies, setAvailableTechnologies] = useState<Technology[]>([]);
    const [suggestedProviders, setSuggestedProviders] = useState<SuggestedProvider[]>([]);
    const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
    const [loadingProviders, setLoadingProviders] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [newTechnology, setNewTechnology] = useState('');

    const router = useRouter();
    const { data: categoriesData } = useCategories();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/signin');
        }
        if (user && user.role !== 'CLIENT') {
            router.push('/dashboard');
        }
        loadTechnologies();
    }, [user, loading, router]);

    useEffect(() => {
        if (formData.serviceId && formData.technologies.length > 0) {
            loadSuggestedProviders();
        } else {
            setSuggestedProviders([]);
        }
    }, [formData.serviceId, formData.technologies]);

    const loadTechnologies = async () => {
        // Mock technologies - în realitate ar veni din API
        const technologies: Technology[] = [
            // Frontend
            { id: '1', name: 'React', category: 'Frontend' },
            { id: '2', name: 'Vue.js', category: 'Frontend' },
            { id: '3', name: 'Angular', category: 'Frontend' },
            { id: '4', name: 'Next.js', category: 'Frontend' },
            { id: '5', name: 'Nuxt.js', category: 'Frontend' },
            { id: '6', name: 'TypeScript', category: 'Frontend' },
            { id: '7', name: 'JavaScript', category: 'Frontend' },

            // Backend
            { id: '8', name: 'Node.js', category: 'Backend' },
            { id: '9', name: 'PHP', category: 'Backend' },
            { id: '10', name: 'Laravel', category: 'Backend' },
            { id: '11', name: 'Python', category: 'Backend' },
            { id: '12', name: 'Django', category: 'Backend' },
            { id: '13', name: 'Express.js', category: 'Backend' },

            // Mobile
            { id: '14', name: 'React Native', category: 'Mobile' },
            { id: '15', name: 'Flutter', category: 'Mobile' },
            { id: '16', name: 'Swift', category: 'Mobile' },
            { id: '17', name: 'Kotlin', category: 'Mobile' },

            // Database
            { id: '18', name: 'MySQL', category: 'Database' },
            { id: '19', name: 'PostgreSQL', category: 'Database' },
            { id: '20', name: 'MongoDB', category: 'Database' },
            { id: '21', name: 'Redis', category: 'Database' },

            // Design
            { id: '22', name: 'Figma', category: 'Design' },
            { id: '23', name: 'Adobe XD', category: 'Design' },
            { id: '24', name: 'Sketch', category: 'Design' },
            { id: '25', name: 'Photoshop', category: 'Design' },

            // CMS
            { id: '26', name: 'WordPress', category: 'CMS' },
            { id: '27', name: 'Shopify', category: 'CMS' },
            { id: '28', name: 'Drupal', category: 'CMS' },

            // Cloud
            { id: '29', name: 'AWS', category: 'Cloud' },
            { id: '30', name: 'Google Cloud', category: 'Cloud' },
            { id: '31', name: 'Azure', category: 'Cloud' },
            { id: '32', name: 'Docker', category: 'Cloud' }
        ];

        setAvailableTechnologies(technologies);
    };

    const loadSuggestedProviders = async () => {
        setLoadingProviders(true);
        try {
            // Mock API call - în realitate ar veni din backend
            const mockProviders: SuggestedProvider[] = [
                {
                    id: '1',
                    firstName: 'Alexandru',
                    lastName: 'Ionescu',
                    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150',
                    rating: 4.9,
                    reviewCount: 127,
                    completedProjects: 89,
                    responseTime: '2 ore',
                    location: 'București, România',
                    isVerified: true,
                    skills: ['React', 'Node.js', 'TypeScript', 'MongoDB'],
                    basePrice: 2500,
                    pricingType: 'FIXED',
                    deliveryTime: 14,
                    matchScore: 95,
                    matchReasons: ['Expert în React și Node.js', 'Experiență cu proiecte similare', 'Rating excelent'],
                    availability: 'Disponibil',
                    lastActive: 'Acum 2 ore'
                },
                {
                    id: '2',
                    firstName: 'Maria',
                    lastName: 'Popescu',
                    avatar: 'https://images.pexels.com/photos/3785077/pexels-photo-3785077.jpeg?auto=compress&cs=tinysrgb&w=150',
                    rating: 4.8,
                    reviewCount: 95,
                    completedProjects: 67,
                    responseTime: '1 oră',
                    location: 'Cluj-Napoca, România',
                    isVerified: true,
                    skills: ['React', 'Vue.js', 'TypeScript', 'PostgreSQL'],
                    basePrice: 2200,
                    pricingType: 'FIXED',
                    deliveryTime: 12,
                    matchScore: 92,
                    matchReasons: ['Specialist în frontend modern', 'Livrare rapidă', 'Comunicare excelentă'],
                    availability: 'Disponibil',
                    lastActive: 'Acum 1 oră'
                },
                {
                    id: '3',
                    firstName: 'Andrei',
                    lastName: 'Radu',
                    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150',
                    rating: 4.7,
                    reviewCount: 78,
                    completedProjects: 45,
                    responseTime: '3 ore',
                    location: 'Timișoara, România',
                    isVerified: true,
                    skills: ['React', 'Node.js', 'Express.js', 'MySQL'],
                    basePrice: 2000,
                    pricingType: 'FIXED',
                    deliveryTime: 16,
                    matchScore: 88,
                    matchReasons: ['Preț competitiv', 'Experiență solidă', 'Portofoliu impresionant'],
                    availability: 'Ocupat - disponibil în 1 săptămână',
                    lastActive: 'Acum 5 ore'
                },
                {
                    id: '4',
                    firstName: 'Diana',
                    lastName: 'Stoica',
                    avatar: 'https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=150',
                    rating: 4.6,
                    reviewCount: 52,
                    completedProjects: 34,
                    responseTime: '4 ore',
                    location: 'Iași, România',
                    isVerified: false,
                    skills: ['React', 'TypeScript', 'Node.js', 'MongoDB'],
                    basePrice: 1800,
                    pricingType: 'HOURLY',
                    deliveryTime: 18,
                    matchScore: 85,
                    matchReasons: ['Tarif atractiv', 'Tehnologii potrivite', 'Disponibilitate bună'],
                    availability: 'Disponibil',
                    lastActive: 'Acum 1 zi'
                }
            ];

            // Simulăm un delay pentru loading
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Filtrăm și sortăm prestatorii în funcție de tehnologiile selectate
            const filteredProviders = mockProviders
                .filter(provider =>
                    formData.technologies.some(tech =>
                        provider.skills.some(skill =>
                            skill.toLowerCase().includes(tech.toLowerCase())
                        )
                    )
                )
                .sort((a, b) => b.matchScore - a.matchScore)
                .slice(0, 5);

            setSuggestedProviders(filteredProviders);
        } catch (error: any) {
            setError('Nu s-au putut încărca prestatorii sugeriți');
        } finally {
            setLoadingProviders(false);
        }
    };

    const handleTechnologyToggle = (techName: string) => {
        setFormData(prev => ({
            ...prev,
            technologies: prev.technologies.includes(techName)
                ? prev.technologies.filter(t => t !== techName)
                : [...prev.technologies, techName]
        }));
    };

    const addCustomTechnology = () => {
        if (newTechnology.trim() && !formData.technologies.includes(newTechnology.trim())) {
            setFormData(prev => ({
                ...prev,
                technologies: [...prev.technologies, newTechnology.trim()]
            }));
            setNewTechnology('');
        }
    };

    const removeTechnology = (tech: string) => {
        setFormData(prev => ({
            ...prev,
            technologies: prev.technologies.filter(t => t !== tech)
        }));
    };

    const handleProviderSelect = (providerId: string) => {
        setSelectedProviders(prev =>
            prev.includes(providerId)
                ? prev.filter(id => id !== providerId)
                : [...prev, providerId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedProviders.length === 0) {
            setError('Selectează cel puțin un prestator pentru a trimite proiectul');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const projectData = {
                ...formData,
                selectedProviders,
                clientId: user?.id
            };

            // await apiClient.createProject(projectData);

            // Simulăm crearea proiectului
            await new Promise(resolve => setTimeout(resolve, 2000));

            router.push('/dashboard?tab=projects&success=project-created');
        } catch (error: any) {
            setError(error.message || 'A apărut o eroare la crearea proiectului');
        } finally {
            setSubmitting(false);
        }
    };

    const getBudgetTypeLabel = (type: string) => {
        switch (type) {
            case 'FIXED': return 'Preț Fix per Proiect';
            case 'HOURLY': return 'Tarif pe Oră';
            case 'MILESTONE': return 'Plată per Milestone';
            default: return type;
        }
    };

    const getPriorityBadge = (priority: string) => {
        const colors = {
            'LOW': 'bg-green-100 text-green-800',
            'MEDIUM': 'bg-blue-100 text-blue-800',
            'HIGH': 'bg-orange-100 text-orange-800',
            'URGENT': 'bg-red-100 text-red-800'
        };
        return colors[priority] || colors['MEDIUM'];
    };

    const getAvailabilityColor = (availability: string) => {
        if (availability.includes('Disponibil')) return 'text-green-600';
        if (availability.includes('Ocupat')) return 'text-orange-600';
        return 'text-gray-600';
    };

    const groupedTechnologies = availableTechnologies.reduce((acc, tech) => {
        if (!acc[tech.category]) {
            acc[tech.category] = [];
        }
        acc[tech.category].push(tech);
        return acc;
    }, {} as Record<string, Technology[]>);

    if (loading) {
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
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Adaugă Proiect Nou</h1>
                    <p className="text-muted-foreground">
                        Descrie proiectul tău și primește oferte de la cei mai buni prestatori
                    </p>
                </div>

                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="details">Detalii Proiect</TabsTrigger>
                            <TabsTrigger value="providers" disabled={!formData.serviceId || formData.technologies.length === 0}>
                                Prestatori Sugeriți
                            </TabsTrigger>
                            <TabsTrigger value="review" disabled={selectedProviders.length === 0}>
                                Revizuire & Trimitere
                            </TabsTrigger>
                        </TabsList>

                        {/* Detalii Proiect */}
                        <TabsContent value="details" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <FileText className="w-5 h-5" />
                                        <span>Informații Generale</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div>
                                        <Label htmlFor="title">Titlu Proiect *</Label>
                                        <Input
                                            id="title"
                                            value={formData.title}
                                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                            placeholder="ex: Website modern pentru afacerea mea"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="description">Descriere Detaliată *</Label>
                                        <Textarea
                                            id="description"
                                            value={formData.description}
                                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Descrie în detaliu ce vrei să realizezi, care sunt obiectivele și așteptările tale..."
                                            rows={5}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="requirements">Cerințe Specifice</Label>
                                        <Textarea
                                            id="requirements"
                                            value={formData.requirements}
                                            onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
                                            placeholder="Cerințe tehnice, funcționalități specifice, integrări necesare..."
                                            rows={3}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="serviceId">Categorie Serviciu *</Label>
                                            <Select value={formData.serviceId} onValueChange={(value) => setFormData(prev => ({ ...prev, serviceId: value }))}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selectează categoria" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {(categoriesData || []).map((category: any) => (
                                                        <SelectItem key={category.id} value={category.id}>
                                                            {category.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label htmlFor="priority">Prioritate</Label>
                                            <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="LOW">Scăzută</SelectItem>
                                                    <SelectItem value="MEDIUM">Medie</SelectItem>
                                                    <SelectItem value="HIGH">Înaltă</SelectItem>
                                                    <SelectItem value="URGENT">Urgentă</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Code className="w-5 h-5" />
                                        <span>Tehnologii și Skills</span>
                                    </CardTitle>
                                    <CardDescription>
                                        Selectează tehnologiile necesare pentru proiectul tău
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Tehnologii selectate */}
                                    {formData.technologies.length > 0 && (
                                        <div>
                                            <Label className="mb-3 block">Tehnologii Selectate ({formData.technologies.length})</Label>
                                            <div className="flex flex-wrap gap-2">
                                                {formData.technologies.map((tech) => (
                                                    <Badge key={tech} variant="default" className="flex items-center space-x-1">
                                                        <span>{tech}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeTechnology(tech)}
                                                            className="ml-1 hover:text-red-300"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Adaugă tehnologie personalizată */}
                                    <div>
                                        <Label>Adaugă Tehnologie Personalizată</Label>
                                        <div className="flex space-x-2 mt-2">
                                            <Input
                                                value={newTechnology}
                                                onChange={(e) => setNewTechnology(e.target.value)}
                                                placeholder="ex: GraphQL, Redis, etc."
                                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTechnology())}
                                            />
                                            <Button type="button" onClick={addCustomTechnology} variant="outline">
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Tehnologii disponibile grupate */}
                                    <div className="space-y-4">
                                        {Object.entries(groupedTechnologies).map(([category, techs]) => (
                                            <div key={category}>
                                                <Label className="text-sm font-semibold text-primary mb-2 block">
                                                    {category}
                                                </Label>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                    {techs.map((tech) => (
                                                        <div key={tech.id} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={tech.id}
                                                                checked={formData.technologies.includes(tech.name)}
                                                                onCheckedChange={() => handleTechnologyToggle(tech.name)}
                                                            />
                                                            <Label htmlFor={tech.id} className="text-sm cursor-pointer">
                                                                {tech.name}
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <DollarSign className="w-5 h-5" />
                                        <span>Buget și Timeline</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div>
                                        <Label className="mb-3 block">Tip Buget *</Label>
                                        <RadioGroup value={formData.budgetType} onValueChange={(value) => setFormData(prev => ({ ...prev, budgetType: value }))}>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="FIXED" id="fixed" />
                                                <Label htmlFor="fixed">Preț Fix per Proiect</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="HOURLY" id="hourly" />
                                                <Label htmlFor="hourly">Tarif pe Oră</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="MILESTONE" id="milestone" />
                                                <Label htmlFor="milestone">Plată per Milestone</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="budget">
                                                Buget {formData.budgetType === 'HOURLY' ? '(RON/oră)' : '(RON)'} *
                                            </Label>
                                            <Input
                                                id="budget"
                                                type="number"
                                                value={formData.budget}
                                                onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                                                placeholder={formData.budgetType === 'HOURLY' ? '50' : '2500'}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="deadline">Deadline Dorit</Label>
                                            <Input
                                                id="deadline"
                                                type="date"
                                                value={formData.deadline}
                                                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex justify-end">
                                <Button
                                    type="button"
                                    onClick={() => setActiveTab('providers')}
                                    disabled={!formData.serviceId || formData.technologies.length === 0}
                                    className="px-8"
                                >
                                    Continuă la Prestatori
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </TabsContent>

                        {/* Prestatori Sugeriți */}
                        <TabsContent value="providers" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Users className="w-5 h-5" />
                                        <span>Prestatori Sugeriți</span>
                                    </CardTitle>
                                    <CardDescription>
                                        Prestatori care se potrivesc cu cerințele proiectului tău
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {loadingProviders ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="text-center">
                                                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                                                <p className="text-muted-foreground">Căutăm cei mai potriviți prestatori...</p>
                                            </div>
                                        </div>
                                    ) : suggestedProviders.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                            <h3 className="text-lg font-medium mb-2">Nu am găsit prestatori</h3>
                                            <p className="text-muted-foreground">
                                                Încearcă să modifici serviciul sau tehnologiile selectate
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {suggestedProviders.map((provider) => (
                                                <Card
                                                    key={provider.id}
                                                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                                                        selectedProviders.includes(provider.id)
                                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 shadow-md'
                                                            : 'border-gray-200 hover:border-blue-300'
                                                    }`}
                                                    onClick={() => handleProviderSelect(provider.id)}
                                                >
                                                    <CardContent className="p-6">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-start space-x-4 flex-1">
                                                                <div className="relative">
                                                                    <Avatar className="w-16 h-16">
                                                                        <AvatarImage src={provider.avatar} />
                                                                        <AvatarFallback>
                                                                            {provider.firstName[0]}{provider.lastName[0]}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    {provider.isVerified && (
                                                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                                                            <CheckCircle className="w-4 h-4 text-white" />
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="flex-1">
                                                                    <div className="flex items-center space-x-2 mb-2">
                                                                        <h3 className="text-lg font-semibold">
                                                                            {provider.firstName} {provider.lastName}
                                                                        </h3>
                                                                        <Badge className="bg-green-100 text-green-800">
                                                                            {provider.matchScore}% potrivire
                                                                        </Badge>
                                                                        {provider.isVerified && (
                                                                            <Badge className="bg-blue-100 text-blue-800">
                                                                                Verificat
                                                                            </Badge>
                                                                        )}
                                                                    </div>

                                                                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                                                                        <div className="flex items-center space-x-1">
                                                                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                                            <span className="font-medium">{provider.rating}</span>
                                                                            <span>({provider.reviewCount} recenzii)</span>
                                                                        </div>
                                                                        <div className="flex items-center space-x-1">
                                                                            <MapPin className="w-4 h-4" />
                                                                            <span>{provider.location}</span>
                                                                        </div>
                                                                        <div className="flex items-center space-x-1">
                                                                            <Clock className="w-4 h-4" />
                                                                            <span>Răspuns în {provider.responseTime}</span>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex flex-wrap gap-1 mb-3">
                                                                        {provider.skills.slice(0, 4).map((skill) => (
                                                                            <Badge key={skill} variant="outline" className="text-xs">
                                                                                {skill}
                                                                            </Badge>
                                                                        ))}
                                                                        {provider.skills.length > 4 && (
                                                                            <Badge variant="outline" className="text-xs">
                                                                                +{provider.skills.length - 4}
                                                                            </Badge>
                                                                        )}
                                                                    </div>

                                                                    <div className="space-y-1">
                                                                        <div className="text-sm font-medium text-green-600">
                                                                            De ce este potrivit:
                                                                        </div>
                                                                        <ul className="text-sm text-muted-foreground space-y-1">
                                                                            {provider.matchReasons.map((reason, index) => (
                                                                                <li key={index} className="flex items-center space-x-2">
                                                                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                                                                    <span>{reason}</span>
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="text-right space-y-2">
                                                                <div className="text-2xl font-bold text-green-600">
                                                                    {provider.basePrice.toLocaleString()} RON
                                                                </div>
                                                                <div className="text-sm text-muted-foreground">
                                                                    {provider.pricingType === 'FIXED' ? 'Preț fix' : 'Negociabil'}
                                                                </div>
                                                                <div className="text-sm">
                                                                    <div className="flex items-center space-x-1">
                                                                        <Calendar className="w-3 h-3" />
                                                                        <span>{provider.deliveryTime} zile</span>
                                                                    </div>
                                                                </div>
                                                                <div className={`text-sm font-medium ${getAvailabilityColor(provider.availability)}`}>
                                                                    {provider.availability}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    Activ {provider.lastActive}
                                                                </div>

                                                                <div className="flex space-x-2 mt-4">
                                                                    <Button variant="outline" size="sm">
                                                                        <Eye className="w-3 h-3 mr-1" />
                                                                        Profil
                                                                    </Button>
                                                                    <Button variant="outline" size="sm">
                                                                        <MessageSquare className="w-3 h-3 mr-1" />
                                                                        Mesaj
                                                                    </Button>
                                                                </div>

                                                                <Checkbox
                                                                    checked={selectedProviders.includes(provider.id)}
                                                                    onCheckedChange={() => handleProviderSelect(provider.id)}
                                                                    className="mt-4"
                                                                />
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    )}

                                    {selectedProviders.length > 0 && (
                                        <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                                <span className="font-medium text-green-800 dark:text-green-200">
                          {selectedProviders.length} prestatori selectați
                        </span>
                                            </div>
                                            <p className="text-sm text-green-700 dark:text-green-300">
                                                Proiectul va fi trimis către prestatorii selectați și vei primi oferte în curând.
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <div className="flex justify-between">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setActiveTab('details')}
                                >
                                    Înapoi la Detalii
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => setActiveTab('review')}
                                    disabled={selectedProviders.length === 0}
                                    className="px-8"
                                >
                                    Revizuire Finală
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </TabsContent>

                        {/* Revizuire și Trimitere */}
                        <TabsContent value="review" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Target className="w-5 h-5" />
                                        <span>Revizuire Proiect</span>
                                    </CardTitle>
                                    <CardDescription>
                                        Verifică toate detaliile înainte de a trimite proiectul
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Rezumat proiect */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="font-semibold mb-2">Detalii Proiect</h4>
                                                <div className="space-y-2 text-sm">
                                                    <div><strong>Titlu:</strong> {formData.title}</div>
                                                    <div><strong>Categorie:</strong> {categoriesData?.find(c => c.id === formData.serviceId)?.name}</div>
                                                    <div><strong>Buget:</strong> {formData.budget} RON ({getBudgetTypeLabel(formData.budgetType)})</div>
                                                    {formData.deadline && (
                                                        <div><strong>Deadline:</strong> {new Date(formData.deadline).toLocaleDateString('ro-RO')}</div>
                                                    )}
                                                    <div>
                                                        <strong>Prioritate:</strong>
                                                        <Badge className={`ml-2 ${getPriorityBadge(formData.priority)}`}>
                                                            {formData.priority}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="font-semibold mb-2">Tehnologii ({formData.technologies.length})</h4>
                                                <div className="flex flex-wrap gap-1">
                                                    {formData.technologies.map((tech) => (
                                                        <Badge key={tech} variant="outline" className="text-xs">
                                                            {tech}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="font-semibold mb-2">Prestatori Selectați ({selectedProviders.length})</h4>
                                            <div className="space-y-2">
                                                {selectedProviders.map(providerId => {
                                                    const provider = suggestedProviders.find(p => p.id === providerId);
                                                    return provider ? (
                                                        <div key={providerId} className="flex items-center space-x-3 p-2 border rounded">
                                                            <Avatar className="w-8 h-8">
                                                                <AvatarImage src={provider.avatar} />
                                                                <AvatarFallback className="text-xs">
                                                                    {provider.firstName[0]}{provider.lastName[0]}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex-1">
                                                                <div className="font-medium text-sm">
                                                                    {provider.firstName} {provider.lastName}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {provider.basePrice.toLocaleString()} RON • {provider.matchScore}% potrivire
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : null;
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold mb-2">Descriere</h4>
                                        <div className="bg-muted p-4 rounded-lg text-sm">
                                            {formData.description}
                                        </div>
                                    </div>

                                    {formData.requirements && (
                                        <div>
                                            <h4 className="font-semibold mb-2">Cerințe Specifice</h4>
                                            <div className="bg-muted p-4 rounded-lg text-sm">
                                                {formData.requirements}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <div className="flex justify-between">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setActiveTab('providers')}
                                >
                                    Înapoi la Prestatori
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-8"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Se trimite...
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="w-4 h-4 mr-2" />
                                            Trimite Proiectul
                                        </>
                                    )}
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                </form>
            </div>

            <Footer />
        </div>
    );
}
