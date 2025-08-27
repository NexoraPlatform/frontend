"use client";

import Link from 'next/link';
import { Facebook, Twitter, Linkedin, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import {useAuth} from "@/contexts/auth-context";
import dynamic from 'next/dynamic';
import {useAsyncTranslation} from "@/hooks/use-async-translation";
import {usePathname} from 'next/navigation';
import {Locale} from "@/types/locale";

const ChatLauncher = dynamic(() => import('@/components/chat/chat-launcher'), {
  ssr: false,
  loading: () => null
});

export function Footer() {
  const { user } = useAuth();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] as Locale || 'ro';
  const footerInfoText = useAsyncTranslation(locale, "common.footer_info")
  const followUsSocialText = useAsyncTranslation(locale, "common.follow_us_social");
  const followUsOnText = useAsyncTranslation(locale, "common.follow_us_on");
  const footerPlatformDescriptionText = useAsyncTranslation(locale, "common.footer_platform_description");
  const quickLinksText = useAsyncTranslation(locale, "common.quick_links");
  const servicesText = useAsyncTranslation(locale, "navigation.services")
  const aboutText = useAsyncTranslation(locale, "navigation.about")
  const helpText = useAsyncTranslation(locale, "navigation.help")
  const contactText = useAsyncTranslation(locale, "navigation.contact")
  const popularServicesText = useAsyncTranslation(locale, "common.popular_services");
  const emailForNewsletterText = useAsyncTranslation(locale, "common.newsletter_email_address");
  const yourEmailText = useAsyncTranslation(locale, "common.your_email");
  const subscribeToNewsletterText = useAsyncTranslation(locale, "common.subscribe_to_newsletter");
  const subscribeText = useAsyncTranslation(locale, "common.subscribe");
  const privacyPolicyText = useAsyncTranslation(locale, "common.privacy_policy");
  const readPrivacyPolicyText = useAsyncTranslation(locale, "common.read_privacy_policy");
  const termsConditionsText = useAsyncTranslation(locale, "common.terms_conditions");
  const readTermsConditionsText = useAsyncTranslation(locale, "common.read_terms_conditions");
  const allRightsReservedText = useAsyncTranslation(locale, "common.all_rights_reserved");

  return (
      <footer
          className="border-t"
          role="contentinfo"
          aria-label={footerInfoText}
      >
        {user && (<ChatLauncher />)}
        <div className="container mx-auto px-4 !py-12">
          <div className="grid xs:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="relative w-8 h-8 flex flex-col-reverse">
                  <picture>
                    <source
                        type="image/avif"
                        srcSet="/logo-60.avif 1x, /logo-120.avif 2x"
                        className="dark:hidden h-10 w-auto"
                    />
                    <source
                        type="image/webp"
                        srcSet="/logo-60.webp 1x, /logo-120.webp 2x"
                        className="dark:hidden h-10 w-auto"
                    />
                    <Image
                        src="/logo-60.webp"
                        alt="Nexora Logo"
                        width={140}
                        height={175}
                        className="dark:hidden h-10 w-auto"
                        loading="eager"
                        decoding="async"
                        style={{ maxWidth: 'unset', height: '2.5rem', width: 'auto' }}
                    />
                  </picture>

                  <picture>
                    <source
                        type="image/avif"
                        srcSet="/logo-60.avif 1x, /logo-120.avif 2x"
                        className="hidden dark:block h-10 w-auto"
                    />
                    <source
                        type="image/webp"
                        srcSet="/logo-white-60.webp 1x, /logo-120.webp 2x"
                        className="hidden dark:block h-10 w-auto"
                    />
                    <Image
                        src="/logo-white-60.webp"
                        alt="Nexora Logo"
                        width={140}
                        height={175}
                        className="hidden dark:block h-10 w-auto"
                        loading="lazy"
                        decoding="async"
                        style={{ maxWidth: 'unset', height: '2.5rem', width: 'auto' }}
                    />
                  </picture>
                </div>
                <span className="text-xl font-bold text-primary pb-3">Nexora</span>
              </div>
              <p className="text-sm text-muted-foreground">
                  {footerPlatformDescriptionText}
              </p>
              <div className="flex space-x-2" role="group" aria-label={followUsSocialText}>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`${followUsOnText} Facebook`}
                >
                  <Facebook className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`${followUsOnText} Twitter`}
                >
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`${followUsOnText} LinkedIn`}
                >
                  <Linkedin className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`${followUsOnText} Instagram`}
                >
                  <Instagram className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold" id="quick-links-heading">{quickLinksText}</h2>
              <nav className="space-y-2" aria-labelledby="quick-links-heading">
                <Link href={`/${locale}/services`} className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                    {servicesText}
                </Link>
                <Link href={`/${locale}/about`} className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                    {aboutText}
                </Link>
                <Link href={`/${locale}/help`} className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                    {helpText}
                </Link>
                <Link href={`/${locale}/contact`} className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                    {contactText}
                </Link>
              </nav>
            </div>

            {/* Services */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold" id="popular-services-heading">{popularServicesText}</h2>
              <nav className="space-y-2" aria-labelledby="popular-services-heading">
                <Link href={`/${locale}/services?category=web-development`} className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  Dezvoltare Web
                </Link>
                <Link href={`/${locale}/services?category=mobile-development`} className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  Aplicații Mobile
                </Link>
                <Link href={`/${locale}/services?category=design`} className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  Design UI/UX
                </Link>
                <Link href={`/${locale}/services?category=marketing`} className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                  Marketing Digital
                </Link>
              </nav>
            </div>

            {/* Contact & Newsletter */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold" id="contact-heading">Contact</h2>
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
                <h3 className="text-sm font-medium" id="newsletter-heading">Newsletter</h3>
                <form className="flex space-x-2" aria-labelledby="newsletter-heading">
                  <Input
                      placeholder={yourEmailText}
                      className="text-sm"
                      type="email"
                      aria-label={emailForNewsletterText}
                  />
                  <Button
                      size="sm"
                      type="submit"
                      aria-label={subscribeToNewsletterText}
                      className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors
         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
         disabled:pointer-events-none disabled:opacity-50
         bg-blue-600 text-white
         hover:bg-blue-700
         dark:bg-blue-500 dark:hover:bg-blue-600
         h-9 rounded-md px-3"
                  >
                      {subscribeText}
                  </Button>
                </form>
              </div>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center" role="contentinfo">
            <p className="text-sm text-muted-foreground">
              © 2024 Nexora. {allRightsReservedText}. |
              <Link
                  href="/privacy"
                  className="hover:text-primary ml-1"
                  aria-label={readPrivacyPolicyText}
              >
                  {privacyPolicyText}
              </Link> |
              <Link
                  href="/terms"
                  className="hover:text-primary ml-1"
                  aria-label={readTermsConditionsText}
              >
                  {termsConditionsText}
              </Link>
            </p>
          </div>
        </div>
      </footer>
  );
}
