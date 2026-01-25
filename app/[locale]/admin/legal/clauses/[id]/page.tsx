import LegalClauseDetailClient from './LegalClauseDetailClient';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LegalClauseDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <LegalClauseDetailClient id={id} />;
}
