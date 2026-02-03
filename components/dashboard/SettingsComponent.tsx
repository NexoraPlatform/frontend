import {TabsContent} from "@/components/ui/tabs";
import {Card, CardHeader, CardTitle, CardContent} from "@/components/ui/card";
import {
    Bell,
    Building2,
    CreditCard,
    Edit, Files,
    Globe, Hash,
    Landmark,
    Loader2, Mail, MapPin,
    Settings,
    Shield,
    User
} from "lucide-react";
import {useAuth} from "@/contexts/auth-context";
import {useTranslations} from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import React, {useEffect, useState, useMemo} from "react";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {BankInput} from "@/components/ui/bankinput";
import { postcodeValidator, postcodeValidatorExistsForCountry } from 'postcode-validator';
import { Country, State, City }  from 'country-state-city';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Check, ChevronsUpDown } from "lucide-react"; // Adaugă Check și ChevronsUpDown la importurile existente din lucide-react
import { cn } from "@/lib/utils";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export default function SettingsComponent() {
    const { user, loading, userLoading } = useAuth();
    const isProvider = user?.roles?.some((r: any) => r.slug?.toLowerCase() === 'provider');
    const t = useTranslations();
    const [openCompanyInformationsDialog, setOpenCompanyInformationsDialog] = useState<boolean>(false);

    // State-ul formularului
    const [formDataCompany, setFormDataCompany] = useState({
        company: "",
        represented_by: "",
        email: "",
        address: "",
        city: "",
        state: "",
        postcode: "",
        country: "",
        account_number: "",
        bank_name: "",
        bic_swift: "",
        identification_type: "",
        identification_value: "",
    });

    // State-uri pentru gestionarea dropdown-urilor (ISO Codes)
    const [selectedCountryIso, setSelectedCountryIso] = useState("");
    const [selectedCountryName, setSelectedCountryName] = useState<any>("");
    const [selectedCountryFlag, setSelectedCountryFlag] = useState<any>("");
    const [selectedStateIso, setSelectedStateIso] = useState("");
    const [postalCodeError, setPostalCodeError] = useState("");
    const [openCountry, setOpenCountry] = useState(false);
    const [openState, setOpenState] = useState(false);
    const [openCity, setOpenCity] = useState(false);

    // Memoizare liste
    const countries = useMemo(() => Country.getAllCountries(), []);

    const states = useMemo(() => {
        if (!selectedCountryIso) return [];
        return State.getStatesOfCountry(selectedCountryIso);
    }, [selectedCountryIso]);

    const cities = useMemo(() => {
        if (!selectedCountryIso || !selectedStateIso) return [];
        return City.getCitiesOfState(selectedCountryIso, selectedStateIso);
    }, [selectedCountryIso, selectedStateIso]);

    useEffect(() => {
        if (userLoading) return;
        if (!user) return;
    }, [user, userLoading]);

    if (loading || userLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                    <p>{t('dashboard.loading.dashboard')}</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormDataCompany((prev) => ({ ...prev, [id]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Rapyd Payload:", formDataCompany);
    };

    const validateZip = (code: string, countryIso: string) => {
        if (!code || !countryIso) return true;
        if (postcodeValidatorExistsForCountry(countryIso)) {
            return postcodeValidator(code, countryIso);
        }
        return code.length >= 3;
    };

    const handlePostcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const code = e.target.value;
        setFormDataCompany(prev => ({ ...prev, postcode: code }));
        if (code && !validateZip(code, selectedCountryIso)) {
            setPostalCodeError(t('dashboard.settings.profile.errors.invalid_zip'));
        } else {
            setPostalCodeError("");
        }
    };

    // --- LOGICA MODIFICATĂ PENTRU CASCADARE COMPLETĂ ---

    const handleCountryChange = (isoCode: string) => {
        const countryData = Country.getCountryByCode(isoCode);
        const availableStates = State.getStatesOfCountry(isoCode);

        let firstStateIso = "";
        let firstStateName = "";
        let firstCityName = "";

        // 1. Alegem primul județ disponibil
        if (availableStates.length > 0) {
            firstStateIso = availableStates[0].isoCode;
            firstStateName = availableStates[0].name;

            // 2. Alegem primul oraș din acel județ
            const availableCities = City.getCitiesOfState(isoCode, firstStateIso);
            if (availableCities.length > 0) {
                firstCityName = availableCities[0].name;
            }
        }

        // Actualizăm UI States
        setSelectedCountryIso(isoCode);
        setSelectedCountryFlag(countryData?.flag);
        setSelectedCountryName(countryData?.name);
        setSelectedStateIso(firstStateIso); // Setează dropdown-ul județului pe prima valoare

        // Actualizăm Form Data
        setFormDataCompany(prev => ({
            ...prev,
            country: isoCode,
            state: firstStateName,
            city: firstCityName,
            postcode: prev.postcode
        }));

        // Revalidare zip
        if (formDataCompany.postcode && !validateZip(formDataCompany.postcode, isoCode)) {
            setPostalCodeError(t('dashboard.settings.profile.errors.invalid_zip'));
        } else {
            setPostalCodeError("");
        }
    };

    const handleStateChange = (isoCode: string) => {
        const stateData = State.getStateByCodeAndCountry(isoCode, selectedCountryIso);

        // 1. Găsim orașele pentru noul județ
        const availableCities = City.getCitiesOfState(selectedCountryIso, isoCode);
        let firstCityName = "";

        // 2. Alegem primul oraș disponibil
        if (availableCities.length > 0) {
            firstCityName = availableCities[0].name;
        }

        setSelectedStateIso(isoCode);

        setFormDataCompany(prev => ({
            ...prev,
            state: stateData?.name || "",
            city: firstCityName // <--- Setează automat primul oraș
        }));
    };

    const handleCityChange = (cityName: string) => {
        setFormDataCompany(prev => ({
            ...prev,
            city: cityName
        }));
    };

    return (
        <>
            <TabsContent value="settings" className="space-y-6">
                <div className="grid xs:grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Profile Settings */}
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <User className="w-5 h-5" />
                                <span>{t('dashboard.settings.profile.title')}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center space-x-3">
                                <Avatar className="w-12 h-12">
                                    <AvatarImage src={user.avatar} />
                                    <AvatarFallback>
                                        {user.firstName[0]}{user.lastName[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="font-medium">{user.firstName} {user.lastName}</div>
                                    <div className="text-sm text-muted-foreground">{user.email}</div>
                                </div>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={isProvider ? '/provider/profile' : '/settings/profile'}>
                                        <Edit className="w-4 h-4 mr-1" />
                                        {t('dashboard.actions.edit')}
                                    </Link>
                                </Button>
                            </div>

                            <Button variant="outline" className="w-full justify-start" onClick={() => setOpenCompanyInformationsDialog(true)}>
                                <Building2 className="w-4 h-4 mr-2" />
                                {t('dashboard.settings.profile.company_informations')}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Notification Settings */}
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Bell className="w-5 h-5" />
                                <span>{t('dashboard.settings.notifications.title')}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">{t('dashboard.settings.notifications.email.title')}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {t('dashboard.settings.notifications.email.description')}
                                        </div>
                                    </div>
                                    <input type="checkbox" defaultChecked className="rounded" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">{t('dashboard.settings.notifications.push.title')}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {t('dashboard.settings.notifications.push.description')}
                                        </div>
                                    </div>
                                    <input type="checkbox" defaultChecked className="rounded" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Account Settings */}
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Shield className="w-5 h-5" />
                                <span>{t('dashboard.settings.security.title')}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button variant="outline" className="w-full justify-start">
                                <Settings className="w-4 h-4 mr-2" />
                                {t('dashboard.settings.security.change_password')}
                            </Button>
                            <Button variant="outline" className="w-full justify-start">
                                <Shield className="w-4 h-4 mr-2" />
                                {t('dashboard.settings.security.two_factor')}
                            </Button>
                            <Button variant="outline" className="w-full justify-start">
                                <Globe className="w-4 h-4 mr-2" />
                                {t('dashboard.settings.security.language_preferences')}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            <Dialog open={openCompanyInformationsDialog} onOpenChange={setOpenCompanyInformationsDialog}>
                <DialogContent className="max-w-3xl mx-auto bg-white dark:bg-[#0B1220] rounded-2xl shadow-2xl border-0 p-0 flex flex-col max-h-[90vh]">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                                <Shield className="w-6 h-6 text-[#1BC47D]" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold">
                                    {t('dashboard.settings.profile.company_informations')}
                                </DialogTitle>
                                <DialogDescription className="text-sm">
                                    {t('dashboard.settings.profile.company_informations_subtitle')}
                                </DialogDescription>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Section 1: Company Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="company">{t('dashboard.settings.profile.legal_name')}</Label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        id="company"
                                        value={formDataCompany.company}
                                        onChange={handleChange}
                                        placeholder={t('dashboard.settings.profile.placeholders.company')}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="represented_by">{t('dashboard.settings.profile.represented_by')}</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        id="represented_by"
                                        value={formDataCompany.represented_by}
                                        onChange={handleChange}
                                        placeholder={t('dashboard.settings.profile.placeholders.represented_by')}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">{t('dashboard.settings.profile.contact_email')}</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formDataCompany.email}
                                        onChange={handleChange}
                                        placeholder={t('dashboard.settings.profile.placeholders.email')}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div className="col-span-1 space-y-2">
                                    <Label htmlFor="identification_type">{t('dashboard.settings.profile.id_type')}</Label>
                                    <div className="relative">
                                        <Files className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            id="identification_type"
                                            value={formDataCompany.identification_type}
                                            onChange={handleChange}
                                            placeholder={t('dashboard.settings.profile.placeholders.id_type')}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label htmlFor="identification_value">{t('dashboard.settings.profile.id_code')}</Label>
                                    <Input
                                        id="identification_value"
                                        value={formDataCompany.identification_value}
                                        onChange={handleChange}
                                        placeholder={t('dashboard.settings.profile.placeholders.id_code')}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Address */}
                        <div className="bg-white/5 pt-6 border-t border-slate-200 dark:border-slate-800">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100">
                                <MapPin className="w-5 h-5 text-emerald-500" />
                                {t('dashboard.settings.profile.hq_address')}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Country Select - SEARCHABLE */}
                                <div className="space-y-2">
                                    <Label htmlFor="country">{t('dashboard.settings.profile.country')}</Label>
                                    <div className="relative">
                                        {/* Iconița Absolută */}
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none text-slate-400 text-lg flex items-center justify-center w-5 h-5">
                                            {selectedCountryFlag ? selectedCountryFlag : <Globe className="w-4 h-4" />}
                                        </div>

                                        <Popover open={openCountry} onOpenChange={setOpenCountry}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={openCountry}
                                                    className="w-full justify-between pl-10 font-normal border-slate-200 dark:border-slate-800 bg-transparent hover:bg-transparent text-left"
                                                >
                                                    {selectedCountryName
                                                        ? <span className="pl-5">{selectedCountryName}</span>
                                                        : <span className="pl-5 text-muted-foreground ">{t('dashboard.settings.profile.placeholders.country')}</span>}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[350px] p-0" align="start">
                                                <Command>
                                                    <CommandInput placeholder="Search country..." />
                                                    <CommandList>
                                                        <CommandEmpty>No country found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {countries.map((country) => (
                                                                <CommandItem
                                                                    key={country.isoCode}
                                                                    value={country.name} // Căutarea se face după nume
                                                                    onSelect={() => {
                                                                        handleCountryChange(country.isoCode);
                                                                        setOpenCountry(false);
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            selectedCountryIso === country.isoCode ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    <span className="pl-10 mr-2 text-lg">{country.flag}</span>
                                                                    {country.name}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>

                                {/* State Select - SEARCHABLE */}
                                <div className="space-y-2">
                                    <Label htmlFor="state">{t('dashboard.settings.profile.state')}</Label>
                                    <div className="relative">
                                        {states.length > 0 ? (
                                            <Popover open={openState} onOpenChange={setOpenState}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={openState}
                                                        disabled={!selectedCountryIso}
                                                        className="w-full justify-between font-normal border-slate-200 dark:border-slate-800 bg-transparent hover:bg-transparent"
                                                    >
                                                        {formDataCompany.state
                                                            ? formDataCompany.state
                                                            : <span className="text-muted-foreground">{t('dashboard.settings.profile.placeholders.state')}</span>}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[350px] p-0" align="start">
                                                    <Command>
                                                        <CommandInput placeholder="Search state..." />
                                                        <CommandList>
                                                            <CommandEmpty>No state found.</CommandEmpty>
                                                            <CommandGroup>
                                                                {states.map((state) => (
                                                                    <CommandItem
                                                                        key={state.isoCode}
                                                                        value={state.name}
                                                                        onSelect={() => {
                                                                            handleStateChange(state.isoCode);
                                                                            setOpenState(false);
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                selectedStateIso === state.isoCode ? "opacity-100" : "opacity-0"
                                                                            )}
                                                                        />
                                                                        {state.name}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        ) : (
                                            <Input
                                                id="state"
                                                value={formDataCompany.state}
                                                onChange={handleChange}
                                                placeholder={t('dashboard.settings.profile.placeholders.state')}
                                                disabled={!selectedCountryIso}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* City Select - SEARCHABLE */}
                                <div className="space-y-2">
                                    <Label htmlFor="city">{t('dashboard.settings.profile.city')}</Label>
                                    <div className="relative">
                                        {cities.length > 0 ? (
                                            <Popover open={openCity} onOpenChange={setOpenCity}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={openCity}
                                                        disabled={!selectedStateIso}
                                                        className="w-full justify-between font-normal border-slate-200 dark:border-slate-800 bg-transparent hover:bg-transparent"
                                                    >
                                                        {formDataCompany.city
                                                            ? formDataCompany.city
                                                            : <span className="text-muted-foreground">{t('dashboard.settings.profile.placeholders.city')}</span>}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[350px] p-0" align="start">
                                                    <Command>
                                                        <CommandInput placeholder="Search city..." />
                                                        <CommandList>
                                                            <CommandEmpty>No city found.</CommandEmpty>
                                                            <CommandGroup>
                                                                {cities.map((city) => (
                                                                    <CommandItem
                                                                        key={city.name}
                                                                        value={city.name}
                                                                        onSelect={(currentValue) => {
                                                                            handleCityChange(city.name); // Folosim city.name direct
                                                                            setOpenCity(false);
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                formDataCompany.city === city.name ? "opacity-100" : "opacity-0"
                                                                            )}
                                                                        />
                                                                        {city.name}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        ) : (
                                            <Input
                                                id="city"
                                                value={formDataCompany.city}
                                                onChange={handleChange}
                                                placeholder={t('dashboard.settings.profile.placeholders.city')}
                                                disabled={!selectedStateIso && !formDataCompany.state}
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="postcode">{t('dashboard.settings.profile.zip')}</Label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            id="postcode"
                                            value={formDataCompany.postcode}
                                            onChange={handlePostcodeChange}
                                            placeholder={t('dashboard.settings.profile.placeholders.zip')}
                                            className="pl-10"
                                        />
                                    </div>
                                    {postalCodeError && (
                                        <p className="text-xs text-red-500 mt-1 animate-in fade-in slide-in-from-top-1">
                                            {postalCodeError}
                                        </p>
                                    )}
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <Label htmlFor="address">{t('dashboard.settings.profile.street')}</Label>
                                    <Input
                                        id="address"
                                        value={formDataCompany.address}
                                        onChange={handleChange}
                                        placeholder={t('dashboard.settings.profile.placeholders.address')}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Bank Info */}
                        <div className="bg-white/5 pt-6 border-t border-slate-200 dark:border-slate-800">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100">
                                <Landmark className="w-5 h-5 text-emerald-500" />
                                {t('dashboard.settings.profile.bank_info')}
                            </h3>

                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <BankInput
                                        id="iban"
                                        value={formDataCompany.account_number}
                                        onChange={(val, valid) => {
                                            setFormDataCompany(prev => ({ ...prev, account_number: val }));

                                        }}
                                        label={t('dashboard.settings.profile.iban')}
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="bank_name">{t('dashboard.settings.profile.bank_name')}</Label>
                                        <div className="relative">
                                            <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <Input
                                                id="bank_name"
                                                value={formDataCompany.bank_name}
                                                onChange={handleChange}
                                                placeholder={t('dashboard.settings.profile.placeholders.bank_name')}
                                                className="pl-10 uppercase"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="bic_swift">{t('dashboard.settings.profile.bic_swift')}</Label>
                                        <div className="relative">
                                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <Input
                                                id="bic_swift"
                                                value={formDataCompany.bic_swift}
                                                onChange={handleChange}
                                                placeholder={t('dashboard.settings.profile.placeholders.bic')}
                                                className="pl-10 uppercase font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-[#0B1220]">
                        <DialogFooter className="flex-row justify-between gap-3">
                            <Button variant="outline" className="w-full" onClick={() => setOpenCompanyInformationsDialog(false)}>
                                {t('dashboard.settings.profile.close')}
                            </Button>
                            <Button variant="default" className="w-full bg-[#1BC47D] hover:bg-[#159c63]" onClick={handleSubmit}>
                                {t('dashboard.settings.profile.save')}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
