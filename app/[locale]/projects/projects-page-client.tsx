'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';

import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { ProjectCard } from '@/components/ProjectCard';
import { ProjectFilters } from '@/components/ProjectFilters';
import { TrustoraThemeStyles } from '@/components/trustora/theme-styles';
import { Badge } from '@/components/ui/badge';
import apiClient from '@/lib/api';
import { ProjectWithClient } from '@/lib/projects';

type ProjectsPageClientProps = {
  initialProjects: ProjectWithClient[];
  initialCategories: string[];
  initialTechnologies: string[];
};

const ITEMS_PER_PAGE = 8;

export function ProjectsPageClient({
  initialProjects,
  initialCategories,
  initialTechnologies,
}: ProjectsPageClientProps) {
  const t = useTranslations();
  const allCategoryLabel = t('projects.list.filters.all');
  const [projects, setProjects] = useState<ProjectWithClient[]>(initialProjects);
  const [categories] = useState<string[]>(initialCategories);
  const [technologies] = useState<string[]>(initialTechnologies);

  const [selectedCategory, setSelectedCategory] = useState(allCategoryLabel);
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>([]);
  const [selectedBudgetMin, setSelectedBudgetMin] = useState(0);
  const [selectedBudgetMax, setSelectedBudgetMax] = useState(999999);
  const [searchQuery, setSearchQuery] = useState('');

  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialProjects.length >= ITEMS_PER_PAGE);

  const observerTarget = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);
  const didUseInitialPayloadRef = useRef(true);

  const loadProjects = useCallback(
    async (pageNum: number, isReset = false) => {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      setIsLoading(true);

      try {
        const newProjects = await apiClient.getPublicProjects({
          page: pageNum,
          search: searchQuery,
          category: selectedCategory === allCategoryLabel ? undefined : selectedCategory,
          technologies: selectedTechnologies,
          budget_min: selectedBudgetMin,
          budget_max: selectedBudgetMax,
        });

        setHasMore(newProjects.length >= ITEMS_PER_PAGE);

        if (isReset) {
          setProjects(newProjects);
        } else {
          setProjects((prev) => [...prev, ...newProjects]);
        }
      } catch (error) {
        console.error('Failed to load projects:', error);
      } finally {
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    },
    [
      allCategoryLabel,
      searchQuery,
      selectedCategory,
      selectedTechnologies,
      selectedBudgetMin,
      selectedBudgetMax,
    ]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoading) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading]);

  useEffect(() => {
    if (didUseInitialPayloadRef.current) {
      didUseInitialPayloadRef.current = false;
      return;
    }

    setPage(0);
    setHasMore(true);
    void loadProjects(0, true);
  }, [
    selectedCategory,
    selectedTechnologies,
    selectedBudgetMin,
    selectedBudgetMax,
    searchQuery,
    loadProjects,
  ]);

  useEffect(() => {
    if (page > 0) {
      void loadProjects(page);
    }
  }, [page, loadProjects]);

  return (
    <div className="min-h-screen bg-white text-[#0F172A] dark:bg-[#070C14] dark:text-[#E6EDF3]">
      <TrustoraThemeStyles />
      <Header />
      <main className="min-h-screen bg-slate-50 dark:bg-[#070C14] pt-8">
        <section className="pt-32 pb-12 px-6 hero-gradient">
          <div className="max-w-7xl mx-auto">
            <Badge className="mb-5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[#0B1C2D] text-xs font-bold dark:bg-[#111B2D] dark:border-[#1E2A3D] dark:text-[#E6EDF3]">
              <span className="text-[#1BC47D]">●</span> {t('projects.list.hero.badge')}
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-bold text-midnight-blue mb-3 dark:text-[#E6EDF3]">
              {t('projects.list.hero.title')}
            </h1>
            <p className="text-lg text-slate-600 max-w-3xl dark:text-[#A3ADC2]">
              {t('projects.list.hero.description')}
            </p>
          </div>
        </section>

        <ProjectFilters
          categories={categories}
          technologies={technologies}
          onSearchChange={setSearchQuery}
          onCategoryChange={setSelectedCategory}
          onTechnologiesChange={setSelectedTechnologies}
          onBudgetChange={(min, max) => {
            setSelectedBudgetMin(min);
            setSelectedBudgetMax(max);
          }}
          selectedCategory={selectedCategory}
          selectedTechnologies={selectedTechnologies}
          selectedBudgetMin={selectedBudgetMin}
          selectedBudgetMax={selectedBudgetMax}
        />

        <section className="py-12 px-6 bg-slate-50 dark:bg-[#070C14]">
          <div className="max-w-7xl mx-auto">
            <div className="space-y-4 mb-12">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>

            {isLoading && (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-emerald-green animate-spin" />
              </div>
            )}

            {!isLoading && projects.length === 0 && (
              <div className="text-center py-16">
                <p className="text-lg text-slate-500 dark:text-[#7C8799]">
                  {t('projects.list.empty')}
                </p>
              </div>
            )}

            <div ref={observerTarget} className="h-4" />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
