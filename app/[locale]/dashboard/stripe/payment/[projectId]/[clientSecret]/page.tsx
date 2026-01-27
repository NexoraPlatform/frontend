import StripeCheckoutClient from './CheckoutFormClient';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { TrustoraThemeStyles } from '@/components/trustora/theme-styles';

type PageProps = {
    params: Promise<{ projectId: string; clientSecret: string }>;
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ params }: PageProps) {
    const { projectId, clientSecret } = await params; // <- Next 15
    return (
        <div className="min-h-screen bg-white dark:bg-[#070C14]">
            <Header />
            <TrustoraThemeStyles />
            <main className="px-6 pt-28 pb-20">
                <StripeCheckoutClient
                    projectId={projectId}
                    clientSecret={clientSecret}
                />
            </main>
            <Footer />
        </div>
    );
}
