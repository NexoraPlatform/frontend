'use client';

import { useState } from 'react';
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
            onPaymentError(result.error.message || 'Eroare la procesarea plății');
        } else if (result.paymentIntent?.status === 'succeeded') {
            onPaymentSuccess();
        }
    };

    if (!clientSecret) return <p className="text-center text-slate-500 dark:text-[#A3ADC2]">Se încarcă sesiunea de plată...</p>;

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
                {loading ? 'Se procesează...' : 'Plătește'}
            </Button>
        </form>
    );
}

export default function StripeCheckoutClient({ projectId, clientSecret }: ClientProps) {
    const [message, setMessage] = useState<string | null>(null);

    const onPaymentSuccess = () => {
        setMessage('Plata a fost efectuată cu succes! Redirecționare...');
        setTimeout(() => {
            window.location.href = '/dashboard';
        }, 2000);
    };

    const onPaymentError = (error: string) => {
        setMessage(`Eroare la plată: ${error}`);
    };

    return (
        <div className="max-w-xl mx-auto">
            {message && (
                <div className={`mb-4 rounded-xl border px-4 py-3 text-sm font-medium ${message.startsWith('Eroare') ? 'border-red-200 bg-red-50 text-red-600' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                    {message}
                </div>
            )}
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="text-[#0B1C2D] dark:text-[#E6EDF3]">Finalizează plata</CardTitle>
                    <p className="text-sm text-slate-500 dark:text-[#A3ADC2]">
                        Introdu detaliile cardului pentru a confirma plata în siguranță.
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
