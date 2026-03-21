import { getTranslations } from 'next-intl/server';

import { ProjectsPageClient } from './projects-page-client';

import { cachedServerGet } from '@/lib/server/api';
import {
  normalizePublicProjectsResponse,
  normalizeStringOptions,
} from '@/lib/server/public-listings';

type ProjectsPageProps = {
  params: Promise<{ locale: string }>;
};

const ITEMS_PER_PAGE = 8;
const PUBLIC_LISTINGS_REVALIDATE_SECONDS = 300;

export const revalidate = 300;

export default async function ProjectsPage({ params }: ProjectsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'projects.list.filters' });
  const allCategoryLabel = t('all');

  const [projectsResult, categoriesResult] = await Promise.allSettled([
    cachedServerGet<unknown>('/projects', {
      next: { revalidate: PUBLIC_LISTINGS_REVALIDATE_SECONDS },
      language: locale,
      query: {
        page: 0,
      },
    }),
    cachedServerGet<unknown>('/categories', {
      next: { revalidate: PUBLIC_LISTINGS_REVALIDATE_SECONDS },
      language: locale,
    }),
  ]);

  const initialProjects =
    projectsResult.status === 'fulfilled'
      ? normalizePublicProjectsResponse(projectsResult.value)
      : [];
  const normalizedCategories =
    categoriesResult.status === 'fulfilled'
      ? normalizeStringOptions(categoriesResult.value, locale as 'ro' | 'en')
      : [];
  const normalizedTechnologies = Array.from(
    new Set(
      initialProjects.flatMap((project) =>
        Array.isArray(project.technologies)
          ? project.technologies.map((technology) => String(technology).trim()).filter(Boolean)
          : [],
      ),
    ),
  );

  return (
    <ProjectsPageClient
      initialProjects={initialProjects.slice(0, ITEMS_PER_PAGE)}
      initialCategories={[allCategoryLabel, ...normalizedCategories]}
      initialTechnologies={normalizedTechnologies}
    />
  );
}
