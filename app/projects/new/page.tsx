"use client";

import {useState, useEffect, useMemo} from 'react';
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
    Briefcase, EuroIcon
} from 'lucide-react';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useAuth } from '@/contexts/auth-context';
import {useGetServicesGroupedByCategory, useMainCategories} from '@/hooks/use-api';
import TitleIcon from '@mui/icons-material/Title';
import DescriptionIcon from '@mui/icons-material/Description';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { apiClient } from '@/lib/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';

dayjs.extend(relativeTime);
dayjs.extend(utc);

import 'dayjs/locale/ro';
import 'dayjs/locale/en';

export function setDayjsLocale(locale: string) {
    const supported = ['ro', 'en'];
    if (supported.includes(locale)) {
        dayjs.locale(locale);
    } else {
        dayjs.locale('ro');
    }
}

type Technology = {
    id: string;
    name: string;
    price: number;
    slug?: string;
    category: string; // copil
    parentCategory: string; // părinte
};

type ServiceItem = {
    id: string;
    name: string;
    slug?: string;
    category_id: string;
};

type GroupedServices = Record<
    string, // parentCategory
    Record<string, ServiceItem[]> // childCategory -> services
>;

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
    level: string;
}

type Visibility = 'PUBLIC' | 'PRIVATE' | 'TEAM_ONLY';

const aiLoadingMessages = [
    "Se analizează informațiile...",
    "Se generează informațiile...",
    "Se verifică datele...",
    "Finalizare..."
];

type TechnologySelected = {
    id: string;
    name: string
}

type RecommendedProvider = {
    role: string;
    level: string;
    service: string;
}

type FormData = {
    title: string;
    description: string;
    requirements: string;
    serviceId: string;
    technologies: TechnologySelected[];
    budget: string;
    budgetType: string;
    deadline: string;
    visibility: string;
    attachments: File[];
    additionalInfo: string;
    recommendedProviders: RecommendedProvider[];
};

