"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { usePathname, useRouter } from '@/lib/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  Lock,
  CheckCircle2,
  Layers,
  ArrowRight,
  Briefcase,
  DollarSign,
  Star,
  CheckCircle,
  AlertCircle,
  Plus,
  Search,
  Filter,
  ArrowUp,
  ArrowDown,
  MessageSquare,
  Target,
  Wallet,
  Activity,
  Users,
  FileText,
  Settings,
  Bell,
  LayoutDashboard,
  History,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  Moon,
  Sun,
  MoreHorizontal
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { ProjectRequestCard } from '@/components/project-request-card';
import { apiClient, DashboardStatsResponse, RecentActivityQuick } from '@/lib/api';
import { ensureEcho } from '@/lib/echo';
import { toast } from 'sonner';
import { Link } from '@/lib/navigation';
import { sanitizeExternalRedirectUrl } from '@/lib/navigation-security';
import ClientProjectRequests from '../client/project-requests/ClientProjectRequests';
import SettingsComponent from "@/components/dashboard/SettingsComponent";
import { NotificationBell } from '@/components/notification-bell';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { CurrencySwitcher } from '@/components/CurrencySwitcher';
import { ChatButton } from '@/components/chat/chat-button';
import ChatLauncher from '@/components/chat/chat-launcher';

const BASE_TABS = ['overview', 'projects', 'services', 'messages', 'settings'];
const RAPYD_REDIRECT_ALLOWED_HOSTS = (
  process.env.NEXT_PUBLIC_RAPYD_REDIRECT_ALLOWED_HOSTS || 'rapyd.net'
)
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const theme = {
  trustAccent: '#1BC47D',
  success: '#21D19F',
  warning: '#F5A623',
  error: '#E5484D',
};

type DashboardThemeVars = {
  '--bg-main': string;
  '--bg-card': string;
  '--text-main': string;
  '--text-muted': string;
  '--border-color': string;
  '--header-bg': string;
  '--input-bg': string;
  '--stat-bg': string;
};

