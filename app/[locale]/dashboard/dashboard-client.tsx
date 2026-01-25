"use client";

import {useState, useEffect, useCallback} from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/navigation';
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
  User,
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
  Shield,
  Globe,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Edit,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { ProjectRequestCard } from '@/components/project-request-card';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { Link } from '@/lib/navigation';
import {SiStripe} from "react-icons/si";
import {Can} from "@/components/Can";

export default function DashboardClient() {
  const { user, loading } = useAuth();
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState('overview');
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectsError, setProjectsError] = useState('');
  const isProvider = user?.roles?.some((r: any) => r.slug?.toLowerCase() === 'provider');
  const isClient = user?.roles?.some((r: any) => r.slug?.toLowerCase() === 'client');

  // Filters and pagination for projects
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const projectsPerPage = 6;
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

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
        switch (sortBy) {
          case 'title':
            aValue = a.title.toLowerCase();
            bValue = b.title.toLowerCase();
            break;
          case 'budget':
            aValue = isProvider ? a.budget : a.budget;
            bValue = isProvider ? b.budget : b.budget;
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
      setTotalPages(Math.ceil(total / projectsPerPage));

      // Apply pagination
      const startIndex = (currentPage - 1) * projectsPerPage;
      const paginatedProjects = filteredProjects.slice(startIndex, startIndex + projectsPerPage);

      setProjects(paginatedProjects);
    } catch (error: any) {
      setProjectsError(t('dashboard.errors.projects_load_failed', { message: error.message }));
    } finally {
      setLoadingProjects(false);
    }
  }, [currentPage, isProvider, searchTerm, sortBy, sortOrder, statusFilter, t]);

  useEffect(() => {
    if (user && activeTab === 'projects') {
      loadProjects();
    }
  }, [user, activeTab, searchTerm, statusFilter, sortBy, sortOrder, currentPage, loadProjects]);

  const handleProjectResponse = async (projectId: string, response: 'ACCEPTED' | 'REJECTED' | 'NEW_PROPOSE', proposedBudget?: number) => {
    try {
      await apiClient.respondToProjectRequest(projectId, { response, proposedBudget });
      let message = '';
      if (response === 'ACCEPTED') message = t('dashboard.notifications.project_accepted');
      else if (response === 'REJECTED') message = t('dashboard.notifications.project_rejected');
      else if (response === 'NEW_PROPOSE') message = t('dashboard.notifications.budget_proposed');
      toast.success(message);
      loadProjects();
    } catch (error: any) {
      toast.error(t('dashboard.errors.generic', { message: error.message }));
    }
  };

  const getStripeOnboardingUrl = async () => {
    try {
      if (!user) return;
      const response = await apiClient.handleStripeOnboarding(user.email);

      if (!response || !response.url) {
        console.error('No URL returned from Stripe onboarding');
        return null;
      }

      window.location.href = response.url;

    } catch (error) {
      console.error('Error fetching Stripe onboarding URL:', error);
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

  if (loading) {
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
    return null;
  }

  // Mock data for overview stats
  const getOverviewStats = () => {
      if (isProvider) {
      return [
        { title: t('dashboard.overview.provider.active_projects.title'), value: t('dashboard.overview.provider.active_projects.value'), change: t('dashboard.overview.provider.active_projects.change'), icon: Briefcase, color: 'text-blue-600' },
        { title: t('dashboard.overview.provider.monthly_revenue.title'), value: t('dashboard.overview.provider.monthly_revenue.value'), change: t('dashboard.overview.provider.monthly_revenue.change'), icon: DollarSign, color: 'text-green-600' },
        { title: t('dashboard.overview.provider.average_rating.title'), value: t('dashboard.overview.provider.average_rating.value'), change: t('dashboard.overview.provider.average_rating.change'), icon: Star, color: 'text-yellow-600' },
        { title: t('dashboard.overview.provider.new_requests.title'), value: t('dashboard.overview.provider.new_requests.value'), change: t('dashboard.overview.provider.new_requests.change'), icon: Bell, color: 'text-purple-600' }
      ];
    } else {
      return [
        { title: t('dashboard.overview.client.projects_posted.title'), value: t('dashboard.overview.client.projects_posted.value'), change: t('dashboard.overview.client.projects_posted.change'), icon: FileText, color: 'text-blue-600' },
        { title: t('dashboard.overview.client.budget_spent.title'), value: t('dashboard.overview.client.budget_spent.value'), change: t('dashboard.overview.client.budget_spent.change'), icon: DollarSign, color: 'text-green-600' },
        { title: t('dashboard.overview.client.projects_completed.title'), value: t('dashboard.overview.client.projects_completed.value'), change: t('dashboard.overview.client.projects_completed.change'), icon: CheckCircle, color: 'text-green-600' },
        { title: t('dashboard.overview.client.active_providers.title'), value: t('dashboard.overview.client.active_providers.value'), change: t('dashboard.overview.client.active_providers.change'), icon: Users, color: 'text-purple-600' }
      ];
    }
  };

  const overviewStats = getOverviewStats();

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
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="text-lg bg-slate-100 text-[#0B1C2D] dark:bg-[#111B2D] dark:text-[#E6EDF3]">
                    {user.firstName[0]}{user.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">{user.firstName} {user.lastName}</div>
                  <Badge className={isProvider ? 'bg-emerald-50 text-[#0B1C2D] border border-emerald-100' : 'bg-[#E8F7F1] text-[#0B1C2D] border border-[#CFF1E3]'}>
                    {isProvider ? t('dashboard.hero.role.provider') : t('dashboard.hero.role.client')}
                  </Badge>
                  <Button
                      variant="outline"
                      size="sm"
                      className="ms-2 bg-stripe !text-white hover:bg-black hover:!text-white border-transparent"
                      onClick={getStripeOnboardingUrl}
                  >
                    <SiStripe className="w-4 h-4 mr-2 text-current" />
                    {user.stripe_account_id ? t('dashboard.hero.stripe.manage') : t('dashboard.hero.stripe.connect')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pb-20">
          <div className="max-w-6xl mx-auto">
            {/* Dashboard Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-5 rounded-2xl bg-slate-100/80 p-1 dark:bg-[#0B1220]">
                <TabsTrigger value="overview" className="flex items-center rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#0B1C2D] data-[state=active]:shadow-sm dark:data-[state=active]:bg-[#111B2D] dark:data-[state=active]:text-[#E6EDF3]">
                  <BarChart3 className="hidden sm:block w-4 h-4 pe-1" />
                  <span>{t('dashboard.tabs.overview')}</span>
              </TabsTrigger>
                {isClient ? (
                    <div
                        className=" rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#0B1C2D] data-[state=active]:shadow-sm dark:data-[state=active]:bg-[#111B2D] dark:data-[state=active]:text-[#E6EDF3]"
                    >
                      <Link
                          className="flex items-center justify-center"
                          href="/client/project-requests">
                        <Briefcase className="hidden sm:block w-4 h-4 pe-1" />
                        <span>{t('dashboard.tabs.projects')}</span>
                      </Link>
                    </div>
                ) : (
                    <TabsTrigger
                        value="projects"
                        className="flex items-center rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#0B1C2D] data-[state=active]:shadow-sm dark:data-[state=active]:bg-[#111B2D] dark:data-[state=active]:text-[#E6EDF3]"
                    >


                      <>
                        <Briefcase className="hidden sm:block w-4 h-4 pe-1" />
                        <span>{t('dashboard.tabs.projects')}</span>
                      </>

                    </TabsTrigger>
                )}

                <TabsTrigger value="services" className="flex items-center rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#0B1C2D] data-[state=active]:shadow-sm dark:data-[state=active]:bg-[#111B2D] dark:data-[state=active]:text-[#E6EDF3]">
                <Target className="hidden sm:block w-4 h-4 pe-1" />
                <span>{t('dashboard.tabs.services')}</span>
              </TabsTrigger>
                <TabsTrigger value="messages" className="flex items-center rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#0B1C2D] data-[state=active]:shadow-sm dark:data-[state=active]:bg-[#111B2D] dark:data-[state=active]:text-[#E6EDF3]">
                <MessageSquare className="hidden sm:block w-4 h-4 pe-1" />
                <span>{t('dashboard.tabs.messages')}</span>
              </TabsTrigger>
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
                              <span>{t('dashboard.filters.status_label', { status: (isProvider ? getProviderStatusOptions() : getClientStatusOptions()).find(o => o.value === statusFilter)?.label })}</span>
                              <button onClick={() => setStatusFilter('all')} className="ml-1 hover:text-red-500">
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                        )}

                        {(sortBy !== 'newest' || sortOrder !== 'desc') && (
                            <Badge variant="secondary" className="flex items-center space-x-1">
                              <span>{t('dashboard.filters.sort_label', {
                                label: getSortOptions().find(o => o.value === sortBy)?.label,
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
                        <Can {...({ superuser: true } || { roles: ['client'] })}>
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
                        />
                    ))}

                    {renderPagination()}
                  </div>
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

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <div className="grid xs:grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profile Settings */}
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="w-5 h-5" />
                      <span>{t('dashboard.settings.profile.title')}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>
                          {user.firstName[0]}{user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">{user.firstName} {user.lastName}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={isProvider ? '/provider/profile' : '/settings/profile'}>
                          <Edit className="w-4 h-4 mr-1" />
                          {t('dashboard.actions.edit')}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Notification Settings */}
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Bell className="w-5 h-5" />
                      <span>{t('dashboard.settings.notifications.title')}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{t('dashboard.settings.notifications.email.title')}</div>
                          <div className="text-sm text-muted-foreground">
                            {t('dashboard.settings.notifications.email.description')}
                          </div>
                        </div>
                        <input type="checkbox" defaultChecked className="rounded" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{t('dashboard.settings.notifications.push.title')}</div>
                          <div className="text-sm text-muted-foreground">
                            {t('dashboard.settings.notifications.push.description')}
                          </div>
                        </div>
                        <input type="checkbox" defaultChecked className="rounded" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Account Settings */}
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="w-5 h-5" />
                      <span>{t('dashboard.settings.security.title')}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="w-4 h-4 mr-2" />
                      {t('dashboard.settings.security.change_password')}
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Shield className="w-4 h-4 mr-2" />
                      {t('dashboard.settings.security.two_factor')}
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Globe className="w-4 h-4 mr-2" />
                      {t('dashboard.settings.security.language_preferences')}
                    </Button>
                  </CardContent>
                </Card>

                {/* Billing (for clients) */}
                {isClient && (
                    <Card className="glass-card">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <DollarSign className="w-5 h-5" />
                          <span>{t('dashboard.settings.billing.title')}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Button variant="outline" className="w-full justify-start">
                          <DollarSign className="w-4 h-4 mr-2" />
                          {t('dashboard.settings.billing.payment_methods')}
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <FileText className="w-4 h-4 mr-2" />
                          {t('dashboard.settings.billing.invoices')}
                        </Button>
                      </CardContent>
                    </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
        </section>

        <Footer />
      </div>
  );
}