export default function NewProjectPage() {
    setDayjsLocale('ro');
    const { user, loading } = useAuth();
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
        recommendedProviders: []
    });
    const [generatedAiOutput, setGeneratedAiOutput] = useState({
        title: "",
        description: "",
        technologies: [],
        estimated_budget: 0,
        budget_type: "",
        notes: "",
        additional_services: [],
        team_structure: []
    });
    const [aiLoading, setAiLoading] = useState(false);

    const [skipValidation, setSkipValidation] = useState(false);
    const [availableTechnologies, setAvailableTechnologies] = useState<Technology[]>([]);
    const [suggestedProviders, setSuggestedProviders] = useState<SuggestedProvider[]>([]);
    const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
    const [loadingProviders, setLoadingProviders] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [newTechnology, setNewTechnology] = useState('');
    const [index, setIndex] = useState(0);
    const [foundSuggestedProvider, setFoundSuggestedProvider] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const router = useRouter();
    const { data: categoriesData } = useMainCategories();
    const { data: servicesData } = useGetServicesGroupedByCategory();

    const markedNamesSet = useMemo(() => {
        const names = [
            ...formData.technologies.map(t => t.name),
            ...generatedAiOutput.technologies.map((t: any) => t.name),
        ].filter(Boolean); // să excludem eventuale undefined sau empty strings

        return new Set(names);
    }, [formData.technologies, generatedAiOutput.technologies]);

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.title.trim()) {
            newErrors.title = 'Titlul este obligatoriu';
        }
        if (!formData.description.trim()) {
            newErrors.lastName = 'Descrierea este obligatoriu';
        }
        if (!formData.visibility.trim()) {
            newErrors.visibility = 'Tipul proiect este obligatoriu';
        }
        if (!formData.budget.trim()) {
            newErrors.budget = 'Bugetul este obligatoriu';
        }
        if (!formData.budgetType.trim()) {
            newErrors.budgetType = 'Tipul de buget este obligatoriu';
        }
        if (!formData.deadline.trim()) {
            newErrors.deadline = 'Durata proiect este obligatoriu';
        }

        if (formData.technologies.length === 0) {
            newErrors.technologies = 'Selecteaza minim o tehnologie';
        }

        // alte validări...
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/signin');
        }
        if (user && user.role !== 'CLIENT') {
            router.push('/dashboard');
        }


    }, [user, loading, router]);

    useEffect(() => {
        if (formData.serviceId && formData.technologies.length > 0) {
            loadSuggestedProviders();
        } else {
            setSuggestedProviders([]);
        }
    }, [formData.serviceId, formData.technologies]);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex(i => (i + 1) % aiLoadingMessages.length);
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const loadSuggestedProviders = async () => {
        setLoadingProviders(true);
        try {
            let payload;
            if (formData.recommendedProviders.length === 0) {
                payload = formData.technologies.map(p => ({
                    service: p.name,
                    level: ''
                }));
            } else {
                payload = formData.recommendedProviders.map(p => ({
                    service: p.service,
                    level: p.level
                }));
            }


            const apiData = await apiClient.getSuggestedProviders(payload);

            const mapToSuggestedProviders = (users: any[]): SuggestedProvider[] => {
                return users.map(user => {
                    const userService = user.services?.[0];
                    const skills = user.services?.map((s: any) => s.service?.name).filter(Boolean) ?? [];

                    return {
                        id: String(user.id),
                        firstName: user.firstName ?? '',
                        lastName: user.lastName ?? '',
                        avatar: user.avatar ?? '',
                        rating: parseFloat(user.rating ?? '0'),
                        reviewCount: user.reviewCount ?? 0,
                        completedProjects: userService?.provider_project_count ?? 0,
                        responseTime: user.profile.answer_hour,
                        location: 'România',
                        isVerified: (user.testVerified && user.callVerified),
                        level: userService?.level ?? '—',
                        skills,
                        basePrice: 0,
                        pricingType: 'FIXED',
                        deliveryTime: 14,
                        matchScore: 90,
                        matchReasons: [
                            `Nivel ${userService?.level ?? '—'}`,
                            ...(skills.length ? [`Expert în ${skills.join(', ')}`] : []),
                            user.testVerified ? 'Test trecut' : '',
                            user.callVerified ? 'Verificare video completă' : ''
                        ].filter(Boolean),
                        availability: user.profile.availability,
                        lastActive: user.last_active_at,
                    };
                });
            };

            const providers = mapToSuggestedProviders(apiData.providers);

            // Mock API call - în realitate ar veni din backend
            // const mockProviders: SuggestedProvider[] = [
            //     {
            //         id: '1',
            //         firstName: 'Alexandru',
            //         lastName: 'Ionescu',
            //         avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150',
            //         rating: 4.9,
            //         reviewCount: 127,
            //         completedProjects: 89,
            //         responseTime: '2 ore',
            //         location: 'București, România',
            //         isVerified: true,
            //         skills: ['React', 'Node.js', 'TypeScript', 'MongoDB'],
            //         basePrice: 2500,
            //         pricingType: 'FIXED',
            //         deliveryTime: 14,
            //         matchScore: 95,
            //         matchReasons: ['Expert în React și Node.js', 'Experiență cu proiecte similare', 'Rating excelent'],
            //         availability: 'Disponibil',
            //         lastActive: 'Acum 2 ore'
            //     },
            //     {
            //         id: '2',
            //         firstName: 'Maria',
            //         lastName: 'Popescu',
            //         avatar: 'https://images.pexels.com/photos/3785077/pexels-photo-3785077.jpeg?auto=compress&cs=tinysrgb&w=150',
            //         rating: 4.8,
            //         reviewCount: 95,
            //         completedProjects: 67,
            //         responseTime: '1 oră',
            //         location: 'Cluj-Napoca, România',
            //         isVerified: true,
            //         skills: ['React', 'Vue.js', 'TypeScript', 'PostgreSQL'],
            //         basePrice: 2200,
            //         pricingType: 'FIXED',
            //         deliveryTime: 12,
            //         matchScore: 92,
            //         matchReasons: ['Specialist în frontend modern', 'Livrare rapidă', 'Comunicare excelentă'],
            //         availability: 'Disponibil',
            //         lastActive: 'Acum 1 oră'
            //     },
            //     {
            //         id: '3',
            //         firstName: 'Andrei',
            //         lastName: 'Radu',
            //         avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150',
            //         rating: 4.7,
            //         reviewCount: 78,
            //         completedProjects: 45,
            //         responseTime: '3 ore',
            //         location: 'Timișoara, România',
            //         isVerified: true,
            //         skills: ['React', 'Node.js', 'Express.js', 'MySQL'],
            //         basePrice: 2000,
            //         pricingType: 'FIXED',
            //         deliveryTime: 16,
            //         matchScore: 88,
            //         matchReasons: ['Preț competitiv', 'Experiență solidă', 'Portofoliu impresionant'],
            //         availability: 'Ocupat - disponibil în 1 săptămână',
            //         lastActive: 'Acum 5 ore'
            //     },
            //     {
            //         id: '4',
            //         firstName: 'Diana',
            //         lastName: 'Stoica',
            //         avatar: 'https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=150',
            //         rating: 4.6,
            //         reviewCount: 52,
            //         completedProjects: 34,
            //         responseTime: '4 ore',
            //         location: 'Iași, România',
            //         isVerified: false,
            //         skills: ['React', 'TypeScript', 'Node.js', 'MongoDB'],
            //         basePrice: 1800,
            //         pricingType: 'HOURLY',
            //         deliveryTime: 18,
            //         matchScore: 85,
            //         matchReasons: ['Tarif atractiv', 'Tehnologii potrivite', 'Disponibilitate bună'],
            //         availability: 'Disponibil',
            //         lastActive: 'Acum 1 zi'
            //     }
            // ];

            // Simulăm un delay pentru loading
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Filtrăm și sortăm prestatorii în funcție de tehnologiile selectate
            // const filteredProviders = mockProviders
            //     .filter(provider =>
            //         formData.technologies.some(tech =>
            //             provider.skills.some(skill =>
            //                 skill.toLowerCase().includes(tech.name.toLowerCase())
            //             )
            //         )
            //     )
            //     .sort((a, b) => b.matchScore - a.matchScore)
            //     .slice(0, 5);

            setSuggestedProviders(providers);
            setFoundSuggestedProvider(apiData.found);
        } catch (error: any) {
            setError('Nu s-au putut încărca prestatorii sugerați');
        } finally {
            setLoadingProviders(false);
        }
    };

    type SkillLevel = 'JUNIOR' | 'MEDIUM' | 'SENIOR' | 'ADVANCED';

    const SkillLevels: Record<SkillLevel, { color: string; progress: number }> = {
        ADVANCED: { color: 'bg-red-100 text-red-800', progress: 95 },
        SENIOR: { color: 'bg-purple-100 text-purple-800', progress: 80 },
        MEDIUM: { color: 'bg-blue-100 text-blue-800', progress: 60 },
        JUNIOR: { color: 'bg-green-100 text-green-800', progress: 30 },
    };

    const getSkillLevel = (level: string) => {
        if (level in SkillLevels) {
            return SkillLevels[level as SkillLevel];
        }

        return SkillLevels['JUNIOR'];
    };

    const handleTechnologyToggle = (techName: string, techId: string) => {
        setFormData(prev => {
            const exists = prev.technologies.some(t => t.name === techName && t.id === techId);

            return {
                ...prev,
                technologies: exists
                    ? prev.technologies.filter(t => !(t.name === techName && t.id === techId))
                    : [...prev.technologies, { id: techId, name: techName }]
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

    const handleProviderSelect = (providerId: string) => {
        setSelectedProviders(prev =>
            prev.includes(providerId)
                ? prev.filter(id => id !== providerId)
                : [...prev, providerId]
        );
    };

    const getLastActiveText = (lastActiveAt: string): string => {
        const time = dayjs.utc(lastActiveAt);
        return `${time.fromNow()}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        setSkipValidation(false);
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

    const getVisibilityBadge = (visibility: Visibility) => {
        const colors = {
            'PUBLIC': 'bg-green-100 text-green-800',
            'PRIVATE': 'bg-blue-100 text-blue-800',
            'TEAM_ONLY': 'bg-orange-100 text-orange-800',
            'URGENT': 'bg-red-100 text-red-800'
        };
        return colors[visibility] || colors['PUBLIC'];
    };

    const getAvailabilityColor = (availability: string) => {
        if (availability.includes('Disponibil')) return 'text-green-600';
        if (availability.includes('Ocupat')) return 'text-orange-600';
        return 'text-gray-600';
    };

    const getAvailabilityStatus = (status: string) => {
        switch (status) {
            case 'AVAILABLE':
                return { color: 'bg-green-100 text-green-800', label: 'Disponibil', icon: CheckCircle };
            case 'BUYS':
                return { color: 'bg-yellow-100 text-yellow-800', label: 'Ocupat', icon: Clock };
            case 'UNAVAILABLE':
                return { color: 'bg-red-100 text-red-800', label: 'Indisponibil', icon: AlertCircle };
            default:
                return { color: 'bg-gray-100 text-gray-800', label: 'Necunoscut', icon: AlertCircle };
        }
    };


    const transformGroupedServices = (
        apiData: Record<string, Record<string, any[]> | any[]>
    ): Technology[] => {
        const result: Technology[] = [];

        Object.entries(apiData).forEach(([parentCategory, value]) => {
            // value poate fi fie array (dacă nu are copil), fie obiect cu copii
            if (Array.isArray(value)) {
                // fără copii
                value.forEach((item) => {
                    result.push({
                        id: String(item.id),
                        name: item.name,
                        price: item.price,
                        slug: item.slug,
                        category: parentCategory,
                        parentCategory: parentCategory,
                    });
                });
            } else {
                // are copii
                Object.entries(value).forEach(([childCategory, services]) => {
                    (services as any[]).forEach((item) => {
                        result.push({
                            id: String(item.id),
                            name: item.name,
                            price: item.price,
                            slug: item.slug,
                            category: childCategory,
                            parentCategory: parentCategory,
                        });
                    });
                });
            }
        });

        return result;
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

    const allTechnologies = servicesData
        ? transformGroupedServices(servicesData)
        : [];

    const groupedTechnologies = allTechnologies.reduce((acc, tech) => {
        if (!acc[tech.category]) {
            acc[tech.category] = [];
        }
        acc[tech.category].push(tech);
        return acc;
    }, {} as Record<string, Technology[]>);

    const generateDescription = async () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.title.trim()) {
            newErrors.title = 'Titlul este obligatoriu';
        }
        if (!formData.description.trim()) {
            newErrors.description = 'Descrierea este obligatoriu';
        }
        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) return;

        setSkipValidation(true);
        setAiLoading(true);

        try {
            const generatedOutput = await apiClient.generateProjectInformation(formData);
            setGeneratedAiOutput(generatedOutput);
            setFormData(prev => ({
                ...prev,
                recommendedProviders: generatedOutput.team_structure.map((member: any) => ({
                    role: member.role,
                    level: member.level,
                    service: member.service
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
        setFormData(prev => ({
           ...prev,
            [field]: generatedText,
        }));
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
                                Prestatori Sugerați
                            </TabsTrigger>
                            <TabsTrigger value="review" disabled={selectedProviders.length === 0}>
                                Revizuire & Trimitere
                            </TabsTrigger>
                        </TabsList>

                        {/* Detalii Proiect */}
                        <TabsContent value="details" className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-6">
                                <div>
                                    <Card className="mb-6">
                                        <CardHeader>
                                            <CardTitle className="flex items-center space-x-2">
                                                <FileText className="w-5 h-5" />
                                                <span>Informații Generale</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div>
                                                <Label className={errors.title ? "text-red-500" : ""} htmlFor="title">Titlu Proiect <span className="text-red-500">*</span></Label>
                                                <Input
                                                    id="title"
                                                    className={errors.title ? "border-red-500 focus:ring-red-500" : ""}
                                                    value={formData.title}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                                    placeholder="ex: Website modern pentru afacerea mea"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <Label className={errors.description ? "text-red-500" : ""} htmlFor="description">Descriere Detaliată <span className="text-red-500">*</span></Label>
                                                <Textarea
                                                    id="description"
                                                    className={errors.description ? "border-red-500 focus:ring-red-500" : ""}
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

                                                <div>
                                                    <Label className={errors.visibility ? "text-red-500" : ""} htmlFor="visibility">Tip <span className="text-red-500">*</span></Label>
                                                    <Select value={formData.visibility} onValueChange={(value) => setFormData(prev => ({ ...prev, visibility: value }))}>
                                                        <SelectTrigger className={errors.visibility ? "border-red-500 focus:ring-red-500" : ""}>
                                                            <SelectValue placeholder="Selecteaza vizibilitatea proiectului" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="PUBLIC">Public</SelectItem>
                                                            <SelectItem value="PRIVATE">Privat</SelectItem>
                                                            <SelectItem value="TEAM_ONLY">Doar echipe</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="mb-6">
                                        <CardHeader>
                                            <CardTitle className="flex items-center space-x-2">
                                                <Code className="w-5 h-5" />
                                                <span className={errors.technologies ? "text-red-500" : ""}>Servicii și Tehnologii</span>
                                            </CardTitle>
                                            <CardDescription>
                                                Selectează serviciile necesare pentru proiectul tău
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            {/* Tehnologii selectate */}
                                            {formData.technologies.length > 0 && (
                                                <div>
                                                    <Label className={`mb-3 block ${errors.technologies ? "text-red-500" : ""}`}>Servicii Selectate ({formData.technologies.length})</Label>
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
                                                <Label className={errors.technologies ? "text-red-500" : ""}>Adaugă Tehnologie Personalizată</Label>
                                                <div className="flex space-x-2 mt-2">
                                                    <Input
                                                        value={newTechnology}
                                                        className={errors.firstName ? "border-red-500 focus:ring-red-500" : ""}
                                                        onChange={(e) => setNewTechnology(e.target.value)}
                                                        placeholder="ex: GraphQL, Redis, etc."
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
                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                                    {services.map((service) => (
                                                                        <div key={service.id} className="flex items-center space-x-2">
                                                                            <Checkbox
                                                                                id={service.id}
                                                                                // checked={formData.technologies.some(t => t.id === service.id)}
                                                                                checked={markedNamesSet.has(service.name)}
                                                                                onCheckedChange={() => handleTechnologyToggle(service.name, service.id)}
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

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center space-x-2">
                                                <DollarSign className="w-5 h-5" />
                                                <span>Buget și Timeline</span>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div>
                                                <Label className={`mb-3 block ${errors.budgetType ? "text-red-500" : ""}`}>Tip Buget <span className="text-red-500">*</span></Label>
                                                <RadioGroup className={errors.budgetType ? "border-red-500 focus:ring-red-500" : ""}
                                                    value={formData.budgetType} onValueChange={(value) => setFormData(prev => ({ ...prev, budgetType: value }))}>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="FIXED" id="fixed" />
                                                        <Label htmlFor="fixed">Preț Fix per Proiect</Label>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <RadioGroupItem value="HOURLY" id="hourly" />
                                                        <Label htmlFor="hourly">Tarif pe Oră</Label>
                                                    </div>
                                                </RadioGroup>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label className={errors.buget ? "text-red-500" : ""} htmlFor="budget">
                                                        Buget {formData.budgetType === 'HOURLY' ? '(RON/oră)' : '(RON)'} *
                                                    </Label>
                                                    <Input
                                                        id="budget"
                                                        className={errors.buget ? "text-red-500" : ""}
                                                        type="number"
                                                        value={formData.budget}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                                                        placeholder={formData.budgetType === 'HOURLY' ? '50' : '2500'}
                                                        required={!skipValidation}
                                                    />
                                                </div>

                                                <div>
                                                    <Label className={errors.deadline ? "text-red-500" : ""} htmlFor="deadline">Durata proiect <span className="text-red-500">*</span></Label>
                                                    <Select
                                                        value={formData.deadline}
                                                        onValueChange={(value) => setFormData(prev => ({ ...prev, deadline: value }))}
                                                    >
                                                        <SelectTrigger className={errors.deadline ? "border-red-500 focus:ring-red-500" : ""}>
                                                            <SelectValue placeholder="Selectează termenul limită" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="1day">1 zi</SelectItem>
                                                            <SelectItem value="1week">1 saptamana</SelectItem>
                                                            <SelectItem value="2week">2 saptamani</SelectItem>
                                                            <SelectItem value="3week">3 saptamani</SelectItem>
                                                            <SelectItem value="1month">1 luna</SelectItem>
                                                            <SelectItem value="3month">3 luni</SelectItem>
                                                            <SelectItem value="6month">6 luni</SelectItem>
                                                            <SelectItem value="1year">1 an</SelectItem>
                                                            <SelectItem value="1plusyear">1+ ani</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                                <div>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center space-x-2">
                                                <AutoAwesomeIcon className="w-5 h-5" />
                                                <span>Genereaza cu AI</span>
                                            </CardTitle>
                                            <CardDescription className="flex items-center space-x-2">
                                                Bazat pe cerintele scrise in descriere + restul informatiilor genereaza o descriere mai detaliată, sugereaza tehnologiile si/sau serviciile pentru proiect + buget recomandat.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            {generatedAiOutput.title.trim() && (
                                                <h2 className="font-bold">Informatii sugerate:</h2>
                                            )}
                                            {generatedAiOutput?.title.trim() && (
                                                <>
                                                    <div>
                                                        <span className="text-sm text-black font-bold">Titlu: </span> {generatedAiOutput?.title}
                                                    </div>
                                                    <a className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 rounded-md px-3 w-full cursor-pointer" onClick={() => handleUseGeneratedField('title', generatedAiOutput?.title)}>
                                                        <TitleIcon />
                                                        Foloseste titlu
                                                    </a>
                                                </>
                                            )}

                                            {generatedAiOutput?.description.trim() && (
                                                <>
                                                    <div>
                                                        <span className="text-sm text-black font-bold">Descriere: </span> {generatedAiOutput?.description}
                                                    </div>
                                                    <a className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 rounded-md px-3 w-full cursor-pointer"
                                                       onClick={() => handleUseGeneratedField('description', generatedAiOutput?.description)}>
                                                    <DescriptionIcon />
                                                        Foloseste descrierea
                                                    </a>
                                                </>
                                            )}

                                            {generatedAiOutput?.technologies.length > 0 && (
                                                <>
                                                    <div>
                                                        <span className="text-sm text-black font-bold">Tehnologii sugerate: </span>
                                                        <ul className="ml-6 list-disc">
                                                            {generatedAiOutput?.technologies.map((tech, index) => (
                                                                <li key={index}>{tech}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <a className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 rounded-md px-3 w-full cursor-pointer"
                                                       onClick={() => handleUseGeneratedTechnologies(generatedAiOutput.technologies)}>
                                                        <AddCircleIcon />
                                                        Foloseste Tehnologii
                                                    </a>
                                                </>
                                            )}

                                            {generatedAiOutput?.additional_services.length > 0 && (
                                                <>
                                                    <div>
                                                        <span className="text-sm text-black font-bold">Servicii aditionale sugerate: </span>
                                                        <ul className="ml-6 list-disc">
                                                            {generatedAiOutput?.additional_services.map((tech, index) => (
                                                                <li key={index}>{tech}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    <a className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 rounded-md px-3 w-full cursor-pointer"
                                                       onClick={() => handleUseGeneratedSuggestedTechnologies(generatedAiOutput.additional_services)}>
                                                        <AddCircleIcon />
                                                        Adauga Servicii Aditionale
                                                    </a>
                                                </>
                                            )}

                                            {generatedAiOutput?.team_structure.length > 0 && (
                                                <div>
                                                    <span className="text-sm text-black font-bold">Structura echipa: </span>
                                                        {generatedAiOutput?.team_structure.map((team: {role: string, level: string, count: number, estimated_cost: number}, index) => (
                                                            <div key={index}>
                                                                <span className="text-sm text-black font-bold">Rol:</span> {team.role} - {team.count} {team.count === 1 ? 'persoana': 'persoane'} - Nivel {team.level}  - {team.estimated_cost} RON estimat
                                                            </div>
                                                        ))}

                                                </div>
                                            )}

                                            {generatedAiOutput?.estimated_budget !== 0 && (
                                                <>
                                                    <div>
                                                        <span className="text-sm text-black font-bold">Buget total estimat: </span> {generatedAiOutput?.estimated_budget} {getBudgetTypeLabel(generatedAiOutput?.budget_type)}
                                                    </div>
                                                    <a className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 rounded-md px-3 w-full cursor-pointer"
                                                       onClick={() => {
                                                        handleUseGeneratedField('budget', generatedAiOutput?.estimated_budget);
                                                        handleUseGeneratedField('budgetType', generatedAiOutput?.budget_type || 'FIXED');
                                                    }}>
                                                        <EuroIcon />
                                                        Foloseste Bugetul
                                                    </a>
                                                </>
                                            )}

                                            {generatedAiOutput?.notes.trim() && (
                                                <div>
                                                    <span className="text-sm text-black font-bold">Nota: </span> {generatedAiOutput.notes}
                                                </div>
                                            )}

                                            <div className="col-span-2">
                                                <Button size="sm" className="w-full" onClick={() => generateDescription()}>
                                                    <AutoAwesomeIcon className="w-4 h-4 me-2" />
                                                    Imbunătățește Descrierea cu AI
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
                                    Continuă la Prestatori
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </TabsContent>

                        {/* Prestatori Sugerați */}
                        <TabsContent value="providers" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Users className="w-5 h-5" />
                                        <span>Prestatori Sugerați</span>
                                    </CardTitle>
                                    <CardDescription>
                                        Prestatori care se potrivesc cu cerințele proiectului tău<br />
                                        <span className="text-red-500 font-bold">{!foundSuggestedProvider ? 'Nu avem sugestii de prestatori dar puteti folosi urmatorii prestatori' : ''}</span>
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
                                                                            <span>Răspuns în {provider.responseTime} {provider.responseTime === "1" ? 'oră' : 'ore'}</span>
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
                                                                <div className="text-2xl font-bold">
                                                                    <span className={`font-semibold px-2.5 py-0.5 rounded-full ${getSkillLevel(provider.level).color}`}>
                                                                      {provider.level}
                                                                    </span>

                                                                </div>
                                                                {/*<div className="text-sm text-muted-foreground">*/}
                                                                {/*    {provider.pricingType === 'FIXED' ? 'Preț fix' : 'Negociabil'}*/}
                                                                {/*</div>*/}
                                                                <div className="text-sm">
                                                                    <div className="flex items-center space-x-1 justify-end">
                                                                        <Calendar className="w-3 h-3" />
                                                                        <span>{provider.deliveryTime} zile</span>
                                                                    </div>
                                                                </div>

                                                                <div className={`flex items-center justify-end space-x-2 mb-3`}>
                                                                    <Badge className={`${getAvailabilityStatus(provider.availability).color}`}>
                                                                        {
                                                                            (() => {
                                                                                const Icon = getAvailabilityStatus(provider.availability).icon;
                                                                                return <Icon className="mr-1 w-4 h-4" />;
                                                                            })()
                                                                        }
                                                                        {provider.availability}
                                                                    </Badge>

                                                                </div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    Activ {getLastActiveText(provider.lastActive)}
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
                                                    <div><strong>Categorie:</strong> {categoriesData?.find((c: { id: string; name: string }) => c.id === formData.serviceId)?.name}</div>
                                                    <div><strong>Buget:</strong> {formData.budget} RON ({getBudgetTypeLabel(formData.budgetType)})</div>
                                                    {formData.deadline && (
                                                        <div><strong>Deadline:</strong> {new Date(formData.deadline).toLocaleDateString('ro-RO')}</div>
                                                    )}
                                                    <div>
                                                        <strong>Tip proiect:</strong>
                                                        <Badge className={`ml-2 ${getVisibilityBadge(formData.visibility as Visibility)}`}>
                                                            {formData.visibility}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="font-semibold mb-2">Tehnologii ({formData.technologies.length})</h4>
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
                                                                    • {provider.matchScore}% potrivire
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
