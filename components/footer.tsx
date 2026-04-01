"use client";

import { Link } from '@/lib/navigation';
import { Facebook, Twitter, Linkedin, Instagram, Mail, Phone, MapPin, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { TrustoraLogo } from '@/components/branding/trustora-logo';
import dynamic from 'next/dynamic';
import { useTranslations } from "next-intl";
import useSWR from 'swr';
import apiClient from "@/lib/api";
import { useOptionalAuth } from "@/contexts/auth-context";
import { usePublicAuth } from "@/hooks/use-public-auth";

const ChatLauncher = dynamic(() => import('@/components/chat/chat-launcher'), {
  ssr: false,
  loading: () => null
});

interface PopularService {
  id: number;
  name: string;
  slug: string;
}

type SocialLink = {
  name: string;
  href: string;
  icon: LucideIcon;
};

const fetcher = () => apiClient.getPopularServices().then(res => res.data);

function getSocialLinks(): SocialLink[] {
  return [
    {
      name: 'Facebook',
      href: process.env.NEXT_PUBLIC_TRUSTORA_FACEBOOK_URL?.trim() || 'https://www.facebook.com/trustora',
      icon: Facebook,
    },
    {
      name: 'Twitter',
      href: process.env.NEXT_PUBLIC_TRUSTORA_TWITTER_URL?.trim() || '',
      icon: Twitter,
    },
    {
      name: 'LinkedIn',
      href: process.env.NEXT_PUBLIC_TRUSTORA_LINKEDIN_URL?.trim() || 'https://www.linkedin.com/company/trustora-platform',
      icon: Linkedin,
    },
    {
      name: 'Instagram',
      href: process.env.NEXT_PUBLIC_TRUSTORA_INSTAGRAM_URL?.trim() || '',
      icon: Instagram,
    },
  ].filter((entry): entry is SocialLink => entry.href.length > 0);
}

export function Footer() {
  const authContext = useOptionalAuth();
  const publicAuth = usePublicAuth(!authContext);
  const user = authContext?.user ?? publicAuth.user;
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
  const popularServicesLoadingText = t("common.popular_services_loading");
  const popularServicesUnavailableText = t("common.popular_services_unavailable");
  const privacyHref = '/privacy';
  const termsHref = '/terms';
  const cookiesHref = '/cookies';
  const socialLinks = getSocialLinks();
  const earlyAccessContactHeadingId = 'contact-heading-early-access';
  const earlyAccessNewsletterHeadingId = 'newsletter-heading-early-access';
  const quickLinksHeadingId = 'quick-links-heading-default';
  const popularServicesHeadingId = 'popular-services-heading-default';
  const contactHeadingId = 'contact-heading-default';
  const newsletterHeadingId = 'newsletter-heading-default';

  const { data: popularServices, error } = useSWR('/api/popular-services', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 3600000,
  });
  const isPopularServicesLoading = !popularServices && !error;

  return (
    <footer
      className="border-t"
      role="contentinfo"
      aria-label={footerInfoText}
    >
      {authContext?.user && (<ChatLauncher />)}
      <div className="container mx-auto px-4 !py-12">
        {earlyAccessEnabled ? (
          <div className="rounded-3xl border border-slate-200/60 bg-white/70 p-8 shadow-xl backdrop-blur dark:border-[#1E2A3D] dark:bg-[#0B1220]/70">
            <div className="grid gap-10 md:grid-cols-2 md:items-start">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold" id={earlyAccessContactHeadingId}>{contactTitleText}</h2>
                  <p className="text-sm text-muted-foreground">
                    {contactDescriptionText}
                  </p>
                </div>
                <div className="space-y-3" aria-labelledby={earlyAccessContactHeadingId}>
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200/60 bg-white/80 px-4 py-3 text-sm text-muted-foreground shadow-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]/80">
                    <Mail className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                    <a href="mailto:contact@trustora.ro" className="font-medium hover:text-primary transition-colors">
                      contact@trustora.ro
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
                  <h3 className="text-lg font-semibold" id={earlyAccessNewsletterHeadingId}>{newsletterTitleText}</h3>
                  <p className="text-sm text-muted-foreground">
                    {newsletterDescriptionText}
                  </p>
                </div>
                <form
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200/60 bg-white/80 p-4 shadow-sm dark:border-[#1E2A3D] dark:bg-[#0B1220]/80 sm:flex-row sm:items-center"
                  aria-labelledby={earlyAccessNewsletterHeadingId}
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
              <TrustoraLogo
                alt="Trustora logo"
                imageClassName="h-14 w-auto"
                sizes="200px"
              />
              <p className="text-sm text-muted-foreground">
                {footerPlatformDescriptionText}
              </p>
              <div className="flex space-x-2" role="group" aria-label={followUsSocialText}>
                {socialLinks.map(({ name, href, icon: Icon }) => (
                  <Button key={name} variant="ghost" size="icon" asChild>
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`${followUsOnText} ${name}`}
                      title={`${followUsOnText} ${name}`}
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold" id={quickLinksHeadingId}>{quickLinksText}</h2>
              <nav className="space-y-2" aria-labelledby={quickLinksHeadingId}>
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
              <h2 className="text-lg font-semibold" id={popularServicesHeadingId}>{popularServicesText}</h2>
              <nav className="space-y-2" aria-labelledby={popularServicesHeadingId}>
                {popularServices?.map((service: PopularService) => (
                  <Link key={service.id} href={`/services/${service.slug}`} className="block text-sm text-muted-foreground hover:text-primary transition-colors">
                    {service.name}
                  </Link>
                ))}
                {isPopularServicesLoading ? (
                  <div
                    className="space-y-2"
                    role="status"
                    aria-live="polite"
                    aria-label={popularServicesLoadingText}
                  >
                    <Skeleton className="h-4 w-3/4 bg-slate-200/70 dark:bg-[#1E2A3D]" aria-hidden="true" />
                    <Skeleton className="h-4 w-2/3 bg-slate-200/70 dark:bg-[#1E2A3D]" aria-hidden="true" />
                    <Skeleton className="h-4 w-4/5 bg-slate-200/70 dark:bg-[#1E2A3D]" aria-hidden="true" />
                  </div>
                ) : null}
                {error ? (
                  <p className="text-sm text-muted-foreground" role="alert">
                    {popularServicesUnavailableText}
                  </p>
                ) : null}
              </nav>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold" id={contactHeadingId}>{contactTitleText}</h2>
              <div className="space-y-2" aria-labelledby={contactHeadingId}>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <a href="mailto:contact@trustora.ro" className="hover:text-primary transition-colors">
                    contact@trustora.ro
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
                <h3 className="text-sm font-medium" id={newsletterHeadingId}>{newsletterTitleText}</h3>
                <form className="flex space-x-2" aria-labelledby={newsletterHeadingId}>
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
