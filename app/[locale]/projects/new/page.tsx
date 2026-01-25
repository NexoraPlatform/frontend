"use client";

import {useState, useEffect, useMemo, useCallback, useRef} from 'react';
import { usePathname, useRouter } from '@/lib/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TrustoraThemeStyles } from '@/components/trustora/theme-styles';
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
    MessageSquare,
    Eye,
    ArrowRight,
    ArrowLeft,
    EuroIcon,
    Filter,
    ChevronDown,
    BadgeAlert, GithubIcon
} from 'lucide-react';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useAuth } from '@/contexts/auth-context';
import {useGetServicesGroupedByCategory, useMainCategories} from '@/hooks/use-api';
import TitleIcon from '@mui/icons-material/Title';
import DescriptionIcon from '@mui/icons-material/Description';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { apiClient } from '@/lib/api';
import type { GenerateProjectInformationResponse } from '@/lib/api';
import { formatDeadline } from '@/lib/projects';
import { hasRole } from '@/lib/access';
import type { Locale } from '@/types/locale';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';

dayjs.extend(relativeTime);
dayjs.extend(utc);

import 'dayjs/locale/ro';
import 'dayjs/locale/en';
import GithubConnect from "@/components/GithubConnect";


function setDayjsLocale(locale: string) {
    const supported = ['ro', 'en'];
    if (supported.includes(locale)) {
        dayjs.locale(locale);
    } else {
        dayjs.locale('ro');
    }
}

type ServiceItem = {
    id: string;
    name: string;
    slug?: string;
    category_id: string;
    require_repo: boolean;
};

type GroupedServices = Record<
    string,
    Record<string, ServiceItem[]>
>;

type matchReasons = {
    passed: boolean;
    message: string;
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
    profileUrl: string;
    skills: string[];
    basePrice: number;
    pricingType: string;
    deliveryTime: number;
    matchScore: number;
    matchReasons: matchReasons[];
    availability: string;
    lastActive: string;
    level: string;
}


const aiLoadingMessageKeys = [
    'projects.new.ai_loading.analyzing',
    'projects.new.ai_loading.generating',
    'projects.new.ai_loading.verifying',
    'projects.new.ai_loading.finalizing',
];

type TechnologySelected = {
    id: string;
    name: string
    require_repo?: boolean;
}

type RecommendedProvider = {
    role: string;
    level: string;
    service: string;
    count: number;
    estimated_cost: number;
}

type BudgetType = 'FIXED' | 'HOURLY';

type FormData = {
    title: string;
    description: string;
    requirements: string;
    serviceId: string;
    technologies: TechnologySelected[];
    budget: string;
    budgetType: BudgetType;
    deadline: string;
    visibility: string;
    attachments: File[];
    additionalInfo: string;
    recommendedProviders: RecommendedProvider[];
    notes: string;
    paymentPlan: string;
    githubRepoTarget: 'platform' | 'provider' | 'client';
};


type SelectedProvider = {
    id: string;
    matchScore: number;
};

