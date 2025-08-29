"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
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
  Edit,
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
import { usePathname } from 'next/navigation';
import { Locale } from '@/types/locale';
import { useAsyncTranslation } from '@/hooks/use-async-translation';

export default function AdminTestsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const { data: testsData, loading: testsLoading, refetch: refetchTests } = useAdminTests();
  const pathname = usePathname();
  const locale = (pathname.split('/')[1] as Locale) || 'ro';

  const manageTitle = useAsyncTranslation(locale, 'admin.tests.manage_title');
  const manageSubtitle = useAsyncTranslation(locale, 'admin.tests.manage_subtitle');
  const addTest = useAsyncTranslation(locale, 'admin.tests.add_test');
  const searchPlaceholder = useAsyncTranslation(locale, 'admin.tests.search_placeholder');
  const levelFilterPlaceholder = useAsyncTranslation(locale, 'admin.tests.level_filter_placeholder');
  const statusFilterPlaceholder = useAsyncTranslation(locale, 'admin.tests.status_filter_placeholder');
  const levelAll = useAsyncTranslation(locale, 'admin.tests.levels.all');
  const levelJunior = useAsyncTranslation(locale, 'admin.tests.levels.JUNIOR');
  const levelMediu = useAsyncTranslation(locale, 'admin.tests.levels.MEDIU');
  const levelSenior = useAsyncTranslation(locale, 'admin.tests.levels.SENIOR');
  const levelExpert = useAsyncTranslation(locale, 'admin.tests.levels.EXPERT');
  const statusAll = useAsyncTranslation(locale, 'admin.tests.statuses.all');
  const statusActive = useAsyncTranslation(locale, 'admin.tests.statuses.ACTIVE');
  const statusInactive = useAsyncTranslation(locale, 'admin.tests.statuses.INACTIVE');
  const statusDraft = useAsyncTranslation(locale, 'admin.tests.statuses.DRAFT');
  const listTitle = useAsyncTranslation(locale, 'admin.tests.list_title');
  const listDescriptionTemplate = useAsyncTranslation(locale, 'admin.tests.list_description');
  const questionCountTemplate = useAsyncTranslation(locale, 'admin.tests.question_count');
  const minuteSuffix = useAsyncTranslation(locale, 'admin.tests.minute_suffix');
  const passingScoreTemplate = useAsyncTranslation(locale, 'admin.tests.passing_score');
  const categoryPrefix = useAsyncTranslation(locale, 'admin.tests.category_prefix');
  const createdPrefix = useAsyncTranslation(locale, 'admin.tests.created_prefix');
  const resultsTemplate = useAsyncTranslation(locale, 'admin.tests.results_count');
  const viewDetails = useAsyncTranslation(locale, 'admin.tests.view_details');
  const editLabel = useAsyncTranslation(locale, 'admin.tests.edit.title');
  const statisticsLabel = useAsyncTranslation(locale, 'admin.tests.statistics.title_suffix');
  const deactivateLabel = useAsyncTranslation(locale, 'admin.tests.deactivate');
  const activateLabel = useAsyncTranslation(locale, 'admin.tests.activate');
  const deleteLabel = useAsyncTranslation(locale, 'admin.tests.delete');
  const confirmDeleteText = useAsyncTranslation(locale, 'admin.tests.confirm_delete');
  const errorPrefix = useAsyncTranslation(locale, 'admin.tests.error_prefix');
  const noTestsTitle = useAsyncTranslation(locale, 'admin.tests.no_tests_title');
  const noTestsDescription = useAsyncTranslation(locale, 'admin.tests.no_tests_description');
  const addFirstTest = useAsyncTranslation(locale, 'admin.tests.add_first_test');

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
    ACTIVE: <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />{statusActive}</Badge>,
    INACTIVE: <Badge className="bg-gray-100 text-gray-800"><XCircle className="w-3 h-3 mr-1" />{statusInactive}</Badge>,
    DRAFT: <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />{statusDraft}</Badge>,
  }), [statusActive, statusInactive, statusDraft]);

  const getStatusBadge = (status: string) => {
    return statusBadgeMap[status as keyof typeof statusBadgeMap] || <Badge variant="secondary">{status}</Badge>;
  };

  type Level = 'JUNIOR' | 'MEDIU' | 'SENIOR' | 'EXPERT';

  const levelBadgeMap = useMemo(() => ({
    JUNIOR: { label: levelJunior, color: 'bg-green-100 text-green-800' },
    MEDIU: { label: levelMediu, color: 'bg-blue-100 text-blue-800' },
    SENIOR: { label: levelSenior, color: 'bg-purple-100 text-purple-800' },
    EXPERT: { label: levelExpert, color: 'bg-orange-100 text-orange-800' },
  }), [levelJunior, levelMediu, levelSenior, levelExpert]);

  const getLevelBadge = (level: Level) => {
    const badge = levelBadgeMap[level];
    return <Badge className={badge?.color || 'bg-gray-100 text-gray-800'}>{badge?.label || level}</Badge>;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link href="/admin">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{manageTitle}</h1>
            <p className="text-muted-foreground">
              {manageSubtitle}
            </p>
          </div>
        </div>
        <Link href={`/${locale}/admin/tests/new`}>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            {addTest}
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder={searchPlaceholder}
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-full md:w-48">
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
              <SelectTrigger className="w-full md:w-48">
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
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
                <div key={test.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-lg">{test.title}</h3>
                      {getLevelBadge(test.level)}
                      {getStatusBadge(test.status)}
                    </div>

                    <p className="text-muted-foreground mb-3 line-clamp-2">
                      {test.description}
                    </p>

                    <div className="flex items-center space-x-6 text-sm mb-3">
                      <div className="flex items-center space-x-1">
                        <BookOpen className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">{test.service?.title}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Target className="w-4 h-4 text-green-500" />
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

                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
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
                      <Button variant="ghost" size="icon">
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
                      {/*<DropdownMenuItem asChild>*/}
                      {/*  <Link href={`/${locale}/admin/tests/${test.id}/edit`}>*/}
                      {/*    <Edit className="w-4 h-4 mr-2" />*/}
                      {/*    {editLabel}*/}
                      {/*  </Link>*/}
                      {/*</DropdownMenuItem>*/}
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
              ))}

              {filteredTests.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">{noTestsTitle}</h3>
                  <p className="text-muted-foreground mb-4">
                    {noTestsDescription}
                  </p>
                  <Link href="/admin/tests/new">
                    <Button>
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
  );
}
