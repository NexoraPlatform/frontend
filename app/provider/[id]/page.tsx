"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Star,
    MapPin,
    Calendar,
    Clock,
    Globe,
    Mail,
    Phone,
    Briefcase,
    GraduationCap,
    Award,
    CheckCircle,
    MessageSquare,
    Heart,
    Share2,
    ExternalLink,
    User,
    Building,
    Code,
    Palette,
    Smartphone,
    TrendingUp,
    Database,
    Shield,
    Languages,
    BookOpen,
    Target,
    DollarSign,
    Zap,
    Users,
    FileText,
    Loader2,
    AlertCircle,
    Eye,
    ThumbsUp,
    Calendar as CalendarIcon,
    Verified, ShieldAlert
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import {useGetLanguages, useGetProviderProfileByUrl} from "@/hooks/use-api";

interface ProviderProfilePageProps {
    params: {
        id: string;
    };
}

type Languages = {
    id: number;
    name: string;
    code: string;
    locale: string;
    flag: string;
    timezone: string;
}

type Category = {
    id: number;
    name: string;
    slug: string;
};

type Service = {
    id: number;
    name: string;
    slug: string;
    description: string;
    rating: string;
    reviewCount: number;
    orderCount: number;
    category: Category;
};

type ProviderService = {
    id: number;
    user_id: number;
    service_id: number;
    verified: boolean;
    level: string;
    provider_project_count: number;
    service: Service;
};

type ServiceDisplay = {
    id: string;
    title: string;
    category: string;
    level: string;
    rating: number;
    reviewCount: number;
    orderCount: number;
    deliveryTime: number;
};

