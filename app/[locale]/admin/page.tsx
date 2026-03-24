"use client";

import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from '@/lib/navigation';
import { useTranslations } from 'next-intl';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  Shield,
  BarChart3,
  FolderPlus,
  UserPlus,
  UserCheck,
  ArrowRight,
  Bell,
  BookOpen,
  IdCardLanyard,
  History,
  MoreVertical
} from 'lucide-react';
import CallIcon from '@mui/icons-material/Call';
import apiClient from '@/lib/api';
import { normalizeAdminStats, type AdminStats } from '@/lib/admin-stats';
import { Can } from '@/components/Can';
import ActivityFeed from '@/components/ActivityFeed';
import { PriceDisplay } from '@/components/PriceDisplay';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminSectionCard } from '@/components/admin/admin-section-card';
import { AdminSummaryCard } from '@/components/admin/admin-summary-card';
import { ProjectAdminShell } from '@/components/admin/project-admin-shell';
import { TrustoraLandingFooter } from '@/components/homepage/trustora-landing/footer';

export default function AdminDashboard() {
  const [statsData, setStatsData] = useState<AdminStats | null>(null);
  const t = useTranslations();
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.getAdminStats();
        setStatsData(normalizeAdminStats(response));
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
  const currentMonthLabel = t('admin.dashboard.current_month');
  const recentActivityTitle = t('admin.dashboard.activity.title');
  const recentActivityViewAll = t('admin.dashboard.activity.view_all');

  const stats = useMemo(() => [
    {
      title: statsUsersTitle,
      value: statsData?.totalUsers || 0,
      change: Math.round(statsData?.currentMonthVsLastMonthUsers || 0),
      current: statsData?.currentMonthUsers || 0,
      icon: Users,
      color: 'bg-gradient-to-br from-primary to-emerald-400',
      href: '/admin/users'
    },
    {
      title: statsServicesTitle,
      value: statsData?.activeServices || 0,
      change: Math.round(statsData?.currentMonthVsLastMonthServices || 0),
      current: statsData?.currentMonthServices || 0,
      icon: FileText,
      color: 'bg-gradient-to-br from-blue-500 to-cyan-400',
      href: '/admin/services'
    },
    {
      title: statsRevenueTitle,
      value: statsData?.totalRevenue || 0,
      isCurrency: true,
      change: Math.round(statsData?.currentMonthVsLastMonthRevenue || 0),
      current: statsData?.currentMonthRevenue || 0,
      icon: DollarSign,
      color: 'bg-gradient-to-br from-purple-500 to-pink-400',
      href: '/admin/orders'
    },
    {
      title: statsProjectsTitle,
      value: statsData?.totalProjects || 0,
      change: Math.round(statsData?.currentMonthVsLastMonthProjects || 0),
      current: statsData?.currentMonthProjects || 0,
      icon: TrendingUp,
      color: 'bg-gradient-to-br from-orange-500 to-red-400',
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
    <ProjectAdminShell>
      <div className="flex min-h-full flex-col">
        <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
          <AdminPageHeader
            title={dashboardTitle}
            description={dashboardSubtitle}
            action={
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="hidden items-center space-x-2 rounded-lg px-4 py-2 transition-colors hover:bg-secondary sm:flex"
              >
                <MoreVertical className="h-5 w-5 text-muted-foreground" />
              </motion.button>
            }
            className="sm:flex-row"
          />

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <AdminSummaryCard
                key={stat.title}
                title={stat.title}
                value={stat.isCurrency ? <PriceDisplay value={Number(stat.value)} /> : stat.value}
                icon={stat.icon}
                colorClassName={stat.color}
                href={stat.href}
                delay={index * 0.1}
                badge={
                  <div className={`flex items-center space-x-1 rounded-full px-3 py-1 text-sm font-medium ${
                    stat.change >= 0
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : 'bg-destructive/20 text-destructive'
                  }`}>
                    {stat.change >= 0 ? (
                      <>
                        <ArrowUpRight className="h-4 w-4" />
                        <span>+{Math.abs(stat.change)}%</span>
                      </>
                    ) : (
                      <>
                        <ArrowDownLeft className="h-4 w-4" />
                        <span>-{Math.abs(stat.change)}%</span>
                      </>
                    )}
                  </div>
                }
                footer={
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>{t('admin.dashboard.stats.change_template', { percent: Math.abs(stat.change) })}</p>
                    <p>
                      {currentMonthLabel}: {stat.isCurrency ? <PriceDisplay value={Number(stat.current)} /> : stat.current}
                    </p>
                  </div>
                }
              />
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <AdminSectionCard
              delay={0.2}
              title={quickActionsTitle}
              description={quickActionsDescription}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                {quickActions.map((action, index) => (
                  <motion.div
                    key={action.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.05, duration: 0.4 }}
                  >
                    <Link
                      href={action.href}
                      className="glass-effect block h-full rounded-xl border border-border p-4 transition-all duration-200 hover:border-primary/40 active:scale-95"
                    >
                      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${action.color}`}>
                        <action.icon className="h-5 w-5 text-white" />
                      </div>
                      <p className="text-sm font-medium">{action.title}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{action.description}</p>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </AdminSectionCard>

            <AdminSectionCard
              delay={0.3}
              title={systemStatusTitle}
              description={dashboardSubtitle}
            >
              <div className="space-y-3">
                {systemStatus.map((status) => (
                  <div
                    key={status.label}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-background/50 px-4 py-3"
                  >
                    <span className="text-sm text-muted-foreground">{status.label}</span>
                    <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {status.value}
                    </span>
                  </div>
                ))}
              </div>
            </AdminSectionCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
            <AdminSectionCard
              delay={0.4}
              title={sectionsTitle}
              description={sectionsDescription}
            >
              <div className="grid gap-4 md:grid-cols-2">
                {adminSections.map((section, index) => (
                  <Can
                    key={section.href}
                    {...(
                      section.role === 'superuser'
                        ? { superuser: true }
                        : { roles: section.roles ?? [section.role as string] }
                    )}
                    allPerms={section.permissions || []}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.05, duration: 0.4 }}
                    >
                      <Link
                        href={section.href}
                        className="glass-effect group flex h-full flex-col rounded-2xl border border-border p-5 transition-all duration-200 hover:border-primary/40 hover:bg-secondary/20"
                      >
                        <div className="mb-4 flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                              <section.icon className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{section.title}</p>
                              <p className="mt-1 text-xs text-muted-foreground">{section.description}</p>
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary" />
                        </div>

                        <div className="mt-auto space-y-3">
                          <div className="rounded-xl border border-border/60 bg-background/50 px-4 py-3">
                            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                              {t('admin.dashboard.table.stats')}
                            </p>
                            <p className="mt-2 text-sm text-foreground/90">{section.stats || section.description}</p>
                          </div>

                          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/50 px-4 py-3">
                            <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                              {t('admin.dashboard.table.pending')}
                            </span>
                            {section.pending > 0 ? (
                              <span className="inline-flex items-center rounded-full bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                                {t('admin.dashboard.pending_template', { count: section.pending })}
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                0
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  </Can>
                ))}
              </div>
            </AdminSectionCard>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="glass-effect rounded-2xl border border-border p-6"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="mb-1 text-lg font-bold">{recentActivityTitle}</h3>
                  <p className="text-sm text-muted-foreground">{activitiesSectionDescription}</p>
                </div>
                <Link href="/admin/activity" className="text-sm font-medium text-primary transition-colors hover:text-primary/80">
                  {recentActivityViewAll}
                </Link>
              </div>

              <ActivityFeed withCard={false} title={recentActivityTitle} />
            </motion.div>
          </div>
        </div>

        <TrustoraLandingFooter />
      </div>
    </ProjectAdminShell>
  );
}
