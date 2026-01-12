'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function StripeSuccessClient() {
    const [loading, setLoading] = useState(true);
    const [isVerified, setIsVerified] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const verifyStripeAccount = async () => {
            try {
                const response = await apiClient.getStripeAccountStatus();

                if (response.isVerified) {
                    setIsVerified(true);
                    setTimeout(() => router.push('/dashboard'), 2000);
                } else {
                    setIsVerified(false);
                }
            } catch (err) {
                console.error('Stripe account verification failed:', err);
                setIsVerified(false);
            } finally {
                setLoading(false);
            }
        };

        verifyStripeAccount();
    }, [router]);

    if (loading) {
        return (
            <div className="max-w-xl mx-auto">
                <Card className="glass-card">
                    <CardContent className="py-12 text-center">
                        <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-[#1BC47D]" />
                        <p className="text-slate-500 dark:text-[#A3ADC2]">Se verifică contul Stripe...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!isVerified) {
        return (
            <div className="max-w-xl mx-auto">
                <Card className="glass-card">
                    <CardContent className="py-10 text-center space-y-3">
                        <p className="text-lg font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                            Contul nu este încă verificat complet.
                        </p>
                        <p className="text-slate-500 dark:text-[#A3ADC2]">
                            Te rugăm să finalizezi toți pașii din onboarding Stripe.
                        </p>
                        <Button
                            onClick={() => router.push('/dashboard')}
                            className="btn-primary mt-4"
                        >
                            Înapoi la dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto">
            <Card className="glass-card">
                <CardContent className="py-12 text-center space-y-3">
                    <CheckCircle className="mx-auto h-10 w-10 text-[#1BC47D]" />
                    <p className="text-xl font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">Contul tău Stripe a fost verificat!</p>
                    <p className="text-slate-500 dark:text-[#A3ADC2]">Redirectare către dashboard...</p>
                </CardContent>
            </Card>
        </div>
    );
}
