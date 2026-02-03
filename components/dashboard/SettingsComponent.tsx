import {TabsContent} from "@/components/ui/tabs";
import {Card, CardHeader, CardTitle, CardContent} from "@/components/ui/card";
import {Bell, DollarSign, Edit, Globe, Loader2, Settings, Shield, User} from "lucide-react";
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

export default function SettingsComponent() {
    const { user, loading, userLoading } = useAuth();
    const isProvider = user?.roles?.some((r: any) => r.slug?.toLowerCase() === 'provider');
    const t = useTranslations();
    const [openBankAccount, setOpenBankAccount] = useState<boolean>(false);

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

                    {/* Billing (for clients) */}
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <DollarSign className="w-5 h-5" />
                                <span>{t('dashboard.settings.billing.title')}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isProvider && (
                                <>
                                    <Button variant="outline" className="w-full justify-start" onClick={() => setOpenBankAccount(true)}>
                                        <AiFillBank className="w-4 h-4 mr-2" />
                                        {t('dashboard.settings.billing.bank_details')}
                                    </Button>
                                </>
                            )}

                        </CardContent>
                    </Card>
                </div>
            </TabsContent>

            <Dialog open={openBankAccount} onOpenChange={setOpenBankAccount}>
                <DialogContent className="max-w-3xl mx-auto bg-white dark:bg-[#0B1220] rounded-2xl shadow-2xl border-0 p-0 overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="p-6">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                                <Shield className="w-6 h-6 text-[#1BC47D]" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold">
                                    {t('dashboard.settings.billing.bank_details')}
                                </DialogTitle>
                                <DialogDescription className="text-sm">
                                    {t('dashboard.settings.billing.bank_details_subtitle')}
                                </DialogDescription>
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm">
                            <div className="flex">
                                <div>
                                    <Label htmlFor="bank_iban">Cont bancar</Label>
                                    <Input id="bank_iban" type="text" className="w-full" />
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="default" className="w-52">
                                save
                            </Button>
                            <Button variant="destructive" className="w-52">
                                Close
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
