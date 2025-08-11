import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { TestimonialsSection } from '@/components/testimonials-section';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Code,
  Smartphone,
  Palette,
  TrendingUp,
  Shield,
  Zap,
  Users,
  Globe,
  Award,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import HeroSectionClient from '@/components/hero-section.client';
import dynamic from "next/dynamic";

const LazyStyles = dynamic(() => import("./(home)/_client/LazyStyles.client"), {
  ssr: false,
  loading: () => null,
});


export default function Home() {
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
      trend: '+23%',
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
      trend: '+18%',
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
      trend: '+31%',
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
      trend: '+27%',
    },
  ];

  const features = [
    {
      icon: Shield,
      title: 'Siguranță Garantată',
      description: 'Plăți securizate prin escrow, protecția datelor și verificarea riguroasă a experților',
      gradient: 'from-emerald-500 via-green-600 to-teal-600',
      stats: '99.9% securitate',
    },
    {
      icon: Users,
      title: 'Experți Verificați',
      description: 'Toți furnizorii sunt verificați prin teste, portofoliu și referințe de la clienți reali',
      gradient: 'from-blue-500 via-indigo-600 to-purple-600',
      stats: '500+ experți',
    },
    {
      icon: Zap,
      title: 'Livrare Rapidă',
      description: 'Proiecte finalizate în termenii stabiliți cu milestone-uri clare și comunicare constantă',
      gradient: 'from-yellow-500 via-orange-600 to-red-600',
      stats: '2.3x mai rapid',
    },
    {
      icon: Award,
      title: 'Calitate Premium',
      description: 'Servicii de înaltă calitate cu garanție extinsă și suport post-livrare inclus',
      gradient: 'from-purple-500 via-pink-600 to-rose-600',
      stats: '98.5% satisfacție',
    },
  ];

  return (
      <div className="min-h-screen bg-background">
        <Header />
        <main role="main" aria-label="Conținut principal">
          <HeroSectionClient />

          {/* Incarcă CSS-ul non-critic după primul paint */}
          <LazyStyles />

          {/* Enhanced Categories Section */}
          <section
              className="py-12 bg-gradient-to-b from-white via-blue-50/30 to-purple-50/30 dark:from-background dark:via-blue-950/10 dark:to-purple-950/10 relative overflow-hidden lazy-section"
              aria-labelledby="categories-heading"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5" aria-hidden="true">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width=%22100%22%20height=%22100%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cdefs%3E%3Cpattern%20id=%22grid%22%20width=%2240%22%20height=%2240%22%20patternUnits=%22userSpaceOnUse%22%3E%3Cpath%20d=%22M%2040%200L0%200%200%2040%22%20fill=%22none%22%20stroke=%22%23000%22%20stroke-width=%221%22/%3E%3C/pattern%3E%3C/defs%3E%3Crect%20width=%22100%25%22%20height=%22100%25%22%20fill=%22url(%23grid)%22/%3E%3C/svg%3E')] opacity-20" />
            </div>

            <div className="container mx-auto px-4 relative">
              <div className="text-center mb-20">
                <Badge variant="secondary" className="mb-8 px-6 py-3 text-base font-semibold bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 border border-blue-200 dark:border-blue-800">
                  <Globe className="w-5 h-5 mr-2" />
                  Servicii Premium
                </Badge>
                <h2
                    id="categories-heading"
                    className="text-5xl lg:text-6xl font-black leading-[1.08] mb-8"
                >
                  Categorii Populare de Servicii
                </h2>
                <p className="text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed text-pretty">
                  Descoperă o gamă largă de servicii IT profesionale, toate verificate și evaluate de comunitatea noastră
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8" role="list" aria-label="Lista categorii de servicii">
                {categories.map((category, index) => (
                    <Card
                        key={index}
                        className="group relative overflow-hidden border-2 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
                        role="listitem"
                        tabIndex={0}
                        aria-label={`Categorie ${category.title}: ${category.description}`}
                    >
                      <div className={`h-3 bg-gradient-to-r ${category.color}`} />
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-blue-50/50 dark:to-blue-950/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" aria-hidden="true" />

                      <CardHeader className="text-center pb-4 relative z-10">
                        <div
                            className={`w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-2xl relative`}
                            aria-hidden="true"
                        >
                          <category.icon className="w-12 h-12 text-white" />
                          <div className="absolute inset-0 bg-white/20 rounded-3xl animate-pulse" aria-hidden="true"></div>
                        </div>
                        <CardTitle className="text-2xl mb-4 group-hover:text-blue-600 transition-colors font-bold">
                          {category.title}
                        </CardTitle>
                        <CardDescription className="text-base leading-relaxed">
                          {category.description}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="text-center space-y-4 relative z-10">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="bg-blue-50 dark:bg-blue-950/50 rounded-lg p-3" role="group" aria-label="Statistici proiecte">
                            <div className="font-bold text-blue-600">{category.projects}</div>
                            <div className="text-xs">Finalizate</div>
                          </div>
                          <div className="bg-green-100 dark:bg-green-900 rounded-lg p-3" role="group" aria-label="Statistici creștere">
                            <div className="font-bold text-green-900 dark:text-green-300">{category.trend}</div>
                            <div className="text-xs">Creștere</div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <Badge variant="secondary" className="text-xs font-medium bg-blue-100 dark:bg-blue-900">
                            {category.count}
                          </Badge>
                          <span className="text-sm font-bold text-blue-600">{category.avgPrice}</span>
                        </div>

                        <Button
                            variant="ghost"
                            className="w-full mt-4 group-hover:bg-blue-50 dark:group-hover:bg-blue-950 font-semibold"
                            aria-label={`Explorează servicii din categoria ${category.title}`}
                        >
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
          <section
              className="py-12 relative overflow-hidden lazy-section"
              aria-labelledby="features-heading"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-indigo-600/5" aria-hidden="true" />

            <div className="container mx-auto px-4 relative">
              <div className="text-center mb-20">
                <Badge variant="secondary" className="mb-8 px-6 py-3 text-base font-semibold bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/50 dark:to-blue-900/50 border border-green-200 dark:border-green-800">
                  <Shield className="w-5 h-5 mr-2" />
                  De ce Nexora?
                </Badge>
                <h2 id="features-heading" className="text-5xl lg:text-6xl font-black mb-8 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent text-balance">
                  Experiență de încredere pentru proiectele tale
                </h2>
                <p className="text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed text-pretty">
                  Oferim o platformă sigură, rapidă și transparentă pentru toate colaborările tale IT
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8" role="list" aria-label="Lista beneficii Nexora">
                {features.map((feature, index) => (
                    <div
                        key={index}
                        className="text-center group relative"
                        role="listitem"
                        tabIndex={0}
                        aria-label={`Beneficiu ${feature.title}: ${feature.description}`}
                    >
                      <div className="relative mb-8">
                        <div
                            className={`w-28 h-28 mx-auto bg-gradient-to-br ${feature.gradient} rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl relative overflow-hidden`}
                            aria-hidden="true"
                        >
                          <feature.icon className="w-14 h-14 text-white relative z-10" />
                          <div className="absolute inset-0 bg-white/20 animate-pulse" aria-hidden="true"></div>
                          <div className="absolute -inset-1 bg-gradient-to-r from-white/20 to-transparent rounded-3xl blur" aria-hidden="true"></div>
                        </div>
                        <div
                            className="absolute -top-2 -right-2 bg-white dark:bg-gray-900 rounded-full px-3 py-1 text-xs font-bold text-blue-600 shadow-lg border-2 border-blue-200 dark:border-blue-800"
                            aria-label={`Statistică: ${feature.stats}`}
                        >
                          {feature.stats}
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold mb-4 group-hover:text-blue-600 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-base text-muted-foreground mb-6 leading-relaxed">
                        {feature.description}
                      </p>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            variant="ghost"
                            className="text-blue-600 font-semibold"
                            aria-label={`Află mai multe despre ${feature.title}`}
                        >
                          Află mai mult
                          <ChevronRight className="ml-2 w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                ))}
              </div>
            </div>
          </section>

          <TestimonialsSection />

          {/* Enhanced CTA Section */}
          <section
              className="py-12 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white relative overflow-hidden"
              aria-labelledby="cta-heading"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width=%22100%22%20height=%22100%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cdefs%3E%3Cpattern%20id=%22hexagons%22%20width=%2256%22%20height=%2256%22%20patternUnits=%22userSpaceOnUse%22%3E%3Cpath%20d=%22M28%200l14%208v16l-14%208-14-8V8z%22%20fill=%22none%22%20stroke=%22%23ffffff%22%20stroke-width=%221%22%20opacity=%220.1%22/%3E%3C/pattern%3E%3C/defs%3E%3Crect%20width=%22100%25%22%20height=%22100%25%22%20fill=%22url(%23hexagons)%22/%3E%3C/svg%3E')] opacity-20" aria-hidden="true" />

            <div className="container mx-auto px-4 text-center relative">
              <div className="max-w-4xl mx-auto">
                <h2 id="cta-heading" className="text-5xl lg:text-6xl font-black mb-8 text-balance">
                  Gata să îți transformi ideea în realitate?
                </h2>
                <p className="text-2xl opacity-90 mb-16 leading-relaxed text-pretty">
                  Alătură-te miilor de antreprenori care și-au găsit experții potriviți pe Nexora. Începe astăzi și vezi-ți proiectul prind viață.
                </p>
                <div className="flex flex-col sm:flex-row gap-8 justify-center">
                  <Button
                      size="lg"
                      variant="secondary"
                      className="px-16 py-8 text-2xl font-bold bg-white text-blue-600 hover:bg-gray-100 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-200"
                      asChild
                  >
                    <Link href="/services">
                      <Zap className="mr-3 w-7 h-7" />
                      Începe Acum
                    </Link>
                  </Button>
                  <Button
                      size="lg"
                      variant="outline"
                      className="px-16 py-8 text-2xl font-bold border-3 border-white  hover:bg-white/10 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200 text-black dark:text-white"
                      aria-label="Înregistrează-te ca expert IT pe Nexora"
                  >
                    <Users className="mr-3 w-7 h-7" />
                    Devino Expert
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
  );
}

