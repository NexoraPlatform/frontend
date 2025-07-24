import Link from 'next/link';
import { Facebook, Twitter, Linkedin, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="bg-muted/30 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="relative w-8 h-8">
                <Image
                  src="/logo.png"
                  alt="Nexora Logo"
                  width={32}
                  height={32}
                  className="dark:hidden"
                />
                <Image
                  src="/logo-white.png"
                  alt="Nexora Logo"
                  width={32}
                  height={32}
                  className="hidden dark:block"
                />
              </div>
              <span className="text-xl font-bold text-primary">Nexora</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Platforma românească pentru servicii IT profesionale. Conectăm clienții cu experții potriviți pentru proiectele lor.
            </p>
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Linkedin className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Instagram className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Link-uri Rapide</h3>
            <div className="space-y-2">
              <Link href="/services" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Servicii
              </Link>
              <Link href="/about" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Despre Noi
              </Link>
              <Link href="/help" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Ajutor
              </Link>
              <Link href="/contact" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Contact
              </Link>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Servicii Populare</h3>
            <div className="space-y-2">
              <Link href="/services?category=web-development" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Dezvoltare Web
              </Link>
              <Link href="/services?category=mobile-development" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Aplicații Mobile
              </Link>
              <Link href="/services?category=design" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Design UI/UX
              </Link>
              <Link href="/services?category=marketing" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                Marketing Digital
              </Link>
            </div>
          </div>

          {/* Contact & Newsletter */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>contact@nexora.ro</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>+40 123 456 789</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>București, România</span>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Newsletter</h4>
              <div className="flex space-x-2">
                <Input placeholder="Email-ul tău" className="text-sm" />
                <Button size="sm">Abonează-te</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 Nexora. Toate drepturile rezervate. |
            <Link href="/privacy" className="hover:text-primary ml-1">Politica de Confidențialitate</Link> |
            <Link href="/terms" className="hover:text-primary ml-1">Termeni și Condiții</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
