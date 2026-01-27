"use client";

import { useEffect, useState, useMemo } from 'react';
import { Link } from '@/lib/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  Shield,
  Settings,
  BarChart3,
  Plus,
  FolderPlus,
  UserPlus,
  UserCheck,
  ArrowRight,
  Bell,
  BookOpen,
  IdCardLanyard,
  TrendingDown,
  History
} from 'lucide-react';
import CallIcon from '@mui/icons-material/Call';
import apiClient from '@/lib/api';
import { Can } from '@/components/Can';
import ActivityFeed from '@/components/ActivityFeed';

interface AdminStats {
  totalUsers: number;
  currentMonthUsers: number;
  currentMonthVsLastMonthUsers: number;
  activeServices: number;
  currentMonthServices: number;
  currentMonthVsLastMonthServices: number;
  totalProjects: number;
  currentMonthProjects: number;
  totalPendingProjects: number;
  currentMonthVsLastMonthProjects: number;
  totalRevenue: number;
  currentMonthRevenue: number;
  currentMonthVsLastMonthRevenue: number;
  pendingUsers: number;
  pendingServices: number;
  pendingCalls: number;
  totalScheduleCalls: number;
}

export default function AdminDashboard() {
  const [statsData, setStatsData] = useState<AdminStats | null>(null);
  const t = useTranslations();
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.getAdminStats();
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        setStatsData(response);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    fetchStats();
  }, []);

  const dashboardTitle = t('admin.dashboard.title');
  const dashboardSubtitle = t('admin.dashboard.subtitle');

  const statsUsersTitle = t('admin.dashboard.stats.users');
  const statsServicesTitle = t('admin.dashboard.stats.services');
  const statsRevenueTitle = t('admin.dashboard.stats.revenue');
  const statsProjectsTitle = t('admin.dashboard.stats.projects');

  const quickActionsTitle = t('admin.dashboard.quick_actions.title');
  const quickActionsDescription = t('admin.dashboard.quick_actions.description');
  const addUserTitle = t('admin.dashboard.quick_actions.add_user.title');
  const addUserDescription = t('admin.dashboard.quick_actions.add_user.description');
  const addCategoryTitle = t('admin.dashboard.quick_actions.add_category.title');
  const addCategoryDescription = t('admin.dashboard.quick_actions.add_category.description');
  const addTestTitle = t('admin.dashboard.quick_actions.add_test.title');
  const addTestDescription = t('admin.dashboard.quick_actions.add_test.description');
  const viewReportsTitle = t('admin.dashboard.quick_actions.view_reports.title');
  const viewReportsDescription = t('admin.dashboard.quick_actions.view_reports.description');

  const sectionsTitle = t('admin.dashboard.sections.title');
  const sectionsDescription = t('admin.dashboard.sections.description');
  const usersSectionTitle = t('admin.dashboard.sections.users.title');
  const usersSectionDescription = t('admin.dashboard.sections.users.description');
  const servicesSectionTitle = t('admin.dashboard.sections.services.title');
  const servicesSectionDescription = t('admin.dashboard.sections.services.description');
  const categoriesSectionTitle = t('admin.dashboard.sections.categories.title');
  const categoriesSectionDescription = t('admin.dashboard.sections.categories.description');
  const categoriesSectionStats = t('admin.dashboard.sections.categories.stats');
  const testsSectionTitle = t('admin.dashboard.sections.tests.title');
  const testsSectionDescription = t('admin.dashboard.sections.tests.description');
  const testsSectionStats = t('admin.dashboard.sections.tests.stats');
  const callsSectionTitle = t('admin.dashboard.sections.calls.title');
  const callsSectionDescription = t('admin.dashboard.sections.calls.description');
  const projectsSectionTitle = t('admin.dashboard.sections.projects.title');
  const projectsSectionDescription = t('admin.dashboard.sections.projects.description');
  const disputesSectionTitle = t('admin.dashboard.sections.disputes.title');
  const disputesSectionDescription = t('admin.dashboard.sections.disputes.description');
  const disputesSectionStats = t('admin.dashboard.sections.disputes.stats');
  const legalClausesSectionTitle = t('admin.dashboard.sections.legal_clauses.title');
  const legalClausesSectionDescription = t('admin.dashboard.sections.legal_clauses.description');
  const legalClausesSectionStats = t('admin.dashboard.sections.legal_clauses.stats');
  const newsletterSectionTitle = t('admin.dashboard.sections.newsletter.title');
  const newsletterSectionDescription = t('admin.dashboard.sections.newsletter.description');
  const newsletterSectionStats = t('admin.dashboard.sections.newsletter.stats');
  const auditLogsSectionTitle = "Audit Logs";
  const auditLogsSectionDescription = "View system changes";
  const activitiesSectionTitle = "Activities";
  const activitiesSectionDescription = "System event history";
  const rolesSectionTitle = t('admin.dashboard.sections.roles.title');
  const rolesSectionDescription = t('admin.dashboard.sections.roles.description');
  const rolesSectionStats = t('admin.dashboard.sections.roles.stats');
  const analyticsSectionTitle = t('admin.dashboard.sections.analytics.title');
  const analyticsSectionDescription = t('admin.dashboard.sections.analytics.description');
  const analyticsSectionStats = t('admin.dashboard.sections.analytics.stats');
  const earlyAccessSectionTitle = t('admin.dashboard.sections.early_access.title');
  const earlyAccessSectionDescription = t('admin.dashboard.sections.early_access.description');
  const earlyAccessSectionStats = t('admin.dashboard.sections.early_access.stats');


  const systemStatusTitle = t('admin.dashboard.system_status.title');
  const serverStatusLabel = t('admin.dashboard.system_status.server_status');
  const databaseLabel = t('admin.dashboard.system_status.database');
  const apiResponseLabel = t('admin.dashboard.system_status.api_response');
  const providerRatesLabel = t('admin.dashboard.system_status.provider_rates');
  const competencyTestsLabel = t('admin.dashboard.system_status.competency_tests');
  const onlineLabel = t('admin.dashboard.system_status.online');
  const healthyLabel = t('admin.dashboard.system_status.healthy');
  const fastLabel = t('admin.dashboard.system_status.fast');
  const flexibleLabel = t('admin.dashboard.system_status.flexible');
  const activeLabel = t('admin.dashboard.system_status.active');

  const stats = useMemo(() => [
    {
      title: statsUsersTitle,
      value: statsData?.totalUsers || 0,
      change: Math.round(statsData?.currentMonthVsLastMonthUsers || 0),
      current: statsData?.currentMonthUsers || 0,
      icon: Users,
      color: 'text-blue-600',
      href: '/admin/users'
    },
    {
      title: statsServicesTitle,
      value: statsData?.activeServices || '0',
      change: Math.round(statsData?.currentMonthVsLastMonthServices || 0),
      current: statsData?.currentMonthServices || 0,
      icon: FileText,
      color: 'text-green-600',
      href: '/admin/services'
    },
    {
      title: statsRevenueTitle,
      value: `${statsData?.totalRevenue || '0'} RON`,
      change: Math.round(statsData?.currentMonthVsLastMonthRevenue || 0),
      current: statsData?.currentMonthRevenue || 0,
      icon: DollarSign,
      color: 'text-yellow-600',
      href: '/admin/orders'
    },
    {
      title: statsProjectsTitle,
      value: statsData?.totalProjects || 0,
      change: Math.round(statsData?.currentMonthVsLastMonthProjects || 0),
      current: statsData?.currentMonthProjects || 0,
      icon: TrendingUp,
      color: 'text-purple-600',
      href: '/admin/orders'
    }
  ], [statsUsersTitle, statsServicesTitle, statsRevenueTitle, statsProjectsTitle, statsData]);

  const quickActions = useMemo(() => [
    {
      title: addUserTitle,
      description: addUserDescription,
      icon: UserPlus,
      href: '/admin/users/new',
      color: 'bg-blue-500'
    },
    {
      title: addCategoryTitle,
      description: addCategoryDescription,
      icon: FolderPlus,
      href: '/admin/categories/new',
      color: 'bg-green-500'
    },
    {
      title: addTestTitle,
      description: addTestDescription,
      icon: BookOpen,
      href: '/admin/tests/new',
      color: 'bg-purple-500'
    },
    {
      title: viewReportsTitle,
      description: viewReportsDescription,
      icon: BarChart3,
      href: '/admin/analytics',
      color: 'bg-orange-500'
    }
  ], [
    addUserTitle,
    addUserDescription,
    addCategoryTitle,
    addCategoryDescription,
    addTestTitle,
    addTestDescription,
    viewReportsTitle,
    viewReportsDescription
  ]);

  const adminSections = useMemo(() => [
    {
      title: usersSectionTitle,
      description: usersSectionDescription,
      icon: Users,
      href: '/admin/users',
      stats: t('admin.dashboard.sections.users.stats_template', { count: statsData?.totalUsers || 0 }),
      pending: statsData?.pendingUsers || 0,
      role: 'admin',
      permissions: ['users.read']
    },
    {
      title: earlyAccessSectionTitle,
      description: earlyAccessSectionDescription,
      icon: UserCheck,
      href: '/admin/early-access',
      stats: earlyAccessSectionStats,
      pending: 0,
      role: 'admin'
    },
    {
      title: servicesSectionTitle,
      description: servicesSectionDescription,
      icon: FileText,
      href: '/admin/services',
      stats: t('admin.dashboard.sections.services.stats_template', { count: statsData?.activeServices || 0 }),
      pending: statsData?.pendingServices || 0,
      role: 'admin'
    },
    {
      title: categoriesSectionTitle,
      description: categoriesSectionDescription,
      icon: FolderPlus,
      href: '/admin/categories',
      stats: categoriesSectionStats,
      pending: 0,
      role: 'admin'
    },
    {
      title: testsSectionTitle,
      description: testsSectionDescription,
      icon: BookOpen,
      href: '/admin/tests',
      stats: testsSectionStats,
      pending: 0,
      role: 'admin'
    },
    {
      title: callsSectionTitle,
      description: callsSectionDescription,
      icon: CallIcon,
      href: '/admin/calls',
      stats: t('admin.dashboard.sections.calls.stats_template', { count: statsData?.totalScheduleCalls || 0 }),
      pending: statsData?.pendingCalls || 0,
      role: 'admin'
    },
    {
      title: projectsSectionTitle,
      description: projectsSectionDescription,
      icon: TrendingUp,
      href: '/admin/orders',
      stats: t('admin.dashboard.sections.projects.stats_template', { count: statsData?.totalProjects || 0 }),
      pending: statsData?.totalPendingProjects || 0,
      role: 'admin'
    },
    {
      title: disputesSectionTitle,
      description: disputesSectionDescription,
      icon: Shield,
      href: '/admin/disputes',
      stats: disputesSectionStats,
      pending: 0,
      role: 'admin'
    },
    {
      title: legalClausesSectionTitle,
      description: legalClausesSectionDescription,
      icon: FileText,
      href: '/admin/legal/clauses',
      stats: legalClausesSectionStats,
      pending: 0,
      roles: ['admin', 'legal'],
      permissions: ['legal.clauses.read']
    },
    {
      title: newsletterSectionTitle,
      description: newsletterSectionDescription,
      icon: Bell,
      href: '/admin/newsletter',
      stats: newsletterSectionStats,
      pending: 0,
      role: 'admin'
    },
    {
      title: activitiesSectionTitle,
      description: activitiesSectionDescription,
      icon: History,
      href: '/admin/activity',
      stats: '',
      pending: 0,
      role: 'admin'
    },
    {
      title: auditLogsSectionTitle,
      description: auditLogsSectionDescription,
      icon: History,
      href: '/admin/audit-logs',
      stats: '',
      pending: 0,
      role: 'admin'
    },
    {
      title: rolesSectionTitle,
      description: rolesSectionDescription,
      icon: IdCardLanyard,
      href: '/admin/roles',
      stats: rolesSectionStats,
      pending: 0,
      role: 'superuser'
    },
    {
      title: analyticsSectionTitle,
      description: analyticsSectionDescription,
      icon: BarChart3,
      href: '/admin/analytics',
      stats: analyticsSectionStats,
      pending: 0,
      role: 'admin'
    }
  ], [
    usersSectionTitle,
    usersSectionDescription,
    servicesSectionTitle,
    servicesSectionDescription,
    categoriesSectionTitle,
    categoriesSectionDescription,
    categoriesSectionStats,
    testsSectionTitle,
    testsSectionDescription,
    testsSectionStats,
    callsSectionTitle,
    callsSectionDescription,
    projectsSectionTitle,
    projectsSectionDescription,
    t,
    disputesSectionTitle,
    disputesSectionDescription,
    disputesSectionStats,
    legalClausesSectionTitle,
    legalClausesSectionDescription,
    legalClausesSectionStats,
    newsletterSectionTitle,
    newsletterSectionDescription,
    newsletterSectionStats,
    rolesSectionTitle,
    rolesSectionDescription,
    rolesSectionStats,
    analyticsSectionTitle,
    analyticsSectionDescription,
    analyticsSectionStats,
    earlyAccessSectionTitle,
    earlyAccessSectionDescription,
    earlyAccessSectionStats,
    statsData
  ]);


  const systemStatus = useMemo(() => [
    { label: serverStatusLabel, value: onlineLabel },
    { label: databaseLabel, value: healthyLabel },
    { label: apiResponseLabel, value: fastLabel },
    { label: providerRatesLabel, value: flexibleLabel },
    { label: competencyTestsLabel, value: activeLabel }
  ], [
    serverStatusLabel,
    onlineLabel,
    databaseLabel,
    healthyLabel,
    apiResponseLabel,
    fastLabel,
    providerRatesLabel,
    flexibleLabel,
    competencyTestsLabel,
    activeLabel
  ]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="relative mb-10 overflow-hidden rounded-3xl border border-border/60 bg-card/70 p-8 shadow-[0_20px_80px_-60px_rgba(15,23,42,0.4)] backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/60 dark:shadow-[0_20px_80px_-40px_rgba(15,23,42,0.9)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_rgba(255,255,255,0)_60%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_rgba(15,23,42,0)_60%)]" />
        <div className="relative flex flex-col gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Trustora Admin
          </span>
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">{dashboardTitle}</h1>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            {dashboardSubtitle}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid xs:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, index) => (
          <Link key={index} href={stat.href}>
            <Card className="group h-full border border-border/60 bg-card/80 text-foreground shadow-[0_16px_40px_-32px_rgba(15,23,42,0.25)] transition-all duration-300 hover:-translate-y-1 hover:border-sky-500/30 hover:bg-card dark:border-slate-800/70 dark:bg-slate-900/70 dark:text-slate-100 dark:shadow-[0_16px_40px_-32px_rgba(15,23,42,0.9)] dark:hover:border-sky-500/40 dark:hover:bg-slate-900">
              <CardContent className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-semibold text-foreground flex flex-wrap items-center gap-2">
                      {stat.value}
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold ${stat?.current <= 0 ? 'text-rose-500 dark:text-rose-300' : 'text-emerald-600 dark:text-emerald-300'}`}>
                        <span className="text-muted-foreground">(</span>
                        {stat?.current} &nbsp;{stat?.current <= 0
                          ? <TrendingDown className="text-red-500 w-5 h-5" />
                          : <TrendingUp className="text-green-500 w-5 h-5" />}
                        <span className="text-muted-foreground">)</span>
                      </span>
                    </p>
                    {stat?.change && (<p className="text-xs text-muted-foreground mt-2">
                      <span className={`font-semibold ${stat?.change < 0 ? 'text-rose-500 dark:text-rose-300' : 'text-emerald-600 dark:text-emerald-300'}`}>
                        {t('admin.dashboard.stats.change_template', { percent: stat?.change })}
                      </span>
                    </p>)}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 rounded-2xl bg-sky-500/20 blur-xl transition-opacity group-hover:opacity-100 opacity-0" />
                    <div className={`relative flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-background/60 ${stat.color} dark:border-slate-800/70 dark:bg-slate-950/70`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid xs:grid-cols-1 lg:grid-cols-[2.6fr_1fr] gap-8">
        {/* Quick Actions */}
        <div>
          <Card className="border border-border/60 bg-card/80 text-foreground shadow-[0_16px_40px_-32px_rgba(15,23,42,0.25)] dark:border-slate-800/70 dark:bg-slate-900/70 dark:text-slate-100 dark:shadow-[0_16px_40px_-32px_rgba(15,23,42,0.9)]">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-foreground">
                <Plus className="w-5 h-5" />
                <span>{quickActionsTitle}</span>
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {quickActionsDescription}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid xs:grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <Link key={index} href={action.href}>
                    <Card className="group h-full border border-border/60 bg-background/60 text-foreground transition-all duration-300 hover:-translate-y-1 hover:border-sky-500/30 hover:bg-background dark:border-slate-800/70 dark:bg-slate-950/60 dark:text-slate-100 dark:hover:border-sky-500/40 dark:hover:bg-slate-950">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <action.icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1 text-foreground">{action.title}</h3>
                            <p className="text-sm text-muted-foreground">{action.description}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-sky-500 transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Admin Sections */}
          <Card className="mt-6 border border-border/60 bg-card/80 text-foreground shadow-[0_16px_40px_-32px_rgba(15,23,42,0.25)] dark:border-slate-800/70 dark:bg-slate-900/70 dark:text-slate-100 dark:shadow-[0_16px_40px_-32px_rgba(15,23,42,0.9)]">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-foreground">
                <Settings className="w-5 h-5" />
                <span>{sectionsTitle}</span>
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {sectionsDescription}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid xs:grid-cols-1 md:grid-cols-2 gap-4">
                {adminSections.map((section, index) => (
                  <Can
                    key={index}
                    {...(
                      section.role === 'superuser'
                        ? { superuser: true }
                        : { roles: section.roles ?? [section.role as string] }
                    )}
                    allPerms={section.permissions || []}
                  >
                    <Link href={section.href}>
                      <Card className="group h-full border border-border/60 bg-background/60 text-foreground transition-all duration-300 hover:-translate-y-1 hover:border-sky-500/30 hover:bg-background dark:border-slate-800/70 dark:bg-slate-950/60 dark:text-slate-100 dark:hover:border-sky-500/40 dark:hover:bg-slate-950">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start space-x-3">
                              <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center group-hover:bg-sky-500/20 transition-colors">
                                <section.icon className="w-5 h-5 text-sky-600 dark:text-sky-300" />
                              </div>
                              <div>
                                <h3 className="font-semibold mb-1 text-foreground">{section.title}</h3>
                                <p className="text-sm text-muted-foreground mb-2">{section.description}</p>
                                <p className="text-xs text-muted-foreground/80">{section.stats}</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                              {section.pending > 0 && (
                                <Badge variant="destructive" className="text-xs w-max">
                                  {t('admin.dashboard.pending_template', { count: section.pending })}
                                </Badge>
                              )}
                              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-sky-500 transition-colors" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </Can>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <ActivityFeed />

          {/* System Status */}

          {/* System Status */}
          <Card className="mt-6 border border-border/60 bg-card/80 text-foreground shadow-[0_16px_40px_-32px_rgba(15,23,42,0.25)] dark:border-slate-800/70 dark:bg-slate-900/70 dark:text-slate-100 dark:shadow-[0_16px_40px_-32px_rgba(15,23,42,0.9)]">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-foreground">
                <Bell className="w-5 h-5" />
                <span>{systemStatusTitle}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {systemStatus.map((status, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{status.label}</span>
                    <Badge className="border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200">{status.value}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
