"use client";

import { useMemo, useState } from 'react';
import { Link } from '@/lib/navigation';
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
import { useLocale, useTranslations } from 'next-intl';

const STATUS_STYLES: Record<string, string> = {
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
  IN_PROGRESS: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200',
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200',
  CANCELLED: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200',
  DISPUTED: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-200',
  ACCEPTED: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200',
  DELIVERED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  PAID: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200',
  FAILED: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200',
  REFUNDED: 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200',
};

export default function AdminOrdersPage() {
  const locale = useLocale();
  const t = useTranslations();
  const dateLocale = locale === 'ro' ? 'ro-RO' : 'en-US';

  const manageTitle = t('admin.orders.manage_title');
  const manageSubtitle = t('admin.orders.manage_subtitle');
  const searchPlaceholder = t('admin.orders.search_placeholder');
  const statusFilterPlaceholder = t('admin.orders.status_filter_placeholder');
  const statusAll = t('admin.orders.statuses.all');
  const statusPending = t('admin.orders.statuses.pending');
  const statusInProgress = t('admin.orders.statuses.in_progress');
  const statusCompleted = t('admin.orders.statuses.completed');
  const statusCancelled = t('admin.orders.statuses.cancelled');
  const statusDisputed = t('admin.orders.statuses.disputed');
  const listTitle = t('admin.orders.list_title');
  const duePrefix = t('admin.orders.due_prefix');
  const noOrdersTitle = t('admin.orders.no_orders_title');
  const noOrdersDescription = t('admin.orders.no_orders_description');

  const statusLabels = {
    COMPLETED: statusCompleted,
    IN_PROGRESS: statusInProgress,
    PENDING: statusPending,
    CANCELLED: statusCancelled,
    DISPUTED: statusDisputed,
    ACCEPTED: t('admin.orders.statuses.accepted'),
    DELIVERED: t('admin.orders.statuses.delivered'),
  } as const;

  const paymentStatusLabels = {
    PAID: t('admin.orders.payment_statuses.paid'),
    PENDING: t('admin.orders.payment_statuses.pending'),
    FAILED: t('admin.orders.payment_statuses.failed'),
    REFUNDED: t('admin.orders.payment_statuses.refunded'),
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
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="relative mb-10 overflow-hidden rounded-3xl border border-border/60 bg-card/70 p-6 shadow-[0_20px_80px_-60px_rgba(15,23,42,0.4)] backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/60 dark:shadow-[0_20px_80px_-40px_rgba(15,23,42,0.9)] sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_rgba(255,255,255,0)_60%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_rgba(15,23,42,0)_60%)]" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full border border-border/60 bg-white/80 text-slate-900 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-500/40 hover:bg-sky-500/10 hover:text-sky-700 dark:border-slate-800/70 dark:bg-slate-950/70 dark:text-slate-100 dark:hover:border-sky-500/50 dark:hover:bg-sky-500/10 dark:hover:text-sky-200"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Trustora Admin
            </span>
          </div>
        </div>
        <div className="relative mt-4">
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">{manageTitle}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
            {manageSubtitle}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6 border border-border/60 bg-card/80 shadow-[0_16px_40px_-32px_rgba(15,23,42,0.25)] dark:border-slate-800/70 dark:bg-slate-900/70 dark:shadow-[0_16px_40px_-32px_rgba(15,23,42,0.9)]">
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
      <Card className="border border-border/60 bg-card/80 shadow-[0_16px_40px_-32px_rgba(15,23,42,0.25)] dark:border-slate-800/70 dark:bg-slate-900/70 dark:shadow-[0_16px_40px_-32px_rgba(15,23,42,0.9)]">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>{listTitle}</span>
          </CardTitle>
          <CardDescription>
            {t('admin.orders.list_description', { count: filteredOrders.length })}
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
                  className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card/70 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-500/40 hover:shadow-md dark:border-slate-800/70 dark:bg-slate-900/60 dark:hover:border-sky-500/50"
                >
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-lg">#{order.orderNumber}</h3>
                      {getStatusBadge(order.status)}
                      {getPaymentStatusBadge(order.paymentStatus)}
                    </div>

                    <h4 className="font-medium text-sky-700 dark:text-sky-400">
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
                          <p className="text-sm font-medium">{t('admin.orders.client_label')}</p>
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
                          <p className="text-sm font-medium">{t('admin.orders.provider_label')}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.provider?.firstName} {order.provider?.lastName}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-semibold text-emerald-600 text-base dark:text-emerald-400">
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

                  <div className="flex justify-end">
                    <Link href={`/admin/orders/${order.id}`}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full border border-transparent hover:border-sky-500/30 hover:bg-sky-500/10 hover:text-sky-600 dark:hover:border-sky-500/40 dark:hover:text-sky-300"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}

              {filteredOrders.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 px-6 py-16 text-center dark:border-slate-800/70 dark:bg-slate-900/40">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/80 text-slate-700 shadow-sm dark:bg-slate-950/70 dark:text-slate-200">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{noOrdersTitle}</h3>
                  <p className="text-sm text-muted-foreground">{noOrdersDescription}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
