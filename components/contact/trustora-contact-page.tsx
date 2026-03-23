import {
  Briefcase,
  Building,
  Clock,
  HeadphonesIcon,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { TrustoraLandingFooter } from '@/components/homepage/trustora-landing/footer';
import { TrustoraLandingNavigation } from '@/components/homepage/trustora-landing/navigation';
import { TrustoraLandingThemeStyles } from '@/components/homepage/trustora-landing/theme-styles';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Link } from '@/lib/navigation';
type ContactInfoItem = {
  description: string;
  icon: LucideIcon;
  primary: string;
  secondary: string;
  title: string;
};

type DepartmentItem = {
  description: string;
  email: string;
  icon: LucideIcon;
  title: string;
};

type OfficeItem = {
  address: string;
  city: string;
  email: string;
  phone: string;
  primary: boolean;
};

export async function TrustoraContactPage() {
  const t = await getTranslations();

  const contactInfo: ContactInfoItem[] = [
    {
      icon: Mail,
      title: t('contact.info.email.title'),
      primary: t('contact.info.email.primary'),
      secondary: t('contact.info.email.secondary'),
      description: t('contact.info.email.description'),
    },
    {
      icon: Phone,
      title: t('contact.info.phone.title'),
      primary: t('contact.info.phone.primary'),
      secondary: t('contact.info.phone.secondary'),
      description: t('contact.info.phone.description'),
    },
    {
      icon: MapPin,
      title: t('contact.info.address.title'),
      primary: t('contact.info.address.primary'),
      secondary: t('contact.info.address.secondary'),
      description: t('contact.info.address.description'),
    },
    {
      icon: Clock,
      title: t('contact.info.hours.title'),
      primary: t('contact.info.hours.primary'),
      secondary: t('contact.info.hours.secondary'),
      description: t('contact.info.hours.description'),
    },
  ];

  const departments: DepartmentItem[] = [
    {
      icon: Users,
      title: t('contact.departments.support.title'),
      email: t('contact.departments.support.email'),
      description: t('contact.departments.support.description'),
    },
    {
      icon: Briefcase,
      title: t('contact.departments.partnerships.title'),
      email: t('contact.departments.partnerships.email'),
      description: t('contact.departments.partnerships.description'),
    },
    {
      icon: Building,
      title: t('contact.departments.press.title'),
      email: t('contact.departments.press.email'),
      description: t('contact.departments.press.description'),
    },
    {
      icon: HeadphonesIcon,
      title: t('contact.departments.technical.title'),
      email: t('contact.departments.technical.email'),
      description: t('contact.departments.technical.description'),
    },
  ];

  const offices: OfficeItem[] = [
    {
      city: t('contact.offices.bucharest.city'),
      address: t('contact.offices.bucharest.address'),
      phone: t('contact.offices.bucharest.phone'),
      email: t('contact.offices.bucharest.email'),
      primary: true,
    },
    {
      city: t('contact.offices.cluj.city'),
      address: t('contact.offices.cluj.address'),
      phone: t('contact.offices.cluj.phone'),
      email: t('contact.offices.cluj.email'),
      primary: false,
    },
    {
      city: t('contact.offices.timisoara.city'),
      address: t('contact.offices.timisoara.address'),
      phone: t('contact.offices.timisoara.phone'),
      email: t('contact.offices.timisoara.email'),
      primary: false,
    },
  ];

  return (
    <div className="project-homepage relative isolate overflow-x-hidden bg-background text-foreground">
      <TrustoraLandingThemeStyles />

      <TrustoraLandingNavigation />

      <main className="relative z-10">
        <section className="relative isolate overflow-hidden pt-32">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
            <div className="absolute left-[-8rem] top-20 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute right-[-6rem] top-36 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
          </div>

          <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pb-24">
            <div className="flex flex-col items-center space-y-8 text-center">
              <div className="space-y-8">
                <div className="glass-effect inline-flex items-center rounded-full px-4 py-2">
                  <span className="mr-2 h-2 w-2 rounded-full bg-primary" />
                  <span className="text-sm font-medium">{t('contact.hero.badge')}</span>
                </div>

                <div className="mx-auto max-w-4xl space-y-6">
                  <h1 className="text-5xl font-bold leading-tight sm:text-6xl lg:text-7xl">
                    {t.rich('contact.hero.title', {
                      highlight: (chunks) => <span className="text-gradient">{chunks}</span>,
                    })}
                  </h1>
                  <p className="mx-auto max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
                    {t('contact.hero.description')}
                  </p>
                </div>
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
                      <MessageCircle className="mr-2 h-4 w-4" />
                      {t('contact.quick.eyebrow')}
                    </div>

                    <div className="space-y-3">
                      <h2 className="text-3xl font-bold leading-tight">{t('contact.quick.title')}</h2>
                      <p className="max-w-3xl text-base leading-7 text-muted-foreground">
                        {t('contact.quick.chat.description')}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="rounded-3xl border border-primary/20 bg-primary/10 p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_18px_50px_rgba(27,196,125,0.25)]">
                          <MessageCircle className="h-7 w-7" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div>
                            <h3 className="text-xl font-semibold">{t('contact.quick.chat.title')}</h3>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                              {t('contact.quick.chat.description')}
                            </p>
                          </div>
                          <div>
                            <div className="font-semibold text-primary">{t('contact.quick.chat.status')}</div>
                            <div className="text-sm text-muted-foreground">
                              {t('contact.quick.chat.response_time')}
                            </div>
                          </div>
                          <Button className="rounded-xl bg-primary text-white hover:bg-primary/90">
                            {t('contact.quick.chat.cta')}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4">
                      {contactInfo.slice(0, 2).map((item) => {
                        const Icon = item.icon;

                        return (
                          <div
                            key={item.title}
                            className="rounded-2xl border border-white/10 bg-background/40 p-5"
                          >
                            <Icon className="mb-4 h-6 w-6 text-primary" />
                            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                              {item.title}
                            </div>
                            <div className="mt-3 text-sm font-semibold">{item.primary}</div>
                            <div className="mt-1 text-sm text-muted-foreground">{item.secondary}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {contactInfo.map((info) => {
                const Icon = info.icon;

                return (
                  <Card
                    key={info.title}
                    className="glass-effect rounded-[1.75rem] border border-white/10 text-center shadow-none"
                  >
                    <CardHeader className="space-y-4 pb-3">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{info.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="font-semibold">{info.primary}</div>
                      <div className="text-muted-foreground">{info.secondary}</div>
                      <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        {info.description}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-white/5 bg-black/[0.02] py-16 dark:bg-white/[0.02]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <div className="glass-effect inline-flex items-center rounded-full px-4 py-2">
                  <span className="text-sm font-medium text-primary">{t('contact.form.eyebrow')}</span>
                </div>
                <h2 className="mt-6 text-4xl font-bold sm:text-5xl">{t('contact.form.title')}</h2>

                <Card className="glass-effect mt-8 rounded-[2rem] border border-white/10 shadow-none">
                  <CardContent className="p-6 sm:p-8">
                    <form className="space-y-6">
                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="space-y-2">
                          <label htmlFor="contact-name" className="text-sm font-medium">
                            {t('contact.form.fields.name.label')}
                          </label>
                          <Input
                            id="contact-name"
                            name="name"
                            type="text"
                            autoComplete="name"
                            placeholder={t('contact.form.fields.name.placeholder')}
                            className="h-12 rounded-xl border-white/10 bg-white/70 dark:bg-[#0B1220]"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="contact-email" className="text-sm font-medium">
                            {t('contact.form.fields.email.label')}
                          </label>
                          <Input
                            id="contact-email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            placeholder={t('contact.form.fields.email.placeholder')}
                            className="h-12 rounded-xl border-white/10 bg-white/70 dark:bg-[#0B1220]"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid gap-5 md:grid-cols-2">
                        <div className="space-y-2">
                          <label htmlFor="contact-phone" className="text-sm font-medium">
                            {t('contact.form.fields.phone.label')}
                          </label>
                          <Input
                            id="contact-phone"
                            name="phone"
                            type="tel"
                            autoComplete="tel"
                            placeholder={t('contact.form.fields.phone.placeholder')}
                            className="h-12 rounded-xl border-white/10 bg-white/70 dark:bg-[#0B1220]"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="contact-company" className="text-sm font-medium">
                            {t('contact.form.fields.company.label')}
                          </label>
                          <Input
                            id="contact-company"
                            name="company"
                            type="text"
                            autoComplete="organization"
                            placeholder={t('contact.form.fields.company.placeholder')}
                            className="h-12 rounded-xl border-white/10 bg-white/70 dark:bg-[#0B1220]"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="contact-subject" className="text-sm font-medium">
                          {t('contact.form.fields.subject.label')}
                        </label>
                        <Input
                          id="contact-subject"
                          name="subject"
                          type="text"
                          placeholder={t('contact.form.fields.subject.placeholder')}
                          className="h-12 rounded-xl border-white/10 bg-white/70 dark:bg-[#0B1220]"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="contact-message" className="text-sm font-medium">
                          {t('contact.form.fields.message.label')}
                        </label>
                        <textarea
                          id="contact-message"
                          name="message"
                          className="min-h-36 w-full rounded-[1.25rem] border border-white/10 bg-white/70 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary dark:bg-[#0B1220]"
                          placeholder={t('contact.form.fields.message.placeholder')}
                          required
                        />
                      </div>

                      <label
                        htmlFor="contact-privacy"
                        className="flex items-start gap-3 rounded-2xl border border-white/10 bg-background/30 p-4 text-sm text-muted-foreground"
                      >
                        <input
                          type="checkbox"
                          id="contact-privacy"
                          name="privacy"
                          className="mt-1 rounded border-slate-300 text-primary focus:ring-primary"
                          required
                        />
                        <span>
                          {t('contact.form.privacy.consent')}{' '}
                          <Link href="/privacy" className="text-primary hover:underline">
                            {t('contact.form.privacy.link')}
                          </Link>
                        </span>
                      </label>

                      <Button
                        type="submit"
                        className="h-12 w-full rounded-xl bg-primary text-base font-medium text-white hover:bg-primary/90"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        {t('contact.form.submit')}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-8">
                <div>
                  <div className="glass-effect inline-flex items-center rounded-full px-4 py-2">
                    <span className="text-sm font-medium text-primary">{t('contact.departments.title')}</span>
                  </div>
                  <div className="mt-6 space-y-4">
                    {departments.map((department) => {
                      const Icon = department.icon;

                      return (
                        <Card
                          key={department.title}
                          className="glass-effect rounded-[1.5rem] border border-white/10 shadow-none transition-transform duration-300 hover:-translate-y-1"
                        >
                          <CardContent className="p-5">
                            <div className="flex items-start gap-4">
                              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                                <Icon className="h-5 w-5 text-primary" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="font-semibold">{department.title}</h3>
                                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                  {department.description}
                                </p>
                                <a
                                  href={`mailto:${department.email}`}
                                  className="mt-3 inline-block text-sm text-primary hover:underline"
                                >
                                  {department.email}
                                </a>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>

                <Card className="glass-effect rounded-[2rem] border border-white/10 shadow-none">
                  <CardHeader className="space-y-3">
                    <CardTitle className="text-2xl">{t('contact.map.title')}</CardTitle>
                    <CardDescription className="text-base leading-7 text-muted-foreground">
                      {t('contact.map.subtitle')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex aspect-video items-center justify-center rounded-[1.5rem] border border-white/10 bg-white/60 dark:bg-[#0B1220]">
                      <div className="space-y-2 text-center">
                        <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="text-muted-foreground">{t('contact.map.placeholder.title')}</p>
                        <p className="text-sm text-muted-foreground">
                          {t('contact.map.placeholder.address')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="glass-effect inline-flex items-center rounded-full px-4 py-2">
                <span className="text-sm font-medium text-primary">{t('contact.offices.title')}</span>
              </div>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">
                {t('contact.offices.subtitle')}
              </p>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {offices.map((office) => (
                <Card
                  key={office.city}
                  className={`glass-effect rounded-[1.75rem] border shadow-none ${
                    office.primary ? 'border-primary/40 bg-primary/5' : 'border-white/10'
                  }`}
                >
                  <CardHeader className="space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <CardTitle className="text-xl">{office.city}</CardTitle>
                      {office.primary ? (
                        <Badge className="rounded-full bg-primary text-white hover:bg-primary">
                          {t('contact.offices.primary')}
                        </Badge>
                      ) : null}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <span className="text-muted-foreground">{office.address}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <a href={`tel:${office.phone}`} className="text-muted-foreground hover:text-primary">
                        {office.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <a href={`mailto:${office.email}`} className="text-muted-foreground hover:text-primary">
                        {office.email}
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-white/5 bg-black/[0.02] py-16 dark:bg-white/[0.02]">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="glass-effect overflow-hidden rounded-[2rem] border border-white/10 p-8 text-center shadow-none sm:p-10">
              <h2 className="text-3xl font-bold sm:text-4xl">{t('contact.cta.title')}</h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
                {t('contact.cta.description')}
              </p>
              <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                <Button size="lg" className="rounded-xl bg-primary px-8 text-base text-white hover:bg-primary/90">
                  {t('contact.cta.primary')}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-xl border-white/10 px-8 text-base"
                >
                  {t('contact.cta.secondary')}
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
