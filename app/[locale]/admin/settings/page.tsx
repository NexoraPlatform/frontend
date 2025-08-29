"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
    Settings,
    ArrowLeft,
    Save,
    Globe,
    DollarSign,
    Mail,
    Shield,
    Bell,
    Users,
    AlertCircle,
    CheckCircle,
    Loader2,
    Clock,
} from 'lucide-react';
import { useAsyncTranslation } from '@/hooks/use-async-translation';
import { usePathname } from 'next/navigation';
import { Locale } from '@/types/locale';

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [settings, setSettings] = useState({
        siteName: 'Nexora',
        siteDescription: 'Platforma românească pentru servicii IT profesionale',
        siteUrl: 'https://nexora.ro',
        adminEmail: 'admin@nexora.ro',
        supportEmail: 'suport@nexora.ro',

        platformCommission: '5',
        minServicePrice: '50',
        maxServicePrice: '50000',
        defaultCurrency: 'RON',
        allowGuestBrowsing: true,
        requireEmailVerification: true,
        autoApproveServices: false,

        stripeEnabled: true,
        paypalEnabled: true,
        bankTransferEnabled: false,
        escrowEnabled: true,

        emailProvider: 'sendgrid',
        smtpHost: '',
        smtpPort: '587',
        smtpUser: '',
        smtpPassword: '',

        twoFactorRequired: false,
        passwordMinLength: '8',
        sessionTimeout: '24',
        maxLoginAttempts: '5',

        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        marketingEmails: false,

        maintenanceMode: false,
        registrationOpen: true,
        featuredServicesCount: '8',
        recentServicesCount: '12',
    });

    const pathname = usePathname();
    const locale = (pathname.split('/')[1] as Locale) || 'ro';

    // ====== Traduceri (TOP-LEVEL, în ordine fixă) ======
    // Header
    const pageTitle               = useAsyncTranslation(locale, 'admin.settings.title');
    const pageSubtitle            = useAsyncTranslation(locale, 'admin.settings.subtitle');
    const savingLabel             = useAsyncTranslation(locale, 'admin.settings.saving');
    const saveAllLabel            = useAsyncTranslation(locale, 'admin.settings.save_all');
    const savedSuccess            = useAsyncTranslation(locale, 'admin.settings.saved_success');

    // Tabs
    const generalTab              = useAsyncTranslation(locale, 'admin.settings.tabs.general');
    const platformTab             = useAsyncTranslation(locale, 'admin.settings.tabs.platform');
    const paymentsTab             = useAsyncTranslation(locale, 'admin.settings.tabs.payments');
    const emailTab                = useAsyncTranslation(locale, 'admin.settings.tabs.email');
    const securityTab             = useAsyncTranslation(locale, 'admin.settings.tabs.security');
    const notificationsTab        = useAsyncTranslation(locale, 'admin.settings.tabs.notifications');

    // Common labels
    const activeLabel             = useAsyncTranslation(locale, 'admin.settings.payments.active');
    const inactiveLabel           = useAsyncTranslation(locale, 'admin.settings.payments.inactive');

    // General section
    const general_site_info_title = useAsyncTranslation(locale, 'admin.settings.general.site_info_title');
    const general_site_info_desc  = useAsyncTranslation(locale, 'admin.settings.general.site_info_desc');
    const general_site_name_label = useAsyncTranslation(locale, 'admin.settings.general.site_name_label');
    const general_site_desc_label = useAsyncTranslation(locale, 'admin.settings.general.site_description_label');
    const general_site_url_label  = useAsyncTranslation(locale, 'admin.settings.general.site_url_label');

    const general_contact_title   = useAsyncTranslation(locale, 'admin.settings.general.contact_title');
    const general_contact_desc    = useAsyncTranslation(locale, 'admin.settings.general.contact_desc');
    const general_admin_email_lbl = useAsyncTranslation(locale, 'admin.settings.general.admin_email_label');
    const general_support_email_lbl = useAsyncTranslation(locale, 'admin.settings.general.support_email_label');

    // Platform section
    const platform_financial_title  = useAsyncTranslation(locale, 'admin.settings.platform.financial_title');
    const platform_financial_desc   = useAsyncTranslation(locale, 'admin.settings.platform.financial_desc');
    const platform_commission_label = useAsyncTranslation(locale, 'admin.settings.platform.commission_label');
    const platform_min_price_label  = useAsyncTranslation(locale, 'admin.settings.platform.min_price_label');
    const platform_max_price_label  = useAsyncTranslation(locale, 'admin.settings.platform.max_price_label');
    const platform_currency_label   = useAsyncTranslation(locale, 'admin.settings.platform.currency_label');

    const platform_currency_opt_RON = useAsyncTranslation(locale, 'admin.settings.platform.currency_options.RON');
    const platform_currency_opt_EUR = useAsyncTranslation(locale, 'admin.settings.platform.currency_options.EUR');
    const platform_currency_opt_USD = useAsyncTranslation(locale, 'admin.settings.platform.currency_options.USD');

    const platform_user_title     = useAsyncTranslation(locale, 'admin.settings.platform.user_title');
    const platform_user_desc      = useAsyncTranslation(locale, 'admin.settings.platform.user_desc');
    const platform_guest_browse_label = useAsyncTranslation(locale, 'admin.settings.platform.guest_browsing_label');
    const platform_guest_browse_desc  = useAsyncTranslation(locale, 'admin.settings.platform.guest_browsing_desc');
    const platform_email_ver_label    = useAsyncTranslation(locale, 'admin.settings.platform.email_verification_label');
    const platform_email_ver_desc     = useAsyncTranslation(locale, 'admin.settings.platform.email_verification_desc');
    const platform_auto_approve_label = useAsyncTranslation(locale, 'admin.settings.platform.auto_approve_label');
    const platform_auto_approve_desc  = useAsyncTranslation(locale, 'admin.settings.platform.auto_approve_desc');
    const platform_reg_open_label     = useAsyncTranslation(locale, 'admin.settings.platform.registration_open_label');
    const platform_reg_open_desc      = useAsyncTranslation(locale, 'admin.settings.platform.registration_open_desc');

    // Payments section
    const payments_methods_title  = useAsyncTranslation(locale, 'admin.settings.payments.methods_title');
    const payments_methods_desc   = useAsyncTranslation(locale, 'admin.settings.payments.methods_desc');
    const payments_stripe_label   = useAsyncTranslation(locale, 'admin.settings.payments.stripe_label');
    const payments_stripe_desc    = useAsyncTranslation(locale, 'admin.settings.payments.stripe_desc');
    const payments_paypal_label   = useAsyncTranslation(locale, 'admin.settings.payments.paypal_label');
    const payments_paypal_desc    = useAsyncTranslation(locale, 'admin.settings.payments.paypal_desc');
    const payments_bank_label     = useAsyncTranslation(locale, 'admin.settings.payments.bank_transfer_label');
    const payments_bank_desc      = useAsyncTranslation(locale, 'admin.settings.payments.bank_transfer_desc');

    const payments_security_title = useAsyncTranslation(locale, 'admin.settings.payments.security_title');
    const payments_security_desc  = useAsyncTranslation(locale, 'admin.settings.payments.security_desc');
    const payments_escrow_label   = useAsyncTranslation(locale, 'admin.settings.payments.escrow_label');
    const payments_escrow_desc    = useAsyncTranslation(locale, 'admin.settings.payments.escrow_desc');
    const payments_escrow_alert   = useAsyncTranslation(locale, 'admin.settings.payments.escrow_alert');

    // Email config
    const email_config_title      = useAsyncTranslation(locale, 'admin.settings.email.config_title');
    const email_config_desc       = useAsyncTranslation(locale, 'admin.settings.email.config_desc');
    const email_provider_label    = useAsyncTranslation(locale, 'admin.settings.email.provider_label');
    const email_provider_sendgrid = useAsyncTranslation(locale, 'admin.settings.email.provider_options.sendgrid');
    const email_provider_mailgun  = useAsyncTranslation(locale, 'admin.settings.email.provider_options.mailgun');
    const email_provider_smtp     = useAsyncTranslation(locale, 'admin.settings.email.provider_options.smtp');

    const email_smtp_host_label   = useAsyncTranslation(locale, 'admin.settings.email.smtp.host_label');
    const email_smtp_host_ph      = useAsyncTranslation(locale, 'admin.settings.email.smtp.host_placeholder');
    const email_smtp_port_label   = useAsyncTranslation(locale, 'admin.settings.email.smtp.port_label');
    const email_smtp_port_ph      = useAsyncTranslation(locale, 'admin.settings.email.smtp.port_placeholder');
    const email_smtp_user_label   = useAsyncTranslation(locale, 'admin.settings.email.smtp.user_label');
    const email_smtp_pass_label   = useAsyncTranslation(locale, 'admin.settings.email.smtp.password_label');

    // Security
    const security_auth_title     = useAsyncTranslation(locale, 'admin.settings.security.auth_title');
    const security_auth_desc      = useAsyncTranslation(locale, 'admin.settings.security.auth_desc');
    const security_2fa_label      = useAsyncTranslation(locale, 'admin.settings.security.two_factor_label');
    const security_2fa_desc       = useAsyncTranslation(locale, 'admin.settings.security.two_factor_desc');
    const security_pwd_len_label  = useAsyncTranslation(locale, 'admin.settings.security.password_length_label');
    const security_max_attempts   = useAsyncTranslation(locale, 'admin.settings.security.max_attempts_label');

    const security_sessions_title = useAsyncTranslation(locale, 'admin.settings.security.sessions_title');
    const security_sessions_desc  = useAsyncTranslation(locale, 'admin.settings.security.sessions_desc');
    const security_session_timeout_label = useAsyncTranslation(locale, 'admin.settings.security.session_timeout_label');
    const security_session_timeout_desc  = useAsyncTranslation(locale, 'admin.settings.security.session_timeout_desc');

    // Notifications
    const notif_title             = useAsyncTranslation(locale, 'admin.settings.notifications.title');
    const notif_desc              = useAsyncTranslation(locale, 'admin.settings.notifications.desc');
    const notif_email_label       = useAsyncTranslation(locale, 'admin.settings.notifications.email_label');
    const notif_email_desc        = useAsyncTranslation(locale, 'admin.settings.notifications.email_desc');
    const notif_sms_label         = useAsyncTranslation(locale, 'admin.settings.notifications.sms_label');
    const notif_sms_desc          = useAsyncTranslation(locale, 'admin.settings.notifications.sms_desc');
    const notif_push_label        = useAsyncTranslation(locale, 'admin.settings.notifications.push_label');
    const notif_push_desc         = useAsyncTranslation(locale, 'admin.settings.notifications.push_desc');
    const notif_marketing_label   = useAsyncTranslation(locale, 'admin.settings.notifications.marketing_label');
    const notif_marketing_desc    = useAsyncTranslation(locale, 'admin.settings.notifications.marketing_desc');
    // ====== /Traduceri ======

    const handleSave = async () => {
        setLoading(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error('Error saving settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateSetting = (key: string, value: any) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                    <Link href="/admin">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">{pageTitle}</h1>
                        <p className="text-muted-foreground">{pageSubtitle}</p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {savingLabel}
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            {saveAllLabel}
                        </>
                    )}
                </Button>
            </div>

            {saved && (
                <Alert className="mb-6 border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                        {savedSuccess}
                    </AlertDescription>
                </Alert>
            )}

            <Tabs defaultValue="general" className="space-y-6">
                <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="general" className="flex items-center space-x-2">
                        <Globe className="w-4 h-4" />
                        <span className="hidden sm:inline">{generalTab}</span>
                    </TabsTrigger>
                    <TabsTrigger value="platform" className="flex items-center space-x-2">
                        <Settings className="w-4 h-4" />
                        <span className="hidden sm:inline">{platformTab}</span>
                    </TabsTrigger>
                    <TabsTrigger value="payments" className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4" />
                        <span className="hidden sm:inline">{paymentsTab}</span>
                    </TabsTrigger>
                    <TabsTrigger value="email" className="flex items-center space-x-2">
                        <Mail className="w-4 h-4" />
                        <span className="hidden sm:inline">{emailTab}</span>
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center space-x-2">
                        <Shield className="w-4 h-4" />
                        <span className="hidden sm:inline">{securityTab}</span>
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="flex items-center space-x-2">
                        <Bell className="w-4 h-4" />
                        <span className="hidden sm:inline">{notificationsTab}</span>
                    </TabsTrigger>
                </TabsList>

                {/* GENERAL */}
                <TabsContent value="general">
                    <div className="grid xs:grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Globe className="w-5 h-5" />
                                    <span>{general_site_info_title}</span>
                                </CardTitle>
                                <CardDescription>
                                    {general_site_info_desc}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="siteName">{general_site_name_label}</Label>
                                    <Input
                                        id="siteName"
                                        value={settings.siteName}
                                        onChange={(e) => updateSetting('siteName', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="siteDescription">{general_site_desc_label}</Label>
                                    <Textarea
                                        id="siteDescription"
                                        value={settings.siteDescription}
                                        onChange={(e) => updateSetting('siteDescription', e.target.value)}
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="siteUrl">{general_site_url_label}</Label>
                                    <Input
                                        id="siteUrl"
                                        value={settings.siteUrl}
                                        onChange={(e) => updateSetting('siteUrl', e.target.value)}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Mail className="w-5 h-5" />
                                    <span>{general_contact_title}</span>
                                </CardTitle>
                                <CardDescription>
                                    {general_contact_desc}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="adminEmail">{general_admin_email_lbl}</Label>
                                    <Input
                                        id="adminEmail"
                                        type="email"
                                        value={settings.adminEmail}
                                        onChange={(e) => updateSetting('adminEmail', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="supportEmail">{general_support_email_lbl}</Label>
                                    <Input
                                        id="supportEmail"
                                        type="email"
                                        value={settings.supportEmail}
                                        onChange={(e) => updateSetting('supportEmail', e.target.value)}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* PLATFORM */}
                <TabsContent value="platform">
                    <div className="grid xs:grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <DollarSign className="w-5 h-5" />
                                    <span>{platform_financial_title}</span>
                                </CardTitle>
                                <CardDescription>
                                    {platform_financial_desc}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="platformCommission">{platform_commission_label}</Label>
                                    <Input
                                        id="platformCommission"
                                        type="number"
                                        value={settings.platformCommission}
                                        onChange={(e) => updateSetting('platformCommission', e.target.value)}
                                        min="0"
                                        max="50"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="minServicePrice">{platform_min_price_label}</Label>
                                    <Input
                                        id="minServicePrice"
                                        type="number"
                                        value={settings.minServicePrice}
                                        onChange={(e) => updateSetting('minServicePrice', e.target.value)}
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="maxServicePrice">{platform_max_price_label}</Label>
                                    <Input
                                        id="maxServicePrice"
                                        type="number"
                                        value={settings.maxServicePrice}
                                        onChange={(e) => updateSetting('maxServicePrice', e.target.value)}
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="defaultCurrency">{platform_currency_label}</Label>
                                    <Select
                                        value={settings.defaultCurrency}
                                        onValueChange={(value) => updateSetting('defaultCurrency', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="RON">{platform_currency_opt_RON}</SelectItem>
                                            <SelectItem value="EUR">{platform_currency_opt_EUR}</SelectItem>
                                            <SelectItem value="USD">{platform_currency_opt_USD}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Users className="w-5 h-5" />
                                    <span>{platform_user_title}</span>
                                </CardTitle>
                                <CardDescription>
                                    {platform_user_desc}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>{platform_guest_browse_label}</Label>
                                        <p className="text-sm text-muted-foreground">{platform_guest_browse_desc}</p>
                                    </div>
                                    <Switch
                                        checked={settings.allowGuestBrowsing}
                                        onCheckedChange={(checked) => updateSetting('allowGuestBrowsing', checked)}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>{platform_email_ver_label}</Label>
                                        <p className="text-sm text-muted-foreground">{platform_email_ver_desc}</p>
                                    </div>
                                    <Switch
                                        checked={settings.requireEmailVerification}
                                        onCheckedChange={(checked) => updateSetting('requireEmailVerification', checked)}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>{platform_auto_approve_label}</Label>
                                        <p className="text-sm text-muted-foreground">{platform_auto_approve_desc}</p>
                                    </div>
                                    <Switch
                                        checked={settings.autoApproveServices}
                                        onCheckedChange={(checked) => updateSetting('autoApproveServices', checked)}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>{platform_reg_open_label}</Label>
                                        <p className="text-sm text-muted-foreground">{platform_reg_open_desc}</p>
                                    </div>
                                    <Switch
                                        checked={settings.registrationOpen}
                                        onCheckedChange={(checked) => updateSetting('registrationOpen', checked)}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* PAYMENTS */}
                <TabsContent value="payments">
                    <div className="grid xs:grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <DollarSign className="w-5 h-5" />
                                    <span>{payments_methods_title}</span>
                                </CardTitle>
                                <CardDescription>{payments_methods_desc}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Stripe */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <DollarSign className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <Label>{payments_stripe_label}</Label>
                                            <p className="text-sm text-muted-foreground">{payments_stripe_desc}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Badge variant={settings.stripeEnabled ? 'default' : 'secondary'}>
                                            {settings.stripeEnabled ? activeLabel : inactiveLabel}
                                        </Badge>
                                        <Switch
                                            checked={settings.stripeEnabled}
                                            onCheckedChange={(checked) => updateSetting('stripeEnabled', checked)}
                                        />
                                    </div>
                                </div>

                                {/* PayPal */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                                            <DollarSign className="w-5 h-5 text-yellow-600" />
                                        </div>
                                        <div>
                                            <Label>{payments_paypal_label}</Label>
                                            <p className="text-sm text-muted-foreground">{payments_paypal_desc}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Badge variant={settings.paypalEnabled ? 'default' : 'secondary'}>
                                            {settings.paypalEnabled ? activeLabel : inactiveLabel}
                                        </Badge>
                                        <Switch
                                            checked={settings.paypalEnabled}
                                            onCheckedChange={(checked) => updateSetting('paypalEnabled', checked)}
                                        />
                                    </div>
                                </div>

                                {/* Bank transfer */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                            <DollarSign className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div>
                                            <Label>{payments_bank_label}</Label>
                                            <p className="text-sm text-muted-foreground">{payments_bank_desc}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Badge variant={settings.bankTransferEnabled ? 'default' : 'secondary'}>
                                            {settings.bankTransferEnabled ? activeLabel : inactiveLabel}
                                        </Badge>
                                        <Switch
                                            checked={settings.bankTransferEnabled}
                                            onCheckedChange={(checked) => updateSetting('bankTransferEnabled', checked)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Shield className="w-5 h-5" />
                                    <span>{payments_security_title}</span>
                                </CardTitle>
                                <CardDescription>{payments_security_desc}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>{payments_escrow_label}</Label>
                                        <p className="text-sm text-muted-foreground">{payments_escrow_desc}</p>
                                    </div>
                                    <Switch
                                        checked={settings.escrowEnabled}
                                        onCheckedChange={(checked) => updateSetting('escrowEnabled', checked)}
                                    />
                                </div>

                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{payments_escrow_alert}</AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* EMAIL */}
                <TabsContent value="email">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Mail className="w-5 h-5" />
                                <span>{email_config_title}</span>
                            </CardTitle>
                            <CardDescription>{email_config_desc}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <Label htmlFor="emailProvider">{email_provider_label}</Label>
                                <Select
                                    value={settings.emailProvider}
                                    onValueChange={(value) => updateSetting('emailProvider', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="sendgrid">{email_provider_sendgrid}</SelectItem>
                                        <SelectItem value="mailgun">{email_provider_mailgun}</SelectItem>
                                        <SelectItem value="smtp">{email_provider_smtp}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {settings.emailProvider === 'smtp' && (
                                <div className="grid xs:grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="smtpHost">{email_smtp_host_label}</Label>
                                        <Input
                                            id="smtpHost"
                                            value={settings.smtpHost}
                                            onChange={(e) => updateSetting('smtpHost', e.target.value)}
                                            placeholder={email_smtp_host_ph}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="smtpPort">{email_smtp_port_label}</Label>
                                        <Input
                                            id="smtpPort"
                                            value={settings.smtpPort}
                                            onChange={(e) => updateSetting('smtpPort', e.target.value)}
                                            placeholder={email_smtp_port_ph}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="smtpUser">{email_smtp_user_label}</Label>
                                        <Input
                                            id="smtpUser"
                                            value={settings.smtpUser}
                                            onChange={(e) => updateSetting('smtpUser', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="smtpPassword">{email_smtp_pass_label}</Label>
                                        <Input
                                            id="smtpPassword"
                                            type="password"
                                            value={settings.smtpPassword}
                                            onChange={(e) => updateSetting('smtpPassword', e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* SECURITY */}
                <TabsContent value="security">
                    <div className="grid xs:grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Shield className="w-5 h-5" />
                                    <span>{security_auth_title}</span>
                                </CardTitle>
                                <CardDescription>{security_auth_desc}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>{security_2fa_label}</Label>
                                        <p className="text-sm text-muted-foreground">{security_2fa_desc}</p>
                                    </div>
                                    <Switch
                                        checked={settings.twoFactorRequired}
                                        onCheckedChange={(checked) => updateSetting('twoFactorRequired', checked)}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="passwordMinLength">{security_pwd_len_label}</Label>
                                    <Input
                                        id="passwordMinLength"
                                        type="number"
                                        value={settings.passwordMinLength}
                                        onChange={(e) => updateSetting('passwordMinLength', e.target.value)}
                                        min="6"
                                        max="20"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="maxLoginAttempts">{security_max_attempts}</Label>
                                    <Input
                                        id="maxLoginAttempts"
                                        type="number"
                                        value={settings.maxLoginAttempts}
                                        onChange={(e) => updateSetting('maxLoginAttempts', e.target.value)}
                                        min="3"
                                        max="10"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Clock className="w-5 h-5" />
                                    <span>{security_sessions_title}</span>
                                </CardTitle>
                                <CardDescription>{security_sessions_desc}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="sessionTimeout">{security_session_timeout_label}</Label>
                                    <Input
                                        id="sessionTimeout"
                                        type="number"
                                        value={settings.sessionTimeout}
                                        onChange={(e) => updateSetting('sessionTimeout', e.target.value)}
                                        min="1"
                                        max="168"
                                    />
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {security_session_timeout_desc}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* NOTIFICATIONS */}
                <TabsContent value="notifications">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Bell className="w-5 h-5" />
                                <span>{notif_title}</span>
                            </CardTitle>
                            <CardDescription>{notif_desc}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>{notif_email_label}</Label>
                                    <p className="text-sm text-muted-foreground">{notif_email_desc}</p>
                                </div>
                                <Switch
                                    checked={settings.emailNotifications}
                                    onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>{notif_sms_label}</Label>
                                    <p className="text-sm text-muted-foreground">{notif_sms_desc}</p>
                                </div>
                                <Switch
                                    checked={settings.smsNotifications}
                                    onCheckedChange={(checked) => updateSetting('smsNotifications', checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>{notif_push_label}</Label>
                                    <p className="text-sm text-muted-foreground">{notif_push_desc}</p>
                                </div>
                                <Switch
                                    checked={settings.pushNotifications}
                                    onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label>{notif_marketing_label}</Label>
                                    <p className="text-sm text-muted-foreground">{notif_marketing_desc}</p>
                                </div>
                                <Switch
                                    checked={settings.marketingEmails}
                                    onCheckedChange={(checked) => updateSetting('marketingEmails', checked)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