export default function NewProjectPage() {
    const locale = useLocale() as Locale;
    const t = useTranslations();
    const currencyLabel = t('projects.new.currency.ron');
    useEffect(() => {
        setDayjsLocale(locale);
    }, [locale]);

    const { user, loading, userLoading, refreshUser } = useAuth();
    const [activeTab, setActiveTab] = useState('details');
    const [formData, setFormData] = useState<FormData>({
        title: '',
        description: '',
        requirements: '',
        serviceId: '',
        technologies: [],
        budget: '',
        budgetType: 'FIXED',
        deadline: '',
        visibility: 'PUBLIC',
        attachments: [] as File[],
        additionalInfo: '',
        recommendedProviders: [],
        notes: '',
        paymentPlan: '',
        githubRepoTarget: 'platform',
    });
    const [generatedAiOutput, setGeneratedAiOutput] = useState<GenerateProjectInformationResponse>({
        title: "",
        description: "",
        technologies: [],
        estimated_budget: 0,
        budget_type: "",
        notes: "",
        deadline: "",
        additional_services: [],
        team_structure: [],
        payment_plan: "",
        milestone_count: 0,
        milestones: []
    });
    const [aiLoading, setAiLoading] = useState(false);

    const [skipValidation, setSkipValidation] = useState(false);
    const [suggestedProviders, setSuggestedProviders] = useState<SuggestedProvider[]>([]);
    const [selectedProviders, setSelectedProviders] = useState<SelectedProvider[]>([]);
    const [providerBudgets, setProviderBudgets] = useState<{[key: string]: number}>({});
    const [loadingProviders, setLoadingProviders] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [newTechnology, setNewTechnology] = useState('');
    const [index] = useState(0);
    const aiLoadingMessages = useMemo(
        () => aiLoadingMessageKeys.map((key) => t(key)),
        [t]
    );
    const [foundSuggestedProvider, setFoundSuggestedProvider] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [providerSearchTerm, setProviderSearchTerm] = useState('');
    const [selectedServiceFilters, setSelectedServiceFilters] = useState<string[]>([]);
    const [skillLevelFilter, setSkillLevelFilter] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [providersPerPage] = useState(6); // 6 providers per page for better layout
    const [availableServices, setAvailableServices] = useState<any[]>([]);
    const [providerMilestones, setProviderMilestones] = useState<Record<string, { title: string; amount: string }[]>>({});
    const [aiSuggestedMilestones, setAiSuggestedMilestones] = useState<{ provider_role?: string; milestones: { title: string; amount: number }[] }[]>([]);

    const isLongProject = useMemo(() => (
        ['3months', '6months', '1year', '1plusyear'].includes(formData.deadline)
    ), [formData.deadline]);

    const buildProviderMilestonesFromAi = useCallback(() => {
        if (aiSuggestedMilestones.length === 0 || selectedProviders.length === 0) {
            return {};
        }

        const providerMap = new Map(
            selectedProviders.map((provider) => [
                provider.id,
                {
                    ...provider,
                    profile: suggestedProviders.find((p) => p.id === provider.id),
                }
            ])
        );

        const scoreProviderForRole = (providerId: string, role?: string) => {
            const provider = providerMap.get(providerId);
            if (!provider) {
                return 0;
            }
            const baseScore = provider.matchScore ?? 0;
            if (!role) {
                return baseScore;
            }
            const roleLower = role.toLowerCase();
            const skills = provider.profile?.skills ?? [];
            const hasRoleMatch = skills.some((skill) => (
                skill.toLowerCase().includes(roleLower) || roleLower.includes(skill.toLowerCase())
            ));
            return baseScore + (hasRoleMatch ? 50 : 0);
        };

        const sortedProviders = (role?: string) => {
            return [...selectedProviders]
                .sort((a, b) => scoreProviderForRole(b.id, role) - scoreProviderForRole(a.id, role));
        };

        const milestonesByProvider: Record<string, { title: string; amount: string }[]> = {};

        aiSuggestedMilestones.forEach((group) => {
            const providersByScore = sortedProviders(group.provider_role);
            if (providersByScore.length === 0) {
                return;
            }
            group.milestones.forEach((milestone, index) => {
                const provider = providersByScore[index % providersByScore.length];
                if (!milestonesByProvider[provider.id]) {
                    milestonesByProvider[provider.id] = [];
                }
                milestonesByProvider[provider.id].push({
                    title: milestone.title,
                    amount: String(milestone.amount),
                });
            });
        });

        return milestonesByProvider;
    }, [aiSuggestedMilestones, selectedProviders, suggestedProviders]);

    useEffect(() => {
        if (!isLongProject && Object.keys(providerMilestones).length > 0) {
            setProviderMilestones({});
            setAiSuggestedMilestones([]);
        }
    }, [isLongProject, providerMilestones]);

    useEffect(() => {
        if (aiSuggestedMilestones.length === 0) {
            return;
        }
        const hasAnyMilestones = Object.values(providerMilestones).some((milestones) => milestones.length > 0);
        if (hasAnyMilestones || selectedProviders.length === 0) {
            return;
        }
        setProviderMilestones(buildProviderMilestonesFromAi());
    }, [aiSuggestedMilestones, buildProviderMilestonesFromAi, providerMilestones, selectedProviders]);

    useEffect(() => {
        if (!isLongProject) {
            return;
        }

        const milestoneBudgets = Object.fromEntries(
            Object.entries(providerMilestones).map(([providerId, milestones]) => [
                providerId,
                milestones.reduce((sum, milestone) => sum + Number(milestone.amount || 0), 0),
            ])
        );

        setProviderBudgets(prevBudgets => ({
            ...prevBudgets,
            ...milestoneBudgets,
        }));
    }, [isLongProject, providerMilestones]);

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const githubRefreshHandled = useRef(false);
    const { data: categoriesData } = useMainCategories();
    const { data: servicesData } = useGetServicesGroupedByCategory();

    useEffect(() => {
        if (githubRefreshHandled.current || loading || userLoading || !user) {
            return;
        }

        const githubParamKeys = ['github', 'github_status', 'github_connected'];
        const hasGithubParam = githubParamKeys.some((key) => searchParams.has(key));
        if (!hasGithubParam) {
            return;
        }

        const rawValue =
            searchParams.get('github') ??
            searchParams.get('github_status') ??
            searchParams.get('github_connected');
        const normalizedValue = rawValue?.toLowerCase() ?? '';
        const shouldRefresh =
            !rawValue ||
            ['success', 'connected', 'true', '1'].includes(normalizedValue);

        if (!shouldRefresh) {
            return;
        }

        githubRefreshHandled.current = true;
        void (async () => {
            try {
                await refreshUser();
            } finally {
                router.replace(pathname);
            }
        })();
    }, [loading, userLoading, user, refreshUser, router, pathname, searchParams]);

    const skillLevels = useMemo(() => ([
        { value: 'JUNIOR', label: t('projects.new.skills.junior'), color: 'bg-green-100 text-green-800', icon: '🌱' },
        { value: 'MEDIU', label: t('projects.new.skills.medium'), color: 'bg-blue-100 text-blue-800', icon: '⚡' },
        { value: 'SENIOR', label: t('projects.new.skills.senior'), color: 'bg-purple-100 text-purple-800', icon: '🚀' },
        { value: 'EXPERT', label: t('projects.new.skills.expert'), color: 'bg-orange-100 text-orange-800', icon: '👑' }
    ]), [t]);

    const markedNamesSet = useMemo(() => {
        const names = [
            ...formData.technologies.map(t => t.name),
            ...generatedAiOutput.technologies.map((t: any) => t.name),
        ].filter(Boolean);

        return new Set(names);
    }, [formData.technologies, generatedAiOutput.technologies]);

    const filteredProviders = suggestedProviders.filter(provider => {
        const searchMatch = !providerSearchTerm ||
            provider.firstName.toLowerCase().includes(providerSearchTerm.toLowerCase()) ||
            provider.lastName.toLowerCase().includes(providerSearchTerm.toLowerCase()) ||
            provider.location.toLowerCase().includes(providerSearchTerm.toLowerCase()) ||
            provider.skills.some(skill => skill.toLowerCase().includes(providerSearchTerm.toLowerCase()));

        const serviceMatch = selectedServiceFilters.length === 0;

        // Apply skill level filter
        const skillLevelMatch = skillLevelFilter.length === 0 ||
            skillLevelFilter.includes(provider.level || 'MEDIU');

        return searchMatch && serviceMatch && skillLevelMatch;
    });

    // Pagination logic
    const indexOfLastProvider = currentPage * providersPerPage;
    const indexOfFirstProvider = indexOfLastProvider - providersPerPage;
    const currentProviders = filteredProviders.slice(indexOfFirstProvider, indexOfLastProvider);
    const totalPages = Math.ceil(filteredProviders.length / providersPerPage);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        // Scroll to providers section when changing page
        const providersSection = document.getElementById('suggested-providers');
        if (providersSection) {
            providersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [providerSearchTerm, selectedServiceFilters, skillLevelFilter]);

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.title.trim()) {
            newErrors.title = t('projects.new.errors.title_required');
        }
        if (!formData.description.trim()) {
            newErrors.lastName = t('projects.new.errors.description_required');
        }
        // if (!formData.visibility.trim()) {
        //     newErrors.visibility = 'Tipul proiect este obligatoriu';
        // }
        if (String(formData.budget).trim() === '') {
            newErrors.budget = t('projects.new.errors.budget_required');
        }
        if (!formData.budgetType.trim()) {
            newErrors.budgetType = t('projects.new.errors.budget_type_required');
        }
        if (!formData.deadline.trim()) {
            newErrors.deadline = t('projects.new.errors.deadline_required');
        }

        if (formData.technologies.length === 0) {
            newErrors.technologies = t('projects.new.errors.technologies_required');
        }

        if (isLongProject && selectedProviders.length > 0) {
            const hasMissingMilestones = selectedProviders.some((provider) => (
                !providerMilestones[provider.id] || providerMilestones[provider.id].length === 0
            ));
            if (hasMissingMilestones) {
                newErrors.milestones = t('projects.new.errors.milestones_required');
            } else {
                const hasInvalidMilestone = selectedProviders.some((provider) => (
                    (providerMilestones[provider.id] ?? []).some(
                        (milestone) => !milestone.title.trim() || Number(milestone.amount) <= 0
                    )
                ));
                if (hasInvalidMilestone) {
                    newErrors.milestones = t('projects.new.errors.milestones_incomplete');
                }
            }

            if (String(formData.budget).trim() !== '') {
                const milestoneTotal = getMilestoneTotal();
                if (milestoneTotal !== Number(formData.budget)) {
                    newErrors.milestoneTotal = t('projects.new.errors.milestone_total');
                }
            }

            const hasBudgetMismatch = selectedProviders.some((provider) => {
                const allocated = Number(providerBudgets[provider.id] ?? 0);
                if (allocated === 0) {
                    return false;
                }
                const providerTotal = (providerMilestones[provider.id] ?? []).reduce(
                    (sum, milestone) => sum + Number(milestone.amount || 0),
                    0
                );
                return providerTotal !== allocated;
            });
            if (hasBudgetMismatch) {
                newErrors.milestoneBudget = t('projects.new.errors.milestone_budget');
            }
        }

        // alte validări...
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSkillLevelFilterChange = (level: string, checked: boolean) => {
        setSkillLevelFilter(prev =>
            checked
                ? [...prev, level]
                : prev.filter(l => l !== level)
        );
    };

    // Load available services for filtering
    useEffect(() => {
        const loadAvailableServices = async () => {
            try {
                const response = await apiClient.getServices();
                setAvailableServices(response.services || []);
            } catch (error) {
                console.error('Failed to load services:', error);
            }
        };
        loadAvailableServices();
    }, []);

    useEffect(() => {
        if (userLoading) {
            return;
        }
        if (!loading && !user) {
            router.push('/auth/signin');
            return;
        }
        if (!user) {
            return;
        }

        const hasRoleData = (user?.roles?.length ?? 0) > 0 || Boolean(user?.role);
        const hasClientRole = hasRole(user, ['client']) || user?.role?.toLowerCase?.() === 'client';
        if (hasRoleData && !hasClientRole) {
            router.push('/dashboard');
        }
    }, [user, loading, router, userLoading]);

    const buildProviderMatchPayload = useCallback((): { service: string; level: string; role?: string; count?: number; estimated_cost?: number }[] => {
        if (formData.recommendedProviders.length > 0) {
            return formData.recommendedProviders.map(p => ({
                service: p.service,
                level: p.level || '',
                role: p.role || '',
                count: p.count || 1,
                estimated_cost: p.estimated_cost || 0,
            }));
        }

        return formData.technologies.map(t => ({
            service: t.name,
            level: '',
        }));
    }, [formData.recommendedProviders, formData.technologies]);

    const loadSuggestedProviders = useCallback(async () => {
        setLoadingProviders(true);
        try {
            const payload = buildProviderMatchPayload();

            const apiData = await apiClient.getSuggestedProviders(payload);
            const mapToSuggestedProviders = (users: any[]): SuggestedProvider[] => {
                return users.map(user => {
                    const skills = Array.isArray(user.skills) ? user.skills.filter(Boolean) : [];

                    return {
                        id: String(user.id),
                        firstName: user.firstName ?? '',
                        lastName: user.lastName ?? '',
                        avatar: user.avatar ?? '',
                        profileUrl: user.profileUrl ?? '',
                        rating: parseFloat(user.rating ?? '0'),
                        reviewCount: user.reviewCount ?? 0,
                        completedProjects: user.completedProjects ?? 0,
                        responseTime: user.responseTime ?? '—',
                        location: user.location ?? t('projects.new.providers.location_fallback'),
                        isVerified: Boolean(user.isVerified),
                        level: user.level ?? '—',
                        skills,
                        basePrice: user.basePrice ?? 0,
                        pricingType: user.pricingType ?? 'FIXED',
                        deliveryTime: user.deliveryTime ?? 14,
                        matchScore: user.matchScore ?? 0,
                        matchReasons: Array.isArray(user.matchReasons) ? user.matchReasons.filter(Boolean) : [],
                        availability: user.availability ?? '—',
                        lastActive: user.lastActive ?? '',
                    };
                });
            };

            const providers = mapToSuggestedProviders(apiData.providers);

            // Simulăm un delay pentru loading
            await new Promise(resolve => setTimeout(resolve, 1000));

            setSuggestedProviders(providers);
            setFoundSuggestedProvider(apiData.found);
        } catch (error: any) {
            setError(t('projects.new.errors.providers_load'));
        } finally {
            setLoadingProviders(false);
        }
    }, [buildProviderMatchPayload, t]);

    useEffect(() => {
        if (formData.serviceId && formData.technologies.length > 0) {
            loadSuggestedProviders();
        } else {
            setSuggestedProviders([]);
        }
    }, [formData.serviceId, formData.technologies, loadSuggestedProviders]);

    const handleTechnologyToggle = (techName: string, techId: string, requireRepo: boolean) => {
        setFormData(prev => {
            const exists = prev.technologies.some(t => t.name === techName && t.id === techId);

            return {
                ...prev,
                technologies: exists
                    ? prev.technologies.filter(t => !(t.name === techName && t.id === techId))
                    : [...prev.technologies, { id: techId, name: techName, require_repo: requireRepo }]
            };
        });
    };

    const addCustomTechnology = () => {
        if (newTechnology.trim() && !formData.technologies.some(t => t.name === newTechnology.trim())) {
            setFormData(prev => ({
                ...prev,
                technologies: [
                    ...prev.technologies,
                    { id: newTechnology.trim(), name: newTechnology.trim() }
                ]
            }));
            setNewTechnology('');
        }
    };

    const removeTechnology = (tech: TechnologySelected) => {
        setFormData(prev => ({
            ...prev,
            technologies: prev.technologies.filter(t => t.id !== tech.id)
        }));
    };

    const handleProviderSelect = (providerId: string, matchScore: number) => {
        setSelectedProviders(prev => {
            const exists = prev.find(p => p.id === providerId);
            if (exists) {
                // Removing provider - remove their budget
                setProviderBudgets(prevBudgets => {
                    const { [providerId]: removed, ...rest } = prevBudgets;
                    return rest;
                });
                setProviderMilestones(prevMilestones => {
                    const { [providerId]: removed, ...rest } = prevMilestones;
                    return rest;
                });
                return prev.filter(p => p.id !== providerId);
            } else {

                const newSelected = [...prev, { id: providerId, matchScore: matchScore }];
                setProviderBudgets(prevBudgets => ({
                    ...prevBudgets,
                    [providerId]: 0
                }));

                return newSelected;
            }
        });
    };

    const handleBudgetChange = (providerId: string, budget: number) => {
        setProviderBudgets(prev => ({
            ...prev,
            [providerId]: budget
        }));
    };

    const redistributeBudget = () => {
        if (selectedProviders.length === 0) return;

        const equalBudget = Math.floor(Number(formData.budget) / selectedProviders.length);
        const newBudgets: {[key: string]: number} = {};
        selectedProviders.forEach(provider => {
            newBudgets[provider.id] = equalBudget;
        });
        setProviderBudgets(newBudgets);
    };

    const getTotalAllocatedBudget = () => {
        return Object.values(providerBudgets).reduce((sum, budget) => sum + (budget || 0), 0);
    };

    const getRemainingBudget = () => {
        return Number(formData.budget) - getTotalAllocatedBudget();
    };

    const getMilestoneTotal = () => {
        return Object.values(providerMilestones).flat().reduce(
            (sum, milestone) => sum + Number(milestone.amount || 0),
            0
        );
    };

    const addProviderMilestone = (providerId: string) => {
        setProviderMilestones(prev => ({
            ...prev,
            [providerId]: [...(prev[providerId] ?? []), { title: '', amount: '' }],
        }));
    };

    const updateProviderMilestoneField = (
        providerId: string,
        index: number,
        field: 'title' | 'amount',
        value: string
    ) => {
        setProviderMilestones(prev => ({
            ...prev,
            [providerId]: (prev[providerId] ?? []).map((milestone, i) => (
                i === index ? { ...milestone, [field]: value } : milestone
            )),
        }));
    };

    const removeProviderMilestone = (providerId: string, index: number) => {
        setProviderMilestones(prev => ({
            ...prev,
            [providerId]: (prev[providerId] ?? []).filter((_, i) => i !== index),
        }));
    };

    const applyAiMilestonesToProviders = () => {
        if (aiSuggestedMilestones.length === 0 || selectedProviders.length === 0) {
            return;
        }
        setProviderMilestones(buildProviderMilestonesFromAi());
    };

    const getLastActiveText = (lastActiveAt: string): string => {
        const time = dayjs.utc(lastActiveAt);
        return `${time.fromNow()}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        setSkipValidation(false);
        e.preventDefault();

        if (!validate()) {
            setError(t('projects.new.errors.complete_required'));
            return;
        }

        if (selectedProviders.length === 0) {
            setError(t('projects.new.errors.select_provider'));
            return;
        }

        // Validate budget allocation
        const totalAllocated = getTotalAllocatedBudget();
        if (Math.abs(totalAllocated - Number(formData.budget)) > 1) {
            setError(t('projects.new.errors.budget_allocation'));
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const milestonesPayload = isLongProject
                ? selectedProviders.map((provider) => ({
                    providerId: Number(provider.id),
                    milestones: (providerMilestones[provider.id] ?? []).map((milestone) => ({
                        title: milestone.title.trim(),
                        amount: Number(milestone.amount),
                    })),
                }))
                : [];

            const projectData = {
                ...formData,
                budget: Number(formData.budget),
                selectedProviders,
                providerBudgets,
                clientId: user?.id,
                githubRepoConnected: !!user?.github_token,
                paymentPlan: isLongProject ? 'MILESTONE' : formData.paymentPlan,
                milestoneCount: isLongProject
                    ? milestonesPayload.reduce((sum, providerGroup) => sum + providerGroup.milestones.length, 0)
                    : 0,
                milestones: milestonesPayload,
            };

            const createdProject = await apiClient.createProject(projectData);

            // Send notifications to selected providers
            if (selectedProviders.length > 0) {
                try {
                    await apiClient.sendNotification({
                        userIds: selectedProviders.map(p => p.id),
                        title: t('projects.new.notifications.new_project_title'),
                        message: t('projects.new.notifications.new_project_message', {
                            title: formData.title,
                            budget: formData.budget,
                        }),
                        type: 'PROJECT_ADDED',
                        data: {
                            projectId: createdProject.id,
                            projectTitle: formData.title,
                            budget: formData.budget,
                            budgetType: formData.budgetType,
                            technologies: formData.technologies,
                            clientName: user?.firstName + ' ' + user?.lastName
                        }
                    });
                } catch (notificationError) {
                    console.error('Failed to send notifications:', notificationError);
                    // Don't fail the project creation if notifications fail
                }
            }

            // Simulăm crearea proiectului
            await new Promise(resolve => setTimeout(resolve, 2000));

            router.push('/dashboard?tab=projects&success=project-created');
        } catch (error: any) {
            setError(error.message || t('projects.new.errors.create_project'));
        } finally {
            setSubmitting(false);
        }
    };

    const getBudgetTypeLabel = (type: string) => {
        switch (type) {
            case 'FIXED': return t('projects.new.budget_types.fixed');
            case 'HOURLY': return t('projects.new.budget_types.hourly');
            case 'MILESTONE': return t('projects.new.budget_types.milestone');
            default: return type;
        }
    };

    const getAvailabilityStatus = (status: string) => {
        switch (status) {
            case 'AVAILABLE':
                return { color: 'bg-green-100 text-green-800', label: t('projects.new.availability.available'), icon: CheckCircle };
            case 'BUYS':
                return { color: 'bg-yellow-100 text-yellow-800', label: t('projects.new.availability.busy'), icon: Clock };
            case 'UNAVAILABLE':
                return { color: 'bg-red-100 text-red-800', label: t('projects.new.availability.unavailable'), icon: AlertCircle };
            default:
                return { color: 'bg-gray-100 text-gray-800', label: t('projects.new.availability.unknown'), icon: AlertCircle };
        }
    };


    const groupServicesByParentAndChild = (
        apiData: Record<string, Record<string, ServiceItem[]> | ServiceItem[]>
    ): GroupedServices => {
        const grouped: GroupedServices = {};

        Object.entries(apiData).forEach(([parentCategory, childOrServices]) => {
            if (Array.isArray(childOrServices)) {
                // Nu există subcategorii, grupăm direct sub parent
                grouped[parentCategory] = {
                    [parentCategory]: childOrServices,
                };
            } else {
                // Există subcategorii
                grouped[parentCategory] = {};

                Object.entries(childOrServices).forEach(([childCategory, services]) => {
                    grouped[parentCategory][childCategory] = services;
                });
            }
        });

        return grouped;
    };

    const groupedServices = groupServicesByParentAndChild(servicesData ?? []);

    const hasRequireRepo = (data: any): boolean => {
        if (Array.isArray(data)) {
            return data.some(item => hasRequireRepo(item));
        }

        if (typeof data === 'object' && data !== null) {
            if (data.require_repo === true) {
                return true;
            }

            return Object.values(data).some(value => hasRequireRepo(value));
        }

        return false;
    };


    const existsRequireRepo = hasRequireRepo(formData.technologies);

    const generateDescription = async () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.title.trim()) {
            newErrors.title = t('projects.new.errors.title_required');
        }
        if (!formData.description.trim()) {
            newErrors.description = t('projects.new.errors.description_required');
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length !== 0) return;

        setSkipValidation(true);
        setAiLoading(true);

        try {
            const generatedOutput = await apiClient.generateProjectInformation(formData);
            setGeneratedAiOutput(generatedOutput);
            setFormData(prev => ({
                ...prev,
                notes: generatedOutput.notes || '',
                recommendedProviders: generatedOutput.team_structure.map((member: any) => ({
                    role: member.role,
                    level: member.level,
                    service: member.service,
                    count: member.count ?? 0,
                    estimated_cost: member.estimated_cost
                })),
            }));
        } catch (e: any) {
            console.error ('Error generating AI output:', e);
        } finally {
            setAiLoading(false);
        }
    }

    const handleUseGeneratedField = (field: keyof FormData, generatedText: string | number) => {
        setSkipValidation(true);
        setFormData(prev => {
            if (field === 'budgetType') {
                const normalizedBudgetType: BudgetType = generatedText === 'HOURLY' ? 'HOURLY' : 'FIXED';
                return {
                    ...prev,
                    budgetType: normalizedBudgetType,
                };
            }

            return {
                ...prev,
                [field]: generatedText,
            };
        });
    }

    const handleUseGeneratedTechnologies = (technologies: string[]) => {
        setFormData(prev => {
            const existing = prev.technologies;

            const newTechs = technologies
                .filter((techName) => !existing.some(t => t.name.toLowerCase() === techName.toLowerCase()))
                .map((techName) => ({ id: techName, name: techName }));

            return {
                ...prev,
                technologies: [...existing, ...newTechs]
            };
        });
    };

    const handleUseGeneratedSuggestedTechnologies = (technologies: string[]) => {
        setFormData(prev => {
            const existing = prev.technologies;

            const newTechs = technologies
                .filter((techName) => !existing.some(t => t.name.toLowerCase() === techName.toLowerCase()))
                .map((techName) => ({ id: techName, name: techName }));

            return {
                ...prev,
                technologies: [...existing, ...newTechs]
            };
        });
    };

    const handleUseGeneratedMilestones = (milestones: { provider_role?: string; milestones: { title: string; amount: number }[] }[]) => {
        setAiSuggestedMilestones(milestones);
    };

    // const handleUpdateServicesByCategory = async (categoryId: string) => {
    //     const childrensAndServices = await apiClient.getServicesGroupedByCategory(categoryId);
    //     const test = await apiClient.getServicesGroupedByCategory();
    //
    //     console.log(test);
    //     const technologies: Technology[] = [];
    //     Object.entries(childrensAndServices).forEach(([categoryName, services]) => {
    //         (services as any[]).forEach((service) => {
    //             technologies.push({
    //                 id: String(service.id),
    //                 name: service.name,
    //                 category: categoryName,
    //             });
    //         });
    //     });
    //
    //     setAvailableTechnologies(technologies);
    //
    // }

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (aiLoading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <svg
                    className="animate-spin h-12 w-12 text-blue-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12" cy="12" r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                </svg>
                <p className="text-lg font-medium text-gray-700">{aiLoadingMessages[index]}</p>
            </div>

        );
    }

    if (!user || user?.roles?.some((r: any) => r.slug?.toLowerCase() !== 'client')) {
        return null;
    }


    return (
        <div className="min-h-screen bg-white text-[#0F172A] dark:bg-[#070C14] dark:text-[#E6EDF3]">
            <TrustoraThemeStyles />
            <Header />

            <main className="pt-24">
                <section className="px-6 pb-10 hero-gradient">
                    <div className="max-w-5xl mx-auto text-center">
                        <Badge className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[#0B1C2D] text-xs font-bold dark:bg-[#111B2D] dark:border-[#1E2A3D] dark:text-[#E6EDF3]">
                            <span className="text-[#1BC47D]">●</span> {t('projects.new.hero.badge')}
                        </Badge>
                        <h1 className="text-3xl lg:text-4xl font-bold mb-3 text-[#0B1C2D] dark:text-[#E6EDF3]">
                            {t('projects.new.hero.title')}
                        </h1>
                        <p className="text-base text-slate-600 max-w-3xl mx-auto dark:text-[#A3ADC2]">
                            {t('projects.new.hero.description')}
                        </p>
                    </div>
                </section>

                <section className="py-12 px-6 bg-[#F5F7FA] dark:bg-[#0B1220]">
                    <div className="max-w-6xl mx-auto">
                        {error && (
                            <Alert variant="destructive" className="mb-6">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-3 rounded-full border border-slate-200 bg-white p-1 shadow-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                                    <TabsTrigger
                                        value="details"
                                        className="rounded-full data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-[#0F2E25] dark:data-[state=active]:text-[#7BF1B8]"
                                    >
                                        {t('projects.new.tabs.details')}
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="providers"
                                        disabled={!formData.serviceId || formData.technologies.length === 0}
                                        className="rounded-full data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-[#0F2E25] dark:data-[state=active]:text-[#7BF1B8]"
                                    >
                                        {t('projects.new.tabs.providers')}
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="review"
                                        disabled={selectedProviders.length === 0}
                                        className="rounded-full data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-[#0F2E25] dark:data-[state=active]:text-[#7BF1B8]"
                                    >
                                        {t('projects.new.tabs.review')}
                                    </TabsTrigger>
                                </TabsList>

                        {/* Detalii Proiect */}
                        <TabsContent value="details" className="space-y-6">
                            <div className="grid xs:grid-cols-1 lg:grid-cols-[60%_40%] gap-6">
                                <div>
                                    <Card className="mb-6 glass-card shadow-sm">
                                        <CardHeader>
                                            <CardTitle className="flex items-center space-x-2">
                                                <FileText className="w-5 h-5" />
                                                <span>{t('projects.new.sections.general_info')}</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div>
                                                <Label className={errors.title ? "text-red-500" : ""} htmlFor="title">
                                                    {t('projects.new.fields.title')} <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    id="title"
                                                    className={errors.title ? "border-red-500 focus:ring-red-500" : ""}
                                                    value={formData.title}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                                    placeholder={t('projects.new.fields.title_placeholder')}
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <Label className={errors.description ? "text-red-500" : ""} htmlFor="description">
                                                    {t('projects.new.fields.description')} <span className="text-red-500">*</span>
                                                </Label>
                                                <Textarea
                                                    id="description"
                                                    className={errors.description ? "border-red-500 focus:ring-red-500" : ""}
                                                    value={formData.description}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                                    placeholder={t('projects.new.fields.description_placeholder')}
                                                    rows={5}
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="requirements">{t('projects.new.fields.requirements')}</Label>
                                                <Textarea
                                                    id="requirements"
                                                    value={formData.requirements}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
                                                    placeholder={t('projects.new.fields.requirements_placeholder')}
                                                    rows={3}
                                                />
                                            </div>

                                            <div className="grid xs:grid-cols-1 md:grid-cols-2 gap-4">
                                                {/*<div>*/}
                                                {/*    <Label htmlFor="serviceId">Categorie Serviciu *</Label>*/}
                                                {/*    <Select value={formData.serviceId} onValueChange={(value) => {*/}
                                                {/*        setFormData(prev => ({ ...prev, serviceId: value }));*/}
                                                {/*    }}>*/}
                                                {/*        <SelectTrigger>*/}
                                                {/*            <SelectValue placeholder="Selectează categoria" />*/}
                                                {/*        </SelectTrigger>*/}
                                                {/*        <SelectContent>*/}
                                                {/*            {(categoriesData || []).map((category: any) => (*/}
                                                {/*                <SelectItem key={category.id} value={String(category.id)}>*/}
                                                {/*                    {category.name}*/}
                                                {/*                </SelectItem>*/}
                                                {/*            ))}*/}
                                                {/*        </SelectContent>*/}
                                                {/*    </Select>*/}
                                                {/*</div>*/}

                                                {/*<div>*/}
                                                {/*    <Label className={errors.visibility ? "text-red-500" : ""} htmlFor="visibility">Tip <span className="text-red-500">*</span></Label>*/}
                                                {/*    <Select value={formData.visibility} onValueChange={(value) => setFormData(prev => ({ ...prev, visibility: value }))}>*/}
                                                {/*        <SelectTrigger className={errors.visibility ? "border-red-500 focus:ring-red-500" : ""}>*/}
                                                {/*            <SelectValue placeholder="Selecteaza vizibilitatea proiectului" />*/}
                                                {/*        </SelectTrigger>*/}
                                                {/*        <SelectContent>*/}
                                                {/*            <SelectItem value="PUBLIC">Public</SelectItem>*/}
                                                {/*            <SelectItem value="PRIVATE">Privat</SelectItem>*/}
                                                {/*            <SelectItem value="TEAM_ONLY">Doar echipe</SelectItem>*/}
                                                {/*        </SelectContent>*/}
                                                {/*    </Select>*/}
                                                {/*</div>*/}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="mb-6 glass-card shadow-sm">
                                        <CardHeader>
                                            <CardTitle className="flex items-center space-x-2">
                                                <Code className="w-5 h-5" />
                                                <span className={errors.technologies ? "text-red-500" : ""}>
                                                    {t('projects.new.technologies.title')}
                                                </span>
                                            </CardTitle>
                                            <CardDescription>
                                                {t('projects.new.technologies.description')}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            {formData.technologies.length > 0 && (
                                                <div>
                                                    <Label className={`mb-3 block ${errors.technologies ? "text-red-500" : ""}`}>
                                                        {t('projects.new.technologies.selected', { count: formData.technologies.length })}
                                                    </Label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {formData.technologies.map((tech) => (
                                                            <Badge key={tech.id} variant="default" className="flex items-center space-x-1">
                                                                <span>{tech.name}</span>
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
                                                <Label className={errors.technologies ? "text-red-500" : ""}>
                                                    {t('projects.new.technologies.add_custom')}
                                                </Label>
                                                <div className="flex space-x-2 mt-2">
                                                    <Input
                                                        value={newTechnology}
                                                        className={errors.firstName ? "border-red-500 focus:ring-red-500" : ""}
                                                        onChange={(e) => setNewTechnology(e.target.value)}
                                                        placeholder={t('projects.new.technologies.add_custom_placeholder')}
                                                        onKeyUp={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTechnology())}
                                                    />
                                                    <Button type="button" onClick={addCustomTechnology} variant="outline">
                                                        <Plus className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Tehnologii disponibile grupate */}
                                            <div className="space-y-6">
                                                {Object.entries(groupedServices).map(([parentCategory, childCategories]) => (
                                                    <div key={parentCategory}>
                                                        {/* Categoria părinte - text mai mare */}
                                                        <h2 className="text-lg font-bold text-primary mb-4">{parentCategory}</h2>

                                                        {/* Categorii copil */}
                                                        {Object.entries(childCategories).map(([childCategory, services]) => (
                                                            <div key={childCategory} className="mb-6">
                                                                {/* Categoria copil */}
                                                                <h3 className="text-md font-semibold text-custom-purple mb-2">{childCategory}</h3>

                                                                {/* Lista serviciilor */}
                                                                <div className="grid xs:grid-cols-2 md:grid-cols-4 gap-2">
                                                                    {services.map((service) => (
                                                                        <div key={service.id} className="flex items-center space-x-2">
                                                                            <Checkbox
                                                                                id={service.id}
                                                                                // checked={formData.technologies.some(t => t.id === service.id)}
                                                                                checked={markedNamesSet.has(service.name)}
                                                                                onCheckedChange={() => handleTechnologyToggle(service.name, service.id, service.require_repo)}
                                                                            />
                                                                            <Label htmlFor={service.id} className="text-sm cursor-pointer">
                                                                                {service.name}
                                                                            </Label>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>

                                        </CardContent>
                                    </Card>

                                    {existsRequireRepo && (
                                        <Card className="mb-6 glass-card shadow-sm">
                                            <CardHeader>
                                                <CardTitle className="flex items-center space-x-2">
                                                    <GithubIcon className="w-5 h-5" />
                                                    {t('projects.new.github.title')}
                                                </CardTitle>
                                                <CardDescription>
                                                    {t('projects.new.github.description')}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                <div className="space-y-6">
                                                <Label>
                                                    {t('projects.new.github.connect_label')}
                                                    <span className="block text-xs text-muted-foreground">
                                                        {t('projects.new.github.connect_description')}
                                                    </span>
                                                </Label>
                                                    <GithubConnect isConnected={!!user?.github_token} />
                                                </div>

                                                <div className="p-4 border rounded-lg bg-card">
                                                    <h3 className="font-semibold mb-4">{t('projects.new.github.repository_title')}</h3>
                                                    <RadioGroup
                                                        value={formData.githubRepoTarget}
                                                        onValueChange={(value) =>
                                                            setFormData(prev => ({ ...prev, githubRepoTarget: value as FormData['githubRepoTarget'] }))
                                                        }
                                                        className="mb-4"
                                                    >
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem value="platform" id="github-platform" />
                                                            <Label htmlFor="github-platform">
                                                                {t('projects.new.github.platform_repo')}
                                                                {/*<span className="block text-xs text-muted-foreground">*/}
                                                                {/*    Noi deținem repo-ul, tu ești colaborator.*/}
                                                                {/*</span>*/}
                                                            </Label>
                                                        </div>
                                                        <div className="flex items-center space-x-2 mt-2">
                                                            <RadioGroupItem
                                                                value="provider"
                                                                id="github-provider"
                                                                disabled={!user?.github_token}
                                                            />
                                                            <Label htmlFor="github-provider" className={!user?.github_token ? "opacity-50" : ""}>
                                                                {t('projects.new.github.provider_repo')}
                                                                {!user?.github_token && (
                                                                    <span className="block text-xs text-red-500">
                                                                        {t('projects.new.github.connect_first')}
                                                                </span>
                                                                )}
                                                            </Label>
                                                        </div>
                                                        <div className="flex items-center space-x-2 mt-2">
                                                            <RadioGroupItem
                                                                value="client"
                                                                id="github-client"
                                                                disabled={!user?.github_token}
                                                            />
                                                            <Label htmlFor="github-client" className={!user?.github_token ? "opacity-50" : ""}>
                                                                {t('projects.new.github.client_repo')}
                                                                {!user?.github_token && (
                                                                    <span className="block text-xs text-red-500">
                                                                        {t('projects.new.github.connect_first')}
                                                                </span>
                                                                )}
                                                            </Label>
                                                        </div>
                                                    </RadioGroup>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    <Card className="glass-card shadow-sm">
                                        <CardHeader>
                                            <CardTitle className="flex items-center space-x-2">
                                                <DollarSign className="w-5 h-5" />
                                                <span>{t('projects.new.budget.title')}</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div>
                                                <Label className={`mb-3 block ${errors.budgetType ? "text-red-500" : ""}`}>
                                                    {t('projects.new.budget.type_label')} <span className="text-red-500">*</span>
                                                </Label>
                                                <RadioGroup className={errors.budgetType ? "border-red-500 focus:ring-red-500" : ""}
                                                            value={formData.budgetType}
                                                            onValueChange={(value) => {
                                                                const normalizedBudgetType: BudgetType = value === 'HOURLY' ? 'HOURLY' : 'FIXED';
                                                                setFormData(prev => ({ ...prev, budgetType: normalizedBudgetType }));
                                                            }}>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="FIXED" id="fixed" />
                                                        <Label htmlFor="fixed">{t('projects.new.budget.fixed_label')}</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="HOURLY" id="hourly" />
                                                        <Label htmlFor="hourly">{t('projects.new.budget.hourly_label')}</Label>
                                                    </div>
                                                </RadioGroup>
                                            </div>

                                            <div className="grid xs:grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label className={errors.buget ? "text-red-500" : ""} htmlFor="budget">
                                                        {t('projects.new.budget.amount_label', {
                                                            suffix: formData.budgetType === 'HOURLY'
                                                                ? t('projects.new.budget.hourly_suffix')
                                                                : t('projects.new.budget.fixed_suffix'),
                                                        })}{' '}
                                                        <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Input
                                                        id="budget"
                                                        className={errors.buget ? "text-red-500" : ""}
                                                        type="number"
                                                        value={formData.budget}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                                                        placeholder={formData.budgetType === 'HOURLY'
                                                            ? t('projects.new.budget.hourly_placeholder')
                                                            : t('projects.new.budget.fixed_placeholder')}
                                                        required={!skipValidation}
                                                    />
                                                </div>

                                                <div>
                                                    <Label className={errors.deadline ? "text-red-500" : ""} htmlFor="deadline">
                                                        {t('projects.new.deadline.label')} <span className="text-red-500">*</span>
                                                    </Label>
                                                    <Select
                                                        value={formData.deadline}
                                                        onValueChange={(value) => setFormData(prev => ({ ...prev, deadline: value }))}
                                                    >
                                                        <SelectTrigger className={errors.deadline ? "border-red-500 focus:ring-red-500" : ""}>
                                                            <SelectValue placeholder={t('projects.new.deadline.placeholder')} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="1day">{t('projects.new.deadline.options.one_day')}</SelectItem>
                                                            <SelectItem value="1week">{t('projects.new.deadline.options.one_week')}</SelectItem>
                                                            <SelectItem value="2weeks">{t('projects.new.deadline.options.two_weeks')}</SelectItem>
                                                            <SelectItem value="3weeks">{t('projects.new.deadline.options.three_weeks')}</SelectItem>
                                                            <SelectItem value="1month">{t('projects.new.deadline.options.one_month')}</SelectItem>
                                                            <SelectItem value="3months">{t('projects.new.deadline.options.three_months')}</SelectItem>
                                                            <SelectItem value="6months">{t('projects.new.deadline.options.six_months')}</SelectItem>
                                                            <SelectItem value="1year">{t('projects.new.deadline.options.one_year')}</SelectItem>
                                                            <SelectItem value="1plusyear">{t('projects.new.deadline.options.one_plus_year')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>

                                        </CardContent>
                                    </Card>
                                </div>
                                <div>
                                    <Card className="glass-card shadow-sm">
                                        <CardHeader>
                                            <CardTitle className="flex items-center space-x-2">
                                                <AutoAwesomeIcon className="w-5 h-5" />
                                                <span>{t('projects.new.ai.title')}</span>
                                            </CardTitle>
                                            <CardDescription className="flex items-center space-x-2">
                                                {t('projects.new.ai.description')}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            {generatedAiOutput.title.trim() && (
                                                <h2 className="font-bold">{t('projects.new.ai.suggested')}</h2>
                                            )}
                                            {generatedAiOutput?.title.trim() && (
                                                <>
                                                    <div>
                                                        <span className="text-sm text-black font-bold">{t('projects.new.ai.fields.title')}</span> {generatedAiOutput?.title}
                                                    </div>
                                                    <a className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 rounded-md px-3 w-full cursor-pointer" onClick={() => handleUseGeneratedField('title', generatedAiOutput?.title)}>
                                                        <TitleIcon />
                                                        {t('projects.new.ai.actions.use_title')}
                                                    </a>
                                                </>
                                            )}

                                            {generatedAiOutput?.description.trim() && (
                                                <>
                                                    <div>
                                                        <span className="text-sm text-black font-bold">{t('projects.new.ai.fields.description')}</span> {generatedAiOutput?.description}
                                                    </div>
                                                    <a className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 rounded-md px-3 w-full cursor-pointer"
                                                       onClick={() => handleUseGeneratedField('description', generatedAiOutput?.description)}>
                                                        <DescriptionIcon />
                                                        {t('projects.new.ai.actions.use_description')}
                                                    </a>
                                                </>
                                            )}

                                            {generatedAiOutput?.technologies.length > 0 && (
                                                <>
                                                    <div>
                                                        <span className="text-sm text-black font-bold">{t('projects.new.ai.fields.technologies')}</span>
                                                        <ul className="ml-6 list-disc">
                                                            {generatedAiOutput?.technologies.map((tech, index) => (
                                                                <li key={index}>{tech}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <a className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 rounded-md px-3 w-full cursor-pointer"
                                                       onClick={() => handleUseGeneratedTechnologies(generatedAiOutput.technologies)}>
                                                        <AddCircleIcon />
                                                        {t('projects.new.ai.actions.use_technologies')}
                                                    </a>
                                                </>
                                            )}

                                            {generatedAiOutput?.additional_services.length > 0 && (
                                                <>
                                                    <div>
                                                        <span className="text-sm text-black font-bold">{t('projects.new.ai.additional_services_label')}</span>
                                                        <ul className="ml-6 list-disc">
                                                            {generatedAiOutput?.additional_services.map((tech, index) => (
                                                                <li key={index}>{tech}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <a className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 rounded-md px-3 w-full cursor-pointer"
                                                       onClick={() => handleUseGeneratedSuggestedTechnologies(generatedAiOutput.additional_services)}>
                                                        <AddCircleIcon />
                                                        {t('projects.new.ai.actions.add_additional_services')}
                                                    </a>
                                                </>
                                            )}

                                            {generatedAiOutput?.team_structure.length > 0 && (
                                                <div>
                                                    <span className="text-sm text-black font-bold">{t('projects.new.ai.fields.team_structure')}</span>
                                                    {generatedAiOutput?.team_structure.map((team, index) => {
                                                        const typedTeam = team as { role: string; level: string; count: number; estimated_cost: number };
                                                        return (
                                                            <div key={index}>
                                                                <span className="text-sm text-black font-bold">{t('projects.new.ai.fields.role')}</span>{' '}
                                                                {typedTeam.role} - {typedTeam.count} {typedTeam.count === 1 ? t('projects.new.ai.people.singular') : t('projects.new.ai.people.plural')} - {t('projects.new.ai.fields.level')} {typedTeam.level} - {typedTeam.estimated_cost} {currencyLabel} {t('projects.new.ai.fields.estimated')}
                                                            </div>
                                                        );
                                                    })}

                                                </div>
                                            )}

                                            {generatedAiOutput.deadline.trim() && (
                                                <>
                                                    <div>
                                                        <span className="text-sm text-black font-bold">{t('projects.new.ai.fields.deadline')}</span> {formatDeadline(generatedAiOutput?.deadline, locale)}
                                                    </div>
                                                    <a className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 rounded-md px-3 w-full cursor-pointer" onClick={() => handleUseGeneratedField('deadline', generatedAiOutput?.deadline)}>
                                                        <AccessTimeFilledIcon />
                                                        {t('projects.new.ai.actions.use_deadline')}
                                                    </a>
                                                </>
                                            )}

                                            {generatedAiOutput?.estimated_budget !== 0 && (
                                                <>
                                                    <div>
                                                        <span className="text-sm text-black font-bold">{t('projects.new.ai.fields.estimated_budget')}</span> {generatedAiOutput?.estimated_budget} {getBudgetTypeLabel(generatedAiOutput?.budget_type)}
                                                    </div>
                                                    <a className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 rounded-md px-3 w-full cursor-pointer"
                                                       onClick={() => {
                                                           handleUseGeneratedField('budget', generatedAiOutput?.estimated_budget);
                                                           handleUseGeneratedField('budgetType', generatedAiOutput?.budget_type || 'FIXED');
                                                       }}>
                                                        <EuroIcon />
                                                        {t('projects.new.ai.actions.use_budget')}
                                                    </a>
                                                </>
                                            )}

                                            {(generatedAiOutput?.payment_plan || generatedAiOutput?.milestone_count !== 0) && (
                                                    <div>
                                                        <span className="text-sm text-black font-bold">{t('projects.new.ai.fields.payment_plan')}</span>
                                                        {generatedAiOutput?.payment_plan || t('projects.new.ai.fields.unspecified')}
                                                    {generatedAiOutput?.milestone_count
                                                        ? t('projects.new.ai.milestone_count', { count: generatedAiOutput.milestone_count })
                                                        : ''}
                                                    </div>
                                            )}

                                            {(generatedAiOutput?.milestones?.length ?? 0) > 0 && (
                                                <>
                                                    <div>
                                                        <span className="text-sm text-black font-bold">{t('projects.new.ai.fields.milestones')}</span>
                                                        <ul className="ml-6 list-disc">
                                                            {(generatedAiOutput?.milestones ?? []).map((group: { provider_role?: string; milestones: { title: string; amount: number }[] }, index: number) => (
                                                                <li key={index}>
                                                                    {group.provider_role ? `${group.provider_role}: ` : ''}
                                                                    {group.milestones.map((milestone, milestoneIndex) => (
                                                                        <span key={milestoneIndex}>
                                                                            {t('projects.new.ai.milestone_item', {
                                                                                title: milestone.title,
                                                                                amount: milestone.amount,
                                                                                currency: currencyLabel,
                                                                            })}
                                                                            {milestoneIndex < group.milestones.length - 1 ? ', ' : ''}
                                                                        </span>
                                                                    ))}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <a className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 rounded-md px-3 w-full cursor-pointer"
                                                       onClick={() => handleUseGeneratedMilestones(generatedAiOutput.milestones ?? [])}>
                                                        <AddCircleIcon />
                                                        {t('projects.new.ai.actions.use_milestones')}
                                                    </a>
                                                </>
                                            )}

                                            {(generatedAiOutput?.notes ?? '').trim() && (
                                                <div>
                                                    <span className="text-sm text-black font-bold">{t('projects.new.ai.fields.note')}</span> {generatedAiOutput.notes ?? ''}
                                                </div>
                                            )}

                                            <div className="col-span-2">
                                                <Button size="sm" className="w-full" type="button" onClick={() => generateDescription()}>
                                                    <AutoAwesomeIcon className="w-4 h-4 me-2" />
                                                    {t('projects.new.ai.actions.improve_description')}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button
                                    type="button"
                                    onClick={() => {
                                        if (!validate()) return;
                                        setActiveTab('providers');
                                        loadSuggestedProviders();
                                    }}
                                    disabled={formData.technologies.length === 0}
                                    className="px-8"
                                >
                                    {t('projects.new.actions.continue_to_providers')}
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </TabsContent>

                        {/* Prestatori Sugerați */}
                        <TabsContent value="providers" className="space-y-6">
                            <Card id="suggested-providers" className="glass-card shadow-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Users className="w-5 h-5" />
                                        <span>{t('projects.new.providers.title')}</span>
                                        <Badge variant="outline">
                                            {t('projects.new.providers.count', {
                                                count: filteredProviders.length,
                                                currentPage,
                                                totalPages,
                                            })}
                                        </Badge>
                                    </CardTitle>
                                    <CardDescription>
                                        {t('projects.new.providers.subtitle')}<br />
                                        <span className="text-red-500 font-bold">
                                            {!foundSuggestedProvider ? t('projects.new.providers.no_suggestions') : ''}
                                        </span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {loadingProviders ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="text-center">
                                                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                                                <p className="text-muted-foreground">{t('projects.new.providers.loading')}</p>
                                            </div>
                                        </div>
                                    ) : suggestedProviders.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                            <h3 className="text-lg font-medium mb-2">{t('projects.new.providers.empty_title')}</h3>
                                            <p className="text-muted-foreground">
                                                {t('projects.new.providers.empty_description')}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {/* Search and Filter Bar */}
                                            <div className="mb-6 space-y-4">
                                                <div className="flex flex-col md:flex-row gap-4">
                                                    {/* Search Bar */}
                                                    <div className="flex-1">
                                                        <div className="relative">
                                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                                            <Input
                                                                placeholder={t('projects.new.providers.search_placeholder')}
                                                                value={providerSearchTerm}
                                                                onChange={(e) => setProviderSearchTerm(e.target.value)}
                                                                className="pl-10"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Service Filter Dropdown */}
                                                    <div className="md:w-64">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="outline" className="w-full justify-between">
                                                                    <div className="flex items-center space-x-2">
                                                                        <Filter className="w-4 h-4" />
                                                                        <span>
                                                                            {selectedServiceFilters.length === 0
                                                                                ? t('projects.new.providers.filters.services')
                                                                                : t('projects.new.providers.filters.services_count', { count: selectedServiceFilters.length })
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                    <ChevronDown className="w-4 h-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent className="w-64 max-h-64 overflow-y-auto">
                                                                <div className="p-2 max-h-80 overflow-y-auto">
                                                                    <div className="text-sm font-medium mb-2">{t('projects.new.providers.filters.services_label')}</div>
                                                                    {availableServices.map((service) => (
                                                                        <div key={service.id} className="flex items-center space-x-2 py-1">
                                                                            <Checkbox
                                                                                id={`service-${service.id}`}
                                                                                checked={selectedServiceFilters.includes(service.id)}
                                                                                onCheckedChange={(checked) => {
                                                                                    if (checked) {
                                                                                        setSelectedServiceFilters(prev => [...prev, service.id]);
                                                                                    } else {
                                                                                        setSelectedServiceFilters(prev => prev.filter(id => id !== service.id));
                                                                                    }
                                                                                }}
                                                                            />
                                                                            <label
                                                                                htmlFor={`service-${service.id}`}
                                                                                className="text-sm cursor-pointer flex-1"
                                                                            >
                                                                                {service.name}
                                                                            </label>
                                                                        </div>
                                                                    ))}
                                                                    {availableServices.length === 0 && (
                                                                        <div className="text-sm text-muted-foreground py-2">
                                                                            {t('projects.new.providers.filters.no_services')}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {selectedServiceFilters.length > 0 && (
                                                                    <div className="border-t p-2">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => setSelectedServiceFilters([])}
                                                                            className="w-full text-xs"
                                                                        >
                                                                            <X className="w-3 h-3 mr-1" />
                                                                            {t('projects.new.providers.filters.reset')}
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>

                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="outline" className="min-w-40">
                                                                <Target className="w-4 h-4 mr-2" />
                                                                {skillLevelFilter.length > 0
                                                                    ? t('projects.new.providers.filters.levels_count', { count: skillLevelFilter.length })
                                                                    : t('projects.new.providers.filters.levels')}
                                                                <ChevronDown className="w-4 h-4 ml-2" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent className="w-64 max-h-64 overflow-y-auto">
                                                            <div className="p-2">
                                                                <div className="text-sm font-medium mb-2">{t('projects.new.providers.filters.levels_label')}</div>
                                                                {skillLevels.map(level => (
                                                                    <div key={level.value} className="flex items-center space-x-2 py-1">
                                                                        <Checkbox
                                                                            id={`skill-${level.value}`}
                                                                            checked={skillLevelFilter.includes(level.value)}
                                                                            onCheckedChange={(checked) =>
                                                                                handleSkillLevelFilterChange(level.value, checked as boolean)
                                                                            }
                                                                        />
                                                                        <label
                                                                            htmlFor={`skill-${level.value}`}
                                                                            className="flex items-center space-x-2 cursor-pointer flex-1"
                                                                        >
                                                                            <span>{level.icon}</span>
                                                                            <span className="text-sm">{level.label}</span>
                                                                        </label>
                                                                    </div>
                                                                ))}
                                                                {skillLevelFilter.length > 0 && (
                                                                    <div className="pt-2 mt-2 border-t">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => setSkillLevelFilter([])}
                                                                            className="w-full text-xs"
                                                                        >
                                                                            {t('projects.new.providers.filters.reset_levels')}
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>

                                                {/* Active Filters Display */}
                                                {(providerSearchTerm || selectedServiceFilters.length > 0 || skillLevelFilter.length > 0) && (
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-sm text-muted-foreground">{t('projects.new.providers.filters.active')}</span>

                                                        {providerSearchTerm && (
                                                            <Badge variant="secondary" className="flex items-center space-x-1">
                                                                <Search className="w-3 h-3" />
                                                                <span>&#34;{providerSearchTerm}&#34;</span>
                                                                <button
                                                                    onClick={() => setProviderSearchTerm('')}
                                                                    className="ml-1 hover:text-red-500"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </Badge>
                                                        )}

                                                        {selectedServiceFilters.map(serviceId => {
                                                            const service = availableServices.find(s => s.id === serviceId);
                                                            return service ? (
                                                                <Badge key={serviceId} variant="outline" className="flex items-center space-x-1">
                                                                    <span>{service.name}</span>
                                                                    <button
                                                                        onClick={() => setSelectedServiceFilters(prev => prev.filter(id => id !== serviceId))}
                                                                        className="ml-1 hover:text-red-500"
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                </Badge>
                                                            ) : null;
                                                        })}

                                                        {skillLevelFilter.map(level => {
                                                            const levelInfo = skillLevels.find(l => l.value === level);
                                                            return (
                                                                <Badge key={level} variant="secondary" className="flex items-center space-x-1">
                                                                    <span>{levelInfo?.icon}</span>
                                                                    <span>{levelInfo?.label}</span>
                                                                    <button
                                                                        onClick={() => setSkillLevelFilter(prev => prev.filter(l => l !== level))}
                                                                        className="ml-1 hover:text-red-500"
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                </Badge>
                                                            );
                                                        })}

                                                        {(providerSearchTerm || selectedServiceFilters.length > 0 || skillLevelFilter.length > 0) && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setProviderSearchTerm('');
                                                                    setSelectedServiceFilters([]);
                                                                    setSkillLevelFilter([]);
                                                                }}
                                                                className="text-xs h-6"
                                                            >
                                                                {t('projects.new.providers.filters.reset_all')}
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {currentProviders.length === 0 ? (
                                                <div className="text-center py-8">
                                                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                                    <h3 className="text-lg font-medium mb-2">{t('projects.new.providers.none_title')}</h3>
                                                    <p className="text-muted-foreground mb-4">
                                                        {filteredProviders.length === 0
                                                            ? t('projects.new.providers.none_description')
                                                            : t('projects.new.providers.none_page')
                                                        }
                                                    </p>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => {
                                                            setProviderSearchTerm('');
                                                            setSelectedServiceFilters([]);
                                                            setSkillLevelFilter([]);
                                                            setCurrentPage(1);
                                                        }}
                                                    >
                                                        {t('projects.new.providers.filters.reset_filters')}
                                                    </Button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="grid xs:grid-cols-1 lg:grid-cols-2 gap-6">
                                                        {currentProviders.map((provider) => {
                                                            const passedReasons = provider.matchReasons.filter(reason => reason.passed);
                                                            const failedReasons = provider.matchReasons.filter(reason => !reason.passed);
                                                            const availabilityStatus = getAvailabilityStatus(provider.availability);
                                                            return (
                                                                <Card
                                                                    key={provider.id}
                                                                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                                                                        selectedProviders.some(p => p.id === provider.id)
                                                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 shadow-md'
                                                                            : 'border-gray-200 hover:border-blue-300'
                                                                    }`}
                                                                    onClick={() => handleProviderSelect(provider.id, provider.matchScore)}
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
                                                                                        {provider.isVerified && (
                                                                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                                                                        )}
                                                                                        <Badge className={
                                                                                            skillLevels.find(l => l.value === (provider.level || 'MEDIU'))?.color ||
                                                                                            'bg-blue-100 text-blue-800'
                                                                                        }>
                                                                                            {skillLevels.find(l => l.value === (provider.level || 'MEDIU'))?.icon}&nbsp;
                                                                                            {skillLevels.find(l => l.value === (provider.level || 'MEDIU'))?.label || t('projects.new.providers.level_default')}
                                                                                        </Badge>
                                                                                    </div>
                                                                                    <div className="flex items-center space-x-1 text-sm text-muted-foreground mb-2">
                                                                                        <Badge className="bg-green-100 text-green-800">
                                                                                            {t('projects.new.providers.match_score', { score: provider.matchScore })}
                                                                                        </Badge>
                                                                                        {provider.isVerified && (
                                                                                            <Badge className="bg-blue-100 text-blue-800">
                                                                                                {t('projects.new.providers.verified')}
                                                                                            </Badge>
                                                                                        )}
                                                                                    </div>

                                                                                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                                                                                        <div className="flex items-center space-x-1">
                                                                                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                                                            <span className="font-medium">{provider.rating}</span>
                                                                                            <span>({t('projects.new.providers.reviews', { count: provider.reviewCount })})</span>
                                                                                        </div>
                                                                                        <div className="flex items-center space-x-1">
                                                                                            <MapPin className="w-4 h-4" />
                                                                                            <span>{provider.location}</span>
                                                                                        </div>
                                                                                        <div className="flex items-center space-x-1">
                                                                                            <Clock className="w-4 h-4" />
                                                                                            <span>
                                                                                                {t('projects.new.providers.response_time', {
                                                                                                    time: provider.responseTime,
                                                                                                    unit: provider.responseTime === "1"
                                                                                                        ? t('projects.new.providers.hour_singular')
                                                                                                        : t('projects.new.providers.hour_plural'),
                                                                                                })}
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>

                                                                                    <div className="flex flex-wrap gap-1 mb-3">
                                                                                        {provider.skills.map((skill, index) =>
                                                                                            index < 4 ? (
                                                                                                <Badge key={skill} variant="outline" className="text-xs">
                                                                                                    {skill}
                                                                                                </Badge>
                                                                                            ) : null
                                                                                        )}
                                                                                        {provider.skills.length > 4 && (
                                                                                            <Badge variant="outline" className="text-xs">
                                                                                                +{provider.skills.length - 4}
                                                                                            </Badge>
                                                                                        )}
                                                                                    </div>

                                                                                    <div className="space-y-1">
                                                                                        {/*<div className="text-sm font-medium text-green-600">*/}
                                                                                        {/*    De ce este potrivit:*/}
                                                                                        {/*</div>*/}
                                                                                        <div className="grid xs:grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                                                                            {/* Coloana 1: Passed */}
                                                                                            <div>
                                                                                                <h4 className="text-sm font-medium text-green-600 mb-2">{t('projects.new.providers.why_fit')}</h4>
                                                                                                <ul className="text-sm text-muted-foreground space-y-1">
                                                                                                    {passedReasons.map((reason, index) => (
                                                                                                        <li key={`passed-${index}`} className="flex items-center space-x-2">
                                                                                                            <CheckCircle className="w-3 h-3 text-green-500" />
                                                                                                            <span className="text-green-600">{reason.message}</span>
                                                                                                        </li>
                                                                                                    ))}
                                                                                                </ul>
                                                                                            </div>

                                                                                            {/* Coloana 2: Nepotriviri */}
                                                                                            <div>
                                                                                                <ul className="text-sm text-muted-foreground space-y-1">
                                                                                                    {failedReasons.map((reason, index) => (
                                                                                                        <li key={`failed-${index}`} className="flex items-center space-x-2">
                                                                                                            <BadgeAlert className="w-3 h-3 text-red-500" />
                                                                                                            <span className="text-red-600">{reason.message}</span>
                                                                                                        </li>
                                                                                                    ))}
                                                                                                </ul>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            <div className="text-right space-y-2">
                                                                                {/*<div className="text-sm text-muted-foreground">*/}
                                                                                {/*    {provider.pricingType === 'FIXED' ? 'Preț fix' : 'Negociabil'}*/}
                                                                                {/*</div>*/}
                                                                                {/*<div className="text-sm">*/}
                                                                                {/*    <div className="flex items-center space-x-1 justify-end">*/}
                                                                                {/*        <Calendar className="w-3 h-3" />*/}
                                                                                {/*        <span>{provider.deliveryTime} zile</span>*/}
                                                                                {/*    </div>*/}
                                                                                {/*</div>*/}

                                                                                <div className={`flex items-center justify-end space-x-2 mb-3`}>
                                                                                    <Badge className={`${availabilityStatus.color}`}>
                                                                                        {
                                                                                            (() => {
                                                                                                const Icon = availabilityStatus.icon;
                                                                                                return <Icon className="mr-1 w-4 h-4" />;
                                                                                            })()
                                                                                        }
                                                                                        {availabilityStatus.label}
                                                                                    </Badge>

                                                                                </div>
                                                                                <div className="text-xs text-muted-foreground">
                                                                                    {t('projects.new.providers.active')} {getLastActiveText(provider.lastActive)}
                                                                                </div>

                                                                                <div className="flex space-x-2 mt-4">
                                                                                    <a href={`/provider/${provider.profileUrl}`} target="_blank"
                                                                                       className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3"
                                                                                    >
                                                                                        <Eye className="w-3 h-3 mr-1" />
                                                                                        {t('projects.new.providers.profile')}
                                                                                    </a>
                                                                                    <a
                                                                                        className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3"
                                                                                    >
                                                                                        <MessageSquare className="w-3 h-3 mr-1" />
                                                                                        {t('projects.new.providers.message')}
                                                                                    </a>
                                                                                </div>

                                                                            </div>
                                                                        </div>

                                                                    </CardContent>
                                                                </Card>
                                                            );})}
                                                    </div>

                                                    {/* Pagination */}
                                                    {totalPages > 1 && (
                                                        <div className="flex items-center justify-between pt-6 border-t">
                                                            <div className="text-sm text-muted-foreground">
                                                                {t('projects.new.providers.pagination', {
                                                                    start: indexOfFirstProvider + 1,
                                                                    end: Math.min(indexOfLastProvider, filteredProviders.length),
                                                                    total: filteredProviders.length,
                                                                })}
                                                            </div>

                                                            <div className="flex items-center space-x-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handlePageChange(currentPage - 1)}
                                                                    disabled={currentPage === 1}
                                                                    className="flex items-center space-x-1"
                                                                >
                                                                    <ArrowLeft className="w-4 h-4" />
                                                                    <span>{t('projects.new.pagination.previous')}</span>
                                                                </Button>

                                                                <div className="flex items-center space-x-1">
                                                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                                                        // Show first page, last page, current page, and pages around current
                                                                        const showPage = page === 1 ||
                                                                            page === totalPages ||
                                                                            Math.abs(page - currentPage) <= 1;

                                                                        if (!showPage && page === 2 && currentPage > 4) {
                                                                            return <span key={page} className="px-2 text-muted-foreground">...</span>;
                                                                        }

                                                                        if (!showPage && page === totalPages - 1 && currentPage < totalPages - 3) {
                                                                            return <span key={page} className="px-2 text-muted-foreground">...</span>;
                                                                        }

                                                                        if (!showPage) return null;

                                                                        return (
                                                                            <Button
                                                                                key={page}
                                                                                variant={currentPage === page ? "default" : "outline"}
                                                                                size="sm"
                                                                                onClick={() => handlePageChange(page)}
                                                                                className="w-8 h-8 p-0"
                                                                            >
                                                                                {page}
                                                                            </Button>
                                                                        );
                                                                    })}
                                                                </div>

                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handlePageChange(currentPage + 1)}
                                                                    disabled={currentPage === totalPages}
                                                                    className="flex items-center space-x-1"
                                                                >
                                                                    <span>{t('projects.new.pagination.next')}</span>
                                                                    <ArrowRight className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {selectedProviders.length > 0 && (
                                        <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                                <span className="font-medium text-green-800 dark:text-green-200">
                                                    {t('projects.new.providers.selected_count', {
                                                        count: selectedProviders.length,
                                                    })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-green-700 dark:text-green-300">
                                                {t('projects.new.providers.selected_message')}
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
                                    {t('projects.new.actions.back_to_details')}
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => setActiveTab('review')}
                                    disabled={selectedProviders.length === 0}
                                    className="btn-primary px-8"
                                >
                                    {t('projects.new.actions.review_final')}
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </TabsContent>

                        {/* Revizuire și Trimitere */}
                        <TabsContent value="review" className="space-y-6">
                            <Card className="glass-card shadow-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Target className="w-5 h-5" />
                                        <span>{t('projects.new.review.title')}</span>
                                    </CardTitle>
                                    <CardDescription>
                                        {t('projects.new.review.subtitle')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Rezumat proiect */}
                                    <div className="grid xs:grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="font-semibold mb-2">{t('projects.new.review.details_title')}</h4>
                                                <div className="space-y-2 text-sm">
                                                    <div><strong>{t('projects.new.review.labels.title')}</strong> {formData.title}</div>
                                                    <div><strong>{t('projects.new.review.labels.category')}</strong> {categoriesData?.find((c: { id: string; name: string }) => c.id === formData.serviceId)?.name}</div>
                                                    <div><strong>{t('projects.new.review.labels.budget')}</strong> {formData.budget.toLocaleString()} {currencyLabel} ({getBudgetTypeLabel(formData.budgetType)})</div>
                                                    <div><strong>{t('projects.new.review.labels.platform_fee')}</strong> {(Number(formData.budget ?? 0) * 12/100).toLocaleString()} {currencyLabel}</div>
                                                    <div><strong>{t('projects.new.review.labels.total')}</strong> {(Number(formData.budget ?? 0) + (Number(formData.budget ?? 0) * 12/100)).toLocaleString()} {currencyLabel}</div>
                                                    {formData.deadline && (
                                                        <div><strong>{t('projects.new.review.labels.deadline')}</strong> {formatDeadline(formData.deadline, locale)}</div>
                                                    )}
                                                    {/*<div>*/}
                                                    {/*    <strong>Tip proiect:</strong>*/}
                                                    {/*    <Badge className={`ml-2 ${getVisibilityBadge(formData.visibility as Visibility)}`}>*/}
                                                    {/*        {formData.visibility}*/}
                                                    {/*    </Badge>*/}
                                                    {/*</div>*/}
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="font-semibold mb-2">{t('projects.new.review.technologies_title', { count: formData.technologies.length })}</h4>
                                                <div className="flex flex-wrap gap-1">
                                                    {formData.technologies.map((tech) => (
                                                        <Badge key={tech.id} variant="outline" className="text-xs">
                                                            {tech.name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-lg font-semibold">{t('projects.new.review.selected_providers_title', { count: selectedProviders.length })}</h3>
                                                    <div className="flex items-center space-x-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={redistributeBudget}
                                                            disabled={selectedProviders.length === 0}
                                                        >
                                                            <DollarSign className="w-4 h-4 mr-1" />
                                                            {t('projects.new.review.split_evenly')}
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Budget Summary */}
                                                <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                                                    <CardContent className="p-4">
                                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                                            <div>
                                                                <div className="font-medium text-blue-900 dark:text-blue-100">{t('projects.new.review.budget_summary.total')}</div>
                                                                <div className="text-lg font-bold text-blue-600">{Number(formData.budget).toLocaleString()} {currencyLabel}</div>
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-green-900 dark:text-green-100">{t('projects.new.review.budget_summary.allocated')}</div>
                                                                <div className="text-lg font-bold text-green-600">{getTotalAllocatedBudget().toLocaleString()} {currencyLabel}</div>
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-orange-900 dark:text-orange-100">{t('projects.new.review.budget_summary.remaining')}</div>
                                                                <div className={`text-lg font-bold ${getRemainingBudget() === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                                                                    {getRemainingBudget().toLocaleString()} {currencyLabel}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {getRemainingBudget() !== 0 && (
                                                            <Alert className="mt-3 border-orange-200 bg-orange-50">
                                                                <AlertCircle className="h-4 w-4" />
                                                                <AlertDescription className="text-orange-800">
                                                                    {getRemainingBudget() > 0
                                                                        ? t('projects.new.review.budget_remaining_positive', {
                                                                            amount: getRemainingBudget().toLocaleString(),
                                                                            currency: currencyLabel,
                                                                        })
                                                                        : t('projects.new.review.budget_remaining_negative', {
                                                                            amount: Math.abs(getRemainingBudget()).toLocaleString(),
                                                                            currency: currencyLabel,
                                                                        })
                                                                    }
                                                                </AlertDescription>
                                                            </Alert>
                                                        )}
                                                    </CardContent>
                                                </Card>

                                                {isLongProject && (
                                                    <Card className="border-slate-200 bg-white dark:bg-slate-900/30">
                                                        <CardHeader>
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <CardTitle className="text-base">{t('projects.new.review.milestones.title')}</CardTitle>
                                                                    <CardDescription>
                                                                        {t('projects.new.review.milestones.description')}
                                                                    </CardDescription>
                                                                </div>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={applyAiMilestonesToProviders}
                                                                    disabled={aiSuggestedMilestones.length === 0 || selectedProviders.length === 0}
                                                                >
                                                                    <AutoAwesomeIcon className="w-4 h-4 mr-2" />
                                                                    {t('projects.new.review.milestones.apply_ai')}
                                                                </Button>
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent className="space-y-4">
                                                            {selectedProviders.map((selectedProvider) => {
                                                                const provider = suggestedProviders.find(p => p.id === selectedProvider.id);
                                                                const milestones = providerMilestones[selectedProvider.id] ?? [];

                                                                return (
                                                                    <div key={`provider-milestones-${selectedProvider.id}`} className="space-y-3 border rounded-lg p-4">
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="font-medium">
                                                                                {provider ? `${provider.firstName} ${provider.lastName}` : t('projects.new.review.milestones.provider_fallback', { id: selectedProvider.id })}
                                                                            </div>
                                                                            <Button
                                                                                type="button"
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() => addProviderMilestone(selectedProvider.id)}
                                                                            >
                                                                                <Plus className="w-4 h-4 mr-2" />
                                                                                {t('projects.new.review.milestones.add')}
                                                                            </Button>
                                                                        </div>
                                                                        {milestones.length === 0 ? (
                                                                            <div className="text-sm text-muted-foreground">
                                                                                {t('projects.new.review.milestones.empty')}
                                                                            </div>
                                                                        ) : (
                                                                            <div className="space-y-3">
                                                                                {milestones.map((milestone, index) => (
                                                                                    <div key={`provider-${selectedProvider.id}-milestone-${index}`} className="grid xs:grid-cols-1 md:grid-cols-[1.4fr_1fr_auto] gap-3 items-end">
                                                                                        <div>
                                                                                            <Label htmlFor={`provider-${selectedProvider.id}-milestone-title-${index}`}>{t('projects.new.review.milestones.name_label')}</Label>
                                                                                            <Input
                                                                                                id={`provider-${selectedProvider.id}-milestone-title-${index}`}
                                                                                                value={milestone.title}
                                                                                                onChange={(e) => updateProviderMilestoneField(selectedProvider.id, index, 'title', e.target.value)}
                                                                                                placeholder={t('projects.new.review.milestones.name_placeholder')}
                                                                                            />
                                                                                        </div>
                                                                                        <div>
                                                                                            <Label htmlFor={`provider-${selectedProvider.id}-milestone-amount-${index}`}>{t('projects.new.review.milestones.budget_label', { currency: currencyLabel })}</Label>
                                                                                            <Input
                                                                                                id={`provider-${selectedProvider.id}-milestone-amount-${index}`}
                                                                                                type="number"
                                                                                                min="0"
                                                                                                value={milestone.amount}
                                                                                                onChange={(e) => updateProviderMilestoneField(selectedProvider.id, index, 'amount', e.target.value)}
                                                                                                placeholder={t('projects.new.review.milestones.budget_placeholder')}
                                                                                            />
                                                                                        </div>
                                                                                        <Button
                                                                                            type="button"
                                                                                            variant="ghost"
                                                                                            size="icon"
                                                                                            onClick={() => removeProviderMilestone(selectedProvider.id, index)}
                                                                                            aria-label={t('projects.new.review.milestones.delete_aria')}
                                                                                        >
                                                                                            <X className="w-4 h-4" />
                                                                                        </Button>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                        <div className="text-sm text-muted-foreground">
                                                                            {t('projects.new.review.milestones.total_provider', {
                                                                                amount: milestones.reduce((sum, milestone) => sum + Number(milestone.amount || 0), 0).toLocaleString(),
                                                                                currency: currencyLabel,
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}

                                                            {(errors.milestones || errors.milestoneTotal || errors.milestoneBudget) && (
                                                                <div className="text-sm text-red-500">
                                                                    {errors.milestones || errors.milestoneTotal || errors.milestoneBudget}
                                                                </div>
                                                            )}

                                                            <div className="text-sm text-muted-foreground">
                                                                {t('projects.new.review.milestones.summary_total', {
                                                                    amount: getMilestoneTotal().toLocaleString(),
                                                                    currency: currencyLabel,
                                                                })}{' '}
                                                                •{' '}
                                                                {t('projects.new.review.milestones.summary_difference', {
                                                                    amount: (Number(formData.budget || 0) - getMilestoneTotal()).toLocaleString(),
                                                                    currency: currencyLabel,
                                                                })}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                )}

                                                <div className="space-y-3">
                                                    {selectedProviders.map(selectedProvider => {
                                                        const provider = suggestedProviders.find(p => p.id === selectedProvider.id);
                                                        if (!provider) return null;

                                                        return (
                                                            <div key={selectedProvider.id} className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                                                                <div className="flex items-center space-x-3">
                                                                    <Avatar className="w-10 h-10">
                                                                        <AvatarImage src={provider.avatar} />
                                                                        <AvatarFallback className="text-xs">
                                                                            {provider.firstName[0]}{provider.lastName[0]}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div className="flex-1">
                                                                        <div className="font-medium text-sm">
                                                                            {provider.firstName} {provider.lastName}
                                                                            <Badge className={
                                                                                skillLevels.find(l => l.value === (provider.level || 'MEDIU'))?.color ||
                                                                                'bg-blue-100 text-blue-800'
                                                                            }>
                                                                                {skillLevels.find(l => l.value === (provider.level || 'MEDIU'))?.icon}&nbsp;
                                                                                {skillLevels.find(l => l.value === (provider.level || 'MEDIU'))?.label || t('projects.new.providers.level_default')}
                                                                            </Badge>
                                                                        </div>
                                                                        <div className="text-xs text-muted-foreground">
                                                                            {t('projects.new.review.match_score', { score: provider.matchScore })}
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-1 mb-3">
                                                                            {provider.skills.map((skill, index) =>
                                                                                index < 4 ? (
                                                                                    <Badge key={skill} variant="outline" className="text-xs">
                                                                                        {skill}
                                                                                    </Badge>
                                                                                ) : null
                                                                            )}
                                                                            {provider.skills.length > 4 && (
                                                                                <Badge variant="outline" className="text-xs">
                                                                                    +{provider.skills.length - 4}
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="mt-3 flex items-center justify-between">
                                                                    <div className="flex items-center space-x-3">
                                                                        <Label htmlFor={`budget-${selectedProvider.id}`} className="text-sm font-medium">
                                                                            {t('projects.new.review.allocated_budget_label')}
                                                                        </Label>
                                                                        <div className="flex items-center space-x-2">
                                                                            <Input
                                                                                id={`budget-${selectedProvider.id}`}
                                                                                type="number"
                                                                                value={providerBudgets[selectedProvider.id] || 0}
                                                                                onChange={(e) => handleBudgetChange(selectedProvider.id, parseInt(e.target.value) || 0)}
                                                                                className="w-32"
                                                                                min="0"
                                                                                max={Number(formData.budget)}
                                                                            />
                                                                            <span className="text-sm text-muted-foreground">{currencyLabel}</span>
                                                                        </div>
                                                                    </div>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => handleProviderSelect(selectedProvider.id, selectedProvider.matchScore)}
                                                                    >
                                                                        <X className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-semibold mb-2">{t('projects.new.review.description_title')}</h4>
                                        <div className="bg-muted p-4 rounded-lg text-sm">
                                            {formData.description}
                                        </div>
                                    </div>

                                    {formData.requirements && (
                                        <div>
                                            <h4 className="font-semibold mb-2">{t('projects.new.review.requirements_title')}</h4>
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
                                    {t('projects.new.actions.back_to_providers')}
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={submitting || getRemainingBudget() !== 0}
                                    className="btn-primary px-8"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            {t('projects.new.actions.submitting')}
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="w-4 h-4 mr-2" />
                                            {t('projects.new.actions.submit_project')}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </TabsContent>
                    </Tabs>
                        </form>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
