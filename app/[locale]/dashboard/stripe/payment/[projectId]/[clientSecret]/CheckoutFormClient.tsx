'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    CardElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type ClientProps = {
    projectId: string;
    clientSecret: string;
};

function CheckoutForm({
                          projectId,
                          clientSecret,
                          onPaymentSuccess,
                          onPaymentError,
                      }: {
    projectId: string;
    clientSecret: string;
    onPaymentSuccess: () => void;
    onPaymentError: (error: string) => void;
}) {
    const t = useTranslations();
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements || !clientSecret || !projectId) return;

        setLoading(true);
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) return;

        const result = await stripe.confirmCardPayment(clientSecret, {
            payment_method: { card: cardElement },
        });

        setLoading(false);

        if (result.error) {
            onPaymentError(
                t('dashboard.payments.processing_error', {
                    message: result.error.message ?? t('dashboard.payments.generic_error'),
                })
            );
        } else if (result.paymentIntent?.status === 'succeeded') {
            onPaymentSuccess();
        }
    };

    if (!clientSecret) {
        return (
            <p className="text-center text-slate-500 dark:text-[#A3ADC2]">
                {t('dashboard.payments.loading_session')}
            </p>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-[#1BC47D]/30 dark:border-[#1E2A3D] dark:bg-[#0B1220]">
                <CardElement
                    options={{
                        style: {
                            base: {
                                fontSize: '16px',
                                color: '#0B1C2D',
                                '::placeholder': { color: '#94A3B8' },
                            },
                        },
                    }}
                />
            </div>
            <Button type="submit" disabled={!stripe || loading} className="w-full btn-primary">
                {loading ? t('dashboard.payments.processing') : t('dashboard.payments.pay')}
            </Button>
        </form>
    );
}

export default function StripeCheckoutClient({ projectId, clientSecret }: ClientProps) {
    const t = useTranslations();
    const [message, setMessage] = useState<{ text: string; tone: 'error' | 'success' } | null>(null);

    const onPaymentSuccess = () => {
        setMessage({ text: t('dashboard.payments.success_redirect'), tone: 'success' });
        setTimeout(() => {
            window.location.href = '/dashboard';
        }, 2000);
    };

    const onPaymentError = (error: string) => {
        setMessage({ text: t('dashboard.payments.error_with_message', { message: error }), tone: 'error' });
    };

    return (
        <div className="max-w-xl mx-auto">
            {message && (
                <div
                    className={`mb-4 rounded-xl border px-4 py-3 text-sm font-medium ${
                        message.tone === 'error'
                            ? 'border-red-200 bg-red-50 text-red-600'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    }`}
                >
                    {message.text}
                </div>
            )}
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="text-[#0B1C2D] dark:text-[#E6EDF3]">
                        {t('dashboard.payments.title')}
                    </CardTitle>
                    <p className="text-sm text-slate-500 dark:text-[#A3ADC2]">
                        {t('dashboard.payments.description')}
                    </p>
                </CardHeader>
                <CardContent>
                    {/* pt CardElement nu e obligatoriu să treci options cu clientSecret */}
                    <Elements stripe={stripePromise}>
                        <CheckoutForm
                            projectId={projectId}
                            clientSecret={clientSecret}
                            onPaymentSuccess={onPaymentSuccess}
                            onPaymentError={onPaymentError}
                        />
                    </Elements>
                </CardContent>
            </Card>
        </div>
    );
}
