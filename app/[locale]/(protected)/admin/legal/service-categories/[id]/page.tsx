import LegalServiceCategoryDetailClient from "./LegalServiceCategoryDetailClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function LegalServiceCategoryDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <LegalServiceCategoryDetailClient id={id} />;
}
