"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/lib/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Briefcase,
  DollarSign,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Search,
  Filter,
  ArrowUp,
  ArrowDown,
  Eye,
  MessageSquare,
  Target,
  Users,
  FileText,
  Settings,
  Bell,
  BarChart3,
  Zap,
  Award,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Edit,
  X, Euro, Currency
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { ProjectRequestCard } from '@/components/project-request-card';
import { apiClient, DashboardStatsResponse } from '@/lib/api';
import { getEcho } from '@/lib/echo';
import { toast } from 'sonner';
import { Link } from '@/lib/navigation';
import { Can } from "@/components/Can";
import ClientProjectRequests from '../client/project-requests/ClientProjectRequests';
import SettingsComponent from "@/components/dashboard/SettingsComponent";

const BASE_TABS = ['overview', 'projects', 'services', 'messages', 'settings'];

interface WalletData {
  id: string;
  currency: string;
  balance: number | null;
  received_balance: number | null;
  on_hold_balance: number | null;
}

export default function DashboardClient() {
  const { user, loading, userLoading, updateUser, refreshUser } = useAuth();
  const t = useTranslations();
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [projectsError, setProjectsError] = useState('');
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

  const isProvider = roleSlugs.includes('provider');
  const isClient = roleSlugs.includes('client');
  const hasRoleInfo = roleSlugs.length > 0;
  const availableTabs = useMemo(() => {
    if (hasRoleInfo && !isProvider) {
      return BASE_TABS;
    }
    return [...BASE_TABS, 'finance'];
  }, [hasRoleInfo, isProvider]);

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
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState('overview');
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [balance, setBalance] = useState<WalletData | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const balanceRequestId = useRef(0);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const selectedWalletIdRef = useRef<string | null>(null);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferLoading, setTransferLoading] = useState(false);

  const parseBalanceAmount = useCallback((value: unknown) => {
    if (value === null || value === undefined) return null;
    const parsed = typeof value === 'string' && value.trim() === '' ? NaN : Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }, []);

  const formatBalanceAmount = useCallback((value: number | null | undefined, currency?: string) => {
    if (value === null || value === undefined || Number.isNaN(value)) return '--';
    if (!currency) {
      return new Intl.NumberFormat(locale).format(value);
    }
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
    } catch (error) {
      return `${new Intl.NumberFormat(locale).format(value)} ${currency}`;
    }
  }, [locale]);

  useEffect(() => {
    selectedWalletIdRef.current = selectedWalletId;
  }, [selectedWalletId]);

  const fetchBalance = useCallback(async () => {
    if (!isProvider || !user?.rapyd_wallet_id) {
      balanceRequestId.current += 1;
      setWallets([]);
      setBalance(null);
      setSelectedWalletId(null);
      setBalanceError(null);
      setBalanceLoading(false);
      return;
    }

    const requestId = ++balanceRequestId.current;
    setBalanceLoading(true);
    setBalanceError(null);
    try {
      const response = await apiClient.rapydGetWalletBalance(locale);

      if (balanceRequestId.current !== requestId) return;

      const rawData = response?.data ?? response;
      const rawWallets = Array.isArray(rawData) ? rawData : rawData ? [rawData] : [];
      const normalizedWallets = rawWallets
        .map((wallet: any) => ({
          id: String(wallet.id ?? ''),
          currency: String(wallet.currency ?? wallet.alias ?? ''),
          balance: parseBalanceAmount(wallet.balance),
          received_balance: parseBalanceAmount(wallet.received_balance),
          on_hold_balance: parseBalanceAmount(wallet.on_hold_balance),
        }))
        .filter((wallet: WalletData) => wallet.id && wallet.currency);

      if (normalizedWallets.length === 0) {
        setWallets([]);
        setBalance(null);
        setSelectedWalletId(null);
        setBalanceError(t('dashboard.hero.balance.error'));
        return;
      }

      setWallets(normalizedWallets);

      const preferredId = selectedWalletIdRef.current;
      const nextWallet =
        (preferredId && normalizedWallets.find((wallet) => wallet.id === preferredId)) ||
        normalizedWallets[0] ||
        null;

      setSelectedWalletId(nextWallet?.id ?? null);
      setBalance(nextWallet);
    } catch (err: any) {
      if (balanceRequestId.current !== requestId) return;
      const message = err?.message ?? t('dashboard.hero.balance.error');
      setBalance(null);
      setBalanceError(message);
      toast.error(t('dashboard.errors.generic', { message }));
    } finally {
      if (balanceRequestId.current === requestId) {
        setBalanceLoading(false);
      }
    }
  }, [isProvider, locale, parseBalanceAmount, t, user?.rapyd_wallet_id]);

  useEffect(() => {
    if (!isProvider || !user?.rapyd_wallet_id) return;
    fetchBalance();
  }, [fetchBalance, isProvider, user?.rapyd_wallet_id]);

  const updateTabQuery = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'overview') {
      params.delete('tab');
    } else {
      params.set('tab', value);
    }
    const query = params.toString();
    const basePath = pathname || '/dashboard';
    router.replace(query ? `${basePath}?${query}` : basePath, { scroll: false });
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (activeTab !== 'finance' || !isProvider || !user?.rapyd_wallet_id) return;
    fetchBalance();
  }, [activeTab, fetchBalance, isProvider, user?.rapyd_wallet_id]);

  useEffect(() => {
    if (userLoading || !user) return;
    const nextTab = tabParam && availableTabs.includes(tabParam)
      ? tabParam
      : availableTabs[0] ?? 'overview';
    setActiveTab(nextTab);
    if (tabParam && !availableTabs.includes(tabParam)) {
      updateTabQuery(nextTab);
    }
  }, [tabParam, availableTabs, updateTabQuery, userLoading, user]);

  useEffect(() => {
    if (userLoading) return;

    if (!user) {
      const currentPath = pathname || '/dashboard';
      const callbackPath = currentPath.startsWith(`/${locale}`)
        ? currentPath
        : `/${locale}${currentPath.startsWith('/') ? currentPath : `/${currentPath}`}`;
      const query = searchParamsString;
      const callbackUrl = query ? `${callbackPath}?${query}` : callbackPath;
      router.replace(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
  }, [locale, pathname, router, searchParamsString, user, userLoading]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    updateTabQuery(value);
  };

  const handleWalletChange = (walletId: string) => {
    setSelectedWalletId(walletId);
    const wallet = wallets.find((item) => item.id === walletId) ?? null;
    setBalance(wallet);
    setTransferAmount('');
    setTransferError(null);
  };

  const normalizeAmountInput = (value: string) => value.replace(',', '.');

  const handleTransferAmountChange = (value: string) => {
    if (value === '') {
      setTransferAmount('');
      setTransferError(null);
      return;
    }

    const normalized = normalizeAmountInput(value);
    const parsed = Number(normalized);
    const availableBalance = balance?.balance ?? 0;

    if (!Number.isFinite(parsed) || parsed < 0) {
      setTransferAmount(value);
      setTransferError(t('dashboard.finance.invalid_amount'));
      return;
    }

    if (parsed > availableBalance) {
      setTransferAmount(availableBalance.toString());
      setTransferError(t('dashboard.finance.insufficient_balance'));
      return;
    }

    setTransferAmount(value);
    setTransferError(null);
  };

  const handleTransfer = async () => {
    const availableBalance = balance?.balance ?? 0;
    const normalized = normalizeAmountInput(transferAmount);
    const amount = Number(normalized);

    if (!Number.isFinite(amount) || amount <= 0) {
      setTransferError(t('dashboard.finance.invalid_amount'));
      return;
    }

    if (amount > availableBalance) {
      setTransferError(t('dashboard.finance.insufficient_balance'));
      return;
    }

    const formattedAmount = balance?.currency
      ? formatBalanceAmount(amount, balance.currency)
      : amount.toString();

    const confirmed = window.confirm(
      t('dashboard.finance.confirm_transfer', { amount: formattedAmount })
    );
    if (!confirmed) return;

    setTransferLoading(true);
    try {
      await apiClient.rapydCreatePayoutBank(amount, balance?.currency, locale);
      toast.success(t('dashboard.finance.transfer_success'));
      setTransferAmount('');
      setTransferError(null);
      fetchBalance();
    } catch (error: any) {
      toast.error(
        t('dashboard.finance.transfer_error', {
          message: error?.message ?? 'Unknown error',
        })
      );
    } finally {
      setTransferLoading(false);
    }
  };

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    setProjectsError('');
    try {
      let response;
      if (isProvider) {
        response = await apiClient.getProviderProjectRequests();
      } else {
        response = await apiClient.getClientProjectRequests();
      }
      let filteredProjects = response.projects || [];

      // Apply search filter
      if (searchTerm) {
        filteredProjects = filteredProjects.filter((project: any) =>
          project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.description.toLowerCase().includes(searchTerm.toLowerCase())
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
  }, [currentPage, isProvider, searchTerm, sortBy, sortOrder, statusFilter, t]);

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
    if (!user?.id || !isProvider) return;
    const echo = getEcho();
    if (!echo) return;
    const channel = echo.private(`App.Models.User.${user.id}`);
    const handler = (notification: {
      type?: string;
      data?: { type?: string; projectId?: string | number; payload?: { projectId?: string | number } };
      projectId?: string | number;
      payload?: { projectId?: string | number };
    }) => {
      const declaredType = String(
        notification?.data?.type ??
        notification?.type ??
        ''
      ).toLowerCase();
      const projectId =
        notification?.data?.projectId ??
        notification?.projectId ??
        notification?.data?.payload?.projectId ??
        notification?.payload?.projectId;
      const isProjectEvent =
        declaredType.startsWith('project.') ||
        declaredType.startsWith('budget.');
      const isRapydEvent = declaredType.startsWith('rapyd.');

      if (isRapydEvent) {
        void fetchBalance();
      }

      const shouldRefetchProjects =
        activeTab === 'projects' &&
        (isProjectEvent || (isRapydEvent && Boolean(projectId)));

      if (!shouldRefetchProjects) return;
      void loadProjects();
    };
    channel.notification(handler);

    return () => {
      channel.stopListening('.Illuminate\\Notifications\\Events\\BroadcastNotificationCreated');
    };
  }, [user?.id, isProvider, activeTab, loadProjects, fetchBalance]);

  useEffect(() => {
    if (user && activeTab === 'overview') {
      loadStats();
    }
  }, [user, activeTab, loadStats]);


  useEffect(() => {
    if (!user || activeTab !== 'projects') return;
    if (isClient && !isProvider) return;
    loadProjects();
  }, [user, activeTab, searchTerm, statusFilter, sortBy, sortOrder, currentPage, loadProjects, isClient, isProvider]);

  useEffect(() => {
    if (activeTab !== 'projects') return;
    if (typeof window === 'undefined') return;

    const handleFocus = () => {
      loadProjects();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadProjects();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [activeTab, loadProjects]);

  const handleProjectResponse = async (projectId: string, response: 'ACCEPTED' | 'REJECTED' | 'NEW_PROPOSE', proposedBudget?: number) => {
    try {
      await apiClient.respondToProjectRequest(projectId, { response, proposedBudget }, locale);
      let message = '';
      if (response === 'ACCEPTED') message = t('dashboard.notifications.project_accepted');
      else if (response === 'REJECTED') message = t('dashboard.notifications.project_rejected');
      else if (response === 'NEW_PROPOSE') message = t('dashboard.notifications.budget_proposed');
      toast.success(message);
      await loadProjects();
    } catch (error: any) {
      toast.error(t('dashboard.errors.generic', { message: error.message }));
    }
  };



  const getRapydOnboardingUrl = async () => {
    try {
      if (!user) return;
      const response = await apiClient.rapydOnboarding(locale);

      const walletId = response?.wallet_id ?? response?.data?.wallet_id;
      const contactId =
        response?.rapyd_contact_id ??
        response?.contact_id ??
        response?.data?.rapyd_contact_id ??
        response?.data?.contact_id;

      if (!response || !walletId) {
        console.error('No wallet id returned from Rapyd onboarding');
        return null;
      }

      await updateUser({
        rapyd_wallet_id: walletId,
        ...(contactId ? { rapyd_contact_id: contactId } : {}),
      });
      refreshUser().catch(() => { });

      // window.location.href = response.url;
    } catch (error) {
      console.error('Error fetching Rapyd onboarding URL:', error);
      return null;
    }
  }

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

  if (loading || userLoading) {
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

  // Data for overview stats
  const getOverviewStats = () => {
    if (isProvider) {
      const providerStats = stats?.role === 'provider' ? stats.stats : null;
      return [
        {
          title: t('dashboard.overview.provider.active_projects.title'),
          value: providerStats?.active_projects.value ?? t('dashboard.overview.provider.active_projects.value'),
          change: providerStats ?
            `${providerStats.active_projects.change > 0 ? '+' : ''}${providerStats.active_projects.change} ${providerStats.active_projects.change_type}`
            : t('dashboard.overview.provider.active_projects.change'),
          icon: Briefcase,
          color: 'text-blue-600'
        },
        {
          title: t('dashboard.overview.provider.monthly_revenue.title'),
          value: providerStats
            ? `${providerStats.monthly_revenue.value} ${providerStats.monthly_revenue.currency}`
            : t('dashboard.overview.provider.monthly_revenue.value'),
          change: providerStats
            ? `${providerStats.monthly_revenue.change_percentage}%`
            : t('dashboard.overview.provider.monthly_revenue.change'),
          icon: DollarSign,
          color: 'text-green-600'
        },
        {
          title: t('dashboard.overview.provider.average_rating.title'),
          value: providerStats?.average_rating.value ?? t('dashboard.overview.provider.average_rating.value'),
          change: providerStats ?
            `${providerStats.average_rating.change > 0 ? '+' : ''}${providerStats.average_rating.change}`
            : t('dashboard.overview.provider.average_rating.change'),
          icon: Star,
          color: 'text-yellow-600'
        },
        {
          title: t('dashboard.overview.provider.new_requests.title'),
          value: providerStats?.new_requests.value ?? t('dashboard.overview.provider.new_requests.value'),
          change: providerStats ?
            `${providerStats.new_requests.change > 0 ? '+' : ''}${providerStats.new_requests.change}`
            : t('dashboard.overview.provider.new_requests.change'),
          icon: Bell,
          color: 'text-purple-600'
        }
      ];
    } else {
      const clientStats = stats?.role === 'client' ? stats.stats : null;
      return [
        {
          title: t('dashboard.overview.client.projects_posted.title'),
          value: clientStats?.projects_posted.value ?? t('dashboard.overview.client.projects_posted.value'),
          change: clientStats ?
            `${clientStats.projects_posted.change > 0 ? '+' : ''}${clientStats.projects_posted.change}`
            : t('dashboard.overview.client.projects_posted.change'),
          icon: FileText,
          color: 'text-blue-600'
        },
        {
          title: t('dashboard.overview.client.budget_spent.title'),
          value: clientStats
            ? `${clientStats.budget_spent.value} ${clientStats.budget_spent.currency}`
            : t('dashboard.overview.client.budget_spent.value'),
          change: clientStats
            ? `${clientStats.budget_spent.change_percentage}%`
            : t('dashboard.overview.client.budget_spent.change'),
          icon: DollarSign,
          color: 'text-green-600'
        },
        {
          title: t('dashboard.overview.client.projects_completed.title'),
          value: clientStats?.projects_completed.value ?? t('dashboard.overview.client.projects_completed.value'),
          change: clientStats ?
            `${clientStats.projects_completed.change > 0 ? '+' : ''}${clientStats.projects_completed.change}`
            : t('dashboard.overview.client.projects_completed.change'),
          icon: CheckCircle,
          color: 'text-green-600'
        },
        {
          title: t('dashboard.overview.client.active_providers.title'),
          value: clientStats?.active_providers.value ?? t('dashboard.overview.client.active_providers.value'),
          change: clientStats ?
            `${clientStats.active_providers.change > 0 ? '+' : ''}${clientStats.active_providers.change}`
            : t('dashboard.overview.client.active_providers.change'),
          icon: Users,
          color: 'text-purple-600'
        }
      ];
    }
  };

  const overviewStats = getOverviewStats();
  // const hasOnHoldBalance = balance?.on_hold_balance !== null && balance?.on_hold_balance !== undefined;
  // const hasReceivedBalance = balance?.received_balance !== null && balance?.received_balance !== undefined;

  return (
    <div className="min-h-screen bg-white dark:bg-[#070C14]">
      <Header />

      <section className="pt-28 pb-10 px-6 hero-gradient">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
            <div>
              <Badge className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[#0B1C2D] text-xs font-bold dark:bg-[#111B2D] dark:border-[#1E2A3D] dark:text-[#E6EDF3]">
                <span className="text-[#1BC47D]">●</span> {t('dashboard.hero.badge')}
              </Badge>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2 text-[#0B1C2D] dark:text-[#E6EDF3]">
                {t('dashboard.hero.welcome', { name: user.firstName })}
              </h1>
              <p className="text-slate-500 dark:text-[#A3ADC2]">
                {isProvider
                  ? t('dashboard.hero.subtitle.provider')
                  : t('dashboard.hero.subtitle.client')
                }
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Avatar className="w-16 h-16 border border-slate-100 dark:border-[#1E2A3D]">
                <AvatarImage src={user.avatar ?? undefined} />
                <AvatarFallback className="text-lg bg-slate-100 text-[#0B1C2D] dark:bg-[#111B2D] dark:text-[#E6EDF3]">
                  {user.firstName[0]}{user.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">{user.firstName} {user.lastName}</div>
                <div className="flex items-center flex-row space-x-2">
                  <Badge className={isProvider ? 'bg-emerald-50 text-[#0B1C2D] border border-emerald-100' : 'bg-[#E8F7F1] text-[#0B1C2D] border border-[#CFF1E3]'}>
                    {isProvider ? t('dashboard.hero.role.provider') : t('dashboard.hero.role.client')}
                  </Badge>
                  {isProvider && user.rapyd_wallet_id ? (
                    <>
                      {balanceLoading ? (
                        <Badge className="bg-slate-50 text-[#0B1C2D] border border-slate-100">
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          {t('dashboard.hero.balance.loading')}
                        </Badge>
                      ) : balanceError ? (
                        <Badge className="bg-red-50 text-[#0B1C2D] border border-red-100" title={balanceError}>
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {t('dashboard.hero.balance.error')}
                        </Badge>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <Badge className={'bg-emerald-50 text-[#0B1C2D] border border-emerald-100'}>
                            <div className="flex flex-col px-2">
                              <div className="flex flex-row items-center space-x-2">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {t('dashboard.hero.balance.available')}:
                              </div>
                              {wallets.map((item) => (
                                <div key={item.id} className="flex flex-row items-center space-x-2">
                                  {item.currency === "EUR" ? (
                                    <Euro className="w-3 h-3" />
                                  ) : item.currency === "USD" ? (
                                    <DollarSign className="w-3 h-3" />
                                  ) : (
                                    <Currency className="w-3 h-3" />
                                  )}
                                  {formatBalanceAmount(item.balance, item.currency)}
                                </div>
                              ))}
                            </div>
                          </Badge>

                          {/*{hasOnHoldBalance && (*/}
                          {/*  <Badge className={'bg-red-50 text-[#0B1C2D] border border-red-100'}>*/}
                          {/*    <CheckCircle className="w-3 h-3 mr-1" />*/}
                          {/*    {t('dashboard.hero.balance.on_hold')}: {formatBalanceAmount(balance?.on_hold_balance, balance?.currency)}*/}
                          {/*  </Badge>*/}
                          {/*)}*/}
                          {/*{hasReceivedBalance && (*/}
                          {/*  <Badge className={'bg-yellow-50 text-[#0B1C2D] border border-yellow-100'}>*/}
                          {/*    <CheckCircle className="w-3 h-3 mr-1" />*/}
                          {/*    {t('dashboard.hero.balance.received')}: {formatBalanceAmount(balance?.received_balance, balance?.currency)}*/}
                          {/*  </Badge>*/}
                          {/*)}*/}
                        </div>
                      )}
                    </>
                  ) : !user.rapyd_wallet_id ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="ms-2 bg-emerald-600 !text-white hover:bg-emerald-700 hover:!text-white border-transparent"
                      onClick={getRapydOnboardingUrl}
                    >

                      {t('dashboard.hero.rapyd.connect')}
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          {/* Dashboard Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className={`grid w-full grid-cols-2 sm:grid-cols-3 ${isProvider ? 'lg:grid-cols-6' : 'lg:grid-cols-5'} rounded-2xl bg-slate-100/80 p-1 dark:bg-[#0B1220]`}>
              <TabsTrigger value="overview" className="flex items-center rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#0B1C2D] data-[state=active]:shadow-sm dark:data-[state=active]:bg-[#111B2D] dark:data-[state=active]:text-[#E6EDF3]">
                <BarChart3 className="hidden sm:block w-4 h-4 pe-1" />
                <span>{t('dashboard.tabs.overview')}</span>
              </TabsTrigger>
              <TabsTrigger
                value="projects"
                className="flex items-center rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#0B1C2D] data-[state=active]:shadow-sm dark:data-[state=active]:bg-[#111B2D] dark:data-[state=active]:text-[#E6EDF3]"
              >
                <Briefcase className="hidden sm:block w-4 h-4 pe-1" />
                <span>{t('dashboard.tabs.projects')}</span>
              </TabsTrigger>

              <TabsTrigger value="services" className="flex items-center rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#0B1C2D] data-[state=active]:shadow-sm dark:data-[state=active]:bg-[#111B2D] dark:data-[state=active]:text-[#E6EDF3]">
                <Target className="hidden sm:block w-4 h-4 pe-1" />
                <span>{t('dashboard.tabs.services')}</span>
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex items-center rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#0B1C2D] data-[state=active]:shadow-sm dark:data-[state=active]:bg-[#111B2D] dark:data-[state=active]:text-[#E6EDF3]">
                <MessageSquare className="hidden sm:block w-4 h-4 pe-1" />
                <span>{t('dashboard.tabs.messages')}</span>
              </TabsTrigger>
              {isProvider && (
                <TabsTrigger value="finance" className="flex items-center rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#0B1C2D] data-[state=active]:shadow-sm dark:data-[state=active]:bg-[#111B2D] dark:data-[state=active]:text-[#E6EDF3]">
                  <DollarSign className="hidden sm:block w-4 h-4 pe-1" />
                  <span>{t('dashboard.tabs.finance')}</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="settings" className="flex items-center rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#0B1C2D] data-[state=active]:shadow-sm dark:data-[state=active]:bg-[#111B2D] dark:data-[state=active]:text-[#E6EDF3]">
                <Settings className="hidden sm:block w-4 h-4 pe-1" />
                <span>{t('dashboard.tabs.settings')}</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid xs:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {overviewStats.map((stat, index) => (
                  <Card key={index} className="glass-card shadow-sm hover:shadow-md transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-500 mb-1 dark:text-[#A3ADC2]">
                            {stat.title}
                          </p>
                          <p className="text-2xl font-bold text-[#0B1C2D] dark:text-[#E6EDF3]">{stat.value}</p>
                          <p className="text-xs text-slate-400 mt-1 dark:text-[#6B7285]">
                            {stat.change}
                          </p>
                        </div>
                        <div className={`w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-[rgba(27,196,125,0.12)] flex items-center justify-center ${stat.color}`}>
                          <stat.icon className="w-6 h-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Quick Actions */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="w-5 h-5" />
                    <span>{t('dashboard.quick_actions.title')}</span>
                  </CardTitle>
                  <CardDescription className="text-slate-500 dark:text-[#A3ADC2]">
                    {isProvider
                      ? t('dashboard.quick_actions.description.provider')
                      : t('dashboard.quick_actions.description.client')
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid xs:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {isProvider ? (
                      <>
                        <Button className="h-20 flex-col space-y-2" variant="outline" asChild>
                          <Link href="/provider/services/select">
                            <Plus className="w-6 h-6" />
                            <span>{t('dashboard.quick_actions.provider.add_services')}</span>
                          </Link>
                        </Button>
                        <Button className="h-20 flex-col space-y-2" variant="outline" asChild>
                          <Link href="/provider/profile">
                            <Edit className="w-6 h-6" />
                            <span>{t('dashboard.quick_actions.provider.edit_profile')}</span>
                          </Link>
                        </Button>
                        <Button className="h-20 flex-col space-y-2" variant="outline" asChild>
                          <Link href="/tests">
                            <Award className="w-6 h-6" />
                            <span>{t('dashboard.quick_actions.provider.take_tests')}</span>
                          </Link>
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button className="h-20 flex-col space-y-2" variant="outline" asChild>
                          <Link href="/projects/new">
                            <Plus className="w-6 h-6" />
                            <span>{t('dashboard.quick_actions.client.new_project')}</span>
                          </Link>
                        </Button>
                        <Button className="h-20 flex-col space-y-2" variant="outline" asChild>
                          <Link href="/services">
                            <Search className="w-6 h-6" />
                            <span>{t('dashboard.quick_actions.client.search_services')}</span>
                          </Link>
                        </Button>
                        <Button className="h-20 flex-col space-y-2" variant="outline" asChild>
                          <Link href="/projects">
                            <Eye className="w-6 h-6" />
                            <span>{t('dashboard.quick_actions.client.explore_projects')}</span>
                          </Link>
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>{t('dashboard.activity.title')}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {isProvider ? (
                      <>
                        <div className="flex items-center space-x-3 p-3 border rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{t('dashboard.activity.provider.completed_project.title')}</p>
                            <p className="text-xs text-muted-foreground">{t('dashboard.activity.provider.completed_project.meta')}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 border rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <Bell className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{t('dashboard.activity.provider.new_request.title')}</p>
                            <p className="text-xs text-muted-foreground">{t('dashboard.activity.provider.new_request.meta')}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 border rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                            <Star className="w-4 h-4 text-yellow-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{t('dashboard.activity.provider.new_review.title')}</p>
                            <p className="text-xs text-muted-foreground">{t('dashboard.activity.provider.new_review.meta')}</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center space-x-3 p-3 border rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{t('dashboard.activity.client.project_accepted.title')}</p>
                            <p className="text-xs text-muted-foreground">{t('dashboard.activity.client.project_accepted.meta')}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 border rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{t('dashboard.activity.client.budget_proposal.title')}</p>
                            <p className="text-xs text-muted-foreground">{t('dashboard.activity.client.budget_proposal.meta')}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 border rounded-lg">
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <Plus className="w-4 h-4 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{t('dashboard.activity.client.new_project.title')}</p>
                            <p className="text-xs text-muted-foreground">{t('dashboard.activity.client.new_project.meta')}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects" className="space-y-6">
              {isClient && !isProvider ? (
                activeTab === 'projects' ? <ClientProjectRequests withLayout={false} /> : null
              ) : (
                <>
                  {/* Filters and Search */}
                  <Card className="glass-card">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search Bar */}
                        <div className="flex-1">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
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

                        {/* Status Filter */}
                        <Select value={statusFilter} onValueChange={(value) => {
                          setStatusFilter(value);
                          setCurrentPage(1);
                        }}>
                          <SelectTrigger className="w-full lg:w-64 bg-white/70 border-slate-200 focus:ring-[#1BC47D]/40 dark:bg-[#0B1220] dark:border-[#1E2A3D]">
                            <Filter className="w-4 h-4 mr-2" />
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

                        {/* Sort Options */}
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
                              <ArrowUp className="w-4 h-4" />
                            ) : (
                              <ArrowDown className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Active Filters */}
                      {(searchTerm || statusFilter !== 'all' || sortBy !== 'newest' || sortOrder !== 'desc') && (
                        <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-slate-100 dark:border-[#1E2A3D]">
                          <span className="text-sm font-medium text-slate-500 dark:text-[#A3ADC2]">{t('dashboard.filters.active')}</span>

                          {searchTerm && (
                            <Badge variant="secondary" className="flex items-center space-x-1">
                              <span>{t('dashboard.filters.search_label', { term: searchTerm })}</span>
                              <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-red-500">
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          )}

                          {statusFilter !== 'all' && (
                            <Badge variant="secondary" className="flex items-center space-x-1">
                              <span>{t('dashboard.filters.status_label', { status: (isProvider ? getProviderStatusOptions() : getClientStatusOptions()).find(o => o.value === statusFilter)?.label ?? '' })}</span>
                              <button onClick={() => setStatusFilter('all')} className="ml-1 hover:text-red-500">
                                <X className="w-3 h-3" />
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
                                <X className="w-3 h-3" />
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

                  {/* Projects Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-[#0B1C2D] dark:text-[#E6EDF3]">
                        {isProvider ? t('dashboard.projects.title.provider') : t('dashboard.projects.title.client')}
                      </h2>
                      <p className="text-slate-500 dark:text-[#A3ADC2]">
                        {loadingProjects ? t('dashboard.loading.projects') : t('dashboard.projects.found', { count: projects.length })}
                      </p>
                    </div>

                    {isClient && (
                      <Button asChild className="btn-primary">
                        <Link href="/projects/new">
                          <Plus className="w-4 h-4 mr-2" />
                          {t('dashboard.projects.new_project')}
                        </Link>
                      </Button>
                    )}
                  </div>

                  {/* Projects List */}
                  {loadingProjects ? (
                    <div className="flex justify-center items-center py-20">
                      <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                  ) : projectsError ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{projectsError}</AlertDescription>
                    </Alert>
                  ) : projects.length === 0 ? (
                    <Card className="glass-card">
                      <CardContent className="text-center py-20">
                        <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">
                          {isProvider ? t('dashboard.projects.empty.title.provider') : t('dashboard.projects.empty.title.client')}
                        </h3>
                        <p className="text-slate-500 dark:text-[#A3ADC2] mb-6">
                          {isProvider
                            ? t('dashboard.projects.empty.description.provider')
                            : t('dashboard.projects.empty.description.client')
                          }
                        </p>
                        <Can roles={['client']}>
                          <Button asChild className="btn-primary">
                            <Link href="/projects/new">
                              <Plus className="w-4 h-4 mr-2" />
                              {t('dashboard.projects.empty.cta')}
                            </Link>
                          </Button>
                        </Can>
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
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services" className="space-y-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="w-5 h-5" />
                    <span>{isProvider ? t('dashboard.services.title.provider') : t('dashboard.services.title.client')}</span>
                  </CardTitle>
                  <CardDescription className="text-slate-500 dark:text-[#A3ADC2]">
                    {isProvider
                      ? t('dashboard.services.description.provider')
                      : t('dashboard.services.description.client')
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      {isProvider ? t('dashboard.services.empty.title.provider') : t('dashboard.services.empty.title.client')}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {isProvider
                        ? t('dashboard.services.empty.description.provider')
                        : t('dashboard.services.empty.description.client')
                      }
                    </p>
                    {isProvider && (
                      <Button asChild>
                        <Link href="/provider/services/select">
                          <Plus className="w-4 h-4 mr-2" />
                          {t('dashboard.services.empty.cta')}
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent value="messages" className="space-y-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5" />
                    <span>{t('dashboard.messages.title')}</span>
                  </CardTitle>
                  <CardDescription className="text-slate-500 dark:text-[#A3ADC2]">
                    {t('dashboard.messages.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">{t('dashboard.messages.empty.title')}</h3>
                    <p className="text-muted-foreground">{t('dashboard.messages.empty.description')}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Finance Tab */}
            {isProvider && (
              <TabsContent value="finance" className="space-y-6">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <DollarSign className="w-5 h-5" />
                      <span>{t('dashboard.finance.title')}</span>
                    </CardTitle>
                    <CardDescription className="text-slate-500 dark:text-[#A3ADC2]">
                      {t('dashboard.finance.wallet_balance')}: {formatBalanceAmount(balance?.balance, balance?.currency)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm dark:border-slate-800/70 dark:bg-[#0B1220]/60">
                        <div className="text-sm font-medium text-slate-500 dark:text-[#A3ADC2]">
                          {t('dashboard.finance.wallet_balance')}
                        </div>
                        {balanceLoading ? (
                          <div className="mt-3 flex items-center gap-2 text-sm text-slate-500 dark:text-[#A3ADC2]">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t('dashboard.hero.balance.loading')}
                          </div>
                        ) : balanceError ? (
                          <div className="mt-3 text-sm text-red-500">{balanceError}</div>
                        ) : (
                          wallets.map((item) => (
                            <div key={item.id} className="mt-3 text-2xl font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">
                              {formatBalanceAmount(item.balance, item.currency)}
                            </div>
                          ))
                        )}
                      </div>

                      <div className="space-y-3">
                        {wallets.length > 1 && (
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-slate-500 dark:text-[#A3ADC2]">
                              {t('dashboard.finance.wallet_currency')}
                            </div>
                            <Select
                              value={balance?.id ?? ''}
                              onValueChange={handleWalletChange}
                              disabled={balanceLoading || wallets.length === 0}
                            >
                              <SelectTrigger className="w-full bg-white/70 border-slate-200 focus:ring-[#1BC47D]/40 dark:bg-[#0B1220] dark:border-[#1E2A3D]">
                                <SelectValue placeholder={t('dashboard.finance.select_wallet')} />
                              </SelectTrigger>
                              <SelectContent>
                                {wallets.map((wallet) => (
                                  <SelectItem key={wallet.id} value={wallet.id}>
                                    {wallet.currency} • {formatBalanceAmount(wallet.balance, wallet.currency)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <div className="text-sm font-medium text-slate-500 dark:text-[#A3ADC2]">
                          {t('dashboard.finance.transfer_amount')}
                        </div>
                        <div className="relative">
                          <Input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.01"
                            value={transferAmount}
                            onChange={(e) => handleTransferAmountChange(e.target.value)}
                            placeholder="0.00"
                            className="pr-16 bg-white/70 border-slate-200 focus-visible:ring-[#1BC47D]/40 dark:bg-[#0B1220] dark:border-[#1E2A3D]"
                            disabled={balanceLoading || balance?.balance == null}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 h-8 -translate-y-1/2 px-2 text-xs font-semibold"
                            onClick={() => {
                              const maxValue = balance?.balance ?? 0;
                              setTransferAmount(maxValue ? maxValue.toString() : '0');
                              setTransferError(null);
                            }}
                            disabled={balanceLoading || balance?.balance == null}
                          >
                            {t('dashboard.finance.max')}
                          </Button>
                        </div>
                        {transferError && (
                          <p className="text-xs text-red-500">{transferError}</p>
                        )}
                        <Button
                          variant="default"
                          className="w-full bg-[#1BC47D] hover:bg-[#159c63]"
                          onClick={handleTransfer}
                          disabled={
                            transferLoading ||
                            balanceLoading ||
                            balance?.balance == null ||
                            !transferAmount ||
                            Number(normalizeAmountInput(transferAmount)) <= 0 ||
                            Number(normalizeAmountInput(transferAmount)) > (balance?.balance ?? 0)
                          }
                        >
                          {transferLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {t('dashboard.finance.transfer')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Settings Tab */}
            <SettingsComponent />
          </Tabs>
        </div>
      </section>

      <Footer />
    </div>
  );
}
