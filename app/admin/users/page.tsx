"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Users,
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  UserCheck,
  UserX,
  Ban,
  Trash2,
  Star,
  CheckCircle,
  Loader2,
  ArrowLeft,
  Filter
} from 'lucide-react';
import { useAdminUsers } from '@/hooks/use-api';
import { apiClient } from '@/lib/api';

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const { data: usersData, loading: usersLoading, refetch: refetchUsers } = useAdminUsers();

  const handleUserAction = async (userId: string, action: string) => {
    try {
      if (action === 'delete') {
        if (confirm('Ești sigur că vrei să ștergi acest utilizator?')) {
          await apiClient.deleteUser(userId);
          refetchUsers();
        }
      } else {
        await apiClient.updateUserStatus(userId, action);
        refetchUsers();
      }
    } catch (error: any) {
      alert('Eroare: ' + error.message);
    }
  };

  const filteredUsers = (usersData?.users || []).filter((user: any) => {
    const matchesSearch = user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = userFilter === 'all' || user.role === userFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">Activ</Badge>;
      case 'SUSPENDED':
        return <Badge className="bg-red-100 text-red-800">Suspendat</Badge>;
      case 'PENDING_VERIFICATION':
        return <Badge className="bg-yellow-100 text-yellow-800">În așteptare</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge className="bg-purple-100 text-purple-800">Admin</Badge>;
      case 'PROVIDER':
        return <Badge className="bg-blue-100 text-blue-800">Prestator</Badge>;
      case 'CLIENT':
        return <Badge variant="secondary">Client</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
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
            <h1 className="text-3xl font-bold">Gestionare Utilizatori</h1>
            <p className="text-muted-foreground">
              Administrează utilizatorii platformei
            </p>
          </div>
        </div>
        <Link href="/admin/users/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Adaugă Utilizator
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
                  placeholder="Caută utilizatori după nume sau email..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtru rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toți utilizatorii</SelectItem>
                <SelectItem value="CLIENT">Clienți</SelectItem>
                <SelectItem value="PROVIDER">Prestatori</SelectItem>
                <SelectItem value="ADMIN">Administratori</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Lista Utilizatori</span>
          </CardTitle>
          <CardDescription>
            {filteredUsers.length} utilizatori găsiți
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user: any) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.firstName[0]}{user.lastName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold">{user.firstName} {user.lastName}</h3>
                        {user.isVerified && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
                      <div className="flex space-x-2">
                        {getRoleBadge(user.role)}
                        {getStatusBadge(user.status)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right text-sm">
                      <div className="flex items-center space-x-1 mb-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{user.rating || 0}</span>
                      </div>
                      <p className="text-muted-foreground">{user.reviewCount || 0} recenzii</p>
                      <p className="text-xs text-muted-foreground">
                        Înregistrat: {new Date(user.created_at).toLocaleDateString('ro-RO')}
                      </p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleUserAction(user.id, 'view')}>
                          <Eye className="w-4 h-4 mr-2" />
                          Vezi Profil
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUserAction(user.id, 'verify')}>
                          <UserCheck className="w-4 h-4 mr-2" />
                          Verifică
                        </DropdownMenuItem>
                        {user.status === 'ACTIVE' ? (
                          <DropdownMenuItem onClick={() => handleUserAction(user.id, 'suspend')}>
                            <Ban className="w-4 h-4 mr-2" />
                            Suspendă
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleUserAction(user.id, 'activate')}>
                            <UserCheck className="w-4 h-4 mr-2" />
                            Activează
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleUserAction(user.id, 'delete')}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Șterge
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}

              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nu s-au găsit utilizatori</h3>
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
