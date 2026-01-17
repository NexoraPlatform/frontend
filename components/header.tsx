"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { LocalizedLink } from '@/components/LocalizedLink';
import { useLocalizedRouter } from '@/hooks/use-localized-router';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Moon, Sun, LogOut, Mail, Phone, MapPin } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/auth-context';
import { SearchBar } from '@/components/search-bar';
import Image from 'next/image';
import { cn } from "@/lib/utils";
import dynamic from 'next/dynamic';
import { Locale } from '@/types/locale';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { t } from "@/lib/i18n";
import { Can } from "@/components/Can";
import { useAsyncTranslation } from '@/hooks/use-async-translation';

const NotificationBell = dynamic(
  () => import('@/components/notification-bell').then((mod) => mod.NotificationBell),
  {
    ssr: false,
    loading: () => (
      <Button
        variant="ghost"
        size="icon"
        className="w-11 h-11 hover:bg-emerald-50/70 dark:hover:bg-emerald-500/10 rounded-xl"
        aria-label="Notificări"
      >
        <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
      </Button>
    )
  }
);

const ChatButton = dynamic(
  () => import('@/components/chat/chat-button').then((mod) => mod.ChatButton),
  {
    ssr: false,
    loading: () => (
      <Button
        variant="ghost"
        size="icon"
        className="w-11 h-11 hover:bg-emerald-50/70 dark:hover:bg-emerald-500/10 rounded-xl"
        aria-label="Mesaje"
      >
        <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
      </Button>
    )
  }
);

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const earlyAccessEnabled = process.env.NEXT_PUBLIC_EARLY_ACCESS_FUNNEL === 'true';
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const router = useLocalizedRouter();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const locale = pathname.split('/')[1] as Locale || 'ro';
  const homeText = useAsyncTranslation(locale, 'navigation.home');
  const skipToContentText = useAsyncTranslation(locale, 'common.skip_to_content')
  const navigateToText = useAsyncTranslation(locale, 'navigation.navigate_to');
  const mainNavigationText = useAsyncTranslation(locale, 'navigation.main_navigation');
  const changeThemeToText = useAsyncTranslation(locale, 'navigation.change_theme');
  const darkText = useAsyncTranslation(locale, 'navigation.dark');
  const lightText = useAsyncTranslation(locale, 'navigation.light');
  const openMainUserMenuText = useAsyncTranslation(locale, 'navigation.open_main_user_menu');
  const earlyAccessClientCta = useAsyncTranslation(locale, 'trustora.early_access.header.client_cta', 'Înregistrare ca client');
  const earlyAccessProviderCta = useAsyncTranslation(locale, 'trustora.early_access.header.provider_cta', 'Înregistrare ca prestator');
  const earlyAccessMenuAria = useAsyncTranslation(locale, 'trustora.early_access.header.mobile_menu_aria', 'Meniul principal pe mobil');
  const earlyAccessMenuTitle = useAsyncTranslation(locale, 'trustora.early_access.header.mobile_menu_title', 'Meniu înscriere early access');
  const earlyAccessMenuLabel = useAsyncTranslation(locale, 'trustora.early_access.header.mobile_menu_label', 'Meniu');
  const earlyAccessMenuDescription = useAsyncTranslation(
    locale,
    'trustora.early_access.header.mobile_menu_description',
    'Alege tipul de cont pentru înscriere în early access.',
  );
  const earlyAccessMenuSrDescription = useAsyncTranslation(
    locale,
    'trustora.early_access.header.mobile_menu_sr_description',
    'Alege tipul de cont pentru înscriere în early access și accesează detaliile de contact Trustora.',
  );
  const earlyAccessContactLabel = useAsyncTranslation(locale, 'trustora.early_access.header.contact_label', 'Date de contact');
  const earlyAccessContactTag = useAsyncTranslation(locale, 'trustora.early_access.header.contact_tag', 'Trustora');

  const servicesText = useAsyncTranslation(locale, 'navigation.services');
  const projectsText = useAsyncTranslation(locale, 'navigation.projects');
  const aboutText = useAsyncTranslation(locale, 'navigation.about');
  const helpText = useAsyncTranslation(locale, 'navigation.help');
  const contactText = useAsyncTranslation(locale, 'navigation.contact');
  const dashboardText = useAsyncTranslation(locale, 'navigation.dashboard');
  const editProfileText = useAsyncTranslation(locale, 'navigation.edit_profile');
  const adminPanelText = useAsyncTranslation(locale, 'navigation.admin_panel');
  const logoutText = useAsyncTranslation(locale, 'navigation.logout');
  const loginText = useAsyncTranslation(locale, 'navigation.login');
  const registerText = useAsyncTranslation(locale, 'navigation.register');

  const navigation = [
    { name: homeText, href: '/' },
    { name: servicesText, href: '/services' },
    { name: projectsText, href: '/projects' },
    { name: aboutText, href: '/about' },
    { name: helpText, href: '/help' },
    { name: contactText, href: '/contact' },
  ];


  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!mounted) {
    return null;
  }

  if (earlyAccessEnabled) {
    return (
      <header
        className={`sticky top-[-1px] z-50 w-full transition-all duration-500 ${isScrolled
          ? 'glass-effect border-b shadow-2xl backdrop-blur-xl'
          : 'bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 border-b border-border/50'
          }`}
        role="banner"
        aria-label={mainNavigationText}
      >
        <a
          href="#main-content"
          className="skip-link focus-visible:focus-visible"
          aria-label={skipToContentText}
        >
          {skipToContentText}
        </a>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between gap-3 py-3 sm:h-20 sm:py-0">
            <LocalizedLink
              href="/"
              className="flex items-center space-x-4 group"
              aria-label={`Trustora - ${homeText}`}
            >
              <div className="relative w-12 h-12 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                <div className="absolute inset-0 rounded-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <picture>
                  <source
                    type="image/avif"
                    srcSet="/trustora-logo2-60.avif 1x, /trustora-logo2-120.avif 2x"
                    className="relative z-10 rounded-xl h-13 w-auto"
                  />
                  <source
                    type="image/webp"
                    srcSet="/trustora-logo2-60.webp 1x, /trustora-logo2-120.webp 2x"
                    className="relative z-10 rounded-xl h-13 w-auto"
                  />
                  <Image
                    src="/trustora-logo2-60.webp"
                    alt="Trustora Logo"
                    width={60}
                    height={75}
                    className="relative z-10 rounded-xl h-13 w-auto"
                    decoding="async"
                    priority
                  />
                </picture>

              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black bg-gradient-to-r from-[#1BC47D] via-[#21D19F] to-[#0B1C2D] bg-clip-text text-transparent">
                  Trustora
                </span>
                <span className="text-xs text-muted-foreground font-medium -mt-1">
                  Where work meets trust.
                </span>
              </div>
            </LocalizedLink>

            <div className="flex items-center gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <LocaleSwitcher className="w-fit" currentLocale={locale} />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-11 h-11 hover:text-[#0B1C2D] dark:bg-[#0B1220] dark:text-white dark:hover:bg-emerald-500/10 dark:hover:text-white rounded-xl transition-all duration-200 hover:scale-105"
                aria-label={`${changeThemeToText} ${theme === 'dark' ? lightText : darkText}`}
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
              <div className="hidden sm:flex sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                <Button
                  className="w-full rounded-xl border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50/70 hover:border-emerald-300 dark:border-emerald-500/40 dark:text-emerald-200 dark:hover:bg-emerald-500/10 dark:hover:border-emerald-500/60 sm:w-auto"
                  variant="outline"
                  asChild
                >
                  <LocalizedLink href="/early-access/client">{earlyAccessClientCta}</LocalizedLink>
                </Button>
                <Button className="w-full btn-primary text-white sm:w-auto" asChild>
                  <LocalizedLink href="/early-access/provider">{earlyAccessProviderCta}</LocalizedLink>
                </Button>
              </div>
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    aria-label={earlyAccessMenuAria}
                    variant="ghost"
                    size="icon"
                    className="sm:hidden w-11 h-11 hover:bg-emerald-50/70 dark:hover:bg-emerald-500/10 rounded-xl"
                  >
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 glass-effect border-l-2 border-emerald-200 dark:border-emerald-500/40">
                  <SheetTitle className="sr-only">{earlyAccessMenuTitle}</SheetTitle>
                  <SheetDescription className="sr-only">
                    {earlyAccessMenuSrDescription}
                  </SheetDescription>
                  <div className="mt-8 flex flex-col space-y-6">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500">{earlyAccessMenuLabel}</p>
                      <p className="text-sm text-muted-foreground">
                        {earlyAccessMenuDescription}
                      </p>
                    </div>
                    <Button
                      className="w-full rounded-xl border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50/70 hover:border-emerald-300 dark:border-emerald-500/40 dark:text-emerald-200 dark:hover:bg-emerald-500/10 dark:hover:border-emerald-500/60"
                      variant="outline"
                      asChild
                    >
                      <LocalizedLink href="/early-access/client">{earlyAccessClientCta}</LocalizedLink>
                    </Button>
                    <Button className="w-full btn-primary text-white" asChild>
                      <LocalizedLink href="/early-access/provider">{earlyAccessProviderCta}</LocalizedLink>
                    </Button>
                    <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/80 p-4 text-xs text-emerald-950 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">
                          {earlyAccessContactLabel}
                        </p>
                        <span className="text-[10px] font-medium text-emerald-500/80 dark:text-emerald-200/80">
                          {earlyAccessContactTag}
                        </span>
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2 rounded-xl border border-emerald-200/70 bg-white/70 px-3 py-2 text-[11px] text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
                          <Mail className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300" />
                          <a
                            href="mailto:contact@Trustora.ro"
                            className="font-medium underline decoration-emerald-400/60 underline-offset-4"
                          >
                            contact@Trustora.ro
                          </a>
                        </div>
                        <div className="flex items-center gap-2 rounded-xl border border-emerald-200/70 bg-white/70 px-3 py-2 text-[11px] text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
                          <Phone className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300" />
                          <a
                            href="tel:+40123456789"
                            className="font-medium underline decoration-emerald-400/60 underline-offset-4"
                          >
                            +40 123 456 789
                          </a>
                        </div>
                        <div className="flex items-center gap-2 rounded-xl border border-emerald-200/70 bg-white/70 px-3 py-2 text-[11px] text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
                          <MapPin className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300" />
                          <span className="font-medium">București, România</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      className={`sticky top-[-1px] z-50 w-full transition-all duration-500 ${isScrolled
        ? 'glass-effect border-b shadow-2xl backdrop-blur-xl'
        : 'bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 border-b border-border/50'
        }`}
      role="banner"
      aria-label={mainNavigationText}
    >
      <a
        href="#main-content"
        className="skip-link focus-visible:focus-visible"
        aria-label={skipToContentText}
      >
        {skipToContentText}
      </a>

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between gap-3 py-3 sm:h-20 sm:py-0">
          <LocalizedLink
            href="/"
            className="flex items-center space-x-4 group"
            aria-label={`Trustora - ${homeText}`}
          >
            <div className="relative w-12 h-12 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
              <div className="absolute inset-0 rounded-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <picture>
                <source
                  type="image/avif"
                  srcSet="/trustora-logo2-60.avif 1x, /trustora-logo2-120.avif 2x"
                  className="relative z-10 rounded-xl h-13 w-auto"
                />
                <source
                  type="image/webp"
                  srcSet="/trustora-logo2-60.webp 1x, /trustora-logo2-120.webp 2x"
                  className="relative z-10 rounded-xl h-13 w-auto"
                />
                <Image
                  src="/trustora-logo2-60.webp"
                  alt="Trustora Logo"
                  width={60}
                  height={75}
                  className="relative z-10 rounded-xl h-13 w-auto"
                  decoding="async"
                  priority
                />
              </picture>

            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black bg-gradient-to-r from-[#1BC47D] via-[#21D19F] to-[#0B1C2D] bg-clip-text text-transparent">
                Trustora
              </span>
              <span className="text-xs text-muted-foreground font-medium -mt-1">
                Where work meets trust.
              </span>
            </div>
          </LocalizedLink>

          <nav
            className="hidden lg:flex items-center space-x-8"
            role="navigation"
            aria-label={mainNavigationText}
          >
            {navigation.map((item, index) => (
              <LocalizedLink
                key={index}
                href={item.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary relative',
                  pathname === `/${locale}${item.href}` || pathname === item.href
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
                aria-label={`${navigateToText} + ' ' + ${item.name}`}
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#1BC47D] to-[#0B1C2D] transition-all duration-300 group-hover:w-full rounded-full"></span>
                <span className="absolute inset-0 bg-emerald-50/70 dark:bg-emerald-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></span>
              </LocalizedLink>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {user && (
              <>
                {/* Notifications */}
                <NotificationBell />

                {/* Messages */}
                <ChatButton />
              </>
            )}

            <LocaleSwitcher className="hidden lg:block" currentLocale={locale} />

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="w-11 h-11 hover:text-[#0B1C2D] dark:bg-[#0B1220] dark:text-white dark:hover:bg-emerald-500/10 dark:hover:text-white rounded-xl transition-all duration-200 hover:scale-105"
              aria-label={`${changeThemeToText} ${theme === 'dark' ? lightText : darkText}`}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {/* User Menu or Auth Buttons */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-11 w-11 rounded-xl" aria-label={openMainUserMenuText}>
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={user.avatar} alt={user.firstName} />
                      <AvatarFallback>
                        {user.firstName[0]}{user.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none">{user.firstName} {user.lastName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <LocalizedLink href="/dashboard">{dashboardText}</LocalizedLink>
                  </DropdownMenuItem>
                  <Can roles={['provider']}>
                    <DropdownMenuItem asChild>
                      <LocalizedLink href="/provider/profile">{editProfileText}</LocalizedLink>
                    </DropdownMenuItem>
                  </Can>
                  <Can roles={['admin']}>
                    <DropdownMenuItem asChild>
                      <LocalizedLink href="/admin">{adminPanelText}</LocalizedLink>
                    </DropdownMenuItem>
                  </Can>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{logoutText}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex items-center space-x-3">
                <Button variant="outline" aria-label="Deschide meniul principal" className="border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50/70 hover:border-emerald-300 dark:border-emerald-500/40 dark:text-emerald-200 dark:hover:bg-emerald-500/10 dark:hover:border-emerald-500/60 rounded-xl px-6 py-2 font-semibold transition-all duration-200 hover:scale-105" asChild>
                  <LocalizedLink href="/auth/signin">{loginText}</LocalizedLink>
                </Button>
                <Button className="bg-gradient-to-r from-[#1BC47D] to-[#21D19F] hover:from-[#17b672] hover:to-[#1bbd8c] text-[#071A12] rounded-xl px-6 py-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105" asChild>
                  <LocalizedLink href="/auth/signup">{registerText}</LocalizedLink>
                </Button>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button aria-label="Meniul principal pe mobil" variant="ghost" size="icon" className="lg:hidden w-11 h-11 hover:bg-emerald-50/70 dark:hover:bg-emerald-500/10 rounded-xl">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 glass-effect border-l-2 border-emerald-200 dark:border-emerald-500/40">
                <div className="flex flex-col space-y-6 mt-8">
                  <SearchBar className="lg:hidden" />
                  {navigation.map((item, index) => (
                    <LocalizedLink
                      key={index}
                      href={item.href}
                      className="text-lg font-semibold hover:text-emerald-700 transition-colors py-3 border-b border-border/50 hover:border-emerald-200 dark:hover:border-emerald-500/40 rounded-lg hover:bg-emerald-50/70 dark:hover:bg-emerald-500/10 px-4"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.name}
                    </LocalizedLink>
                  ))}
                  {!user && (
                    <div className="flex flex-col space-y-4 pt-6">
                      <Button variant="outline" aria-label="Butonul de conectare" className="w-full border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50/70 dark:border-emerald-500/40 dark:text-emerald-200 dark:hover:bg-emerald-500/10 rounded-xl py-3 font-semibold" asChild>
                        <LocalizedLink href="/auth/signin">{loginText}</LocalizedLink>
                      </Button>
                      <Button aria-label="Buton de inregistrare" className="w-full bg-gradient-to-r from-[#1BC47D] to-[#21D19F] hover:from-[#17b672] hover:to-[#1bbd8c] text-[#071A12] rounded-xl py-3 font-semibold shadow-lg" asChild>
                        <LocalizedLink href="/auth/signup">{registerText}</LocalizedLink>
                      </Button>
                    </div>
                  )}
                  <LocaleSwitcher currentLocale={locale} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header >
  );
}
