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

export default function AdminTestsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const { data: testsData, loading: testsLoading, refetch: refetchTests } = useAdminTests();

  const handleTestAction = async (testId: string, action: string) => {
    try {
      if (action === 'delete') {
        if (confirm('Ești sigur că vrei să ștergi acest test?')) {
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
      alert('Eroare: ' + error.message);
    }
  };

  const filteredTests = (testsData?.tests || []).filter((test: any) => {
    const matchesSearch = test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         test.service?.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesService = serviceFilter === 'all' || test.serviceId === serviceFilter;
    const matchesLevel = levelFilter === 'all' || test.level === levelFilter;
    const matchesStatus = statusFilter === 'all' || test.status === statusFilter;
    return matchesSearch && matchesService && matchesLevel && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Activ</Badge>;
      case 'INACTIVE':
        return <Badge className="bg-gray-100 text-gray-800"><XCircle className="w-3 h-3 mr-1" />Inactiv</Badge>;
      case 'DRAFT':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />Draft</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  type Level = 'JUNIOR' | 'MEDIU' | 'SENIOR' | 'EXPERT';

  const getLevelBadge = (level: Level) => {
    const colors: Record<Level, string> = {
      JUNIOR: 'bg-green-100 text-green-800',
      MEDIU: 'bg-blue-100 text-blue-800',
      SENIOR: 'bg-purple-100 text-purple-800',
      EXPERT: 'bg-orange-100 text-orange-800',
    };

    return <Badge className={colors[level] || 'bg-gray-100 text-gray-800'}>{level}</Badge>;
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
            <h1 className="text-3xl font-bold">Gestionare Teste</h1>
            <p className="text-muted-foreground">
              Administrează testele de competență pentru servicii
            </p>
          </div>
        </div>
        <Link href="/admin/tests/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Adaugă Test
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
                  placeholder="Caută teste după titlu, descriere sau serviciu..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtru nivel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate nivelurile</SelectItem>
                <SelectItem value="JUNIOR">Junior</SelectItem>
                <SelectItem value="MEDIU">Mediu</SelectItem>
                <SelectItem value="SENIOR">Senior</SelectItem>
                <SelectItem value="EXPERT">Expert</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtru status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toate statusurile</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
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
            <span>Lista Teste</span>
          </CardTitle>
          <CardDescription>
            {filteredTests.length} teste găsite
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
                        <span>{test.totalQuestions} întrebări</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4 text-orange-500" />
                        <span>{test.timeLimit} minute</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <BarChart3 className="w-4 h-4 text-purple-500" />
                        <span>Nota de trecere: {test.passingScore}%</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>Categorie: {test.service?.category?.name}</span>
                      <span>Creat: {new Date(test.createdAt).toLocaleDateString('ro-RO')}</span>
                      {test.results && (
                        <span>{test.results.length} rezultate</span>
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
                          Vezi Detalii
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/tests/${test.id}/edit`}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editează
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/tests/${test.id}/statistics`}>
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Statistici
                        </Link>
                      </DropdownMenuItem>
                      {test.status === 'ACTIVE' ? (
                        <DropdownMenuItem onClick={() => handleTestAction(test.id, 'deactivate')}>
                          <XCircle className="w-4 h-4 mr-2" />
                          Dezactivează
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => handleTestAction(test.id, 'activate')}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Activează
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => handleTestAction(test.id, 'delete')}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Șterge
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}

              {filteredTests.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nu s-au găsit teste</h3>
                  <p className="text-muted-foreground mb-4">
                    Încearcă să modifici filtrele sau termenii de căutare
                  </p>
                  <Link href="/admin/tests/new">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Adaugă Primul Test
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
