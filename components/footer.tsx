"use client";

import { Link } from '@/lib/navigation';
import { Facebook, Twitter, Linkedin, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import { useAuth } from "@/contexts/auth-context";
import dynamic from 'next/dynamic';
import { useTranslations } from "next-intl";

const ChatLauncher = dynamic(() => import('@/components/chat/chat-launcher'), {
  ssr: false,
  loading: () => null
});

export function Footer() {
  const { user } = useAuth();
  const t = useTranslations();
  const earlyAccessEnabled = process.env.NEXT_PUBLIC_EARLY_ACCESS_FUNNEL === 'true';
  const footerInfoText = t("common.footer_info");
  const followUsSocialText = t("common.follow_us_social");
  const followUsOnText = t("common.follow_us_on");
  const footerPlatformDescriptionText = t("common.footer_platform_description");
  const quickLinksText = t("common.quick_links");
  const servicesText = t("navigation.services");
  const aboutText = t("navigation.about");
  const helpText = t("navigation.help");
  const contactText = t("navigation.contact");
  const popularServicesText = t("common.popular_services");
  const emailForNewsletterText = t("common.newsletter_email_address");
  const yourEmailText = t("common.your_email");
  const subscribeToNewsletterText = t("common.subscribe_to_newsletter");
  const subscribeText = t("common.subscribe");
  const privacyPolicyText = t("common.privacy_policy");
  const readPrivacyPolicyText = t("common.read_privacy_policy");
  const termsConditionsText = t("common.terms_conditions");
  const readTermsConditionsText = t("common.read_terms_conditions");
  const allRightsReservedText = t("common.all_rights_reserved");
  const cookiePolicyText = t("common.cookie_policy");
  const readCookiePolicyText = t("common.read_cookie_policy");
  const trustoraTaglineText = t("common.trustora_tagline");
  const contactTitleText = t("common.contact_title");
  const contactDescriptionText = t("common.contact_description");
  const newsletterTitleText = t("common.newsletter_title");
  const newsletterDescriptionText = t("common.newsletter_description");
  const legalDocumentsText = t("common.legal_documents");
  const locationText = t("common.location_label");
  const popularServiceWebText = t("common.popular_service_web");
  const popularServiceMobileText = t("common.popular_service_mobile");
  const popularServiceDesignText = t("common.popular_service_design");
  const popularServiceMarketingText = t("common.popular_service_marketing");
  const privacyHref = '/privacy';
  const termsHref = '/terms';
  const cookiesHref = '/cookies';

  return (
      <footer
          className="border-t"
          role="contentinfo"
          aria-label={footerInfoText}
      >
        {user && (<ChatLauncher />)}
        <div className="container mx-auto px-4 !py-12">
          {earlyAccessEnabled ? (
            <div className="rounded-3xl border border-slate-200/60 bg-white/70 p-8 shadow-xl backdrop-blur dark:border-[#1E2A3D] dark:bg-[#0B1220]/70">
              <div className="grid gap-10 md:grid-cols-2 md:items-start">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold" id="contact-heading">{contactTitleText}</h2>
                    <p className="text-sm text-muted-foreground">
                      {contactDescriptionText}
                    </p>
                  </div>
                  <div className="space-y-3" aria-labelledby="contact-heading">
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200/60 bg-white/80 px-4 py-3 text-sm text-muted-foreground shadow-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]/80">
                      <Mail className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                      <a href="mailto:contact@Trustora.ro" className="font-medium hover:text-primary transition-colors">
                        contact@Trustora.ro
                      </a>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200/60 bg-white/80 px-4 py-3 text-sm text-muted-foreground shadow-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]/80">
                      <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                      <a href="tel:+40123456789" className="font-medium hover:text-primary transition-colors">
                        +40 123 456 789
                      </a>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-200/60 bg-white/80 px-4 py-3 text-sm text-muted-foreground shadow-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]/80">
                      <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                      <span className="font-medium">{locationText}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold" id="newsletter-heading">{newsletterTitleText}</h3>
                    <p className="text-sm text-muted-foreground">
                      {newsletterDescriptionText}
                    </p>
                  </div>
                  <form
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200/60 bg-white/80 p-4 shadow-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]/80 sm:flex-row sm:items-center"
                    aria-labelledby="newsletter-heading"
                  >
                    <Input
                        placeholder={yourEmailText}
                        className="h-11 text-sm"
                        type="email"
                        aria-label={emailForNewsletterText}
                    />
                    <Button
                        size="sm"
                        type="submit"
                        aria-label={subscribeToNewsletterText}
                        className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-xl px-5 text-sm font-semibold ring-offset-background transition-colors
           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
           disabled:pointer-events-none disabled:opacity-50
           bg-[#1BC47D] text-[#071A12]
           hover:bg-[#17b672]
           dark:bg-[#1BC47D] dark:hover:bg-[#17b672]"
                    >
                        {subscribeText}
                    </Button>
                  </form>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="font-semibold text-slate-900 dark:text-white">{legalDocumentsText}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      <Link href={privacyHref} className="hover:text-primary transition-colors">
                        {privacyPolicyText}
                      </Link>
                      <Link href={termsHref} className="hover:text-primary transition-colors">
                        {termsConditionsText}
                      </Link>
                      <Link href={cookiesHref} className="hover:text-primary transition-colors">
                        {cookiePolicyText}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid xs:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="relative w-8 h-8 flex flex-col-reverse">
                    <picture>
                      <source
                          type="image/avif"
                          srcSet="/trustora-logo2-60.avif 1x, /trustora-logo2-120.avif 2x"
                          className="dark:hidden h-10 w-auto"
                      />
                      <source
                          type="image/webp"
                          srcSet="/trustora-logo2-60.webp 1x, /trustora-logo2-120.webp 2x"
                          className="dark:hidden h-10 w-auto"
                      />
                      <Image
                          src="/trustora-logo2-60.webp"
                          alt="Trustoria Logo"
                          width={140}
                          height={175}
                          className="h-10 w-auto"
                          loading="eager"
                          decoding="async"
                          style={{ maxWidth: 'unset', height: '2.5rem', width: 'auto' }}
                      />
                    </picture>
                  </div>
                  <div className="flex flex-col items-start ps-4">
                      <span className="text-xl font-bold text-primary">Trustora</span>
                      <span className="text-xs text-muted-foreground font-medium">
                        {trustoraTaglineText}
                      </span>
                  </div>

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
                  <Link href="/services" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                      {servicesText}
                  </Link>
                  <Link href="/about" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                      {aboutText}
                  </Link>
                  <Link href="/help" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                      {helpText}
                  </Link>
                  <Link href="/contact" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                      {contactText}
                  </Link>
                </nav>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold" id="popular-services-heading">{popularServicesText}</h2>
                <nav className="space-y-2" aria-labelledby="popular-services-heading">
                  <Link href="/services?category=web-development" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                    {popularServiceWebText}
                  </Link>
                  <Link href="/services?category=mobile-development" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                    {popularServiceMobileText}
                  </Link>
                  <Link href="/services?category=design" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                    {popularServiceDesignText}
                  </Link>
                  <Link href="/services?category=marketing" className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                    {popularServiceMarketingText}
                  </Link>
                </nav>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold" id="contact-heading">{contactTitleText}</h2>
                <div className="space-y-2" aria-labelledby="contact-heading">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <a href="mailto:contact@Trustora.ro" className="hover:text-primary transition-colors">
                      contact@Trustora.ro
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
                    <span>{locationText}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium" id="newsletter-heading">{newsletterTitleText}</h3>
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
           bg-[#1BC47D] text-[#071A12]
           hover:bg-[#17b672]
           dark:bg-[#1BC47D] dark:hover:bg-[#17b672]
           h-9 rounded-md px-3"
                    >
                        {subscribeText}
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          )}

          <div className="border-t mt-8 pt-8 text-center" role="contentinfo">
            <p className="text-sm text-muted-foreground">
              © 2024 Trustora. {allRightsReservedText}. |
              <Link
                href={privacyHref}
                className="hover:text-primary ml-1"
                aria-label={readPrivacyPolicyText}
              >
                {privacyPolicyText}
              </Link>{" "}
              |
              <Link
                href={termsHref}
                className="hover:text-primary ml-1"
                aria-label={readTermsConditionsText}
              >
                {termsConditionsText}
              </Link>
              {" "}|{" "}
              <Link
                href={cookiesHref}
                className="hover:text-primary"
                aria-label={readCookiePolicyText}
              >
                {cookiePolicyText}
              </Link>
            </p>
          </div>
        </div>
      </footer>
  );
}
