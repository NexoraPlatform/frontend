"use client";

import { useMemo, useState } from 'react';
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
    UserCheck,
    Ban,
    Trash2,
    Star,
    CheckCircle,
    Loader2,
    ArrowLeft,
    Filter, Pencil, UserRound, Eye
} from 'lucide-react';
import { useAdminUsers } from '@/hooks/use-api';
import { apiClient } from '@/lib/api';
import {useRouter, usePathname} from "next/navigation";
import {Can} from "@/components/Can";
import {useAsyncTranslation} from "@/hooks/use-async-translation";
import {Locale} from "@/types/locale";

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const { data: usersData, loading: usersLoading, refetch: refetchUsers } = useAdminUsers();
  const router = useRouter();
  const pathname = usePathname();
  const locale = (pathname.split('/')[1] as Locale) || 'ro';

  const manageTitle = useAsyncTranslation(locale, 'admin.users.manage_title');
  const manageSubtitle = useAsyncTranslation(locale, 'admin.users.manage_subtitle');
  const addUser = useAsyncTranslation(locale, 'admin.users.add_user');
  const searchPlaceholder = useAsyncTranslation(locale, 'admin.users.search_placeholder');
  const filterRole = useAsyncTranslation(locale, 'admin.users.filter_role');
  const filterAll = useAsyncTranslation(locale, 'admin.users.filter_all');
  const filterClients = useAsyncTranslation(locale, 'admin.users.filter_clients');
  const filterProviders = useAsyncTranslation(locale, 'admin.users.filter_providers');
  const filterAdmins = useAsyncTranslation(locale, 'admin.users.filter_admins');
  const listTitle = useAsyncTranslation(locale, 'admin.users.list_title');
  const listDescriptionTemplate = useAsyncTranslation(locale, 'admin.users.list_description');
  const confirmDeleteText = useAsyncTranslation(locale, 'admin.users.actions.confirm_delete');
  const errorPrefix = useAsyncTranslation(locale, 'admin.users.actions.error_prefix');
  const modifyProfile = useAsyncTranslation(locale, 'admin.users.actions.modify_profile');
  const viewProfile = useAsyncTranslation(locale, 'admin.users.actions.view_profile');
  const verifyLabel = useAsyncTranslation(locale, 'admin.users.actions.verify');
  const suspendLabel = useAsyncTranslation(locale, 'admin.users.actions.suspend');
  const activateLabel = useAsyncTranslation(locale, 'admin.users.actions.activate');
  const deleteLabel = useAsyncTranslation(locale, 'admin.users.actions.delete');
  const setSuperuser = useAsyncTranslation(locale, 'admin.users.actions.set_superuser');
  const removeSuperuser = useAsyncTranslation(locale, 'admin.users.actions.remove_superuser');
  const noUsersTitle = useAsyncTranslation(locale, 'admin.users.no_users_title');
  const noUsersDescription = useAsyncTranslation(locale, 'admin.users.no_users_description');
  const reviewsTemplate = useAsyncTranslation(locale, 'admin.users.reviews_label');
  const registeredTemplate = useAsyncTranslation(locale, 'admin.users.registered_prefix');
  const superuserBadge = useAsyncTranslation(locale, 'admin.users.roles.SUPERUSER');

  const statusLabels = {
    ACTIVE: useAsyncTranslation(locale, 'admin.users.statuses.ACTIVE'),
    SUSPENDED: useAsyncTranslation(locale, 'admin.users.statuses.SUSPENDED'),
    PENDING_VERIFICATION: useAsyncTranslation(locale, 'admin.users.statuses.PENDING_VERIFICATION'),
  } as const;

  const roleLabels = {
    ADMIN: useAsyncTranslation(locale, 'admin.users.roles.ADMIN'),
    PROVIDER: useAsyncTranslation(locale, 'admin.users.roles.PROVIDER'),
    CLIENT: useAsyncTranslation(locale, 'admin.users.roles.CLIENT'),
  } as const;

  const handleUserAction = async (userId: string, action: string, isSuperuser?: boolean) => {
    try {
      if (action === 'delete') {
        if (confirm(confirmDeleteText)) {
          await apiClient.deleteUser(userId);
          refetchUsers();
        }
      } else if(action === 'superuser') {
        if (isSuperuser === false) {
          await apiClient.setSuperadmin(userId);
        } else {
          await apiClient.removeSuperadmin(userId);
        }
        refetchUsers();
      } else {
        await apiClient.updateUserStatus(userId, action);
        refetchUsers();
      }
    } catch (error: any) {
      alert(errorPrefix + error.message);
    }
  };

  const filteredUsers = useMemo(() => {
    return (usersData?.users || []).filter((user: any) => {
      const matchesSearch =
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = userFilter === 'all' || user?.roles?.some((r: any) => r.slug?.toLowerCase() === filterRole);
      return matchesSearch && matchesFilter;
    });
  }, [usersData?.users, searchTerm, userFilter, filterRole]);

  const STATUS_STYLES: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    SUSPENDED: 'bg-red-100 text-red-800',
    PENDING_VERIFICATION: 'bg-yellow-100 text-yellow-800',
  };

  const ROLE_STYLES: Record<string, string> = {
    ADMIN: 'bg-purple-100 text-purple-800',
    PROVIDER: 'bg-blue-100 text-blue-800',
    CLIENT: 'bg-secondary',
  };

  const getStatusBadge = (status: string) => {
    const label = statusLabels[status as keyof typeof statusLabels] || status;
    return <Badge className={STATUS_STYLES[status] || 'bg-secondary'}>{label}</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const label = roleLabels[role as keyof typeof roleLabels] || role;
    return <Badge className={ROLE_STYLES[role] || 'bg-secondary'}>{label}</Badge>;
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
        <Link href="/admin/users/new">
          <Button
              variant="default"
              className="relative overflow-hidden px-5 py-2 rounded-md group"
          >
  <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 bg-purple-600 origin-center scale-x-0 transition-transform duration-500 ease-in-out group-hover:scale-x-100 transform-gpu will-change-transform"
  />
            <span className="relative z-10 flex flex-nowrap items-center">
    <Plus className="w-4 h-4 mr-2" />
    {addUser}
  </span>
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
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder={filterRole} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{filterAll}</SelectItem>
                <SelectItem value="CLIENT">{filterClients}</SelectItem>
                <SelectItem value="PROVIDER">{filterProviders}</SelectItem>
                <SelectItem value="ADMIN">{filterAdmins}</SelectItem>
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
            <span>{listTitle}</span>
          </CardTitle>
          <CardDescription>
            {listDescriptionTemplate.replace('{count}', filteredUsers.length.toString())}
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
                        {user.is_superuser && (<Badge variant="destructive" className="">{superuserBadge}</Badge>)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right text-sm">
                      <div className="flex items-center space-x-1 mb-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{user.rating || 0}</span>
                      </div>
                      <p className="text-muted-foreground text-left">{
                        reviewsTemplate.replace('{count}', (user.reviewCount || 0).toString())
                      }</p>
                      <p className="text-xs text-muted-foreground">
                        {registeredTemplate.replace('{date}', new Date(user.created_at).toLocaleDateString(locale === 'ro' ? 'ro-RO' : 'en-US'))}
                      </p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {user.id !== 1 && (
                            <Can superuser>
                              <DropdownMenuItem className={`${user.is_superuser ? 'bg-red-500' : 'bg-green-500'} text-white cursor-pointer`} onClick={() => handleUserAction(user.id, "superuser", user.is_superuser)}>
                                <UserRound className="w-4 h-4 mr-2" />
                                {user.is_superuser ? removeSuperuser : setSuperuser}
                              </DropdownMenuItem>
                            </Can>
                        )}

                        <DropdownMenuItem className="cursor-pointer" onClick={() => router.push(`/${locale}/admin/users/${user.id}`)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          {modifyProfile}
                        </DropdownMenuItem>
                          {user?.roles?.some((r: any) => r.slug?.toLowerCase() === 'provider') && (
                              <DropdownMenuItem className="cursor-pointer" onClick={() => router.push(`/${locale}/provider/${user.profile_url}`)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  {viewProfile}
                              </DropdownMenuItem>
                          )}
                        <DropdownMenuItem className="cursor-pointer" onClick={() => handleUserAction(user.id, 'verify')}>
                          <UserCheck className="w-4 h-4 mr-2" />
                          {verifyLabel}
                        </DropdownMenuItem>
                        {user.status === 'ACTIVE' ? (
                          <DropdownMenuItem className="cursor-pointer" onClick={() => handleUserAction(user.id, 'suspend')}>
                            <Ban className="w-4 h-4 mr-2" />
                            {suspendLabel}
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="cursor-pointer" onClick={() => handleUserAction(user.id, 'activate')}>
                            <UserCheck className="w-4 h-4 mr-2" />
                            {activateLabel}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleUserAction(user.id, 'delete')}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {deleteLabel}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}

              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">{noUsersTitle}</h3>
                  <p className="text-muted-foreground">
                    {noUsersDescription}
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
