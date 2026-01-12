'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { getProjectCategories, getProjectTechnologies, ProjectWithClient } from '@/lib/projects';
import { apiClient } from '@/lib/api';
import { ProjectFilters } from '@/components/ProjectFilters';
import { ProjectCard } from '@/components/ProjectCard';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { TrustoraThemeStyles } from '@/components/trustora/theme-styles';
import { Badge } from '@/components/ui/badge';

const ITEMS_PER_PAGE = 8;

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithClient[]>([]);
  const [categories, setCategories] = useState<string[]>(['Toate']);
  const [technologies, setTechnologies] = useState<string[]>([]);

  const [selectedCategory, setSelectedCategory] = useState('Toate');
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>([]);
  const [selectedBudgetMin, setSelectedBudgetMin] = useState(0);
  const [selectedBudgetMax, setSelectedBudgetMax] = useState(999999);
  const [searchQuery, setSearchQuery] = useState('');

  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);

  const observerTarget = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    const initializeFilters = async () => {
      try {
        const [cats, techs] = await Promise.all([
          getProjectCategories(),
          getProjectTechnologies(),
        ]);
        setCategories(cats);
        setTechnologies(techs);
      } catch (error) {
        console.error('Failed to load filters:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeFilters();
  }, []);

  const loadProjects = useCallback(
    async (pageNum: number, isReset: boolean = false) => {
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;
      setIsLoading(true);

      try {
        const newProjects = await apiClient.getPublicProjects({
          page: pageNum,
          search: searchQuery,
          category: selectedCategory,
          technologies: selectedTechnologies,
          budget_min: selectedBudgetMin,
          budget_max: selectedBudgetMax,
        });

        if (newProjects.length < ITEMS_PER_PAGE) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }

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
    [searchQuery, selectedCategory, selectedTechnologies, selectedBudgetMin, selectedBudgetMax]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
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
    setPage(0);
    setHasMore(true);
    loadProjects(0, true);
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
      loadProjects(page);
    }
  }, [page, loadProjects]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-white text-[#0F172A] dark:bg-[#070C14] dark:text-[#E6EDF3]">
        <TrustoraThemeStyles />
        <Header />
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-emerald-green animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#0F172A] dark:bg-[#070C14] dark:text-[#E6EDF3]">
      <TrustoraThemeStyles />
      <Header />
      <main className="min-h-screen bg-slate-50 dark:bg-[#070C14]">
        <section className="pt-32 pb-12 px-6 hero-gradient">
          <div className="max-w-7xl mx-auto">
            <Badge className="mb-5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[#0B1C2D] text-xs font-bold dark:bg-[#111B2D] dark:border-[#1E2A3D] dark:text-[#E6EDF3]">
              <span className="text-[#1BC47D]">●</span> Proiecte Trustora
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-bold text-midnight-blue mb-3 dark:text-[#E6EDF3]">
              Proiecte
            </h1>
            <p className="text-lg text-slate-600 max-w-3xl dark:text-[#A3ADC2]">
              Găsește proiecte potrivite pentru tine și ofertează pe cele care te interesează,
              într-un ecosistem sigur și verificat.
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
                  Nu au fost găsite proiecte care să se potrivească filtrelor tale
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
