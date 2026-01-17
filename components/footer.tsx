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
          <div className="grid gap-8">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold" id="contact-heading">Contact</h2>
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
                  <span>București, România</span>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium" id="newsletter-heading">Newsletter</h3>
                <form className="flex flex-col gap-2 sm:flex-row sm:items-center" aria-labelledby="newsletter-heading">
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

          <div className="border-t mt-8 pt-8 text-center" role="contentinfo">
            <p className="text-sm text-muted-foreground">
              © 2024 Trustora. {allRightsReservedText}.
            </p>
          </div>
        </div>
      </footer>
  );
}
