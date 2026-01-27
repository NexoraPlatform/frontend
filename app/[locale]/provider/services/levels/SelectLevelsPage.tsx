"use client";
export const dynamic = 'force-dynamic';

import {useState, useEffect, ForwardRefExoticComponent, RefAttributes} from 'react';
import { useRouter } from '@/lib/navigation';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { TrustoraThemeStyles } from '@/components/trustora/theme-styles';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    Star,
    Award,
    Target,
    Zap, LucideProps
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api';

export default function SelectLevelsPageClient() {
    const { user, loading } = useAuth();
    const [services, setServices] = useState<any[]>([]);
    const [serviceLevels, setServiceLevels] = useState<{[key: string]: string}>({});
    const [error, setError] = useState('');
    const [loadingServices, setLoadingServices] = useState(true);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/signin');
        }
        if (user && user?.roles?.some((r: any) => r.slug?.toLowerCase() !== 'provider')) {
            router.push('/dashboard');
        }

        const servicesParam = searchParams.get('services');
        if (servicesParam) {
            loadServices(servicesParam.split(','));
        } else {
            router.push('/provider/services/select');
        }
    }, [user, loading, router, searchParams]);

    const loadServices = async (serviceIds: string[]) => {
        try {
            // Încarcă serviciile din baza de date
            const servicePromises = serviceIds.map(id => apiClient.getService(id));
            const servicesData = await Promise.all(servicePromises);

            setServices(servicesData);

            // Inițializează nivelurile cu 'JUNIOR' implicit
            const initialLevels: Record<string, string> = {};
            serviceIds.forEach(id => {
                initialLevels[id] = 'JUNIOR';
            });
            setServiceLevels(initialLevels);
        } catch (error: any) {
            setError('Nu s-au putut încărca serviciile');
        } finally {
            setLoadingServices(false);
        }
    };

    type ServiceSlug =
        | 'dezvoltare-website-react'
        | 'aplicatie-mobile-react-native'
        | 'design-ui-ux-modern'
        | 'optimizare-seo'
        | 'administrare-baze-date'
        | 'cybersecurity';

    const serviceIcons: Record<ServiceSlug, ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>> = {
        'dezvoltare-website-react': Code,
        'aplicatie-mobile-react-native': Smartphone,
        'design-ui-ux-modern': Palette,
        'optimizare-seo': TrendingUp,
        'administrare-baze-date': Database,
        'cybersecurity': Shield
    };

    const levels = [
        {
            value: 'JUNIOR',
            label: 'Junior',
            description: '0-2 ani experiență',
            color: 'bg-green-100 text-green-800',
            icon: '🌱',
            difficulty: 'Ușor',
            testDuration: 30,
            passingScore: 70
        },
        {
            value: 'MEDIU',
            label: 'Mediu',
            description: '2-5 ani experiență',
            color: 'bg-blue-100 text-blue-800',
            icon: '⚡',
            difficulty: 'Moderat',
            testDuration: 45,
            passingScore: 75
        },
        {
            value: 'SENIOR',
            label: 'Senior',
            description: '5+ ani experiență',
            color: 'bg-purple-100 text-purple-800',
            icon: '🚀',
            difficulty: 'Avansat',
            testDuration: 60,
            passingScore: 80
        },
        {
            value: 'EXPERT',
            label: 'Expert',
            description: '10+ ani experiență',
            color: 'bg-orange-100 text-orange-800',
            icon: '👑',
            difficulty: 'Expert',
            testDuration: 75,
            passingScore: 85
        }
    ];

    const handleLevelChange = (serviceId: string, level: string) => {
        setServiceLevels(prev => ({
            ...prev,
            [serviceId]: level
        }));
    };

    const handleContinue = () => {
        // Verifică că toate serviciile au niveluri setate
        const unsetServices = services.filter(service => !serviceLevels[service.id]);
        if (unsetServices.length > 0) {
            setError('Selectează nivelul pentru toate serviciile');
            return;
        }

        // Creează parametrii pentru testare
        const testData = services.map(service => ({
            serviceId: service.id,
            serviceName: service.name,
            level: serviceLevels[service.id],
            category: service.category?.name
        }));
        // Redirecționează către pagina de teste
        const testParam = encodeURIComponent(JSON.stringify(testData));

        router.push(`/provider/services/tests?data=${testParam}`);
    };

    const getLevelInfo = (levelValue: string) => {
        return levels.find(l => l.value === levelValue) || levels[0];
    };

    if (loading || loadingServices) {
        return (
            <div className="min-h-screen bg-[var(--bg-light)] dark:bg-[#070C14] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (!user || user?.roles?.some((r: any) => r.slug?.toLowerCase() !== 'provider')) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[var(--bg-light)] dark:bg-[#070C14] hero-gradient">
            <TrustoraThemeStyles />
            <Header />

            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center space-x-4 mb-8">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold">Selectează Nivelurile</h1>
                        <p className="text-muted-foreground">
                            Alege nivelul de competență pentru fiecare serviciu selectat
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-muted-foreground">Pasul 2 din 4</div>
                        <div className="text-lg font-semibold text-[var(--midnight-blue)] dark:text-white">Niveluri Competență</div>
                    </div>
                </div>

                {/* Progress */}
                <div className="mb-8 glass-card p-4">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-[var(--emerald-green)] text-white rounded-full flex items-center justify-center text-sm font-bold">
                                ✓
                            </div>
                            <span className="font-medium text-[var(--emerald-green)]">Selectare Servicii</span>
                        </div>
                        <div className="flex-1 h-0.5 bg-[var(--emerald-green)]/40"></div>
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-[var(--emerald-green)] text-white rounded-full flex items-center justify-center text-sm font-bold">
                                2
                            </div>
                            <span className="font-medium text-[var(--emerald-green)]">Niveluri Competență</span>
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
                                <Award className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-[var(--midnight-blue)] dark:text-white mb-2">
                                    Alege nivelul potrivit pentru tine
                                </h3>
                                <div className="text-slate-600 dark:text-slate-300 text-sm space-y-1">
                                    <p>• <strong>Nivelul influențează</strong> dificultatea testului și tarifele recomandate</p>
                                    <p>• <strong>Poți începe cu Junior</strong> și să avansezi ulterior</p>
                                    <p>• <strong>Testele sunt adaptate</strong> la nivelul selectat</p>
                                    <p>• <strong>Certificarea</strong> îți validează competențele pentru clienți</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Services with Level Selection */}
                <div className="space-y-6 mb-8">
                    {services.map((service: any) => {

                        // @ts-ignore
                        const IconComponent = serviceIcons[service.slug] || Code;
                        const selectedLevel = serviceLevels[service.id];
                        const levelInfo = getLevelInfo(selectedLevel);

                        return (
                            <Card key={service.id} className="glass-card border-emerald-100/60">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-16 h-16 bg-gradient-to-br from-[#0B1C2D] to-[#1BC47D] rounded-xl flex items-center justify-center">
                                                <IconComponent className="w-8 h-8 text-white" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl">{service.title}</CardTitle>
                                                <CardDescription className="mt-1">
                                                    {service.category?.name}
                                                </CardDescription>
                                                <p className="text-sm text-muted-foreground mt-2">
                                                    {service.description}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="min-w-64">
                                            <label className="text-sm font-medium mb-2 block">
                                                Selectează nivelul tău:
                                            </label>
                                            <Select
                                                value={selectedLevel}
                                                onValueChange={(value) => handleLevelChange(service.id, value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {levels.map(level => (
                                                        <SelectItem key={level.value} value={level.value}>
                                                            <div className="flex items-center space-x-2">
                                                                <span>{level.icon}</span>
                                                                <span>{level.label}</span>
                                                                <span className="text-xs text-muted-foreground">
                                  ({level.description})
                                </span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardHeader>

                                {selectedLevel && (
                                    <CardContent>
                                        <div className="bg-muted/30 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-2xl">{levelInfo.icon}</span>
                                                <Badge className={levelInfo.color}>
                                                    {levelInfo.label}
                                                </Badge>
                                                    <span className="text-sm text-muted-foreground">
                            {levelInfo.description}
                          </span>
                                                </div>
                                                <Badge variant="outline">
                                                    Test: {levelInfo.difficulty}
                                                </Badge>
                                            </div>

                                            <div className="grid grid-cols-3 gap-4 text-sm">
                                                <div className="flex items-center space-x-2">
                                                    <Target className="w-4 h-4 text-[var(--emerald-green)]" />
                                                    <span>Durată: {levelInfo.testDuration} min</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Star className="w-4 h-4 text-amber-500" />
                                                    <span>Nota de trecere: {levelInfo.passingScore}%</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Zap className="w-4 h-4 text-emerald-500" />
                                                    <span>Dificultate: {levelInfo.difficulty}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        );
                    })}
                </div>

                {/* Summary */}
                <Card className="mb-8 glass-card border-emerald-100/60 bg-emerald-50/60 dark:bg-emerald-500/10">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-[var(--midnight-blue)] dark:text-white mb-2">
                                    Rezumat Selecție ({services.length} servicii)
                                </h3>
                                <div className="space-y-1">
                                    {services.map(service => {
                                        const level = getLevelInfo(serviceLevels[service.id]);
                                        return (
                                            <div key={service.id} className="flex items-center space-x-2 text-sm">
                                                <span>{level.icon}</span>
                                                <span className="font-medium">{service.title}</span>
                                                <span>→</span>
                                                <Badge className={level.color}>
                                                    {level.label}
                                                </Badge>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <CheckCircle className="w-8 h-8 text-[var(--emerald-green)]" />
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-between">
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Înapoi la Servicii
                    </Button>

                    <Button
                        onClick={handleContinue}
                        className="btn-primary px-8"
                    >
                        Continuă la Teste
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            </div>

            <Footer />
        </div>
    );
}
