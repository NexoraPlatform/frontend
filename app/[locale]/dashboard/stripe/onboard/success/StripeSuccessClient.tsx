'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';

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
        return <p className="text-center mt-10">Se verifică contul Stripe...</p>;
    }

    if (!isVerified) {
        return (
            <div className="text-center mt-10">
                <p>Contul nu este încă verificat complet.</p>
                <p>Te rugăm să finalizezi toți pașii din onboarding Stripe.</p>
                <button
                    onClick={() => router.push('/dashboard')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
                >
                    Înapoi la dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="text-center mt-10">
            <p className="text-green-600 font-semibold text-xl">Contul tău Stripe a fost verificat!</p>
            <p>Redirectare către dashboard...</p>
        </div>
    );
}