const themes: Record<'light' | 'dark', DashboardThemeVars> = {
  light: {
    '--bg-main': '#F5F7FA',
    '--bg-card': '#FFFFFF',
    '--text-main': '#0B1C2D',
    '--text-muted': '#64748B',
    '--border-color': 'rgba(226, 232, 240, 0.8)',
    '--header-bg': 'rgba(255, 255, 255, 0.8)',
    '--input-bg': '#F5F7FA',
    '--stat-bg': '#F5F7FA',
  },
  dark: {
    '--bg-main': '#06111A',
    '--bg-card': '#0D1F30',
    '--text-main': '#F8FAFC',
    '--text-muted': '#94A3B8',
    '--border-color': 'rgba(255, 255, 255, 0.08)',
    '--header-bg': 'rgba(13, 31, 48, 0.8)',
    '--input-bg': '#06111A',
    '--stat-bg': '#152A40',
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

const ACTIVITY_ACTION_LABELS: Record<string, string> = {
  'project.created': 'Project created',
  'project.provider.invited': 'Provider invited',
  'project.provider.response.submitted': 'Provider response',
  'project.client.response.submitted': 'Client response',
  'project.budget.updated': 'Budget updated',
  'project.budget.accepted_by_provider': 'Budget accepted',
  'project.budget.rejected_by_provider': 'Budget rejected',
  'project.budget.proposed_by_provider': 'Budget proposed',
  'project.budget.accepted_by_client': 'Budget accepted',
  'project.budget.rejected_by_client': 'Budget rejected',
  'project.status.accepted': 'Project accepted',
  'project.milestone.status.updated': 'Milestone updated',
  'project.milestones.reassigned': 'Milestones reassigned',
  'project.deliverable.submitted': 'Deliverable submitted',
  'project.deliverable.rejected': 'Deliverable rejected',
  'project.payment.escrow.blocked': 'Escrow funded',
  'project.payment.funds.released': 'Funds released',
};

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
  const [isDarkMode, setIsDarkMode] = useState(false);
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
  const [rapydConnecting, setRapydConnecting] = useState(false);
  const hasRapydConnected = Boolean(user?.rapyd_wallet_id);

  useEffect(() => {
    document.title = 'Trustora | Escrow Dashboard';
  }, []);

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
      let response: any;
      if (isProvider) {
        response = await apiClient.getProviderProjectRequests();
      } else {
        response = await apiClient.getClientProjectRequests();
      }
      const projectsCollection = Array.isArray(response)
        ? response
        : Array.isArray(response?.projects)
          ? response.projects
          : Array.isArray(response?.data)
            ? response.data
            : [];
      let filteredProjects = projectsCollection;

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
  }, [currentPage, isProvider, searchTerm, sortBy, sortOrder, statusFilter, t]);

  const loadOverviewProjects = useCallback(async () => {
    if (!user) return;
    setLoadingOverviewProjects(true);
    setOverviewProjectsError('');
    try {
      let response: any;
      if (isProvider) {
        response = await apiClient.getProviderProjectRequests();
      } else {
        response = await apiClient.getClientProjectRequests();
      }

      const projectsCollection = Array.isArray(response)
        ? response
        : Array.isArray(response?.projects)
          ? response.projects
          : Array.isArray(response?.data)
            ? response.data
            : [];

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
  }, [isProvider, t, user]);

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
      const isRapydEvent = declaredType.startsWith('rapyd.');
      const isFallbackProjectEvent = !declaredType && Boolean(projectId);
      const shouldReloadProjectsForBothRoles =
        isProjectEvent ||
        isProjectStatusUpdatedEvent ||
        isProviderFinishedNotification ||
        isBudgetAcceptedByProvider ||
        isFallbackProjectEvent ||
        (isRapydEvent && Boolean(projectId));

      if (isRapydEvent && isProvider) {
        void fetchBalance();
      }

      const shouldRefetchProjects = shouldReloadProjectsForBothRoles;

      const shouldRefreshOverview =
        activeTab === 'overview' &&
        (isProjectEvent || isBudgetAcceptedByProvider || isRapydEvent);

      if (shouldRefetchProjects) {
        void loadProjects();
      }

      if (shouldRefreshOverview) {
        void loadOverviewProjects();
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
  }, [user?.id, isProvider, activeTab, loadProjects, fetchBalance, loadOverviewProjects, loadRecentActivities, loadStats]);

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
      await loadProjects();
      await loadOverviewProjects();
      await loadRecentActivities();
    } catch (error: any) {
      toast.error(t('dashboard.errors.generic', { message: error.message }));
    }
  }, [loadOverviewProjects, loadProjects, loadRecentActivities, locale, t]);



  const getRapydOnboardingUrl = async () => {
    setRapydConnecting(true);
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

      const onboardingUrl =
        (typeof response?.url === 'string' && response.url.trim()
          ? response.url
          : typeof response?.data?.url === 'string' && response.data.url.trim()
            ? response.data.url
            : null);

      if (onboardingUrl && typeof window !== 'undefined') {
        const safeOnboardingUrl = sanitizeExternalRedirectUrl(
          onboardingUrl,
          RAPYD_REDIRECT_ALLOWED_HOSTS
        );

        if (safeOnboardingUrl) {
          window.location.href = safeOnboardingUrl;
          return;
        }

        if (process.env.NODE_ENV !== 'production') {
          console.warn('Blocked unsafe Rapyd onboarding redirect URL', onboardingUrl);
        }
      }

      await fetchBalance();
    } catch (error) {
      console.error('Error fetching Rapyd onboarding URL:', error);
      return null;
    } finally {
      setRapydConnecting(false);
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
  const currentTheme = isDarkMode ? themes.dark : themes.light;
  const sidebarItemClass = (tab: string) => `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm transition-colors w-full text-left ${
    activeTab === tab
      ? 'bg-[#1BC47D]/10 text-[#1BC47D] border border-[#1BC47D]/20'
      : 'text-slate-400 hover:text-white hover:bg-white/5'
  }`;
  const projectsTitle = isProvider ? t('dashboard.projects.title.provider') : t('dashboard.projects.title.client');
  const servicesTitle = isProvider ? t('dashboard.services.title.provider') : t('dashboard.services.title.client');
  const activityItems = recentActivities.slice(0, 3);
  const activityLabels = [
    t('dashboard.filters.status.accepted'),
    t('dashboard.filters.status.in_progress'),
    t('dashboard.filters.status.completed'),
  ];
  const emptyActivityText = locale === 'ro' ? 'Nu există activitate recentă.' : 'No recent activity.';
  const getActivityBadgeLabel = (activity: RecentActivityQuick, fallbackLabel: string) => {
    const actionKey = activity.action ?? activity.type;
    if (!actionKey) return fallbackLabel;
    const mappedLabel = ACTIVITY_ACTION_LABELS[actionKey];
    if (mappedLabel) return mappedLabel;
    return actionKey.replace(/[._]/g, ' ');
  };
  const getActivityMeta = (activity: RecentActivityQuick) => {
    const actorName = activity.actor?.name?.trim();
    const actorRole = activity.actor?.role?.trim();
    if (actorName && actorRole) return `${actorName} • ${actorRole}`;
    if (actorName) return actorName;
    if (actorRole) return actorRole;
    return activity.time_ago;
  };
  const walletAvailableByCurrency = Array.from(
    wallets.reduce((accumulator, wallet) => {
      const currency = wallet.currency;
      if (!currency) return accumulator;
      const current = accumulator.get(currency) ?? 0;
      accumulator.set(currency, current + (wallet.balance ?? 0));
      return accumulator;
    }, new Map<string, number>())
  ).map(([currency, amount]) => ({ currency, amount }));
  const hasManyWalletCurrencies = walletAvailableByCurrency.length > 2;
  const userInitials = `${(user.firstName?.[0] ?? '')}${(user.lastName?.[0] ?? '')}`.toUpperCase() || 'AC';
  const userDisplayName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email;
  const userAvatarSrc = user.avatar ?? user.profile_photo_url ?? user.avatar_url ?? undefined;
  // const hasOnHoldBalance = balance?.on_hold_balance !== null && balance?.on_hold_balance !== undefined;
  // const hasReceivedBalance = balance?.received_balance !== null && balance?.received_balance !== undefined;

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className="flex h-screen w-full overflow-hidden font-sans transition-colors duration-300"
      style={{ ...(currentTheme as React.CSSProperties), backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' } as React.CSSProperties}
    >
      <aside className="w-64 bg-[#0B1C2D] border-r border-[#152B42] flex flex-col justify-between hidden md:flex shrink-0 z-20">
        <div>
          <div className="h-20 flex items-center px-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <img src="/trustora-logo2.png" alt="Trustora Logo" className="w-8 h-8 object-contain" />
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight text-white leading-none">TRUSTORA</span>
                <span className="text-[8px] uppercase font-bold tracking-[0.2em] text-[#1BC47D] mt-0.5">{t('dashboard.hero.badge')}</span>
              </div>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3 mt-4">{t('dashboard.quick_actions.title')}</p>

            <button type="button" onClick={() => handleTabChange('overview')} className={sidebarItemClass('overview')}>
              <LayoutDashboard size={18} />
              {t('dashboard.tabs.overview')}
            </button>
            {isClient && !isProvider ? (
              <button
                type="button"
                onClick={() => router.push('/projects/new')}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 font-medium text-sm transition-colors w-full text-left"
              >
                <Plus size={18} />
                {t('dashboard.projects.new_project')}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => handleTabChange(isProvider ? 'finance' : 'projects')}
              className={sidebarItemClass(isProvider ? 'finance' : 'projects')}
            >
              <Lock size={18} />
              {isProvider ? t('dashboard.tabs.finance') : t('dashboard.tabs.projects')}
            </button>
            <button
              type="button"
              onClick={() => handleTabChange(isProvider ? 'projects' : 'services')}
              className={sidebarItemClass(isProvider ? 'projects' : 'services')}
            >
              <Layers size={18} />
              {isProvider ? t('dashboard.tabs.projects') : t('dashboard.tabs.services')}
            </button>
            <button type="button" onClick={() => handleTabChange('messages')} className={sidebarItemClass('messages')}>
              <History size={18} />
              {t('dashboard.tabs.messages')}
            </button>

            {isProvider && (
              <>
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3 mt-8">{servicesTitle}</p>
                <button type="button" onClick={() => handleTabChange('services')} className={sidebarItemClass('services')}>
                  <Users size={18} />
                  {t('dashboard.tabs.services')}
                </button>
              </>
            )}
          </nav>
        </div>

        <div className="p-4 border-t border-white/5">
          <button type="button" onClick={() => handleTabChange('settings')} className={`${sidebarItemClass('settings')} mb-2`}>
            <Settings size={18} />
            {t('dashboard.tabs.settings')}
          </button>
          {isProvider ? (
            <div className="mt-3 px-3 py-3 bg-[#152B42] rounded-xl border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-300">
                  {t('dashboard.tabs.finance')}
                </p>
              </div>

              {!hasRapydConnected ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-400">{t('dashboard.hero.balance.error')}</p>
                  <button
                    type="button"
                    onClick={getRapydOnboardingUrl}
                    disabled={rapydConnecting}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#1BC47D] px-3 py-2 text-xs font-semibold text-[#06111A] transition-colors hover:bg-[#17b672] disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {rapydConnecting ? <Loader2 size={14} className="animate-spin" /> : null}
                    {t('dashboard.hero.rapyd.connect')}
                  </button>
                </div>
              ) : balanceLoading ? (
                <p className="text-xs text-slate-400">{t('dashboard.hero.balance.loading')}</p>
              ) : balanceError ? (
                <p className="text-xs text-red-300">{balanceError}</p>
              ) : walletAvailableByCurrency.length === 0 ? (
                <p className="text-xs text-slate-400">{t('dashboard.hero.balance.error')}</p>
              ) : (
                <div className={`space-y-2 ${hasManyWalletCurrencies ? 'max-h-40 overflow-y-auto pr-1' : ''}`}>
                  {walletAvailableByCurrency.map(({ currency, amount }) => (
                    <div key={currency} className="rounded-lg border border-white/5 bg-[#0F2236] px-2.5 py-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1BC47D] mb-1">{currency}</p>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">{t('dashboard.hero.balance.available')}</span>
                        <span className="font-semibold text-white">{formatBalanceAmount(amount, currency)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
          <div className="flex items-center gap-3 px-3 py-2 mt-2 bg-[#152B42] rounded-xl border border-white/5">
            <div className="relative">
              <Avatar className="w-8 h-8 border border-white/10">
                <AvatarImage src={userAvatarSrc} alt={userDisplayName} />
                <AvatarFallback className="bg-gradient-to-tr from-[#1BC47D] to-[#0B1C2D] text-white text-xs font-bold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#1BC47D] rounded-full border-2 border-[#152B42]" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{userDisplayName}</p>
              <p className="text-[10px] text-[#1BC47D] uppercase font-bold flex items-center gap-1">
                <CheckCircle2 size={10} /> {isProvider ? t('dashboard.hero.role.provider') : t('dashboard.hero.role.client')}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden relative transition-colors duration-300">
        <header
          className="h-20 backdrop-blur-md border-b flex items-center justify-between px-8 z-10 shrink-0 transition-colors duration-300"
          style={{ backgroundColor: 'var(--header-bg)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center gap-4 w-96">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder={t('dashboard.filters.search_placeholder')}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none transition-colors border"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-main)'
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div
                className="rounded-lg border"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--input-bg)' }}
              >
                <LocaleSwitcher className="h-9 px-2 rounded-lg" />
              </div>
              <div
                className="rounded-lg border"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--input-bg)' }}
              >
                <CurrencySwitcher className="h-9 px-2 rounded-lg text-sm font-semibold" />
              </div>
            </div>
            <button
              onClick={() => setIsDarkMode((prev) => !prev)}
              className="relative transition-colors hover:text-[var(--text-main)]"
              style={{ color: 'var(--text-muted)' }}
              title="Toggle Light/Dark Mode"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="relative">
              <NotificationBell />
            </div>
            <div className="relative">
              <ChatButton />
            </div>

            <div className="w-px h-6 transition-colors duration-300" style={{ backgroundColor: 'var(--border-color)' }} />

            <button
              type="button"
              onClick={() => {
                if (isProvider) {
                  handleTabChange('finance');
                } else {
                  router.push('/projects/new');
                }
              }}
              className="bg-[#1BC47D] hover:bg-[#18A96B] text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow-md shadow-[#1BC47D]/20 flex items-center gap-2"
            >
              <Wallet size={16} /> {isProvider ? t('dashboard.tabs.finance') : t('dashboard.projects.new_project')}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 relative">
          <div className="absolute inset-0 pointer-events-none opacity-[0.02] z-0" style={{ backgroundImage: 'radial-gradient(var(--text-main) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

          <motion.div
            className="max-w-6xl mx-auto relative z-10"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={fadeUp} className="mb-8 md:hidden">
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => handleTabChange('overview')} className="px-3 py-2 rounded-lg text-xs font-semibold border" style={{ borderColor: 'var(--border-color)', backgroundColor: activeTab === 'overview' ? `${theme.trustAccent}20` : 'var(--bg-card)', color: activeTab === 'overview' ? theme.trustAccent : 'var(--text-main)' }}>{t('dashboard.tabs.overview')}</button>
                {isClient && !isProvider ? (
                  <button
                    type="button"
                    onClick={() => router.push('/projects/new')}
                    className="px-3 py-2 rounded-lg text-xs font-semibold border"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}
                  >
                    {t('dashboard.projects.new_project')}
                  </button>
                ) : null}
                <button type="button" onClick={() => handleTabChange('projects')} className="px-3 py-2 rounded-lg text-xs font-semibold border" style={{ borderColor: 'var(--border-color)', backgroundColor: activeTab === 'projects' ? `${theme.trustAccent}20` : 'var(--bg-card)', color: activeTab === 'projects' ? theme.trustAccent : 'var(--text-main)' }}>{t('dashboard.tabs.projects')}</button>
                <button type="button" onClick={() => handleTabChange('services')} className="px-3 py-2 rounded-lg text-xs font-semibold border" style={{ borderColor: 'var(--border-color)', backgroundColor: activeTab === 'services' ? `${theme.trustAccent}20` : 'var(--bg-card)', color: activeTab === 'services' ? theme.trustAccent : 'var(--text-main)' }}>{t('dashboard.tabs.services')}</button>
                <button type="button" onClick={() => handleTabChange('messages')} className="px-3 py-2 rounded-lg text-xs font-semibold border" style={{ borderColor: 'var(--border-color)', backgroundColor: activeTab === 'messages' ? `${theme.trustAccent}20` : 'var(--bg-card)', color: activeTab === 'messages' ? theme.trustAccent : 'var(--text-main)' }}>{t('dashboard.tabs.messages')}</button>
                {isProvider && <button type="button" onClick={() => handleTabChange('finance')} className="px-3 py-2 rounded-lg text-xs font-semibold border" style={{ borderColor: 'var(--border-color)', backgroundColor: activeTab === 'finance' ? `${theme.trustAccent}20` : 'var(--bg-card)', color: activeTab === 'finance' ? theme.trustAccent : 'var(--text-main)' }}>{t('dashboard.tabs.finance')}</button>}
                <button type="button" onClick={() => handleTabChange('settings')} className="px-3 py-2 rounded-lg text-xs font-semibold border" style={{ borderColor: 'var(--border-color)', backgroundColor: activeTab === 'settings' ? `${theme.trustAccent}20` : 'var(--bg-card)', color: activeTab === 'settings' ? theme.trustAccent : 'var(--text-main)' }}>{t('dashboard.tabs.settings')}</button>
              </div>
            </motion.div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6 m-0">
              <motion.div variants={fadeUp} className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>{t('dashboard.tabs.overview')}</h1>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                  {isProvider ? t('dashboard.hero.subtitle.provider') : t('dashboard.hero.subtitle.client')}
                </p>
              </motion.div>

              <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {overviewStats.slice(0, 3).map((stat, index) => {
                  const Icon = index === 0 ? Lock : index === 1 ? AlertCircle : CheckCircle2;
                  const leftColor = index === 0 ? theme.trustAccent : index === 1 ? theme.warning : '#64748B';
                  return (
                    <div
                      key={index}
                      className="p-6 rounded-2xl border shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] relative overflow-hidden transition-colors duration-300"
                      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                    >
                      <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: leftColor }} />
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{stat.title}</p>
                          <p className="text-3xl font-bold tracking-tight" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-main)' }}>
                            {stat.value}
                          </p>
                        </div>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${leftColor}20`, color: leftColor }}>
                          <Icon size={20} />
                        </div>
                      </div>
                      <div
                        className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors duration-300"
                        style={{ backgroundColor: 'var(--stat-bg)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                      >
                        <Shield size={14} style={{ color: theme.trustAccent }} /> {stat.change}
                      </div>
                    </div>
                  );
                })}
              </motion.div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <motion.div variants={fadeUp} className="xl:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
                      <Layers size={18} style={{ color: theme.trustAccent }} /> {projectsTitle}
                    </h2>
                    <button
                      type="button"
                      onClick={() => handleTabChange('projects')}
                      className="text-sm font-semibold transition-colors flex items-center gap-1"
                      style={{ color: theme.trustAccent }}
                    >
                      {t('dashboard.tabs.projects')} <ArrowRight size={14} />
                    </button>
                  </div>

                  <div
                    className="border rounded-2xl shadow-sm overflow-hidden transition-colors duration-300"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                  >
                    {loadingOverviewProjects ? (
                      <div className="flex items-center justify-center py-14">
                        <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--text-muted)' }} />
                      </div>
                    ) : overviewProjectsError ? (
                      <div className="p-4">
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{overviewProjectsError}</AlertDescription>
                        </Alert>
                      </div>
                    ) : overviewProjects.length === 0 ? (
                      <div className="p-10 text-center">
                        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-main)' }}>
                          {isProvider ? t('dashboard.projects.empty.title.provider') : t('dashboard.projects.empty.title.client')}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {isProvider ? t('dashboard.projects.empty.description.provider') : t('dashboard.projects.empty.description.client')}
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 md:p-6 space-y-4">
                        {overviewProjects.map((project) => (
                          <ProjectRequestCard
                            key={project.id}
                            project={project}
                            onResponse={handleProjectResponse}
                            onRefresh={loadOverviewProjects}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>

                <motion.div variants={fadeUp} className="xl:col-span-1 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
                      <Activity size={18} style={{ color: theme.trustAccent }} /> {t('dashboard.activity.title')}
                    </h2>
                    <button className="transition-colors hover:text-[#1BC47D]" style={{ color: 'var(--text-muted)' }}><MoreHorizontal size={18} /></button>
                  </div>

                  <div
                    className="border rounded-2xl shadow-sm p-6 transition-colors duration-300"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                  >
                    <div className="space-y-4">
                      {loadingRecentActivities ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--text-muted)' }} />
                        </div>
                      ) : activityItems.length === 0 ? (
                        <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
                          {emptyActivityText}
                        </p>
                      ) : (
                        activityItems.map((item, index) => {
                          const labelColor = index === 0 ? theme.trustAccent : 'var(--text-muted)';
                          return (
                            <div key={`${item.title}-${index}`} className="p-3 rounded-xl border" style={{ backgroundColor: 'var(--stat-bg)', borderColor: 'var(--border-color)' }}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold uppercase" style={{ color: labelColor }}>
                                  {getActivityBadgeLabel(item, activityLabels[index] ?? t('dashboard.activity.title'))}
                                </span>
                                <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>{item.time_ago}</span>
                              </div>
                              <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-main)' }}>{item.title}</p>
                              <p className="text-xs font-semibold" style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}>
                                {getActivityMeta(item)}
                              </p>
                            </div>
                          );
                        })
                      )}
                    </div>
                    {recentActivitiesError ? (
                      <p className="mt-3 text-xs" style={{ color: '#F5A623' }}>
                        {recentActivitiesError}
                      </p>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => handleTabChange('messages')}
                      className="w-full mt-6 py-2.5 border rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 hover:opacity-80"
                      style={{ backgroundColor: 'var(--stat-bg)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
                    >
                      {t('dashboard.tabs.messages')} <ArrowRight size={14} />
                    </button>
                  </div>
                </motion.div>
              </div>
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

                    {isClient && !isProvider && (
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
                        {isClient && !isProvider && (
                          <Button asChild className="btn-primary">
                            <Link href="/projects/new">
                              <Plus className="w-4 h-4 mr-2" />
                              {t('dashboard.projects.empty.cta')}
                            </Link>
                          </Button>
                        )}
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
                      {hasRapydConnected
                        ? `${t('dashboard.finance.wallet_balance')}: ${formatBalanceAmount(balance?.balance, balance?.currency)}`
                        : t('dashboard.hero.rapyd.connect')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!hasRapydConnected ? (
                      <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm dark:border-slate-800/70 dark:bg-[#0B1220]/60">
                        <p className="text-sm text-slate-500 dark:text-[#A3ADC2] mb-4">
                          {t('dashboard.hero.balance.error')}
                        </p>
                        <Button
                          type="button"
                          className="bg-[#1BC47D] hover:bg-[#159c63] text-[#06111A]"
                          onClick={getRapydOnboardingUrl}
                          disabled={rapydConnecting}
                        >
                          {rapydConnecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          {t('dashboard.hero.rapyd.connect')}
                        </Button>
                      </div>
                    ) : (
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
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Settings Tab */}
            <SettingsComponent />
          </motion.div>
        </div>
      </main>
      {user ? <ChatLauncher /> : null}
    </Tabs>
  );
}
