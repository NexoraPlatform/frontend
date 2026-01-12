"use client";

import { Header } from "@/components/header";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import Cal, { getCalApi } from "@calcom/embed-react";
import apiClient from "@/lib/api";
import { TrustoraThemeStyles } from "@/components/trustora/theme-styles";

export default function ScheduleCallClient({ id }: {  id: string; }) {
    const router = useRouter();
    const [ service, setService ] = useState<any>(null);
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/signin');
        }
    }, [user, loading, router]);

    useEffect(() => {
        (async function () {
            const cal = await getCalApi({"namespace":"30min"});
            cal("ui", {"hideEventTypeDetails":false,"layout":"month_view"});
        })();
    }, []);

    useEffect(() => {
        loadService(id);
    }, [id]);

    const loadService = async (serviceId: string) => {
        try {
            const serviceData = await apiClient.getTestResult(serviceId);

            setService(serviceData);
        } catch (error: any) {
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-light)] dark:bg-[#070C14] flex items-center justify-center">
                <TrustoraThemeStyles />
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                    <p>Se încarcă...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    if (user.id !== service.user_id || (!service && !service.call_schedule) || service.call_schedule.date_time) {
        router.push('/dashboard');
    }
    const isProvider = user?.roles?.some((r: any) => r.slug?.toLowerCase() !== 'provider');

    return (
        <div className="min-h-screen bg-[var(--bg-light)] dark:bg-[#070C14] hero-gradient">
            <TrustoraThemeStyles />
            <Header />

            <div className="container mx-auto px-4 py-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <div className="flex items-center justify-between section-divider pb-6">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">
                                Bun venit, {user.firstName}!
                            </h1>
                            <p className="text-muted-foreground">
                                {isProvider
                                    ? 'Programeaza-te pentru un call 1:1 cu un operator Trustora'
                                    : ''
                                }
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Avatar className="w-12 h-12">
                                <AvatarImage src={user.avatar || ''} />
                                <AvatarFallback>
                                    {user.firstName[0]}{user.lastName[0]}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    </div>
                </div>

                <div className="glass-card border-emerald-100/70 p-6">
                    <Cal namespace="verificare-identitate"
                         calLink={`Trustora-app/verificare-identitate?name=${user.firstName} ${user.lastName}&email=${user.email}&service_id=${service.service.name}`}
                         style={{width:"100%",height:"100%",overflow:"scroll"}}
                         config={{
                             "layout":"month_view",
                             "theme":"auto",
                         }}
                    />
                </div>

            </div>
        </div>
    );
}
