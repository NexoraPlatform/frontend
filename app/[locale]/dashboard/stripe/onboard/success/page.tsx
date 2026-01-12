import { Suspense } from 'react';
import StripeSuccessClient from './StripeSuccessClient';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { TrustoraThemeStyles } from '@/components/trustora/theme-styles';

export default function StripeOnboardSuccessPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-[#070C14]">
            <Header />
            <TrustoraThemeStyles />
            <main className="px-6 pt-28 pb-20">
                <Suspense fallback={<p className="text-center mt-10 text-slate-500 dark:text-[#A3ADC2]">Se încarcă pagina...</p>}>
                    <StripeSuccessClient />
                </Suspense>
            </main>
            <Footer />
        </div>
    );
}
