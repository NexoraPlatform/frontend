"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

interface OrderDetailsPageProps {
  params: {
    id: string;
  };
}

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

export default function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const [order, setOrder] = useState<OrderType | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    loadOrder();
  }, [params.id]);

  const loadOrder = async () => {
    try {
      // Simulare încărcare comandă - înlocuiește cu API call real
      const mockOrder: OrderType = {
        id: params.id,
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
      setError('Nu s-a putut încărca comanda');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async () => {
    setUpdating(true);
    try {
      await apiClient.updateOrder(params.id, {
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
      setError('Nu s-a putut actualiza statusul');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    const statusConfig: Record<OrderStatus, {
      color: string;
      icon: LucideIcon;
      label: string;
    }> = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'În așteptare' },
      ACCEPTED: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Acceptat' },
      IN_PROGRESS: { color: 'bg-purple-100 text-purple-800', icon: Clock, label: 'În progres' },
      DELIVERED: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Livrat' },
      COMPLETED: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Finalizat' },
      CANCELLED: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Anulat' },
      DISPUTED: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle, label: 'Disputat' }
    };

    const config = statusConfig[status] || statusConfig['PENDING'];
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    const statusConfig: Record<PaymentStatus, {
      color: string;
      label: string;
    }> = {
      'PENDING': { color: 'bg-yellow-100 text-yellow-800', label: 'În așteptare' },
      'PAID': { color: 'bg-green-100 text-green-800', label: 'Plătit' },
      'FAILED': { color: 'bg-red-100 text-red-800', label: 'Eșuat' },
      'REFUNDED': { color: 'bg-gray-100 text-gray-800', label: 'Rambursat' }
    };

    const config = statusConfig[status] || statusConfig['PENDING'];

    return <Badge className={config.color}>{config.label}</Badge>;
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
          <AlertDescription>Comanda nu a fost găsită</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/admin/orders">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Comandă #{order.orderNumber}</h1>
          <p className="text-muted-foreground">
            Detalii complete despre comandă și progres
          </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coloana principală */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informații comandă */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Detalii Comandă</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-lg text-blue-600 mb-2">
                  {order.service.title}
                </h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Categorie: {order.service.category.name}
                </p>
              </div>

              <div>
                <h5 className="font-medium mb-2">Cerințe Client:</h5>
                <p className="text-sm bg-muted p-3 rounded-lg">
                  {order.requirements}
                </p>
              </div>

              {order.clientNotes && (
                <div>
                  <h5 className="font-medium mb-2">Notițe Client:</h5>
                  <p className="text-sm bg-blue-50 p-3 rounded-lg">
                    {order.clientNotes}
                  </p>
                </div>
              )}

              {order.providerNotes && (
                <div>
                  <h5 className="font-medium mb-2">Notițe Prestator:</h5>
                  <p className="text-sm bg-green-50 p-3 rounded-lg">
                    {order.providerNotes}
                  </p>
                </div>
              )}

              {order.deliverables && order.deliverables.length > 0 && (
                <div>
                  <h5 className="font-medium mb-2">Livrabile:</h5>
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

          {/* Participanți */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Participanți</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Client */}
                <div className="space-y-3">
                  <h5 className="font-medium text-blue-600">Client</h5>
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
                      Mesaj
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-1" />
                      Profil
                    </Button>
                  </div>
                </div>

                {/* Prestator */}
                <div className="space-y-3">
                  <h5 className="font-medium text-green-600">Prestator</h5>
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
                      Mesaj
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4 mr-1" />
                      Profil
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Informații financiare */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5" />
                <span>Informații Financiare</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Valoare comandă:</span>
                <span className="font-bold text-lg text-green-600">
                  {order.amount.toLocaleString()} RON
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Comision platformă (5%):</span>
                <span className="font-medium">
                  {(order.amount * 0.05).toLocaleString()} RON
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Prestator primește:</span>
                <span className="font-medium">
                  {(order.amount * 0.95).toLocaleString()} RON
                </span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Status plată:</span>
                  {getPaymentStatusBadge(order.paymentStatus)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Timeline</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Comandă plasată:</span>
                <span>{new Date(order.createdAt).toLocaleDateString('ro-RO')}</span>
              </div>
              {order.deliveryDate && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Termen livrare:</span>
                  <span>{new Date(order.deliveryDate).toLocaleDateString('ro-RO')}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Status actual:</span>
                {getStatusBadge(order.status)}
              </div>
            </CardContent>
          </Card>

          {/* Acțiuni Admin */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Edit className="w-5 h-5" />
                <span>Acțiuni Admin</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Actualizează Status:
                </label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">În așteptare</SelectItem>
                    <SelectItem value="ACCEPTED">Acceptat</SelectItem>
                    <SelectItem value="IN_PROGRESS">În progres</SelectItem>
                    <SelectItem value="DELIVERED">Livrat</SelectItem>
                    <SelectItem value="COMPLETED">Finalizat</SelectItem>
                    <SelectItem value="CANCELLED">Anulat</SelectItem>
                    <SelectItem value="DISPUTED">Disputat</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Notițe Admin:
                </label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Adaugă notițe pentru această comandă..."
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
                    Se actualizează...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvează Modificările
                  </>
                )}
              </Button>

              <div className="pt-4 border-t space-y-2">
                <Button variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Descarcă Factură
                </Button>
                <Button variant="outline" className="w-full">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Istoric Mesaje
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
