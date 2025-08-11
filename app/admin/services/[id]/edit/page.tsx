import ServiceDetailClient from './ServiceDetailClient';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ServiceDetailsPage({ params }: PageProps) {
  const { id } = await params;
  return <ServiceDetailClient id={id} />;
}
