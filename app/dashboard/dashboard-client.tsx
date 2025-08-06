"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  User,
  Briefcase,
  DollarSign,
  Star,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  MessageSquare,
  Calendar,
  Target,
  Users,
  FileText,
  Settings,
  Bell,
  Heart,
  Bookmark,
  BarChart3,
  Zap,
  Award,
  Shield,
  Globe,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Edit,
  Trash2,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  Building,
  Code,
  Palette,
  Smartphone,
  TrendingDown,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { ProjectRequestCard } from '@/components/project-request-card';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ro } from 'date-fns/locale';
import Link from 'next/link';

export default function DashboardClient() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [projectsError, setProjectsError] = useState('');

  // Filters and pagination for projects
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const projectsPerPage = 6;

  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && activeTab === 'projects') {
      loadProjects();
    }
  }, [user, activeTab, searchTerm, statusFilter, sortBy, sortOrder, currentPage]);

  const loadProjects = async () => {
    setLoadingProjects(true);
    setProjectsError('');
    try {
      let response;
      if (user?.role === 'PROVIDER') {
        response = await apiClient.getProviderProjectRequests();
      } else {
        response = await apiClient.getClientProjectRequests();
      }

      let filteredProjects = response || [];

      // Apply search filter
      if (searchTerm) {
        filteredProjects = filteredProjects.filter((project: any) =>
            project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            project.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        filteredProjects = filteredProjects.filter((project: any) => {
          if (user?.role === 'PROVIDER') {
            return project.status === statusFilter;
          } else {
            return project.status === statusFilter;
          }
        });
      }

      // Apply sorting
      filteredProjects.sort((a: any, b: any) => {
        let aValue, bValue;
        switch (sortBy) {
          case 'title':
            aValue = a.title.toLowerCase();
            bValue = b.title.toLowerCase();
            break;
          case 'budget':
            aValue = user?.role === 'PROVIDER' ? a.budget : a.budget;
            bValue = user?.role === 'PROVIDER' ? b.budget : b.budget;
            break;
          case 'oldest':
            aValue = new Date(a.created_at).getTime();
            bValue = new Date(b.created_at).getTime();
            break;
          default: // newest
            aValue = new Date(a.created_at).getTime();
            bValue = new Date(b.created_at).getTime();
            break;
        }

        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      // Calculate pagination
      const total = filteredProjects.length;
      setTotalPages(Math.ceil(total / projectsPerPage));

      // Apply pagination
      const startIndex = (currentPage - 1) * projectsPerPage;
      const paginatedProjects = filteredProjects.slice(startIndex, startIndex + projectsPerPage);

      setProjects(paginatedProjects);
    } catch (error: any) {
      setProjectsError('Nu s-au putut încărca proiectele: ' + error.message);
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleProjectResponse = async (projectId: string, response: 'ACCEPTED' | 'REJECTED' | 'NEW_PROPOSE', proposedBudget?: number) => {
    try {
      await apiClient.respondToProjectRequest(projectId, { response, proposedBudget });
      let message = '';
      if (response === 'ACCEPTED') message = 'Proiect acceptat';
      else if (response === 'REJECTED') message = 'Proiect respins';
      else if (response === 'NEW_PROPOSE') message = 'Propunere de buget trimisă';
      toast.success(message);
      loadProjects();
    } catch (error: any) {
      toast.error('Eroare: ' + error.message);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setSortBy('newest');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const getVisiblePages = () => {
      const delta = 2;
      const range = [];
      const rangeWithDots = [];

      for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
        range.push(i);
      }

      if (currentPage - delta > 2) {
        rangeWithDots.push(1, '...');
      } else {
        rangeWithDots.push(1);
      }

      rangeWithDots.push(...range);

      if (currentPage + delta < totalPages - 1) {
        rangeWithDots.push('...', totalPages);
      } else {
        rangeWithDots.push(totalPages);
      }

      return rangeWithDots;
    };

    const visiblePages = getVisiblePages();

    return (
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <div className="text-sm text-muted-foreground">
            Afișând {Math.min((currentPage - 1) * projectsPerPage + 1, projects.length)} - {Math.min(currentPage * projectsPerPage, projects.length)} din {projects.length} proiecte
          </div>

          <div className="flex items-center space-x-2">
            <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>

            {visiblePages.map((page, index) => (
                <Button
                    key={index}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => typeof page === 'number' && setCurrentPage(page)}
                    disabled={page === '...'}
                    className="w-10"
                >
                  {page}
                </Button>
            ))}

            <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
            >
              Următor
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
    );
  };

  const getClientStatusOptions = () => [
    { value: 'all', label: 'Toate Statusurile' },
    { value: 'PENDING_RESPONSES', label: 'Așteaptă Răspunsuri' },
    { value: 'IN_PROGRESS', label: 'În Progres' },
    { value: 'COMPLETED', label: 'Finalizate' },
    { value: 'CANCELLED', label: 'Anulate' }
  ];

  const getProviderStatusOptions = () => [
    { value: 'all', label: 'Toate Statusurile' },
    { value: 'PENDING', label: 'În Așteptare' },
    { value: 'ACCEPTED', label: 'Acceptate' },
    { value: 'REJECTED', label: 'Respinse' },
    { value: 'BUDGET_PROPOSED', label: 'Buget Propus' }
  ];

  const getSortOptions = () => [
    { value: 'newest', label: 'Cele Mai Noi' },
    { value: 'oldest', label: 'Cele Mai Vechi' },
    { value: 'budget', label: 'Buget' },
    { value: 'title', label: 'Titlu' }
  ];

  if (loading) {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Se încarcă dashboard-ul...</p>
          </div>
        </div>
    );
  }

  if (!user) {
    return null;
  }

  // Mock data for overview stats
  const getOverviewStats = () => {
    if (user.role === 'PROVIDER') {
      return [
        { title: 'Proiecte Active', value: '3', change: '+2 această lună', icon: Briefcase, color: 'text-blue-600' },
        { title: 'Venituri Luna', value: '4,500 RON', change: '+15% față de luna trecută', icon: DollarSign, color: 'text-green-600' },
        { title: 'Rating Mediu', value: '4.8', change: '+0.2 această lună', icon: Star, color: 'text-yellow-600' },
        { title: 'Cereri Noi', value: '7', change: '+3 astăzi', icon: Bell, color: 'text-purple-600' }
      ];
    } else {
      return [
        { title: 'Proiecte Postate', value: '5', change: '+2 această lună', icon: FileText, color: 'text-blue-600' },
        { title: 'Buget Cheltuit', value: '12,000 RON', change: '+25% această lună', icon: DollarSign, color: 'text-green-600' },
        { title: 'Proiecte Finalizate', value: '3', change: '100% rata de succes', icon: CheckCircle, color: 'text-green-600' },
        { title: 'Prestatori Activi', value: '8', change: '+2 noi colaboratori', icon: Users, color: 'text-purple-600' }
      ];
    }
  };

  const overviewStats = getOverviewStats();

  return (
      <div className="min-h-screen bg-background">
        <Header />

        <div className="container mx-auto px-4 py-8">
          {/* Welcome Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Bun venit, {user.firstName}! 👋
                </h1>
                <p className="text-muted-foreground">
                  {user.role === 'PROVIDER'
                      ? 'Gestionează-ți serviciile și proiectele active'
                      : 'Urmărește-ți proiectele și găsește experții potriviți'
                  }
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="text-lg">
                    {user.firstName[0]}{user.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">{user.firstName} {user.lastName}</div>
                  <Badge className={user.role === 'PROVIDER' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                    {user.role === 'PROVIDER' ? 'Prestator' : 'Client'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview" className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4" />
                <span>Prezentare</span>
              </TabsTrigger>
              <TabsTrigger value="projects" className="flex items-center space-x-2">
                <Briefcase className="w-4 h-4" />
                <span>Proiecte</span>
              </TabsTrigger>
              <TabsTrigger value="services" className="flex items-center space-x-2">
                <Target className="w-4 h-4" />
                <span>Servicii</span>
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4" />
                <span>Mesaje</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Setări</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {overviewStats.map((stat, index) => (
                    <Card key={index} className="border-2 hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">
                              {stat.title}
                            </p>
                            <p className="text-2xl font-bold">{stat.value}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {stat.change}
                            </p>
                          </div>
                          <div className={`w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center ${stat.color}`}>
                            <stat.icon className="w-6 h-6" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                ))}
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="w-5 h-5" />
                    <span>Acțiuni Rapide</span>
                  </CardTitle>
                  <CardDescription>
                    {user.role === 'PROVIDER'
                        ? 'Acțiuni frecvente pentru gestionarea activității tale'
                        : 'Începe un proiect nou sau gestionează proiectele existente'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {user.role === 'PROVIDER' ? (
                        <>
                          <Button className="h-20 flex-col space-y-2" variant="outline" asChild>
                            <Link href="/provider/services/select">
                              <Plus className="w-6 h-6" />
                              <span>Adaugă Servicii</span>
                            </Link>
                          </Button>
                          <Button className="h-20 flex-col space-y-2" variant="outline" asChild>
                            <Link href="/provider/profile">
                              <Edit className="w-6 h-6" />
                              <span>Editează Profil</span>
                            </Link>
                          </Button>
                          <Button className="h-20 flex-col space-y-2" variant="outline" asChild>
                            <Link href="/tests">
                              <Award className="w-6 h-6" />
                              <span>Susține Teste</span>
                            </Link>
                          </Button>
                        </>
                    ) : (
                        <>
                          <Button className="h-20 flex-col space-y-2" variant="outline" asChild>
                            <Link href="/projects/new">
                              <Plus className="w-6 h-6" />
                              <span>Proiect Nou</span>
                            </Link>
                          </Button>
                          <Button className="h-20 flex-col space-y-2" variant="outline" asChild>
                            <Link href="/servicii">
                              <Search className="w-6 h-6" />
                              <span>Caută Servicii</span>
                            </Link>
                          </Button>
                          <Button className="h-20 flex-col space-y-2" variant="outline" asChild>
                            <Link href="/projects">
                              <Eye className="w-6 h-6" />
                              <span>Explorează Proiecte</span>
                            </Link>
                          </Button>
                        </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>Activitate Recentă</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {user.role === 'PROVIDER' ? (
                        <>
                          <div className="flex items-center space-x-3 p-3 border rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">Proiect finalizat cu succes</p>
                              <p className="text-xs text-muted-foreground">Website E-commerce • Acum 2 ore</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 p-3 border rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <Bell className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">Cerere nouă de proiect</p>
                              <p className="text-xs text-muted-foreground">Aplicație Mobile • Acum 5 ore</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 p-3 border rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                              <Star className="w-4 h-4 text-yellow-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">Recenzie nouă primită</p>
                              <p className="text-xs text-muted-foreground">5 stele de la Maria P. • Ieri</p>
                            </div>
                          </div>
                        </>
                    ) : (
                        <>
                          <div className="flex items-center space-x-3 p-3 border rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">Prestator a acceptat proiectul</p>
                              <p className="text-xs text-muted-foreground">Website React • Acum 1 oră</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 p-3 border rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <DollarSign className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">Propunere de buget primită</p>
                              <p className="text-xs text-muted-foreground">3,200 RON pentru Logo Design • Acum 3 ore</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 p-3 border rounded-lg">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                              <Plus className="w-4 h-4 text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">Proiect nou postat</p>
                              <p className="text-xs text-muted-foreground">Aplicație Mobile • Ieri</p>
                            </div>
                          </div>
                        </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects" className="space-y-6">
              {/* Filters and Search */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search Bar */}
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                            placeholder="Caută proiecte după titlu sau descriere..."
                            value={searchTerm}
                            onChange={(e) => {
                              setSearchTerm(e.target.value);
                              setCurrentPage(1);
                            }}
                            className="pl-10"
                        />
                      </div>
                    </div>

                    {/* Status Filter */}
                    <Select value={statusFilter} onValueChange={(value) => {
                      setStatusFilter(value);
                      setCurrentPage(1);
                    }}>
                      <SelectTrigger className="w-full lg:w-64">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(user.role === 'PROVIDER' ? getProviderStatusOptions() : getClientStatusOptions()).map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Sort Options */}
                    <div className="flex space-x-2">
                      <Select value={sortBy} onValueChange={(value) => {
                        setSortBy(value);
                        setCurrentPage(1);
                      }}>
                        <SelectTrigger className="w-full lg:w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getSortOptions().map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                          variant="outline"
                          size="icon"
                          onClick={toggleSortOrder}
                          className="flex-shrink-0"
                      >
                        {sortOrder === 'asc' ? (
                            <ArrowUp className="w-4 h-4" />
                        ) : (
                            <ArrowDown className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Active Filters */}
                  {(searchTerm || statusFilter !== 'all' || sortBy !== 'newest' || sortOrder !== 'desc') && (
                      <div className="flex items-center space-x-2 mt-4 pt-4 border-t">
                        <span className="text-sm font-medium text-muted-foreground">Filtre active:</span>

                        {searchTerm && (
                            <Badge variant="secondary" className="flex items-center space-x-1">
                              <span>Căutare: {searchTerm}</span>
                              <button onClick={() => setSearchTerm('')} className="ml-1 hover:text-red-500">
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                        )}

                        {statusFilter !== 'all' && (
                            <Badge variant="secondary" className="flex items-center space-x-1">
                              <span>Status: {(user.role === 'PROVIDER' ? getProviderStatusOptions() : getClientStatusOptions()).find(o => o.value === statusFilter)?.label}</span>
                              <button onClick={() => setStatusFilter('all')} className="ml-1 hover:text-red-500">
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                        )}

                        {(sortBy !== 'newest' || sortOrder !== 'desc') && (
                            <Badge variant="secondary" className="flex items-center space-x-1">
                              <span>Sortare: {getSortOptions().find(o => o.value === sortBy)?.label} ({sortOrder === 'asc' ? 'Crescător' : 'Descrescător'})</span>
                              <button onClick={() => { setSortBy('newest'); setSortOrder('desc'); }} className="ml-1 hover:text-red-500">
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                        )}

                        <Button variant="outline" size="sm" onClick={resetFilters}>
                          Resetează Toate
                        </Button>
                      </div>
                  )}
                </CardContent>
              </Card>

              {/* Projects Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    {user.role === 'PROVIDER' ? 'Cereri de Proiecte' : 'Proiectele Mele'}
                  </h2>
                  <p className="text-muted-foreground">
                    {loadingProjects ? 'Se încarcă...' : `${projects.length} proiecte găsite`}
                  </p>
                </div>

                {user.role === 'CLIENT' && (
                    <Button asChild>
                      <Link href="/projects/new">
                        <Plus className="w-4 h-4 mr-2" />
                        Proiect Nou
                      </Link>
                    </Button>
                )}
              </div>

              {/* Projects List */}
              {loadingProjects ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
              ) : projectsError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{projectsError}</AlertDescription>
                  </Alert>
              ) : projects.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-20">
                      <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">
                        {user.role === 'PROVIDER' ? 'Nu ai cereri de proiecte' : 'Nu ai proiecte create'}
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        {user.role === 'PROVIDER'
                            ? 'Când clienții vor crea proiecte și te vor selecta, le vei vedea aici'
                            : 'Creează primul tău proiect pentru a începe colaborarea cu prestatorii'
                        }
                      </p>
                      {user.role === 'CLIENT' && (
                          <Button asChild>
                            <Link href="/projects/new">
                              <Plus className="w-4 h-4 mr-2" />
                              Creează Primul Proiect
                            </Link>
                          </Button>
                      )}
                    </CardContent>
                  </Card>
              ) : (
                  <div className="space-y-6">
                    {projects.map((project) => (
                        <ProjectRequestCard
                            key={project.id}
                            project={project}
                            onResponse={handleProjectResponse}
                        />
                    ))}

                    {renderPagination()}
                  </div>
              )}
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="w-5 h-5" />
                    <span>{user.role === 'PROVIDER' ? 'Serviciile Mele' : 'Servicii Favorite'}</span>
                  </CardTitle>
                  <CardDescription>
                    {user.role === 'PROVIDER'
                        ? 'Gestionează serviciile pe care le oferi'
                        : 'Serviciile pe care le urmărești'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      {user.role === 'PROVIDER' ? 'Nu oferi încă servicii' : 'Nu ai servicii favorite'}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {user.role === 'PROVIDER'
                          ? 'Adaugă servicii pentru a începe să primești comenzi'
                          : 'Salvează serviciile care te interesează pentru acces rapid'
                      }
                    </p>
                    {user.role === 'PROVIDER' && (
                        <Button asChild>
                          <Link href="/provider/services/select">
                            <Plus className="w-4 h-4 mr-2" />
                            Adaugă Primul Serviciu
                          </Link>
                        </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Messages Tab */}
            <TabsContent value="messages" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5" />
                    <span>Mesaje</span>
                  </CardTitle>
                  <CardDescription>
                    Conversațiile tale cu clienții și prestatorii
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nu ai mesaje</h3>
                    <p className="text-muted-foreground">
                      Conversațiile tale vor apărea aici
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profile Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="w-5 h-5" />
                      <span>Setări Profil</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>
                          {user.firstName[0]}{user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">{user.firstName} {user.lastName}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={user.role === 'PROVIDER' ? '/provider/profile' : '/settings/profile'}>
                          <Edit className="w-4 h-4 mr-1" />
                          Editează
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Notification Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Bell className="w-5 h-5" />
                      <span>Setări Notificări</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Email Notifications</div>
                          <div className="text-sm text-muted-foreground">
                            Primește notificări prin email
                          </div>
                        </div>
                        <input type="checkbox" defaultChecked className="rounded" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Push Notifications</div>
                          <div className="text-sm text-muted-foreground">
                            Notificări în browser
                          </div>
                        </div>
                        <input type="checkbox" defaultChecked className="rounded" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Account Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="w-5 h-5" />
                      <span>Securitate Cont</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="w-4 h-4 mr-2" />
                      Schimbă Parola
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Shield className="w-4 h-4 mr-2" />
                      Autentificare cu 2 Factori
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Globe className="w-4 h-4 mr-2" />
                      Preferințe Limbă
                    </Button>
                  </CardContent>
                </Card>

                {/* Billing (for clients) */}
                {user.role === 'CLIENT' && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <DollarSign className="w-5 h-5" />
                          <span>Facturare</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Button variant="outline" className="w-full justify-start">
                          <DollarSign className="w-4 h-4 mr-2" />
                          Metode de Plată
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                          <FileText className="w-4 h-4 mr-2" />
                          Istoric Facturi
                        </Button>
                      </CardContent>
                    </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <Footer />
      </div>
  );
}
