import {
  Award,
  CheckCircle2,
  Heart,
  Shield,
  Sparkles,
  Target,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { TrustoraLandingFooter } from '@/components/homepage/trustora-landing/footer';
import { TrustoraLandingNavigation } from '@/components/homepage/trustora-landing/navigation';
import { TrustoraLandingThemeStyles } from '@/components/homepage/trustora-landing/theme-styles';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Link } from '@/lib/navigation';
type AboutValue = {
  description: string;
  icon: LucideIcon;
  title: string;
};

type AboutMilestone = {
  description: string;
  title: string;
  year: string;
};

type AboutTeamMember = {
  avatar: string;
  description: string;
  name: string;
  role: string;
};

const teamAvatars = [
  'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200',
  'https://images.pexels.com/photos/3785077/pexels-photo-3785077.jpeg?auto=compress&cs=tinysrgb&w=200',
  'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200',
  'https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=200',
];

export async function TrustoraAboutPage() {
  const t = await getTranslations();

  const values: AboutValue[] = [
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
    },
  ];

  const stats = [
    { number: '500+', label: t('about.stats.items.0.label') },
    { number: '2,000+', label: t('about.stats.items.1.label') },
    { number: '98%', label: t('about.stats.items.2.label') },
    { number: '50+', label: t('about.stats.items.3.label') },
  ];

  const missionPoints = [
    {
      title: t('about.mission.points.0.title'),
      description: t('about.mission.points.0.description'),
    },
    {
      title: t('about.mission.points.1.title'),
      description: t('about.mission.points.1.description'),
    },
    {
      title: t('about.mission.points.2.title'),
      description: t('about.mission.points.2.description'),
    },
  ];

  const team: AboutTeamMember[] = teamAvatars.map((avatar, index) => ({
    avatar,
    name: t(`about.team.items.${index}.name`),
    role: t(`about.team.items.${index}.role`),
    description: t(`about.team.items.${index}.description`),
  }));

  const milestones: AboutMilestone[] = [
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
    },
  ];

  return (
    <div className="trustora-about-page relative isolate overflow-x-hidden bg-background text-foreground">
      <TrustoraLandingThemeStyles scopeClassName="trustora-about-page" />

      <TrustoraLandingNavigation />

      <main className="relative z-10">
        <section className="relative isolate overflow-hidden pt-32">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
            <div className="absolute left-[-8rem] top-24 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute right-[-6rem] top-40 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
          </div>

          <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pb-28">
            <div className="flex flex-col items-center space-y-8">
                <div className="glass-effect inline-flex items-center rounded-full px-4 py-2">
                  <span className="mr-2 h-2 w-2 rounded-full bg-primary" />
                  <span className="text-sm font-medium">{t('about.hero.badge')}</span>
                </div>

                <div className="space-y-6">
                  <h1 className="text-5xl font-bold leading-tight sm:text-6xl lg:text-7xl text-center">
                    {t('about.hero.title')}{' '}
                    <span className="text-gradient">{t('about.hero.highlight')}</span>
                  </h1>
                  <p className="text-lg leading-8 text-muted-foreground sm:text-xl text-center">
                    {t('about.hero.description')}
                  </p>
                </div>

              {/*<div className="flex flex-col gap-4 sm:flex-row sm:justify-start">*/}
              {/*    <Button*/}
              {/*      asChild*/}
              {/*      size="lg"*/}
              {/*      className="rounded-xl bg-primary px-8 py-6 text-base font-medium text-white hover:bg-primary/90"*/}
              {/*    >*/}
              {/*      <Link href="/services">{t('about.hero.primary_cta')}</Link>*/}
              {/*    </Button>*/}
              {/*    <Button*/}
              {/*      asChild*/}
              {/*      size="lg"*/}
              {/*      variant="outline"*/}
              {/*      className="rounded-xl border-2 px-8 py-6 text-base font-medium"*/}
              {/*    >*/}
              {/*      <Link href="/contact">{t('about.hero.secondary_cta')}</Link>*/}
              {/*    </Button>*/}
              {/*  </div>*/}

                <div className="grid gap-4 pt-4 sm:grid-cols-3">
                  {missionPoints.map((point) => (
                    <div key={point.title} className="glass-effect rounded-2xl p-5">
                      <CheckCircle2 className="mb-3 h-5 w-5 text-primary" />
                      <h2 className="mb-2 text-base font-semibold">{point.title}</h2>
                      <p className="text-sm leading-6 text-muted-foreground">{point.description}</p>
                    </div>
                  ))}
                </div>
              </div>
          </div>
        </section>

        <section className="border-y border-white/5 bg-black/[0.02] py-16 dark:bg-white/[0.02]">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="relative">
              <div className="glass-effect relative overflow-hidden rounded-[2rem] border border-white/10 p-8 shadow-2xl">
                <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                      <Sparkles className="mr-2 h-4 w-4" />
                      {t('about.vision.kicker')}
                    </div>
                    <div className="space-y-3">
                      <h2 className="text-3xl font-bold leading-tight">
                        {t('about.vision.title')}
                      </h2>
                      <p className="text-base leading-7 text-muted-foreground">
                        {t('about.vision.description')}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-background/40 p-5">
                      <Target className="mb-3 h-8 w-8 text-primary" />
                      <div className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        {t('about.mission.kicker')}
                      </div>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        {t('about.mission.description')}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-background/40 p-5">
                      <Users className="mb-3 h-8 w-8 text-primary" />
                      <div className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        {t('about.team.kicker')}
                      </div>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        {t('about.team.description')}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {stats.slice(0, 4).map((stat) => (
                        <div
                            key={stat.label}
                            className="rounded-2xl border border-primary/10 bg-primary/5 p-5"
                        >
                          <div className="text-3xl font-bold text-primary">{stat.number}</div>
                          <div className="mt-2 text-sm text-muted-foreground">{stat.label}</div>
                        </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/*<section className="border-y border-white/5 bg-black/[0.02] py-16 dark:bg-white/[0.02]">*/}
        {/*  <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">*/}
        {/*    {stats.map((stat) => (*/}
        {/*      <div key={stat.label} className="glass-effect rounded-3xl px-6 py-8 text-center">*/}
        {/*        <div className="text-gradient text-4xl font-bold sm:text-5xl">{stat.number}</div>*/}
        {/*        <div className="mt-3 text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">*/}
        {/*          {stat.label}*/}
        {/*        </div>*/}
        {/*      </div>*/}
        {/*    ))}*/}
        {/*  </div>*/}
        {/*</section>*/}

        <section className="relative isolate overflow-hidden py-24">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/3 top-10 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
          </div>

          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
            <div className="glass-effect rounded-[2rem] p-8 sm:p-10">
              <div className="mb-6 text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                {t('about.mission.kicker')}
              </div>
              <h2 className="max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
                {t('about.mission.title')}
              </h2>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
                {t('about.mission.description')}
              </p>

              <div className="mt-10 space-y-5">
                {missionPoints.map((point) => (
                  <div
                    key={point.title}
                    className="flex items-start gap-4 rounded-2xl border border-white/10 bg-background/30 p-5"
                  >
                    <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{point.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {point.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-effect rounded-[2rem] p-8 sm:p-10">
              <div className="mb-5 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <Target className="mr-2 h-4 w-4" />
                {t('about.vision.kicker')}
              </div>
              <h2 className="text-3xl font-bold leading-tight">
                {t('about.vision.title')}
              </h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                {t('about.vision.description')}
              </p>

              <div className="mt-10 grid gap-4">
                <div className="rounded-2xl border border-primary/10 bg-primary/5 p-5">
                  <div className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Trustora
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {t('about.vision.highlights.trustora_body')}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-background/30 p-5">
                  <div className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    2030
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {t('about.vision.highlights.future_body')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/5 bg-black/[0.02] py-24 dark:bg-white/[0.02]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="glass-effect inline-flex items-center rounded-full px-4 py-2">
                <span className="text-sm font-medium text-primary">{t('about.values.kicker')}</span>
              </div>
              <h2 className="mt-6 text-4xl font-bold sm:text-5xl">
                {t('about.values.title')}
              </h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                {t('about.values.description')}
              </p>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {values.map((value) => {
                const Icon = value.icon;

                return (
                  <div
                    key={value.title}
                    className="glass-effect group rounded-[1.75rem] p-7 transition-transform duration-300 hover:-translate-y-1"
                  >
                    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold">{value.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      {value.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="glass-effect inline-flex items-center rounded-full px-4 py-2">
                <span className="text-sm font-medium text-primary">{t('about.timeline.title')}</span>
              </div>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                {t('about.timeline.description')}
              </p>
            </div>

            <div className="mt-16 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-6">
                {milestones.map((milestone) => (
                  <div
                    key={`${milestone.year}-${milestone.title}`}
                    className="glass-effect rounded-[1.75rem] p-6 sm:p-7"
                  >
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                      <div className="inline-flex w-fit items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                        {milestone.year}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold">{milestone.title}</h3>
                        <p className="mt-3 text-sm leading-7 text-muted-foreground">
                          {milestone.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="glass-effect rounded-[2rem] p-8 sm:p-10">
                <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Trustora
                </div>
                <h2 className="mt-6 text-3xl font-bold leading-tight">
                  {t('about.timeline.panel.title')}
                </h2>
                <p className="mt-5 text-base leading-8 text-muted-foreground">
                  {t('about.timeline.panel.description')}
                </p>

                <div className="mt-10 space-y-4">
                  {[
                    t('about.timeline.panel.points.0'),
                    t('about.timeline.panel.points.1'),
                    t('about.timeline.panel.points.2'),
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-background/30 px-4 py-4"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/5 bg-black/[0.02] py-24 dark:bg-white/[0.02]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="glass-effect inline-flex items-center rounded-full px-4 py-2">
                <span className="text-sm font-medium text-primary">{t('about.team.kicker')}</span>
              </div>
              <h2 className="mt-6 text-4xl font-bold sm:text-5xl">
                {t('about.team.title')}
              </h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                {t('about.team.description')}
              </p>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {team.map((member) => (
                <div key={member.name} className="glass-effect rounded-[1.75rem] p-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border border-white/10">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback>
                        {member.name
                          .split(' ')
                          .map((part) => part[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">{member.name}</h3>
                      <p className="text-sm font-medium text-primary">{member.role}</p>
                    </div>
                  </div>
                  <p className="mt-5 text-sm leading-7 text-muted-foreground">
                    {member.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative isolate overflow-hidden py-24">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />
            <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
          </div>

          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="glass-effect overflow-hidden rounded-[2rem] border border-primary/15 p-10 text-center sm:p-14">
              <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <Sparkles className="mr-2 h-4 w-4" />
                Trustora
              </div>
              <h2 className="mt-6 text-4xl font-bold leading-tight sm:text-5xl">
                {t('about.cta.title')}
              </h2>
              <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
                {t('about.cta.description')}
              </p>

              <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="rounded-xl bg-primary px-8 py-6 text-base font-medium text-white hover:bg-primary/90"
                >
                  <Link href="/services">{t('about.cta.primary_cta')}</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-xl border-2 px-8 py-6 text-base font-medium"
                >
                  <Link href="/auth/signup">{t('about.cta.secondary_cta')}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <TrustoraLandingFooter />
    </div>
  );
}
