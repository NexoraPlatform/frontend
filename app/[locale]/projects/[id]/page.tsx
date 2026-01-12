import ProjectDetailClient from './ProjectDetailClient';

type PageProps = {
    params: Promise<{ id: string; locale: string }>;
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProjectDetailPage({ params }: PageProps) {
    const { id, locale } = await params;
    return <ProjectDetailClient id={id} locale={locale as 'ro' | 'en'} />;
}
