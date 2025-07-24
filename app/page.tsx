"use client";

import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search,
  Code,
  Smartphone,
  Palette,
  TrendingUp,
  Shield,
  Users,
  Star,
  ArrowRight,
  CheckCircle,
  Zap,
  Globe,
  Award,
  Play,
  ChevronRight,
  Sparkles,
  Target,
  Clock,
  DollarSign,
  Rocket,
  TrendingDown,
  BarChart3,
  Layers,
  Lightbulb,
  Infinity
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const router = useRouter();

  const categories = [
    {
      icon: Code,
      title: 'Dezvoltare Web',
      description: 'Site-uri web moderne, aplicații complexe și soluții e-commerce performante',
      count: '150+ servicii',
      color: 'from-blue-500 via-blue-600 to-cyan-500',
      bgColor: 'bg-gradient-to-br from-blue-50 via-blue-100 to-cyan-50 dark:from-blue-950/50 dark:via-blue-900/30 dark:to-cyan-950/50',
      projects: '2,847 proiecte',
      avgPrice: 'de la 1,500 RON',
      trend: '+23%'
    },
    {
      icon: Smartphone,
      title: 'Aplicații Mobile',
      description: 'Apps native și cross-platform pentru iOS și Android cu UX excepțional',
      count: '80+ servicii',
      color: 'from-emerald-500 via-green-600 to-teal-500',
      bgColor: 'bg-gradient-to-br from-emerald-50 via-green-100 to-teal-50 dark:from-emerald-950/50 dark:via-green-900/30 dark:to-teal-950/50',
      projects: '1,234 proiecte',
      avgPrice: 'de la 3,000 RON',
      trend: '+18%'
    },
    {
      icon: Palette,
      title: 'Design UI/UX',
      description: 'Design modern, experiențe utilizator intuitive și branding memorabil',
      count: '120+ servicii',
      color: 'from-purple-500 via-violet-600 to-pink-500',
      bgColor: 'bg-gradient-to-br from-purple-50 via-violet-100 to-pink-50 dark:from-purple-950/50 dark:via-violet-900/30 dark:to-pink-950/50',
      projects: '3,456 proiecte',
      avgPrice: 'de la 800 RON',
      trend: '+31%'
    },
    {
      icon: TrendingUp,
      title: 'Marketing Digital',
      description: 'SEO, social media, campanii publicitare și content marketing strategic',
      count: '90+ servicii',
      color: 'from-orange-500 via-red-500 to-pink-500',
      bgColor: 'bg-gradient-to-br from-orange-50 via-red-100 to-pink-50 dark:from-orange-950/50 dark:via-red-900/30 dark:to-pink-950/50',
      projects: '1,987 proiecte',
      avgPrice: 'de la 500 RON',
      trend: '+27%'
    }
  ];

  const features = [
    {
      icon: Shield,
      title: 'Siguranță Garantată',
      description: 'Plăți securizate prin escrow, protecția datelor și verificarea riguroasă a experților',
      gradient: 'from-emerald-500 via-green-600 to-teal-600',
      stats: '99.9% securitate'
    },
    {
      icon: Users,
      title: 'Experți Verificați',
      description: 'Toți furnizorii sunt verificați prin teste, portofoliu și referințe de la clienți reali',
      gradient: 'from-blue-500 via-indigo-600 to-purple-600',
      stats: '500+ experți'
    },
    {
      icon: Zap,
      title: 'Livrare Rapidă',
      description: 'Proiecte finalizate în termenii stabiliți cu milestone-uri clare și comunicare constantă',
      gradient: 'from-yellow-500 via-orange-600 to-red-600',
      stats: '2.3x mai rapid'
    },
    {
      icon: Award,
      title: 'Calitate Premium',
      description: 'Servicii de înaltă calitate cu garanție extinsă și suport post-livrare inclus',
      gradient: 'from-purple-500 via-pink-600 to-rose-600',
      stats: '98.5% satisfacție'
    }
  ];

  const testimonials = [
    {
      name: 'Maria Popescu',
      role: 'CEO, TechStart Romania',
      content: 'Nexora ne-a ajutat să găsim echipa perfectă pentru dezvoltarea aplicației noastre fintech. Profesionalismul și calitatea au depășit toate așteptările noastre!',
      rating: 5,
      avatar: 'https://images.pexels.com/photos/3785077/pexels-photo-3785077.jpeg?auto=compress&cs=tinysrgb&w=150',
      project: 'Aplicație FinTech',
      value: '45,000 RON',
      company: 'TechStart Romania'
    },
    {
      name: 'Alexandru Ionescu',
      role: 'Marketing Director, E-Commerce Plus',
      content: 'Campania de marketing digital realizată prin Nexora ne-a dublat vânzările în doar 3 luni. ROI-ul a fost cu adevărat excepțional!',
      rating: 5,
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150',
      project: 'Campanie Marketing',
      value: '12,000 RON',
      company: 'E-Commerce Plus'
    },
    {
      name: 'Diana Radu',
      role: 'Fondator, Creative Studio',
      content: 'Designul site-ului nostru a fost realizat impecabil. Echipa a înțeles perfect viziunea noastră și a livrat peste toate așteptările.',
      rating: 5,
      avatar: 'https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=150',
      project: 'Website Design',
      value: '8,500 RON',
      company: 'Creative Studio'
    }
  ];

  const stats = [
    { number: '500+', label: 'Experți Verificați', icon: Users, change: '+12%' },
    { number: '2,847', label: 'Proiecte Finalizate', icon: CheckCircle, change: '+23%' },
    { number: '98.5%', label: 'Rata de Satisfacție', icon: Star, change: '+2.1%' },
    { number: '24/7', label: 'Suport Tehnic', icon: Clock, change: 'Non-stop' }
  ];

  const floatingElements = [
    { icon: Code, delay: 0, duration: 6 },
    { icon: Palette, delay: 1, duration: 8 },
    { icon: Smartphone, delay: 2, duration: 7 },
    { icon: TrendingUp, delay: 3, duration: 9 },
    { icon: Shield, delay: 4, duration: 6 },
    { icon: Zap, delay: 5, duration: 8 }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setIsVisible(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/services?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20" />
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-100/30 to-purple-100/30 dark:from-transparent dark:via-blue-900/10 dark:to-purple-900/10" />

          {/* Floating geometric shapes */}
          <div className="absolute inset-0">
            {floatingElements.map((element, index) => (
              <div
                key={index}
                className={`absolute animate-pulse opacity-10 dark:opacity-5`}
                style={{
                  left: `${20 + (index * 15)}%`,
                  top: `${10 + (index * 12)}%`,
                  animationDelay: `${element.delay}s`,
                  animationDuration: `${element.duration}s`
                }}
              >
                <element.icon className="w-16 h-16 text-blue-600" />
              </div>
            ))}
          </div>

          {/* Interactive cursor effect */}
          <div
            className="absolute w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl transition-all duration-1000 ease-out pointer-events-none"
            style={{
              left: mousePosition.x - 192,
              top: mousePosition.y - 192,
            }}
          />
        </div>

        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="max-w-6xl mx-auto text-center">
            {/* Animated Badge */}
            <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <Badge variant="secondary" className="mb-8 px-8 py-3 text-base font-semibold bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 dark:from-blue-900/50 dark:via-indigo-900/50 dark:to-purple-900/50 border-2 border-blue-200/50 dark:border-blue-800/50 shadow-lg backdrop-blur-sm">
                <Sparkles className="w-5 h-5 mr-3 text-blue-600" />
                🚀 Platforma #1 pentru servicii IT în România
                <div className="ml-3 px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                  LIVE
                </div>
              </Badge>
            </div>

            {/* Main Heading with Staggered Animation */}
            <div className={`transform transition-all duration-1000 delay-200 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <h1 className="text-6xl lg:text-8xl font-black mb-8 leading-tight">
                <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent animate-pulse">
                  Transformă-ți
                </span>
                <span className="block text-foreground mt-2">
                  <span className="relative">
                    ideile în
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-25 animate-pulse"></div>
                  </span>
                </span>
                <span className="block bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  realitate digitală
                </span>
              </h1>
            </div>

            {/* Enhanced Description */}
            <div className={`transform transition-all duration-1000 delay-400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <p className="text-2xl lg:text-3xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed font-medium">
                Conectează-te cu <span className="text-blue-600 font-bold">cei mai buni experți IT</span> din România.
                <br />De la dezvoltare web la marketing digital, găsește soluția perfectă pentru proiectul tău.
              </p>
            </div>

            {/* Enhanced Search Bar */}
            <div className={`transform transition-all duration-1000 delay-600 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className="max-w-4xl mx-auto mb-12">
                <form onSubmit={handleSearch} className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity animate-pulse"></div>
                  <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl p-3 shadow-2xl border-2 border-white/20 dark:border-gray-800/20">
                    <div className="flex items-center">
                      <div className="relative flex-1">
                        <Search className="absolute left-8 top-1/2 transform -translate-y-1/2 text-muted-foreground w-7 h-7" />
                        <Input
                          placeholder="Caută servicii, tehnologii sau experți... (ex: dezvoltare React, logo design, SEO)"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-[98%] pl-20 pr-6 py-8 text-xl border-0 bg-transparent focus:ring-0 focus:outline-none placeholder:text-muted-foreground/70"
                        />
                      </div>
                      <Button
                        type="submit"
                        size="lg"
                        className="mr-3 px-12 py-8 text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200"
                      >
                        <Rocket className="mr-3 w-6 h-6" />
                        Caută Acum
                      </Button>
                    </div>
                  </div>
                </form>

                {/* Popular Tags */}
                <div className="flex flex-wrap justify-center items-center gap-3 mt-8">
                  <span className="text-sm text-muted-foreground font-medium">Populare:</span>
                  {['React', 'WordPress', 'Logo Design', 'SEO', 'Mobile App', 'E-commerce'].map((tag) => (
                    <Button
                      key={tag}
                      variant="outline"
                      size="sm"
                      className="rounded-full border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 dark:border-blue-800 dark:hover:border-blue-600 dark:hover:bg-blue-950 transition-all duration-200 transform hover:scale-105"
                      onClick={() => {
                        setSearchTerm(tag);
                        router.push(`/services?search=${encodeURIComponent(tag)}`);
                      }}
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className={`transform transition-all duration-1000 delay-800 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
                <Button size="lg" className="px-12 py-8 text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-200" asChild>
                  <Link href="#">
                    <Target className="mr-3 w-6 h-6" />
                    Alătură-te ca si client
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="px-12 py-8 text-xl font-bold border-3 border-blue-300 hover:border-blue-500 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:hover:border-blue-500 dark:text-blue-300 dark:hover:bg-blue-950 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200">
                  <Play className="mr-3 w-6 h-6" />
                  Alătură-te ca prestator
                </Button>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className={`transform transition-all duration-1000 delay-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                {stats.map((stat, index) => (
                  <div key={index} className="group">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <stat.icon className="w-10 h-10 text-blue-600" />
                    </div>
                    <div className="text-3xl lg:text-4xl font-black text-blue-600 mb-2">
                      {stat.number}
                    </div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      {stat.label}
                    </div>
                    <div className="text-xs text-green-600 font-semibold">
                      {stat.change}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-blue-600 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-blue-600 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Enhanced Categories Section */}
      <section className="py-12 bg-gradient-to-b from-white via-blue-50/30 to-purple-50/30 dark:from-background dark:via-blue-950/10 dark:to-purple-950/10 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width=%22100%22%20height=%22100%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cdefs%3E%3Cpattern%20id=%22grid%22%20width=%2240%22%20height=%2240%22%20patternUnits=%22userSpaceOnUse%22%3E%3Cpath%20d=%22M%2040%200L0%200%200%2040%22%20fill=%22none%22%20stroke=%22%23000%22%20stroke-width=%221%22/%3E%3C/pattern%3E%3C/defs%3E%3Crect%20width=%22100%25%22%20height=%22100%25%22%20fill=%22url(%23grid)%22/%3E%3C/svg%3E')] opacity-20" />
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-20">
            <Badge variant="secondary" className="mb-8 px-6 py-3 text-base font-semibold bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 border border-blue-200 dark:border-blue-800">
              <Globe className="w-5 h-5 mr-2" />
              Servicii Premium
            </Badge>
            <h2 className="text-5xl lg:text-6xl font-black mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Categorii Populare de Servicii
            </h2>
            <p className="text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Descoperă o gamă largă de servicii IT profesionale, toate verificate și evaluate de comunitatea noastră
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.map((category, index) => (
              <Card key={index} className="group relative overflow-hidden border-2 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                <div className={`h-3 bg-gradient-to-r ${category.color}`} />
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-blue-50/50 dark:to-blue-950/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <CardHeader className="text-center pb-4 relative z-10">
                  <div className={`w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-2xl relative`}>
                    <category.icon className="w-12 h-12 text-white" />
                    <div className="absolute inset-0 bg-white/20 rounded-3xl animate-pulse"></div>
                  </div>
                  <CardTitle className="text-2xl mb-4 group-hover:text-blue-600 transition-colors font-bold">{category.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {category.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="text-center space-y-4 relative z-10">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-blue-50 dark:bg-blue-950/50 rounded-lg p-3">
                      <div className="font-bold text-blue-600">{category.projects}</div>
                      <div className="text-xs text-muted-foreground">Finalizate</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950/50 rounded-lg p-3">
                      <div className="font-bold text-green-600">{category.trend}</div>
                      <div className="text-xs text-muted-foreground">Creștere</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <Badge variant="secondary" className="text-xs font-medium bg-blue-100 dark:bg-blue-900">
                      {category.count}
                    </Badge>
                    <span className="text-sm font-bold text-blue-600">{category.avgPrice}</span>
                  </div>

                  <Button variant="ghost" className="w-full mt-4 group-hover:bg-blue-50 dark:group-hover:bg-blue-950 font-semibold">
                    Explorează
                    <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-indigo-600/5" />

        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-20">
            <Badge variant="secondary" className="mb-8 px-6 py-3 text-base font-semibold bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/50 dark:to-blue-900/50 border border-green-200 dark:border-green-800">
              <Shield className="w-5 h-5 mr-2" />
              De ce Nexora?
            </Badge>
            <h2 className="text-5xl lg:text-6xl font-black mb-8 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Experiență de încredere pentru proiectele tale
            </h2>
            <p className="text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Oferim o platformă sigură, rapidă și transparentă pentru toate colaborările tale IT
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center group relative">
                <div className="relative mb-8">
                  <div className={`w-28 h-28 mx-auto bg-gradient-to-br ${feature.gradient} rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl relative overflow-hidden`}>
                    <feature.icon className="w-14 h-14 text-white relative z-10" />
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    <div className="absolute -inset-1 bg-gradient-to-r from-white/20 to-transparent rounded-3xl blur"></div>
                  </div>
                  <div className="absolute -top-2 -right-2 bg-white dark:bg-gray-900 rounded-full px-3 py-1 text-xs font-bold text-blue-600 shadow-lg border-2 border-blue-200 dark:border-blue-800">
                    {feature.stats}
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-4 group-hover:text-blue-600 transition-colors">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-lg">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Stats Section */}
      <section className="py-12 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width=%22100%22%20height=%22100%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cdefs%3E%3Cpattern%20id=%22dots%22%20width=%2240%22%20height=%2240%22%20patternUnits=%22userSpaceOnUse%22%3E%3Ccircle%20cx=%2220%22%20cy=%2220%22%20r=%222%22%20fill=%22%23ffffff%22%20opacity=%220.1%22/%3E%3C/pattern%3E%3C/defs%3E%3Crect%20width=%22100%25%22%20height=%22100%25%22%20fill=%22url(%23dots)%22/%3E%3C/svg%3E')] opacity-30" />

        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-20">
            <h2 className="text-5xl lg:text-6xl font-black mb-8">
              Cifre care vorbesc despre succes
            </h2>
            <p className="text-2xl opacity-90 max-w-3xl mx-auto leading-relaxed">
              Mii de proiecte finalizate cu succes și o comunitate în continuă creștere
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="group relative">
                <div className="w-24 h-24 mx-auto mb-6 bg-white/20 rounded-3xl flex items-center justify-center group-hover:bg-white/30 transition-colors backdrop-blur-sm">
                  <stat.icon className="w-12 h-12" />
                </div>
                <div className="text-5xl lg:text-6xl font-black mb-4">
                  {stat.number}
                </div>
                <div className="text-xl opacity-90 font-semibold mb-2">
                  {stat.label}
                </div>
                <div className="text-sm bg-white/20 rounded-full px-3 py-1 inline-block">
                  {stat.change}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Testimonials Section */}
      <section className="py-12 bg-gradient-to-b from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-950/50 dark:via-blue-950/10 dark:to-purple-950/10 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <Badge variant="secondary" className="mb-8 px-6 py-3 text-base font-semibold bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/50 dark:to-orange-900/50 border border-yellow-200 dark:border-yellow-800">
              <Star className="w-5 h-5 mr-2" />
              Testimoniale
            </Badge>
            <h2 className="text-5xl lg:text-6xl font-black mb-8 bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
              Ce spun clienții noștri
            </h2>
            <p className="text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Mii de antreprenori și companii și-au realizat visurile cu ajutorul experților de pe Nexora
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <Card className="border-3 border-blue-200 dark:border-blue-800 shadow-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20"></div>
              <CardContent className="p-16 relative z-10">
                <div className="flex mb-8">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <Star key={i} className="w-8 h-8 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <blockquote className="text-3xl font-medium mb-12 leading-relaxed italic text-gray-700 dark:text-gray-300">
                  "{testimonials[currentTestimonial].content}"
                </blockquote>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <img
                      src={testimonials[currentTestimonial].avatar}
                      alt={testimonials[currentTestimonial].name}
                      className="w-20 h-20 rounded-full object-cover border-4 border-blue-200 dark:border-blue-800"
                    />
                    <div>
                      <div className="font-bold text-2xl">{testimonials[currentTestimonial].name}</div>
                      <div className="text-muted-foreground text-lg">{testimonials[currentTestimonial].role}</div>
                      <div className="text-blue-600 font-semibold">{testimonials[currentTestimonial].company}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground mb-1">Proiect</div>
                    <div className="font-bold text-xl">{testimonials[currentTestimonial].project}</div>
                    <div className="text-lg text-green-600 font-bold">{testimonials[currentTestimonial].value}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center space-x-3 mt-12">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-4 h-4 rounded-full transition-all duration-300 ${
                    index === currentTestimonial 
                      ? 'bg-blue-600 scale-125' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-12 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width=%22100%22%20height=%22100%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cdefs%3E%3Cpattern%20id=%22hexagons%22%20width=%2256%22%20height=%2256%22%20patternUnits=%22userSpaceOnUse%22%3E%3Cpath%20d=%22M28%200l14%208v16l-14%208-14-8V8z%22%20fill=%22none%22%20stroke=%22%23ffffff%22%20stroke-width=%221%22%20opacity=%220.1%22/%3E%3C/pattern%3E%3C/defs%3E%3Crect%20width=%22100%25%22%20height=%22100%25%22%20fill=%22url(%23hexagons)%22/%3E%3C/svg%3E')] opacity-20" />

        <div className="container mx-auto px-4 text-center relative">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl lg:text-6xl font-black mb-8">
              Gata să îți transformi ideea în realitate?
            </h2>
            <p className="text-2xl opacity-90 mb-16 leading-relaxed">
              Alătură-te miilor de antreprenori care și-au găsit experții potriviți pe Nexora.
              Începe astăzi și vezi-ți proiectul prind viață.
            </p>
            <div className="flex flex-col sm:flex-row gap-8 justify-center">
              <Button size="lg" variant="secondary" className="px-16 py-8 text-2xl font-bold bg-white text-blue-600 hover:bg-gray-100 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-200" asChild>
                <Link href="/services">
                  <Zap className="mr-3 w-7 h-7" />
                  Începe Acum
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="px-16 py-8 text-2xl font-bold border-3 border-white text-black hover:bg-white/10 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200">
                <Users className="mr-3 w-7 h-7" />
                Devino Expert
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
