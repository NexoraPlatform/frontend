"use client";

import { useState, useMemo } from 'react';
import { Link } from '@/lib/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  BookOpen,
  Search,
  MoreHorizontal,
  Eye,
  Trash2,
  Plus,
  Loader2,
  ArrowLeft,
  Filter,
  Clock,
  Target,
  BarChart3,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useAdminTests } from '@/hooks/use-api';
import { apiClient } from '@/lib/api';
import { useLocale, useTranslations } from 'next-intl';
import { TrustoraThemeStyles } from '@/components/trustora/theme-styles';

export default function AdminTestsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const { data: testsData, loading: testsLoading, refetch: refetchTests } = useAdminTests();
    const locale = useLocale();
  const t = useTranslations();
  const manageTitle = t('admin.tests.manage_title');
  const manageSubtitle = t('admin.tests.manage_subtitle');
  const addTest = t('admin.tests.add_test');
  const searchPlaceholder = t('admin.tests.search_placeholder');
  const levelFilterPlaceholder = t('admin.tests.level_filter_placeholder');
  const statusFilterPlaceholder = t('admin.tests.status_filter_placeholder');
  const levelAll = t('admin.tests.levels.all');
  const levelJunior = t('admin.tests.levels.JUNIOR');
  const levelMediu = t('admin.tests.levels.MEDIU');
  const levelSenior = t('admin.tests.levels.SENIOR');
  const levelExpert = t('admin.tests.levels.EXPERT');
  const statusAll = t('admin.tests.statuses.all');
  const statusActive = t('admin.tests.statuses.ACTIVE');
  const statusInactive = t('admin.tests.statuses.INACTIVE');
  const statusDraft = t('admin.tests.statuses.DRAFT');
  const listTitle = t('admin.tests.list_title');
  const listDescriptionTemplate = t('admin.tests.list_description');
  const questionCountTemplate = t('admin.tests.question_count');
  const minuteSuffix = t('admin.tests.minute_suffix');
  const passingScoreTemplate = t('admin.tests.passing_score');
  const categoryPrefix = t('admin.tests.category_prefix');
  const createdPrefix = t('admin.tests.created_prefix');
  const resultsTemplate = t('admin.tests.results_count');
  const viewDetails = t('admin.tests.view_details');
  const statisticsLabel = t('admin.tests.statistics.title_suffix');
  const deactivateLabel = t('admin.tests.deactivate');
  const activateLabel = t('admin.tests.activate');
  const deleteLabel = t('admin.tests.delete');
  const confirmDeleteText = t('admin.tests.confirm_delete');
  const errorPrefix = t('admin.tests.error_prefix');
  const noTestsTitle = t('admin.tests.no_tests_title');
  const noTestsDescription = t('admin.tests.no_tests_description');
  const addFirstTest = t('admin.tests.add_first_test');

  const handleTestAction = async (testId: string, action: string) => {
    try {
      if (action === 'delete') {
        if (confirm(confirmDeleteText)) {
          await apiClient.deleteTest(testId);
          refetchTests();
        }
      } else if (action === 'activate') {
        await apiClient.updateTestStatus(testId, 'ACTIVE');
        refetchTests();
      } else if (action === 'deactivate') {
        await apiClient.updateTestStatus(testId, 'INACTIVE');
        refetchTests();
      }
    } catch (error: any) {
      alert(errorPrefix + error.message);
    }
  };

  const filteredTests = useMemo(() => {
    return (testsData?.tests || []).filter((test: any) => {
      const matchesSearch = test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.service?.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesService = serviceFilter === 'all' || test.serviceId === serviceFilter;
      const matchesLevel = levelFilter === 'all' || test.level === levelFilter;
      const matchesStatus = statusFilter === 'all' || test.status === statusFilter;
      return matchesSearch && matchesService && matchesLevel && matchesStatus;
    });
  }, [testsData?.tests, searchTerm, serviceFilter, levelFilter, statusFilter]);

  const statusBadgeMap = useMemo(() => ({
    ACTIVE: (
      <Badge className="border border-emerald-200/60 bg-emerald-100 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-200">
        <CheckCircle className="w-3 h-3 mr-1" />
        {statusActive}
      </Badge>
    ),
    INACTIVE: (
      <Badge className="border border-slate-200/70 bg-slate-100 text-slate-700 dark:border-slate-600/50 dark:bg-slate-800/70 dark:text-slate-200">
        <XCircle className="w-3 h-3 mr-1" />
        {statusInactive}
      </Badge>
    ),
    DRAFT: (
      <Badge className="border border-amber-200/60 bg-amber-100 text-amber-800 dark:border-amber-400/40 dark:bg-amber-500/20 dark:text-amber-200">
        <AlertCircle className="w-3 h-3 mr-1" />
        {statusDraft}
      </Badge>
    ),
  }), [statusActive, statusInactive, statusDraft]);

  const getStatusBadge = (status: string) => {
    return statusBadgeMap[status as keyof typeof statusBadgeMap] || <Badge variant="secondary">{status}</Badge>;
  };

  type Level = 'JUNIOR' | 'MEDIU' | 'SENIOR' | 'EXPERT';

  const levelBadgeMap = useMemo(() => ({
    JUNIOR: {
      label: levelJunior,
      color:
        'border border-emerald-200/60 bg-emerald-100 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-200',
    },
    MEDIU: {
      label: levelMediu,
      color:
        'border border-blue-200/60 bg-blue-100 text-blue-800 dark:border-blue-400/40 dark:bg-blue-500/20 dark:text-blue-200',
    },
    SENIOR: {
      label: levelSenior,
      color:
        'border border-purple-200/60 bg-purple-100 text-purple-800 dark:border-purple-400/40 dark:bg-purple-500/20 dark:text-purple-200',
    },
    EXPERT: {
      label: levelExpert,
      color:
        'border border-orange-200/60 bg-orange-100 text-orange-800 dark:border-orange-400/40 dark:bg-orange-500/20 dark:text-orange-200',
    },
  }), [levelJunior, levelMediu, levelSenior, levelExpert]);

  const getLevelBadge = (level: Level) => {
    const badge = levelBadgeMap[level];
    return <Badge className={badge?.color || 'bg-gray-100 text-gray-800'}>{badge?.label || level}</Badge>;
  };

  return (
    <>
      <TrustoraThemeStyles />
      <div className="min-h-screen bg-[var(--bg-light)] dark:bg-[#070C14]">
        <div className="container mx-auto px-4 py-10">
          {/* Header */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Link href="/admin">
                <Button
                  variant="outline"
                  size="icon"
                  className="border-slate-200/70 bg-white/70 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/60"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">{manageTitle}</h1>
                <p className="text-sm text-muted-foreground">
                  {manageSubtitle}
                </p>
              </div>
            </div>
            <Link href={`/${locale}/admin/tests/new`}>
              <Button className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                {addTest}
              </Button>
            </Link>
          </div>

      {/* Filters */}
          <Card className="mb-6 glass-card shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder={searchPlaceholder}
                      className="pl-10 bg-white/80 dark:bg-slate-900/60"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="w-full md:w-48 bg-white/80 dark:bg-slate-900/60">
                    <SelectValue placeholder={levelFilterPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{levelAll}</SelectItem>
                    <SelectItem value="JUNIOR">{levelJunior}</SelectItem>
                    <SelectItem value="MEDIU">{levelMediu}</SelectItem>
                    <SelectItem value="SENIOR">{levelSenior}</SelectItem>
                    <SelectItem value="EXPERT">{levelExpert}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48 bg-white/80 dark:bg-slate-900/60">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder={statusFilterPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{statusAll}</SelectItem>
                    <SelectItem value="ACTIVE">{statusActive}</SelectItem>
                    <SelectItem value="INACTIVE">{statusInactive}</SelectItem>
                    <SelectItem value="DRAFT">{statusDraft}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

      {/* Tests List */}
          <Card className="glass-card shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white">
                <BookOpen className="w-5 h-5" />
                <span>{listTitle}</span>
              </CardTitle>
              <CardDescription>
                {listDescriptionTemplate.replace('{count}', String(filteredTests.length))}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTests.map((test: any) => (
                    <div
                      key={test.id}
                      className="flex flex-col gap-4 rounded-xl border border-slate-200/60 bg-white/80 p-5 transition-colors hover:border-emerald-200/70 hover:bg-white/90 dark:border-slate-700/60 dark:bg-slate-900/50 dark:hover:border-emerald-500/40"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg text-slate-900 dark:text-white">{test.title}</h3>
                            {getLevelBadge(test.level)}
                            {getStatusBadge(test.status)}
                          </div>

                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {test.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-4 text-sm mb-3">
                            <div className="flex items-center space-x-1">
                              <BookOpen className="w-4 h-4 text-blue-500" />
                              <span className="font-medium">{test.service?.title}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Target className="w-4 h-4 text-emerald-500" />
                              <span>{questionCountTemplate.replace('{count}', String(test.totalQuestions))}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4 text-orange-500" />
                              <span>{`${test.timeLimit} ${minuteSuffix}`}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <BarChart3 className="w-4 h-4 text-purple-500" />
                              <span>{passingScoreTemplate.replace('{score}', String(test.passingScore))}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <span>{categoryPrefix}{test.service?.category?.name?.[locale]}</span>
                            <span>
                              {createdPrefix}
                              {new Date(test.created_at).toLocaleDateString(locale)}
                            </span>
                            {test.results && (
                              <span>{resultsTemplate.replace('{count}', String(test.results.length))}</span>
                            )}
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="self-start text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/tests/${test.id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                {viewDetails}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/${locale}/admin/tests/${test.id}/statistics`}>
                                <BarChart3 className="w-4 h-4 mr-2" />
                                {statisticsLabel}
                              </Link>
                            </DropdownMenuItem>
                            {test.status === 'ACTIVE' ? (
                              <DropdownMenuItem onClick={() => handleTestAction(test.id, 'deactivate')}>
                                <XCircle className="w-4 h-4 mr-2" />
                                {deactivateLabel}
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleTestAction(test.id, 'activate')}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                {activateLabel}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleTestAction(test.id, 'delete')}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              {deleteLabel}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}

                  {filteredTests.length === 0 && (
                    <div className="text-center py-12">
                      <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">{noTestsTitle}</h3>
                      <p className="text-muted-foreground mb-4">
                        {noTestsDescription}
                      </p>
                      <Link href="/admin/tests/new">
                        <Button className="btn-primary">
                          <Plus className="w-4 h-4 mr-2" />
                          {addFirstTest}
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
