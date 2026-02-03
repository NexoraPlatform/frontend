import {TabsContent} from "@/components/ui/tabs";
import {Card, CardHeader, CardTitle, CardContent} from "@/components/ui/card";
import {
    Bell,
    Building2,
    CreditCard,
    DollarSign,
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
import React, {useEffect, useState} from "react";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import {AiFillBank} from "react-icons/ai";
import {Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {BankInput} from "@/components/ui/bankinput";
import {cn} from "@/lib/utils";
import {FaAddressCard} from "react-icons/fa";

export default function SettingsComponent() {
    const { user, loading, userLoading } = useAuth();
    const isProvider = user?.roles?.some((r: any) => r.slug?.toLowerCase() === 'provider');
    const t = useTranslations();
    const [openCompanyInformationsDialog, setOpenCompanyInformationsDialog] = useState<boolean>(false);
    const [formDataCompany, setFormDataCompany] = useState({
        company: "",
        represented_by: "",
        email: "",
        address: "",
        city: "",
        state: "",
        postcode: "",
        country: "RO", // Default
        account_number: "", // IBAN
        bank_name: "",
        bic_swift: "",
        identification_type: "CUI", // Default pt firme RO
        identification_value: "",
    });
    const [isIbanValid, setIsIbanValid] = useState(false);

    useEffect(() => {
        if (userLoading) return;

        if (!user) {
            return;
        }
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormDataCompany((prev) => ({ ...prev, [id]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Rapyd Payload:", formDataCompany);
        // Aici apelezi API-ul de save/payout
    };

    if (!user) {
        return null;
    }

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
                {/* 1. Container Principal */}
                <DialogContent className="max-w-3xl mx-auto bg-white dark:bg-[#0B1220] rounded-2xl shadow-2xl border-0 p-0 flex flex-col max-h-[90vh]">

                    {/* 2. HEADER FIX */}
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

                    {/* 3. CONȚINUT SCROLLABIL */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">

                        {/* SECȚIUNEA 1: DETALII COMPANIE */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Nume Companie */}
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

                            {/* Reprezentant */}
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

                            {/* Email Oficial */}
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

                            {/* CUI / Identificare */}
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

                        {/* SECȚIUNEA 2: ADRESA SEDIU */}
                        <div className="bg-white/5 pt-6 border-t border-slate-200 dark:border-slate-800">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100">
                                <MapPin className="w-5 h-5 text-emerald-500" />
                                {t('dashboard.settings.profile.hq_address')}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2 space-y-2">
                                    <Label htmlFor="address">{t('dashboard.settings.profile.street')}</Label>
                                    <Input
                                        id="address"
                                        value={formDataCompany.address}
                                        onChange={handleChange}
                                        placeholder={t('dashboard.settings.profile.placeholders.address')}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="city">{t('dashboard.settings.profile.city')}</Label>
                                    <Input
                                        id="city"
                                        value={formDataCompany.city}
                                        onChange={handleChange}
                                        placeholder={t('dashboard.settings.profile.placeholders.city')}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="state">{t('dashboard.settings.profile.state')}</Label>
                                    <Input
                                        id="state"
                                        value={formDataCompany.state}
                                        onChange={handleChange}
                                        placeholder={t('dashboard.settings.profile.placeholders.state')}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="postcode">{t('dashboard.settings.profile.zip')}</Label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            id="postcode"
                                            value={formDataCompany.postcode}
                                            onChange={handleChange}
                                            placeholder={t('dashboard.settings.profile.placeholders.zip')}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="country">{t('dashboard.settings.profile.country')}</Label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <Input
                                            id="country"
                                            value={formDataCompany.country}
                                            onChange={handleChange}
                                            placeholder={t('dashboard.settings.profile.placeholders.country')}
                                            maxLength={2}
                                            className="pl-10 uppercase"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECȚIUNEA 3: DETALII BANCARE */}
                        <div className="bg-white/5 pt-6 border-t border-slate-200 dark:border-slate-800">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100">
                                <Landmark className="w-5 h-5 text-emerald-500" />
                                {t('dashboard.settings.profile.bank_info')}
                            </h3>

                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    {/* Notă: BankInput are probabil propriul placeholder, dar i-l putem pasa dacă componenta îl acceptă */}
                                    <BankInput
                                        id="iban"
                                        value={formDataCompany.account_number}
                                        onChange={(val, valid) => {
                                            setFormDataCompany(prev => ({ ...prev, account_number: val }));
                                            setIsIbanValid(valid);
                                        }}
                                        label={t('dashboard.settings.profile.iban')}
                                        // placeholder={t('dashboard.settings.profile.placeholders.iban')} // Opțional, dacă BankInput suportă prop-ul
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

                    {/* 4. FOOTER FIX */}
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
