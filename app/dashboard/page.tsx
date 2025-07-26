"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CallIcon from '@mui/icons-material/Call';
import Tooltip from '@mui/material/Tooltip';
import {
  User,
  Star,
  TrendingUp,
  DollarSign,
  Clock,
  MessageSquare,
  FileText,
  Settings,
  Plus,
  Calendar,
  Award,
  Target,
  Zap,
  Loader2,
  BookOpen,
  Shield,
  PlayCircle,
  Search
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import {useTestExamDetails} from "@/hooks/use-api";
import { DateTime } from 'luxon';

type TestResult = {
  id: number;
  skill_test_id: number;
  test_result_id: number;
  user_id: number;
  service_id: number;
  score: number;
  passed: string;
  timeSpent: number;
  taken_at: string;
  totalQuestions: number;
  created_at: string;
  updated_at: string;
  call_schedule: {
    id: number;
    user_id: number;
    date_time: string;
    passed: boolean;
    created_at: string | null;
    updated_at: string | null;
    service_id: number;
    test_result_id: number;
    timezone: string;
    call_date_time_iso: string;
    call_url: string;
  };
  service: {
    id: number;
    name: string;
    description: string;
    slug: string;
    category_id: number;
    category: {
      id: number;
      name: string;
      description: string;
      slug: string;
    };
  };
};

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showServiceModal, setShowServiceModal] = useState(false);
  const router = useRouter();
  const { data: testExamDetails } = useTestExamDetails();
  const [enabledMap, setEnabledMap] = useState<Record<number, boolean>>({});
  const filteredExamData = testExamDetails?.filter(
      (item: TestResult) =>
          item.passed === 'YES' &&
          item.call_schedule &&
          !item.call_schedule.passed
  );
  useEffect(() => {
    const interval = setInterval(() => {
      const updatedMap: Record<number, boolean> = {};

      filteredExamData.forEach((exam: TestResult) => {
        const timezone = exam.call_schedule?.timezone || 'UTC';

        const scheduledDate = DateTime.fromISO(exam.call_schedule?.call_date_time_iso, { zone: 'utc' }).setZone(timezone);
        const now = DateTime.now().setZone(timezone);

        const diffMinutes = scheduledDate.diff(now, 'minutes').minutes;

        const nowPlus10 = now.plus({ minutes: 10 });
        const isPastWindow = nowPlus10 > scheduledDate;

        updatedMap[exam.id] = diffMinutes <= 5 || !isPastWindow;
      });

      setEnabledMap(updatedMap);
    }, 5000);

    return () => clearInterval(interval);
  }, [filteredExamData]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Se încarcă...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isProvider = user.role === 'PROVIDER';
  const testVerified = user.testVerified;
  const callVerified = user.callVerified;

  const stats = [
    {
      title: isProvider ? 'Servicii Active' : 'Comenzi Active',
      value: isProvider ? '0' : '3',
      change: isProvider ? 'Adaugă primul serviciu' : '+2 această lună',
      icon: FileText,
      color: 'text-blue-600'
    },
    {
      title: isProvider ? 'Venituri Totale' : 'Cheltuieli Totale',
      value: isProvider ? '0 RON' : '12,500 RON',
      change: isProvider ? 'După certificare' : '+15% față de luna trecută',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Rating Mediu',
      value: '0',
      change: isProvider ? 'După primele comenzi' : '0 recenzii',
      icon: Star,
      color: 'text-yellow-600'
    },
    {
      title: 'Mesaje Noi',
      value: '0',
      change: 'Niciun mesaj nou',
      icon: MessageSquare,
      color: 'text-purple-600'
    }
  ];

  const recentOrders = [
    {
      id: '1',
      title: 'Dezvoltare Website E-commerce',
      client: 'Maria Popescu',
      amount: '3,500 RON',
      status: 'IN_PROGRESS',
      dueDate: '2024-02-15'
    },
    {
      id: '2',
      title: 'Design Logo și Branding',
      client: 'Alexandru Ionescu',
      amount: '800 RON',
      status: 'DELIVERED',
      dueDate: '2024-02-10'
    },
    {
      id: '3',
      title: 'Optimizare SEO',
      client: 'Diana Radu',
      amount: '1,200 RON',
      status: 'PENDING',
      dueDate: '2024-02-20'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-100 text-blue-800">În progres</Badge>;
      case 'DELIVERED':
        return <Badge className="bg-green-100 text-green-800">Livrat</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">În așteptare</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleNewService = () => {
    if (isProvider) {
      setShowServiceModal(true);
    } else {
      router.push('/dashboard/projects/new');
    }
  };

  const handleStartServiceFlow = () => {
    setShowServiceModal(false);
    router.push('/provider/services/select');
  };

  const handleScheduleCall = (examId: number) => () => {
    router.push('/tests/schedule/' + examId);
  };

  const handleConnectCall = (callUrl: string | null) => () => {
    if (callUrl) {
      window.open(callUrl, '_blank');
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Bun venit, {user.firstName}!
              </h1>
              <p className="text-muted-foreground">
                {isProvider
                  ? 'Gestionează serviciile și comenzile tale'
                  : 'Urmărește proiectele și colaborările tale'
                }
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={handleNewService}>
                <Plus className="w-4 h-4 mr-2" />
                {isProvider ? 'Serviciu Nou' : 'Proiect Nou'}
              </Button>
              <Avatar className="w-12 h-12">
                <AvatarImage src={user.avatar || ''} />
                <AvatarFallback>
                  {user.firstName[0]}{user.lastName[0]}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>

        {/* Provider Service Modal */}
        {showServiceModal && isProvider && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold mb-2">Adaugă Serviciu Nou</h3>
                  <p className="text-sm mb-4">
                    Pentru a oferi servicii pe platformă, urmează acești pași:
                  </p>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                      <span>Selectează serviciile pe care vrei să le prestezi</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                      <span>Alege nivelul tău pentru fiecare serviciu</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                      <span>Susții testele de competență</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                      <span>Setezi tarifele și începi să primești comenzi</span>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <Button size="sm" onClick={handleStartServiceFlow}>
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Începe Procesul
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => router.push('/services')}>
                      <Search className="w-4 h-4 mr-2" />
                      Vezi Servicii Disponibile
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowServiceModal(false)}>
                      Închide
                    </Button>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="border-2 hover:shadow-lg transition-shadow">
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
                  <div className={`w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Prezentare</TabsTrigger>
            <TabsTrigger value="orders">
              {isProvider ? 'Comenzi' : 'Proiecte'}
            </TabsTrigger>
            <TabsTrigger value="services">
              {isProvider ? 'Servicii' : 'Favorite'}
            </TabsTrigger>
            <TabsTrigger value="messages">Mesaje</TabsTrigger>
            <TabsTrigger onClick={() => router.push('/provider/profile')} value="">Profil</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredExamData?.length !== 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <ScheduleIcon className="w-5 h-5" />
                        <span>Verificări</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {filteredExamData?.map((exam: TestResult) => {
                          const scheduledDate = DateTime.fromISO(exam.call_schedule?.date_time, { setZone: true });

                          const formattedDate = scheduledDate.toFormat('dd.MM.yyyy HH:mm');
                          const isCallScheduled = !!exam.call_schedule?.date_time;
                          const isCallPassed = exam.call_schedule?.passed;
                          const isButtonEnabled = enabledMap[exam.id];

                          return (
                              <div key={exam.id}>
                                <p>{exam.service.category.name}</p>
                                <span className="text-sm text-muted-foreground mb-4">
                                  {exam.service.name} –{' '}
                                  {exam.passed === 'YES' ? (
                                      <>
                                        <span className="text-green-600 font-semibold">Trecut</span>
                                        {!isCallPassed && !isCallScheduled && (
                                            <span> - Examen – <a href="#">Programează apel aici</a></span>
                                        )}
                                      </>
                                  ) : (
                                      <span className="text-red-600 font-semibold">Picat</span>
                                  )}
                    </span>

                                <div className="flex items-center space-x-2 text-sm">
                                  <Progress value={exam.score} className="h-2" />
                                  {exam.score}%
                                </div>

                                <div className="mt-2">
                                  {!isCallPassed && !isCallScheduled && (
                                      <Button className="w-full" onClick={handleScheduleCall(exam.id)}>
                                        <ScheduleIcon className="w-4 h-4 mr-2" />
                                        Programează-te
                                      </Button>
                                  )}

                                  {isCallScheduled && (
                                      <>
                                        <p className="text-center mt-5">
                                          Programat pentru call-ul de verificare la data de {formattedDate}
                                        </p>
                                        <Tooltip
                                            title={
                                              isButtonEnabled
                                                  ? ''
                                                  : 'Butonul va fi activat automat cu 5 minute înainte de apel.'
                                            }
                                        >
                            <span>
                              <Button
                                  className="w-full mt-2"
                                  disabled={!isButtonEnabled}
                                  onClick={handleConnectCall(exam.call_schedule.call_url)}
                              >
                                <CallIcon className="w-4 h-4 mr-2" />
                                Conectează-te
                              </Button>
                            </span>
                                        </Tooltip>
                                      </>
                                  )}
                                </div>
                              </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
              )}
              {/* Recent Orders */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>{isProvider ? 'Comenzi Recente' : 'Proiecte Recente'}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!isProvider ? (
                    <div className="space-y-4">
                      {recentOrders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{order.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              Prestator: {order.client}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Termen: {order.dueDate}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">{order.amount}</p>
                            {getStatusBadge(order.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Nicio comandă încă</h3>
                      <p className="text-muted-foreground mb-4">
                        După certificare vei putea primi comenzi
                      </p>
                      <Button onClick={handleStartServiceFlow}>
                        <PlayCircle className="w-4 h-4 mr-2" />
                        Începe Evaluarea
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Performanță</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isProvider ? (
                      <div className="text-center py-12">
                        <Award className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">Certificări în așteptare</h3>
                        <p className="text-muted-foreground mb-4">
                          Completează testele pentru a începe să oferi servicii
                        </p>
                        <Button onClick={handleStartServiceFlow}>
                          <BookOpen className="w-4 h-4 mr-2" />
                          Vezi Testele Disponibile
                        </Button>
                      </div>
                  ) : (
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Proiecte Finalizate</span>
                            <span>85%</span>
                          </div>
                          <Progress value={85} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Satisfacția Prestatorilor</span>
                            <span>96%</span>
                          </div>
                          <Progress value={96} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Timp de Răspuns</span>
                            <span>92%</span>
                          </div>
                          <Progress value={92} className="h-2" />
                        </div>
                      </div>
                  )}
                </CardContent>
              </Card>
            </div>



            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5" />
                  <span>Acțiuni Rapide</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button variant="outline" className="h-20 flex flex-col space-y-2" onClick={handleNewService}>
                    <Plus className="w-6 h-6" />
                    <span className="text-sm">
                      {isProvider ? 'Serviciu Nou' : 'Proiect Nou'}
                    </span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col space-y-2">
                    <MessageSquare className="w-6 h-6" />
                    <span className="text-sm">Mesaje</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col space-y-2">
                    <Calendar className="w-6 h-6" />
                    <span className="text-sm">Calendar</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col space-y-2">
                    <Settings className="w-6 h-6" />
                    <span className="text-sm">Setări</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>
                  {isProvider ? 'Comenzile Mele' : 'Proiectele Mele'}
                </CardTitle>
                <CardDescription>
                  Gestionează toate comenzile și urmărește progresul
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {isProvider ? 'Comenzi în dezvoltare' : 'Proiecte în dezvoltare'}
                  </h3>
                  <p className="text-muted-foreground">
                    Această secțiune va afișa toate comenzile tale
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <Card>
              <CardHeader>
                <CardTitle>
                  {isProvider ? 'Serviciile Mele' : 'Servicii Favorite'}
                </CardTitle>
                <CardDescription>
                  {isProvider
                    ? 'Gestionează serviciile pe care le oferi'
                    : 'Serviciile salvate și favorite'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isProvider ? (
                  <div className="text-center py-12">
                    <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Servicii în dezvoltare</h3>
                    <p className="text-muted-foreground mb-4">
                      Pentru a oferi servicii, trebuie să treci testele de competență
                    </p>
                    <div className="flex justify-center space-x-3">
                      <Button onClick={handleStartServiceFlow}>
                        <PlayCircle className="w-4 h-4 mr-2" />
                        Începe Evaluarea
                      </Button>
                      <Button variant="outline" onClick={() => router.push('/services')}>
                        <Search className="w-4 h-4 mr-2" />
                        Vezi Servicii Disponibile
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Favorite în dezvoltare</h3>
                    <p className="text-muted-foreground">
                      Această secțiune va afișa serviciile tale favorite
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Mesaje</CardTitle>
                <CardDescription>
                  Conversațiile tale cu clienții și prestatorii
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Chat în dezvoltare</h3>
                  <p className="text-muted-foreground">
                    Sistemul de mesagerie va fi disponibil în curând
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profilul Meu</CardTitle>
                <CardDescription>
                  Gestionează informațiile profilului tău
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Profil în dezvoltare</h3>
                  <p className="text-muted-foreground">
                    Setările profilului vor fi disponibile în curând
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}
