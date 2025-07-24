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
    Verified
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

interface ProviderProfilePageProps {
    params: {
        id: string;
    };
}

export default function ProviderProfilePage({ params }: ProviderProfilePageProps) {
    const { user } = useAuth();
    const [provider, setProvider] = useState<any>(null);
    const [services, setServices] = useState<any[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [isFavorite, setIsFavorite] = useState(false);
    const router = useRouter();

    useEffect(() => {
        loadProviderData();
    }, [params.id]);

    const loadProviderData = async () => {
        try {
            // Load provider profile
            const providerData = await apiClient.getProfile(); // This would be replaced with actual provider endpoint

            // Mock data for demonstration - replace with actual API calls
            const mockProvider = {
                id: params.id,
                firstName: 'Alexandru',
                lastName: 'Ionescu',
                email: 'alexandru@example.com',
                phone: '+40 123 456 789',
                avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=300',
                bio: 'Dezvoltator full-stack cu peste 8 ani de experiență în crearea de aplicații web moderne și scalabile. Specializat în React, Node.js și arhitecturi cloud. Pasionat de tehnologii noi și soluții inovatoare.',
                company: 'TechSolutions SRL',
                website: 'https://alexdev.ro',
                location: 'București, România',
                rating: 4.9,
                reviewCount: 127,
                completedProjects: 89,
                responseTime: '2 ore',
                isVerified: true,
                memberSince: '2020-03-15',
                lastActive: '2024-01-15T10:30:00Z',

                // Availability
                availability: {
                    status: 'available', // available, busy, unavailable
                    hoursPerWeek: 40,
                    timezone: 'Europe/Bucharest',
                    workingHours: {
                        monday: { start: '09:00', end: '18:00' },
                        tuesday: { start: '09:00', end: '18:00' },
                        wednesday: { start: '09:00', end: '18:00' },
                        thursday: { start: '09:00', end: '18:00' },
                        friday: { start: '09:00', end: '18:00' },
                        saturday: { start: '10:00', end: '14:00' },
                        sunday: null
                    },
                    nextAvailable: '2024-02-01'
                },

                // Languages
                languages: [
                    { name: 'Română', level: 'Nativ', flag: '🇷🇴' },
                    { name: 'Engleză', level: 'Fluent', flag: '🇺🇸' },
                    { name: 'Franceză', level: 'Intermediar', flag: '🇫🇷' },
                    { name: 'Germană', level: 'Începător', flag: '🇩🇪' }
                ],

                // Skills & Certifications
                skills: [
                    { name: 'React', level: 'Expert', years: 5 },
                    { name: 'Node.js', level: 'Expert', years: 6 },
                    { name: 'TypeScript', level: 'Avansat', years: 4 },
                    { name: 'MongoDB', level: 'Avansat', years: 4 },
                    { name: 'AWS', level: 'Intermediar', years: 3 },
                    { name: 'Docker', level: 'Intermediar', years: 2 }
                ],

                certifications: [
                    {
                        name: 'AWS Certified Developer',
                        issuer: 'Amazon Web Services',
                        date: '2023-06-15',
                        credentialId: 'AWS-DEV-2023-001',
                        verified: true
                    },
                    {
                        name: 'React Professional Certificate',
                        issuer: 'Meta',
                        date: '2022-11-20',
                        credentialId: 'META-REACT-2022',
                        verified: true
                    },
                    {
                        name: 'MongoDB Certified Developer',
                        issuer: 'MongoDB University',
                        date: '2023-03-10',
                        credentialId: 'MONGO-DEV-2023',
                        verified: true
                    }
                ],

                // Education
                education: [
                    {
                        degree: 'Master în Informatică',
                        institution: 'Universitatea Politehnica București',
                        period: '2018-2020',
                        description: 'Specializare în Ingineria Software și Sisteme Distribuite'
                    },
                    {
                        degree: 'Licență în Informatică',
                        institution: 'Universitatea București',
                        period: '2014-2018',
                        description: 'Specializare în Programare și Dezvoltare Software'
                    }
                ],

                // Work History
                workHistory: [
                    {
                        position: 'Senior Full-Stack Developer',
                        company: 'TechCorp Romania',
                        period: '2022-Prezent',
                        type: 'Full-time',
                        description: 'Dezvoltare aplicații enterprise cu React și Node.js. Coordonare echipă de 5 dezvoltatori.',
                        technologies: ['React', 'Node.js', 'PostgreSQL', 'AWS']
                    },
                    {
                        position: 'Full-Stack Developer',
                        company: 'StartupHub',
                        period: '2020-2022',
                        type: 'Full-time',
                        description: 'Dezvoltare MVP-uri pentru startup-uri tech. Implementare arhitecturi scalabile.',
                        technologies: ['Vue.js', 'Express.js', 'MongoDB', 'Docker']
                    },
                    {
                        position: 'Frontend Developer',
                        company: 'WebAgency Pro',
                        period: '2018-2020',
                        type: 'Full-time',
                        description: 'Dezvoltare interfețe web responsive și aplicații single-page.',
                        technologies: ['JavaScript', 'CSS3', 'HTML5', 'jQuery']
                    }
                ],

                // Portfolio highlights
                portfolio: [
                    {
                        title: 'E-commerce Platform',
                        description: 'Platformă e-commerce completă cu sistem de plăți integrat',
                        image: 'https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg?auto=compress&cs=tinysrgb&w=400',
                        technologies: ['React', 'Node.js', 'Stripe'],
                        url: 'https://demo-ecommerce.com'
                    },
                    {
                        title: 'Task Management App',
                        description: 'Aplicație de management proiecte cu colaborare în timp real',
                        image: 'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=400',
                        technologies: ['Vue.js', 'Socket.io', 'MongoDB'],
                        url: 'https://demo-tasks.com'
                    },
                    {
                        title: 'Analytics Dashboard',
                        description: 'Dashboard complex pentru analiză date cu grafice interactive',
                        image: 'https://images.pexels.com/photos/590020/pexels-photo-590020.jpeg?auto=compress&cs=tinysrgb&w=400',
                        technologies: ['React', 'D3.js', 'Python'],
                        url: 'https://demo-analytics.com'
                    }
                ]
            };

            // Mock services data
            const mockServices = [
                {
                    id: '1',
                    title: 'Dezvoltare Website React',
                    category: 'Dezvoltare Web',
                    basePrice: 2500,
                    pricingType: 'FIXED',
                    rating: 4.9,
                    reviewCount: 45,
                    orderCount: 67,
                    deliveryTime: 14
                },
                {
                    id: '2',
                    title: 'Aplicație Mobile React Native',
                    category: 'Mobile Development',
                    basePrice: 4500,
                    pricingType: 'FIXED',
                    rating: 4.8,
                    reviewCount: 23,
                    orderCount: 34,
                    deliveryTime: 21
                }
            ];

            // Mock reviews data
            const mockReviews = [
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

            setProvider(mockProvider);
            setServices(mockServices);
            setReviews(mockReviews);
        } catch (error: any) {
            setError('Nu s-au putut încărca datele prestatorului');
        } finally {
            setLoading(false);
        }
    };

    const getAvailabilityStatus = (status: string) => {
        switch (status) {
            case 'available':
                return { color: 'bg-green-100 text-green-800', label: 'Disponibil', icon: CheckCircle };
            case 'busy':
                return { color: 'bg-yellow-100 text-yellow-800', label: 'Ocupat', icon: Clock };
            case 'unavailable':
                return { color: 'bg-red-100 text-red-800', label: 'Indisponibil', icon: AlertCircle };
            default:
                return { color: 'bg-gray-100 text-gray-800', label: 'Necunoscut', icon: AlertCircle };
        }
    };

    const getLanguageLevel = (level: string) => {
        const colors = {
            'Nativ': 'bg-green-100 text-green-800',
            'Fluent': 'bg-blue-100 text-blue-800',
            'Avansat': 'bg-purple-100 text-purple-800',
            'Intermediar': 'bg-yellow-100 text-yellow-800',
            'Începător': 'bg-gray-100 text-gray-800'
        };
        return colors[level] || colors['Începător'];
    };

    const getSkillLevel = (level: string) => {
        const levels = {
            'Expert': { color: 'bg-red-100 text-red-800', progress: 95 },
            'Avansat': { color: 'bg-purple-100 text-purple-800', progress: 80 },
            'Intermediar': { color: 'bg-blue-100 text-blue-800', progress: 60 },
            'Începător': { color: 'bg-green-100 text-green-800', progress: 30 }
        };
        return levels[level] || levels['Începător'];
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

    if (error || !provider) {
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
                                            {provider.isVerified && (
                                                <Badge className="bg-blue-100 text-blue-800">
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Verificat
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-center lg:justify-start space-x-4 text-sm text-muted-foreground mb-4">
                                            <div className="flex items-center space-x-1">
                                                <MapPin className="w-4 h-4" />
                                                <span>{provider.location}</span>
                                            </div>
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
                                            <div className="text-sm text-muted-foreground">Proiecte</div>
                                        </div>
                                        <div className="text-center p-3 bg-muted/30 rounded-lg">
                                            <div className="text-2xl font-bold text-green-600">{provider.responseTime}</div>
                                            <div className="text-sm text-muted-foreground">Răspuns</div>
                                        </div>
                                        <div className="text-center p-3 bg-muted/30 rounded-lg">
                                            <div className="text-2xl font-bold text-purple-600">{provider.availability.hoursPerWeek}h</div>
                                            <div className="text-sm text-muted-foreground">Pe săptămână</div>
                                        </div>
                                        <div className="text-center p-3 bg-muted/30 rounded-lg">
                                            <div className="text-2xl font-bold text-orange-600">
                                                {new Date().getFullYear() - new Date(provider.memberSince).getFullYear()}+
                                            </div>
                                            <div className="text-sm text-muted-foreground">Ani experiență</div>
                                        </div>
                                    </div>

                                    {/* Contact Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        <div className="flex items-center space-x-2 text-sm">
                                            <Building className="w-4 h-4 text-muted-foreground" />
                                            <span>{provider.company}</span>
                                        </div>
                                        <div className="flex items-center space-x-2 text-sm">
                                            <Globe className="w-4 h-4 text-muted-foreground" />
                                            <a href={provider.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                {provider.website}
                                            </a>
                                        </div>
                                        <div className="flex items-center space-x-2 text-sm">
                                            <Clock className="w-4 h-4 text-muted-foreground" />
                                            <span>Activ acum {Math.floor((Date.now() - new Date(provider.lastActive).getTime()) / (1000 * 60 * 60))} ore</span>
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
                    <TabsList className="grid w-full grid-cols-6">
                        <TabsTrigger value="overview">Prezentare</TabsTrigger>
                        <TabsTrigger value="services">Servicii</TabsTrigger>
                        <TabsTrigger value="portfolio">Portofoliu</TabsTrigger>
                        <TabsTrigger value="experience">Experiență</TabsTrigger>
                        <TabsTrigger value="reviews">Recenzii</TabsTrigger>
                        <TabsTrigger value="availability">Disponibilitate</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Skills */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Code className="w-5 h-5" />
                                        <span>Competențe Tehnice</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {provider.skills.map((skill: any, index: number) => {
                                            const skillInfo = getSkillLevel(skill.level);
                                            return (
                                                <div key={index} className="space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-medium">{skill.name}</span>
                                                        <div className="flex items-center space-x-2">
                                                            <Badge className={skillInfo.color}>{skill.level}</Badge>
                                                            <span className="text-sm text-muted-foreground">{skill.years} ani</span>
                                                        </div>
                                                    </div>
                                                    <Progress value={skillInfo.progress} className="h-2" />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Languages */}
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

                            {/* Certifications */}
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

                            {/* Education */}
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
                                                <div className="text-2xl font-bold text-green-600">
                                                    {service.basePrice.toLocaleString()} RON
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {service.pricingType === 'FIXED' ? 'Preț fix' : 'Negociabil'}
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                            <div className="flex items-center space-x-1">
                                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                <span>{service.rating} ({service.reviewCount} recenzii)</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <Clock className="w-4 h-4 text-muted-foreground" />
                                                <span>{service.deliveryTime} zile livrare</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <Users className="w-4 h-4 text-muted-foreground" />
                                                <span>{service.orderCount} comenzi</span>
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
                                                        {work.technologies.map((tech: string) => (
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
                        {new Date(provider.availability.nextAvailable).toLocaleDateString('ro-RO')}
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
                                            const dayNames = {
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
                                                    <span className="font-medium">{dayNames[day]}:</span>
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
