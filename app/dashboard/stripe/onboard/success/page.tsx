import { Suspense } from 'react';
import StripeSuccessClient from './StripeSuccessClient';

export default function StripeOnboardSuccessPage() {
    return (
        <Suspense fallback={<p className="text-center mt-10">Se încarcă pagina...</p>}>
            <StripeSuccessClient />
        </Suspense>
    );
}
