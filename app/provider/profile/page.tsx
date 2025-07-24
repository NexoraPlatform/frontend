"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    User,
    Save,
    Plus,
    X,
    Upload,
    AlertCircle,
    CheckCircle,
    Loader2,
    Building,
    Globe,
    MapPin,
    Phone,
    Mail,
    Clock,
    Languages,
    Award,
    GraduationCap,
    Briefcase,
    Code,
    Calendar,
    Target,
    Eye,
    Edit,
    Trash2
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

export default function ProviderProfileEditPage() {
    const { user, loading } = useAuth();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState('basic');
    const router = useRouter();

    const [profileData, setProfileData] = useState({
        // Basic Info
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        bio: '',
        company: '',
        website: '',
        location: '',
        avatar: '',

        // Availability
        availability: {
            status: 'available',
            hoursPerWeek: 40,
            timezone: 'Europe/Bucharest',
            workingHours: {
                monday: { start: '09:00', end: '18:00', enabled: true },
                tuesday: { start: '09:00', end: '18:00', enabled: true },
                wednesday: { start: '09:00', end: '18:00', enabled: true },
                thursday: { start: '09:00', end: '18:00', enabled: true },
                friday: { start: '09:00', end: '18:00', enabled: true },
                saturday: { start: '10:00', end: '14:00', enabled: false },
                sunday: { start: '10:00', end: '14:00', enabled: false }
            },
            responseTime: '2 ore'
        },

        // Languages
        languages: [] as Array<{
            name: string;
            level: string;
            flag: string;
        }>,

        // Skills
        skills: [] as Array<{
            name: string;
            level: string;
            years: number;
        }>,

        // Certifications
        certifications: [] as Array<{
            name: string;
            issuer: string;
            date: string;
            credentialId: string;
            verified: boolean;
        }>,

        // Education
        education: [] as Array<{
            degree: string;
            institution: string;
            period: string;
            description: string;
        }>,

        // Work History
        workHistory: [] as Array<{
            position: string;
            company: string;
            period: string;
            type: string;
            description: string;
            technologies: string[];
        }>,

        // Portfolio
        portfolio: [] as Array<{
            title: string;
            description: string;
            image: string;
            technologies: string[];
            url: string;
        }>
    });

    const [newLanguage, setNewLanguage] = useState({ name: '', level: 'Începător', flag: '' });
    const [newSkill, setNewSkill] = useState({ name: '', level: 'Începător', years: 1 });
    const [newCertification, setNewCertification] = useState({
        name: '', issuer: '', date: '', credentialId: '', verified: false
    });
    const [newEducation, setNewEducation] = useState({
        degree: '', institution: '', period: '', description: ''
    });
    const [newWork, setNewWork] = useState({
        position: '', company: '', period: '', type: 'Full-time', description: '', technologies: [] as string[]
    });
    const [newPortfolio, setNewPortfolio] = useState({
        title: '', description: '', image: '', technologies: [] as string[], url: ''
    });

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/signin');
        }
        if (user && user.role !== 'PROVIDER') {
            router.push('/dashboard');
        }
        if (user) {
            loadProfileData();
        }
    }, [user, loading, router]);

    const loadProfileData = async () => {
        try {
            // Load existing profile data
            // This would be replaced with actual API call
            setProfileData(prev => ({
                ...prev,
                firstName: user?.firstName || '',
                lastName: user?.lastName || '',
                email: user?.email || '',
                // Add other existing data
            }));
        } catch (error: any) {
            setError('Nu s-au putut încărca datele profilului');
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            // Save profile data
            // await apiClient.updateProfile(profileData);
            setSuccess('Profilul a fost actualizat cu succes!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (error: any) {
            setError(error.message || 'A apărut o eroare la salvare');
        } finally {
            setSaving(false);
        }
    };

    const addLanguage = () => {
        if (newLanguage.name && newLanguage.level) {
            setProfileData(prev => ({
                ...prev,
                languages: [...prev.languages, { ...newLanguage }]
            }));
            setNewLanguage({ name: '', level: 'Începător', flag: '' });
        }
    };

    const removeLanguage = (index: number) => {
        setProfileData(prev => ({
            ...prev,
            languages: prev.languages.filter((_, i) => i !== index)
        }));
    };

    const addSkill = () => {
        if (newSkill.name && newSkill.level) {
            setProfileData(prev => ({
                ...prev,
                skills: [...prev.skills, { ...newSkill }]
            }));
            setNewSkill({ name: '', level: 'Începător', years: 1 });
        }
    };

    const removeSkill = (index: number) => {
        setProfileData(prev => ({
            ...prev,
            skills: prev.skills.filter((_, i) => i !== index)
        }));
    };

    const addCertification = () => {
        if (newCertification.name && newCertification.issuer) {
            setProfileData(prev => ({
                ...prev,
                certifications: [...prev.certifications, { ...newCertification }]
            }));
            setNewCertification({ name: '', issuer: '', date: '', credentialId: '', verified: false });
        }
    };

    const removeCertification = (index: number) => {
        setProfileData(prev => ({
            ...prev,
            certifications: prev.certifications.filter((_, i) => i !== index)
        }));
    };

    const addEducation = () => {
        if (newEducation.degree && newEducation.institution) {
            setProfileData(prev => ({
                ...prev,
                education: [...prev.education, { ...newEducation }]
            }));
            setNewEducation({ degree: '', institution: '', period: '', description: '' });
        }
    };

    const removeEducation = (index: number) => {
        setProfileData(prev => ({
            ...prev,
            education: prev.education.filter((_, i) => i !== index)
        }));
    };

    const addWork = () => {
        if (newWork.position && newWork.company) {
            setProfileData(prev => ({
                ...prev,
                workHistory: [...prev.workHistory, { ...newWork }]
            }));
            setNewWork({ position: '', company: '', period: '', type: 'Full-time', description: '', technologies: [] });
        }
    };

    const removeWork = (index: number) => {
        setProfileData(prev => ({
            ...prev,
            workHistory: prev.workHistory.filter((_, i) => i !== index)
        }));
    };

    const addPortfolio = () => {
        if (newPortfolio.title && newPortfolio.description) {
            setProfileData(prev => ({
                ...prev,
                portfolio: [...prev.portfolio, { ...newPortfolio }]
            }));
            setNewPortfolio({ title: '', description: '', image: '', technologies: [], url: '' });
        }
    };

    const removePortfolio = (index: number) => {
        setProfileData(prev => ({
            ...prev,
            portfolio: prev.portfolio.filter((_, i) => i !== index)
        }));
    };

    const updateWorkingHours = (day: string, field: string, value: any) => {
        setProfileData(prev => ({
            ...prev,
            availability: {
                ...prev.availability,
                workingHours: {
                    ...prev.availability.workingHours,
                    [day]: {
                        ...prev.availability.workingHours[day],
                        [field]: value
                    }
                }
            }
        }));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (!user || user.role !== 'PROVIDER') {
        return null;
    }

    const languageLevels = ['Nativ', 'Fluent', 'Avansat', 'Intermediar', 'Începător'];
    const skillLevels = ['Expert', 'Avansat', 'Intermediar', 'Începător'];
    const workTypes = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'];
    const availabilityStatuses = [
        { value: 'available', label: 'Disponibil' },
        { value: 'busy', label: 'Ocupat' },
        { value: 'unavailable', label: 'Indisponibil' }
    ];

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Editează Profilul</h1>
                        <p className="text-muted-foreground">
                            Completează informațiile pentru a atrage mai mulți clienți
                        </p>
                    </div>
                    <div className="flex space-x-3">
                        <Button variant="outline" onClick={() => router.push(`/provider/${user.id}`)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Previzualizare
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Se salvează...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Salvează
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert className="mb-6 border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">{success}</AlertDescription>
                    </Alert>
                )}

                {/* Profile Edit Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-6">
                        <TabsTrigger value="basic">Informații de Bază</TabsTrigger>
                        <TabsTrigger value="availability">Disponibilitate</TabsTrigger>
                        <TabsTrigger value="skills">Competențe</TabsTrigger>
                        <TabsTrigger value="experience">Experiență</TabsTrigger>
                        <TabsTrigger value="education">Educație</TabsTrigger>
                        <TabsTrigger value="portfolio">Portofoliu</TabsTrigger>
                    </TabsList>

                    {/* Basic Information */}
                    <TabsContent value="basic" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <User className="w-5 h-5" />
                                    <span>Informații Personale</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center space-x-6">
                                    <Avatar className="w-24 h-24">
                                        <AvatarImage src={profileData.avatar} />
                                        <AvatarFallback>
                                            {profileData.firstName[0]}{profileData.lastName[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <Button variant="outline">
                                            <Upload className="w-4 h-4 mr-2" />
                                            Schimbă Poza
                                        </Button>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Recomandăm o poză profesională (max 2MB)
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="firstName">Prenume *</Label>
                                        <Input
                                            id="firstName"
                                            value={profileData.firstName}
                                            onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="lastName">Nume *</Label>
                                        <Input
                                            id="lastName"
                                            value={profileData.lastName}
                                            onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="email">Email *</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={profileData.email}
                                            onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="phone">Telefon</Label>
                                        <Input
                                            id="phone"
                                            value={profileData.phone}
                                            onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                                            placeholder="+40 123 456 789"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="bio">Descriere Profesională *</Label>
                                    <Textarea
                                        id="bio"
                                        value={profileData.bio}
                                        onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                                        placeholder="Descrie-te pe scurt, experiența ta și ce te face special..."
                                        rows={4}
                                        required
                                    />
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {profileData.bio.length}/500 caractere
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <Label htmlFor="company">Companie</Label>
                                        <Input
                                            id="company"
                                            value={profileData.company}
                                            onChange={(e) => setProfileData(prev => ({ ...prev, company: e.target.value }))}
                                            placeholder="Numele companiei"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="website">Website</Label>
                                        <Input
                                            id="website"
                                            value={profileData.website}
                                            onChange={(e) => setProfileData(prev => ({ ...prev, website: e.target.value }))}
                                            placeholder="https://example.com"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="location">Locație</Label>
                                        <Input
                                            id="location"
                                            value={profileData.location}
                                            onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                                            placeholder="București, România"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Availability */}
                    <TabsContent value="availability" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Clock className="w-5 h-5" />
                                        <span>Status și Disponibilitate</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div>
                                        <Label htmlFor="status">Status Curent</Label>
                                        <Select
                                            value={profileData.availability.status}
                                            onValueChange={(value) => setProfileData(prev => ({
                                                ...prev,
                                                availability: { ...prev.availability, status: value }
                                            }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availabilityStatuses.map(status => (
                                                    <SelectItem key={status.value} value={status.value}>
                                                        {status.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="hoursPerWeek">Ore pe săptămână</Label>
                                            <Input
                                                id="hoursPerWeek"
                                                type="number"
                                                value={profileData.availability.hoursPerWeek}
                                                onChange={(e) => setProfileData(prev => ({
                                                    ...prev,
                                                    availability: { ...prev.availability, hoursPerWeek: parseInt(e.target.value) }
                                                }))}
                                                min="1"
                                                max="80"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="responseTime">Timp de răspuns</Label>
                                            <Select
                                                value={profileData.availability.responseTime}
                                                onValueChange={(value) => setProfileData(prev => ({
                                                    ...prev,
                                                    availability: { ...prev.availability, responseTime: value }
                                                }))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1 oră">1 oră</SelectItem>
                                                    <SelectItem value="2 ore">2 ore</SelectItem>
                                                    <SelectItem value="4 ore">4 ore</SelectItem>
                                                    <SelectItem value="8 ore">8 ore</SelectItem>
                                                    <SelectItem value="24 ore">24 ore</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="timezone">Fus Orar</Label>
                                        <Select
                                            value={profileData.availability.timezone}
                                            onValueChange={(value) => setProfileData(prev => ({
                                                ...prev,
                                                availability: { ...prev.availability, timezone: value }
                                            }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Europe/Bucharest">Europe/Bucharest (GMT+2)</SelectItem>
                                                <SelectItem value="Europe/London">Europe/London (GMT+0)</SelectItem>
                                                <SelectItem value="America/New_York">America/New_York (GMT-5)</SelectItem>
                                                <SelectItem value="Asia/Tokyo">Asia/Tokyo (GMT+9)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Calendar className="w-5 h-5" />
                                        <span>Program de Lucru</span>
                                    </CardTitle>
                                    <CardDescription>
                                        Setează orele în care ești de obicei disponibil
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {Object.entries(profileData.availability.workingHours).map(([day, hours]) => {
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
                                                <div key={day} className="flex items-center space-x-4">
                                                    <div className="w-20 text-sm font-medium">
                                                        {dayNames[day]}
                                                    </div>
                                                    <Switch
                                                        checked={hours.enabled}
                                                        onCheckedChange={(checked) => updateWorkingHours(day, 'enabled', checked)}
                                                    />
                                                    {hours.enabled && (
                                                        <>
                                                            <Input
                                                                type="time"
                                                                value={hours.start}
                                                                onChange={(e) => updateWorkingHours(day, 'start', e.target.value)}
                                                                className="w-24"
                                                            />
                                                            <span className="text-muted-foreground">-</span>
                                                            <Input
                                                                type="time"
                                                                value={hours.end}
                                                                onChange={(e) => updateWorkingHours(day, 'end', e.target.value)}
                                                                className="w-24"
                                                            />
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Skills & Languages */}
                    <TabsContent value="skills" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Languages */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Languages className="w-5 h-5" />
                                        <span>Limbi Vorbite</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-3 gap-2">
                                        <Input
                                            placeholder="Limba"
                                            value={newLanguage.name}
                                            onChange={(e) => setNewLanguage(prev => ({ ...prev, name: e.target.value }))}
                                        />
                                        <Select
                                            value={newLanguage.level}
                                            onValueChange={(value) => setNewLanguage(prev => ({ ...prev, level: value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {languageLevels.map(level => (
                                                    <SelectItem key={level} value={level}>{level}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button onClick={addLanguage} size="sm">
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        {profileData.languages.map((language, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 border rounded">
                                                <div className="flex items-center space-x-2">
                                                    <span>{language.flag}</span>
                                                    <span className="font-medium">{language.name}</span>
                                                    <Badge variant="outline">{language.level}</Badge>
                                                </div>
                                                <Button variant="ghost" size="sm" onClick={() => removeLanguage(index)}>
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Skills */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Code className="w-5 h-5" />
                                        <span>Competențe Tehnice</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-4 gap-2">
                                        <Input
                                            placeholder="Skill"
                                            value={newSkill.name}
                                            onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
                                        />
                                        <Select
                                            value={newSkill.level}
                                            onValueChange={(value) => setNewSkill(prev => ({ ...prev, level: value }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {skillLevels.map(level => (
                                                    <SelectItem key={level} value={level}>{level}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Input
                                            type="number"
                                            placeholder="Ani"
                                            value={newSkill.years}
                                            onChange={(e) => setNewSkill(prev => ({ ...prev, years: parseInt(e.target.value) }))}
                                            min="1"
                                            max="20"
                                        />
                                        <Button onClick={addSkill} size="sm">
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        {profileData.skills.map((skill, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 border rounded">
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-medium">{skill.name}</span>
                                                    <Badge variant="outline">{skill.level}</Badge>
                                                    <span className="text-sm text-muted-foreground">{skill.years} ani</span>
                                                </div>
                                                <Button variant="ghost" size="sm" onClick={() => removeSkill(index)}>
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Certifications */}
                            <Card className="lg:col-span-2">
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Award className="w-5 h-5" />
                                        <span>Certificări</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-5 gap-2">
                                        <Input
                                            placeholder="Nume certificare"
                                            value={newCertification.name}
                                            onChange={(e) => setNewCertification(prev => ({ ...prev, name: e.target.value }))}
                                        />
                                        <Input
                                            placeholder="Emitent"
                                            value={newCertification.issuer}
                                            onChange={(e) => setNewCertification(prev => ({ ...prev, issuer: e.target.value }))}
                                        />
                                        <Input
                                            type="date"
                                            value={newCertification.date}
                                            onChange={(e) => setNewCertification(prev => ({ ...prev, date: e.target.value }))}
                                        />
                                        <Input
                                            placeholder="ID Credențial"
                                            value={newCertification.credentialId}
                                            onChange={(e) => setNewCertification(prev => ({ ...prev, credentialId: e.target.value }))}
                                        />
                                        <Button onClick={addCertification} size="sm">
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        {profileData.certifications.map((cert, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 border rounded">
                                                <div>
                                                    <div className="font-medium">{cert.name}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {cert.issuer} • {new Date(cert.date).toLocaleDateString('ro-RO')}
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="sm" onClick={() => removeCertification(index)}>
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Experience */}
                    <TabsContent value="experience" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Briefcase className="w-5 h-5" />
                                    <span>Experiență Profesională</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-6 gap-2">
                                    <Input
                                        placeholder="Poziție"
                                        value={newWork.position}
                                        onChange={(e) => setNewWork(prev => ({ ...prev, position: e.target.value }))}
                                    />
                                    <Input
                                        placeholder="Companie"
                                        value={newWork.company}
                                        onChange={(e) => setNewWork(prev => ({ ...prev, company: e.target.value }))}
                                    />
                                    <Input
                                        placeholder="Perioada"
                                        value={newWork.period}
                                        onChange={(e) => setNewWork(prev => ({ ...prev, period: e.target.value }))}
                                    />
                                    <Select
                                        value={newWork.type}
                                        onValueChange={(value) => setNewWork(prev => ({ ...prev, type: value }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {workTypes.map(type => (
                                                <SelectItem key={type} value={type}>{type}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Textarea
                                        placeholder="Descriere"
                                        value={newWork.description}
                                        onChange={(e) => setNewWork(prev => ({ ...prev, description: e.target.value }))}
                                        rows={1}
                                    />
                                    <Button onClick={addWork} size="sm">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {profileData.workHistory.map((work, index) => (
                                        <div key={index} className="border rounded-lg p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold">{work.position}</h3>
                                                    <p className="text-blue-600">{work.company}</p>
                                                    <p className="text-sm text-muted-foreground">{work.period} • {work.type}</p>
                                                    <p className="text-sm mt-2">{work.description}</p>
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {work.technologies.map((tech: string) => (
                                                            <Badge key={tech} variant="secondary" className="text-xs">
                                                                {tech}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="sm" onClick={() => removeWork(index)}>
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Education */}
                    <TabsContent value="education" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <GraduationCap className="w-5 h-5" />
                                    <span>Educație</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-5 gap-2">
                                    <Input
                                        placeholder="Diplomă/Grad"
                                        value={newEducation.degree}
                                        onChange={(e) => setNewEducation(prev => ({ ...prev, degree: e.target.value }))}
                                    />
                                    <Input
                                        placeholder="Instituție"
                                        value={newEducation.institution}
                                        onChange={(e) => setNewEducation(prev => ({ ...prev, institution: e.target.value }))}
                                    />
                                    <Input
                                        placeholder="Perioada"
                                        value={newEducation.period}
                                        onChange={(e) => setNewEducation(prev => ({ ...prev, period: e.target.value }))}
                                    />
                                    <Textarea
                                        placeholder="Descriere"
                                        value={newEducation.description}
                                        onChange={(e) => setNewEducation(prev => ({ ...prev, description: e.target.value }))}
                                        rows={1}
                                    />
                                    <Button onClick={addEducation} size="sm">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {profileData.education.map((edu, index) => (
                                        <div key={index} className="border rounded-lg p-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-semibold">{edu.degree}</h3>
                                                    <p className="text-blue-600">{edu.institution}</p>
                                                    <p className="text-sm text-muted-foreground">{edu.period}</p>
                                                    <p className="text-sm mt-2">{edu.description}</p>
                                                </div>
                                                <Button variant="ghost" size="sm" onClick={() => removeEducation(index)}>
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Portfolio */}
                    <TabsContent value="portfolio" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Target className="w-5 h-5" />
                                    <span>Portofoliu</span>
                                </CardTitle>
                                <CardDescription>
                                    Adaugă proiecte reprezentative pentru a-ți demonstra competențele
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-5 gap-2">
                                    <Input
                                        placeholder="Titlu proiect"
                                        value={newPortfolio.title}
                                        onChange={(e) => setNewPortfolio(prev => ({ ...prev, title: e.target.value }))}
                                    />
                                    <Textarea
                                        placeholder="Descriere"
                                        value={newPortfolio.description}
                                        onChange={(e) => setNewPortfolio(prev => ({ ...prev, description: e.target.value }))}
                                        rows={1}
                                    />
                                    <Input
                                        placeholder="URL imagine"
                                        value={newPortfolio.image}
                                        onChange={(e) => setNewPortfolio(prev => ({ ...prev, image: e.target.value }))}
                                    />
                                    <Input
                                        placeholder="URL proiect"
                                        value={newPortfolio.url}
                                        onChange={(e) => setNewPortfolio(prev => ({ ...prev, url: e.target.value }))}
                                    />
                                    <Button onClick={addPortfolio} size="sm">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {profileData.portfolio.map((project, index) => (
                                        <div key={index} className="border rounded-lg overflow-hidden">
                                            <div className="aspect-video bg-muted">
                                                {project.image && (
                                                    <img
                                                        src={project.image}
                                                        alt={project.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                )}
                                            </div>
                                            <div className="p-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h4 className="font-medium">{project.title}</h4>
                                                        <p className="text-sm text-muted-foreground">{project.description}</p>
                                                    </div>
                                                    <Button variant="ghost" size="sm" onClick={() => removePortfolio(index)}>
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            <Footer />
        </div>
    );
}
