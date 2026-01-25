import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import StripeSuccessClient from './StripeSuccessClient';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { TrustoraThemeStyles } from '@/components/trustora/theme-styles';

export default async function StripeOnboardSuccessPage() {
    const t = await getTranslations();

    return (
        <div className="min-h-screen bg-white dark:bg-[#070C14]">
            <Header />
            <TrustoraThemeStyles />
            <main className="px-6 pt-28 pb-20">
                <Suspense fallback={<p className="text-center mt-10 text-slate-500 dark:text-[#A3ADC2]">{t('dashboard.loading.page')}</p>}>
                    <StripeSuccessClient />
                </Suspense>
            </main>
            <Footer />
        </div>
    );
}
