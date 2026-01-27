import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TrustoraThemeStyles } from '@/components/trustora/theme-styles';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageCircle,
  Send,
  Building,
  Users,
  Briefcase,
  HeadphonesIcon
} from 'lucide-react';
import type {Metadata} from "next";
import {generateSEO} from "@/lib/seo";
import { getTranslations } from 'next-intl/server';

type ContactPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isEnglish = locale?.toLowerCase().startsWith('en');

  return generateSEO({
    title: isEnglish
      ? 'Contact Trustora - Support & Information'
      : 'Contactează Trustora - Suport și Informații',
    description: isEnglish
      ? 'Have a question or want to collaborate with Trustora? Reach out for fast support and service information.'
      : 'Ai o intrebare sau vrei să colaborezi cu Trustora? Contactează-ne pentru suport rapid și informații despre serviciile noastre.',
    url: '/contact',
  });
}

export default async function ContactPage() {
  const t = await getTranslations();
  const contactInfo = [
    {
      icon: Mail,
      title: t('contact.info.email.title'),
      primary: t('contact.info.email.primary'),
      secondary: t('contact.info.email.secondary'),
      description: t('contact.info.email.description')
    },
    {
      icon: Phone,
      title: t('contact.info.phone.title'),
      primary: t('contact.info.phone.primary'),
      secondary: t('contact.info.phone.secondary'),
      description: t('contact.info.phone.description')
    },
    {
      icon: MapPin,
      title: t('contact.info.address.title'),
      primary: t('contact.info.address.primary'),
      secondary: t('contact.info.address.secondary'),
      description: t('contact.info.address.description')
    },
    {
      icon: Clock,
      title: t('contact.info.hours.title'),
      primary: t('contact.info.hours.primary'),
      secondary: t('contact.info.hours.secondary'),
      description: t('contact.info.hours.description')
    }
  ];

  const departments = [
    {
      icon: Users,
      title: t('contact.departments.support.title'),
      email: t('contact.departments.support.email'),
      description: t('contact.departments.support.description')
    },
    {
      icon: Briefcase,
      title: t('contact.departments.partnerships.title'),
      email: t('contact.departments.partnerships.email'),
      description: t('contact.departments.partnerships.description')
    },
    {
      icon: Building,
      title: t('contact.departments.press.title'),
      email: t('contact.departments.press.email'),
      description: t('contact.departments.press.description')
    },
    {
      icon: HeadphonesIcon,
      title: t('contact.departments.technical.title'),
      email: t('contact.departments.technical.email'),
      description: t('contact.departments.technical.description')
    }
  ];

  const offices = [
    {
      city: t('contact.offices.bucharest.city'),
      address: t('contact.offices.bucharest.address'),
      phone: t('contact.offices.bucharest.phone'),
      email: t('contact.offices.bucharest.email'),
      primary: true
    },
    {
      city: t('contact.offices.cluj.city'),
      address: t('contact.offices.cluj.address'),
      phone: t('contact.offices.cluj.phone'),
      email: t('contact.offices.cluj.email'),
      primary: false
    },
    {
      city: t('contact.offices.timisoara.city'),
      address: t('contact.offices.timisoara.address'),
      phone: t('contact.offices.timisoara.phone'),
      email: t('contact.offices.timisoara.email'),
      primary: false
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#070C14]">
      <Header />
      <TrustoraThemeStyles />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 hero-gradient">
        <div className="max-w-5xl mx-auto text-center">
          <Badge className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[#0B1C2D] text-xs font-bold dark:bg-[#111B2D] dark:border-[#1E2A3D] dark:text-[#E6EDF3]">
            <span className="text-[#1BC47D]">●</span> {t('contact.hero.badge')}
          </Badge>
          <h1 className="text-4xl lg:text-6xl font-bold mb-6 text-[#0B1C2D] tracking-tight dark:text-[#E6EDF3]">
            {t.rich('contact.hero.title', {
              highlight: (chunks) => <span className="text-[#1BC47D]">{chunks}</span>,
            })}
          </h1>
          <p className="text-xl text-slate-500 mb-8 max-w-3xl mx-auto dark:text-[#A3ADC2]">
            {t('contact.hero.description')}
          </p>
          <div className="mt-10 border-b border-slate-100 dark:border-[#1E2A3D]" />
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-16 px-6 bg-white dark:bg-[#070C14]">
        <div className="max-w-6xl mx-auto">
          <div className="grid xs:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => (
              <Card key={index} className="text-center glass-card shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="w-14 h-14 mx-auto mb-4 bg-emerald-50 rounded-2xl flex items-center justify-center dark:bg-[rgba(27,196,125,0.1)]">
                    <info.icon className="w-6 h-6 text-[#1BC47D]" />
                  </div>
                  <CardTitle className="text-lg text-[#0B1C2D] dark:text-[#E6EDF3]">{info.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="font-semibold text-[#0B1C2D] dark:text-[#E6EDF3]">{info.primary}</div>
                    <div className="text-slate-500 dark:text-[#A3ADC2]">{info.secondary}</div>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-[#6B7285]">{info.description}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Quick Contact */}
      <section className="py-20 px-6 bg-[#F5F7FA] dark:bg-[#0B1220]">
        <div className="max-w-6xl mx-auto">
          <div className="grid xs:grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mb-4 dark:text-[#6B7285]">
                {t('contact.form.eyebrow')}
              </p>
              <h2 className="text-3xl font-bold mb-6 text-[#0B1C2D] dark:text-[#E6EDF3]">
                {t('contact.form.title')}
              </h2>
              <Card className="glass-card">
                <CardContent className="p-6 space-y-6">
                  <form className="space-y-6">
                    <div className="grid xs:grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block text-[#0B1C2D] dark:text-[#E6EDF3]">
                          {t('contact.form.fields.name.label')}
                        </label>
                        <Input placeholder={t('contact.form.fields.name.placeholder')} required />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block text-[#0B1C2D] dark:text-[#E6EDF3]">
                          {t('contact.form.fields.email.label')}
                        </label>
                        <Input type="email" placeholder={t('contact.form.fields.email.placeholder')} required />
                      </div>
                    </div>

                    <div className="grid xs:grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block text-[#0B1C2D] dark:text-[#E6EDF3]">
                          {t('contact.form.fields.phone.label')}
                        </label>
                        <Input placeholder={t('contact.form.fields.phone.placeholder')} />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block text-[#0B1C2D] dark:text-[#E6EDF3]">
                          {t('contact.form.fields.company.label')}
                        </label>
                        <Input placeholder={t('contact.form.fields.company.placeholder')} />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block text-[#0B1C2D] dark:text-[#E6EDF3]">
                        {t('contact.form.fields.subject.label')}
                      </label>
                      <Input placeholder={t('contact.form.fields.subject.placeholder')} required />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block text-[#0B1C2D] dark:text-[#E6EDF3]">
                        {t('contact.form.fields.message.label')}
                      </label>
                      <textarea
                        className="w-full min-h-32 px-3 py-2 border border-slate-200 bg-white rounded-md text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1BC47D] focus:ring-offset-2 dark:border-[#1E2A3D] dark:bg-[#0B1220] dark:text-[#E6EDF3] dark:placeholder:text-[#6B7285]"
                        placeholder={t('contact.form.fields.message.placeholder')}
                        required
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="privacy" className="rounded border-slate-300 text-[#1BC47D] focus:ring-[#1BC47D]" required />
                      <label htmlFor="privacy" className="text-sm text-slate-500 dark:text-[#A3ADC2]">
                        {t('contact.form.privacy.consent')}{' '}
                        <a href="/privacy" className="text-[#1BC47D] hover:underline">
                          {t('contact.form.privacy.link')}
                        </a>
                      </label>
                    </div>

                    <Button className="w-full btn-primary" size="lg">
                      <Send className="w-4 h-4 mr-2" />
                      {t('contact.form.submit')}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Quick Contact & Departments */}
            <div className="space-y-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 mb-4 dark:text-[#6B7285]">
                  {t('contact.quick.eyebrow')}
                </p>
                <h2 className="text-3xl font-bold mb-6 text-[#0B1C2D] dark:text-[#E6EDF3]">
                  {t('contact.quick.title')}
                </h2>
                <Card className="glass-card border-2 border-[#1BC47D]/20">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-[#0B1C2D] dark:text-[#E6EDF3]">
                      <MessageCircle className="w-5 h-5 text-[#1BC47D]" />
                      <span>{t('contact.quick.chat.title')}</span>
                    </CardTitle>
                    <CardDescription className="text-slate-500 dark:text-[#A3ADC2]">
                      {t('contact.quick.chat.description')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-[#1BC47D]">{t('contact.quick.chat.status')}</div>
                        <div className="text-sm text-slate-500 dark:text-[#A3ADC2]">
                          {t('contact.quick.chat.response_time')}
                        </div>
                      </div>
                      <Button className="btn-primary">
                        {t('contact.quick.chat.cta')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4 text-[#0B1C2D] dark:text-[#E6EDF3]">
                  {t('contact.departments.title')}
                </h3>
                <div className="space-y-4">
                  {departments.map((dept, index) => (
                    <Card key={index} className="glass-card hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0 dark:bg-[rgba(27,196,125,0.1)]">
                            <dept.icon className="w-5 h-5 text-[#1BC47D]" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1 text-[#0B1C2D] dark:text-[#E6EDF3]">{dept.title}</h4>
                            <p className="text-sm text-slate-500 mb-2 dark:text-[#A3ADC2]">{dept.description}</p>
                            <a href={`mailto:${dept.email}`} className="text-sm text-[#1BC47D] hover:underline">
                              {dept.email}
                            </a>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Offices */}
      <section className="py-20 px-6 bg-white dark:bg-[#070C14]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-[#0B1C2D] dark:text-[#E6EDF3]">
              {t('contact.offices.title')}
            </h2>
            <p className="text-slate-500 dark:text-[#A3ADC2]">{t('contact.offices.subtitle')}</p>
          </div>

          <div className="grid xs:grid-cols-1 md:grid-cols-3 gap-8">
            {offices.map((office, index) => (
              <Card key={index} className={`glass-card ${office.primary ? 'border-2 border-[#1BC47D]/50' : ''}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl text-[#0B1C2D] dark:text-[#E6EDF3]">{office.city}</CardTitle>
                    {office.primary && (
                      <Badge className="bg-[#1BC47D] text-[#071A12]">{t('contact.offices.primary')}</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-600 dark:text-[#A3ADC2]">{office.address}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <a href={`tel:${office.phone}`} className="text-sm text-slate-600 hover:text-[#1BC47D] dark:text-[#A3ADC2]">
                      {office.phone}
                    </a>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <a href={`mailto:${office.email}`} className="text-sm text-slate-600 hover:text-[#1BC47D] dark:text-[#A3ADC2]">
                      {office.email}
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-20 px-6 bg-[#F5F7FA] dark:bg-[#0B1220]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4 text-[#0B1C2D] dark:text-[#E6EDF3]">
              {t('contact.map.title')}
            </h2>
            <p className="text-slate-500 dark:text-[#A3ADC2]">{t('contact.map.subtitle')}</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="glass-card">
              <CardContent className="p-0">
                <div className="aspect-video rounded-lg flex items-center justify-center bg-white/60 dark:bg-[#0B1220]">
                  <div className="text-center space-y-2">
                    <MapPin className="w-12 h-12 text-slate-400 mx-auto" />
                    <p className="text-slate-500 dark:text-[#A3ADC2]">{t('contact.map.placeholder.title')}</p>
                    <p className="text-sm text-slate-400 dark:text-[#6B7285]">
                      {t('contact.map.placeholder.address')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="glass-card p-10 text-center bg-white dark:bg-[#0B1220]">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6 text-[#0B1C2D] dark:text-[#E6EDF3]">
              {t('contact.cta.title')}
            </h2>
            <p className="text-lg text-slate-500 mb-8 max-w-2xl mx-auto dark:text-[#A3ADC2]">
              {t('contact.cta.description')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8 py-6 text-lg btn-primary">
                {t('contact.cta.primary')}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-6 text-lg border border-slate-200 text-[#0B1C2D] hover:bg-slate-50 dark:border-[#1BC47D] dark:text-[#1BC47D] dark:hover:bg-[rgba(27,196,125,0.1)]"
              >
                {t('contact.cta.secondary')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
