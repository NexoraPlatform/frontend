"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {usePathname, useRouter} from 'next/navigation';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Moon, Sun, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/auth-context';
import { SearchBar } from '@/components/search-bar';
import Image from 'next/image';
import {cn} from "@/lib/utils";
import dynamic from 'next/dynamic';
import { Locale } from '@/types/locale';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import {t} from "@/lib/i18n";
import {Can} from "@/components/Can";
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
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();
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

    const servicesText    = useAsyncTranslation(locale, 'navigation.services');
    const projectsText    = useAsyncTranslation(locale, 'navigation.projects');
    const aboutText       = useAsyncTranslation(locale, 'navigation.about');
    const helpText        = useAsyncTranslation(locale, 'navigation.help');
    const contactText     = useAsyncTranslation(locale, 'navigation.contact');
    const dashboardText   = useAsyncTranslation(locale, 'navigation.dashboard');
    const editProfileText = useAsyncTranslation(locale, 'navigation.edit_profile');
    const adminPanelText  = useAsyncTranslation(locale, 'navigation.admin_panel');
    const logoutText      = useAsyncTranslation(locale, 'navigation.logout');
    const loginText       = useAsyncTranslation(locale, 'navigation.login');
    const registerText    = useAsyncTranslation(locale, 'navigation.register');

  const navigation = [
      { name: homeText,     href: '/' },
      { name: servicesText, href: '/services' },
      { name: projectsText, href: '/projects' },
      { name: aboutText,    href: '/about' },
      { name: helpText,     href: '/help' },
      { name: contactText,  href: '/contact' },
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

  return (
      <header
          className={`sticky top-0 z-50 w-full transition-all duration-500 ${
              isScrolled
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
          <div className="flex h-20 items-center justify-between">
            <Link
                href={`/${locale}`}
                className="flex items-center space-x-4 group"
                aria-label={`Nexora - ${homeText}`}
            >
              <div className="relative w-12 h-12 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                <div className="absolute inset-0 bg-gradient-to-br from-[#1BC47D] to-[#0B1C2D] rounded-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <picture>
                  <source
                      type="image/avif"
                      srcSet="/trustora-logo-60.avif 1x, /trustora-logo-120.avif 2x"
                      className="dark:hidden relative z-10 rounded-xl h-13 w-auto"
                  />
                  <source
                      type="image/webp"
                      srcSet="/trustora-logo-60.webp 1x, /trustora-logo-120.webp 2x"
                      className="dark:hidden relative z-10 rounded-xl h-13 w-auto"
                  />
                  <Image
                      src="/trustora-logo-60.webp"
                      alt="Trustora Logo"
                      width={60}
                      height={75}
                      className="dark:hidden relative z-10 rounded-xl h-13 w-auto"
                      decoding="async"
                      priority
                  />
                </picture>

                <picture>
                  <source
                      type="image/avif"
                      srcSet="/trustora-logo-white-60.avif 1x, /trustora-logo-white-120.avif 2x"
                      className="hidden dark:block relative z-10 rounded-xl h-13 w-auto"
                  />
                  <source
                      type="image/webp"
                      srcSet="/trustora-logo-white-60.webp 1x, /trustora-logo-white.webp 2x"
                      className="hidden dark:block relative z-10 rounded-xl h-13 w-auto"
                  />
                  <Image
                      src="/trustora-logo-white-60.webp"
                      alt="Trustora Logo"
                      width={60}
                      height={75}
                      className="hidden dark:block relative z-10 rounded-xl h-13 w-auto"
                      loading="lazy"
                      decoding="async"
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
            </Link>

            <nav
                className="hidden lg:flex items-center space-x-8"
                role="navigation"
                aria-label={mainNavigationText}
            >
              {navigation.map((item, index) => (
                  <Link
                      key={index}
                      href={`/` + locale + item.href}
                      className={cn(
                          'text-sm font-medium transition-colors hover:text-primary relative',
                          pathname === item.href
                              ? 'text-primary'
                              : 'text-muted-foreground'
                      )}
                      aria-label={`${navigateToText} + ' ' + ${item.name}`}
                  >
                    {item.name}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#1BC47D] to-[#0B1C2D] transition-all duration-300 group-hover:w-full rounded-full"></span>
                    <span className="absolute inset-0 bg-emerald-50/70 dark:bg-emerald-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></span>
                  </Link>
              ))}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-3">
              {user && (
                  <>
                    {/* Notifications */}
                    <NotificationBell />

                    {/* Messages */}
                    <ChatButton />
                  </>
              )}

              {/* Theme Toggle */}
              <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="w-11 h-11 hover:bg-emerald-50/70 dark:hover:bg-emerald-500/10 rounded-xl transition-all duration-200 hover:scale-105"
                  aria-label={`${changeThemeToText} ${theme === 'dark' ? lightText : darkText}`}
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>

              <LocaleSwitcher className="hidden lg:block" currentLocale={locale} />

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
                        <Link href={`/${locale}/dashboard`}>{dashboardText}</Link>
                      </DropdownMenuItem>
                      <Can {...({ superuser: true } || { roles: ['provider'] })}>
                          <DropdownMenuItem asChild>
                            <Link href={`/${locale}/provider/profile`}>{editProfileText}</Link>
                          </DropdownMenuItem>
                      </Can>
                      <Can {...({ superuser: true } || { roles: ['admin'] })}>
                          <DropdownMenuItem asChild>
                            <Link href={`/${locale}/admin`}>{adminPanelText}</Link>
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
                      <Link href={`/${locale}/auth/signin`}>{loginText}</Link>
                    </Button>
                    <Button className="bg-gradient-to-r from-[#1BC47D] to-[#21D19F] hover:from-[#17b672] hover:to-[#1bbd8c] text-[#071A12] rounded-xl px-6 py-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105" asChild>
                      <Link href={`/${locale}/auth/signup`}>{registerText}</Link>
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
                        <Link
                            key={index}
                            href={locale + item.href}
                            className="text-lg font-semibold hover:text-emerald-700 transition-colors py-3 border-b border-border/50 hover:border-emerald-200 dark:hover:border-emerald-500/40 rounded-lg hover:bg-emerald-50/70 dark:hover:bg-emerald-500/10 px-4"
                            onClick={() => setIsOpen(false)}
                        >
                          {item.name}
                        </Link>
                    ))}
                    {!user && (
                        <div className="flex flex-col space-y-4 pt-6">
                          <Button variant="outline" aria-label="Butonul de conectare" className="w-full border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50/70 dark:border-emerald-500/40 dark:text-emerald-200 dark:hover:bg-emerald-500/10 rounded-xl py-3 font-semibold" asChild>
                            <Link href={`/${locale}/auth/signin`}>{loginText}</Link>
                          </Button>
                          <Button aria-label="Buton de inregistrare" className="w-full bg-gradient-to-r from-[#1BC47D] to-[#21D19F] hover:from-[#17b672] hover:to-[#1bbd8c] text-[#071A12] rounded-xl py-3 font-semibold shadow-lg" asChild>
                            <Link href={`/${locale}/auth/signup`}>{registerText}</Link>
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
      </header>
  );
}
