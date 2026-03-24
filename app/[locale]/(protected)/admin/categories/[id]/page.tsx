import CategoryDetailClient from './CategoryDetailClient';

type PageProps = {
    params: Promise<{ id: string }>;
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CategoryDetailPage({ params }: PageProps) {
    const { id } = await params;
    return <CategoryDetailClient id={id} />;
}
