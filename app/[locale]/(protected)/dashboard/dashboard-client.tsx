"use client";

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import dynamic from 'next/dynamic';
import {useLocale, useTranslations} from 'next-intl';
import {useSearchParams} from 'next/navigation';
import {Link, usePathname, useRouter} from '@/lib/navigation';
import {motion} from 'framer-motion';
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Input} from '@/components/ui/input';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Briefcase,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Shield,
  Star,
  Target,
  X
} from 'lucide-react';
import {useAuth} from '@/contexts/auth-context';
import {ProjectRequestCard} from '@/components/project-request-card';
import {apiClient, DashboardStatsResponse, ProviderServiceRecord, RecentActivityQuick} from '@/lib/api';
import {ensureEcho} from '@/lib/echo';
import {toast} from 'sonner';
import { getDashboardTabHref } from '@/lib/dashboard-navigation';
import {
  getProviderServicesSelectHref,
  getProviderServicesTestsHref,
} from '@/lib/provider-services-wizard';
import ChatLauncher from '@/components/chat/chat-launcher';
import { DashboardOverview } from '@/components/dashboard/dashboard-overview';
import { DashboardSectionHeader } from '@/components/dashboard/dashboard-section-header';
import { TrustoraDashboardShell } from '@/components/dashboard/trustora-dashboard-shell';
import { DashboardProjectReviewsPanel } from '@/components/reviews/dashboard-project-reviews-panel';
import { useMyBadgeProgress, useMyBadgeRewards, useMyBadges } from '@/hooks/use-api';

const theme = {
  trustAccent: '#1BC47D',
  success: '#21D19F',
  warning: '#F5A623',
  error: '#E5484D',
};

const ClientProjectRequests = dynamic(
  () => import('../client/project-requests/ClientProjectRequests'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    ),
  }
);

const SettingsComponent = dynamic(
  () => import('@/components/dashboard/SettingsComponent'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    ),
  }
);

const CompanyInformationsSettingsDialog = dynamic(
  () => import('@/components/dashboard/settings/company-informations-settings-dialog'),
  {
    ssr: false,
  }
);

export type DashboardSection =
  | 'overview'
  | 'projects'
  | 'services'
  | 'messages'
  | 'settings';

type DashboardClientProps = {
  section?: DashboardSection;
};

