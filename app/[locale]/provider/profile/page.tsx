"use client";

import {useState, useEffect, useRef, useCallback} from 'react';
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
import Image from 'next/image';
import {
    User,
    Save,
    Plus,
    X,
    Upload,
    AlertCircle,
    CheckCircle,
    Loader2,
    Clock,
    Languages,
    Award,
    GraduationCap,
    Briefcase,
    Calendar,
    Target,
    Eye,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import {useGetLanguages, useProviderProfile} from "@/hooks/use-api";
import {DatePicker, LocalizationProvider} from "@mui/x-date-pickers";
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '@/components/ui/cropImage';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import apiClient from "@/lib/api";

type Languages = {
    id: number;
    name: string;
    code: string;
    locale: string;
    flag: string;
    timezone: string;
}

export default function ProviderProfileEditPage() {
    const { user, loading } = useAuth();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeTab, setActiveTab] = useState('basic');
    const router = useRouter();
    const { data: providerProfile, loading: profileLoading } = useProviderProfile();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [showCrop, setShowCrop] = useState(false);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const { data: languages } = useGetLanguages();

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
            attended_from: string;
            attended_to: string;
            study_area: string;
        }>,

        // Work History
        workHistory: [] as Array<{
            position: string;
            company: string;
            city: string;
            country: string;
            start_date: string;
            end_date: string;
            description: string;
            current_working: boolean;
        }>,

        // Portfolio
        portfolio: [] as Array<{
            title: string;
            description: string;
            image: string;
            technologies: string[];
            url: string;
            role: string;
        }>
    });


    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!profileData.firstName.trim()) {
            newErrors.firstName = 'Prenumele este obligatoriu';
        }
        if (!profileData.lastName.trim()) {
            newErrors.lastName = 'Numele este obligatoriu';
        }
        if (!profileData.email.trim()) {
            newErrors.email = 'Adresa de email este obligatoriu';
        }
        if (!profileData.phone.trim()) {
            newErrors.phone = 'Numarul de telefon este obligatoriu';
        }
        if (!profileData.bio.trim()) {
            newErrors.bio = 'Descrierea este obligatoriu';
        }
        if (!profileData.availability.status.trim()) {
            newErrors.availability_status = 'Statusul curent este obligatoriu';
        }
        if (!profileData.availability.hoursPerWeek) {
            newErrors.hours_per_week = 'Ore pe saptamana este obligatoriu';
        }
        // alte validări...
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const [newLanguage, setNewLanguage] = useState({ name: '', level: 'Basic', flag: '' });
    const [newCertification, setNewCertification] = useState({
        name: '', issuer: '', date: '', credentialId: '', verified: false
    });
    const [newEducation, setNewEducation] = useState({
        degree: '', institution: '', attended_from: '', attended_to: '', study_area: ''
    });
    const [newWork, setNewWork] = useState({
        position: '', company: '', city: '', country: '', start_date: '', end_date: '', description: '', current_working: false
    });
    const [newPortfolio, setNewPortfolio] = useState({
        title: '', description: '', image: '', role: '', technologies: [] as string[], url: ''
    });

    const loadProfileData = useCallback(async () => {
        try {
            // Load existing profile data
            // This would be replaced with actual API call
            setProfileData(prev => ({
                ...prev,
                firstName: providerProfile.firstName,
                lastName: providerProfile.lastName,
                email: providerProfile.email,
                phone: providerProfile.phone || '',
                bio: providerProfile.profile?.bio || '',
                company: providerProfile?.company || '',
                website: providerProfile.profile?.website || '',
                location: providerProfile.profile?.location || '',
                avatar: providerProfile?.avatar || '',

                // Availability
                availability: {
                    status: providerProfile.profile?.availability || 'available',
                    hoursPerWeek: providerProfile.profile?.working_hours_per_week || '',
                    timezone: providerProfile?.timezone || 'Europe/Bucharest',
                    workingHours: {
                        monday: {
                            start: providerProfile.profile?.working_monday_from || '',
                            end: providerProfile.profile?.working_monday_to || '',
                            enabled: providerProfile.profile?.working_monday_enabled || false
                        },
                        tuesday: {
                            start: providerProfile.profile?.working_tuesday_from || '',
                            end: providerProfile.profile?.working_tuesday_to || '',
                            enabled: providerProfile.profile?.working_tuesday_enabled || false
                        },
                        wednesday: {
                            start: providerProfile.profile?.working_wednesday_from || '',
                            end: providerProfile.profile?.working_wednesday_to || '',
                            enabled: providerProfile.profile?.working_wednesday_enabled || false
                        },
                        thursday: {
                            start: providerProfile.profile?.working_thursday_from || '',
                            end: providerProfile.profile?.working_thursday_to || '',
                            enabled: providerProfile.profile?.working_thursday_enabled || false
                        },
                        friday: {
                            start: providerProfile.profile?.working_friday_from || '',
                            end: providerProfile.profile?.working_friday_to || '',
                            enabled: providerProfile.profile?.working_friday_enabled || false
                        },
                        saturday: {
                            start: providerProfile.profile?.working_saturday_from || '',
                            end: providerProfile.profile?.working_saturday_to || '',
                            enabled: providerProfile.profile?.working_saturday_enabled || false
                        },
                        sunday: {
                            start: providerProfile.profile?.working_sunday_from || '',
                            end: providerProfile.profile?.working_sunday_to || '',
                            enabled: providerProfile.profile?.working_sunday_enabled || false
                        }
                    },
                    responseTime: providerProfile.profile?.answer_hour || '2'
                },

                // Languages
                languages: (providerProfile.languages || []).map((lang: any) => ({
                    name: lang.language || '',
                    level: lang.proficiency || '',
                })),

                // Skills
                skills: [] as Array<{
                    name: string;
                    level: string;
                    years: number;
                }>,

                // Certifications
                certifications: (providerProfile?.certifications ?? []).map((cert: any) => ({
                    name: cert?.name ?? '',
                    issuer: cert?.issuer_name ?? '',
                    date: cert?.issued_at ?? '',
                    credentialId: cert?.credential_id ?? '',
                    verified: cert?.verified ?? false,
                })),

                // Education
                education: (providerProfile?.education || []).map((edu: any) => ({
                    degree: edu?.degree || '',
                    institution: edu?.institution || '',
                    attended_from: edu?.attended_from || '',
                    attended_to: edu?.attended_to || '',
                    study_area: edu?.study_area || '',
                })),
                // Work History
                workHistory: (providerProfile.work_history || []).map((work: any) => ({
                    position: work.position || '',
                    company: work.company || '',
                    city: work.city || '',
                    country: work.country || '',
                    start_date: work.start_date || '',
                    end_date: work.end_date || '',
                    description: work.description || '',
                    current_working: work.current_working || ''
                })),

                // Portfolio
                portfolio: (providerProfile.portfolio || []).map((item: any) => ({
                    title: item.project_title || '',
                    description: item.description || '',
                    image: item.image || '',
                    role: item.role || '',
                    technologies: item.technologies_used || [],
                    url: item.url || '',
                }))

            }));

            // profileData.languages.map((language => {
            //     setProfileData(prev => ({
            //         ...prev,
            //         languages: [...prev.languages, {
            //             name: language.name,
            //             level: language.level,
            //             flag: language.flag || ''
            //         }]
            //     });
            // });
        } catch (error: any) {
            setError('Nu s-au putut încărca datele profilului');
        }
    }, [providerProfile]);

    useEffect(() => {
        if (!loading && !user && !profileLoading) {
            router.push('/auth/signin');
        }
        if (user && providerProfile) {
            loadProfileData();
        }
    }, [user, loading, router, profileLoading, providerProfile, loadProfileData]);

    function readFile(file: File): Promise<string | ArrayBuffer | null> {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => resolve(reader.result));
            reader.readAsDataURL(file);
        });
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const imageDataUrl = await readFile(file);
            setImageSrc(imageDataUrl as string);
            setShowCrop(true);
        }
    };

    const onCropComplete = useCallback((_: any, croppedPixels: any) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const handleUpload = async () => {
        if (!imageSrc || !croppedAreaPixels) return;

        const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);

        // Convertim base64 în Blob
        const blob = await fetch(croppedImage as string).then(r => r.blob());

        // Convertim Blob în File (pentru a trimite cu uploadAvatar)
        const file = new File([blob], 'avatar_' + user?.firstName + '-' + user?.lastName + '.jpg', { type: 'image/jpeg' });

        try {
            const response = await apiClient.uploadAvatar(file); // apel metoda ta

            // Exemplu: răspunsul conține URL-ul imaginii salvate în Laravel
            const imageUrl = response.url || null;

            setProfileData((prev: any) => ({ ...prev, avatar: imageUrl }));
            setShowCrop(false);
        } catch (error) {
            console.error('Eroare la încărcarea avatarului:', error);
        }
    };

    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            // Save profile data
            await apiClient.updateProviderProfile(profileData);
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
            setNewLanguage({ name: '', level: 'Basic', flag: '' });
        }
    };

    const removeLanguage = (index: number) => {
        setProfileData(prev => ({
            ...prev,
            languages: prev.languages.filter((_, i) => i !== index)
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
            setNewEducation({ degree: '', institution: '', attended_from: '', attended_to: '', study_area: '' });
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
            setNewWork({ position: '', company: '', city: '', country: '', start_date: '', end_date: '', description: '', current_working: false });
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
            setNewPortfolio({ title: '', description: '', image: '', role: '', technologies: [], url: '' });
        }
    };

    const removePortfolio = (index: number) => {
        setProfileData(prev => ({
            ...prev,
            portfolio: prev.portfolio.filter((_, i) => i !== index)
        }));
    };

    type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    type WorkingHour = {
        start: string;
        end: string;
        enabled: boolean;
    };

    type WorkingHourField = keyof WorkingHour;
    const updateWorkingHours = (day: WeekDay, field: WorkingHourField, value: any) => {
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

    if (!user) {
        return null;
    }

    const languageLevels = ['Native', 'Fluent', 'Conversational', 'Basic'];
    const availabilityStatuses = [
        { value: 'AVAILABLE', label: 'Disponibil' },
        { value: 'BUSY', label: 'Ocupat' },
        { value: 'UNAVAILABLE', label: 'Indisponibil' }
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
                        <TabsTrigger value="languages">Limbi & Certificări</TabsTrigger>
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
                                            {profileData.firstName?.[0]}
                                            {profileData.lastName?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                                            <Upload className="w-4 h-4 mr-2" />
                                            Schimbă Poza
                                        </Button>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Recomandăm o poză profesională (max 2MB)
                                        </p>
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </div>

                                <Dialog open={showCrop} onOpenChange={setShowCrop}>
                                    <DialogContent className="max-w-[400px]">
                                        <div className="relative w-full h-72 bg-gray-100">
                                            {imageSrc && (
                                                <Cropper
                                                    image={imageSrc}
                                                    crop={crop}
                                                    zoom={zoom}
                                                    aspect={1}
                                                    cropShape="round"
                                                    onCropChange={setCrop}
                                                    onCropComplete={onCropComplete}
                                                    onZoomChange={setZoom}
                                                />
                                            )}
                                        </div>
                                        <Button onClick={handleUpload} className="mt-4 w-full">
                                            Salvează imaginea
                                        </Button>
                                    </DialogContent>
                                </Dialog>

                                <div className="grid xs:grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="firstName" className={errors.firstName ? "text-red-500" : ""}>Prenume <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="firstName"
                                            className={errors.firstName ? "border-red-500 focus:ring-red-500" : ""}
                                            value={profileData.firstName}
                                            onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="lastName" className={errors.lastName ? "text-red-500" : ""}>Nume <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="lastName"
                                            className={errors.lastName ? "border-red-500 focus:ring-red-500" : ""}
                                            value={profileData.lastName}
                                            onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid xs:grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="email" className={errors.email ? "text-red-500" : ""}>Email <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="email"
                                            className={errors.email ? "border-red-500 focus:ring-red-500" : ""}
                                            type="email"
                                            value={profileData.email}
                                            onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="phone" className={errors.phone ? "text-red-500" : ""}>Telefon <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="phone"
                                            className={errors.phone ? "border-red-500 focus:ring-red-500" : ""}
                                            value={profileData.phone}
                                            onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                                            placeholder="+40 123 456 789"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="bio" className={errors.bio ? "text-red-500" : ""}>Descriere Profesională <span className="text-red-500">*</span></Label>
                                    <Textarea
                                        id="bio"
                                        className={errors.bio ? "border-red-500 focus:ring-red-500" : ""}
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

                                <div className="grid xs:grid-cols-1 md:grid-cols-3 gap-4">
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
                        <div className="grid xs:grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Clock className="w-5 h-5" />
                                        <span>Status și Disponibilitate</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div>
                                        <Label htmlFor="status" className={errors.availability_status ? "text-red-500" : ""}>Status Curent <span className="text-red-500">*</span> </Label>
                                        <Select
                                            value={profileData.availability.status}
                                            onValueChange={(value) => setProfileData(prev => ({
                                                ...prev,
                                                availability: { ...prev.availability, status: value }
                                            }))}
                                        >
                                            <SelectTrigger className={errors.availability_status ? "border-red-500 focus:ring-red-500" : ""}>
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
                                            <Label htmlFor="hoursPerWeek" className={errors.hours_per_week ? "text-red-500" : ""}>Ore pe săptămână <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="hoursPerWeek"
                                                className={errors.hours_per_week ? "border-red-500 focus:ring-red-500" : ""}
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
                                                    <SelectItem value="1">1 oră</SelectItem>
                                                    <SelectItem value="2">2 ore</SelectItem>
                                                    <SelectItem value="4">4 ore</SelectItem>
                                                    <SelectItem value="8">8 ore</SelectItem>
                                                    <SelectItem value="24">24 ore</SelectItem>
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
                                                {languages?.map((lang: Languages) => (
                                                    <SelectItem key={lang.id} value={lang.timezone}>{lang.timezone}</SelectItem>
                                                ))}
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
                                                <div key={day} className="flex items-center space-x-4">
                                                    <div className="w-20 text-sm font-medium">
                                                        {dayNames[day as WeekDay]}
                                                    </div>
                                                    <Switch
                                                        checked={hours.enabled}
                                                        onCheckedChange={(checked) => updateWorkingHours(day as WeekDay, 'enabled', checked)}
                                                    />
                                                    {hours.enabled && (
                                                        <>
                                                            <Input
                                                                type="time"
                                                                value={hours.start}
                                                                onChange={(e) => updateWorkingHours(day as WeekDay, 'start', e.target.value)}
                                                                className="w-24"
                                                            />
                                                            <span className="text-muted-foreground">-</span>
                                                            <Input
                                                                type="time"
                                                                value={hours.end}
                                                                onChange={(e) => updateWorkingHours(day as WeekDay, 'end', e.target.value)}
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
                    <TabsContent value="languages" className="space-y-6">
                        <div className="grid xs:grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Languages */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Languages className="w-5 h-5" />
                                        <span>Limbi Vorbite</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-2">
                                        <Select
                                            value={newLanguage.name}
                                            onValueChange={(value) => setNewLanguage(prev => ({ ...prev, flag: value }))}
                                            >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selectează o limbă" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {languages?.map((lang: Languages) => (
                                                    <SelectItem key={lang.id} value={lang.name}>{lang.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

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
                                        <Button onClick={addLanguage} size="sm" className="col-span-2">
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

                            {/*/!* Skills *!/*/}
                            {/*<Card>*/}
                            {/*    <CardHeader>*/}
                            {/*        <CardTitle className="flex items-center space-x-2">*/}
                            {/*            <Code className="w-5 h-5" />*/}
                            {/*            <span>Competențe Tehnice</span>*/}
                            {/*        </CardTitle>*/}
                            {/*    </CardHeader>*/}
                            {/*    <CardContent className="space-y-4">*/}
                            {/*        <div className="grid grid-cols-4 gap-2">*/}
                            {/*            <Input*/}
                            {/*                placeholder="Skill"*/}
                            {/*                value={newSkill.name}*/}
                            {/*                onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}*/}
                            {/*            />*/}
                            {/*            <Select*/}
                            {/*                value={newSkill.level}*/}
                            {/*                onValueChange={(value) => setNewSkill(prev => ({ ...prev, level: value }))}*/}
                            {/*            >*/}
                            {/*                <SelectTrigger>*/}
                            {/*                    <SelectValue />*/}
                            {/*                </SelectTrigger>*/}
                            {/*                <SelectContent>*/}
                            {/*                    {skillLevels.map(level => (*/}
                            {/*                        <SelectItem key={level} value={level}>{level}</SelectItem>*/}
                            {/*                    ))}*/}
                            {/*                </SelectContent>*/}
                            {/*            </Select>*/}
                            {/*            <Input*/}
                            {/*                type="number"*/}
                            {/*                placeholder="Ani"*/}
                            {/*                value={newSkill.years}*/}
                            {/*                onChange={(e) => setNewSkill(prev => ({ ...prev, years: parseInt(e.target.value) }))}*/}
                            {/*                min="1"*/}
                            {/*                max="20"*/}
                            {/*            />*/}
                            {/*            <Button onClick={addSkill} size="sm">*/}
                            {/*                <Plus className="w-4 h-4" />*/}
                            {/*            </Button>*/}
                            {/*        </div>*/}

                            {/*        <div className="space-y-2">*/}
                            {/*            {profileData.skills.map((skill, index) => (*/}
                            {/*                <div key={index} className="flex items-center justify-between p-2 border rounded">*/}
                            {/*                    <div className="flex items-center space-x-2">*/}
                            {/*                        <span className="font-medium">{skill.name}</span>*/}
                            {/*                        <Badge variant="outline">{skill.level}</Badge>*/}
                            {/*                        <span className="text-sm text-muted-foreground">{skill.years} ani</span>*/}
                            {/*                    </div>*/}
                            {/*                    <Button variant="ghost" size="sm" onClick={() => removeSkill(index)}>*/}
                            {/*                        <X className="w-4 h-4" />*/}
                            {/*                    </Button>*/}
                            {/*                </div>*/}
                            {/*            ))}*/}
                            {/*        </div>*/}
                            {/*    </CardContent>*/}
                            {/*</Card>*/}

                            {/* Certifications */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Award className="w-5 h-5" />
                                        <span>Certificări</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-2">
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
                                        <Button onClick={addCertification} size="sm" className="col-span-2">
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        {profileData?.certifications.map((cert, index) => (
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
                                <div className="grid grid-cols-2 gap-2">
                                    <Input
                                        className="!h-14"
                                        placeholder="Poziție"
                                        value={newWork.position}
                                        onChange={(e) => setNewWork(prev => ({ ...prev, position: e.target.value }))}
                                    />
                                    <Input
                                        className="!h-14"
                                        placeholder="Companie"
                                        value={newWork.company}
                                        onChange={(e) => setNewWork(prev => ({ ...prev, company: e.target.value }))}
                                    />
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <DatePicker label={'De la data de'} openTo="day"
                                                    defaultValue={newWork.start_date ? dayjs(newWork.start_date) : dayjs()}
                                                    onChange={(val) => setNewEducation(prev => ({ ...prev, start_date: val ? dayjs(val).format('YYYY-MM-DD') : '' }))}
                                        />
                                        <DatePicker label={'Pana la'} openTo="day"
                                                    defaultValue={newWork.end_date ? dayjs(newWork.end_date) : dayjs()}
                                                    onChange={(val) => setNewEducation(prev => ({ ...prev, end_date: val ? dayjs(val).format('YYYY-MM-DD') : '' }))}
                                        />
                                    </LocalizationProvider>
                                    <Textarea
                                        placeholder="Descriere"
                                        value={newWork.description}
                                        onChange={(e) => setNewWork(prev => ({ ...prev, description: e.target.value }))}
                                        className="!h-14 min-h-[120px] col-span-2"
                                        rows={2}
                                    />
                                    <div></div>
                                    <Button onClick={addWork} size="sm" className="col-span-2">
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
                                                    <p className="text-blue-600">{work.city} {work.country}</p>
                                                    <p className="text-sm text-muted-foreground">{work.start_date} • {work.current_working ? 'Present' : work.end_date}</p>
                                                    <p className="text-sm mt-2">{work.description}</p>
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
                                <div className="grid grid-cols-2 gap-2">
                                    <Input
                                        className="!h-14"
                                        placeholder="Diplomă/Grad"
                                        value={newEducation.degree}
                                        onChange={(e) => setNewEducation(prev => ({ ...prev, degree: e.target.value }))}
                                    />
                                    <Input
                                        className="!h-14"
                                        placeholder="Instituție"
                                        value={newEducation.institution}
                                        onChange={(e) => setNewEducation(prev => ({ ...prev, institution: e.target.value }))}
                                    />
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <DatePicker label={'De la data de'} views={['month', 'year']} openTo="year"
                                                    defaultValue={newEducation.attended_from ? dayjs(newEducation.attended_from) : dayjs()}
                                                    onChange={(val) => setNewEducation(prev => ({ ...prev, attended_to: val ? dayjs(val).format('YYYY-MM') : '' }))}
                                        />
                                        <DatePicker label={'Pana la'} views={['month', 'year']} openTo="year"
                                                    defaultValue={newEducation.attended_to ? dayjs(newEducation.attended_to) : dayjs()}
                                                    onChange={(val) => setNewEducation(prev => ({ ...prev, attended_to: val ? dayjs(val).format('YYYY-MM') : '' }))}
                                        />
                                    </LocalizationProvider>

                                    <Input
                                        className="!h-14"
                                        placeholder="Domeniu de studiu"
                                        value={newEducation.study_area}
                                        onChange={(e) => setNewEducation(prev => ({ ...prev, study_area: e.target.value }))}
                                    />
                                    <Button onClick={addEducation} size="sm" className="col-span-2">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {profileData?.education?.map((edu, index) => (
                                        <div key={index} className="border rounded-lg p-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="font-semibold">{edu.degree}</h3>
                                                    <p className="text-blue-600">{edu.institution}</p>
                                                    <p className="text-sm text-muted-foreground">{edu.attended_from}</p>
                                                    <p className="text-sm text-muted-foreground">{edu.attended_to}</p>
                                                    <p className="text-sm mt-2">{edu.study_area}</p>
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
                                <div className="grid grid-cols-2 gap-2">
                                    <Input
                                        placeholder="Titlu proiect"
                                        value={newPortfolio.title}
                                        onChange={(e) => setNewPortfolio(prev => ({ ...prev, title: e.target.value }))}
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
                                    <Input
                                        placeholder="Rol in proiect"
                                        value={newPortfolio.role}
                                        onChange={(e) => setNewPortfolio(prev => ({ ...prev, role: e.target.value }))}
                                    />
                                    <Textarea
                                        placeholder="Descriere"
                                        value={newPortfolio.description}
                                        onChange={(e) => setNewPortfolio(prev => ({ ...prev, description: e.target.value }))}
                                        rows={1}
                                    />
                                    <Button onClick={addPortfolio} size="sm">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>

                                <div className="grid xs:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {profileData.portfolio.map((project, index) => (
                                        <div key={index} className="border rounded-lg overflow-hidden">
                                            <div className="aspect-video bg-muted">
                                                {project.image && (
                                                    <Image
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
