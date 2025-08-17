'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    CardElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';

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

    if (!clientSecret) return <p>Se încarcă sesiunea de plată...</p>;

    return (
        <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: 'auto' }}>
            <CardElement
                options={{
                    style: {
                        base: {
                            fontSize: '16px',
                            color: '#32325d',
                            '::placeholder': { color: '#a0aec0' },
                        },
                    },
                }}
            />
            <button type="submit" disabled={!stripe || loading} style={{ marginTop: 20, padding: '10px 20px' }}>
                {loading ? 'Se procesează...' : 'Plătește'}
            </button>
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
        <>
            {message && (
                <p style={{ color: message.startsWith('Eroare') ? 'red' : 'green' }}>
                    {message}
                </p>
            )}
            {/* pt CardElement nu e obligatoriu să treci options cu clientSecret */}
            <Elements stripe={stripePromise}>
                <CheckoutForm
                    projectId={projectId}
                    clientSecret={clientSecret}
                    onPaymentSuccess={onPaymentSuccess}
                    onPaymentError={onPaymentError}
                />
            </Elements>
        </>
    );
}
