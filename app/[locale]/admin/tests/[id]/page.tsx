import TestDetailClient from './TestDetailClient';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TestDetailsPage({ params }: PageProps) {
  const { id } = await params;
  return <TestDetailClient id={id} />;
}
