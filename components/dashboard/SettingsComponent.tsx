import {Card, CardHeader, CardTitle, CardContent} from "@/components/ui/card";
import {
    Bell,
    Building2,
    Edit,
    Globe,
    Loader2,
    Settings,
    Shield,
    User, UsersRound
} from "lucide-react";
import {useAuth} from "@/contexts/auth-context";
import {useTranslations} from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import React, {useEffect, useMemo, useState} from "react";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import CompanyManagersSettingsDialog from "@/components/dashboard/settings/company-managers-settings-dialog";

type SettingsComponentProps = {
    onOpenCompanyInformationsDialog: () => void;
};

export default function SettingsComponent({ onOpenCompanyInformationsDialog }: SettingsComponentProps) {
    const { user, loading, userLoading } = useAuth();
    const roleSlugs = useMemo(() => {
        const rolesList = Array.isArray(user?.roles) ? user?.roles : [];
        const fromRoles = (rolesList ?? []).map((role: any) => role?.slug).filter(Boolean);
        const fromRoleSlugs = (Array.isArray(user?.role_slugs) ? user?.role_slugs : []) ?? [];
        const fromSingleRole = user?.role ? [user.role] : [];
        return Array.from(
            new Set(
                [...fromRoles, ...fromRoleSlugs, ...fromSingleRole]
                    .filter(Boolean)
                    .map((slug) => String(slug).toLowerCase())
            )
        );
    }, [user?.roles, user?.role_slugs, user?.role]);
    const isProvider = roleSlugs.includes('provider');
    const isClient = roleSlugs.includes('client');
    const canManageCompany = isProvider || isClient;
    const t = useTranslations();
    const [openCompanyManagersDialog, setOpenCompanyManagersDialog] = useState<boolean>(false);

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

    return (
        <>
            <div className="space-y-6">
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
                                    <AvatarImage src={user.avatar ?? undefined} />
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

                            {canManageCompany && (
                                <>
                                    <Button variant="outline" className="w-full justify-start" onClick={onOpenCompanyInformationsDialog}>
                                        <Building2 className="w-4 h-4 mr-2" />
                                        {t('dashboard.settings.profile.company_informations')}
                                    </Button>

                                    {isProvider ? (
                                    <Button variant="outline" className="w-full justify-start" onClick={() => setOpenCompanyManagersDialog(true)}>
                                        <UsersRound className="w-4 h-4 mr-2" />
                                        {t('dashboard.settings.profile.company_managers')}
                                    </Button>
                                    ) : null}
                                </>
                            )}
                        </CardContent>
                    </Card>

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
            </div>
            {isProvider ? (
                <CompanyManagersSettingsDialog
                    openCompanyManagersDialog={openCompanyManagersDialog}
                    setOpenCompanyManagersDialog={setOpenCompanyManagersDialog}
                />
            ) : null}
        </>
    );
}
