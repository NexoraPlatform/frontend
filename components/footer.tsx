"use client";

import Link from 'next/link';
import { Facebook, Twitter, Linkedin, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import {useAuth} from "@/contexts/auth-context";
import {ChatWidget} from "@/components/chat/chat-widget";

export function Footer() {
  const { user } = useAuth();
  return (
      <footer
          className="bg-muted/30 border-t"
          role="contentinfo"
          aria-label="Footer cu informații de contact și link-uri"
      >
        {user && (<ChatWidget />)}
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="relative w-8 h-8">
                  <Image
                      src="/logo.png"
                      alt="Nexora Logo"
                      width={140}
                      height={175}
                      className="dark:hidden h-10 w-auto"
                      loading="lazy"
                  />
                  <Image
                      src="/logo-white.png"
                      alt="Nexora Logo"
                      width={140}
                      height={175}
                      className="hidden dark:block h-10 w-auto"
                      loading="lazy"
                  />
                </div>
                <span className="text-xl font-bold text-primary">Nexora</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Platforma românească pentru servicii IT profesionale. Conectăm clienții cu experții potriviți pentru proiectele lor.
              </p>
              <div className="flex space-x-2" role="group" aria-label="Urmărește-ne pe rețelele sociale">
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Urmărește-ne pe Facebook"
                >
                  <Facebook className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Urmărește-ne pe Twitter"
                >
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Urmărește-ne pe LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Urmărește-ne pe Instagram"
                >
                  <Instagram className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold" id="quick-links-heading">Link-uri Rapide</h3>
              <nav className="space-y-2" aria-labelledby="quick-links-heading">
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
              </nav>
            </div>

            {/* Services */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold" id="popular-services-heading">Servicii Populare</h3>
              <nav className="space-y-2" aria-labelledby="popular-services-heading">
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
              </nav>
            </div>

            {/* Contact & Newsletter */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold" id="contact-heading">Contact</h3>
              <div className="space-y-2" aria-labelledby="contact-heading">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <a href="mailto:contact@nexora.ro" className="hover:text-primary transition-colors">
                    contact@nexora.ro
                  </a>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <a href="tel:+40123456789" className="hover:text-primary transition-colors">
                    +40 123 456 789
                  </a>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>București, România</span>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium" id="newsletter-heading">Newsletter</h4>
                <form className="flex space-x-2" aria-labelledby="newsletter-heading">
                  <Input
                      placeholder="Email-ul tău"
                      className="text-sm"
                      type="email"
                      aria-label="Adresa de email pentru newsletter"
                  />
                  <Button
                      size="sm"
                      type="submit"
                      aria-label="Abonează-te la newsletter"
                  >
                    Abonează-te
                  </Button>
                </form>
              </div>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center" role="contentinfo">
            <p className="text-sm text-muted-foreground">
              © 2024 Nexora. Toate drepturile rezervate. |
              <Link
                  href="/privacy"
                  className="hover:text-primary ml-1"
                  aria-label="Citește politica de confidențialitate"
              >
                Politica de Confidențialitate
              </Link> |
              <Link
                  href="/terms"
                  className="hover:text-primary ml-1"
                  aria-label="Citește termenii și condițiile"
              >
                Termeni și Condiții
              </Link>
            </p>
          </div>
        </div>
      </footer>
  );
}
