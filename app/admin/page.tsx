"use client";

import {useEffect, useState} from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  Shield,
  Settings,
  BarChart3,
  Plus,
  FolderPlus,
  UserPlus,
  Eye,
  ArrowRight,
  Activity,
  Bell,
  BookOpen,
  IdCardLanyard,
  TrendingDown
} from 'lucide-react';
import CallIcon from "@mui/icons-material/Call";
import apiClient from "@/lib/api";
import {Can} from "@/components/Can";

interface AdminStats {
  totalUsers: number;
  currentMonthUsers: number;
  currentMonthVsLastMonthUsers: number;
  activeServices: number;
  currentMonthServices: number;
  currentMonthVsLastMonthServices: number;
  totalProjects: number;
  currentMonthProjects: number;
  totalPendingProjects: number;
  currentMonthVsLastMonthProjects: number;
  totalRevenue: number;
  currentMonthRevenue: number
  currentMonthVsLastMonthRevenue: number;
  pendingUsers: number;
  pendingServices: number;
  pendingCalls: number;
  totalScheduleCalls: number;
}

export default function AdminDashboard() {
  const [statsData, setStatsData] = useState<AdminStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
        try {
            const response = await apiClient.getAdminStats();

            if (!response.ok) {
              throw new Error('Failed to fetch stats');
            }
            setStatsData(response);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    }

    fetchStats();
  }, []);


  const stats = [
    {
      title: 'Utilizatori Totali',
      value: statsData?.totalUsers || '0',
      change: statsData?.currentMonthVsLastMonthUsers,
      current: statsData?.currentMonthUsers || 0,
      icon: Users,
      color: 'text-blue-600',
      href: '/admin/users'
    },
    {
      title: 'Servicii Active',
      value: statsData?.activeServices || '0',
      change: statsData?.currentMonthVsLastMonthServices,
      current: statsData?.currentMonthServices || 0,
      icon: FileText,
      color: 'text-green-600',
      href: '/admin/services'
    },
    {
      title: 'Venituri Totale',
      value: `${statsData?.totalRevenue || '0'} RON`,
      change: statsData?.currentMonthVsLastMonthRevenue,
      current: statsData?.currentMonthRevenue || 0,
      icon: DollarSign,
      color: 'text-yellow-600',
      href: '/admin/orders'
    },
    {
      title: 'Proiecte Procesate',
      value: statsData?.totalProjects || 0,
      change: statsData?.currentMonthVsLastMonthProjects || 0,
      current: statsData?.currentMonthProjects || 0,
      icon: TrendingUp,
      color: 'text-purple-600',
      href: '/admin/orders'
    }
  ];

  const quickActions = [
    {
      title: 'Adaugă Utilizator',
      description: 'Creează un cont nou pentru un utilizator',
      icon: UserPlus,
      href: '/admin/users/new',
      color: 'bg-blue-500'
    },
    {
      title: 'Adaugă Categorie',
      description: 'Creează o categorie nouă pentru servicii',
      icon: FolderPlus,
      href: '/admin/categories/new',
      color: 'bg-green-500'
    },
    {
      title: 'Adaugă Test',
      description: 'Creează un test de competență nou',
      icon: BookOpen,
      href: '/admin/tests/new',
      color: 'bg-purple-500'
    },
    {
      title: 'Vezi Rapoarte',
      description: 'Analizează performanța platformei',
      icon: BarChart3,
      href: '/admin/analytics',
      color: 'bg-orange-500'
    }
  ];

  const adminSections = [
    {
      title: 'Gestionare Utilizatori',
      description: 'Administrează utilizatorii platformei',
      icon: Users,
      href: '/admin/users',
      stats: `${statsData?.totalUsers || 0} utilizatori`,
      pending: statsData?.pendingUsers || 0,
      role: 'admin'
    },
    {
      title: 'Gestionare Servicii',
      description: 'Administrează serviciile cu tarife personalizate',
      icon: FileText,
      href: '/admin/services',
      stats: `${statsData?.activeServices || 0} servicii active`,
      pending: statsData?.pendingServices || 0,
      role: 'admin'
    },
    {
      title: 'Gestionare Categorii',
      description: 'Organizează categoriile de servicii',
      icon: FolderPlus,
      href: '/admin/categories',
      stats: 'Categorii și subcategorii',
      pending: 0,
      role: 'admin'
    },
    {
      title: 'Gestionare Teste',
      description: 'Administrează testele de competență',
      icon: BookOpen,
      href: '/admin/tests',
      stats: 'Teste pentru toate nivelurile',
      pending: 0,
      role: 'admin'
    },
    {
      title: 'Gestionare Call-uri',
      description: 'Administrează call-urile de verificare',
      icon: CallIcon,
      href: '/admin/calls',
      stats: `${statsData?.totalScheduleCalls || 0} call-uri programate`,
      pending: statsData?.pendingCalls || 0,
      role: 'admin'
    },
    {
      title: 'Gestionare Proiecte',
      description: 'Monitorizează proiectele și plățile',
      icon: TrendingUp,
      href: '/admin/orders',
      stats: `${statsData?.totalProjects || 0} proiecte procesate`,
      pending: statsData?.totalPendingProjects || 0,
      role: 'admin'
    },
    {
      title: 'Gestionare Dispute',
      description: 'Rezolvă disputele între utilizatori',
      icon: Shield,
      href: '/admin/disputes',
      stats: 'Dispute și reclamații',
      pending: 0,
      role: 'admin'
    },
    {
      title: 'Gestionare Roluri',
      description: 'Creaza sau editeaza roluri',
      icon: IdCardLanyard,
      href: '/admin/roles',
      stats: 'Roluri și permisiuni',
      pending: 0,
      role: 'superuser'
    },
    {
      title: 'Analytics & Rapoarte',
      description: 'Analizează performanța platformei',
      icon: BarChart3,
      href: '/admin/analytics',
      stats: 'Statistici detaliate',
      pending: 0,
      role: 'admin'
    }
  ];

  const recentActivity = [
    {
      type: 'user',
      message: 'Utilizator nou înregistrat',
      time: 'Acum 5 minute',
      icon: Users,
      color: 'text-blue-500'
    },
    {
      type: 'order',
      message: 'Comandă nouă finalizată',
      time: 'Acum 12 minute',
      icon: TrendingUp,
      color: 'text-green-500'
    },
    {
      type: 'service',
      message: 'Serviciu nou cu tarif personalizat',
      time: 'Acum 25 minute',
      icon: FileText,
      color: 'text-yellow-500'
    },
    {
      type: 'test',
      message: 'Test nou de competență creat',
      time: 'Acum 45 minute',
      icon: BookOpen,
      color: 'text-purple-500'
    },
    {
      type: 'dispute',
      message: 'Dispută nouă raportată',
      time: 'Acum 1 oră',
      icon: Shield,
      color: 'text-red-500'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Panou de Administrare</h1>
        <p className="text-muted-foreground">
          Gestionează platforma Nexora cu tarife flexibile și teste de competență
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Link key={index} href={stat.href}>
            <Card className="border-2 hover:shadow-lg transition-all duration-300 hover:border-primary/20 cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold flex">{stat.value}
                      <span className={`ms-2 ${stat?.current <= 0 ? 'text-red-500' : 'text-green-500'} text-xs flex items-center`}>
                        <span className="text-muted-foreground">(</span>
                        {stat?.current} &nbsp;{stat?.current <= 0
                          ? <TrendingDown className="text-red-500 w-5 h-5" />
                          : <TrendingUp className="text-green-500 w-5 h-5" />}
                        <span className="text-muted-foreground">)</span>
                      </span>
                    </p>
                    {stat?.change && (<p className="text-xs text-muted-foreground mt-1">
                      <span className={`${stat?.change < 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {stat?.change}% această lună
                      </span>
                    </p>)}
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Acțiuni Rapide</span>
              </CardTitle>
              <CardDescription>
                Acțiuni frecvente pentru administrarea platformei
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <Link key={index} href={action.href}>
                    <Card className="border-2 hover:shadow-md transition-all duration-300 hover:border-primary/20 cursor-pointer group">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <action.icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{action.title}</h3>
                            <p className="text-sm text-muted-foreground">{action.description}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Admin Sections */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Secțiuni Administrare</span>
              </CardTitle>
              <CardDescription>
                Accesează toate secțiunile de administrare
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adminSections.map((section, index) => (
                    <Can
                        key={index}
                        {...(
                            section.role === 'superuser'
                                ? { superuser: true }
                                : { roles: [section.role as string] }
                        )}
                    >
                    <Link href={section.href}>
                      <Card className="border hover:shadow-md transition-all duration-300 hover:border-primary/20 cursor-pointer group">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <section.icon className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-semibold mb-1">{section.title}</h3>
                                <p className="text-sm text-muted-foreground mb-2">{section.description}</p>
                                <p className="text-xs text-muted-foreground">{section.stats}</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                              {section.pending > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {section.pending} în așteptare
                                </Badge>
                              )}
                              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </Can>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>Activitate Recentă</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center ${activity.color}`}>
                      <activity.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <Link href="/admin/activity">
                  <Button variant="outline" className="w-full">
                    <Eye className="w-4 h-4 mr-2" />
                    Vezi Toată Activitatea
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Status Sistem</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Server Status</span>
                  <Badge className="bg-green-100 text-green-800">Online</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database</span>
                  <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">API Response</span>
                  <Badge className="bg-green-100 text-green-800">Fast</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Tarife Prestatori</span>
                  <Badge className="bg-blue-100 text-blue-800">Flexibile</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Teste Competență</span>
                  <Badge className="bg-purple-100 text-purple-800">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