export default function ProviderProfilePage({ params }: ProviderProfilePageProps) {
    const { id } = params;
    const { user } = useAuth();
    const [provider, setProvider] = useState<any>(null);
    const [services, setServices] = useState<any[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [isFavorite, setIsFavorite] = useState(false);
    const router = useRouter();
    // const { data: profileData, loading: profileLoading, error: profileError } = useGetProviderProfileByUrl(id);
    const { data: languages, loading: languagesLoading } = useGetLanguages();

    useEffect(() => {
        if (!languagesLoading && languages?.length) {
            loadProviderData();
        }
    }, [languagesLoading, languages, params.id]);


    const loadProviderData = async () => {
        try {
            // Load provider profile
            const providerData = await apiClient.getProviderProfileByUrl(id);

            const userLanguages = (providerData.languages || []).map((lang: any) => {
                const match = languages.find((l: Languages) => l.name.toLowerCase() === lang.language?.toLowerCase());

                return {
                    name: lang.language || '',
                    level: lang.proficiency || '',
                    flag: match?.flag || '🇷🇴',
                };
            });
            console.log(providerData)
            const providerInfo = {
                id: params.id,
                firstName: providerData.firstName,
                lastName: providerData.lastName,
                email: providerData.email,
                phone: providerData.phone,
                avatar: providerData.avatar,
                bio: providerData.profile.bio,
                company: providerData.company,
                website: providerData.website,
                location: providerData.profile.location,
                rating: 4.9,
                reviewCount: 127,
                completedProjects: providerData.portfolios.length,
                responseTime: providerData.profile.answer_hour,
                isVerified: providerData.callVerified && providerData.testVerified,
                memberSince: providerData.created_at,
                firstJob: providerData.work_history.length > 0 ? providerData.oldest_work_experience : new Date(),
                lastActive: providerData.last_active_at,

                // Availability
                availability: {
                    status: providerData.profile.availability, // available, busy, unavailable
                    hoursPerWeek: providerData.profile.working_hours_per_week,
                    timezone: providerData.timezone,
                    workingHours: {
                        monday: providerData.profile.working_monday_enabled === 1 &&
                        providerData.profile.working_monday_from &&
                        providerData.profile.working_monday_to
                            ? {
                                start: providerData.profile.working_monday_from,
                                end: providerData.profile.working_monday_to,
                                enabled: true
                            }
                            : null,
                        tuesday: providerData.profile.working_tuesday_enabled === 1 &&
                        providerData.profile.working_tuesday_from &&
                        providerData.profile.working_tuesday_to
                            ? {
                                start: providerData.profile.working_tuesday_from,
                                end: providerData.profile.working_tuesday_to,
                                enabled: true
                            }
                            : null,
                        wednesday: providerData.profile.working_wednesday_enabled === 1 &&
                        providerData.profile.working_wednesday_from &&
                        providerData.profile.working_wednesday_to
                            ? {
                                start: providerData.profile.working_wednesday_from,
                                end: providerData.profile.working_wednesday_to,
                                enabled: true
                            }
                            : null,
                        thursday: providerData.profile.working_thursday_enabled === 1 &&
                        providerData.profile.working_thursday_from &&
                        providerData.profile.working_thursday_to
                            ? {
                                start: providerData.profile.working_thursday_from,
                                end: providerData.profile.working_thursday_to,
                                enabled: true
                            }
                            : null,
                        friday: providerData.profile.working_friday_enabled === 1 &&
                        providerData.profile.working_friday_from &&
                        providerData.profile.working_friday_to
                            ? {
                                start: providerData.profile.working_friday_from,
                                end: providerData.profile.working_friday_to,
                                enabled: true
                            }
                            : null,
                        saturday:providerData.profile.working_saturday_enabled === 1 &&
                        providerData.profile.working_saturday_from &&
                        providerData.profile.working_saturday_to
                            ? {
                                start: providerData.profile.working_saturday_from,
                                end: providerData.profile.working_saturday_to,
                                enabled: true
                            }
                            : null,
                        sunday: providerData.profile.working_sunday_enabled === 1 &&
                        providerData.profile.working_sunday_from &&
                        providerData.profile.working_sunday_to
                            ? {
                                start: providerData.profile.working_sunday_from,
                                end: providerData.profile.working_sunday_to,
                                enabled: true
                            }
                            : null
                    },
                    nextAvailable: providerData.next_available_job
                },
                // Languages
                languages: userLanguages,

                // Skills & Certifications
                // skills: [
                //     { name: 'React', level: 'Expert', years: 5 },
                //     { name: 'Node.js', level: 'Expert', years: 6 },
                //     { name: 'TypeScript', level: 'Avansat', years: 4 },
                //     { name: 'MongoDB', level: 'Avansat', years: 4 },
                //     { name: 'AWS', level: 'Intermediar', years: 3 },
                //     { name: 'Docker', level: 'Intermediar', years: 2 }
                // ],

                certifications: (providerData.certifications || []).map((cert: any) => ({
                    name: cert.name || '',
                    issuer: cert.issuer_name || '',
                    date: cert.issued_at || '',
                    credentialId: cert.credential_id || '',
                    verified: cert.verified || ''
                })),

                // Education
                education: (providerData.education || []).map((edu: any) => ({
                    degree: edu.degree || '',
                    institution: edu.institution || '',
                    attended_from: edu.attended_from || '',
                    attended_to: edu.attended_to || '',
                    study_area: edu.study_area || '',
                })),

                // Work History
                workHistory: (providerData.work_history || []).map((work: any) => ({
                    position: work.position || '',
                    company: work.company || '',
                    city: work.city || '',
                    country: work.country || '',
                    start_date: work.start_date || '',
                    end_date: work.end_date || '',
                    description: work.description || '',
                    current_working: work.current_working || ''
                })),

                // Portfolio highlights
                portfolio: (providerData.portfolio || []).map((item: any) => ({
                    title: item.project_title || '',
                    description: item.description || '',
                    image: item.image || '',
                    role: item.role || '',
                    technologies: item.technologies_used || [],
                    url: item.url || '',
                }))
            };

            const providerServices = await apiClient.getProviderServices(providerData.id);

            // Provider services data
            const services: ServiceDisplay[] = providerServices.map((item: ProviderService) => ({
                id: item.service.id.toString(),
                title: item.service.name,
                category: item.service.category?.name || 'Nespecificat',
                level: item.level.toLowerCase(),
                rating: parseFloat(item.service.rating) || 0,
                reviewCount: item.service.reviewCount || 0,
                orderCount: item.service.orderCount || 0,
                deliveryTime: 14
            }));

            // Mock reviews data
            const reviews = [
                {
                    id: '1',
                    rating: 5,
                    comment: 'Excelent! Alexandru a livrat exact ce am cerut, în timp record. Comunicarea a fost perfectă pe tot parcursul proiectului.',
                    reviewer: {
                        name: 'Maria Popescu',
                        avatar: 'https://images.pexels.com/photos/3785077/pexels-photo-3785077.jpeg?auto=compress&cs=tinysrgb&w=100'
                    },
                    project: 'Website E-commerce',
                    date: '2024-01-10',
                    verified: true
                },
                {
                    id: '2',
                    rating: 5,
                    comment: 'Profesionist de top! A înțeles perfect cerințele și a implementat soluții creative. Recomand cu încredere!',
                    reviewer: {
                        name: 'Andrei Radu',
                        avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100'
                    },
                    project: 'Aplicație Mobile',
                    date: '2024-01-05',
                    verified: true
                }
            ];

            setProvider(providerInfo);
            setServices(services);
            setReviews(reviews);
        } catch (error: any) {
            console.log(error)
            setError('Nu s-au putut încărca datele prestatorului');
        } finally {
            setLoading(false);
        }
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

    type LanguageLevel = 'Basic' | 'Conversational' | 'Fluent' | 'Native';

    const languageColors: Record<LanguageLevel, string> = {
        Native: 'bg-green-100 text-green-800',
        Fluent: 'bg-purple-100 text-purple-800',
        Conversational: 'bg-yellow-100 text-yellow-800',
        Basic: 'bg-gray-100 text-gray-800',
    };

    const getLanguageLevel = (level: string): string => {
        if (level in languageColors) {
            return languageColors[level as LanguageLevel];
        }

        return languageColors['Basic'];
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

    const formatWorkingHours = (hours: any) => {
        if (!hours) return 'Liber';
        return `${hours.start} - ${hours.end}`;
    };

    const handleContactProvider = () => {
        if (!user) {
            router.push('/auth/signin');
            return;
        }
        // Implement contact functionality
        alert('Funcționalitatea de contact va fi implementată în curând');
    };

    const handleFavoriteToggle = () => {
        setIsFavorite(!isFavorite);
        // Implement favorite functionality
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="container mx-auto px-4 py-20">
                    <div className="flex justify-center items-center">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (!provider) {
        return (
            <div className="min-h-screen bg-background">
                <Header />
                <div className="container mx-auto px-4 py-20">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error || 'Prestator nu a fost găsit'}</AlertDescription>
                    </Alert>
                </div>
                <Footer />
            </div>
        );
    }

    const availabilityStatus = getAvailabilityStatus(provider.availability.status);
    const AvailabilityIcon = availabilityStatus.icon;

    const emptySections = [
        provider.certifications?.length === 0,
        provider.languages?.length === 0,
        provider.education?.length === 0
    ].filter(Boolean).length;

    const cardClass = emptySections >= 2 ? 'lg:grid-cols-1' : 'lg:grid-cols-2';

    const lastActiveProvider = Math.floor((Date.now() - new Date(provider.lastActive).getTime()) / (1000 * 60 * 60));

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <div className="container mx-auto px-4 py-8">
                {/* Provider Header */}
                <div className="mb-8">
                    <Card className="border-2 shadow-lg">
                        <CardContent className="p-8">
                            <div className="flex flex-col lg:flex-row gap-8">
                                {/* Avatar and Basic Info */}
                                <div className="flex flex-col items-center lg:items-start">
                                    <div className="relative mb-4">
                                        <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                                            <AvatarImage src={provider.avatar} />
                                            <AvatarFallback className="text-2xl">
                                                {provider.firstName[0]}{provider.lastName[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        {provider.isVerified && (
                                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center border-4 border-white">
                                                <Verified className="w-5 h-5 text-white" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-center lg:text-left">
                                        <h1 className="text-3xl font-bold mb-2">
                                            {provider.firstName} {provider.lastName}
                                        </h1>
                                        <div className="flex items-center justify-center lg:justify-start space-x-2 mb-3">
                                            <Badge className={availabilityStatus.color}>
                                                <AvailabilityIcon className="w-3 h-3 mr-1" />
                                                {availabilityStatus.label}
                                            </Badge>
                                            {provider.isVerified ? (
                                                <Badge className="bg-blue-100 text-blue-800">
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Verificat
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-blue-100 text-red-800">
                                                    <ShieldAlert className="w-3 h-3 mr-1" />
                                                    Neverificat
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-center lg:justify-start space-x-4 text-sm text-muted-foreground mb-4">
                                            {provider.location && (
                                                <div className="flex items-center space-x-1">
                                                    <MapPin className="w-4 h-4" />
                                                    <span>{provider.location}</span>
                                                </div>
                                            )}

                                            <div className="flex items-center space-x-1">
                                                <Calendar className="w-4 h-4" />
                                                <span>Membru din {new Date(provider.memberSince).getFullYear()}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-center lg:justify-start space-x-1 mb-4">
                                            <div className="flex">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`w-5 h-5 ${
                                                            i < Math.floor(provider.rating)
                                                                ? 'fill-yellow-400 text-yellow-400'
                                                                : 'text-gray-300'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                            <span className="font-bold text-lg">{provider.rating}</span>
                                            <span className="text-muted-foreground">({provider.reviewCount} recenzii)</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Main Info */}
                                <div className="flex-1">
                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold mb-3">Despre mine</h3>
                                        <p className="text-muted-foreground leading-relaxed">
                                            {provider.bio}
                                        </p>
                                    </div>

                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                        <div className="text-center p-3 bg-muted/30 rounded-lg">
                                            <div className="text-2xl font-bold text-blue-600">{provider.completedProjects}</div>
                                            <div className="text-sm text-muted-foreground">Proiecte finalizate</div>
                                        </div>
                                        <div className="text-center p-3 bg-muted/30 rounded-lg">
                                            <div className="text-2xl font-bold text-green-600">{provider.responseTime} {provider.responseTime == 1 ? 'ora' : 'ore'}</div>
                                            <div className="text-sm text-muted-foreground">Timp de răspuns</div>
                                        </div>
                                        <div className="text-center p-3 bg-muted/30 rounded-lg">
                                            <div className="text-2xl font-bold text-purple-600">{provider.availability.hoursPerWeek}h</div>
                                            <div className="text-sm text-muted-foreground">Pe săptămână</div>
                                        </div>
                                        <div className="text-center p-3 bg-muted/30 rounded-lg">
                                            <div className="text-2xl font-bold text-orange-600">
                                                {new Date().getFullYear() - new Date(provider.firstJob).getFullYear()}+
                                            </div>
                                            <div className="text-sm text-muted-foreground">Ani experiență</div>
                                        </div>
                                    </div>

                                    {/* Contact Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        {provider.company && (
                                            <div className="flex items-center space-x-2 text-sm">
                                                <Building className="w-4 h-4 text-muted-foreground" />
                                                <span>{provider.company}</span>
                                            </div>
                                        )}

                                        {provider.website && (
                                            <div className="flex items-center space-x-2 text-sm">
                                                <Globe className="w-4 h-4 text-muted-foreground" />
                                                <a href={provider.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                    {provider.website}
                                                </a>
                                            </div>
                                        )}

                                        <div className="flex items-center space-x-2 text-sm">
                                            <Clock className="w-4 h-4 text-muted-foreground" />

                                            <span className={`${lastActiveProvider === 0 && 'text-green-600'}`}>Activ acum {lastActiveProvider !== 0 && lastActiveProvider + `ore`}</span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-sm">
                                            <Globe className="w-4 h-4 text-muted-foreground" />
                                            <span>{provider.availability.timezone}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col space-y-3 lg:w-64">
                                    <Button size="lg" onClick={handleContactProvider} className="w-full">
                                        <MessageSquare className="w-4 h-4 mr-2" />
                                        Contactează
                                    </Button>
                                    <Button variant="outline" size="lg" onClick={handleFavoriteToggle} className="w-full">
                                        <Heart className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                                        {isFavorite ? 'Elimină din favorite' : 'Adaugă la favorite'}
                                    </Button>
                                    <Button variant="outline" size="lg" className="w-full">
                                        <Share2 className="w-4 h-4 mr-2" />
                                        Partajează
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Detailed Information Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="flex w-full justify-around flex-wrap gap-2">
                        <TabsTrigger value="overview">Prezentare</TabsTrigger>
                        {services.length > 0 && (<TabsTrigger value="services">Servicii</TabsTrigger>)}
                        {provider.portfolio.length > 0 && (<TabsTrigger value="portfolio">Portofoliu</TabsTrigger>)}
                        {provider.workHistory.length > 0 && (<TabsTrigger value="experience">Experiență</TabsTrigger>)}
                        <TabsTrigger value="reviews">Recenzii</TabsTrigger>
                        <TabsTrigger value="availability">Disponibilitate</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6">
                        <div className={`grid grid-cols-1 ${cardClass} gap-6`}>
                            {/*/!* Skills *!/*/}
                            {/*<Card>*/}
                            {/*    <CardHeader>*/}
                            {/*        <CardTitle className="flex items-center space-x-2">*/}
                            {/*            <Code className="w-5 h-5" />*/}
                            {/*            <span>Competențe Tehnice</span>*/}
                            {/*        </CardTitle>*/}
                            {/*    </CardHeader>*/}
                            {/*    <CardContent>*/}
                            {/*        <div className="space-y-4">*/}
                            {/*            {provider.skills.map((skill: any, index: number) => {*/}
                            {/*                const skillInfo = getSkillLevel(skill.level);*/}
                            {/*                return (*/}
                            {/*                    <div key={index} className="space-y-2">*/}
                            {/*                        <div className="flex justify-between items-center">*/}
                            {/*                            <span className="font-medium">{skill.name}</span>*/}
                            {/*                            <div className="flex items-center space-x-2">*/}
                            {/*                                <Badge className={skillInfo.color}>{skill.level}</Badge>*/}
                            {/*                                <span className="text-sm text-muted-foreground">{skill.years} ani</span>*/}
                            {/*                            </div>*/}
                            {/*                        </div>*/}
                            {/*                        <Progress value={skillInfo.progress} className="h-2" />*/}
                            {/*                    </div>*/}
                            {/*                );*/}
                            {/*            })}*/}
                            {/*        </div>*/}
                            {/*    </CardContent>*/}
                            {/*</Card>*/}

                            {/* Languages */}
                            {provider.languages.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center space-x-2">
                                            <Languages className="w-5 h-5" />
                                            <span>Limbi Vorbite</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {provider.languages.map((language: any, index: number) => (
                                                <div key={index} className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <span className="text-2xl">{language.flag}</span>
                                                        <span className="font-medium">{language.name}</span>
                                                    </div>
                                                    <Badge className={getLanguageLevel(language.level)}>
                                                        {language.level}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Certifications */}
                            {provider.certifications.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center space-x-2">
                                            <Award className="w-5 h-5" />
                                            <span>Certificări</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {provider.certifications.map((cert: any, index: number) => (
                                                <div key={index} className="border rounded-lg p-4">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <h4 className="font-semibold">{cert.name}</h4>
                                                            <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                                                        </div>
                                                        {cert.verified && (
                                                            <Badge className="bg-green-100 text-green-800">
                                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                                Verificat
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Obținut: {new Date(cert.date).toLocaleDateString('ro-RO')}
                          </span>
                                                        <span className="text-xs text-muted-foreground">
                            ID: {cert.credentialId}
                          </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Education */}
                            {provider.education.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center space-x-2">
                                            <GraduationCap className="w-5 h-5" />
                                            <span>Educație</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {provider.education.map((edu: any, index: number) => (
                                                <div key={index} className="border-l-4 border-blue-500 pl-4">
                                                    <h4 className="font-semibold">{edu.degree}</h4>
                                                    <p className="text-sm text-blue-600 mb-1">{edu.institution}</p>
                                                    <p className="text-sm text-muted-foreground mb-2">{edu.period}</p>
                                                    <p className="text-sm">{edu.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>

                    {/* Services Tab */}
                    <TabsContent value="services" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {services.map((service: any) => (
                                <Card key={service.id} className="hover:shadow-lg transition-shadow">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-xl">{service.title}</CardTitle>
                                                <Badge variant="outline" className="mt-2">{service.category}</Badge>
                                            </div>
                                            <div className="text-right">
                                                <span className={`font-semibold px-2.5 py-0.5 rounded-full ${getSkillLevel(service.level).color}`}>
                                                  {service.level.toUpperCase()}
                                                </span>

                                                {/*<div className="text-sm text-muted-foreground">*/}
                                                {/*    {service.pricingType === 'FIXED' ? 'Preț fix' : 'Negociabil'}*/}
                                                {/*</div>*/}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                            <div className="flex items-center space-x-1">
                                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                <span>{service.rating} ({service.reviewCount} recenzii)</span>
                                            </div>
                                            {/*<div className="flex items-center space-x-1">*/}
                                            {/*    <Clock className="w-4 h-4 text-muted-foreground" />*/}
                                            {/*    <span>{service.deliveryTime} zile livrare</span>*/}
                                            {/*</div>*/}
                                            <div className="flex items-center space-x-1">
                                                <Users className="w-4 h-4 text-muted-foreground" />
                                                <span>{service.orderCount} proiecte</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <Target className="w-4 h-4 text-muted-foreground" />
                                                <span>100% finalizare</span>
                                            </div>
                                        </div>
                                        <Button className="w-full">
                                            Vezi Detalii Serviciu
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    {/* Portfolio Tab */}
                    <TabsContent value="portfolio" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {provider.portfolio.map((project: any, index: number) => (
                                <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                                    <div className="aspect-video bg-muted relative overflow-hidden">
                                        <img
                                            src={project.image}
                                            alt={project.title}
                                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                                        />
                                    </div>
                                    <CardContent className="p-4">
                                        <h3 className="font-semibold mb-2">{project.title}</h3>
                                        <p className="text-sm text-muted-foreground mb-3">{project.description}</p>
                                        <div className="flex flex-wrap gap-1 mb-3">
                                            {project.technologies.map((tech: string) => (
                                                <Badge key={tech} variant="outline" className="text-xs">
                                                    {tech}
                                                </Badge>
                                            ))}
                                        </div>
                                        <Button variant="outline" size="sm" className="w-full" asChild>
                                            <a href={project.url} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="w-4 h-4 mr-2" />
                                                Vezi Proiectul
                                            </a>
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    {/* Experience Tab */}
                    <TabsContent value="experience" className="space-y-6">
                        <div className={`grid grid-cols-1 ${provider.education.length > 0 || provider.workHistory.length > 0 ? 'lg:grid-cols-1' : 'lg:grid-cols-0'} gap-6`}>
                            {provider.workHistory.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center space-x-2">
                                            <Briefcase className="w-5 h-5" />
                                            <span>Experiență Profesională</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-6">
                                            {provider.workHistory.map((work: any, index: number) => (
                                                <div key={index} className="relative">
                                                    {index !== provider.workHistory.length - 1 && (
                                                        <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-border"></div>
                                                    )}
                                                    <div className="flex items-start space-x-4">
                                                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                                            <Briefcase className="w-6 h-6 text-primary" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div>
                                                                    <h3 className="font-semibold text-lg">{work.position}</h3>
                                                                    <p className="text-blue-600 font-medium">{work.company}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <Badge variant="outline">{work.type}</Badge>
                                                                    <p className="text-sm text-muted-foreground mt-1">{work.period}</p>
                                                                </div>
                                                            </div>
                                                            <p className="text-muted-foreground mb-3">{work.description}</p>
                                                            <div className="flex flex-wrap gap-1">
                                                                {work.technologies?.map((tech: string) => (
                                                                    <Badge key={tech} variant="secondary" className="text-xs">
                                                                        {tech}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {provider.education.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <GraduationCap className="w-5 h-5" />
                                        <span>Educație</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        {provider.education.map((edu: any, index: number) => (
                                            <div key={index} className="relative">
                                                {index !== provider.education.length - 1 && (
                                                    <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-border"></div>
                                                )}
                                                <div className="flex items-start space-x-4">
                                                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <GraduationCap className="w-6 h-6 text-green-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-lg">{edu.degree}</h3>
                                                        <p className="text-green-600 font-medium">{edu.institution}</p>
                                                        <p className="text-sm text-muted-foreground mb-2">{edu.period}</p>
                                                        <p className="text-muted-foreground">{edu.description}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                            )}
                        </div>
                    </TabsContent>

                    {/* Reviews Tab */}
                    <TabsContent value="reviews" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Reviews Summary */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Rezumat Recenzii</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center mb-6">
                                        <div className="text-4xl font-bold text-yellow-600 mb-2">
                                            {provider.rating}
                                        </div>
                                        <div className="flex justify-center mb-2">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`w-5 h-5 ${
                                                        i < Math.floor(provider.rating)
                                                            ? 'fill-yellow-400 text-yellow-400'
                                                            : 'text-gray-300'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-muted-foreground">{provider.reviewCount} recenzii</p>
                                    </div>

                                    <div className="space-y-2">
                                        {[5, 4, 3, 2, 1].map(rating => {
                                            const count = Math.floor(Math.random() * 30) + (rating === 5 ? 80 : rating === 4 ? 30 : 5);
                                            const percentage = (count / provider.reviewCount) * 100;
                                            return (
                                                <div key={rating} className="flex items-center space-x-2 text-sm">
                                                    <span className="w-8">{rating} ⭐</span>
                                                    <Progress value={percentage} className="flex-1 h-2" />
                                                    <span className="w-8 text-right">{count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Recent Reviews */}
                            <div className="lg:col-span-2 space-y-4">
                                {reviews.map((review: any) => (
                                    <Card key={review.id}>
                                        <CardContent className="p-6">
                                            <div className="flex items-start space-x-4">
                                                <Avatar className="w-12 h-12">
                                                    <AvatarImage src={review.reviewer.avatar} />
                                                    <AvatarFallback>
                                                        {review.reviewer.name.split(' ').map((n: string) => n[0]).join('')}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div>
                                                            <h4 className="font-semibold">{review.reviewer.name}</h4>
                                                            <p className="text-sm text-muted-foreground">{review.project}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="flex items-center space-x-1 mb-1">
                                                                {[...Array(review.rating)].map((_, i) => (
                                                                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                                ))}
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">
                                                                {new Date(review.date).toLocaleDateString('ro-RO')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <p className="text-muted-foreground mb-2">{review.comment}</p>
                                                    {review.verified && (
                                                        <Badge className="bg-green-100 text-green-800 text-xs">
                                                            <CheckCircle className="w-3 h-3 mr-1" />
                                                            Comandă Verificată
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}

                                <div className="text-center">
                                    <Button variant="outline">
                                        <Eye className="w-4 h-4 mr-2" />
                                        Vezi Toate Recenziile
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Availability Tab */}
                    <TabsContent value="availability" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Current Status */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Clock className="w-5 h-5" />
                                        <span>Status Curent</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span>Disponibilitate:</span>
                                            <Badge className={availabilityStatus.color}>
                                                <AvailabilityIcon className="w-3 h-3 mr-1" />
                                                {availabilityStatus.label}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span>Ore pe săptămână:</span>
                                            <span className="font-medium">{provider.availability.hoursPerWeek}h</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span>Fus orar:</span>
                                            <span className="font-medium">{provider.availability.timezone}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span>Următoarea disponibilitate:</span>
                                            <span className="font-medium">
                                                {provider.availability.status === 'AVAILABLE' ? (<span className="text-green-500">Imediat</span>) : new Date(provider.availability.nextAvailable).toLocaleDateString('ro-RO')}
                      </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span>Timp de răspuns:</span>
                                            <span className="font-medium text-green-600">{provider.responseTime}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Working Hours */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <CalendarIcon className="w-5 h-5" />
                                        <span>Program de Lucru</span>
                                    </CardTitle>
                                    <CardDescription>
                                        Orele în care prestator-ul este de obicei disponibil
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {Object.entries(provider.availability.workingHours).map(([day, hours]) => {
                                            type WeekDay =
                                                | 'monday'
                                                | 'tuesday'
                                                | 'wednesday'
                                                | 'thursday'
                                                | 'friday'
                                                | 'saturday'
                                                | 'sunday';
                                            const dayNames: Record<WeekDay, string> = {
                                                monday: 'Luni',
                                                tuesday: 'Marți',
                                                wednesday: 'Miercuri',
                                                thursday: 'Joi',
                                                friday: 'Vineri',
                                                saturday: 'Sâmbătă',
                                                sunday: 'Duminică'
                                            };

                                            return (
                                                <div key={day} className="flex items-center justify-between">
                                                    <span className="font-medium">{dayNames[day as WeekDay]}:</span>
                                                    <span className={hours ? 'text-green-600' : 'text-red-600'}>
                            {formatWorkingHours(hours)}
                          </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Contact Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <MessageSquare className="w-5 h-5" />
                                    <span>Informații Contact</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-3">
                                            <Mail className="w-5 h-5 text-muted-foreground" />
                                            <div>
                                                <p className="font-medium">Email</p>
                                                <p className="text-sm text-muted-foreground">{provider.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <Phone className="w-5 h-5 text-muted-foreground" />
                                            <div>
                                                <p className="font-medium">Telefon</p>
                                                <p className="text-sm text-muted-foreground">{provider.phone}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-3">
                                            <Building className="w-5 h-5 text-muted-foreground" />
                                            <div>
                                                <p className="font-medium">Companie</p>
                                                <p className="text-sm text-muted-foreground">{provider.company}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <Globe className="w-5 h-5 text-muted-foreground" />
                                            <div>
                                                <p className="font-medium">Website</p>
                                                <a
                                                    href={provider.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm text-blue-600 hover:underline"
                                                >
                                                    {provider.website}
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t">
                                    <div className="flex space-x-4">
                                        <Button onClick={handleContactProvider} className="flex-1">
                                            <MessageSquare className="w-4 h-4 mr-2" />
                                            Trimite Mesaj
                                        </Button>
                                        <Button variant="outline" className="flex-1">
                                            <Phone className="w-4 h-4 mr-2" />
                                            Programează Apel
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Floating Action Button for Mobile */}
                <div className="fixed bottom-6 right-6 lg:hidden">
                    <Button size="lg" onClick={handleContactProvider} className="rounded-full shadow-lg">
                        <MessageSquare className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            <Footer />
        </div>
    );
}
