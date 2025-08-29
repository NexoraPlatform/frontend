"use client";

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Eye,
  ArrowRight,
  Activity,
  Bell,
  BookOpen,
  IdCardLanyard,
  TrendingDown
} from 'lucide-react';
import CallIcon from '@mui/icons-material/Call';
import apiClient from '@/lib/api';
import { Can } from '@/components/Can';
import { useAsyncTranslation } from '@/hooks/use-async-translation';
import { Locale } from '@/types/locale';

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
  const pathname = usePathname();
  const locale = (pathname.split('/')[1] as Locale) || 'ro';

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

  const dashboardTitle = useAsyncTranslation(locale, 'admin.dashboard.title');
  const dashboardSubtitle = useAsyncTranslation(locale, 'admin.dashboard.subtitle');

  const statsUsersTitle = useAsyncTranslation(locale, 'admin.dashboard.stats.users');
  const statsServicesTitle = useAsyncTranslation(locale, 'admin.dashboard.stats.services');
  const statsRevenueTitle = useAsyncTranslation(locale, 'admin.dashboard.stats.revenue');
  const statsProjectsTitle = useAsyncTranslation(locale, 'admin.dashboard.stats.projects');
  const changeTemplate = useAsyncTranslation(locale, 'admin.dashboard.stats.change_template');

  const quickActionsTitle = useAsyncTranslation(locale, 'admin.dashboard.quick_actions.title');
  const quickActionsDescription = useAsyncTranslation(locale, 'admin.dashboard.quick_actions.description');
  const addUserTitle = useAsyncTranslation(locale, 'admin.dashboard.quick_actions.add_user.title');
  const addUserDescription = useAsyncTranslation(locale, 'admin.dashboard.quick_actions.add_user.description');
  const addCategoryTitle = useAsyncTranslation(locale, 'admin.dashboard.quick_actions.add_category.title');
  const addCategoryDescription = useAsyncTranslation(locale, 'admin.dashboard.quick_actions.add_category.description');
  const addTestTitle = useAsyncTranslation(locale, 'admin.dashboard.quick_actions.add_test.title');
  const addTestDescription = useAsyncTranslation(locale, 'admin.dashboard.quick_actions.add_test.description');
  const viewReportsTitle = useAsyncTranslation(locale, 'admin.dashboard.quick_actions.view_reports.title');
  const viewReportsDescription = useAsyncTranslation(locale, 'admin.dashboard.quick_actions.view_reports.description');

  const sectionsTitle = useAsyncTranslation(locale, 'admin.dashboard.sections.title');
  const sectionsDescription = useAsyncTranslation(locale, 'admin.dashboard.sections.description');
  const usersSectionTitle = useAsyncTranslation(locale, 'admin.dashboard.sections.users.title');
  const usersSectionDescription = useAsyncTranslation(locale, 'admin.dashboard.sections.users.description');
  const usersSectionStatsTemplate = useAsyncTranslation(locale, 'admin.dashboard.sections.users.stats_template');
  const servicesSectionTitle = useAsyncTranslation(locale, 'admin.dashboard.sections.services.title');
  const servicesSectionDescription = useAsyncTranslation(locale, 'admin.dashboard.sections.services.description');
  const servicesSectionStatsTemplate = useAsyncTranslation(locale, 'admin.dashboard.sections.services.stats_template');
  const categoriesSectionTitle = useAsyncTranslation(locale, 'admin.dashboard.sections.categories.title');
  const categoriesSectionDescription = useAsyncTranslation(locale, 'admin.dashboard.sections.categories.description');
  const categoriesSectionStats = useAsyncTranslation(locale, 'admin.dashboard.sections.categories.stats');
  const testsSectionTitle = useAsyncTranslation(locale, 'admin.dashboard.sections.tests.title');
  const testsSectionDescription = useAsyncTranslation(locale, 'admin.dashboard.sections.tests.description');
  const testsSectionStats = useAsyncTranslation(locale, 'admin.dashboard.sections.tests.stats');
  const callsSectionTitle = useAsyncTranslation(locale, 'admin.dashboard.sections.calls.title');
  const callsSectionDescription = useAsyncTranslation(locale, 'admin.dashboard.sections.calls.description');
  const callsSectionStatsTemplate = useAsyncTranslation(locale, 'admin.dashboard.sections.calls.stats_template');
  const projectsSectionTitle = useAsyncTranslation(locale, 'admin.dashboard.sections.projects.title');
  const projectsSectionDescription = useAsyncTranslation(locale, 'admin.dashboard.sections.projects.description');
  const projectsSectionStatsTemplate = useAsyncTranslation(locale, 'admin.dashboard.sections.projects.stats_template');
  const disputesSectionTitle = useAsyncTranslation(locale, 'admin.dashboard.sections.disputes.title');
  const disputesSectionDescription = useAsyncTranslation(locale, 'admin.dashboard.sections.disputes.description');
  const disputesSectionStats = useAsyncTranslation(locale, 'admin.dashboard.sections.disputes.stats');
  const rolesSectionTitle = useAsyncTranslation(locale, 'admin.dashboard.sections.roles.title');
  const rolesSectionDescription = useAsyncTranslation(locale, 'admin.dashboard.sections.roles.description');
  const rolesSectionStats = useAsyncTranslation(locale, 'admin.dashboard.sections.roles.stats');
  const analyticsSectionTitle = useAsyncTranslation(locale, 'admin.dashboard.sections.analytics.title');
  const analyticsSectionDescription = useAsyncTranslation(locale, 'admin.dashboard.sections.analytics.description');
  const analyticsSectionStats = useAsyncTranslation(locale, 'admin.dashboard.sections.analytics.stats');
  const pendingTemplate = useAsyncTranslation(locale, 'admin.dashboard.pending_template');

  const activityTitle = useAsyncTranslation(locale, 'admin.dashboard.activity.title');
  const activityUserMessage = useAsyncTranslation(locale, 'admin.dashboard.activity.entries.user.message');
  const activityUserTime = useAsyncTranslation(locale, 'admin.dashboard.activity.entries.user.time');
  const activityOrderMessage = useAsyncTranslation(locale, 'admin.dashboard.activity.entries.order.message');
  const activityOrderTime = useAsyncTranslation(locale, 'admin.dashboard.activity.entries.order.time');
  const activityServiceMessage = useAsyncTranslation(locale, 'admin.dashboard.activity.entries.service.message');
  const activityServiceTime = useAsyncTranslation(locale, 'admin.dashboard.activity.entries.service.time');
  const activityTestMessage = useAsyncTranslation(locale, 'admin.dashboard.activity.entries.test.message');
  const activityTestTime = useAsyncTranslation(locale, 'admin.dashboard.activity.entries.test.time');
  const activityDisputeMessage = useAsyncTranslation(locale, 'admin.dashboard.activity.entries.dispute.message');
  const activityDisputeTime = useAsyncTranslation(locale, 'admin.dashboard.activity.entries.dispute.time');
  const viewAllActivity = useAsyncTranslation(locale, 'admin.dashboard.activity.view_all');

  const systemStatusTitle = useAsyncTranslation(locale, 'admin.dashboard.system_status.title');
  const serverStatusLabel = useAsyncTranslation(locale, 'admin.dashboard.system_status.server_status');
  const databaseLabel = useAsyncTranslation(locale, 'admin.dashboard.system_status.database');
  const apiResponseLabel = useAsyncTranslation(locale, 'admin.dashboard.system_status.api_response');
  const providerRatesLabel = useAsyncTranslation(locale, 'admin.dashboard.system_status.provider_rates');
  const competencyTestsLabel = useAsyncTranslation(locale, 'admin.dashboard.system_status.competency_tests');
  const onlineLabel = useAsyncTranslation(locale, 'admin.dashboard.system_status.online');
  const healthyLabel = useAsyncTranslation(locale, 'admin.dashboard.system_status.healthy');
  const fastLabel = useAsyncTranslation(locale, 'admin.dashboard.system_status.fast');
  const flexibleLabel = useAsyncTranslation(locale, 'admin.dashboard.system_status.flexible');
  const activeLabel = useAsyncTranslation(locale, 'admin.dashboard.system_status.active');

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
      stats: usersSectionStatsTemplate.replace('{count}', String(statsData?.totalUsers || 0)),
      pending: statsData?.pendingUsers || 0,
      role: 'admin',
      permissions: ['users.read']
    },
    {
      title: servicesSectionTitle,
      description: servicesSectionDescription,
      icon: FileText,
      href: '/admin/services',
      stats: servicesSectionStatsTemplate.replace('{count}', String(statsData?.activeServices || 0)),
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
      stats: callsSectionStatsTemplate.replace('{count}', String(statsData?.totalScheduleCalls || 0)),
      pending: statsData?.pendingCalls || 0,
      role: 'admin'
    },
    {
      title: projectsSectionTitle,
      description: projectsSectionDescription,
      icon: TrendingUp,
      href: '/admin/orders',
      stats: projectsSectionStatsTemplate.replace('{count}', String(statsData?.totalProjects || 0)),
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
    usersSectionStatsTemplate,
    servicesSectionTitle,
    servicesSectionDescription,
    servicesSectionStatsTemplate,
    categoriesSectionTitle,
    categoriesSectionDescription,
    categoriesSectionStats,
    testsSectionTitle,
    testsSectionDescription,
    testsSectionStats,
    callsSectionTitle,
    callsSectionDescription,
    callsSectionStatsTemplate,
    projectsSectionTitle,
    projectsSectionDescription,
    projectsSectionStatsTemplate,
    disputesSectionTitle,
    disputesSectionDescription,
    disputesSectionStats,
    rolesSectionTitle,
    rolesSectionDescription,
    rolesSectionStats,
    analyticsSectionTitle,
    analyticsSectionDescription,
    analyticsSectionStats,
    statsData
  ]);

  const recentActivity = useMemo(() => [
    { type: 'user', message: activityUserMessage, time: activityUserTime, icon: Users, color: 'text-blue-500' },
    { type: 'order', message: activityOrderMessage, time: activityOrderTime, icon: TrendingUp, color: 'text-green-500' },
    { type: 'service', message: activityServiceMessage, time: activityServiceTime, icon: FileText, color: 'text-yellow-500' },
    { type: 'test', message: activityTestMessage, time: activityTestTime, icon: BookOpen, color: 'text-purple-500' },
    { type: 'dispute', message: activityDisputeMessage, time: activityDisputeTime, icon: Shield, color: 'text-red-500' }
  ], [
    activityUserMessage,
    activityUserTime,
    activityOrderMessage,
    activityOrderTime,
    activityServiceMessage,
    activityServiceTime,
    activityTestMessage,
    activityTestTime,
    activityDisputeMessage,
    activityDisputeTime
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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{dashboardTitle}</h1>
        <p className="text-muted-foreground">
          {dashboardSubtitle}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid xs:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Link key={index} href={`/${locale}${stat.href}`}>
            <Card className="border-2 hover:shadow-lg transition-all duration-300 hover:border-primary/20 cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold flex">{stat.value}
                      <span className={`ms-2 ${stat?.current <= 0 ? 'text-red-500' : 'text-green-500'} text-xs flex items-center`}>
                        <span className="text-muted-foreground">(</span>
                        {stat?.current} &nbsp;{stat?.current <= 0
                          ? <TrendingDown className="text-red-500 w-5 h-5" />
                          : <TrendingUp className="text-green-500 w-5 h-5" />}
                        <span className="text-muted-foreground">)</span>
                      </span>
                    </p>
                    {stat?.change && (<p className="text-xs text-muted-foreground mt-1">
                      <span className={`${stat?.change < 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {changeTemplate.replace('{percent}', String(stat?.change))}
                      </span>
                    </p>)}
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid xs:grid-cols-1 lg:grid-cols-[3fr_1fr] gap-8">
        {/* Quick Actions */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>{quickActionsTitle}</span>
              </CardTitle>
              <CardDescription>
                {quickActionsDescription}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid xs:grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <Link key={index} href={`/${locale}${action.href}`}>
                    <Card className="border-2 hover:shadow-md transition-all duration-300 hover:border-primary/20 cursor-pointer group">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <action.icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{action.title}</h3>
                            <p className="text-sm text-muted-foreground">{action.description}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Admin Sections */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>{sectionsTitle}</span>
              </CardTitle>
              <CardDescription>
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
                        : { roles: [section.role as string] }
                    )}
                    allPerms={section.permissions || []}
                  >
                    <Link href={`/${locale}${section.href}`}>
                      <Card className="border hover:shadow-md transition-all duration-300 hover:border-primary/20 cursor-pointer group">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <section.icon className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-semibold mb-1">{section.title}</h3>
                                <p className="text-sm text-muted-foreground mb-2">{section.description}</p>
                                <p className="text-xs text-muted-foreground">{section.stats}</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                              {section.pending > 0 && (
                                <Badge variant="destructive" className="text-xs w-max">
                                  {pendingTemplate.replace('{count}', String(section.pending))}
                                </Badge>
                              )}
                              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>{activityTitle}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center ${activity.color}`}>
                      <activity.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <Link href="/admin/activity">
                  <Button variant="outline" className="w-full">
                    <Eye className="w-4 h-4 mr-2" />
                    {viewAllActivity}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>{systemStatusTitle}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {systemStatus.map((status, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{status.label}</span>
                    <Badge className="bg-green-100 text-green-800">{status.value}</Badge>
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

