import ProjectDetailClient from './ProjectDetailClient';
import type { Metadata } from 'next';
import { generateSEO } from '@/lib/seo';
import apiClient from '@/lib/api';
import { getTranslations } from 'next-intl/server';

type PageProps = {
    params: Promise<{ id: string; locale: string }>;
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProjectDetailPage({ params }: PageProps) {
    const { id, locale } = await params;
    return <ProjectDetailClient id={id} locale={locale as 'ro' | 'en'} />;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id, locale } = await params;
    const t = await getTranslations({ locale });
    let projectTitle: string | undefined;

    try {
        projectTitle = await apiClient.getProjectNameByProjectUrl(id);
    } catch {
        projectTitle = undefined;
    }

    const title = projectTitle
        ? t('projects.detail.metadata.title_with_project', { title: projectTitle })
        : t('projects.detail.metadata.title');

    const description = projectTitle
        ? t('projects.detail.metadata.description_with_project', { title: projectTitle })
        : t('projects.detail.metadata.description');

    return generateSEO({
        title,
        description,
        url: `/projects/${id}`,
    });
}
