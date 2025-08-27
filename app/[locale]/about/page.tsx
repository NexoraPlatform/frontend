import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Target,
  Award,
  Heart,
  Zap,
  Shield,
  CheckCircle,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import type { Metadata } from 'next';
import { generateSEO } from '@/lib/seo';
import { t } from '@/lib/i18n';
import { Locale } from '@/types/locale';

export async function generateMetadata({ params }: { params: { locale: Locale } }): Promise<Metadata> {
  const { locale } = params;
  const [title, description] = await Promise.all([
    t(locale, 'about.metadata.title'),
    t(locale, 'about.metadata.description'),
  ]);
  return generateSEO({ title, description, url: '/about' });
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await Promise.resolve(params);

  const [
    heroBadge,
    heroTitle,
    heroDescription,
    exploreServices,
    joinTeam,
    citiesCoveredLabel,
    missionTitle,
    missionDescription,
    accessibilityTitle,
    accessibilityDesc,
    transparencyTitle,
    transparencyDesc,
    excellenceTitle,
    excellenceDesc,
    visionTitle,
    visionDescription,
    valuesTitle,
    valuesDescription,
    trustTitle,
    trustDesc,
    qualityTitle,
    qualityDesc,
    efficiencyTitle,
    efficiencyDesc,
    supportTitle,
    supportDesc,
    timelineTitle,
    timelineDescription,
    milestone2020Title,
    milestone2020Desc,
    milestone2021Title,
    milestone2021Desc,
    milestone2022Title,
    milestone2022Desc,
    milestone2023Title,
    milestone2023Desc,
    milestone2024Title,
    milestone2024Desc,
    teamTitle,
    teamDescription,
    alexRole,
    alexDesc,
    mariaRole,
    mariaDesc,
    andreiRole,
    andreiDesc,
    dianaRole,
    dianaDesc,
    ctaTitle,
    ctaDescription,
    findExperts,
    becomeProvider,
    verifiedExpertsLabel,
    completedProjectsLabel,
    satisfactionRateLabel,
  ] = await Promise.all([
    t(locale, 'about.hero.badge'),
    t(locale, 'about.hero.title'),
    t(locale, 'about.hero.description'),
    t(locale, 'about.hero.explore_services'),
    t(locale, 'about.hero.join_team'),
    t(locale, 'about.stats.cities_covered'),
    t(locale, 'about.mission.title'),
    t(locale, 'about.mission.description'),
    t(locale, 'about.mission.bullets.accessibility.title'),
    t(locale, 'about.mission.bullets.accessibility.description'),
    t(locale, 'about.mission.bullets.transparency.title'),
    t(locale, 'about.mission.bullets.transparency.description'),
    t(locale, 'about.mission.bullets.excellence.title'),
    t(locale, 'about.mission.bullets.excellence.description'),
    t(locale, 'about.mission.vision_title'),
    t(locale, 'about.mission.vision_description'),
    t(locale, 'about.values.title'),
    t(locale, 'about.values.description'),
    t(locale, 'about.values.trust_safety.title'),
    t(locale, 'about.values.trust_safety.description'),
    t(locale, 'about.values.exceptional_quality.title'),
    t(locale, 'about.values.exceptional_quality.description'),
    t(locale, 'about.values.efficiency_speed.title'),
    t(locale, 'about.values.efficiency_speed.description'),
    t(locale, 'about.values.dedicated_support.title'),
    t(locale, 'about.values.dedicated_support.description'),
    t(locale, 'about.timeline.title'),
    t(locale, 'about.timeline.description'),
    t(locale, 'about.timeline.milestones.2020.title'),
    t(locale, 'about.timeline.milestones.2020.description'),
    t(locale, 'about.timeline.milestones.2021.title'),
    t(locale, 'about.timeline.milestones.2021.description'),
    t(locale, 'about.timeline.milestones.2022.title'),
    t(locale, 'about.timeline.milestones.2022.description'),
    t(locale, 'about.timeline.milestones.2023.title'),
    t(locale, 'about.timeline.milestones.2023.description'),
    t(locale, 'about.timeline.milestones.2024.title'),
    t(locale, 'about.timeline.milestones.2024.description'),
    t(locale, 'about.team.title'),
    t(locale, 'about.team.description'),
    t(locale, 'about.team.alexandru_popescu.role'),
    t(locale, 'about.team.alexandru_popescu.description'),
    t(locale, 'about.team.maria_ionescu.role'),
    t(locale, 'about.team.maria_ionescu.description'),
    t(locale, 'about.team.andrei_radu.role'),
    t(locale, 'about.team.andrei_radu.description'),
    t(locale, 'about.team.diana_stoica.role'),
    t(locale, 'about.team.diana_stoica.description'),
    t(locale, 'about.cta.title'),
    t(locale, 'about.cta.description'),
    t(locale, 'about.cta.find_experts'),
    t(locale, 'about.cta.become_provider'),
    t(locale, 'common.verified_experts'),
    t(locale, 'common.completed_projects'),
    t(locale, 'common.satisfaction_rate'),
  ]);

  const stats = [
    { number: '500+', label: verifiedExpertsLabel },
    { number: '2,000+', label: completedProjectsLabel },
    { number: '98%', label: satisfactionRateLabel },
    { number: '50+', label: citiesCoveredLabel },
  ];

  const missionBullets = [
    { title: accessibilityTitle, description: accessibilityDesc },
    { title: transparencyTitle, description: transparencyDesc },
    { title: excellenceTitle, description: excellenceDesc },
  ];

  const values = [
    { icon: Shield, title: trustTitle, description: trustDesc },
    { icon: Award, title: qualityTitle, description: qualityDesc },
    { icon: Zap, title: efficiencyTitle, description: efficiencyDesc },
    { icon: Heart, title: supportTitle, description: supportDesc },
  ];

  const milestones = [
    { year: '2020', title: milestone2020Title, description: milestone2020Desc },
    { year: '2021', title: milestone2021Title, description: milestone2021Desc },
    { year: '2022', title: milestone2022Title, description: milestone2022Desc },
    { year: '2023', title: milestone2023Title, description: milestone2023Desc },
    { year: '2024', title: milestone2024Title, description: milestone2024Desc },
  ];

  const team = [
    {
      name: 'Alexandru Popescu',
      role: alexRole,
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200',
      description: alexDesc,
    },
    {
      name: 'Maria Ionescu',
      role: mariaRole,
      avatar: 'https://images.pexels.com/photos/3785077/pexels-photo-3785077.jpeg?auto=compress&cs=tinysrgb&w=200',
      description: mariaDesc,
    },
    {
      name: 'Andrei Radu',
      role: andreiRole,
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200',
      description: andreiDesc,
    },
    {
      name: 'Diana Stoica',
      role: dianaRole,
      avatar: 'https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=200',
      description: dianaDesc,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6">
              {heroBadge}
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              {heroTitle}
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              {heroDescription}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8 py-6 text-lg" asChild>
                <Link href="/services">{exploreServices}</Link>
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-6 text-lg">
                {joinTeam}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid xs:grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="text-4xl lg:text-5xl font-bold text-primary">
                  {stat.number}
                </div>
                <div className="text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid xs:grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                {missionTitle}
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                {missionDescription}
              </p>
              <div className="space-y-4">
                {missionBullets.map((bullet, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-1">{bullet.title}</h3>
                      <p className="text-muted-foreground">{bullet.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Target className="w-16 h-16 text-primary mx-auto" />
                  <h3 className="text-2xl font-bold">{visionTitle}</h3>
                  <p className="text-muted-foreground max-w-xs">
                    {visionDescription}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              {valuesTitle}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {valuesDescription}
            </p>
          </div>

          <div className="grid xs:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center border-2 hover:border-primary/20 transition-colors">
                <CardHeader>
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <value.icon className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {value.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              {timelineTitle}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {timelineDescription}
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                      {milestone.year}
                    </div>
                  </div>
                  <div className="flex-1 pb-8">
                    <h3 className="text-xl font-bold mb-2">{milestone.title}</h3>
                    <p className="text-muted-foreground">{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              {teamTitle}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {teamDescription}
            </p>
          </div>

          <div className="grid xs:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="text-center border-2 hover:border-primary/20 transition-colors">
                <CardHeader>
                  <Avatar className="w-24 h-24 mx-auto mb-4">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-xl">{member.name}</CardTitle>
                  <CardDescription className="text-primary font-medium">
                    {member.role}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {member.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            {ctaTitle}
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            {ctaDescription}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="px-8 py-6 text-lg" asChild>
              <Link href="/services">{findExperts}</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-6 text-lg border-white text-white hover:bg-white hover:text-primary"
            >
              {becomeProvider}
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
