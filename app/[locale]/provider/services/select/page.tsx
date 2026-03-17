"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from '@/lib/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { ProviderDashboardShell } from '@/components/dashboard/provider-dashboard-shell';
import type { LucideIcon } from 'lucide-react';
import {
    ArrowLeft,
    ArrowRight,
    ArrowUp,
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
import { getRoleSlugs } from '@/lib/access';

export default function SelectServicesPage() {
    const { user, loading, userLoading, refreshUser } = useAuth();

    // State for Category Navigation
    const [parentCategory, setParentCategory] = useState<any | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    const [services, setServices] = useState<any[]>([]);
    const [providerServiceLevels, setProviderServiceLevels] = useState<Record<string, string>>({});
    // Changed from array (multiple) to string (single)
    const [selectedService, setSelectedService] = useState<string>('');
    const [loadingServices, setLoadingServices] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const { data: categoriesData, loading: categoriesLoading } = useCategories();
    const [hasRestoredSelection, setHasRestoredSelection] = useState(false);
    const storageKey = useMemo(() => 'provider-services-select', []);
    const roleRefreshAttemptedRef = useRef(false);
    const [isRefreshingRole, setIsRefreshingRole] = useState(false);
    const roleSlugs = useMemo(() => getRoleSlugs(user), [user]);
    const hasRoleInfo = roleSlugs.length > 0;
    const isProvider = roleSlugs.includes('provider');

    const findCategoryById = useCallback((categories: any[], categoryId: string | number): any | null => {
        for (const category of categories) {
            if (String(category.id) === String(categoryId)) {
                return category;
            }

            if (Array.isArray(category.children) && category.children.length > 0) {
                const nestedCategory = findCategoryById(category.children, categoryId);
                if (nestedCategory) {
                    return nestedCategory;
                }
            }
        }

        return null;
    }, []);

    useEffect(() => {
        if (userLoading) return;

        if (!user) {
            router.push('/auth/signin');
            return;
        }

        if (!hasRoleInfo && !roleRefreshAttemptedRef.current) {
            roleRefreshAttemptedRef.current = true;
            setIsRefreshingRole(true);
            void refreshUser().finally(() => {
                setIsRefreshingRole(false);
            });
            return;
        }

        if (hasRoleInfo && !isProvider) {
            router.push('/dashboard');
        }
    }, [hasRoleInfo, isProvider, refreshUser, router, user, userLoading]);

    useEffect(() => {
        if (!user?.id || !isProvider) {
            setProviderServiceLevels({});
            return;
        }

        let cancelled = false;

        void (async () => {
            try {
                const response = await apiClient.getProviderServices(String(user.id));
                if (cancelled) {
                    return;
                }

                const nextLevels = Array.isArray(response)
                    ? response.reduce<Record<string, string>>((accumulator, providerService) => {
                        const serviceId = String(providerService?.service_id ?? providerService?.service?.id ?? '');
                        const level = typeof providerService?.level === 'string' ? providerService.level : '';

                        if (serviceId && level) {
                            accumulator[serviceId] = level;
                        }

                        return accumulator;
                    }, {})
                    : {};

                setProviderServiceLevels(nextLevels);
            } catch {
                if (!cancelled) {
                    setProviderServiceLevels({});
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [isProvider, user?.id]);

    useEffect(() => {
        if (selectedCategory) {
            loadServicesForCategory(selectedCategory);
        } else {
            setServices([]);
        }
    }, [selectedCategory]);

    useEffect(() => {
        if (!selectedService) {
            return;
        }

        const selectedServiceData = services.find((service) => String(service.id) === String(selectedService));
        if (!selectedServiceData) {
            return;
        }

        const isRetryLocked =
            selectedServiceData.provider_test_status === 'FAILED' &&
            selectedServiceData.provider_can_retry_test === false;
        const isPassedLocked = selectedServiceData.provider_test_status === 'PASSED';

        if (isRetryLocked || isPassedLocked) {
            setSelectedService('');
        }
    }, [selectedService, services]);

    useEffect(() => {
        if (categoriesLoading || hasRestoredSelection || typeof window === 'undefined') {
            return;
        }

        try {
            const rawState = window.sessionStorage.getItem(storageKey);
            if (!rawState) {
                return;
            }

            const persistedState = JSON.parse(rawState);
            if (!persistedState || typeof persistedState !== 'object') {
                return;
            }

            const restoredParentCategoryId = persistedState.parentCategoryId;
            const restoredSelectedCategory = persistedState.selectedCategoryId;
            const restoredSelectedService = persistedState.selectedServiceId;

            if (restoredParentCategoryId && Array.isArray(categoriesData)) {
                const restoredParentCategory = findCategoryById(categoriesData, restoredParentCategoryId);
                if (restoredParentCategory) {
                    setParentCategory(restoredParentCategory);
                }
            }

            if (restoredSelectedCategory != null) {
                setSelectedCategory(restoredSelectedCategory);
            }

            if (restoredSelectedService != null) {
                setSelectedService(restoredSelectedService);
            }
        } catch {
            window.sessionStorage.removeItem(storageKey);
        } finally {
            setHasRestoredSelection(true);
        }
    }, [categoriesData, categoriesLoading, findCategoryById, hasRestoredSelection, storageKey]);

    useEffect(() => {
        if (!hasRestoredSelection || typeof window === 'undefined') {
            return;
        }

        window.sessionStorage.setItem(
            storageKey,
            JSON.stringify({
                parentCategoryId: parentCategory?.id ?? null,
                selectedCategoryId: selectedCategory || null,
                selectedServiceId: selectedService || null,
            })
        );
    }, [hasRestoredSelection, parentCategory, selectedCategory, selectedService, storageKey]);

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
        const service = services.find((entry) => String(entry.id) === String(serviceId));
        const isRetryLocked =
            service?.provider_test_status === 'FAILED' &&
            service?.provider_can_retry_test === false;
        const isPassedLocked = service?.provider_test_status === 'PASSED';

        if (isRetryLocked || isPassedLocked) {
            return;
        }

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

    const formatRetakeCountdown = (service: any) => {
        const daysLeft = Number(service?.provider_retake_days_left ?? 0);
        if (daysLeft > 0) {
            return `Poți relua testul peste ${daysLeft} ${daysLeft === 1 ? 'zi' : 'zile'}`;
        }

        const secondsLeft = Number(service?.provider_retake_seconds_left ?? 0);
        if (secondsLeft <= 0) {
            return null;
        }

        const hoursLeft = Math.ceil(secondsLeft / 3600);
        if (hoursLeft >= 24) {
            const remainingDays = Math.ceil(hoursLeft / 24);
            return `Poți relua testul peste ${remainingDays} ${remainingDays === 1 ? 'zi' : 'zile'}`;
        }

        if (hoursLeft >= 1) {
            return `Poți relua testul peste ${hoursLeft} ${hoursLeft === 1 ? 'oră' : 'ore'}`;
        }

        const minutesLeft = Math.max(1, Math.ceil(secondsLeft / 60));
        return `Poți relua testul peste ${minutesLeft} ${minutesLeft === 1 ? 'minut' : 'minute'}`;
    };

    const formatPassedAgo = (service: any) => {
        const daysAgo = Number(service?.provider_passed_test_days_ago ?? 0);
        if (daysAgo > 0) {
            return `Ai trecut testul acum ${daysAgo} ${daysAgo === 1 ? 'zi' : 'zile'}`;
        }

        const secondsAgo = Number(service?.provider_passed_test_seconds_ago ?? 0);
        if (secondsAgo <= 0) {
            return 'Ai trecut deja testul pentru acest serviciu';
        }

        const hoursAgo = Math.floor(secondsAgo / 3600);
        if (hoursAgo >= 24) {
            const calculatedDays = Math.floor(hoursAgo / 24);
            return `Ai trecut testul acum ${calculatedDays} ${calculatedDays === 1 ? 'zi' : 'zile'}`;
        }

        if (hoursAgo >= 1) {
            return `Ai trecut testul acum ${hoursAgo} ${hoursAgo === 1 ? 'oră' : 'ore'}`;
        }

        const minutesAgo = Math.max(1, Math.floor(secondsAgo / 60));
        return `Ai trecut testul acum ${minutesAgo} ${minutesAgo === 1 ? 'minut' : 'minute'}`;
    };

    const normalizeLevel = (value: string) => {
        const normalized = value.trim().toUpperCase();

        if (normalized === 'MID' || normalized === 'INTERMEDIATE') {
            return 'MEDIU';
        }

        return normalized;
    };

    const getNextLevel = (value: string) => {
        const orderedLevels = ['JUNIOR', 'MEDIU', 'SENIOR', 'EXPERT'];
        const normalized = normalizeLevel(value);
        const currentIndex = orderedLevels.indexOf(normalized);

        if (currentIndex < 0 || currentIndex >= orderedLevels.length - 1) {
            return null;
        }

        return orderedLevels[currentIndex + 1];
    };

    const formatLevelLabel = (value: string) => {
        const normalized = normalizeLevel(value);

        if (normalized === 'JUNIOR') return 'Junior';
        if (normalized === 'MEDIU') return 'Mediu';
        if (normalized === 'SENIOR') return 'Senior';
        if (normalized === 'EXPERT') return 'Expert';

        return value;
    };

    const formatLevelUpgradeCountdown = (service: any) => {
        const daysLeft = Number(service?.provider_level_upgrade_days_left ?? 0);
        if (daysLeft > 0) {
            return `Poți da testul de upgrade peste ${daysLeft} ${daysLeft === 1 ? 'zi' : 'zile'}`;
        }

        const secondsLeft = Number(service?.provider_level_upgrade_seconds_left ?? 0);
        if (secondsLeft <= 0) {
            return null;
        }

        const hoursLeft = Math.ceil(secondsLeft / 3600);
        if (hoursLeft >= 24) {
            const remainingDays = Math.ceil(hoursLeft / 24);
            return `Poți da testul de upgrade peste ${remainingDays} ${remainingDays === 1 ? 'zi' : 'zile'}`;
        }

        if (hoursLeft >= 1) {
            return `Poți da testul de upgrade peste ${hoursLeft} ${hoursLeft === 1 ? 'oră' : 'ore'}`;
        }

        const minutesLeft = Math.max(1, Math.ceil(secondsLeft / 60));
        return `Poți da testul de upgrade peste ${minutesLeft} ${minutesLeft === 1 ? 'minut' : 'minute'}`;
    };

    const handleLevelUpgrade = (service: any) => {
        const currentLevel = providerServiceLevels[String(service.id)] ?? '';
        const nextLevel = getNextLevel(currentLevel);

        if (!nextLevel) {
            return;
        }

        const testData = encodeURIComponent(JSON.stringify({
            serviceId: String(service.id),
            serviceName: service.name,
            level: nextLevel,
            currentLevel: normalizeLevel(currentLevel),
            category: service.category?.name ?? '',
            programming_language: service.programming_language ?? '',
            flow: 'level_upgrade',
        }));

        router.push(`/provider/services/tests?data=${testData}`);
    };

    if (loading || userLoading || categoriesLoading || isRefreshingRole) {
        return (
            <div className="min-h-screen bg-[var(--bg-light)] dark:bg-[#070C14] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (!user || (hasRoleInfo && !isProvider)) {
        return null;
    }

    // Determine which categories to display (Roots or Children)
    const displayedCategories = parentCategory
        ? parentCategory.children
        : (categoriesData || []);

    return (
        <ProviderDashboardShell
            title="Selectează Serviciul"
            description="Alege categoria și serviciul pe care vrei să îl prestezi în fluxul tău de provider."
            activeMenu="services"
        >
            <div className="space-y-8">
                <div className="flex items-center justify-between gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.push('/dashboard')}>
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <Badge className="border-0 bg-[#1BC47D]/15 px-3 py-2 text-[#1BC47D]">
                        Pasul 1 din 4
                    </Badge>
                </div>

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
                                        const IconComponent = serviceIcons[service.category?.slug as ServiceSlug] || serviceIcons[service.slug as ServiceSlug] || Code;
                                        const isSelected = selectedService === service.id;
                                        const hasPassedTest = service.provider_test_status === 'PASSED';
                                        const hasFailedTest = service.provider_test_status === 'FAILED';
                                        const canRetryTest = Boolean(service.provider_can_retry_test);
                                        const isRetryLocked = hasFailedTest && !canRetryTest;
                                        const isPassedLocked = hasPassedTest;
                                        const isSelectionLocked = isRetryLocked || isPassedLocked;
                                        const retryCountdown = !canRetryTest ? formatRetakeCountdown(service) : null;
                                        const passedAgoLabel = hasPassedTest ? formatPassedAgo(service) : null;
                                        const currentProviderLevel = providerServiceLevels[String(service.id)] ?? '';
                                        const nextLevel = currentProviderLevel ? getNextLevel(currentProviderLevel) : null;
                                        const canTakeLevelUpgradeTest = Boolean(service.provider_can_take_level_upgrade_test);
                                        const hasLevelUpgradeCooldown = Boolean(service.provider_last_test_within_level_upgrade_cooldown);
                                        const levelUpgradeCountdown = hasLevelUpgradeCooldown
                                            ? formatLevelUpgradeCountdown(service)
                                            : null;
                                        const serviceTags = Array.isArray(service.tags) ? service.tags : [];
                                        const providersCount = Number(service.providers_count ?? 0);

                                        return (
                                            <Card
                                                key={service.id}
                                                className={`transition-all duration-200 glass-card ${
                                                    isSelectionLocked
                                                        ? 'cursor-not-allowed border-slate-200/80 bg-slate-50/70 opacity-60 dark:bg-slate-900/30'
                                                        : 'cursor-pointer hover:shadow-lg'
                                                } ${
                                                    isSelected
                                                        ? 'border-emerald-400/70 bg-emerald-50/60 dark:bg-emerald-500/10 shadow-md'
                                                        : 'border-white/60 hover:border-emerald-200'
                                                }`}
                                                onClick={() => {
                                                    if (!isSelectionLocked) {
                                                        handleServiceSelect(service.id);
                                                    }
                                                }}
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
                                                                <div className="mt-1 flex flex-wrap gap-2">
                                                                    <Badge variant="outline">
                                                                        {service.category?.name}
                                                                    </Badge>
                                                                    {hasPassedTest ? (
                                                                        <Badge className="border-0 bg-emerald-100 text-emerald-700">
                                                                            Passed
                                                                        </Badge>
                                                                    ) : null}
                                                                    {hasFailedTest ? (
                                                                        <Badge className="border-0 bg-red-100 text-red-700">
                                                                            Failed
                                                                        </Badge>
                                                                    ) : null}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={() => handleServiceSelect(service.id)}
                                                            disabled={isSelectionLocked}
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <CardDescription className="text-sm mb-4 line-clamp-2">
                                                        {service.description || 'Detaliile pentru acest serviciu vor fi disponibile în curând.'}
                                                    </CardDescription>

                                                    {serviceTags.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mb-3">
                                                            {serviceTags.slice(0, 3).map((skill: string) => (
                                                                <Badge key={skill} variant="outline" className="text-xs">
                                                                    {skill}
                                                                </Badge>
                                                            ))}
                                                            {serviceTags.length > 3 && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    +{serviceTags.length - 3}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    )}

                                                    {hasPassedTest ? (
                                                        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                                                            {passedAgoLabel}
                                                        </div>
                                                    ) : null}

                                                    {hasPassedTest && nextLevel ? (
                                                        <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-3 py-3">
                                                            <div className="flex flex-col gap-3">
                                                                <div className="text-sm text-blue-900">
                                                                    Poți încerca upgrade-ul de la {formatLevelLabel(currentProviderLevel)} la {formatLevelLabel(nextLevel)}.
                                                                </div>
                                                                {hasLevelUpgradeCooldown && !canTakeLevelUpgradeTest ? (
                                                                    <div className="text-xs text-blue-800">
                                                                        {levelUpgradeCountdown || 'Testul de upgrade nu este disponibil încă.'}
                                                                    </div>
                                                                ) : null}
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    disabled={!canTakeLevelUpgradeTest}
                                                                    onClick={(event) => {
                                                                        event.stopPropagation();
                                                                        if (canTakeLevelUpgradeTest) {
                                                                            handleLevelUpgrade(service);
                                                                        }
                                                                    }}
                                                                    className="w-full"
                                                                >
                                                                    <ArrowUp className="w-4 h-4 mr-2" />
                                                                    Dă test pentru {formatLevelLabel(nextLevel)}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : null}

                                                    {hasFailedTest ? (
                                                        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                                                            {canRetryTest
                                                                ? 'Poți relua testul acum'
                                                                : retryCountdown || 'Testul nu poate fi reluat încă'}
                                                        </div>
                                                    ) : null}

                                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                        <span>{providersCount} prestatori activi</span>
                                                        <span className="text-green-600 font-medium">
                                                            {providersCount === 0 ? 'Fii primul!' : 'Alătură-te!'}
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
        </ProviderDashboardShell>
    );
}
