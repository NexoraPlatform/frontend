"use client";

import { useState, useEffect } from 'react';
import { useRouter } from '@/lib/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { TrustoraThemeStyles } from '@/components/trustora/theme-styles';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BookOpen,
  Clock,
  Award,
  CheckCircle,
  PlayCircle,
  Code,
  Smartphone,
  Palette,
  TrendingUp,
  Database,
  Shield,
  Loader2,
  AlertCircle,
  Trophy,
  Target,
  Zap
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

export default function TestsPage() {
  const { user, loading } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [testInProgress, setTestInProgress] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-light)] dark:bg-[#070C14] flex items-center justify-center">
        <TrustoraThemeStyles />
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

  if (user?.roles?.some((r: any) => r.slug?.toLowerCase() !== 'provider')) {
    return (
      <div className="min-h-screen bg-[var(--bg-light)] dark:bg-[#070C14] hero-gradient">
        <TrustoraThemeStyles />
        <Header />
        <div className="container mx-auto px-4 py-20">
          <Alert className="glass-card border-red-200/70">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Doar prestatorii pot accesa testele de competență.
            </AlertDescription>
          </Alert>
        </div>
        <Footer />
      </div>
    );
  }

  const categories = [
    {
      id: 'web-development',
      name: 'Dezvoltare Web',
      icon: Code,
      description: 'HTML, CSS, JavaScript, React, Vue, Angular, Node.js',
      difficulty: 'Intermediar',
      duration: 45,
      questions: 25,
      passingScore: 80,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      status: 'available' // available, completed, locked
    },
    {
      id: 'mobile-development',
      name: 'Dezvoltare Mobile',
      icon: Smartphone,
      description: 'React Native, Flutter, iOS, Android, Kotlin, Swift',
      difficulty: 'Avansat',
      duration: 60,
      questions: 30,
      passingScore: 85,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      status: 'available'
    },
    {
      id: 'ui-ux-design',
      name: 'Design UI/UX',
      icon: Palette,
      description: 'Figma, Adobe XD, Sketch, Principii de design, UX Research',
      difficulty: 'Intermediar',
      duration: 40,
      questions: 20,
      passingScore: 75,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
      status: 'available'
    },
    {
      id: 'digital-marketing',
      name: 'Marketing Digital',
      icon: TrendingUp,
      description: 'SEO, SEM, Social Media, Google Analytics, Facebook Ads',
      difficulty: 'Începător',
      duration: 35,
      questions: 20,
      passingScore: 70,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
      status: 'available'
    },
    {
      id: 'database-admin',
      name: 'Administrare Baze de Date',
      icon: Database,
      description: 'MySQL, PostgreSQL, MongoDB, Redis, Optimizare',
      difficulty: 'Avansat',
      duration: 50,
      questions: 25,
      passingScore: 85,
      color: 'from-indigo-500 to-blue-500',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/20',
      status: 'locked' // Requires web development certification
    },
    {
      id: 'cybersecurity',
      name: 'Securitate Cibernetică',
      icon: Shield,
      description: 'Penetration Testing, OWASP, Cryptografie, Network Security',
      difficulty: 'Expert',
      duration: 75,
      questions: 35,
      passingScore: 90,
      color: 'from-red-500 to-pink-500',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      status: 'locked'
    }
  ];

  const colors: Record<string, string> = {
    Incepator: 'bg-green-100 text-green-800',
    Intermediar: 'bg-yellow-100 text-yellow-800',
    Avansat: 'bg-orange-100 text-orange-800',
    Expert: 'bg-red-100 text-red-800',
  };

  const getDifficultyBadge = (difficulty: string) => {
    return (
        <Badge className={colors[difficulty] || colors['Intermediar']}>
          {difficulty}
        </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'locked':
        return <Shield className="w-5 h-5 text-gray-400" />;
      default:
        return <PlayCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  const startTest = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setTestInProgress(true);
    // Aici ar fi logica pentru începerea testului
    setTimeout(() => {
      setTestInProgress(false);
      setSelectedCategory(null);
      // Simulare finalizare test
      alert('Test finalizat! Rezultatul va fi procesat în câteva minute.');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-light)] dark:bg-[#070C14] hero-gradient">
      <TrustoraThemeStyles />
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Trophy className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4 text-[var(--text-near-black)] dark:text-white">Teste de Competență</h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Demonstrează-ți expertiza și obține certificări pentru a oferi servicii pe platformă.
            Fiecare test validează cunoștințele tale în domeniul respectiv.
          </p>
        </div>

        {/* Progress Overview */}
        <Card className="mb-8 glass-card border-emerald-100/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Progresul tău</h3>
                <p className="text-muted-foreground">
                  Ai finalizat 0 din {categories.length} teste disponibile
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-emerald-600">0%</div>
                <Progress value={0} className="w-32 mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test in Progress */}
        {testInProgress && (
          <Alert className="mb-8 glass-card border-emerald-100/80">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-1">Test în progres...</h3>
                  <p className="text-sm">
                    Testul pentru {categories.find(c => c.id === selectedCategory)?.name} este în desfășurare.
                  </p>
                </div>
                <Button variant="outline" onClick={() => setTestInProgress(false)} className="border-emerald-200/70">
                  Anulează
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Categories Grid */}
        <div className="grid xs:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Card
              key={category.id}
              className={`group relative overflow-hidden glass-card border transition-all duration-300 hover:shadow-xl ${
                category.status === 'locked' 
                  ? 'opacity-60 cursor-not-allowed' 
                  : 'hover:border-emerald-200/80 cursor-pointer hover:scale-[1.02]'
              }`}
            >
              <div className={`h-2 bg-gradient-to-r ${category.color}`} />

              <CardHeader className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <category.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    {getStatusIcon(category.status)}
                    {getDifficultyBadge(category.difficulty)}
                  </div>
                </div>

                <CardTitle className="text-xl mb-2">{category.name}</CardTitle>
                <CardDescription className="text-sm">
                  {category.description}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{category.duration} minute</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <BookOpen className="w-4 h-4 text-muted-foreground" />
                      <span>{category.questions} întrebări</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1">
                      <Target className="w-4 h-4 text-muted-foreground" />
                      <span>Nota de trecere: {category.passingScore}%</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Award className="w-4 h-4 text-muted-foreground" />
                      <span>Certificare</span>
                    </div>
                  </div>
                </div>

                {category.status === 'completed' ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Test finalizat cu succes</span>
                    </div>
                    <Button variant="outline" className="w-full" disabled>
                      <Award className="w-4 h-4 mr-2" />
                      Certificat Obținut
                    </Button>
                  </div>
                ) : category.status === 'locked' ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <Shield className="w-4 h-4" />
                      <span className="text-sm">Necesită certificări anterioare</span>
                    </div>
                    <Button variant="outline" className="w-full" disabled>
                      <Shield className="w-4 h-4 mr-2" />
                      Blocat
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full btn-primary"
                    onClick={() => startTest(category.id)}
                    disabled={testInProgress}
                  >
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Începe Testul
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Section */}
        <Card className="mt-12 glass-card border-amber-200/70">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                  Cum funcționează testarea?
                </h3>
                <div className="text-amber-800 dark:text-amber-200 text-sm space-y-2">
                  <p>• <strong>Testele sunt obligatorii</strong> pentru a oferi servicii în categoriile respective</p>
                  <p>• <strong>Fiecare test</strong> conține întrebări practice și teoretice</p>
                  <p>• <strong>Nota de trecere</strong> variază în funcție de dificultatea categoriei</p>
                  <p>• <strong>Certificările</strong> sunt valabile 2 ani și pot fi reînnoite</p>
                  <p>• <strong>Poți relua testul</strong> după 30 de zile dacă nu treci prima dată</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
