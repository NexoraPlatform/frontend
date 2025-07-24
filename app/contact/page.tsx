"use client";

import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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

export default function ContactPage() {
  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      primary: 'contact@nexora.ro',
      secondary: 'suport@nexora.ro',
      description: 'Răspundem în maxim 2 ore'
    },
    {
      icon: Phone,
      title: 'Telefon',
      primary: '+40 123 456 789',
      secondary: '+40 987 654 321',
      description: 'Luni-Vineri, 9:00-18:00'
    },
    {
      icon: MapPin,
      title: 'Adresă',
      primary: 'Strada Exemplu nr. 123',
      secondary: 'București, România, 010101',
      description: 'Vizitează-ne cu programare'
    },
    {
      icon: Clock,
      title: 'Program',
      primary: 'Luni - Vineri: 9:00 - 18:00',
      secondary: 'Sâmbătă: 10:00 - 14:00',
      description: 'Duminică închis'
    }
  ];

  const departments = [
    {
      icon: Users,
      title: 'Suport Clienți',
      email: 'suport@nexora.ro',
      description: 'Pentru întrebări despre servicii și proiecte'
    },
    {
      icon: Briefcase,
      title: 'Parteneriate',
      email: 'parteneriate@nexora.ro',
      description: 'Colaborări și oportunități de business'
    },
    {
      icon: Building,
      title: 'Presă & Media',
      email: 'presa@nexora.ro',
      description: 'Informații pentru jurnaliști și media'
    },
    {
      icon: HeadphonesIcon,
      title: 'Suport Tehnic',
      email: 'tehnic@nexora.ro',
      description: 'Probleme tehnice și bug-uri'
    }
  ];

  const offices = [
    {
      city: 'București',
      address: 'Strada Exemplu nr. 123, Sector 1',
      phone: '+40 123 456 789',
      email: 'bucuresti@nexora.ro',
      primary: true
    },
    {
      city: 'Cluj-Napoca',
      address: 'Strada Demo nr. 45, Centru',
      phone: '+40 234 567 890',
      email: 'cluj@nexora.ro',
      primary: false
    },
    {
      city: 'Timișoara',
      address: 'Bulevardul Test nr. 67',
      phone: '+40 345 678 901',
      email: 'timisoara@nexora.ro',
      primary: false
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6">
              📞 Contactează-ne
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Suntem aici să te ajutăm
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Ai o întrebare, o sugestie sau vrei să colaborezi cu noi? 
              Echipa Nexora este gata să îți răspundă și să te sprijine.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {contactInfo.map((info, index) => (
              <Card key={index} className="text-center border-2 hover:border-primary/20 transition-colors">
                <CardHeader>
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <info.icon className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{info.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="font-semibold">{info.primary}</div>
                    <div className="text-muted-foreground">{info.secondary}</div>
                    <div className="text-sm text-muted-foreground">{info.description}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Quick Contact */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-bold mb-6">Trimite-ne un mesaj</h2>
              <Card>
                <CardContent className="p-6">
                  <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Nume *</label>
                        <Input placeholder="Numele tău complet" required />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Email *</label>
                        <Input type="email" placeholder="email@exemplu.ro" required />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Telefon</label>
                        <Input placeholder="+40 123 456 789" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Companie</label>
                        <Input placeholder="Numele companiei" />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Subiect *</label>
                      <Input placeholder="Despre ce vrei să vorbești?" required />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Mesaj *</label>
                      <textarea 
                        className="w-full min-h-32 px-3 py-2 border border-input bg-background rounded-md text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        placeholder="Descrie în detaliu cererea ta..."
                        required
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="privacy" className="rounded" required />
                      <label htmlFor="privacy" className="text-sm text-muted-foreground">
                        Sunt de acord cu <a href="/privacy" className="text-primary hover:underline">Politica de Confidențialitate</a>
                      </label>
                    </div>

                    <Button className="w-full" size="lg">
                      <Send className="w-4 h-4 mr-2" />
                      Trimite Mesajul
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Quick Contact & Departments */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold mb-6">Contact Rapid</h2>
                <Card className="border-primary border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MessageCircle className="w-5 h-5" />
                      <span>Chat Live</span>
                    </CardTitle>
                    <CardDescription>
                      Vorbește direct cu echipa noastră de suport
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-green-600">● Online acum</div>
                        <div className="text-sm text-muted-foreground">Timp mediu de răspuns: 2 minute</div>
                      </div>
                      <Button>
                        Începe Chat
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4">Departamente Specializate</h3>
                <div className="space-y-4">
                  {departments.map((dept, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <dept.icon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{dept.title}</h4>
                            <p className="text-sm text-muted-foreground mb-2">{dept.description}</p>
                            <a href={`mailto:${dept.email}`} className="text-sm text-primary hover:underline">
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
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Birourile Noastre</h2>
            <p className="text-muted-foreground">Suntem prezenți în principalele orașe din România</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {offices.map((office, index) => (
              <Card key={index} className={`${office.primary ? 'border-primary border-2' : ''}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{office.city}</CardTitle>
                    {office.primary && (
                      <Badge className="bg-primary">Sediu Principal</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{office.address}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a href={`tel:${office.phone}`} className="text-sm hover:text-primary">
                      {office.phone}
                    </a>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a href={`mailto:${office.email}`} className="text-sm hover:text-primary">
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
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Locația Noastră</h2>
            <p className="text-muted-foreground">Vino să ne cunoști la sediul din București</p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <MapPin className="w-12 h-12 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground">Hartă interactivă</p>
                    <p className="text-sm text-muted-foreground">Strada Exemplu nr. 123, București</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Pregătit să începi proiectul tău?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Nu mai aștepta! Contactează-ne astăzi și să transformăm împreună ideea ta în realitate.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="px-8 py-6 text-lg">
              Începe un Proiect
            </Button>
            <Button size="lg" variant="outline" className="px-8 py-6 text-lg border-white text-white hover:bg-white hover:text-primary">
              Programează o Întâlnire
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}