import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { TrustoraThemeStyles } from '@/components/trustora/theme-styles';
import NewProviderServiceClient from './NewProviderServiceClient';

type PageProps = {
  searchParams: Promise<{ serviceId?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const { serviceId } = await searchParams;

  return (
      <div className="min-h-screen bg-[var(--bg-light)] dark:bg-[#070C14] hero-gradient">
        <TrustoraThemeStyles />
        <Header />
        <div className="container mx-auto px-4 py-8">
          <NewProviderServiceClient serviceId={serviceId} />
        </div>
        <Footer />
      </div>
  );
}
