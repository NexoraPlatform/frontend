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
  FileText,
  Search,
  MoreHorizontal,
  Eye,
  CheckCircle,
  Ban,
  Trash2,
  Star,
  Loader2,
  ArrowLeft,
  Filter,
  Plus,
  Edit
} from 'lucide-react';
import { useAdminServices } from '@/hooks/use-api';
import { apiClient } from '@/lib/api';
import { useLocale, useTranslations } from 'next-intl';
import { TrustoraThemeStyles } from '@/components/trustora/theme-styles';

export default function AdminServicesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState('all');
  const { data: servicesData, loading: servicesLoading, refetch: refetchServices } = useAdminServices();
    const locale = useLocale();
  const t = useTranslations();
  const manageTitle = t('admin.services.manage_title');
  const manageSubtitle = t('admin.services.manage_subtitle');
  const addService = t('admin.services.add_service');
  const searchPlaceholder = t('admin.services.search_placeholder');
  const statusFilterPlaceholder = t('admin.services.status_filter_placeholder');
  const filterAll = t('admin.services.filters.all');
  const statusActive = t('admin.services.statuses.ACTIVE');
  const statusDraft = t('admin.services.statuses.DRAFT');
  const statusSuspended = t('admin.services.statuses.SUSPENDED');
  const listTitle = t('admin.services.list_title');
  const listDescriptionTemplate = t('admin.services.list_description');
  const recommendedLabel = t('admin.services.recommended');
  const slugPrefix = t('admin.services.slug_prefix');
  const categoryPrefix = t('admin.services.category_prefix');
  const reviewsLabelTemplate = t('admin.services.reviews');
  const ordersLabelTemplate = t('admin.services.orders');
  const viewsLabelTemplate = t('admin.services.views');
  const viewDetails = t('admin.services.view_details');
  const editLabel = t('admin.services.edit');
  const approveLabel = t('admin.services.approve');
  const featureLabel = t('admin.services.feature');
  const unfeatureLabel = t('admin.services.unfeature');
  const suspendLabel = t('admin.services.suspend');
  const deleteLabel = t('admin.services.delete');
  const confirmDeleteText = t('admin.services.confirm_delete');
  const errorPrefix = t('admin.services.error_prefix');
  const noServicesTitle = t('admin.services.no_services_title');
  const noServicesDescription = t('admin.services.no_services_description');

  const handleServiceAction = async (serviceId: string, action: string) => {
    try {
      if (action === 'delete') {
        if (confirm(confirmDeleteText)) {
          await apiClient.deleteService(serviceId);
          await refetchServices();
        }
      } else {
        await apiClient.updateServiceStatus(serviceId, action);
        await refetchServices();
      }
    } catch (error: any) {
      alert(errorPrefix + error.message);
    }
  };

    const filteredServices = useMemo(() => {
        const services = servicesData?.services ?? [];

        const q = (searchTerm ?? '').toString().trim().toLowerCase();
        const statusFilterNorm = (serviceFilter ?? 'all').toString().toUpperCase();

        return services.filter((service: any) => {
            const name = (service?.name[locale] ?? '').toString().toLowerCase();
            const desc = (service?.description[locale] ?? '').toString().toLowerCase();
            const status = (service?.status ?? '').toString().toUpperCase();

            const matchesSearch = !q || name.includes(q) || desc.includes(q);
            const matchesFilter = statusFilterNorm === 'ALL' || status === statusFilterNorm;

            return matchesSearch && matchesFilter;
        });
    }, [servicesData?.services, searchTerm, serviceFilter, locale]);

  const statusBadges = useMemo(
    () => ({
      ACTIVE: {
        label: statusActive,
        className:
          'border border-emerald-200/60 bg-emerald-100 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-200',
      },
      DRAFT: {
        label: statusDraft,
        className:
          'border border-amber-200/60 bg-amber-100 text-amber-800 dark:border-amber-400/40 dark:bg-amber-500/20 dark:text-amber-200',
      },
      SUSPENDED: {
        label: statusSuspended,
        className:
          'border border-red-200/60 bg-red-100 text-red-800 dark:border-red-500/40 dark:bg-red-500/20 dark:text-red-200',
      },
    }),
    [statusActive, statusDraft, statusSuspended]
  );

  const getStatusBadge = (status: string) => {
    const badge = statusBadges[status as keyof typeof statusBadges];
    if (!badge) return <Badge variant="secondary">{status}</Badge>;
    return <Badge className={badge.className}>{badge.label}</Badge>;
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
            <Link href="/admin/services/new">
              <Button className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                {addService}
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
                <Select value={serviceFilter} onValueChange={setServiceFilter}>
                  <SelectTrigger className="w-full md:w-52 bg-white/80 dark:bg-slate-900/60">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder={statusFilterPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{filterAll}</SelectItem>
                    <SelectItem value="ACTIVE">{statusActive}</SelectItem>
                    <SelectItem value="DRAFT">{statusDraft}</SelectItem>
                    <SelectItem value="SUSPENDED">{statusSuspended}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Services List */}
          <Card className="glass-card shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white">
                <FileText className="w-5 h-5" />
                <span>{listTitle}</span>
              </CardTitle>
              <CardDescription>
                {typeof listDescriptionTemplate === 'string'
                  ? listDescriptionTemplate.replace('{count}', String(filteredServices.length))
                  : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {servicesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredServices.map((service: any) => (
                    <div
                      key={service.id}
                      className="flex flex-col gap-4 rounded-xl border border-slate-200/60 bg-white/80 p-5 transition-colors hover:border-emerald-200/70 hover:bg-white/90 dark:border-slate-700/60 dark:bg-slate-900/50 dark:hover:border-emerald-500/40"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg text-slate-900 dark:text-white">{service.name[locale]}</h3>
                            {service.isFeatured && (
                              <Badge className="border border-amber-200/60 bg-amber-100 text-amber-800 dark:border-amber-400/40 dark:bg-amber-500/20 dark:text-amber-200">
                                {recommendedLabel}
                              </Badge>
                            )}
                          </div>

                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {service.description[locale]}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 text-sm mb-3">
                            <span className="text-muted-foreground">
                              {slugPrefix}{service.slug}
                            </span>
                            <span className="text-muted-foreground">
                              {categoryPrefix}{service.category?.name[locale]}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            {getStatusBadge(service.status)}
                            <div className="flex items-center space-x-1">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              <span>{service.rating || 0}</span>
                              <span className="text-muted-foreground">
                                ({reviewsLabelTemplate.replace('{count}', String(service.reviewCount || 0))})
                              </span>
                            </div>
                            <span className="text-muted-foreground">
                              {ordersLabelTemplate.replace('{count}', String(service.orderCount || 0))}
                            </span>
                            <span className="text-muted-foreground">
                              {viewsLabelTemplate.replace('{count}', String(service.viewCount || 0))}
                            </span>
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
                            <DropdownMenuItem onClick={() => handleServiceAction(service.id, 'view')}>
                              <Eye className="w-4 h-4 mr-2" />
                              {viewDetails}
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/services/${service.id}/edit`}>
                                <Edit className="w-4 h-4 mr-2" />
                                {editLabel}
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleServiceAction(service.id, 'approve')}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              {approveLabel}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleServiceAction(service.id, 'feature')}>
                              <Star className="w-4 h-4 mr-2" />
                              {service.isFeatured ? unfeatureLabel : featureLabel}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleServiceAction(service.id, 'suspend')}>
                              <Ban className="w-4 h-4 mr-2" />
                              {suspendLabel}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleServiceAction(service.id, 'delete')}
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

                  {filteredServices.length === 0 && (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">{noServicesTitle}</h3>
                      <p className="text-muted-foreground">
                        {noServicesDescription}
                      </p>
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
