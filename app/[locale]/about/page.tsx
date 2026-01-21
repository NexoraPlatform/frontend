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

export const metadata: Metadata = generateSEO({
  title: 'Despre noi',
  description: 'Vrei sa aflii mai multe despre Trustora? Aici găsești informații despre misiunea, viziunea și valorile noastre, echipa din spatele platformei și povestea noastră de succes.',
  url: '/about',
});

export default function AboutPage() {
  const values = [
    {
      icon: Shield,
      title: 'Încredere și Siguranță',
      description: 'Toate tranzacțiile sunt securizate, iar furnizorii sunt verificați pentru a-ți oferi liniște deplină.'
    },
    {
      icon: Award,
      title: 'Calitate Excepțională',
      description: 'Colaborăm doar cu experți cu experiență dovedită și evaluări excelente din partea clienților.'
    },
    {
      icon: Zap,
      title: 'Eficiență și Rapiditate',
      description: 'Platforma noastră este optimizată pentru a-ți găsi rapid experții potriviți pentru proiectul tău.'
    },
    {
      icon: Heart,
      title: 'Suport Dedicat',
      description: 'Echipa noastră este disponibilă 24/7 pentru a te ajuta în orice moment al colaborării.'
    }
  ];

  const stats = [
    { number: '500+', label: 'Experți Verificați' },
    { number: '2,000+', label: 'Proiecte Finalizate' },
    { number: '98%', label: 'Rata de Satisfacție' },
    { number: '50+', label: 'Orașe Acoperite' }
  ];

  const team = [
    {
      name: 'Alexandru Popescu',
      role: 'CEO & Co-Fondator',
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=200',
      description: 'Antreprenor cu peste 10 ani de experiență în tech, pasionat de inovație și dezvoltarea ecosistemului IT românesc.'
    },
    {
      name: 'Maria Ionescu',
      role: 'CTO & Co-Fondator',
      avatar: 'https://images.pexels.com/photos/3785077/pexels-photo-3785077.jpeg?auto=compress&cs=tinysrgb&w=200',
      description: 'Expert în dezvoltare software cu background în arhitectura sistemelor scalabile și experiența utilizatorului.'
    },
    {
      name: 'Andrei Radu',
      role: 'Head of Operations',
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200',
      description: 'Specialist în operațiuni și management, cu focus pe optimizarea proceselor și satisfacția clienților.'
    },
    {
      name: 'Diana Stoica',
      role: 'Head of Marketing',
      avatar: 'https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=200',
      description: 'Expert în marketing digital și growth, cu experiență în construirea brandurilor tech de succes.'
    }
  ];

  const milestones = [
    {
      year: '2020',
      title: 'Înființarea Trustora',
      description: 'Am lansat platforma cu viziunea de a conecta talentele IT românești cu oportunitățile globale.'
    },
    {
      year: '2021',
      title: 'Primul Milion de RON',
      description: 'Am atins primul milion de RON în tranzacții procesate, confirmând nevoia pieței pentru serviciile noastre.'
    },
    {
      year: '2022',
      title: 'Expansiunea Națională',
      description: 'Am extins serviciile în toate orașele mari din România, ajungând la peste 500 de experți verificați.'
    },
    {
      year: '2023',
      title: 'Recunoaștere Internațională',
      description: 'Am fost recunoscuți ca cea mai inovatoare platformă de servicii IT din Europa de Est.'
    },
    {
      year: '2024',
      title: 'Viitorul Digital',
      description: 'Continuăm să inovăm cu AI și automatizare pentru a îmbunătăți experiența utilizatorilor.'
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
            <span className="text-[#1BC47D]">●</span> 🚀 Despre Trustora
          </Badge>
          <h1 className="text-4xl lg:text-6xl font-bold mb-6 text-[#0B1C2D] tracking-tight dark:text-[#E6EDF3]">
            Construim viitorul digital al <span className="text-[#1BC47D]">României</span>
          </h1>
          <p className="text-xl text-slate-500 mb-10 max-w-3xl mx-auto dark:text-[#A3ADC2]">
              Trustora este platforma românească care conectează antreprenorii cu cei mai buni experți IT.
              Misiunea noastră este să democratizăm accesul la servicii IT de calitate și să susținem
              creșterea ecosistemului tehnologic local.
            </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="px-8 py-6 text-lg btn-primary" asChild>
              <Link href="/services">Explorează Serviciile</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="px-8 py-6 text-lg border border-slate-200 text-[#0B1C2D] hover:bg-slate-50 dark:border-[#1BC47D] dark:text-[#1BC47D] dark:hover:bg-[rgba(27,196,125,0.1)]"
            >
              Alătură-te Echipei
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
              Misiunea noastră
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold mb-6 text-[#0B1C2D] dark:text-[#E6EDF3]">
              Eliminăm barierele dintre viziune și execuție
            </h2>
            <p className="text-lg text-slate-500 mb-8 dark:text-[#A3ADC2]">
              Credem că fiecare idee merită să devină realitate. De aceea, am construit Trustora -
              o platformă care elimină barierele dintre viziune și execuție, conectând antreprenorii
              cu experții IT potriviți.
            </p>
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center dark:bg-[rgba(27,196,125,0.1)]">
                  <CheckCircle className="w-5 h-5 text-[#1BC47D]" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-[#0B1C2D] dark:text-[#E6EDF3]">Accesibilitate</h3>
                  <p className="text-slate-500 dark:text-[#A3ADC2]">Servicii IT de calitate la prețuri corecte pentru toate businessurile</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center dark:bg-[rgba(27,196,125,0.1)]">
                  <CheckCircle className="w-5 h-5 text-[#1BC47D]" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-[#0B1C2D] dark:text-[#E6EDF3]">Transparență</h3>
                  <p className="text-slate-500 dark:text-[#A3ADC2]">Proces clar, prețuri transparente și comunicare deschisă</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center dark:bg-[rgba(27,196,125,0.1)]">
                  <CheckCircle className="w-5 h-5 text-[#1BC47D]" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-[#0B1C2D] dark:text-[#E6EDF3]">Excelență</h3>
                  <p className="text-slate-500 dark:text-[#A3ADC2]">Standarde înalte de calitate și satisfacția garantată</p>
                </div>
              </div>
            </div>
          </div>
          <div className="glass-card p-10 shadow-xl shadow-slate-200/40 dark:shadow-none">
            <div className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 dark:text-[#6B7285]">
              Viziunea 2030
            </div>
            <div className="mt-8 space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center dark:bg-[rgba(27,196,125,0.1)]">
                <Target className="w-8 h-8 text-[#1BC47D]" />
              </div>
              <h3 className="text-2xl font-bold text-[#0B1C2D] dark:text-[#E6EDF3]">
                Să devenim platforma de referință
              </h3>
              <p className="text-slate-500 dark:text-[#A3ADC2] max-w-sm">
                pentru servicii IT în Europa de Est, cu focus pe încredere, transparență și
                colaborare sustenabilă.
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
              Valorile noastre
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-[#0B1C2D] dark:text-[#E6EDF3]">
              Principii care construiesc încredere
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto dark:text-[#A3ADC2]">
              Principiile care ne ghidează în tot ceea ce facem și ne ajută să construim
              relații de încredere cu clienții și partenerii noștri.
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
              Povestea Noastră
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto dark:text-[#A3ADC2]">
              De la o idee simplă la platforma de încredere pentru mii de antreprenori români.
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
              Echipa Trustora
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-[#0B1C2D] dark:text-[#E6EDF3]">
              Oameni care susțin transformarea digitală
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto dark:text-[#A3ADC2]">
              Oamenii pasionați care fac posibilă transformarea digitală a României.
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
            Alătură-te Comunității Trustora
          </h2>
          <p className="text-lg text-slate-400 mb-10 dark:text-[#A3ADC2]">
            Fie că ești antreprenor în căutarea expertului potrivit sau specialist IT care vrea să își
            dezvolte cariera, Trustora este locul unde visurile devin realitate.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="px-8 py-6 text-lg btn-primary" asChild>
              <Link href="/services">Găsește Experți</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-6 text-lg border-white text-white hover:bg-white hover:text-[#0B1C2D]"
            >
              Devino Furnizor
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
