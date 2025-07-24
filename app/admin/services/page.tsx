"use client";

import { useState } from 'react';
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

export default function AdminServicesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState('all');
  const { data: servicesData, loading: servicesLoading, refetch: refetchServices } = useAdminServices();

  const handleServiceAction = async (serviceId: string, action: string) => {
    try {
      if (action === 'delete') {
        if (confirm('Ești sigur că vrei să ștergi acest serviciu?')) {
          await apiClient.deleteService(serviceId);
          refetchServices();
        }
      } else {
        await apiClient.updateServiceStatus(serviceId, action);
        refetchServices();
      }
    } catch (error: any) {
      alert('Eroare: ' + error.message);
    }
  };

  const filteredServices = (servicesData?.services || []).filter((service: any) => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = serviceFilter === 'all' || service.status === serviceFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">Activ</Badge>;
      case 'DRAFT':
        return <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>;
      case 'SUSPENDED':
        return <Badge className="bg-red-100 text-red-800">Suspendat</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
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
            <h1 className="text-3xl font-bold">Gestionare Servicii</h1>
            <p className="text-muted-foreground">
              Administrează serviciile platformei
            </p>
          </div>
        </div>
        <Link href="/admin/services/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Adaugă Serviciu
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
                  placeholder="Caută servicii după titlu sau descriere..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtru status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate serviciile</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SUSPENDED">Suspendate</SelectItem>
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
            <span>Lista Servicii</span>
          </CardTitle>
          <CardDescription>
            {filteredServices.length} servicii găsite
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
                          ⭐ Recomandat
                        </Badge>
                      )}
                    </div>

                    <p className="text-muted-foreground mb-3 line-clamp-2">
                      {service.description}
                    </p>

                    <div className="flex items-center space-x-4 text-sm mb-3">
                      <span className="text-muted-foreground">
                        Slug: /{service.slug}
                      </span>
                      <span className="text-muted-foreground">
                        Categorie: {service.category?.name}
                      </span>
                    </div>

                    <div className="flex items-center space-x-4 text-sm">
                      {getStatusBadge(service.status)}
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span>{service.rating || 0}</span>
                        <span className="text-muted-foreground">({service.reviewCount || 0} recenzii)</span>
                      </div>
                      <span className="text-muted-foreground">
                        {service.orderCount || 0} comenzi
                      </span>
                      <span className="text-muted-foreground">
                        {service.viewCount || 0} vizualizări
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
                        Vezi Detalii
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/services/${service.id}/edit`}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editează
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleServiceAction(service.id, 'approve')}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Aprobă
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleServiceAction(service.id, 'feature')}>
                        <Star className="w-4 h-4 mr-2" />
                        {service.isFeatured ? 'Elimină din Recomandate' : 'Marchează ca Recomandat'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleServiceAction(service.id, 'suspend')}>
                        <Ban className="w-4 h-4 mr-2" />
                        Suspendă
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleServiceAction(service.id, 'delete')}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Șterge
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}

              {filteredServices.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nu s-au găsit servicii</h3>
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
