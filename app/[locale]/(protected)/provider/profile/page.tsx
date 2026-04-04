"use client";

import {useState, useEffect, useRef, useCallback} from 'react';
import {useSearchParams} from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/lib/navigation';
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
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import apiClient from "@/lib/api";
import { FetchError } from '@/lib/fetch-client';
import {
    billingDetailsSchema,
    buildCompanyLegalProfilePayload,
    buildLegacyCompanyPayloadAliases,
    createEmptyBillingDetailsValues,
    mapCompanySourceToBillingDetailsValues,
    BillingDetailsFormValues,
} from '@/types/user-forms';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { useForm } from 'react-hook-form';
import * as v from 'valibot';
import { sanitizeHttpUrl } from '@/lib/navigation-security';
import {
    getDashboardTabHref,
} from '@/lib/dashboard-navigation';
import {
    buildProviderProfileSearchParams,
    getDefaultProviderProfileTab,
    resolveProviderProfileTab,
    type ProviderProfileTab,
} from '@/lib/provider-profile-tabs';
import { ProviderDashboardShell } from '@/components/dashboard/provider-dashboard-shell';

type Languages = {
    id: number;
    name: string;
    code: string;
    locale: string;
    flag: string;
    timezone: string;
};

type WeekDay =
    | 'monday'
    | 'tuesday'
    | 'wednesday'
    | 'thursday'
    | 'friday'
    | 'saturday'
    | 'sunday';

type WorkingHour = {
    start: string;
    end: string;
    enabled: boolean;
};

type WorkingHours = Record<WeekDay, WorkingHour>;

type AvailabilityState = {
    status: string;
    hoursPerWeek: number | '';
    timezone: string;
    workingHours: WorkingHours;
    responseTime: string;
};

type ProfileLanguage = {
    name: string;
    level: string;
    flag: string;
};

type ProfileCertification = {
    name: string;
    issuer: string;
    date: string;
    credentialId: string;
    verified: boolean;
};

type ProfileEducation = {
    degree: string;
    institution: string;
    attended_from: string;
    attended_to: string;
    study_area: string;
};

type ProfileWorkHistory = {
    title: string;
    position: string;
    company: string;
    city: string;
    country: string;
    start_date: string;
    end_date: string;
    description: string;
    current_working: boolean;
};

type ProfilePortfolio = {
    title: string;
    description: string;
    image: string;
    technologies: string[];
    url: string;
    role: string;
};

type ProfileDataState = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    bio: string;
    company: string;
    website: string;
    location: string;
    avatar: string;
    availability: AvailabilityState;
    languages: ProfileLanguage[];
    skills: Array<{
        name: string;
        level: string;
        years: number;
    }>;
    certifications: ProfileCertification[];
    education: ProfileEducation[];
    workHistory: ProfileWorkHistory[];
    portfolio: ProfilePortfolio[];
};

const WEEK_DAYS: WeekDay[] = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
];

const DAY_LABELS: Record<WeekDay, string> = {
    monday: 'Luni',
    tuesday: 'Marți',
    wednesday: 'Miercuri',
    thursday: 'Joi',
    friday: 'Vineri',
    saturday: 'Sâmbătă',
    sunday: 'Duminică',
};

type DashboardThemeVars = {
    '--bg-main': string;
    '--bg-card': string;
    '--text-main': string;
    '--text-muted': string;
    '--border-color': string;
    '--header-bg': string;
    '--input-bg': string;
};

const dashboardThemes: Record<'light' | 'dark', DashboardThemeVars> = {
    light: {
        '--bg-main': '#F5F7FA',
        '--bg-card': '#FFFFFF',
        '--text-main': '#0B1C2D',
        '--text-muted': '#64748B',
        '--border-color': 'rgba(226, 232, 240, 0.8)',
        '--header-bg': 'rgba(255, 255, 255, 0.8)',
        '--input-bg': '#F5F7FA',
    },
    dark: {
        '--bg-main': '#06111A',
        '--bg-card': '#0D1F30',
        '--text-main': '#F8FAFC',
        '--text-muted': '#94A3B8',
        '--border-color': 'rgba(255, 255, 255, 0.08)',
        '--header-bg': 'rgba(13, 31, 48, 0.8)',
        '--input-bg': '#06111A',
    },
};

