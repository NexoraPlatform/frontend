"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  TrendingUp,
  Search,
  Eye,
  Loader2,
  ArrowLeft,
  Filter,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useAdminOrders } from '@/hooks/use-api';
import { usePathname } from 'next/navigation';
import { Locale } from '@/types/locale';
import { useAsyncTranslation } from '@/hooks/use-async-translation';

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  CANCELLED: 'bg-red-100 text-red-800',
  DISPUTED: 'bg-purple-100 text-purple-800',
  ACCEPTED: 'bg-blue-100 text-blue-800',
  DELIVERED: 'bg-green-100 text-green-800',
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  PAID: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  FAILED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
};

export default function AdminOrdersPage() {
  const pathname = usePathname();
  const locale = (pathname.split('/')[1] as Locale) || 'ro';
  const dateLocale = locale === 'ro' ? 'ro-RO' : 'en-US';

  const manageTitle = useAsyncTranslation(locale, 'admin.orders.manage_title');
  const manageSubtitle = useAsyncTranslation(locale, 'admin.orders.manage_subtitle');
  const searchPlaceholder = useAsyncTranslation(locale, 'admin.orders.search_placeholder');
  const statusFilterPlaceholder = useAsyncTranslation(locale, 'admin.orders.status_filter_placeholder');
  const statusAll = useAsyncTranslation(locale, 'admin.orders.statuses.all');
  const statusPending = useAsyncTranslation(locale, 'admin.orders.statuses.pending');
  const statusInProgress = useAsyncTranslation(locale, 'admin.orders.statuses.in_progress');
  const statusCompleted = useAsyncTranslation(locale, 'admin.orders.statuses.completed');
  const statusCancelled = useAsyncTranslation(locale, 'admin.orders.statuses.cancelled');
  const statusDisputed = useAsyncTranslation(locale, 'admin.orders.statuses.disputed');
  const listTitle = useAsyncTranslation(locale, 'admin.orders.list_title');
  const listDescriptionTemplate = useAsyncTranslation(locale, 'admin.orders.list_description');
  const clientLabel = useAsyncTranslation(locale, 'admin.orders.client_label');
  const providerLabel = useAsyncTranslation(locale, 'admin.orders.provider_label');
  const duePrefix = useAsyncTranslation(locale, 'admin.orders.due_prefix');
  const noOrdersTitle = useAsyncTranslation(locale, 'admin.orders.no_orders_title');
  const noOrdersDescription = useAsyncTranslation(locale, 'admin.orders.no_orders_description');

  const statusLabels = {
    COMPLETED: statusCompleted,
    IN_PROGRESS: statusInProgress,
    PENDING: statusPending,
    CANCELLED: statusCancelled,
    DISPUTED: statusDisputed,
    ACCEPTED: useAsyncTranslation(locale, 'admin.orders.statuses.accepted'),
    DELIVERED: useAsyncTranslation(locale, 'admin.orders.statuses.delivered'),
  } as const;

  const paymentStatusLabels = {
    PAID: useAsyncTranslation(locale, 'admin.orders.payment_statuses.paid'),
    PENDING: useAsyncTranslation(locale, 'admin.orders.payment_statuses.pending'),
    FAILED: useAsyncTranslation(locale, 'admin.orders.payment_statuses.failed'),
    REFUNDED: useAsyncTranslation(locale, 'admin.orders.payment_statuses.refunded'),
  } as const;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { data: ordersData, loading: ordersLoading } = useAdminOrders();

  const filteredOrders = useMemo(() => {
    return (ordersData?.orders || []).filter((order: any) => {
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.service?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.client?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.client?.lastName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = statusFilter === 'all' || order.status === statusFilter;
      return matchesSearch && matchesFilter;
    });
  }, [ordersData, searchTerm, statusFilter]);

  const getStatusBadge = (status: string) => {
    const label = statusLabels[status as keyof typeof statusLabels] || status;
    const className = STATUS_STYLES[status] || 'bg-secondary';
    return <Badge className={className}>{label}</Badge>;
  };

  const getPaymentStatusBadge = (status: string) => {
    const label =
      paymentStatusLabels[status as keyof typeof paymentStatusLabels] || status;
    const className = PAYMENT_STATUS_STYLES[status] || 'bg-secondary';
    return <Badge className={className}>{label}</Badge>;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/admin">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{manageTitle}</h1>
          <p className="text-muted-foreground">{manageSubtitle}</p>
        </div>
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder={statusFilterPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{statusAll}</SelectItem>
                <SelectItem value="PENDING">{statusPending}</SelectItem>
                <SelectItem value="IN_PROGRESS">{statusInProgress}</SelectItem>
                <SelectItem value="COMPLETED">{statusCompleted}</SelectItem>
                <SelectItem value="CANCELLED">{statusCancelled}</SelectItem>
                <SelectItem value="DISPUTED">{statusDisputed}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>{listTitle}</span>
          </CardTitle>
          <CardDescription>
            {listDescriptionTemplate.replace('{count}', String(filteredOrders.length))}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order: any) => (
                <div
                  key={order.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-lg">#{order.orderNumber}</h3>
                      {getStatusBadge(order.status)}
                      {getPaymentStatusBadge(order.paymentStatus)}
                    </div>

                    <h4 className="font-medium text-blue-600 mb-2">
                      {order.service?.title}
                    </h4>

                    <div className="grid xs:grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={order.client?.avatar} />
                          <AvatarFallback>
                            {order.client?.firstName?.[0]}{order.client?.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{clientLabel}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.client?.firstName} {order.client?.lastName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={order.provider?.avatar} />
                          <AvatarFallback>
                            {order.provider?.firstName?.[0]}{order.provider?.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{providerLabel}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.provider?.firstName} {order.provider?.lastName}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-semibold text-green-600 text-base">
                          {order.amount} RON
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(order.createdAt).toLocaleDateString(dateLocale)}</span>
                      </div>
                      {order.deliveryDate && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {duePrefix} {new Date(order.deliveryDate).toLocaleDateString(dateLocale)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Link href={`/admin/orders/${order.id}`}>
                    <Button variant="ghost" size="icon">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              ))}

              {filteredOrders.length === 0 && (
                <div className="text-center py-12">
                  <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">{noOrdersTitle}</h3>
                  <p className="text-muted-foreground">{noOrdersDescription}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
