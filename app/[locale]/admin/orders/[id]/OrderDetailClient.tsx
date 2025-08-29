"use client";

import {useState, useEffect, useCallback} from 'react';
import Link from 'next/link';
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
import { usePathname } from 'next/navigation';
import { Locale } from '@/types/locale';
import { useAsyncTranslation } from '@/hooks/use-async-translation';
import { t } from '@/lib/i18n';

const STATUS_STYLE_MAP: Record<OrderStatus, { color: string; icon: LucideIcon }> = {
    PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    ACCEPTED: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
    IN_PROGRESS: { color: 'bg-purple-100 text-purple-800', icon: Clock },
    DELIVERED: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    COMPLETED: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    CANCELLED: { color: 'bg-red-100 text-red-800', icon: XCircle },
    DISPUTED: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
};

const PAYMENT_STYLE_MAP: Record<PaymentStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PAID: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    REFUNDED: 'bg-gray-100 text-gray-800',
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
    const pathname = usePathname();
    const locale = (pathname.split('/')[1] as Locale) || 'ro';
    const dateLocale = locale === 'ro' ? 'ro-RO' : 'en-US';

    const [order, setOrder] = useState<OrderType | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [adminNotes, setAdminNotes] = useState('');

    const notFoundLabel = useAsyncTranslation(locale, 'admin.orders.not_found');
    const orderLabel = useAsyncTranslation(locale, 'admin.orders.order_label');
    const detailSubtitle = useAsyncTranslation(locale, 'admin.orders.detail_subtitle');
    const orderDetailsTitle = useAsyncTranslation(locale, 'admin.orders.details_title');
    const categoryLabel = useAsyncTranslation(locale, 'admin.orders.category_label');
    const requirementsTitle = useAsyncTranslation(locale, 'admin.orders.requirements_title');
    const clientNotesTitle = useAsyncTranslation(locale, 'admin.orders.client_notes_title');
    const providerNotesTitle = useAsyncTranslation(locale, 'admin.orders.provider_notes_title');
    const deliverablesTitle = useAsyncTranslation(locale, 'admin.orders.deliverables_title');
    const participantsTitle = useAsyncTranslation(locale, 'admin.orders.participants_title');
    const clientLabel = useAsyncTranslation(locale, 'admin.orders.client_label');
    const providerLabel = useAsyncTranslation(locale, 'admin.orders.provider_label');
    const messageButton = useAsyncTranslation(locale, 'admin.orders.message_button');
    const profileButton = useAsyncTranslation(locale, 'admin.orders.profile_button');
    const financialTitle = useAsyncTranslation(locale, 'admin.orders.financial_title');
    const orderValueLabel = useAsyncTranslation(locale, 'admin.orders.order_value_label');
    const platformFeeLabel = useAsyncTranslation(locale, 'admin.orders.platform_fee_label');
    const providerReceivesLabel = useAsyncTranslation(locale, 'admin.orders.provider_receives_label');
    const paymentStatusLabel = useAsyncTranslation(locale, 'admin.orders.payment_status_label');
    const timelineTitle = useAsyncTranslation(locale, 'admin.orders.timeline_title');
    const orderPlacedLabel = useAsyncTranslation(locale, 'admin.orders.order_placed_label');
    const deliveryDueLabel = useAsyncTranslation(locale, 'admin.orders.delivery_due_label');
    const currentStatusLabel = useAsyncTranslation(locale, 'admin.orders.current_status_label');
    const adminActionsTitle = useAsyncTranslation(locale, 'admin.orders.admin_actions_title');
    const updateStatusLabel = useAsyncTranslation(locale, 'admin.orders.update_status_label');
    const adminNotesLabel = useAsyncTranslation(locale, 'admin.orders.admin_notes_label');
    const adminNotesPlaceholder = useAsyncTranslation(locale, 'admin.orders.admin_notes_placeholder');
    const saveChanges = useAsyncTranslation(locale, 'admin.orders.save_changes');
    const updatingLabel = useAsyncTranslation(locale, 'admin.orders.updating');
    const downloadInvoice = useAsyncTranslation(locale, 'admin.orders.download_invoice');
    const messageHistory = useAsyncTranslation(locale, 'admin.orders.message_history');

    const statusLabels = {
        PENDING: useAsyncTranslation(locale, 'admin.orders.statuses.pending'),
        ACCEPTED: useAsyncTranslation(locale, 'admin.orders.statuses.accepted'),
        IN_PROGRESS: useAsyncTranslation(locale, 'admin.orders.statuses.in_progress'),
        DELIVERED: useAsyncTranslation(locale, 'admin.orders.statuses.delivered'),
        COMPLETED: useAsyncTranslation(locale, 'admin.orders.statuses.completed'),
        CANCELLED: useAsyncTranslation(locale, 'admin.orders.statuses.cancelled'),
        DISPUTED: useAsyncTranslation(locale, 'admin.orders.statuses.disputed'),
    } as const;

    const paymentStatusLabels = {
        PENDING: useAsyncTranslation(locale, 'admin.orders.payment_statuses.pending'),
        PAID: useAsyncTranslation(locale, 'admin.orders.payment_statuses.paid'),
        FAILED: useAsyncTranslation(locale, 'admin.orders.payment_statuses.failed'),
        REFUNDED: useAsyncTranslation(locale, 'admin.orders.payment_statuses.refunded'),
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
            setError(await t(locale, 'admin.orders.load_error'));
        } finally {
            setLoading(false);
        }
    }, [id, locale]);

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
            setError(await t(locale, 'admin.orders.update_error'));
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
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{notFoundLabel}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center space-x-4 mb-8">
                <Link href="/admin/orders">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold">{orderLabel} #{order.orderNumber}</h1>
                    <p className="text-muted-foreground">{detailSubtitle}</p>
                </div>
                <div className="flex items-center space-x-2">
                    {getStatusBadge(order.status)}
                    {getPaymentStatusBadge(order.paymentStatus)}
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
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <FileText className="w-5 h-5" />
                                <span>{orderDetailsTitle}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-lg text-blue-600 mb-2">
                                    {order.service.title}
                                </h4>
                                <p className="text-sm text-muted-foreground mb-2">
                                    {categoryLabel} {order.service.category.name}
                                </p>
                            </div>

                            <div>
                                <h5 className="font-medium mb-2">{requirementsTitle}</h5>
                                <p className="text-sm bg-muted p-3 rounded-lg">
                                    {order.requirements}
                                </p>
                            </div>

                            {order.clientNotes && (
                                <div>
                                    <h5 className="font-medium mb-2">{clientNotesTitle}</h5>
                                    <p className="text-sm bg-blue-50 p-3 rounded-lg">
                                        {order.clientNotes}
                                    </p>
                                </div>
                            )}

                            {order.providerNotes && (
                                <div>
                                    <h5 className="font-medium mb-2">{providerNotesTitle}</h5>
                                    <p className="text-sm bg-green-50 p-3 rounded-lg">
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
                                                <CheckCircle className="w-4 h-4 text-green-500" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <User className="w-5 h-5" />
                                <span>{participantsTitle}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid xs:grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <h5 className="font-medium text-blue-600">{clientLabel}</h5>
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
                                        <Button size="sm" variant="outline">
                                            <MessageSquare className="w-4 h-4 mr-1" />
                                            {messageButton}
                                        </Button>
                                        <Button size="sm" variant="outline">
                                            <Eye className="w-4 h-4 mr-1" />
                                            {profileButton}
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h5 className="font-medium text-green-600">{providerLabel}</h5>
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
                                        <Button size="sm" variant="outline">
                                            <MessageSquare className="w-4 h-4 mr-1" />
                                            {messageButton}
                                        </Button>
                                        <Button size="sm" variant="outline">
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
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <DollarSign className="w-5 h-5" />
                                <span>{financialTitle}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">{orderValueLabel}</span>
                                <span className="font-bold text-lg text-green-600">
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

                    <Card>
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

                    <Card>
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
                                <Button variant="outline" className="w-full">
                                    <Download className="w-4 h-4 mr-2" />
                                    {downloadInvoice}
                                </Button>
                                <Button variant="outline" className="w-full">
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
