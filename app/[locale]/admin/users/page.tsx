"use client";

import { useMemo, useState } from 'react';
import { Link } from '@/lib/navigation';
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
import { useRouter } from '@/lib/navigation';
import { useLocale, useTranslations } from "next-intl";
import {Can} from "@/components/Can";
import { TrustoraThemeStyles } from '@/components/trustora/theme-styles';

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const { data: usersData, loading: usersLoading, refetch: refetchUsers } = useAdminUsers();
  const router = useRouter();
    const locale = useLocale();
  const t = useTranslations();
  const manageTitle = t('admin.users.manage_title');
  const manageSubtitle = t('admin.users.manage_subtitle');
  const addUser = t('admin.users.add_user');
  const searchPlaceholder = t('admin.users.search_placeholder');
  const filterRole = t('admin.users.filter_role');
  const filterAll = t('admin.users.filter_all');
  const filterClients = t('admin.users.filter_clients');
  const filterProviders = t('admin.users.filter_providers');
  const filterAdmins = t('admin.users.filter_admins');
  const listTitle = t('admin.users.list_title');
  const listDescriptionTemplate = t('admin.users.list_description');
  const confirmDeleteText = t('admin.users.actions.confirm_delete');
  const errorPrefix = t('admin.users.actions.error_prefix');
  const modifyProfile = t('admin.users.actions.modify_profile');
  const viewProfile = t('admin.users.actions.view_profile');
  const verifyLabel = t('admin.users.actions.verify');
  const suspendLabel = t('admin.users.actions.suspend');
  const activateLabel = t('admin.users.actions.activate');
  const deleteLabel = t('admin.users.actions.delete');
  const setSuperuser = t('admin.users.actions.set_superuser');
  const removeSuperuser = t('admin.users.actions.remove_superuser');
  const noUsersTitle = t('admin.users.no_users_title');
  const noUsersDescription = t('admin.users.no_users_description');
  const reviewsTemplate = t('admin.users.reviews_label');
  const registeredTemplate = t('admin.users.registered_prefix');
  const superuserBadge = t('admin.users.roles.SUPERUSER');

  const statusLabels = {
    ACTIVE: t('admin.users.statuses.ACTIVE'),
    SUSPENDED: t('admin.users.statuses.SUSPENDED'),
    PENDING_VERIFICATION: t('admin.users.statuses.PENDING_VERIFICATION'),
  } as const;

  const roleLabels = {
    ADMIN: t('admin.users.roles.ADMIN'),
    PROVIDER: t('admin.users.roles.PROVIDER'),
    CLIENT: t('admin.users.roles.CLIENT'),
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
    ACTIVE: 'border border-emerald-200/60 bg-emerald-100 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-200',
    SUSPENDED: 'border border-red-200/60 bg-red-100 text-red-800 dark:border-red-500/40 dark:bg-red-500/20 dark:text-red-200',
    PENDING_VERIFICATION: 'border border-amber-200/60 bg-amber-100 text-amber-800 dark:border-amber-400/40 dark:bg-amber-500/20 dark:text-amber-200',
  };

  const ROLE_STYLES: Record<string, string> = {
    ADMIN: 'border border-purple-200/60 bg-purple-100 text-purple-800 dark:border-purple-400/40 dark:bg-purple-500/20 dark:text-purple-200',
    PROVIDER: 'border border-blue-200/60 bg-blue-100 text-blue-800 dark:border-blue-400/40 dark:bg-blue-500/20 dark:text-blue-200',
    CLIENT: 'border border-slate-200/70 bg-slate-100 text-slate-700 dark:border-slate-600/50 dark:bg-slate-800/70 dark:text-slate-200',
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
    <>
      <TrustoraThemeStyles />
      <div className="min-h-screen bg-[var(--bg-light)] dark:bg-[#070C14]">
        <div className="container mx-auto px-4 py-10">
          {/* Header */}
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Link href="/admin">
                <Button
                  variant="outline"
                  size="icon"
                  className="border-slate-200/70 bg-white/70 shadow-sm backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/60"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">{manageTitle}</h1>
                <p className="text-sm text-muted-foreground">
                  {manageSubtitle}
                </p>
              </div>
            </div>
            <Link href="/admin/users/new">
              <Button className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                {addUser}
              </Button>
            </Link>
          </div>

          {/* Filters */}
          <Card className="mb-6 glass-card shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder={searchPlaceholder}
                      className="pl-10 bg-white/80 dark:bg-slate-900/60"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="w-full md:w-48 bg-white/80 dark:bg-slate-900/60">
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
          <Card className="glass-card shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-white">
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
                    <div
                      key={user.id}
                      className="flex flex-col gap-4 rounded-xl border border-slate-200/60 bg-white/80 p-5 transition-colors hover:border-emerald-200/70 hover:bg-white/90 dark:border-slate-700/60 dark:bg-slate-900/50 dark:hover:border-emerald-500/40"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{user.firstName[0]}{user.lastName[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold text-slate-900 dark:text-white">{user.firstName} {user.lastName}</h3>
                              {user.isVerified && (
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
                            <div className="flex flex-wrap gap-2">
                              {getRoleBadge(user.role)}
                              {getStatusBadge(user.status)}
                              {user.is_superuser && (
                                <Badge className="border border-red-200/60 bg-red-100 text-red-800 dark:border-red-500/40 dark:bg-red-500/20 dark:text-red-200">
                                  {superuserBadge}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-4 lg:justify-end">
                          <div className="text-right text-sm">
                            <div className="flex items-center justify-end space-x-1 mb-1">
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
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {user.id !== 1 && (
                                <Can superuser>
                                  <DropdownMenuItem
                                    className={`${user.is_superuser ? 'bg-red-500' : 'bg-emerald-500'} text-white cursor-pointer`}
                                    onClick={() => handleUserAction(user.id, "superuser", user.is_superuser)}
                                  >
                                    <UserRound className="w-4 h-4 mr-2" />
                                    {user.is_superuser ? removeSuperuser : setSuperuser}
                                  </DropdownMenuItem>
                                </Can>
                              )}

                              <DropdownMenuItem className="cursor-pointer" onClick={() => router.push(`/admin/users/${user.id}`)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                {modifyProfile}
                              </DropdownMenuItem>
                              {user?.roles?.some((r: any) => r.slug?.toLowerCase() === 'provider') && (
                                <DropdownMenuItem className="cursor-pointer" onClick={() => router.push(`/provider/${user.profile_url}`)}>
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
      </div>
    </>
  );
}
