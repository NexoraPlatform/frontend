import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
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
import { Link } from '@/lib/navigation';
import type {Metadata} from "next";
import {generateSEO} from "@/lib/seo";
import { TrustoraThemeStyles } from '@/components/trustora/theme-styles';
import { getTranslations } from 'next-intl/server';

type AboutPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isEnglish = locale?.toLowerCase().startsWith('en');

  return generateSEO({
    title: isEnglish ? 'About us' : 'Despre noi',
    description: isEnglish
      ? 'Discover Trustora’s mission, vision and values, the team behind the platform, and our journey so far.'
      : 'Vrei să afli mai multe despre Trustora? Aici găsești informații despre misiunea, viziunea și valorile noastre, echipa din spatele platformei și povestea noastră de succes.',
    url: '/about',
  });
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const values = [
    {
      icon: Shield,
      title: t('about.values.items.0.title'),
      description: t('about.values.items.0.description'),
    },
    {
      icon: Award,
      title: t('about.values.items.1.title'),
      description: t('about.values.items.1.description'),
    },
    {
      icon: Zap,
      title: t('about.values.items.2.title'),
      description: t('about.values.items.2.description'),
    },
    {
      icon: Heart,
      title: t('about.values.items.3.title'),
      description: t('about.values.items.3.description'),
    }
  ];

  const stats = [
    { number: '500+', label: t('about.stats.items.0.label') },
    { number: '2,000+', label: t('about.stats.items.1.label') },
    { number: '98%', label: t('about.stats.items.2.label') },
    { number: '50+', label: t('about.stats.items.3.label') }
  ];

  const team = [
    {
      name: t('about.team.items.0.name'),
      role: t('about.team.items.0.role'),
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200',
      description: t('about.team.items.0.description'),
    },
    {
      name: t('about.team.items.1.name'),
      role: t('about.team.items.1.role'),
      avatar: 'https://images.pexels.com/photos/3785077/pexels-photo-3785077.jpeg?auto=compress&cs=tinysrgb&w=200',
      description: t('about.team.items.1.description'),
    },
    {
      name: t('about.team.items.2.name'),
      role: t('about.team.items.2.role'),
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200',
      description: t('about.team.items.2.description'),
    },
    {
      name: t('about.team.items.3.name'),
      role: t('about.team.items.3.role'),
      avatar: 'https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=200',
      description: t('about.team.items.3.description'),
    }
  ];

  const milestones = [
    {
      year: '2020',
      title: t('about.timeline.items.0.title'),
      description: t('about.timeline.items.0.description'),
    },
    {
      year: '2021',
      title: t('about.timeline.items.1.title'),
      description: t('about.timeline.items.1.description'),
    },
    {
      year: '2022',
      title: t('about.timeline.items.2.title'),
      description: t('about.timeline.items.2.description'),
    },
    {
      year: '2023',
      title: t('about.timeline.items.3.title'),
      description: t('about.timeline.items.3.description'),
    },
    {
      year: '2024',
      title: t('about.timeline.items.4.title'),
      description: t('about.timeline.items.4.description'),
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#070C14]">
      <Header />
      <TrustoraThemeStyles />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 bg-white dark:bg-[#070C14] overflow-hidden">
        <div className="max-w-6xl mx-auto text-center">
          <Badge className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[#0B1C2D] text-xs font-bold dark:bg-[#111B2D] dark:border-[#1E2A3D] dark:text-[#E6EDF3]">
            <span className="text-[#1BC47D]">●</span> {t('about.hero.badge')}
          </Badge>
          <h1 className="text-4xl lg:text-6xl font-bold mb-6 text-[#0B1C2D] tracking-tight dark:text-[#E6EDF3]">
            {t('about.hero.title')} <span className="text-[#1BC47D]">{t('about.hero.highlight')}</span>
          </h1>
          <p className="text-xl text-slate-500 mb-10 max-w-3xl mx-auto dark:text-[#A3ADC2]">
              {t('about.hero.description')}
            </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="px-8 py-6 text-lg btn-primary" asChild>
              <Link href="/services">{t('about.hero.primary_cta')}</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="px-8 py-6 text-lg border border-slate-200 text-[#0B1C2D] hover:bg-slate-50 dark:border-[#1BC47D] dark:text-[#1BC47D] dark:hover:bg-[rgba(27,196,125,0.1)]"
            >
              {t('about.hero.secondary_cta')}
            </Button>
          </div>
          <div className="mt-12 border-b border-slate-100 dark:border-[#1E2A3D]" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 bg-[#F5F7FA] dark:bg-[#0B1220]">
        <div className="max-w-6xl mx-auto grid xs:grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((stat, index) => (
            <div key={index} className="glass-card px-6 py-8 shadow-sm">
              <div className="text-4xl lg:text-5xl font-bold text-[#0B1C2D] mb-2 dark:text-white">
                {stat.number}
              </div>
              <div className="text-sm uppercase tracking-[0.2em] text-slate-400 font-semibold dark:text-[#6B7285]">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section-divider" />

      {/* Mission & Vision */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto grid xs:grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mb-4 dark:text-[#6B7285]">
              {t('about.mission.kicker')}
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold mb-6 text-[#0B1C2D] dark:text-[#E6EDF3]">
              {t('about.mission.title')}
            </h2>
            <p className="text-lg text-slate-500 mb-8 dark:text-[#A3ADC2]">
              {t('about.mission.description')}
            </p>
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center dark:bg-[rgba(27,196,125,0.1)]">
                  <CheckCircle className="w-5 h-5 text-[#1BC47D]" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-[#0B1C2D] dark:text-[#E6EDF3]">{t('about.mission.points.0.title')}</h3>
                  <p className="text-slate-500 dark:text-[#A3ADC2]">{t('about.mission.points.0.description')}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center dark:bg-[rgba(27,196,125,0.1)]">
                  <CheckCircle className="w-5 h-5 text-[#1BC47D]" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-[#0B1C2D] dark:text-[#E6EDF3]">{t('about.mission.points.1.title')}</h3>
                  <p className="text-slate-500 dark:text-[#A3ADC2]">{t('about.mission.points.1.description')}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center dark:bg-[rgba(27,196,125,0.1)]">
                  <CheckCircle className="w-5 h-5 text-[#1BC47D]" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-[#0B1C2D] dark:text-[#E6EDF3]">{t('about.mission.points.2.title')}</h3>
                  <p className="text-slate-500 dark:text-[#A3ADC2]">{t('about.mission.points.2.description')}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="glass-card p-10 shadow-xl shadow-slate-200/40 dark:shadow-none">
            <div className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 dark:text-[#6B7285]">
              {t('about.vision.kicker')}
            </div>
            <div className="mt-8 space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center dark:bg-[rgba(27,196,125,0.1)]">
                <Target className="w-8 h-8 text-[#1BC47D]" />
              </div>
              <h3 className="text-2xl font-bold text-[#0B1C2D] dark:text-[#E6EDF3]">
                {t('about.vision.title')}
              </h3>
              <p className="text-slate-500 dark:text-[#A3ADC2] max-w-sm">
                {t('about.vision.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-divider" />

      {/* Values Section */}
      <section className="py-20 px-6 bg-[#F5F7FA] dark:bg-[#0B1220]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mb-4 dark:text-[#6B7285]">
              {t('about.values.kicker')}
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-[#0B1C2D] dark:text-[#E6EDF3]">
              {t('about.values.title')}
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto dark:text-[#A3ADC2]">
              {t('about.values.description')}
            </p>
          </div>

          <div className="grid xs:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div key={index} className="glass-card p-6 text-left hover:-translate-y-1 transition-transform">
                <div className="w-12 h-12 mb-4 bg-emerald-50 rounded-2xl flex items-center justify-center dark:bg-[rgba(27,196,125,0.1)]">
                  <value.icon className="w-6 h-6 text-[#1BC47D]" />
                </div>
                <h3 className="text-lg font-semibold text-[#0B1C2D] mb-2 dark:text-[#E6EDF3]">{value.title}</h3>
                <p className="text-sm text-slate-500 dark:text-[#A3ADC2]">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-[#0B1C2D] dark:text-[#E6EDF3]">
              {t('about.timeline.title')}
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto dark:text-[#A3ADC2]">
              {t('about.timeline.description')}
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative pl-8 space-y-10 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-slate-200 dark:before:bg-[#1E2A3D]">
              {milestones.map((milestone, index) => (
                <div key={index} className="relative flex gap-6">
                  <div className="absolute left-[-6px] top-2 w-4 h-4 rounded-full bg-[#1BC47D]" />
                  <div className="w-20">
                    <span className="inline-flex items-center justify-center rounded-full border border-slate-200 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:border-[#1E2A3D] dark:text-[#A3ADC2]">
                      {milestone.year}
                    </span>
                  </div>
                  <div className="glass-card p-6 flex-1">
                    <h3 className="text-xl font-bold mb-2 text-[#0B1C2D] dark:text-[#E6EDF3]">{milestone.title}</h3>
                    <p className="text-slate-500 dark:text-[#A3ADC2]">{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 px-6 bg-[#F5F7FA] dark:bg-[#0B1220]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mb-4 dark:text-[#6B7285]">
              {t('about.team.kicker')}
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-[#0B1C2D] dark:text-[#E6EDF3]">
              {t('about.team.title')}
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto dark:text-[#A3ADC2]">
              {t('about.team.description')}
            </p>
          </div>

          <div className="grid xs:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, index) => (
              <div key={index} className="glass-card p-6 text-left">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="w-14 h-14">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">{member.name}</h3>
                    <p className="text-sm font-medium text-[#1BC47D]">{member.role}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 dark:text-[#A3ADC2]">
                  {member.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-[#0B1C2D] text-white text-center dark:bg-[#0B1220]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl lg:text-5xl font-bold mb-6">
            {t('about.cta.title')}
          </h2>
          <p className="text-lg text-slate-400 mb-10 dark:text-[#A3ADC2]">
            {t('about.cta.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="px-8 py-6 text-lg btn-primary" asChild>
              <Link href="/services">{t('about.cta.primary_cta')}</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-6 text-lg border-white text-white hover:bg-white hover:text-[#0B1C2D]"
            >
              {t('about.cta.secondary_cta')}
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
