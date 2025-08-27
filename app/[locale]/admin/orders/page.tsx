"use client";

import { useState } from 'react';
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

export default function AdminOrdersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { data: ordersData, loading: ordersLoading } = useAdminOrders();

  const filteredOrders = (ordersData?.orders || []).filter((order: any) => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.service?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.client?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.client?.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800">Finalizat</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-100 text-blue-800">În progres</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">În așteptare</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-red-100 text-red-800">Anulat</Badge>;
      case 'DISPUTED':
        return <Badge className="bg-purple-100 text-purple-800">Disputat</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <Badge className="bg-green-100 text-green-800">Plătit</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">În așteptare</Badge>;
      case 'FAILED':
        return <Badge className="bg-red-100 text-red-800">Eșuat</Badge>;
      case 'REFUNDED':
        return <Badge className="bg-gray-100 text-gray-800">Rambursat</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
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
          <h1 className="text-3xl font-bold">Gestionare Comenzi</h1>
          <p className="text-muted-foreground">
            Monitorizează și administrează comenzile
          </p>
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
                  placeholder="Caută comenzi după număr, serviciu sau client..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtru status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate comenzile</SelectItem>
                <SelectItem value="PENDING">În așteptare</SelectItem>
                <SelectItem value="IN_PROGRESS">În progres</SelectItem>
                <SelectItem value="COMPLETED">Finalizate</SelectItem>
                <SelectItem value="CANCELLED">Anulate</SelectItem>
                <SelectItem value="DISPUTED">Disputate</SelectItem>
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
            <span>Lista Comenzi</span>
          </CardTitle>
          <CardDescription>
            {filteredOrders.length} comenzi găsite
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
                <div key={order.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
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
                          <p className="text-sm font-medium">Client</p>
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
                          <p className="text-sm font-medium">Prestator</p>
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
                        <span>
                          {new Date(order.createdAt).toLocaleDateString('ro-RO')}
                        </span>
                      </div>
                      {order.deliveryDate && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Termen: {new Date(order.deliveryDate).toLocaleDateString('ro-RO')}
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
                  <h3 className="text-lg font-medium mb-2">Nu s-au găsit comenzi</h3>
                  <p className="text-muted-foreground">
                    Încearcă să modifici filtrele sau termenii de căutare
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