export default function DashboardClient({ section = 'overview' }: DashboardClientProps) {
  const { user, loading, userLoading, refreshUser } = useAuth();
  const t = useTranslations();
  const roleRefreshAttemptedRef = useRef(false);
  const [isRefreshingRole, setIsRefreshingRole] = useState(false);
  const [openCompanyInformationsDialog, setOpenCompanyInformationsDialog] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [overviewProjects, setOverviewProjects] = useState<any[]>([]);
  const [loadingOverviewProjects, setLoadingOverviewProjects] = useState(false);
  const [overviewProjectsError, setOverviewProjectsError] = useState('');
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [projectsError, setProjectsError] = useState('');
  const [recentActivities, setRecentActivities] = useState<RecentActivityQuick[]>([]);
  const [loadingRecentActivities, setLoadingRecentActivities] = useState(false);
  const [recentActivitiesError, setRecentActivitiesError] = useState('');
  const [providerServices, setProviderServices] = useState<ProviderServiceRecord[]>([]);
  const [loadingProviderServices, setLoadingProviderServices] = useState(false);
  const [providerServicesError, setProviderServicesError] = useState('');

  const roleSlugs = useMemo(() => {
    const rolesList = Array.isArray(user?.roles) ? user?.roles : [];
    const fromRoles = (rolesList ?? []).map((role: any) => role?.slug).filter(Boolean);
    const fromRoleSlugs = (Array.isArray(user?.role_slugs) ? user?.role_slugs : []) ?? [];
    const fromSingleRole = user?.role ? [user.role] : [];
    return Array.from(
      new Set(
        [...fromRoles, ...fromRoleSlugs, ...fromSingleRole]
          .filter(Boolean)
          .map((slug) => String(slug).toLowerCase())
      )
    );
  }, [user?.roles, user?.role_slugs, user?.role]);

  const hasRoleInfo = roleSlugs.length > 0;
  const isProvider = roleSlugs.includes('provider');
  const isClient = roleSlugs.includes('client');
  const activeTab = section;
  const shouldLoadBadgeData = Boolean(user) && activeTab === 'overview';
  const {
    data: myBadgesData,
    loading: loadingMyBadges,
    error: myBadgesError,
  } = useMyBadges(shouldLoadBadgeData);
  const {
    data: myBadgeProgressData,
    loading: loadingMyBadgeProgress,
    error: myBadgeProgressError,
  } = useMyBadgeProgress(shouldLoadBadgeData);
  const {
    data: myBadgeRewardsData,
    loading: loadingMyBadgeRewards,
    error: myBadgeRewardsError,
  } = useMyBadgeRewards(shouldLoadBadgeData);

  // Filters and pagination for projects
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const projectsPerPage = 6;
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const focusedProjectId = searchParams.get('projectId');
  const focusedMilestoneId = searchParams.get('activeMilestoneId');
  const projectCollectionRef = useRef<any[]>([]);
  const projectCollectionLoadedRef = useRef(false);
  const projectCollectionPromiseRef = useRef<Promise<any[]> | null>(null);

  useEffect(() => {
    document.title = 'Trustora | Escrow Dashboard';
  }, []);

  useEffect(() => {
    if (userLoading || !user || hasRoleInfo || roleRefreshAttemptedRef.current) return;

    roleRefreshAttemptedRef.current = true;
    setIsRefreshingRole(true);
    void refreshUser().finally(() => {
      setIsRefreshingRole(false);
    });
  }, [hasRoleInfo, refreshUser, user, userLoading]);

  useEffect(() => {
    projectCollectionRef.current = [];
    projectCollectionLoadedRef.current = false;
    projectCollectionPromiseRef.current = null;
  }, [isProvider, user?.id]);

  const fetchProjectCollection = useCallback(async (force = false) => {
    if (!user) {
      projectCollectionRef.current = [];
      projectCollectionLoadedRef.current = false;
      return [];
    }

    if (!force && projectCollectionLoadedRef.current) {
      return projectCollectionRef.current;
    }

    if (projectCollectionPromiseRef.current) {
      return projectCollectionPromiseRef.current;
    }

    const request = (async () => {
      const response: any = isProvider
        ? await apiClient.getProviderProjectRequests()
        : await apiClient.getClientProjectRequests();

      const collection = Array.isArray(response)
        ? response
        : Array.isArray(response?.projects)
          ? response.projects
          : Array.isArray(response?.data)
            ? response.data
            : [];

      projectCollectionRef.current = collection;
      projectCollectionLoadedRef.current = true;
      return collection;
    })();

    projectCollectionPromiseRef.current = request;

    try {
      return await request;
    } finally {
      projectCollectionPromiseRef.current = null;
    }
  }, [isProvider, user]);

  const normalizeProviderLevelKey = useCallback((value: string) => {
    const normalized = value.trim().toUpperCase();

    if (normalized === 'MID' || normalized === 'INTERMEDIATE') {
      return 'MEDIU';
    }

    return normalized;
  }, []);

  const formatCompactNumber = useCallback((value: number) => {
    return new Intl.NumberFormat(locale, {
      notation: 'compact',
      maximumFractionDigits: value >= 100 ? 0 : 1,
    }).format(value);
  }, [locale]);

  const formatRatingValue = useCallback((value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '--';
    }

    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: value % 1 === 0 ? 0 : 1,
      maximumFractionDigits: 2,
    }).format(value);
  }, [locale]);

  const formatProviderLevel = useCallback((value: string) => {
    const normalized = normalizeProviderLevelKey(value);

    if (normalized === 'SENIOR') {
      return t('dashboard.services.levels.senior');
    }

    if (normalized === 'MEDIU') {
      return t('dashboard.services.levels.mid');
    }

    if (normalized === 'JUNIOR') {
      return t('dashboard.services.levels.junior');
    }

    if (normalized === 'EXPERT') {
      return t('dashboard.services.levels.expert');
    }

    if (!normalized) {
      return '--';
    }

    return normalized
      .toLowerCase()
      .split(/[\s_-]+/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }, [normalizeProviderLevelKey, t]);

  const getNextProviderLevel = useCallback((value: string) => {
    const orderedLevels = ['JUNIOR', 'MEDIU', 'SENIOR', 'EXPERT'];
    const normalized = normalizeProviderLevelKey(value);
    const currentIndex = orderedLevels.indexOf(normalized);

    if (currentIndex < 0 || currentIndex >= orderedLevels.length - 1) {
      return null;
    }

    return orderedLevels[currentIndex + 1];
  }, [normalizeProviderLevelKey]);

  const formatDeliveryProvider = useCallback((value: string) => {
    const normalized = value.trim().toLowerCase();

    if (!normalized) {
      return '';
    }

    if (normalized === 'github') {
      return 'GitHub';
    }

    if (normalized === 'gitlab') {
      return 'GitLab';
    }

    if (normalized === 'bitbucket') {
      return 'Bitbucket';
    }

    return normalized
      .split(/[\s_-]+/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }, []);

  const providerServicesSummary = useMemo(() => {
    const categoryNames = new Set<string>();
    let ratedServices = 0;
    let ratingTotal = 0;

    providerServices.forEach((providerService) => {
      const categoryName = providerService.service?.category?.name?.trim();
      if (categoryName) {
        categoryNames.add(categoryName);
      }

      if (typeof providerService.rating === 'number' && Number.isFinite(providerService.rating)) {
        ratedServices += 1;
        ratingTotal += providerService.rating;
      }
    });

    return {
      total: providerServices.length,
      verified: providerServices.filter((providerService) => providerService.verified).length,
      categories: categoryNames.size,
      averageRating: ratedServices > 0 ? ratingTotal / ratedServices : null,
    };
  }, [providerServices]);

  useEffect(() => {
    if (activeTab !== 'projects') return;
    if (!focusedProjectId && !focusedMilestoneId) return;

    let cancelled = false;
    let timer: number | null = null;
    const highlightClassNames = ['ring-2', 'ring-[#1BC47D]', 'ring-offset-2', 'ring-offset-transparent'];

    const escapeSelector = (value: string) => {
      if (typeof window !== 'undefined' && window.CSS?.escape) {
        return window.CSS.escape(value);
      }

      return value.replace(/["\\]/g, '\\$&');
    };

    const focusTarget = (attempt = 0) => {
      if (cancelled) return;

      const selector = focusedMilestoneId
        ? `[data-project-milestone-id="${escapeSelector(focusedMilestoneId)}"]`
        : focusedProjectId
          ? `[data-project-card-id="${escapeSelector(focusedProjectId)}"]`
          : null;
      if (!selector) return;

      const target = document.querySelector<HTMLElement>(selector);
      if (!target) {
        if (attempt < 12) {
          timer = window.setTimeout(() => focusTarget(attempt + 1), 250);
        }
        return;
      }

      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      highlightClassNames.forEach((className) => target.classList.add(className));
      window.setTimeout(() => {
        highlightClassNames.forEach((className) => target.classList.remove(className));
      }, 2400);
    };

    timer = window.setTimeout(() => focusTarget(), 150);

    return () => {
      cancelled = true;
      if (timer !== null) {
        window.clearTimeout(timer);
      }
    };
  }, [activeTab, focusedMilestoneId, focusedProjectId]);

  useEffect(() => {
    if (loading || userLoading) return;

    if (!user) {
      const currentPath = pathname || '/dashboard';
      const callbackPath = currentPath.startsWith(`/${locale}`)
        ? currentPath
        : `/${locale}${currentPath.startsWith('/') ? currentPath : `/${currentPath}`}`;
      const query = searchParamsString;
      const callbackUrl = query ? `${callbackPath}?${query}` : callbackPath;
      router.replace(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
  }, [loading, locale, pathname, router, searchParamsString, user, userLoading]);

  const handleTabChange = useCallback((value: DashboardSection) => {
    router.push(getDashboardTabHref(value), { scroll: false });
  }, [router]);

  const handleOpenCompanyInformationsDialog = useCallback(() => {
    if (activeTab !== 'settings') {
      handleTabChange('settings');
      return;
    }
    setOpenCompanyInformationsDialog(true);
  }, [activeTab, handleTabChange]);

  const handleStartLevelUpgradeTest = useCallback((providerService: ProviderServiceRecord) => {
    const service = providerService.service;
    const nextLevel = getNextProviderLevel(providerService.level);
    const serviceId = providerService.service_id ?? service?.id;

    if (!serviceId || !service?.name || !nextLevel) {
      return;
    }

    const payload = encodeURIComponent(JSON.stringify({
      serviceId: String(serviceId),
      serviceName: service.name,
      level: nextLevel,
      currentLevel: normalizeProviderLevelKey(providerService.level),
      category: service.category?.name ?? '',
      programming_language: service.programming_language ?? '',
      flow: 'level_upgrade',
    }));

    router.push(getProviderServicesTestsHref(payload));
  }, [getNextProviderLevel, normalizeProviderLevelKey, router]);

  const handleOverviewProjectOpen = useCallback((projectId: string | number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('tab');
    params.set('projectId', String(projectId));
    const query = params.toString();
    const basePath = getDashboardTabHref('projects');
    router.push(query ? `${basePath}?${query}` : basePath, { scroll: false });
  }, [router, searchParams]);

  const resolveReviewMilestoneOptions = useCallback(
    async (projectId: string, eligibleMilestoneIds: string[]) => {
      const normalizedEligibleIds = eligibleMilestoneIds
        .map((entry) => String(entry).trim())
        .filter(Boolean);

      if (normalizedEligibleIds.length === 0) {
        return [];
      }

      const projectsCollection = await fetchProjectCollection();
      const project = projectsCollection.find(
        (entry: any) => String(entry?.id ?? '') === String(projectId)
      );

      if (!project) {
        return normalizedEligibleIds.map((milestoneId) => ({
          id: milestoneId,
          title: t('dashboard.reviews.composer.milestone_fallback', { id: milestoneId }),
          status: null,
          service_name: null,
        }));
      }

      const milestoneSource = Array.isArray(project.project_line_milestones) &&
        project.project_line_milestones.length > 0
          ? project.project_line_milestones
          : Array.isArray(project.project_lines)
            ? project.project_lines.flatMap((line: any) =>
                Array.isArray(line?.milestones) ? line.milestones : []
              )
            : [];

      const optionsById = new Map<string, {
        id: string;
        title: string;
        status: string | null;
        service_name: string | null;
      }>();

      milestoneSource.forEach((milestone: any) => {
        const milestoneId = String(milestone?.id ?? '').trim();
        if (!milestoneId) {
          return;
        }

        const serviceName =
          typeof milestone?.projectLine?.service?.name === 'string'
            ? milestone.projectLine.service.name
            : typeof milestone?.project_line?.service?.name === 'string'
              ? milestone.project_line.service.name
              : null;

        optionsById.set(milestoneId, {
          id: milestoneId,
          title:
            typeof milestone?.title === 'string' && milestone.title.trim()
              ? milestone.title
              : t('dashboard.reviews.composer.milestone_fallback', { id: milestoneId }),
          status:
            typeof milestone?.status === 'string' && milestone.status.trim()
              ? milestone.status
              : null,
          service_name: serviceName,
        });
      });

      return normalizedEligibleIds.map((milestoneId) => {
        return (
          optionsById.get(milestoneId) ?? {
            id: milestoneId,
            title: t('dashboard.reviews.composer.milestone_fallback', { id: milestoneId }),
            status: null,
            service_name: null,
          }
        );
      });
    },
    [fetchProjectCollection, t]
  );

  const loadProjects = useCallback(async (force = false) => {
    setLoadingProjects(true);
    setProjectsError('');
    try {
      let filteredProjects = [...await fetchProjectCollection(force)];

      if (focusedProjectId) {
        filteredProjects = [...filteredProjects].sort((a: any, b: any) => {
          const aMatches = String(a?.id ?? '') === String(focusedProjectId) ? 1 : 0;
          const bMatches = String(b?.id ?? '') === String(focusedProjectId) ? 1 : 0;
          return bMatches - aMatches;
        });
      }

      // Apply search filter
      if (searchTerm) {
        const normalizedSearchTerm = searchTerm.toLowerCase();
        filteredProjects = filteredProjects.filter((project: any) =>
          String(project?.title ?? '').toLowerCase().includes(normalizedSearchTerm) ||
          String(project?.description ?? '').toLowerCase().includes(normalizedSearchTerm)
        );
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        filteredProjects = filteredProjects.filter((project: any) => {
          if (isProvider) {
            return project.status === statusFilter;
          } else {
            return project.status === statusFilter;
          }
        });
      }

      // Apply sorting
      filteredProjects.sort((a: any, b: any) => {
        let aValue, bValue;
        const budgetAmount = (project: any) => {
          if (project?.budget && typeof project.budget === 'object') {
            const amount = Number((project.budget as { amount?: unknown }).amount);
            return Number.isFinite(amount) ? amount : 0;
          }
          const numeric = Number(project?.budget);
          return Number.isFinite(numeric) ? numeric : 0;
        };

        switch (sortBy) {
          case 'title':
            aValue = a.title.toLowerCase();
            bValue = b.title.toLowerCase();
            break;
          case 'budget':
            aValue = budgetAmount(a);
            bValue = budgetAmount(b);
            break;
          case 'oldest':
            aValue = new Date(a.created_at).getTime();
            bValue = new Date(b.created_at).getTime();
            break;
          default: // newest
            aValue = new Date(a.created_at).getTime();
            bValue = new Date(b.created_at).getTime();
            break;
        }

        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      // Calculate pagination
      const total = filteredProjects.length;
      const nextTotalPages = Math.ceil(total / projectsPerPage);
      setTotalPages(nextTotalPages);

      const clampedPage = nextTotalPages > 0 ? Math.min(currentPage, nextTotalPages) : 1;
      if (clampedPage !== currentPage) {
        setCurrentPage(clampedPage);
      }

      // Apply pagination
      const startIndex = (clampedPage - 1) * projectsPerPage;
      const paginatedProjects = filteredProjects.slice(startIndex, startIndex + projectsPerPage);

      setProjects(paginatedProjects);
    } catch (error: any) {
      setProjectsError(t('dashboard.errors.projects_load_failed', { message: error.message }));
    } finally {
      setLoadingProjects(false);
    }
  }, [currentPage, fetchProjectCollection, focusedProjectId, searchTerm, sortBy, sortOrder, statusFilter, t]);

  const loadOverviewProjects = useCallback(async (force = false) => {
    if (!user) return;
    setLoadingOverviewProjects(true);
    setOverviewProjectsError('');
    try {
      const projectsCollection = [...await fetchProjectCollection(force)];

      const latestTwo = [...projectsCollection]
        .sort((a: any, b: any) => {
          const aTime = new Date(a?.created_at ?? 0).getTime();
          const bTime = new Date(b?.created_at ?? 0).getTime();
          return bTime - aTime;
        })
        .slice(0, 2);

      setOverviewProjects(latestTwo);
    } catch (error: any) {
      setOverviewProjectsError(t('dashboard.errors.projects_load_failed', { message: error?.message ?? 'Unknown error' }));
    } finally {
      setLoadingOverviewProjects(false);
    }
  }, [fetchProjectCollection, t, user]);

  const loadRecentActivities = useCallback(async () => {
    if (!user) return;
    setLoadingRecentActivities(true);
    setRecentActivitiesError('');
    try {
      const activityLanguage: 'ro' | 'en' = locale === 'ro' ? 'ro' : 'en';
      const response = await apiClient.getRecentActivitiesQuick(activityLanguage);
      const activitiesCollection = Array.isArray(response)
        ? response
        : Array.isArray((response as any)?.data)
          ? (response as any).data
          : [];
      const normalizedActivities: RecentActivityQuick[] = activitiesCollection
        .filter(
          (activity: any): activity is RecentActivityQuick =>
            Boolean(activity) &&
            typeof activity.title === 'string' &&
            typeof activity.time_ago === 'string'
        )
        .sort((a: RecentActivityQuick, b: RecentActivityQuick) => {
          const aTime = new Date(a.created_at ?? 0).getTime();
          const bTime = new Date(b.created_at ?? 0).getTime();
          return bTime - aTime;
        });
      setRecentActivities(normalizedActivities.slice(0, 3));
    } catch (error: any) {
      setRecentActivitiesError(t('dashboard.errors.generic', { message: error?.message ?? 'Unknown error' }));
    } finally {
      setLoadingRecentActivities(false);
    }
  }, [locale, t, user]);

  const loadProviderServices = useCallback(async () => {
    if (!isProvider || !user?.id) {
      setProviderServices([]);
      setProviderServicesError('');
      setLoadingProviderServices(false);
      return;
    }

    setLoadingProviderServices(true);
    setProviderServicesError('');
    try {
      const response = await apiClient.getProviderServices(String(user.id));
      setProviderServices(Array.isArray(response) ? response : []);
    } catch (error: any) {
      setProviderServicesError(
        t('dashboard.errors.services_load_failed', {
          message: error?.message ?? 'Unknown error',
        })
      );
    } finally {
      setLoadingProviderServices(false);
    }
  }, [isProvider, t, user?.id]);

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const response = await apiClient.getDashboardStats();
      setStats(response);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    let channel:
      | {
          notification: (callback: (notification: any) => void) => void;
          stopListening: (event: string) => void;
        }
      | null = null;

    const handler = (notification: {
      type?: string;
      data?: {
        type?: string;
        projectId?: string | number;
        payload?: { projectId?: string | number; status?: string };
      };
      projectId?: string | number;
      payload?: { projectId?: string | number; status?: string };
    }) => {
      const rawType = String(notification?.type ?? '').toLowerCase();
      const declaredType = String(notification?.data?.type ?? '').toLowerCase();
      const isBudgetAcceptedByProvider =
        declaredType === 'budget.accepted.by_provider' ||
        rawType.includes('provideracceptedclientbudget');
      const projectId =
        notification?.data?.projectId ??
        notification?.projectId ??
        notification?.data?.payload?.projectId ??
        notification?.payload?.projectId;
      const payloadStatus = String(
        notification?.data?.payload?.status ??
        notification?.payload?.status ??
        ''
      ).toUpperCase();
      const isProjectEvent =
        declaredType.startsWith('project.') ||
        declaredType.startsWith('budget.');
      const isProjectStatusUpdatedEvent =
        declaredType === 'project.status.updated' ||
        rawType.includes('projectstatusupdated');
      const isProviderFinishedNotification =
        isProjectStatusUpdatedEvent && payloadStatus === 'FINISHED';
      const isFallbackProjectEvent = !declaredType && Boolean(projectId);
      const shouldReloadProjectsForBothRoles =
        isProjectEvent ||
        isProjectStatusUpdatedEvent ||
        isProviderFinishedNotification ||
        isBudgetAcceptedByProvider ||
        isFallbackProjectEvent;

      const shouldRefetchProjects = shouldReloadProjectsForBothRoles;

      const shouldRefreshOverview =
        activeTab === 'overview' &&
        (isProjectEvent || isBudgetAcceptedByProvider);

      if (shouldRefetchProjects) {
        void loadProjects(true);
      }

      if (shouldRefreshOverview) {
        void loadOverviewProjects(true);
        void loadRecentActivities();
        void loadStats();
      }
    };

    void (async () => {
      const echo = await ensureEcho();
      if (!echo || cancelled) return;
      const privateChannel = echo.private(`App.Models.User.${user.id}`);
      channel = privateChannel;
      privateChannel.notification(handler);
    })();

    return () => {
      cancelled = true;
      channel?.stopListening('.Illuminate\\Notifications\\Events\\BroadcastNotificationCreated');
    };
  }, [user?.id, activeTab, loadProjects, loadOverviewProjects, loadRecentActivities, loadStats]);

  useEffect(() => {
    if (user && activeTab === 'overview') {
      loadStats();
    }
  }, [user, activeTab, loadStats]);

  useEffect(() => {
    if (!user || activeTab !== 'overview') return;
    loadOverviewProjects();
  }, [activeTab, loadOverviewProjects, user]);

  useEffect(() => {
    if (!user || activeTab !== 'overview') return;
    loadRecentActivities();
  }, [activeTab, loadRecentActivities, user]);

  useEffect(() => {
    if (!user || !isProvider || activeTab !== 'services') return;
    loadProviderServices();
  }, [activeTab, isProvider, loadProviderServices, user]);


  useEffect(() => {
    if (!user || activeTab !== 'projects') return;
    if (isClient && !isProvider) return;
    loadProjects();
  }, [user, activeTab, searchTerm, statusFilter, sortBy, sortOrder, currentPage, loadProjects, isClient, isProvider]);

  useEffect(() => {
    if (activeTab !== 'projects') return;
    if (typeof window === 'undefined') return;

    const handleFocus = () => {
      loadProjects(true);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadProjects(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [activeTab, loadProjects]);

  const handleProjectResponse = useCallback(async (
    projectId: string,
    payload: {
      response: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'NEW_PROPOSE';
      proposedBudget?: number;
      reason?: string;
      refusal_scope?: 'project' | 'milestone' | 'milestones';
      milestone_ids?: Array<string | number>;
      suggestions_limit?: number;
    }
  ) => {
    try {
      await apiClient.respondToProjectRequest(projectId, payload, locale);
      let message = '';
      if (payload.response === 'ACCEPTED') message = t('dashboard.notifications.project_accepted');
      else if (payload.response === 'REJECTED') message = t('dashboard.notifications.project_rejected');
      else if (payload.response === 'NEW_PROPOSE') message = t('dashboard.notifications.budget_proposed');
      toast.success(message);
      await loadProjects(true);
      await loadOverviewProjects(true);
      await loadRecentActivities();
    } catch (error: any) {
      toast.error(t('dashboard.errors.generic', { message: error.message }));
    }
  }, [loadOverviewProjects, loadProjects, loadRecentActivities, locale, t]);

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSortBy('newest');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const getVisiblePages = () => {
      const delta = 2;
      const range = [];
      const rangeWithDots = [];

      for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
        range.push(i);
      }

      if (currentPage - delta > 2) {
        rangeWithDots.push(1, '...');
      } else {
        rangeWithDots.push(1);
      }

      rangeWithDots.push(...range);

      if (currentPage + delta < totalPages - 1) {
        rangeWithDots.push('...', totalPages);
      } else {
        rangeWithDots.push(totalPages);
      }

      return rangeWithDots;
    };

    const visiblePages = getVisiblePages();

    return (
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100 dark:border-[#1E2A3D]">
        <div className="text-sm text-slate-500 dark:text-[#A3ADC2]">
          {t('dashboard.pagination.showing', {
            start: Math.min((currentPage - 1) * projectsPerPage + 1, projects.length),
            end: Math.min(currentPage * projectsPerPage, projects.length),
            total: projects.length,
          })}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
            {t('dashboard.pagination.previous')}
          </Button>

          {visiblePages.map((page, index) => (
            <Button
              key={index}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => typeof page === 'number' && setCurrentPage(page)}
              disabled={page === '...'}
              className="w-10"
            >
              {page}
            </Button>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            {t('dashboard.pagination.next')}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  const getClientStatusOptions = () => [
    { value: 'all', label: t('dashboard.filters.status.all') },
    { value: 'PENDING_RESPONSES', label: t('dashboard.filters.status.pending_responses') },
    { value: 'IN_PROGRESS', label: t('dashboard.filters.status.in_progress') },
    { value: 'COMPLETED', label: t('dashboard.filters.status.completed') },
    { value: 'CANCELLED', label: t('dashboard.filters.status.cancelled') }
  ];

  const getProviderStatusOptions = () => [
    { value: 'all', label: t('dashboard.filters.status.all') },
    { value: 'PENDING', label: t('dashboard.filters.status.pending') },
    { value: 'ACCEPTED', label: t('dashboard.filters.status.accepted') },
    { value: 'REJECTED', label: t('dashboard.filters.status.rejected') },
    { value: 'BUDGET_PROPOSED', label: t('dashboard.filters.status.budget_proposed') }
  ];

  const getSortOptions = () => [
    { value: 'newest', label: t('dashboard.filters.sort.newest') },
    { value: 'oldest', label: t('dashboard.filters.sort.oldest') },
    { value: 'budget', label: t('dashboard.filters.sort.budget') },
    { value: 'title', label: t('dashboard.filters.sort.title') }
  ];

  if (loading || userLoading || isRefreshingRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>{t('dashboard.loading.dashboard')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>{t('dashboard.loading.dashboard')}</p>
        </div>
      </div>
    );
  }

  const userDisplayName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email;
  const badgeCounts = user.badge_counts ?? { awarded: 0, in_progress: 0 };
  const featuredBadges = Array.isArray(user.featured_badges) ? user.featured_badges : [];
  const myBadges = myBadgesData ?? [];
  const myBadgeProgress = myBadgeProgressData ?? [];
  const myBadgeRewards = myBadgeRewardsData ?? [];
  const loadingBadgeData = loadingMyBadges || loadingMyBadgeProgress || loadingMyBadgeRewards;
  const badgeDataError = myBadgesError ?? myBadgeProgressError ?? myBadgeRewardsError ?? null;

  return (
    <TrustoraDashboardShell
      activeMenu={activeTab}
      isProvider={isProvider}
      isClient={isClient}
      onMenuSelect={handleTabChange}
    >
      <div className="space-y-6">
        {activeTab === 'overview' ? (
          <DashboardOverview
            isProvider={isProvider}
            userDisplayName={userDisplayName}
            stats={stats}
            loadingStats={loadingStats}
            overviewProjects={overviewProjects}
            loadingOverviewProjects={loadingOverviewProjects}
            overviewProjectsError={overviewProjectsError}
            recentActivities={recentActivities}
            loadingRecentActivities={loadingRecentActivities}
            recentActivitiesError={recentActivitiesError}
            providerServicesCount={providerServicesSummary.total}
            badgeCounts={badgeCounts}
            featuredBadges={featuredBadges}
            awardedBadges={myBadges}
            badgeProgress={myBadgeProgress}
            badgeRewards={myBadgeRewards}
            loadingBadgeData={loadingBadgeData}
            badgeDataError={badgeDataError}
            onTabChange={handleTabChange}
            onOpenProject={handleOverviewProjectOpen}
          />
        ) : null}

        {activeTab === 'projects' ? (
          <div className="space-y-6">
            <DashboardSectionHeader
              title={isProvider ? t('dashboard.projects.title.provider') : t('dashboard.projects.title.client')}
              description={loadingProjects ? t('dashboard.loading.projects') : t('dashboard.projects.found', { count: projects.length })}
              icon={Briefcase}
              action={isClient && !isProvider ? (
                <Button asChild className="btn-primary">
                  <Link href="/projects/new">
                    <Plus className="mr-2 h-4 w-4" />
                    {t('dashboard.projects.new_project')}
                  </Link>
                </Button>
              ) : undefined}
            />

            <DashboardProjectReviewsPanel
              isClient={isClient}
              isProvider={isProvider}
              resolveMilestoneOptions={resolveReviewMilestoneOptions}
            />

            {isClient && !isProvider ? (
              <ClientProjectRequests withLayout={false} />
            ) : (
              <>
                <Card className="glass-card">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4 lg:flex-row">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder={t('dashboard.filters.search_placeholder')}
                            value={searchTerm}
                            onChange={(e) => {
                              setSearchTerm(e.target.value);
                              setCurrentPage(1);
                            }}
                            className="pl-10 bg-white/70 border-slate-200 focus-visible:ring-[#1BC47D]/40 dark:bg-[#0B1220] dark:border-[#1E2A3D]"
                          />
                        </div>
                      </div>

                      <Select value={statusFilter} onValueChange={(value) => {
                        setStatusFilter(value);
                        setCurrentPage(1);
                      }}>
                        <SelectTrigger className="w-full lg:w-64 bg-white/70 border-slate-200 focus:ring-[#1BC47D]/40 dark:bg-[#0B1220] dark:border-[#1E2A3D]">
                          <Filter className="mr-2 h-4 w-4" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(isProvider ? getProviderStatusOptions() : getClientStatusOptions()).map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="flex space-x-2">
                        <Select value={sortBy} onValueChange={(value) => {
                          setSortBy(value);
                          setCurrentPage(1);
                        }}>
                          <SelectTrigger className="w-full lg:w-48 bg-white/70 border-slate-200 focus:ring-[#1BC47D]/40 dark:bg-[#0B1220] dark:border-[#1E2A3D]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {getSortOptions().map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Button
                          variant="outline"
                          size="icon"
                          onClick={toggleSortOrder}
                          className="flex-shrink-0 border-slate-200 dark:border-[#1E2A3D]"
                        >
                          {sortOrder === 'asc' ? (
                            <ArrowUp className="h-4 w-4" />
                          ) : (
                            <ArrowDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {(searchTerm || statusFilter !== 'all' || sortBy !== 'newest' || sortOrder !== 'desc') && (
                      <div className="mt-4 flex items-center space-x-2 border-t border-slate-100 pt-4 dark:border-[#1E2A3D]">
                        <span className="text-sm font-medium text-slate-500 dark:text-[#A3ADC2]">{t('dashboard.filters.active')}</span>

                        {searchTerm && (
                          <Badge variant="secondary" className="flex items-center space-x-1">
                            <span>{t('dashboard.filters.search_label', { term: searchTerm })}</span>
                            <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-red-500">
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        )}

                        {statusFilter !== 'all' && (
                          <Badge variant="secondary" className="flex items-center space-x-1">
                            <span>{t('dashboard.filters.status_label', { status: (isProvider ? getProviderStatusOptions() : getClientStatusOptions()).find(o => o.value === statusFilter)?.label ?? '' })}</span>
                            <button onClick={() => setStatusFilter('all')} className="ml-1 hover:text-red-500">
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        )}

                        {(sortBy !== 'newest' || sortOrder !== 'desc') && (
                          <Badge variant="secondary" className="flex items-center space-x-1">
                            <span>{t('dashboard.filters.sort_label', {
                              label: getSortOptions().find(o => o.value === sortBy)?.label ?? '',
                              order: sortOrder === 'asc' ? t('dashboard.filters.sort_order.asc') : t('dashboard.filters.sort_order.desc'),
                            })}</span>
                            <button onClick={() => { setSortBy('newest'); setSortOrder('desc'); }} className="ml-1 hover:text-red-500">
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        )}

                        <Button variant="outline" size="sm" onClick={resetFilters} className="border-slate-200 dark:border-[#1E2A3D]">
                          {t('dashboard.filters.reset_all')}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {loadingProjects ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : projectsError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{projectsError}</AlertDescription>
                  </Alert>
                ) : projects.length === 0 ? (
                  <Card className="glass-card">
                    <CardContent className="py-20 text-center">
                      <Briefcase className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                      <h3 className="mb-2 text-xl font-semibold">
                        {isProvider ? t('dashboard.projects.empty.title.provider') : t('dashboard.projects.empty.title.client')}
                      </h3>
                      <p className="mb-6 text-slate-500 dark:text-[#A3ADC2]">
                        {isProvider
                          ? t('dashboard.projects.empty.description.provider')
                          : t('dashboard.projects.empty.description.client')
                        }
                      </p>
                      {isClient && !isProvider ? (
                        <Button asChild className="btn-primary">
                          <Link href="/projects/new">
                            <Plus className="mr-2 h-4 w-4" />
                            {t('dashboard.projects.empty.cta')}
                          </Link>
                        </Button>
                      ) : null}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {projects.map((project) => (
                      <ProjectRequestCard
                        key={project.id}
                        project={project}
                        onResponse={handleProjectResponse}
                        onRefresh={loadProjects}
                      />
                    ))}

                    {renderPagination()}
                  </div>
                )}
              </>
            )}
          </div>
        ) : null}

        {activeTab === 'services' ? (
          <div className="space-y-6">
            <DashboardSectionHeader
              title={isProvider ? t('dashboard.services.title.provider') : t('dashboard.services.title.client')}
              description={isProvider
                ? t('dashboard.services.description.provider')
                : t('dashboard.services.description.client')}
              icon={Target}
              action={isProvider ? (
                <Button asChild variant="outline">
                  <Link href={getProviderServicesSelectHref({ reset: true })}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('dashboard.services.manage_cta')}
                  </Link>
                </Button>
              ) : undefined}
            />

            <Card className="glass-card">
              <CardContent className="p-6">
                {isProvider ? (
                  loadingProviderServices ? (
                    <div className="flex flex-col items-center justify-center py-14 text-center">
                      <div
                        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border"
                        style={{
                          borderColor: 'var(--border-color)',
                          background: 'linear-gradient(135deg, rgba(27, 196, 125, 0.14), rgba(33, 209, 159, 0.04))',
                        }}
                      >
                        <Loader2 className="h-7 w-7 animate-spin" style={{ color: theme.trustAccent }} />
                      </div>
                      <h3 className="text-lg font-semibold" style={{ color: 'var(--text-main)' }}>
                        {t('dashboard.services.loading')}
                      </h3>
                      <p className="mt-2 max-w-md text-sm" style={{ color: 'var(--text-muted)' }}>
                        {t('dashboard.services.description.provider')}
                      </p>
                    </div>
                  ) : providerServicesError ? (
                    <div className="space-y-4">
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{providerServicesError}</AlertDescription>
                      </Alert>
                      <Button variant="outline" onClick={() => void loadProviderServices()}>
                        {t('dashboard.services.retry')}
                      </Button>
                    </div>
                  ) : providerServices.length === 0 ? (
                    <div className="py-12 text-center">
                      <Target className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                      <h3 className="mb-2 text-lg font-medium">
                        {t('dashboard.services.empty.title.provider')}
                      </h3>
                      <p className="mb-4 text-muted-foreground">
                        {t('dashboard.services.empty.description.provider')}
                      </p>
                      <Button asChild>
                        <Link href={getProviderServicesSelectHref({ reset: true })}>
                          <Plus className="mr-2 h-4 w-4" />
                          {t('dashboard.services.empty.cta')}
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div
                          className="rounded-2xl border p-4"
                          style={{
                            borderColor: 'var(--border-color)',
                            background: 'linear-gradient(135deg, rgba(27, 196, 125, 0.12), rgba(27, 196, 125, 0.02))',
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                                {t('dashboard.services.summary.total')}
                              </p>
                              <p className="mt-2 text-2xl font-semibold" style={{ color: 'var(--text-main)' }}>
                                {formatCompactNumber(providerServicesSummary.total)}
                              </p>
                            </div>
                            <Briefcase className="h-5 w-5" style={{ color: theme.trustAccent }} />
                          </div>
                        </div>
                        <div
                          className="rounded-2xl border p-4"
                          style={{
                            borderColor: 'var(--border-color)',
                            background: 'linear-gradient(135deg, rgba(33, 209, 159, 0.12), rgba(33, 209, 159, 0.02))',
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                                {t('dashboard.services.summary.verified')}
                              </p>
                              <p className="mt-2 text-2xl font-semibold" style={{ color: 'var(--text-main)' }}>
                                {formatCompactNumber(providerServicesSummary.verified)}
                              </p>
                            </div>
                            <Shield className="h-5 w-5" style={{ color: theme.success }} />
                          </div>
                        </div>
                        <div
                          className="rounded-2xl border p-4"
                          style={{
                            borderColor: 'var(--border-color)',
                            background: 'linear-gradient(135deg, rgba(245, 166, 35, 0.12), rgba(245, 166, 35, 0.02))',
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                                {t('dashboard.services.summary.categories')}
                              </p>
                              <p className="mt-2 text-2xl font-semibold" style={{ color: 'var(--text-main)' }}>
                                {formatCompactNumber(providerServicesSummary.categories)}
                              </p>
                            </div>
                            <Layers className="h-5 w-5" style={{ color: theme.warning }} />
                          </div>
                        </div>
                        <div
                          className="rounded-2xl border p-4"
                          style={{
                            borderColor: 'var(--border-color)',
                            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(99, 102, 241, 0.02))',
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                                {t('dashboard.services.summary.average_rating')}
                              </p>
                              <p className="mt-2 text-2xl font-semibold" style={{ color: 'var(--text-main)' }}>
                                {formatRatingValue(providerServicesSummary.averageRating)}
                              </p>
                            </div>
                            <Star className="h-5 w-5" style={{ color: '#6366F1' }} />
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 xl:grid-cols-2">
                        {providerServices.map((providerService) => {
                          const service = providerService.service;
                          const categoryName =
                            service?.category?.name || t('dashboard.services.labels.category_fallback');
                          const deliveryProviderLabel = service?.delivery_provider
                            ? formatDeliveryProvider(service.delivery_provider)
                            : '';
                          const nextLevel = getNextProviderLevel(providerService.level);

                          return (
                            <div
                              key={providerService.id ?? `${providerService.service_id}-${service?.slug ?? service?.name ?? 'service'}`}
                              className="rounded-3xl border p-5"
                              style={{
                                borderColor: 'var(--border-color)',
                                background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
                              }}
                            >
                              <div className="flex flex-col gap-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div className="space-y-1">
                                    <h3 className="text-lg font-semibold" style={{ color: 'var(--text-main)' }}>
                                      {service?.name || t('dashboard.services.labels.service_fallback')}
                                    </h3>
                                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                                      {categoryName}
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap justify-end gap-2">
                                    {providerService.verified ? (
                                      <Badge
                                        className="border-0"
                                        style={{ backgroundColor: 'rgba(33, 209, 159, 0.14)', color: theme.success }}
                                      >
                                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                        {t('dashboard.services.labels.verified')}
                                      </Badge>
                                    ) : null}
                                    <Badge
                                      variant="secondary"
                                      className="border-0"
                                      style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-main)' }}
                                    >
                                      {formatProviderLevel(providerService.level)}
                                    </Badge>
                                  </div>
                                </div>

                                {service?.description ? (
                                  <p className="text-sm leading-6" style={{ color: 'var(--text-muted)' }}>
                                    {service.description}
                                  </p>
                                ) : null}

                                <div className="grid gap-3 sm:grid-cols-3">
                                  <div
                                    className="rounded-2xl border p-3"
                                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                                  >
                                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>
                                      <Star className="h-3.5 w-3.5" />
                                      {t('dashboard.services.labels.rating')}
                                    </div>
                                    <p className="mt-2 text-lg font-semibold" style={{ color: 'var(--text-main)' }}>
                                      {formatRatingValue(providerService.rating)}
                                    </p>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                      {providerService.reviewCount > 0
                                        ? `${formatCompactNumber(providerService.reviewCount)} ${t('dashboard.services.labels.reviews')}`
                                        : t('dashboard.services.labels.not_rated')}
                                    </p>
                                  </div>
                                  <div
                                    className="rounded-2xl border p-3"
                                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                                  >
                                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>
                                      <Briefcase className="h-3.5 w-3.5" />
                                      {t('dashboard.services.labels.projects')}
                                    </div>
                                    <p className="mt-2 text-lg font-semibold" style={{ color: 'var(--text-main)' }}>
                                      {formatCompactNumber(providerService.provider_project_count)}
                                    </p>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                      {t('dashboard.services.labels.projects')}
                                    </p>
                                  </div>
                                  <div
                                    className="rounded-2xl border p-3"
                                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                                  >
                                    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>
                                      <Layers className="h-3.5 w-3.5" />
                                      {t('dashboard.services.labels.delivery_provider')}
                                    </div>
                                    <p className="mt-2 text-lg font-semibold" style={{ color: 'var(--text-main)' }}>
                                      {deliveryProviderLabel || '--'}
                                    </p>
                                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                      {formatProviderLevel(providerService.level)}
                                    </p>
                                  </div>
                                </div>

                                {service?.tags?.length ? (
                                  <div className="flex flex-wrap gap-2">
                                    {service.tags.map((tag) => (
                                      <Badge
                                        key={`${providerService.id}-${tag}`}
                                        variant="outline"
                                        className="rounded-full px-3 py-1"
                                        style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                                      >
                                        #{tag}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : null}

                                {nextLevel ? (
                                  <div
                                    className="flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                                    style={{
                                      borderColor: 'var(--border-color)',
                                      backgroundColor: 'rgba(27, 196, 125, 0.05)',
                                    }}
                                  >
                                    <div className="space-y-1">
                                      <p className="text-xs font-medium uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>
                                        {t('dashboard.services.upgrade.label')}
                                      </p>
                                      <p className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>
                                        {t('dashboard.services.upgrade.description', {
                                          current: formatProviderLevel(providerService.level),
                                          target: formatProviderLevel(nextLevel),
                                        })}
                                      </p>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      onClick={() => handleStartLevelUpgradeTest(providerService)}
                                    >
                                      <ArrowUp className="mr-2 h-4 w-4" />
                                      {t('dashboard.services.upgrade.cta', {
                                        level: formatProviderLevel(nextLevel),
                                      })}
                                    </Button>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )
                ) : (
                  <div className="py-12 text-center">
                    <Target className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="mb-2 text-lg font-medium">
                      {t('dashboard.services.empty.title.client')}
                    </h3>
                    <p className="text-muted-foreground">
                      {t('dashboard.services.empty.description.client')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}

        {activeTab === 'messages' ? (
          <div className="space-y-6">
            <DashboardSectionHeader
              title={t('dashboard.messages.title')}
              description={t('dashboard.messages.description')}
              icon={MessageSquare}
            />

            <Card className="glass-card">
              <CardContent className="p-10">
                <div className="py-12 text-center">
                  <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="mb-2 text-lg font-medium">{t('dashboard.messages.empty.title')}</h3>
                  <p className="text-muted-foreground">{t('dashboard.messages.empty.description')}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {activeTab === 'settings' ? (
          <div className="space-y-6">
            <DashboardSectionHeader
              title={t('dashboard.tabs.settings')}
              description={t('dashboard.settings.page_description')}
              icon={Layers}
            />
            <SettingsComponent onOpenCompanyInformationsDialog={handleOpenCompanyInformationsDialog} />
          </div>
        ) : null}
      </div>
      <CompanyInformationsSettingsDialog
        openCompanyInformationsDialog={openCompanyInformationsDialog}
        setOpenCompanyInformationsDialog={setOpenCompanyInformationsDialog}
      />
      {user ? <ChatLauncher /> : null}
    </TrustoraDashboardShell>
  );
}
