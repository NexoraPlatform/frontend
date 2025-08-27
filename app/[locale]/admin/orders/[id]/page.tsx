import OrderDetailClient from './OrderDetailClient';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OrderDetailsPage({ params }: PageProps) {
  const { id } = await params;
  return <OrderDetailClient id={id} />;
}
