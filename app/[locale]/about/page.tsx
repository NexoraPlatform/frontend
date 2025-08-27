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
import type {Metadata} from "next";
import {generateSEO} from "@/lib/seo";

export const metadata: Metadata = generateSEO({
  title: 'Despre noi',
  description: 'Vrei sa aflii mai multe despre Nexora? Aici găsești informații despre misiunea, viziunea și valorile noastre, echipa din spatele platformei și povestea noastră de succes.',
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
      title: 'Înființarea Nexora',
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
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6">
              🚀 Despre Nexora
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              Construim viitorul digital al României
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Nexora este platforma românească care conectează antreprenorii cu cei mai buni experți IT.
              Misiunea noastră este să democratizăm accesul la servicii IT de calitate și să susținem
              creșterea ecosistemului tehnologic local.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8 py-6 text-lg" asChild>
                <Link href="/services">Explorează Serviciile</Link>
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-6 text-lg">
                Alătură-te Echipei
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
                Misiunea Noastră
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Credem că fiecare idee merită să devină realitate. De aceea, am construit Nexora -
                o platformă care elimină barierele dintre viziune și execuție, conectând antreprenorii
                cu experții IT potriviți.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Accesibilitate</h3>
                    <p className="text-muted-foreground">Servicii IT de calitate la prețuri corecte pentru toate businessurile</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Transparență</h3>
                    <p className="text-muted-foreground">Proces clar, prețuri transparente și comunicare deschisă</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Excelență</h3>
                    <p className="text-muted-foreground">Standarde înalte de calitate și satisfacția garantată</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Target className="w-16 h-16 text-primary mx-auto" />
                  <h3 className="text-2xl font-bold">Viziunea 2030</h3>
                  <p className="text-muted-foreground max-w-xs">
                    Să devenim platforma de referință pentru servicii IT în Europa de Est
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
              Valorile Noastre
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Principiile care ne ghidează în tot ceea ce facem și ne ajută să construim
              relații de încredere cu clienții și partenerii noștri
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
              Povestea Noastră
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              De la o idee simplă la platforma de încredere pentru mii de antreprenori români
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
              Echipa Nexora
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Oamenii pasionați care fac posibilă transformarea digitală a României
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
            Alătură-te Comunității Nexora
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Fie că ești antreprenor în căutarea expertului potrivit sau specialist IT care vrea să își
            dezvolte cariera, Nexora este locul unde visurile devin realitate.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="px-8 py-6 text-lg" asChild>
              <Link href="/services">Găsește Experți</Link>
            </Button>
            <Button size="lg" variant="outline" className="px-8 py-6 text-lg border-white text-white hover:bg-white hover:text-primary">
              Devino Furnizor
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
