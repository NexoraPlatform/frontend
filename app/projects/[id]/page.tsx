import ProjectDetailClient from './ProjectDetailClient';

type PageProps = {
    params: Promise<{ id: string }>;
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProjectDetailPage({ params }: PageProps) {
    const { id } = await params;
    return <ProjectDetailClient id={id} />;
}
