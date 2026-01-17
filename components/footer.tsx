"use client";

import { Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from "@/contexts/auth-context";
import dynamic from 'next/dynamic';
import { useAsyncTranslation } from "@/hooks/use-async-translation";
import { usePathname } from 'next/navigation';
import { Locale } from "@/types/locale";

const ChatLauncher = dynamic(() => import('@/components/chat/chat-launcher'), {
  ssr: false,
  loading: () => null
});

export function Footer() {
  const { user } = useAuth();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] as Locale || 'ro';
  const footerInfoText = useAsyncTranslation(locale, "common.footer_info")
  const emailForNewsletterText = useAsyncTranslation(locale, "common.newsletter_email_address");
  const yourEmailText = useAsyncTranslation(locale, "common.your_email");
  const subscribeToNewsletterText = useAsyncTranslation(locale, "common.subscribe_to_newsletter");
  const subscribeText = useAsyncTranslation(locale, "common.subscribe");
  const allRightsReservedText = useAsyncTranslation(locale, "common.all_rights_reserved");

  return (
      <footer
          className="border-t"
          role="contentinfo"
          aria-label={footerInfoText}
      >
        {user && (<ChatLauncher />)}
        <div className="container mx-auto px-4 !py-12">
          <div className="rounded-3xl border border-slate-200/60 bg-white/70 p-8 shadow-xl backdrop-blur dark:border-[#1E2A3D] dark:bg-[#0B1220]/70">
            <div className="grid gap-10 md:grid-cols-2 md:items-start">
              <div className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold" id="contact-heading">Contact</h2>
                  <p className="text-sm text-muted-foreground">
                    Suntem aici dacă ai nevoie de ajutor sau informații suplimentare.
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
                    <span className="font-medium">București, România</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold" id="newsletter-heading">Newsletter</h3>
                  <p className="text-sm text-muted-foreground">
                    Primești update-uri despre Trustora și acces la noutăți.
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
              </div>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center" role="contentinfo">
            <p className="text-sm text-muted-foreground">
              © 2024 Trustora. {allRightsReservedText}.
            </p>
          </div>
        </div>
      </footer>
  );
}
