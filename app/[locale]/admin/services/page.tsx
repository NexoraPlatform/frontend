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
import { usePathname } from 'next/navigation';
import { useAsyncTranslation } from '@/hooks/use-async-translation';
import { Locale } from '@/types/locale';

export default function AdminServicesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState('all');
  const { data: servicesData, loading: servicesLoading, refetch: refetchServices } = useAdminServices();
  const pathname = usePathname();
  const locale = (pathname.split('/')[1] as Locale) || 'ro';

  const manageTitle = useAsyncTranslation(locale, 'admin.services.manage_title');
  const manageSubtitle = useAsyncTranslation(locale, 'admin.services.manage_subtitle');
  const addService = useAsyncTranslation(locale, 'admin.services.add_service');
  const searchPlaceholder = useAsyncTranslation(locale, 'admin.services.search_placeholder');
  const statusFilterPlaceholder = useAsyncTranslation(locale, 'admin.services.status_filter_placeholder');
  const filterAll = useAsyncTranslation(locale, 'admin.services.filters.all');
  const statusActive = useAsyncTranslation(locale, 'admin.services.statuses.ACTIVE');
  const statusDraft = useAsyncTranslation(locale, 'admin.services.statuses.DRAFT');
  const statusSuspended = useAsyncTranslation(locale, 'admin.services.statuses.SUSPENDED');
  const listTitle = useAsyncTranslation(locale, 'admin.services.list_title');
  const listDescriptionTemplate = useAsyncTranslation(locale, 'admin.services.list_description');
  const recommendedLabel = useAsyncTranslation(locale, 'admin.services.recommended');
  const slugPrefix = useAsyncTranslation(locale, 'admin.services.slug_prefix');
  const categoryPrefix = useAsyncTranslation(locale, 'admin.services.category_prefix');
  const reviewsLabelTemplate = useAsyncTranslation(locale, 'admin.services.reviews');
  const ordersLabelTemplate = useAsyncTranslation(locale, 'admin.services.orders');
  const viewsLabelTemplate = useAsyncTranslation(locale, 'admin.services.views');
  const viewDetails = useAsyncTranslation(locale, 'admin.services.view_details');
  const editLabel = useAsyncTranslation(locale, 'admin.services.edit');
  const approveLabel = useAsyncTranslation(locale, 'admin.services.approve');
  const featureLabel = useAsyncTranslation(locale, 'admin.services.feature');
  const unfeatureLabel = useAsyncTranslation(locale, 'admin.services.unfeature');
  const suspendLabel = useAsyncTranslation(locale, 'admin.services.suspend');
  const deleteLabel = useAsyncTranslation(locale, 'admin.services.delete');
  const confirmDeleteText = useAsyncTranslation(locale, 'admin.services.confirm_delete');
  const errorPrefix = useAsyncTranslation(locale, 'admin.services.error_prefix');
  const noServicesTitle = useAsyncTranslation(locale, 'admin.services.no_services_title');
  const noServicesDescription = useAsyncTranslation(locale, 'admin.services.no_services_description');

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
    const services = servicesData?.services || [];
    return services.filter((service: any) => {
      const matchesSearch =
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = serviceFilter === 'all' || service.status === serviceFilter;
      return matchesSearch && matchesFilter;
    });
  }, [servicesData, searchTerm, serviceFilter]);

  const statusBadges = useMemo(
    () => ({
      ACTIVE: { label: statusActive, className: 'bg-green-100 text-green-800' },
      DRAFT: { label: statusDraft, className: 'bg-yellow-100 text-yellow-800' },
      SUSPENDED: { label: statusSuspended, className: 'bg-red-100 text-red-800' },
    }),
    [statusActive, statusDraft, statusSuspended]
  );

  const getStatusBadge = (status: string) => {
    const badge = statusBadges[status as keyof typeof statusBadges];
    if (!badge) return <Badge variant="secondary">{status}</Badge>;
    return <Badge className={badge.className}>{badge.label}</Badge>;
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
        <Link href="/admin/services/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            {addService}
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
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-full md:w-48">
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>{listTitle}</span>
          </CardTitle>
          <CardDescription>
            {listDescriptionTemplate.replace('{count}', String(filteredServices.length))}
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
                <div key={service.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-lg">{service.name}</h3>
                      {service.isFeatured && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          {recommendedLabel}
                        </Badge>
                      )}
                    </div>

                    <p className="text-muted-foreground mb-3 line-clamp-2">
                      {service.description}
                    </p>

                    <div className="flex items-center space-x-4 text-sm mb-3">
                      <span className="text-muted-foreground">
                        {slugPrefix}{service.slug}
                      </span>
                      <span className="text-muted-foreground">
                        {categoryPrefix}{service.category?.name}
                      </span>
                    </div>

                    <div className="flex items-center space-x-4 text-sm">
                      {getStatusBadge(service.status)}
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
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
                      <Button variant="ghost" size="icon">
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
  );
}
