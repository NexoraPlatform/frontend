"use client";

import {useState, useEffect, useCallback} from 'react';
import { Link } from '@/lib/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    ArrowLeft,
    Calendar,
    DollarSign,
    User,
    FileText,
    MessageSquare,
    Download,
    Eye,
    Edit,
    Save,
    Loader2,
    AlertCircle,
    CheckCircle,
    Clock,
    XCircle, LucideIcon
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useLocale, useTranslations } from 'next-intl';

const STATUS_STYLE_MAP: Record<OrderStatus, { color: string; icon: LucideIcon }> = {
    PENDING: { color: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200', icon: Clock },
    ACCEPTED: { color: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200', icon: CheckCircle },
    IN_PROGRESS: { color: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-200', icon: Clock },
    DELIVERED: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200', icon: CheckCircle },
    COMPLETED: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200', icon: CheckCircle },
    CANCELLED: { color: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200', icon: XCircle },
    DISPUTED: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-200', icon: AlertCircle },
};

const PAYMENT_STYLE_MAP: Record<PaymentStatus, string> = {
    PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200',
    PAID: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
    FAILED: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200',
    REFUNDED: 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-200',
};

export type OrderType = {
    id: string;
    orderNumber: string;
    amount: number;
    status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
    paymentStatus: 'PENDING' | 'FAILED' | 'REFUNDED' | 'PAID';
    createdAt: string;
    deliveryDate: string;
    requirements: string;
    clientNotes: string;
    providerNotes: string;
    client: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        avatar: string;
    };
    provider: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        avatar: string;
    };
    service: {
        id: string;
        title: string;
        category: {
            name: string;
        };
    };
    deliverables: string[];
};

export type OrderStatus =
    | 'PENDING'
    | 'ACCEPTED'
    | 'IN_PROGRESS'
    | 'DELIVERED'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'DISPUTED';

export type PaymentStatus =
    | 'PENDING'
    | 'FAILED'
    | 'REFUNDED'
    | 'PAID';

export default function OrderDetailsPage({ id }: { id: string }) {
    const locale = useLocale();
  const t = useTranslations();
    const dateLocale = locale === 'ro' ? 'ro-RO' : 'en-US';

    const [order, setOrder] = useState<OrderType | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [adminNotes, setAdminNotes] = useState('');

    const notFoundLabel = t('admin.orders.not_found');
    const orderLabel = t('admin.orders.order_label');
    const detailSubtitle = t('admin.orders.detail_subtitle');
    const orderDetailsTitle = t('admin.orders.details_title');
    const categoryLabel = t('admin.orders.category_label');
    const requirementsTitle = t('admin.orders.requirements_title');
    const clientNotesTitle = t('admin.orders.client_notes_title');
    const providerNotesTitle = t('admin.orders.provider_notes_title');
    const deliverablesTitle = t('admin.orders.deliverables_title');
    const participantsTitle = t('admin.orders.participants_title');
    const clientLabel = t('admin.orders.client_label');
    const providerLabel = t('admin.orders.provider_label');
    const messageButton = t('admin.orders.message_button');
    const profileButton = t('admin.orders.profile_button');
    const financialTitle = t('admin.orders.financial_title');
    const orderValueLabel = t('admin.orders.order_value_label');
    const platformFeeLabel = t('admin.orders.platform_fee_label');
    const providerReceivesLabel = t('admin.orders.provider_receives_label');
    const paymentStatusLabel = t('admin.orders.payment_status_label');
    const timelineTitle = t('admin.orders.timeline_title');
    const orderPlacedLabel = t('admin.orders.order_placed_label');
    const deliveryDueLabel = t('admin.orders.delivery_due_label');
    const currentStatusLabel = t('admin.orders.current_status_label');
    const adminActionsTitle = t('admin.orders.admin_actions_title');
    const updateStatusLabel = t('admin.orders.update_status_label');
    const adminNotesLabel = t('admin.orders.admin_notes_label');
    const adminNotesPlaceholder = t('admin.orders.admin_notes_placeholder');
    const saveChanges = t('admin.orders.save_changes');
    const updatingLabel = t('admin.orders.updating');
    const downloadInvoice = t('admin.orders.download_invoice');
    const messageHistory = t('admin.orders.message_history');

    const statusLabels = {
        PENDING: t('admin.orders.statuses.pending'),
        ACCEPTED: t('admin.orders.statuses.accepted'),
        IN_PROGRESS: t('admin.orders.statuses.in_progress'),
        DELIVERED: t('admin.orders.statuses.delivered'),
        COMPLETED: t('admin.orders.statuses.completed'),
        CANCELLED: t('admin.orders.statuses.cancelled'),
        DISPUTED: t('admin.orders.statuses.disputed'),
    } as const;

    const paymentStatusLabels = {
        PENDING: t('admin.orders.payment_statuses.pending'),
        PAID: t('admin.orders.payment_statuses.paid'),
        FAILED: t('admin.orders.payment_statuses.failed'),
        REFUNDED: t('admin.orders.payment_statuses.refunded'),
    } as const;

    const loadOrder = useCallback(async () => {
        try {
            const mockOrder: OrderType = {
                id: id,
                orderNumber: `ORD-${Date.now()}`,
                amount: 2500,
                status: 'IN_PROGRESS',
                paymentStatus: 'PAID',
                createdAt: new Date().toISOString(),
                deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                requirements: 'Vreau un website modern pentru afacerea mea...',
                clientNotes: 'Prefer culorile albastre și design minimalist',
                providerNotes: 'Am început lucrul la design. Voi trimite primul draft în 2 zile.',
                client: {
                    id: '1',
                    firstName: 'Maria',
                    lastName: 'Popescu',
                    email: 'maria@example.com',
                    avatar: 'https://images.pexels.com/photos/3785077/pexels-photo-3785077.jpeg?auto=compress&cs=tinysrgb&w=150'
                },
                provider: {
                    id: '2',
                    firstName: 'Alexandru',
                    lastName: 'Ionescu',
                    email: 'alex@example.com',
                    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150'
                },
                service: {
                    id: '1',
                    title: 'Dezvoltare Website Modern cu React',
                    category: { name: 'Dezvoltare Web' }
                },
                deliverables: [
                    'Design mockup-uri',
                    'Cod sursă complet',
                    'Documentație tehnică'
                ]
            };

            setOrder(mockOrder);
            setNewStatus(mockOrder.status);
        } catch (error: any) {
            setError(t('admin.orders.load_error'));
        } finally {
            setLoading(false);
        }
    }, [id, t]);

    useEffect(() => {
        loadOrder();
    }, [id, loadOrder]);

    const updateOrderStatus = async () => {
        setUpdating(true);
        try {
            await apiClient.updateOrder(id, {
                status: newStatus,
                adminNotes
            });

            setOrder(prev => {
                if (!prev) return prev;

                return {
                    ...prev,
                    status: newStatus as OrderStatus,
                };
            });
            setError('');
        } catch (error: any) {
            setError(t('admin.orders.update_error'));
        } finally {
            setUpdating(false);
        }
    };

    const getStatusBadge = (status: OrderStatus) => {
        const style = STATUS_STYLE_MAP[status] || STATUS_STYLE_MAP['PENDING'];
        const label = statusLabels[status];
        const Icon = style.icon;
        return (
            <Badge className={style.color}>
                <Icon className="w-3 h-3 mr-1" />
                {label}
            </Badge>
        );
    };

    const getPaymentStatusBadge = (status: PaymentStatus) => {
        const className = PAYMENT_STYLE_MAP[status] || PAYMENT_STYLE_MAP['PENDING'];
        const label = paymentStatusLabels[status];
        return <Badge className={className}>{label}</Badge>;
    };

    if (loading) {
        return (
            <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{notFoundLabel}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
            <div className="relative mb-10 overflow-hidden rounded-3xl border border-border/60 bg-card/70 p-6 shadow-[0_20px_80px_-60px_rgba(15,23,42,0.4)] backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/60 dark:shadow-[0_20px_80px_-40px_rgba(15,23,42,0.9)] sm:p-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_rgba(255,255,255,0)_60%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.2),_rgba(15,23,42,0)_60%)]" />
                <div className="relative flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href={`/${locale}/admin/orders`}>
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
                    <div className="flex items-center gap-2">
                        {getStatusBadge(order.status)}
                        {getPaymentStatusBadge(order.paymentStatus)}
                    </div>
                </div>
                <div className="relative mt-4">
                    <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
                        {orderLabel} #{order.orderNumber}
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                        {detailSubtitle}
                    </p>
                </div>
            </div>

            {error && (
                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="grid xs:grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border border-border/60 bg-card/80 shadow-[0_16px_40px_-32px_rgba(15,23,42,0.25)] dark:border-slate-800/70 dark:bg-slate-900/70 dark:shadow-[0_16px_40px_-32px_rgba(15,23,42,0.9)]">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <FileText className="w-5 h-5" />
                                <span>{orderDetailsTitle}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-lg text-sky-700 dark:text-sky-400 mb-2">
                                    {order.service.title}
                                </h4>
                                <p className="text-sm text-muted-foreground mb-2">
                                    {categoryLabel} {order.service.category.name}
                                </p>
                            </div>

                            <div>
                                <h5 className="font-medium mb-2">{requirementsTitle}</h5>
                                <p className="text-sm rounded-lg border border-border/50 bg-muted/40 p-3 text-muted-foreground dark:border-slate-800/70 dark:bg-slate-900/60">
                                    {order.requirements}
                                </p>
                            </div>

                            {order.clientNotes && (
                                <div>
                                    <h5 className="font-medium mb-2">{clientNotesTitle}</h5>
                                    <p className="text-sm rounded-lg border border-sky-200/50 bg-sky-50 p-3 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100">
                                        {order.clientNotes}
                                    </p>
                                </div>
                            )}

                            {order.providerNotes && (
                                <div>
                                    <h5 className="font-medium mb-2">{providerNotesTitle}</h5>
                                    <p className="text-sm rounded-lg border border-emerald-200/50 bg-emerald-50 p-3 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
                                        {order.providerNotes}
                                    </p>
                                </div>
                            )}

                            {order.deliverables && order.deliverables.length > 0 && (
                                <div>
                                    <h5 className="font-medium mb-2">{deliverablesTitle}</h5>
                                    <ul className="space-y-1">
                                        {order.deliverables.map((item, index) => (
                                            <li key={index} className="flex items-center space-x-2 text-sm">
                                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border border-border/60 bg-card/80 shadow-[0_16px_40px_-32px_rgba(15,23,42,0.25)] dark:border-slate-800/70 dark:bg-slate-900/70 dark:shadow-[0_16px_40px_-32px_rgba(15,23,42,0.9)]">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <User className="w-5 h-5" />
                                <span>{participantsTitle}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid xs:grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <h5 className="font-medium text-sky-600 dark:text-sky-300">{clientLabel}</h5>
                                    <div className="flex items-center space-x-3">
                                        <Avatar className="w-12 h-12">
                                            <AvatarImage src={order.client.avatar} />
                                            <AvatarFallback>
                                                {order.client.firstName[0]}{order.client.lastName[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">
                                                {order.client.firstName} {order.client.lastName}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {order.client.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button size="sm" variant="outline" className="hover:border-sky-500/40 hover:text-sky-600 dark:hover:border-sky-500/40 dark:hover:text-sky-200">
                                            <MessageSquare className="w-4 h-4 mr-1" />
                                            {messageButton}
                                        </Button>
                                        <Button size="sm" variant="outline" className="hover:border-sky-500/40 hover:text-sky-600 dark:hover:border-sky-500/40 dark:hover:text-sky-200">
                                            <Eye className="w-4 h-4 mr-1" />
                                            {profileButton}
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h5 className="font-medium text-emerald-600 dark:text-emerald-300">{providerLabel}</h5>
                                    <div className="flex items-center space-x-3">
                                        <Avatar className="w-12 h-12">
                                            <AvatarImage src={order.provider.avatar} />
                                            <AvatarFallback>
                                                {order.provider.firstName[0]}{order.provider.lastName[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">
                                                {order.provider.firstName} {order.provider.lastName}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {order.provider.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button size="sm" variant="outline" className="hover:border-emerald-500/40 hover:text-emerald-600 dark:hover:border-emerald-500/40 dark:hover:text-emerald-200">
                                            <MessageSquare className="w-4 h-4 mr-1" />
                                            {messageButton}
                                        </Button>
                                        <Button size="sm" variant="outline" className="hover:border-emerald-500/40 hover:text-emerald-600 dark:hover:border-emerald-500/40 dark:hover:text-emerald-200">
                                            <Eye className="w-4 h-4 mr-1" />
                                            {profileButton}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="border border-border/60 bg-card/80 shadow-[0_16px_40px_-32px_rgba(15,23,42,0.25)] dark:border-slate-800/70 dark:bg-slate-900/70 dark:shadow-[0_16px_40px_-32px_rgba(15,23,42,0.9)]">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <DollarSign className="w-5 h-5" />
                                <span>{financialTitle}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">{orderValueLabel}</span>
                                <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
                                  {order.amount.toLocaleString()} RON
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">{platformFeeLabel}</span>
                                <span className="font-medium">
                                  {(order.amount * 0.05).toLocaleString()} RON
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">{providerReceivesLabel}</span>
                                <span className="font-medium">
                                  {(order.amount * 0.95).toLocaleString()} RON
                                </span>
                            </div>
                            <div className="pt-2 border-t">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">{paymentStatusLabel}</span>
                                    {getPaymentStatusBadge(order.paymentStatus)}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-border/60 bg-card/80 shadow-[0_16px_40px_-32px_rgba(15,23,42,0.25)] dark:border-slate-800/70 dark:bg-slate-900/70 dark:shadow-[0_16px_40px_-32px_rgba(15,23,42,0.9)]">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Calendar className="w-5 h-5" />
                                <span>{timelineTitle}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">{orderPlacedLabel}</span>
                                <span>{new Date(order.createdAt).toLocaleDateString(dateLocale)}</span>
                            </div>
                            {order.deliveryDate && (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">{deliveryDueLabel}</span>
                                    <span>{new Date(order.deliveryDate).toLocaleDateString(dateLocale)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">{currentStatusLabel}</span>
                                {getStatusBadge(order.status)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-border/60 bg-card/80 shadow-[0_16px_40px_-32px_rgba(15,23,42,0.25)] dark:border-slate-800/70 dark:bg-slate-900/70 dark:shadow-[0_16px_40px_-32px_rgba(15,23,42,0.9)]">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Edit className="w-5 h-5" />
                                <span>{adminActionsTitle}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    {updateStatusLabel}
                                </label>
                                <Select value={newStatus} onValueChange={setNewStatus}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PENDING">{statusLabels.PENDING}</SelectItem>
                                        <SelectItem value="ACCEPTED">{statusLabels.ACCEPTED}</SelectItem>
                                        <SelectItem value="IN_PROGRESS">{statusLabels.IN_PROGRESS}</SelectItem>
                                        <SelectItem value="DELIVERED">{statusLabels.DELIVERED}</SelectItem>
                                        <SelectItem value="COMPLETED">{statusLabels.COMPLETED}</SelectItem>
                                        <SelectItem value="CANCELLED">{statusLabels.CANCELLED}</SelectItem>
                                        <SelectItem value="DISPUTED">{statusLabels.DISPUTED}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">
                                    {adminNotesLabel}
                                </label>
                                <Textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder={adminNotesPlaceholder}
                                    rows={3}
                                />
                            </div>

                            <Button
                                onClick={updateOrderStatus}
                                disabled={updating}
                                className="w-full"
                            >
                                {updating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        {updatingLabel}
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        {saveChanges}
                                    </>
                                )}
                            </Button>

                            <div className="pt-4 border-t space-y-2">
                                <Button variant="outline" className="w-full hover:border-sky-500/40 hover:text-sky-600 dark:hover:border-sky-500/40 dark:hover:text-sky-200">
                                    <Download className="w-4 h-4 mr-2" />
                                    {downloadInvoice}
                                </Button>
                                <Button variant="outline" className="w-full hover:border-sky-500/40 hover:text-sky-600 dark:hover:border-sky-500/40 dark:hover:text-sky-200">
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    {messageHistory}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
