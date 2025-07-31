"use client";

import {Header} from "@/components/header";
import {
    Camera,
    Code,
    Database, FolderOpen,
    Globe,
    Headphones,
    Loader2, LucideIcon,
    Palette,
    Plus, Search,
    Shield,
    Smartphone,
    TrendingUp
} from "lucide-react";
import {useAuth} from "@/contexts/auth-context";
import {useRouter} from "next/navigation";
import {useEffect, useState} from "react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import { apiClient } from '@/lib/api';
import {useCategories} from "@/hooks/use-api";
import {Badge} from "@/components/ui/badge";
import {Checkbox} from "@/components/ui/checkbox";

export default function AddNewOrderPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [services, setServices] = useState<any[]>([]);
    const [error, setError] = useState('');
    const [loadingServices, setLoadingServices] = useState(false);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const { data: categoriesData, loading: categoriesLoading } = useCategories();

    const [formData, setFormData] = useState({
        projectName: '',
        projectDescription: '',
        projectDeadline: '',
        projectAmount: '',
    })

    useEffect(() => {
        if (selectedCategory) {
            loadServicesForCategory(selectedCategory);
        } else {
            setServices([]);
        }
    }, [selectedCategory]);

    const loadServicesForCategory = async (categoryId: string) => {
        setLoadingServices(true);
        setError('');
        try {
            // Folosim endpoint-ul specific pentru prestatori
            const response = await apiClient.getAvailableServicesForProvider(categoryId);

            setServices(response.services || []);

            if (!response.services || response.services.length === 0) {
                setError('Nu există servicii în această categorie. Administratorii vor adăuga servicii în curând.');
            }
        } catch (error: any) {
            console.error('Error loading services:', error);
            setError('Nu s-au putut încărca serviciile pentru această categorie: ' + error.message);
            setServices([]);
        } finally {
            setLoadingServices(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleServiceToggle = (serviceId: string) => {
        setSelectedServices(prev =>
            prev.includes(serviceId)
                ? prev.filter(id => id !== serviceId)
                : [...prev, serviceId]
        );
    };

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/signin');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                    <p>Se încarcă...</p>
                </div>
            </div>
        );
    }

    type ServiceSlug =
        | 'web-development'
        | 'mobile-development'
        | 'ui-ux-design'
        | 'digital-marketing'
        | 'database-admin'
        | 'cybersecurity'
        | 'seo-optimization'
        | 'content-creation'
        | 'voice-over';

    const serviceIcons: Record<ServiceSlug, LucideIcon> = {
        'web-development': Code,
        'mobile-development': Smartphone,
        'ui-ux-design': Palette,
        'digital-marketing': TrendingUp,
        'database-admin': Database,
        'cybersecurity': Shield,
        'seo-optimization': Globe,
        'content-creation': Camera,
        'voice-over': Headphones
    };

    if (!user) {
        return null; // Will redirect to login
    }

    const isClient = user.role === 'CLIENT';

    if (!isClient) {
        router.push('/dashboard');
    }

    const categories = categoriesData || [];

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <div className="container mx-auto px-4 py-8 gap-4">
                {/* Welcome Section */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">
                                Bun venit, {user.firstName}!
                            </h1>

                        </div>

                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Plus className="w-5 h-5" />
                            <span>Adauga proiect nou</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-5">
                            <div>
                                <Label htmlFor="projectName" className="text-sm font-medium mb-2 block">
                                    Denumire Proiect
                                </Label>

                                <Input
                                    id="projectName"
                                    value={formData.projectName}
                                    onChange={handleChange}
                                    placeholder="Scrie numele proiectului..."
                                />
                            </div>

                            <div>
                                <Label htmlFor="projectDescription" className="text-sm font-medium mb-2 block">
                                    Scrie codul tău:
                                </Label>
                                <Textarea
                                    id="projectDescription"
                                    value={formData.projectDescription}
                                    onChange={handleChange}
                                    placeholder="Scrie descrierea proiectului..."
                                    rows={10}
                                    className="font-mono text-sm"
                                />
                            </div>

                            <div>
                                <Label htmlFor="projectDeadline" className="text-sm font-medium mb-2 block">
                                    Data Limită
                                </Label>
                                <Select value={formData.projectDeadline} onValueChange={(value) => setFormData({...formData, projectDeadline: value})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecteaza deadline" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="oneDay">1 zi</SelectItem>
                                        <SelectItem value="oneWeek">1 saptamana</SelectItem>
                                        <SelectItem value="oneMonth">1 luna</SelectItem>

                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="projectAmount" className="text-sm font-medium mb-2 block">
                                    Buget proiect
                                </Label>

                                <Input
                                    id="projectAmount"
                                    value={formData.projectAmount}
                                    onChange={handleChange}
                                    placeholder="Scrie bugetul pentru proiect..."
                                />
                            </div>

                            <div>
                                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                    {/* Categories Sidebar */}
                                    <div className="lg:col-span-1">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center space-x-2">
                                                    <FolderOpen className="w-5 h-5" />
                                                    <span>Categorii</span>
                                                </CardTitle>
                                                <CardDescription>
                                                    Selectează o categorie pentru a vedea serviciile
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-0">
                                                <div className="space-y-1">
                                                    {categories.map((category: any) => {
                                                        const IconComponent = serviceIcons[category.slug as ServiceSlug] || Code;
                                                        const isSelected = selectedCategory === category.id;

                                                        return (
                                                            <button
                                                                key={category.id}
                                                                onClick={() => setSelectedCategory(category.id)}
                                                                className={`w-full text-left p-3 rounded-lg transition-colors ${
                                                                    isSelected
                                                                        ? 'bg-blue-100 text-blue-900 border-blue-200'
                                                                        : 'hover:bg-muted'
                                                                }`}
                                                            >
                                                                <div className="flex items-center space-x-3">
                                                                    <IconComponent className="w-5 h-5" />
                                                                    <div>
                                                                        <div className="font-medium">{category.name}</div>
                                                                        {category.description && (
                                                                            <div className="text-xs text-muted-foreground">
                                                                                {category.description.substring(0, 50)}...
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Services Grid */}
                                    <div className="lg:col-span-3">
                                        {!selectedCategory ? (
                                            <Card className="h-96 flex items-center justify-center">
                                                <CardContent className="text-center">
                                                    <FolderOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                                                    <h3 className="text-lg font-medium mb-2">Selectează o categorie</h3>
                                                    <p className="text-muted-foreground">
                                                        Alege o categorie din stânga pentru a vedea serviciile disponibile
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        ) : loadingServices ? (
                                            <Card className="h-96 flex items-center justify-center">
                                                <CardContent className="text-center">
                                                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                                                    <p className="text-muted-foreground">Se încarcă serviciile...</p>
                                                </CardContent>
                                            </Card>
                                        ) : services.length === 0 ? (
                                            <Card className="h-96 flex items-center justify-center">
                                                <CardContent className="text-center">
                                                    <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                                                    <h3 className="text-lg font-medium mb-2">Nu există servicii în această categorie</h3>
                                                    <p className="text-muted-foreground mb-4">
                                                        Administratorii vor adăuga servicii în această categorie în curând
                                                    </p>
                                                    <Button variant="outline" onClick={() => setSelectedCategory('')}>
                                                        Alege altă categorie
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-lg font-semibold">
                                                        Servicii disponibile ({services.length})
                                                    </h3>
                                                    <Badge variant="outline">
                                                        {selectedServices.length} selectate
                                                    </Badge>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {services.map((service: any) => {
                                                        const IconComponent = serviceIcons[service.category?.slug as ServiceSlug] || Code;
                                                        const isSelected = selectedServices.includes(service.id);

                                                        return (
                                                            <Card
                                                                key={service.id}
                                                                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                                                                    isSelected
                                                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 shadow-md'
                                                                        : 'border-gray-200 hover:border-blue-300'
                                                                }`}
                                                                onClick={() => handleServiceToggle(service.id)}
                                                            >
                                                                <CardHeader>
                                                                    <div className="flex items-start justify-between">
                                                                        <div className="flex items-center space-x-3">
                                                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                                                                isSelected
                                                                                    ? 'bg-blue-500 text-white'
                                                                                    : 'bg-gray-100 text-gray-600'
                                                                            }`}>
                                                                                <IconComponent className="w-6 h-6" />
                                                                            </div>
                                                                            <div className="flex-1">
                                                                                <CardTitle className="text-lg">{service.title}</CardTitle>
                                                                                <Badge variant="outline" className="mt-1">
                                                                                    {service.category?.name}
                                                                                </Badge>
                                                                            </div>
                                                                        </div>
                                                                        <Checkbox
                                                                            checked={isSelected}
                                                                            onChange={() => handleServiceToggle(service.id)}
                                                                            className="mt-1"
                                                                        />
                                                                    </div>
                                                                </CardHeader>
                                                                <CardContent>
                                                                    <CardDescription className="text-sm mb-4">
                                                                        {service.description}
                                                                    </CardDescription>

                                                                    {service.skills && service.skills.length > 0 && (
                                                                        <div className="flex flex-wrap gap-1 mb-3">
                                                                            {service.skills.slice(0, 3).map((skill: string) => (
                                                                                <Badge key={skill} variant="outline" className="text-xs">
                                                                                    {skill}
                                                                                </Badge>
                                                                            ))}
                                                                            {service.skills.length > 3 && (
                                                                                <Badge variant="outline" className="text-xs">
                                                                                    +{service.skills.length - 3}
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                                        <span>{service.providers?.length || 0} prestatori activi</span>
                                                                        <span className="text-green-600 font-medium">
                              {service.providers?.length === 0 ? 'Fii primul!' : 'Alătură-te!'}
                            </span>
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <Button size="sm" onClick={() => alert('WIP')}>
                                <Plus className="w-4 h-4 mr-2" />
                                Adauga proiectul
                            </Button>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
};
