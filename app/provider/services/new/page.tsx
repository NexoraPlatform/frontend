import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import NewProviderServiceClient from './NewProviderServiceClient';

type PageProps = {
  searchParams: Promise<{ serviceId?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const { serviceId } = await searchParams;

  return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <NewProviderServiceClient serviceId={serviceId} />
        </div>
        <Footer />
      </div>
  );
}
