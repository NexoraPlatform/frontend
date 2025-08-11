"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {usePathname, useRouter} from 'next/navigation';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Moon, Sun, User, Bell, MessageSquare, LogOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/auth-context';
import { SearchBar } from '@/components/search-bar';
import Image from 'next/image';
import { NotificationBell } from '@/components/notification-bell';
import { ChatButton } from '@/components/chat/chat-button';
import {cn} from "@/lib/utils";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const navigation = [
    { name: 'Acasă', href: '/' },
    { name: 'Servicii', href: '/services' },
    { name: 'Proiecte', href: '/projects' },
    { name: 'Despre', href: '/about' },
    { name: 'Ajutor', href: '/help' },
    { name: 'Contact', href: '/contact' },
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
          aria-label="Navigare principală"
      >
        {/* Skip to main content link for accessibility */}
        <a
            href="#main-content"
            className="skip-link focus-visible:focus-visible"
            aria-label="Sari la conținutul principal"
        >
          Sari la conținut
        </a>

        <div className="container mx-auto px-4">
          <div className="flex h-20 items-center justify-between">
            {/* Logo */}
            <Link
                href="/"
                className="flex items-center space-x-4 group"
                aria-label="Nexora - Acasă"
            >
              <div className="relative w-12 h-12 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <Image
                    src="/logo.png"
                    alt="Nexora Logo"
                    width={140}
                    height={175}
                    className="dark:hidden relative z-10 rounded-xl h-13 w-auto"
                    priority
                    loading="eager"
                />
                <Image
                    src="/logo-white.png"
                    alt="Nexora Logo"
                    width={140}
                    height={175}
                    className="hidden dark:block relative z-10 rounded-xl h-13 w-auto"
                    priority
                    loading="eager"
                />
              </div>
              <div className="flex flex-col">
              <span className="text-2xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Nexora
              </span>
                <span className="text-xs text-muted-foreground font-medium -mt-1">
                IT Marketplace
              </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav
                className="hidden lg:flex items-center space-x-8"
                role="navigation"
                aria-label="Navigare principală"
            >
              {navigation.map((item) => (
                  <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                          'text-sm font-medium transition-colors hover:text-primary relative',
                          pathname === item.href
                              ? 'text-primary'
                              : 'text-muted-foreground'
                      )}
                      aria-label={`Navighează la ${item.name}`}
                  >
                    {item.name}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300 group-hover:w-full rounded-full"></span>
                    <span className="absolute inset-0 bg-blue-50 dark:bg-blue-950/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></span>
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
                  className="w-11 h-11 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-xl transition-all duration-200 hover:scale-105"
                  aria-label={`Schimbă la tema ${theme === 'dark' ? 'deschisă' : 'întunecată'}`}
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>

              {/* User Menu or Auth Buttons */}
              {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-11 w-11 rounded-xl" aria-label="Deschide meniul principal al utilizatorului">
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
                        <Link href="/dashboard">Dashboard</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard">Profil</Link>
                      </DropdownMenuItem>
                      {user.role === 'PROVIDER' && (
                          <DropdownMenuItem asChild>
                            <Link href="/provider/profile">Editează Profil</Link>
                          </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link href="/settings">Setări</Link>
                      </DropdownMenuItem>
                      {user.role === 'ADMIN' && (
                          <DropdownMenuItem asChild>
                            <Link href="/admin">Admin Panel</Link>
                          </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Deconectare</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
              ) : (
                  <div className="hidden md:flex items-center space-x-3">
                    <Button variant="outline" aria-label="Deschide meniul principal" className="border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950 dark:hover:border-blue-700 rounded-xl px-6 py-2 font-semibold transition-all duration-200 hover:scale-105" asChild>
                      <Link href="/auth/signin">Conectează-te</Link>
                    </Button>
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl px-6 py-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105" asChild>
                      <Link href="/auth/signup">Înregistrează-te</Link>
                    </Button>
                  </div>
              )}

              {/* Mobile Menu */}
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button aria-label="Meniul principal pe mobil" variant="ghost" size="icon" className="lg:hidden w-11 h-11 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-xl">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 glass-effect border-l-2 border-blue-200 dark:border-blue-800">
                  <div className="flex flex-col space-y-6 mt-8">
                    <SearchBar className="lg:hidden" />
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="text-lg font-semibold hover:text-blue-600 transition-colors py-3 border-b border-border/50 hover:border-blue-200 dark:hover:border-blue-800 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 px-4"
                            onClick={() => setIsOpen(false)}
                        >
                          {item.name}
                        </Link>
                    ))}
                    {!user && (
                        <div className="flex flex-col space-y-4 pt-6">
                          <Button variant="outline" aria-label="Butonul de conectare" className="w-full border-2 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950 rounded-xl py-3 font-semibold" asChild>
                            <Link href="/auth/signin">Conectează-te</Link>
                          </Button>
                          <Button aria-label="Buton de inregistrare" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl py-3 font-semibold shadow-lg" asChild>
                            <Link href="/auth/signup">Înregistrează-te</Link>
                          </Button>
                        </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
  );
}