function createDefaultWorkingHours(): WorkingHours {
    return {
        monday: { start: '09:00', end: '18:00', enabled: true },
        tuesday: { start: '09:00', end: '18:00', enabled: true },
        wednesday: { start: '09:00', end: '18:00', enabled: true },
        thursday: { start: '09:00', end: '18:00', enabled: true },
        friday: { start: '09:00', end: '18:00', enabled: true },
        saturday: { start: '10:00', end: '14:00', enabled: false },
        sunday: { start: '10:00', end: '14:00', enabled: false },
    };
}

function normalizeAvailabilityStatus(value: unknown): AvailabilityState['status'] {
    if (typeof value !== 'string') {
        return 'AVAILABLE';
    }

    const normalized = value.trim().toUpperCase();
    if (normalized === 'AVAILABLE' || normalized === 'BUSY' || normalized === 'UNAVAILABLE') {
        return normalized;
    }

    return 'AVAILABLE';
}

function normalizeResponseTime(value: unknown): AvailabilityState['responseTime'] {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) {
            return '2';
        }

        const digits = trimmed.match(/\d+/)?.[0];
        if (digits) {
            return digits;
        }
    }

    return '2';
}

function toTimeValue(value: unknown, fallback: string): string {
    if (typeof value !== 'string') {
        return fallback;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed.slice(0, 5) : fallback;
}

function buildAvailabilityState(providerProfile: any): AvailabilityState {
    const defaultWorkingHours = createDefaultWorkingHours();
    const profile = providerProfile?.profile ?? {};
    const workingHours = WEEK_DAYS.reduce((acc, day) => {
        const defaultHours = defaultWorkingHours[day];
        const enabledValue = profile[`working_${day}_enabled`];

        acc[day] = {
            start: toTimeValue(profile[`working_${day}_from`], defaultHours.start),
            end: toTimeValue(profile[`working_${day}_to`], defaultHours.end),
            enabled: enabledValue === true || enabledValue === 1 || enabledValue === '1',
        };

        return acc;
    }, {} as WorkingHours);

    return {
        status: normalizeAvailabilityStatus(profile.availability ?? profile.availability_status),
        hoursPerWeek:
            typeof profile.working_hours_per_week === 'number'
                ? profile.working_hours_per_week
                : Number.isFinite(Number(profile.working_hours_per_week))
                    ? Number(profile.working_hours_per_week)
                    : '',
        timezone:
            (typeof profile.timezone === 'string' && profile.timezone.trim()) ||
            (typeof providerProfile?.timezone === 'string' && providerProfile.timezone.trim()) ||
            'Europe/Bucharest',
        workingHours,
        responseTime: normalizeResponseTime(profile.answer_hour ?? profile.avg_response_time_minutes),
    };
}

function buildAvailabilityPayload(availability: AvailabilityState): AvailabilityState {
    const defaults = createDefaultWorkingHours();
    const workingHours = WEEK_DAYS.reduce((acc, day) => {
        const current = availability.workingHours?.[day];
        const fallback = defaults[day];

        acc[day] = {
            start: toTimeValue(current?.start, fallback.start),
            end: toTimeValue(current?.end, fallback.end),
            enabled: Boolean(current?.enabled),
        };

        return acc;
    }, {} as WorkingHours);

    return {
        status: normalizeAvailabilityStatus(availability.status),
        hoursPerWeek:
            typeof availability.hoursPerWeek === 'number' && Number.isFinite(availability.hoursPerWeek)
                ? availability.hoursPerWeek
                : '',
        timezone: availability.timezone || 'Europe/Bucharest',
        workingHours,
        responseTime: normalizeResponseTime(availability.responseTime),
    };
}

function deriveLanguageFlag(languageName: string, availableLanguages?: Languages[] | null): string {
    const normalizedName = languageName.trim().toLowerCase();
    if (!normalizedName) {
        return '';
    }

    const matchedLanguage = availableLanguages?.find(
        (item) => item.name.trim().toLowerCase() === normalizedName,
    );

    return matchedLanguage?.flag || '';
}

const providerProfileValidationSchema = v.object({
    firstName: v.pipe(
        v.string(),
        v.trim(),
        v.minLength(1, 'Prenumele este obligatoriu'),
    ),
    lastName: v.pipe(
        v.string(),
        v.trim(),
        v.minLength(1, 'Numele este obligatoriu'),
    ),
    email: v.pipe(
        v.string(),
        v.trim(),
        v.minLength(1, 'Adresa de email este obligatoriu'),
    ),
    phone: v.pipe(
        v.string(),
        v.trim(),
        v.minLength(1, 'Numarul de telefon este obligatoriu'),
    ),
    bio: v.pipe(
        v.string(),
        v.trim(),
        v.minLength(1, 'Descrierea este obligatoriu'),
    ),
    availability: v.object({
        status: v.pipe(
            v.string(),
            v.trim(),
            v.minLength(1, 'Statusul curent este obligatoriu'),
        ),
        hoursPerWeek: v.pipe(
            v.union([v.string(), v.number()]),
            v.check(
                (value) => Boolean(value),
                'Ore pe saptamana este obligatoriu',
            ),
        ),
    }),
});

const providerProfileErrorPathMap: Record<string, string> = {
    firstName: 'firstName',
    lastName: 'lastName',
    email: 'email',
    phone: 'phone',
    bio: 'bio',
    'availability.status': 'availability_status',
    'availability.hoursPerWeek': 'hours_per_week',
};

export default function ProviderProfileEditPage() {
    const t = useTranslations();
    const { user, loading, userLoading } = useAuth();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const defaultTab = getDefaultProviderProfileTab();
    const sectionParam = searchParams.get('section');
    const resolvedTabFromUrl = resolveProviderProfileTab(sectionParam, defaultTab);
    const [activeTab, setActiveTab] = useState<ProviderProfileTab>(resolvedTabFromUrl);
    const {
        data: providerProfile,
        loading: profileLoading,
        refetch: refetchProviderProfile,
    } = useProviderProfile(!userLoading && Boolean(user));
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [showCrop, setShowCrop] = useState(false);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const { data: languages } = useGetLanguages();
    const billingForm = useForm<BillingDetailsFormValues>({
        resolver: valibotResolver(billingDetailsSchema),
        defaultValues: createEmptyBillingDetailsValues(),
    });
    const updateSectionQuery = useCallback((value: ProviderProfileTab) => {
        const params = buildProviderProfileSearchParams(searchParams, value, defaultTab);
        const query = params.toString();
        const basePath = pathname || '/provider/profile';
        const nextUrl = query ? `${basePath}?${query}` : basePath;
        const currentQuery = searchParams.toString();
        const currentUrl = currentQuery ? `${basePath}?${currentQuery}` : basePath;

        if (nextUrl === currentUrl) {
            return;
        }

        router.replace(nextUrl, { scroll: false });
    }, [defaultTab, pathname, router, searchParams]);

    const handleTabChange = useCallback((value: string) => {
        const nextTab = resolveProviderProfileTab(value, defaultTab);
        setActiveTab((current) => (current === nextTab ? current : nextTab));
        updateSectionQuery(nextTab);
    }, [defaultTab, updateSectionQuery]);

    const [profileData, setProfileData] = useState<ProfileDataState>({
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
            status: 'AVAILABLE',
            hoursPerWeek: 40,
            timezone: 'Europe/Bucharest',
            workingHours: createDefaultWorkingHours(),
            responseTime: '2'
        },

        // Languages
        languages: [],

        // Skills
        skills: [],

        // Certifications
        certifications: [],

        // Education
        education: [],

        // Work History
        workHistory: [],

        // Portfolio
        portfolio: []
    });

    useEffect(() => {
        if (sectionParam !== null) {
            const normalizedSection = sectionParam.trim();
            const shouldNormalizeQuery =
                normalizedSection !== resolvedTabFromUrl || resolvedTabFromUrl === defaultTab;

            if (shouldNormalizeQuery) {
                setActiveTab((current) => (current === resolvedTabFromUrl ? current : resolvedTabFromUrl));
                updateSectionQuery(resolvedTabFromUrl);
                return;
            }
        }

        setActiveTab((current) => (current === resolvedTabFromUrl ? current : resolvedTabFromUrl));
    }, [defaultTab, resolvedTabFromUrl, sectionParam, updateSectionQuery]);

    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const validate = () => {
        const validation = v.safeParse(providerProfileValidationSchema, {
            firstName: profileData.firstName,
            lastName: profileData.lastName,
            email: profileData.email,
            phone: profileData.phone,
            bio: profileData.bio,
            availability: {
                status: profileData.availability.status,
                hoursPerWeek: profileData.availability.hoursPerWeek,
            },
        });

        if (validation.success) {
            setErrors({});
            return true;
        }

        const newErrors = validation.issues.reduce<{ [key: string]: string }>(
            (acc, issue) => {
                const dotPath = issue.path
                    ?.map((item) =>
                        typeof item.key === 'string' ||
                        typeof item.key === 'number'
                            ? String(item.key)
                            : '',
                    )
                    .filter(Boolean)
                    .join('.');
                const mappedKey = dotPath
                    ? providerProfileErrorPathMap[dotPath]
                    : undefined;

                if (mappedKey && !acc[mappedKey]) {
                    acc[mappedKey] = issue.message;
                }

                return acc;
            },
            {},
        );

        setErrors(newErrors);
        return false;
    };

    const [newLanguage, setNewLanguage] = useState({ name: '', level: 'Basic', flag: '' });
    const [newCertification, setNewCertification] = useState({
        name: '', issuer: '', date: '', credentialId: '', verified: false
    });
    const [newEducation, setNewEducation] = useState({
        degree: '', institution: '', attended_from: '', attended_to: '', study_area: ''
    });
    const [newWork, setNewWork] = useState({
        title: '', position: '', company: '', city: '', country: '', start_date: '', end_date: '', description: '', current_working: false
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
                website: providerProfile.profile?.website || providerProfile?.website || '',
                location: providerProfile.profile?.location || '',
                avatar: providerProfile?.avatar || '',

                // Availability
                availability: buildAvailabilityState(providerProfile),

                // Languages
                languages: (providerProfile.languages || []).map((lang: any) => ({
                    name: lang.language || lang.name || '',
                    level: lang.proficiency || lang.level || 'Basic',
                    flag: deriveLanguageFlag(lang.language || lang.name || '', languages),
                })),

                // Skills
                skills: [],

                // Certifications
                certifications: (providerProfile?.certifications ?? []).map((cert: any) => ({
                    name: cert?.name ?? '',
                    issuer: cert?.issuer_name ?? '',
                    date: cert?.issued_at ?? '',
                    credentialId: cert?.credential_id ?? '',
                    verified: cert?.verified ?? false,
                })),

                // Education
                education: (providerProfile?.education || providerProfile?.educations || []).map((edu: any) => ({
                    degree: edu?.degree || '',
                    institution: edu?.institution || '',
                    attended_from: edu?.attended_from || '',
                    attended_to: edu?.attended_to || '',
                    study_area: edu?.study_area || '',
                })),
                // Work History
                workHistory: (providerProfile.work_history || providerProfile.workHistory || []).map((work: any) => ({
                    title: work.title || '',
                    position: work.position || '',
                    company: work.company || '',
                    city: work.city || '',
                    country: work.country || '',
                    start_date: work.start_date || '',
                    end_date: work.end_date || '',
                    description: work.description || '',
                    current_working: Boolean(work.current_working)
                })),

                // Portfolio
                portfolio: (providerProfile.portfolio || providerProfile.portfolios || []).map((item: any) => ({
                    title: item.project_title || item.title || '',
                    description: item.description || '',
                    image: item.image || '',
                    role: item.role || '',
                    technologies: item.technologies_used || item.technologies || [],
                    url: item.url || '',
                }))

            }));
            billingForm.reset(mapCompanySourceToBillingDetailsValues(providerProfile));

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
    }, [providerProfile, billingForm, languages]);

    useEffect(() => {
        if (userLoading || profileLoading) {
            return;
        }

        if (!user) {
            router.push('/auth/signin');
            return;
        }

        if (providerProfile) {
            loadProfileData();
        }
    }, [user, userLoading, router, profileLoading, providerProfile, loadProfileData]);

    function readFile(file: File): Promise<string | ArrayBuffer | null> {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => resolve(reader.result));
            reader.readAsDataURL(file);
        });
    }

    function dataUrlToFile(dataUrl: string, fileName: string): File {
        const [metadata, base64Payload] = dataUrl.split(',');

        if (!metadata || !base64Payload) {
            throw new Error('Imaginea decupată are un format invalid.');
        }

        const mimeType = metadata.match(/data:(.*?);base64/)?.[1] || 'image/png';
        const binary = window.atob(base64Payload);
        const bytes = new Uint8Array(binary.length);

        for (let index = 0; index < binary.length; index += 1) {
            bytes[index] = binary.charCodeAt(index);
        }

        return new File([bytes], fileName, { type: mimeType });
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

        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
            const safeFirstName = user?.firstName?.trim() || 'user';
            const safeLastName = user?.lastName?.trim() || 'avatar';
            const file = dataUrlToFile(
                String(croppedImage),
                `avatar_${safeFirstName}-${safeLastName}.png`,
            );

            const response = await apiClient.uploadAvatar(file);

            const imageUrl = response.url || null;

            setProfileData((prev: any) => ({ ...prev, avatar: imageUrl }));
            setShowCrop(false);
            setImageSrc('');
        } catch (error: any) {
            setError(error?.message || 'Eroare la încărcarea avatarului.');
        }
    };

    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const billingValues = billingForm.getValues();
            const companyData = buildCompanyLegalProfilePayload(billingValues, {
                fallbackCommercialName: profileData.company,
                fallbackLegalName: profileData.company,
                authorizedSignatoryName: `${profileData.firstName} ${profileData.lastName}`.trim(),
                authorizedSignatoryEmail: profileData.email,
            });
            // Save profile data
            await apiClient.updateProviderProfile({
                ...profileData,
                availability: buildAvailabilityPayload(profileData.availability),
                ...companyData,
                ...buildLegacyCompanyPayloadAliases(companyData),
            });
            await refetchProviderProfile();
            setSuccess('Profilul a fost actualizat cu succes!');
            setTimeout(() => setSuccess(''), 3000);
        } catch (error: any) {
            if (error instanceof FetchError) {
                setError(
                    error.status === 422
                        ? 'Verifică datele introduse. Unele câmpuri nu respectă validarea backend.'
                        : error.message || 'A apărut o eroare la salvare',
                );
            } else {
                setError(error.message || 'A apărut o eroare la salvare');
            }
        } finally {
            setSaving(false);
        }
    };

    const addLanguage = () => {
        if (newLanguage.name && newLanguage.level) {
            setProfileData(prev => ({
                ...prev,
                languages: [
                    ...prev.languages,
                    { ...newLanguage, flag: deriveLanguageFlag(newLanguage.name, languages) },
                ]
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
            setNewWork({ title: '', position: '', company: '', city: '', country: '', start_date: '', end_date: '', description: '', current_working: false });
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

    if (loading || userLoading) {
        return (
            <div
                className="flex h-screen items-center justify-center"
                style={{
                    backgroundColor: dashboardThemes.light['--bg-main'],
                    color: dashboardThemes.light['--text-main'],
                }}
            >
                <Loader2 className="h-8 w-8 animate-spin text-[#1BC47D]" />
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
    const timezoneOptions: string[] = Array.from(
        new Set<string>(
            (languages || [])
                .map((lang: Languages) => lang.timezone)
                .filter((timezone: string): timezone is string => Boolean(timezone)),
        ),
    );
    const trustBadges = Array.isArray(providerProfile?.profile?.badges)
        ? providerProfile.profile.badges.filter((badge: unknown): badge is string => typeof badge === 'string' && badge.trim().length > 0)
        : [];
    const nameHasChanged =
        providerProfile &&
        (
            profileData.firstName.trim() !== String(providerProfile.firstName || '').trim() ||
            profileData.lastName.trim() !== String(providerProfile.lastName || '').trim()
        );

    return (
        <ProviderDashboardShell
            title="Editează Profilul"
            description="Completează informațiile pentru a atrage mai mulți clienți"
            activeMenu="edit-profile"
            headerActions={
                <>
                    <Button
                        variant="outline"
                        className="hidden sm:inline-flex"
                        onClick={() => router.push(`/provider/${user.profile_url}`)}
                    >
                        <Eye className="mr-2 h-4 w-4" />
                        Previzualizare
                    </Button>
                    <Button className="btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Se salvează...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Salvează
                            </>
                        )}
                    </Button>
                </>
            }
            mobileQuickActions={
                <>
                    <Button size="sm" variant="outline" onClick={() => router.push(getDashboardTabHref('overview'))}>Dashboard</Button>
                    <Button size="sm" variant="outline" onClick={() => router.push(getDashboardTabHref('projects'))}>Proiecte</Button>
                    <Button size="sm" variant="outline" onClick={() => router.push(`/provider/${user.profile_url}`)}>Previzualizare</Button>
                </>
            }
        >
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
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
                    <TabsList
                        className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl border p-1 md:grid-cols-3 xl:grid-cols-6"
                        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}
                    >
                        <TabsTrigger className="rounded-lg data-[state=active]:bg-[#1BC47D]/10 data-[state=active]:text-[#1BC47D]" value="basic">Informații de Bază</TabsTrigger>
                        <TabsTrigger className="rounded-lg data-[state=active]:bg-[#1BC47D]/10 data-[state=active]:text-[#1BC47D]" value="availability">Disponibilitate</TabsTrigger>
                        <TabsTrigger className="rounded-lg data-[state=active]:bg-[#1BC47D]/10 data-[state=active]:text-[#1BC47D]" value="languages">Limbi & Certificări</TabsTrigger>
                        <TabsTrigger className="rounded-lg data-[state=active]:bg-[#1BC47D]/10 data-[state=active]:text-[#1BC47D]" value="experience">Experiență</TabsTrigger>
                        <TabsTrigger className="rounded-lg data-[state=active]:bg-[#1BC47D]/10 data-[state=active]:text-[#1BC47D]" value="education">Educație</TabsTrigger>
                        <TabsTrigger className="rounded-lg data-[state=active]:bg-[#1BC47D]/10 data-[state=active]:text-[#1BC47D]" value="portfolio">Portofoliu</TabsTrigger>
                    </TabsList>

                    {/* Basic Information */}
                    <TabsContent value="basic" className="space-y-6">
                        <Card className="glass-card">
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
                                        <DialogTitle>Decupează poza de profil</DialogTitle>
                                        <DialogDescription>
                                            Ajustează cadrul imaginii și salvează avatarul actualizat.
                                        </DialogDescription>
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
                                        <Button onClick={handleUpload} className="btn-primary mt-4 w-full">
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

                                {nameHasChanged && (
                                    <Alert className="border-amber-200 bg-amber-50">
                                        <AlertCircle className="h-4 w-4 text-amber-600" />
                                        <AlertDescription className="text-amber-900">
                                            Schimbarea numelui poate regenera URL-ul public al profilului provider.
                                        </AlertDescription>
                                    </Alert>
                                )}

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

                                <div className="grid xs:grid-cols-1 md:grid-cols-2 gap-4">
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
                                            placeholder="Mamaia Sat, Navodari, România, 905700"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <CheckCircle className="w-5 h-5" />
                                    <span>Metadate de Încredere</span>
                                </CardTitle>
                                <CardDescription>
                                    Aceste valori sunt generate de sistem și sunt afișate doar în regim read-only.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    <div className="rounded-lg border p-4">
                                        <p className="text-sm text-muted-foreground">Rating</p>
                                        <p className="text-xl font-semibold">{providerProfile?.rating ?? '-'}</p>
                                    </div>
                                    <div className="rounded-lg border p-4">
                                        <p className="text-sm text-muted-foreground">Review-uri</p>
                                        <p className="text-xl font-semibold">{providerProfile?.reviewCount ?? providerProfile?.review_count ?? 0}</p>
                                    </div>
                                    <div className="rounded-lg border p-4">
                                        <p className="text-sm text-muted-foreground">Job Success Score</p>
                                        <p className="text-xl font-semibold">{providerProfile?.profile?.job_success_score ?? '-'}</p>
                                    </div>
                                    <div className="rounded-lg border p-4">
                                        <p className="text-sm text-muted-foreground">Proiecte finalizate</p>
                                        <p className="text-xl font-semibold">{providerProfile?.profile?.total_projects_completed ?? 0}</p>
                                    </div>
                                    <div className="rounded-lg border p-4">
                                        <p className="text-sm text-muted-foreground">Rată de răspuns</p>
                                        <p className="text-xl font-semibold">{providerProfile?.profile?.response_rate ?? '-'}</p>
                                    </div>
                                    <div className="rounded-lg border p-4">
                                        <p className="text-sm text-muted-foreground">Timp mediu de răspuns</p>
                                        <p className="text-xl font-semibold">{providerProfile?.profile?.avg_response_time_minutes ?? '-'}</p>
                                    </div>
                                    <div className="rounded-lg border p-4">
                                        <p className="text-sm text-muted-foreground">KYC</p>
                                        <p className="text-xl font-semibold">{providerProfile?.profile?.kyc_status ?? '-'}</p>
                                    </div>
                                    <div className="rounded-lg border p-4">
                                        <p className="text-sm text-muted-foreground">Verificare test</p>
                                        <p className="text-xl font-semibold">{providerProfile?.testVerified ? 'Da' : 'Nu'}</p>
                                    </div>
                                    <div className="rounded-lg border p-4">
                                        <p className="text-sm text-muted-foreground">Verificare apel</p>
                                        <p className="text-xl font-semibold">{providerProfile?.callVerified ? 'Da' : 'Nu'}</p>
                                    </div>
                                </div>

                                {typeof providerProfile?.profile?.total_earned_cents === 'number' && (
                                    <div className="rounded-lg border p-4">
                                        <p className="text-sm text-muted-foreground">Total câștigat</p>
                                        <p className="text-xl font-semibold">
                                            {(providerProfile.profile.total_earned_cents / 100).toLocaleString('ro-RO', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </p>
                                    </div>
                                )}

                                {trustBadges.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-sm text-muted-foreground">Badge-uri</p>
                                        <div className="flex flex-wrap gap-2">
                                            {trustBadges.map((badge: string) => (
                                                <Badge key={badge} variant="outline">{badge}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Availability */}
                    <TabsContent value="availability" className="space-y-6">
                        <div className="grid xs:grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="glass-card">
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
                                                    availability: {
                                                        ...prev.availability,
                                                        hoursPerWeek: e.target.value === '' ? '' : parseInt(e.target.value, 10),
                                                    }
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
                                                {timezoneOptions.map((timezone) => (
                                                    <SelectItem key={timezone} value={timezone}>{timezone}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="glass-card">
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
                                            return (
                                                <div key={day} className="flex items-center space-x-4">
                                                    <div className="w-20 text-sm font-medium">
                                                        {DAY_LABELS[day as WeekDay]}
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
                            <Card className="glass-card">
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
                                            onValueChange={(value) =>
                                                setNewLanguage((prev) => ({
                                                    ...prev,
                                                    name: value,
                                                    flag: deriveLanguageFlag(value, languages),
                                                }))
                                            }
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

                                    <p className="text-sm text-muted-foreground">
                                        Steagul este derivat local din limba selectată. Backend-ul nu păstrează `languages.flag` ca sursă de adevăr.
                                    </p>

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
                            <Card className="glass-card">
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
                                                        {cert.issuer} • {cert.date ? new Date(cert.date).toLocaleDateString('ro-RO') : 'Fără dată'}
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
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Briefcase className="w-5 h-5" />
                                    <span>Experiență Profesională</span>
                                </CardTitle>
                                <CardDescription>
                                    Persistența pentru `work_experience` rămâne fragilă în backend-ul actual. Formularul este complet, dar salvează cu prudență și verifică rezultatul după submit.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/*<Alert className="border-amber-200 bg-amber-50">*/}
                                {/*    <AlertCircle className="h-4 w-4 text-amber-600" />*/}
                                {/*    <AlertDescription className="text-amber-900">*/}
                                {/*        Backend-ul poate trata inconsistent `work_experience`. După salvare, profilul este reîncărcat tocmai pentru a confirma ce a persistat.*/}
                                {/*    </AlertDescription>*/}
                                {/*</Alert>*/}

                                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                                    <Input
                                        className="!h-14"
                                        placeholder="Titlu profesional"
                                        value={newWork.title}
                                        onChange={(e) => setNewWork(prev => ({ ...prev, title: e.target.value }))}
                                    />
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
                                    <Input
                                        className="!h-14"
                                        placeholder="Oraș"
                                        value={newWork.city}
                                        onChange={(e) => setNewWork(prev => ({ ...prev, city: e.target.value }))}
                                    />
                                    <Input
                                        className="!h-14"
                                        placeholder="Țară"
                                        value={newWork.country}
                                        onChange={(e) => setNewWork(prev => ({ ...prev, country: e.target.value }))}
                                    />
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <DatePicker
                                            label={'De la data de'}
                                            openTo="day"
                                            value={newWork.start_date ? dayjs(newWork.start_date) : null}
                                            onChange={(val) => setNewWork(prev => ({ ...prev, start_date: val ? dayjs(val).format('YYYY-MM-DD') : '' }))}
                                        />
                                        {!newWork.current_working && (
                                            <DatePicker
                                                label={'Până la'}
                                                openTo="day"
                                                value={newWork.end_date ? dayjs(newWork.end_date) : null}
                                                onChange={(val) => setNewWork(prev => ({ ...prev, end_date: val ? dayjs(val).format('YYYY-MM-DD') : '' }))}
                                            />
                                        )}
                                    </LocalizationProvider>
                                    <Textarea
                                        placeholder="Descriere"
                                        value={newWork.description}
                                        onChange={(e) => setNewWork(prev => ({ ...prev, description: e.target.value }))}
                                        className="!h-14 min-h-[120px] col-span-2"
                                        rows={2}
                                    />
                                    <div className="col-span-2 flex items-center justify-between rounded-lg border p-3">
                                        <div>
                                            <p className="font-medium">Încă lucrez aici</p>
                                            <p className="text-sm text-muted-foreground">Dacă activezi acest câmp, data de final nu mai este necesară.</p>
                                        </div>
                                        <Switch
                                            checked={newWork.current_working}
                                            onCheckedChange={(checked) =>
                                                setNewWork((prev) => ({
                                                    ...prev,
                                                    current_working: checked,
                                                    end_date: checked ? '' : prev.end_date,
                                                }))
                                            }
                                        />
                                    </div>
                                    <Button onClick={addWork} size="sm" className="col-span-2">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {profileData.workHistory.map((work, index) => (
                                        <div key={index} className="border rounded-lg p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    {work.title && (
                                                        <p className="text-sm font-medium text-muted-foreground">{work.title}</p>
                                                    )}
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
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <GraduationCap className="w-5 h-5" />
                                    <span>Educație</span>
                                </CardTitle>
                                <CardDescription>
                                    Perioadele se introduc la nivel de lună și an, în format `YYYY-MM`.
                                </CardDescription>
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
                                        <DatePicker
                                            label={'De la data de'}
                                            views={['month', 'year']}
                                            openTo="year"
                                            value={newEducation.attended_from ? dayjs(newEducation.attended_from) : null}
                                            onChange={(val) => setNewEducation(prev => ({ ...prev, attended_from: val ? dayjs(val).format('YYYY-MM') : '' }))}
                                        />
                                        <DatePicker
                                            label={'Până la'}
                                            views={['month', 'year']}
                                            openTo="year"
                                            value={newEducation.attended_to ? dayjs(newEducation.attended_to) : null}
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
                        <Card className="glass-card">
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
                                    <Input
                                        className="col-span-2"
                                        placeholder="Tehnologii (separate prin virgulă)"
                                        value={newPortfolio.technologies.join(', ')}
                                        onChange={(e) =>
                                            setNewPortfolio((prev) => ({
                                                ...prev,
                                                technologies: e.target.value
                                                    .split(',')
                                                    .map((technology) => technology.trim())
                                                    .filter(Boolean),
                                            }))
                                        }
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
                                                            {project.role && (
                                                                <p className="text-sm text-blue-600">{project.role}</p>
                                                            )}
                                                            <p className="text-sm text-muted-foreground">{project.description}</p>
                                                            {project.technologies.length > 0 && (
                                                                <div className="mt-2 flex flex-wrap gap-2">
                                                                    {project.technologies.map((technology) => (
                                                                        <Badge key={`${project.title}-${technology}`} variant="outline">
                                                                            {technology}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {sanitizeHttpUrl(project.url) && (
                                                                <a
                                                                    href={sanitizeHttpUrl(project.url) ?? undefined}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline"
                                                                >
                                                                    Vezi proiectul
                                                                </a>
                                                            )}
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
        </ProviderDashboardShell>
    );
}
