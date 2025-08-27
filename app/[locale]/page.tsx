import { Suspense } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { HeroSectionStatic } from "@/components/hero-section-static"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Code, Smartphone, Palette, TrendingUp, Shield, Zap, Users, Globe, Award, ChevronRight } from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { t } from '@/lib/i18n';
import { Locale } from '@/types/locale';

interface HomePageProps {
  params: {
    locale: Locale;
  };
}

const TestimonialsSection = dynamic(
    () => import("@/components/testimonials-section").then((m) => ({ default: m.TestimonialsSection })),
    {
      loading: () => (
          <div className="py-12 bg-gradient-to-b from-gray-50 to-purple-50/30 dark:from-gray-950/50 dark:to-purple-950/10">
            <div className="container mx-auto px-4">
              <div className="h-96 bg-white/90 dark:bg-gray-900/90 rounded-3xl animate-pulse" />
            </div>
          </div>
      ),
    },
)

// Simple testimonials loading fallback
const TestimonialsLoading = () => (
    <section className="py-12 bg-gradient-to-b from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-950/50 dark:via-blue-950/10 dark:to-purple-950/10 lazy-section">
      <div className="container mx-auto px-4">
        <div className="text-center mb-20">
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-8 animate-pulse" />
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg mx-auto max-w-2xl mb-8 animate-pulse" />
        </div>
        <div className="max-w-5xl mx-auto">
          <div className="h-96 bg-white/90 dark:bg-gray-900/90 rounded-3xl shadow-2xl animate-pulse" />
        </div>
      </div>
    </section>
)


export const revalidate = 86400 // 24 hours

