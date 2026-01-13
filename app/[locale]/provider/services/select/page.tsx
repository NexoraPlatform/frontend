"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { TrustoraThemeStyles } from '@/components/trustora/theme-styles';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import type { LucideIcon } from 'lucide-react';
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle,
    AlertCircle,
    Loader2,
    Code,
    Smartphone,
    Palette,
    TrendingUp,
    Database,
    Shield,
    Globe,
    Camera,
    Headphones,
    Target,
    FolderOpen,
    Search,
    ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useCategories } from '@/hooks/use-api';
import { apiClient } from '@/lib/api';

export default function SelectServicesPage() {
    const { user, loading } = useAuth();

    // State for Category Navigation
    const [parentCategory, setParentCategory] = useState<any | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    const [services, setServices] = useState<any[]>([]);
    // Changed from array (multiple) to string (single)
    const [selectedService, setSelectedService] = useState<string>('');
    const [loadingServices, setLoadingServices] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const { data: categoriesData, loading: categoriesLoading } = useCategories();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/signin');
        }
        if (user && user?.roles?.some((r: any) => r.slug?.toLowerCase() !== 'provider')) {
            router.push('/dashboard');
        }
    }, [user, loading, router]);

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

    const handleCategoryClick = (category: any) => {
        // Check if category has children
        if (category.children && category.children.length > 0) {
            // It's a parent category -> Drill down
            setParentCategory(category);
            setSelectedCategory(''); // Reset selected leaf category
            setSelectedService(''); // Reset selected service
            setServices([]); // Clear services
            setError('');
        } else {
            // It's a leaf category (no children) -> Select and fetch services
            setSelectedCategory(category.id);
            setSelectedService(''); // Reset selected service when changing category
        }
    };

    const handleBackToParents = () => {
        setParentCategory(null);
        setSelectedCategory('');
        setSelectedService('');
        setServices([]);
        setError('');
    };

    // Modified to handle single selection
    const handleServiceSelect = (serviceId: string) => {
        // If clicked again, deselect (optional) or just keep selected.
        // Here we toggle it off if clicked again, otherwise replace selection.
        setSelectedService(prev => (prev === serviceId ? '' : serviceId));
    };

    const handleContinue = () => {
        if (!selectedService) {
            setError('Selectează un serviciu pentru a continua');
            return;
        }

        // Redirect to levels page with single service
        router.push(`/provider/services/levels?services=${selectedService}`);
    };

    if (loading || categoriesLoading) {
        return (
            <div className="min-h-screen bg-[var(--bg-light)] dark:bg-[#070C14] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (!user || user?.roles?.some((r: any) => r.slug?.toLowerCase() !== 'provider')) {
        return null;
    }

    // Determine which categories to display (Roots or Children)
    const displayedCategories = parentCategory
        ? parentCategory.children
        : (categoriesData || []);

    return (
        <div className="min-h-screen bg-[var(--bg-light)] dark:bg-[#070C14] hero-gradient">
            <TrustoraThemeStyles />
            <Header />

            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center space-x-4 mb-8">
                    <Button variant="outline" size="icon" onClick={() => router.push('/dashboard')}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold">Selectează Serviciul</h1>
                        <p className="text-muted-foreground">
                            Alege categoria și serviciul pe care vrei să îl prestezi pe platformă
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-muted-foreground">Pasul 1 din 4</div>
                        <div className="text-lg font-semibold text-[var(--midnight-blue)] dark:text-white">Selectare Serviciu</div>
                    </div>
                </div>

                {/* Progress */}
                <div className="mb-8 glass-card p-4">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-[var(--emerald-green)] text-white rounded-full flex items-center justify-center text-sm font-bold">
                                1
                            </div>
                            <span className="font-medium text-[var(--emerald-green)]">Selectare Serviciu</span>
                        </div>
                        <div className="flex-1 h-0.5 bg-slate-200"></div>
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center text-sm font-bold">
                                2
                            </div>
                            <span className="text-slate-500">Niveluri Competență</span>
                        </div>
                        <div className="flex-1 h-0.5 bg-slate-200"></div>
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center text-sm font-bold">
                                3
                            </div>
                            <span className="text-slate-500">Teste & Certificare</span>
                        </div>
                        <div className="flex-1 h-0.5 bg-slate-200"></div>
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center text-sm font-bold">
                                4
                            </div>
                            <span className="text-slate-500">Setare Tarife</span>
                        </div>
                    </div>
                </div>

                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Info Card */}
                <Card className="mb-8 glass-card border-emerald-100/60 bg-white/80 dark:bg-white/5">
                    <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                            <div className="w-12 h-12 bg-[var(--emerald-green)] rounded-xl flex items-center justify-center">
                                <Target className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-[var(--midnight-blue)] dark:text-white mb-2">
                                    Serviciile sunt administrate de echipa Trustora
                                </h3>
                                <div className="text-slate-600 dark:text-slate-300 text-sm space-y-1">
                                    <p>• <strong>Administratorii</strong> creează și gestionează serviciile disponibile</p>
                                    <p>• <strong>Tu te înscrii</strong> să prestezi un serviciu existent cu tarifele tale</p>
                                    <p>• <strong>Selectezi nivelul</strong> (Junior, Mediu, Senior, Expert)</p>
                                    <p>• <strong>Susții teste</strong> pentru a demonstra competența</p>
                                    <p>• <strong>Setezi tarifele</strong> și începi să primești comenzi</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Categories and Services */}
                <div className="grid xs:grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Categories Sidebar */}
                    <div className="lg:col-span-1">
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    {parentCategory ? (
                                        <Button
                                            variant="ghost"
                                            className="p-0 h-auto hover:bg-transparent -ml-2"
                                            onClick={handleBackToParents}
                                        >
                                            <ArrowLeft className="w-5 h-5 mr-1" />
                                            <span>Înapoi</span>
                                        </Button>
                                    ) : (
                                        <>
                                            <FolderOpen className="w-5 h-5" />
                                            <span>Categorii</span>
                                        </>
                                    )}
                                </CardTitle>
                                <CardDescription>
                                    {parentCategory
                                        ? `Subcategorii: ${parentCategory.name}`
                                        : 'Selectează o categorie'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="space-y-1">
                                    {displayedCategories.map((category: any) => {
                                        const hasChildren = category.children && category.children.length > 0;
                                        const IconComponent = serviceIcons[category.slug as ServiceSlug] || Code;

                                        const isSelected = selectedCategory === category.id;

                                        return (
                                            <button
                                                key={category.id}
                                                onClick={() => handleCategoryClick(category)}
                                                className={`w-full text-left p-3 rounded-lg transition-colors ${
                                                    isSelected
                                                        ? 'bg-blue-100 text-blue-900 border-blue-200'
                                                        : 'hover:bg-muted'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <IconComponent className="w-5 h-5 shrink-0" />
                                                        <div>
                                                            <div className="font-medium text-sm">{category.name}</div>
                                                            {category.description && (
                                                                <div className="text-xs text-muted-foreground line-clamp-1">
                                                                    {category.description}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {hasChildren && (
                                                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                                                    )}
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
                            <Card className="h-96 flex items-center justify-center glass-card">
                                <CardContent className="text-center">
                                    <FolderOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-medium mb-2">
                                        {parentCategory
                                            ? 'Selectează o subcategorie'
                                            : 'Selectează o categorie'}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        Alege din lista din stânga pentru a vedea serviciile disponibile
                                    </p>
                                </CardContent>
                            </Card>
                        ) : loadingServices ? (
                            <Card className="h-96 flex items-center justify-center glass-card">
                                <CardContent className="text-center">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                                    <p className="text-muted-foreground">Se încarcă serviciile...</p>
                                </CardContent>
                            </Card>
                        ) : services.length === 0 ? (
                            <Card className="h-96 flex items-center justify-center glass-card">
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
                                        {selectedService ? '1 selectat' : '0 selectate'}
                                    </Badge>
                                </div>

                                <div className="grid xs:grid-cols-1 md:grid-cols-2 gap-4">
                                    {services.map((service: any) => {
                                        const IconComponent = serviceIcons[service.category?.slug as ServiceSlug] || Code;
                                        const isSelected = selectedService === service.id;

                                        return (
                                            <Card
                                                key={service.id}
                                                className={`cursor-pointer transition-all duration-200 glass-card hover:shadow-lg ${
                                                    isSelected
                                                        ? 'border-emerald-400/70 bg-emerald-50/60 dark:bg-emerald-500/10 shadow-md'
                                                        : 'border-white/60 hover:border-emerald-200'
                                                }`}
                                                onClick={() => handleServiceSelect(service.id)}
                                            >
                                                <CardHeader>
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center space-x-3">
                                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                                                isSelected
                                                                    ? 'bg-[var(--emerald-green)] text-white'
                                                                    : 'bg-slate-100 text-slate-600'
                                                            }`}>
                                                                <IconComponent className="w-6 h-6" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <CardTitle className="text-lg">{service.name}</CardTitle>
                                                                <Badge variant="outline" className="mt-1">
                                                                    {service.category?.name}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={() => handleServiceSelect(service.id)}
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <CardDescription className="text-sm mb-4 line-clamp-2">
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

                {/* Selection Summary */}
                {selectedService && (
                    <Card className="mt-8 glass-card border-emerald-100/60 bg-emerald-50/60 dark:bg-emerald-500/10">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-[var(--midnight-blue)] dark:text-white mb-2">
                                        Serviciu Selectat
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {(() => {
                                            const service = services.find(s => s.id === selectedService);
                                            return service ? (
                                                <Badge className="bg-[var(--emerald-green)] text-white">
                                                    {service.name}
                                                </Badge>
                                            ) : null;
                                        })()}
                                    </div>
                                </div>
                                <CheckCircle className="w-8 h-8 text-[var(--emerald-green)]" />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Actions */}
                <div className="flex justify-between mt-8">
                    <Button variant="outline" onClick={() => router.push('/dashboard')}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Înapoi la Dashboard
                    </Button>

                    <Button
                        onClick={handleContinue}
                        disabled={!selectedService}
                        className="btn-primary px-8"
                    >
                        Continuă
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </div>

            <Footer />
        </div>
    );
}