export default async function Home({
                                       params,
                                   }: {
    params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await Promise.resolve(params);
  const [
    securePlatform,
    securePlatformDescription,
    expertTeam,
    expertTeamDescription,
    globalReach,
    globalReachDescription,
    awardWinning,
    awardWinningDescription,
    webDevelopmentTitle,
    webDevelopmentDescription,
    mobileAppsTitle,
    mobileAppsDescription,
    uiuxDesignTitle,
    uiuxDesignDescription,
    dataAnalyticsTitle,
    dataAnalyticsDescription,
    findMore,
    learnMoreAbout,
    exploreServicesInCategory,
  ] = await Promise.all([
    t(locale, "homepage.why_nexora.secure_platform"),
    t(locale, "homepage.why_nexora.secure_platform_description"),
    t(locale, "homepage.why_nexora.expert_team"),
    t(locale, "homepage.why_nexora.expert_team_description"),
    t(locale, "homepage.why_nexora.global_reach"),
    t(locale, "homepage.why_nexora.global_reach_description"),
    t(locale, "homepage.why_nexora.award_winning"),
    t(locale, "homepage.why_nexora.award_winning_description"),
    t(locale, "homepage.categories.web_development.title"),
    t(locale, "homepage.categories.web_development.description"),
    t(locale, "homepage.categories.mobile_apps.title"),
    t(locale, "homepage.categories.mobile_apps.description"),
    t(locale, "homepage.categories.ui_ux_design.title"),
    t(locale, "homepage.categories.ui_ux_design.description"),
    t(locale, "homepage.categories.data_analytics.title"),
    t(locale, "homepage.categories.data_analytics.description"),
    t(locale, "common.find_more"),
    t(locale, "common.learn_more_about"),
    t(locale, "homepage.explore_services_in_category"),
  ]);

  const CATEGORIES = [
    {
      title: webDevelopmentTitle,
      description: webDevelopmentDescription,
      icon: Code,
      color: "from-blue-500 to-blue-700",
      projects: "100",
      trend: "+20%",
      count: "50",
      avgPrice: "$500",
      slug: "web-development",
    },
    {
      title: mobileAppsTitle,
      description: mobileAppsDescription,
      icon: Smartphone,
      color: "from-green-500 to-green-700",
      projects: "80",
      trend: "+15%",
      count: "40",
      avgPrice: "$400",
      slug: "mobile-apps",
    },
    {
      title: uiuxDesignTitle,
      description: uiuxDesignDescription,
      icon: Palette,
      color: "from-red-500 to-red-700",
      projects: "120",
      trend: "+25%",
      count: "60",
      avgPrice: "$600",
      slug: "ui-ux-design",
    },
    {
      title: dataAnalyticsTitle,
      description: dataAnalyticsDescription,
      icon: TrendingUp,
      color: "from-yellow-500 to-yellow-700",
      projects: "90",
      trend: "+18%",
      count: "55",
      avgPrice: "$550",
      slug: "data-analytics",
    },
  ];

  const FEATURES = [
    {
      title: securePlatform,
      description: securePlatformDescription,
      icon: Shield,
      gradient: "from-blue-500 to-blue-700",
      stats: "99.9%",
    },
    {
      title: expertTeam,
      description: expertTeamDescription,
      icon: Users,
      gradient: "from-green-500 to-green-700",
      stats: "1000+",
    },
    {
      title: globalReach,
      description: globalReachDescription,
      icon: Globe,
      gradient: "from-red-500 to-red-700",
      stats: "150 countries",
    },
    {
      title: awardWinning,
      description: awardWinningDescription,
      icon: Award,
      gradient: "from-yellow-500 to-yellow-700",
      stats: "5 awards",
    },
  ];

  return (
      <div className="bg-background font-sans">
        <Header />

        <main role="main" aria-label="Conținut principal" id="main-content">
          <HeroSectionStatic locale={locale} />

          <section
              className="py-12 bg-gradient-to-b from-white via-blue-50/30 to-purple-50/30 dark:from-background dark:via-blue-950/10 dark:to-purple-950/10 relative overflow-hidden font-sans lazy-section"
              aria-labelledby="categories-heading"
          >
            <div className="container mx-auto px-4 relative">
              <div className="text-center mb-20">
                <Badge
                    variant="secondary"
                    className="mb-8 px-6 py-3 text-base font-semibold bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 border border-blue-200 dark:border-blue-800"
                >
                  <Globe className="w-5 h-5 mr-2" />
                  {await t(locale, 'homepage.features.badge')}
                </Badge>

                <h2 id="categories-heading" className="text-5xl lg:text-6xl font-black leading-tight mb-8">
                    {t(locale, "homepage.features.title")}
                </h2>

                <p className="text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium mb-12">
                    {t(locale, "homepage.features.subtitle")}
                </p>
              </div>

              <div
                  className="grid xs:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                  role="list"
                  aria-label="Lista categorii de servicii"
              >
                {CATEGORIES.map((category) => (
                    <Card
                        key={category.title}
                        className="group relative overflow-hidden border-2 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 hover:shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm will-change-transform"
                        role="listitem"
                        tabIndex={0}
                        aria-label={`Categorie ${category.title}: ${category.description}`}
                    >
                      <div className={`h-3 bg-gradient-to-r ${category.color}`} />

                      <CardHeader className="text-center pb-4 relative z-10">
                        <div
                            className={`w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-2xl relative`}
                            aria-hidden="true"
                        >
                          {category.icon && <category.icon className="w-12 h-12 text-white" />}
                          <div className="absolute inset-0 bg-white/20 rounded-3xl" />
                        </div>

                        <CardTitle className="text-2xl mb-4 group-hover:text-blue-600 transition-colors font-bold">
                          {category.title}
                        </CardTitle>

                        <CardDescription className="text-base leading-relaxed">{category.description}</CardDescription>
                      </CardHeader>

                      <CardContent className="text-center space-y-4 relative z-10">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="bg-blue-50 dark:bg-blue-900/50 rounded-lg p-3">
                            <div className="font-bold text-blue-600">{category.projects}</div>
                            <div className="text-xs">{t(locale, "common.completed")}</div>
                          </div>
                          <div className="bg-green-100 dark:bg-green-900 rounded-lg p-3">
                            <div className="font-bold text-green-900 dark:text-green-300">{category.trend}</div>
                            <div className="text-xs">{t(locale, "common.growth")}</div>
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
                              className="w-full mt-4 group-hover:bg-blue-50 dark:group-hover:bg-blue-950 font-semibold transition-colors"
                              aria-label={`${exploreServicesInCategory} ${category.title}`}
                              asChild
                          >
                            <Link href={`/services?category=${category.slug}`}>
                                {t(locale, "common.explore")}
                              <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                          </Button>
                      </CardContent>
                    </Card>
                ))}
              </div>
            </div>
          </section>

          <section className="py-12 relative overflow-hidden lazy-section" aria-labelledby="features-heading">
            <div
                className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-indigo-600/5"
                aria-hidden="true"
            />

            <div className="container mx-auto px-4 relative">
              <div className="text-center mb-20">
                <Badge
                    variant="secondary"
                    className="mb-8 px-6 py-3 text-base font-semibold bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/50 dark:to-blue-900/50 border border-green-200 dark:border-green-800"
                >
                  <Shield className="w-5 h-5 mr-2" />
                    {t(locale, "homepage.why_nexora.badge")}
                </Badge>

                <h2
                    id="features-heading"
                    className="text-5xl lg:text-6xl font-black mb-8 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent"
                >
                    {t(locale, "homepage.why_nexora.title")}
                </h2>

                <p className="text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                    {t(locale, "homepage.why_nexora.subtitle")}
                </p>
              </div>

              <div
                  className="grid xs:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                  role="list"
                  aria-label="Lista beneficii Nexora"
              >
                {FEATURES.map((feature, index) => (
                    <div
                        key={index}
                        className="text-center group relative"
                        role="listitem"
                        tabIndex={0}
                        aria-label={`Beneficiu ${feature.title}: ${feature.description}`}
                    >
                      <div className="relative mb-8">
                        <div
                            className={`w-28 h-28 mx-auto bg-gradient-to-br ${feature.gradient} rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-2xl relative overflow-hidden`}
                            aria-hidden="true"
                        >
                          {feature.icon && <feature.icon className="w-14 h-14 text-white relative z-10" />}
                          <div className="absolute inset-0 bg-white/20" />
                          <div className="absolute -inset-1 bg-gradient-to-r from-white/20 to-transparent rounded-3xl blur" />
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

                      <p className="text-base text-muted-foreground mb-6 leading-relaxed">{feature.description}</p>

                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Button
                              variant="ghost"
                              className="text-blue-600 font-semibold"
                              aria-label={`${learnMoreAbout} ${feature.title}`}
                              asChild
                          >
                            <Link href={`/${locale}/about`}>
                              {findMore}
                              <ChevronRight className="ml-2 w-4 h-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                  ))}
                </div>
            </div>
          </section>

          <Suspense fallback={<TestimonialsLoading />}>
            <TestimonialsSection />
          </Suspense>

          <section
              className="py-12 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white relative overflow-hidden lazy-section"
              aria-labelledby="cta-heading"
          >
            <div
                className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width=%2256%22%20height=%2256%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cpath%20d=%22M28%200l14%208v16l-14%208-14-8V8z%22%20fill=%22none%22%20stroke=%22%23ffffff%22%20strokeWidth=%221%22%20opacity=%220.1%22/%3E%3C/svg%3E')] opacity-20"
                aria-hidden="true"
            />

            <div className="container mx-auto px-4 text-center relative">
              <div className="max-w-4xl mx-auto">
                <h2 id="cta-heading" className="text-5xl lg:text-6xl font-black mb-8">
                    {t(locale, "homepage.cta.title")}
                </h2>

                <p className="text-2xl opacity-90 mb-16 leading-relaxed">
                    {t(locale, "homepage.cta.subtitle")}
                </p>

                <div className="flex flex-col sm:flex-row gap-8 justify-center">
                  <Button
                      size="lg"
                      variant="secondary"
                      className="px-16 py-8 text-2xl font-bold bg-white text-blue-600 hover:bg-gray-100 dark:text-black rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-200"
                      asChild
                  >
                    <Link href={`/${locale}/services`}>
                      <Zap className="mr-3 w-7 h-7" />
                        {t(locale, "homepage.cta.start_now")}
                    </Link>
                  </Button>

                  <Button
                      size="lg"
                      variant="outline"
                      className="px-16 py-8 text-2xl font-bold border-3 border-white hover:bg-white/10 rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-200 text-white hover:text-white bg-transparent"
                      asChild
                  >
                    <Link href={`/${locale}/auth/signup?type=provider`}>
                      <Users className="mr-3 w-7 h-7" />
                        {t(locale, "homepage.cta.become_expert")}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
  )
}
